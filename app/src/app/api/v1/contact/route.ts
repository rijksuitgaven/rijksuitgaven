/**
 * Public API: Demo Request Form
 *
 * POST /api/v1/contact — Store demo request in people table + send email notification
 * No auth required (public form on homepage)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const CONTACT_TO = 'contact@rijksuitgaven.nl'

export async function POST(request: Request) {
  // Reject oversized bodies (max 2KB)
  const body = await request.text()
  if (body.length > 2048) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }

  let parsed: { firstName?: string; lastName?: string; email?: string; phone?: string }
  try {
    parsed = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firstName, lastName, email, phone } = parsed

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'Voornaam, achternaam en e-mail zijn verplicht' }, { status: 400 })
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
  }

  // Sanitize: trim and limit field lengths
  const safeFirstName = firstName.trim().slice(0, 200)
  const safeLastName = lastName.trim().slice(0, 200)
  const safeEmail = email.trim().slice(0, 200).toLowerCase()
  const safePhone = phone ? phone.trim().slice(0, 50) : null

  // 1. Store in database (primary — always works)
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('people')
    .select('id')
    .eq('email', safeEmail)
    .single()

  if (existing) {
    // Append repeat inquiry note (preserve history)
    const { data: person } = await supabase
      .from('people')
      .select('notes')
      .eq('id', existing.id)
      .single()
    const prevNotes = person?.notes ? `${person.notes}\n` : ''
    await supabase
      .from('people')
      .update({
        first_name: safeFirstName,
        last_name: safeLastName,
        phone: safePhone,
        notes: `${prevNotes}Herhaalde demo aanvraag op ${new Date().toISOString().slice(0, 10)}`,
      })
      .eq('id', existing.id)
  } else {
    // Insert new person
    const { error: insertError } = await supabase
      .from('people')
      .insert({
        email: safeEmail,
        first_name: safeFirstName,
        last_name: safeLastName,
        phone: safePhone,
        source: 'demo_aanvraag',
      })

    if (insertError) {
      console.error('[Contact] DB insert error:', insertError)
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
    }
  }

  // 2. Send email notification (secondary — non-blocking)
  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(RESEND_API_KEY)

      await resend.emails.send({
        from: 'Rijksuitgaven.nl <noreply@rijksuitgaven.nl>',
        to: CONTACT_TO,
        replyTo: safeEmail,
        subject: `Demo aanvraag: ${safeFirstName} ${safeLastName}`,
        text: [
          `Naam: ${safeFirstName} ${safeLastName}`,
          `E-mail: ${safeEmail}`,
          safePhone ? `Telefoon: ${safePhone}` : '',
          '',
          'Via het contactformulier op rijksuitgaven.nl',
          '',
          'Bekijk alle demo aanvragen:',
          'https://rijksuitgaven.nl/team/contacten',
        ].filter(Boolean).join('\n'),
      })
    } catch (err) {
      // Email failure is non-fatal — data is already in database
      console.error('[Contact] Resend email error:', err)
    }
  } else {
    console.warn('[Contact] RESEND_API_KEY not set — email notification skipped')
  }

  return NextResponse.json({ ok: true })
}
