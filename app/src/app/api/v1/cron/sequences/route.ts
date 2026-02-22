/**
 * Cron: Process Email Sequences
 *
 * POST /api/v1/cron/sequences — Called hourly on weekdays by Railway cron
 *
 * Schedule: 0 7-16 * * 1-5 (UTC = 08:00-17:00 CET)
 * Auth: CRON_SECRET bearer token
 *
 * Logic:
 * 1. Check weekday in CET
 * 2. Get current CET hour
 * 3. Fetch active sequences where send_time hour = current CET hour
 * 4. For each: fetch active enrollments with pending steps
 * 5. Check delay_days elapsed, skip suppressed people
 * 6. Render + send via Resend, record in email_sequence_sends
 * 7. Advance current_step, complete if all steps done
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { renderCampaignEmail } from '@/app/api/_lib/campaign-template'

const CRON_SECRET = process.env.CRON_SECRET
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Rijksuitgaven.nl <noreply@rijksuitgaven.nl>'
const SEND_DELAY_MS = 600

function getCETDate(): Date {
  // Get current time in CET/CEST
  const now = new Date()
  const cetStr = now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })
  return new Date(cetStr)
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend niet geconfigureerd' }, { status: 500 })
  }

  const cetNow = getCETDate()
  const dayOfWeek = cetNow.getDay() // 0=Sun, 6=Sat
  const currentHour = cetNow.getHours()

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ skipped: true, reason: 'weekend' })
  }

  const supabase = createAdminClient()
  const resend = new Resend(RESEND_API_KEY)

  // Find active sequences whose send_time hour matches current CET hour
  // send_time is stored as TIME (e.g. '09:00')
  const { data: sequences, error: seqError } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('status', 'active')

  if (seqError || !sequences) {
    return NextResponse.json({ error: 'Fout bij ophalen sequenties' }, { status: 500 })
  }

  // Filter sequences by send_time hour matching current hour
  const matchingSequences = sequences.filter(seq => {
    const hour = parseInt(seq.send_time?.split(':')[0] || '9', 10)
    return hour === currentHour
  })

  if (matchingSequences.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, skipped: 0, reason: 'no matching sequences' })
  }

  const stats = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  for (const sequence of matchingSequences) {
    // Get all steps for this sequence ordered by step_order
    const { data: steps } = await supabase
      .from('email_sequence_steps')
      .select('*')
      .eq('sequence_id', sequence.id)
      .order('step_order', { ascending: true })

    if (!steps || steps.length === 0) continue

    // Get active enrollments
    const { data: enrollments } = await supabase
      .from('email_sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequence.id)
      .eq('status', 'active')

    if (!enrollments || enrollments.length === 0) continue

    for (const enrollment of enrollments) {
      stats.processed++

      // Find the next step for this enrollment
      const nextStep = steps.find(s => s.step_order === enrollment.current_step + 1)
      if (!nextStep) {
        // All steps completed — mark enrollment as completed
        await supabase
          .from('email_sequence_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)
        continue
      }

      // Check if delay has elapsed
      const enrolledDate = new Date(enrollment.enrolled_at)
      const today = new Date(cetNow.toISOString().split('T')[0]) // CET midnight
      const daysSinceEnrolled = Math.floor((today.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceEnrolled < nextStep.delay_days) {
        stats.skipped++
        continue
      }

      // Check for existing send (dedup)
      const { data: existingSend } = await supabase
        .from('email_sequence_sends')
        .select('id')
        .eq('enrollment_id', enrollment.id)
        .eq('step_id', nextStep.id)
        .limit(1)

      if (existingSend && existingSend.length > 0) {
        // Already sent this step — advance and continue
        await supabase
          .from('email_sequence_enrollments')
          .update({ current_step: nextStep.step_order })
          .eq('id', enrollment.id)
        stats.skipped++
        continue
      }

      // Get person data (skip suppressed)
      const { data: person } = await supabase
        .from('people')
        .select('id, email, first_name, unsubscribe_token, bounced_at, unsubscribed_at, archived_at')
        .eq('id', enrollment.person_id)
        .single()

      if (!person || !person.email || person.bounced_at || person.unsubscribed_at || person.archived_at) {
        // Cancel enrollment for suppressed person
        await supabase
          .from('email_sequence_enrollments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)
        stats.skipped++
        continue
      }

      // Render email
      const unsubscribeUrl = person.unsubscribe_token
        ? `https://beta.rijksuitgaven.nl/afmelden?token=${person.unsubscribe_token}`
        : 'https://beta.rijksuitgaven.nl/afmelden'

      const html = renderCampaignEmail({
        subject: nextStep.subject,
        heading: nextStep.heading,
        preheader: nextStep.preheader || undefined,
        body: nextStep.body,
        ctaText: nextStep.cta_text || undefined,
        ctaUrl: nextStep.cta_url || undefined,
        firstName: person.first_name || undefined,
        unsubscribeUrl,
      })

      // Send via Resend
      try {
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [person.email],
          subject: nextStep.subject,
          html,
          tags: [
            { name: 'sequence_id', value: sequence.id },
            { name: 'step_id', value: nextStep.id },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        if (sendError) {
          console.error(`[Cron/Sequences] Send error for ${person.email}:`, sendError)
          await supabase.from('email_sequence_sends').insert({
            enrollment_id: enrollment.id,
            step_id: nextStep.id,
            person_id: person.id,
            status: 'failed',
            error_message: sendError.message || 'Unknown error',
          })
          stats.errors++
          continue
        }

        // Record successful send
        await supabase.from('email_sequence_sends').insert({
          enrollment_id: enrollment.id,
          step_id: nextStep.id,
          person_id: person.id,
          resend_email_id: sendData?.id || null,
          status: 'sent',
        })

        // Advance enrollment
        await supabase
          .from('email_sequence_enrollments')
          .update({ current_step: nextStep.step_order })
          .eq('id', enrollment.id)

        stats.sent++

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS))
      } catch (err) {
        console.error(`[Cron/Sequences] Exception sending to ${person.email}:`, err)
        await supabase.from('email_sequence_sends').insert({
          enrollment_id: enrollment.id,
          step_id: nextStep.id,
          person_id: person.id,
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown exception',
        })
        stats.errors++
      }
    }
  }

  return NextResponse.json(stats)
}
