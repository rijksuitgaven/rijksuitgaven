/**
 * Admin API: Send Campaign Email
 *
 * POST /api/v1/team/mail/send — Compose and send broadcast via Resend Batch API
 *
 * Each recipient gets a personalized email with their first name and
 * a unique unsubscribe URL using their opaque unsubscribe_token.
 *
 * Sends in batches of 100 (Resend limit). Rate-limited with 600ms delay
 * between batches for free plan (2 req/s).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'
import { computeListType, type ListType } from '@/app/api/_lib/resend-audience'
import { renderCampaignEmail } from '@/app/api/_lib/campaign-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Rijksuitgaven.nl <noreply@rijksuitgaven.nl>'
const BATCH_SIZE = 100
const BATCH_DELAY_MS = 600

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

interface SendRequest {
  subject: string
  heading: string
  preheader?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  segment: 'leden' | 'prospects' | 'churned' | 'iedereen'
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend niet geconfigureerd' }, { status: 500 })
  }

  // Parse and validate body
  let params: SendRequest
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    params = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, preheader, body, ctaText, ctaUrl, segment } = params

  if (!subject?.trim() || !heading?.trim() || !body?.trim() || !segment) {
    return NextResponse.json({ error: 'Verplichte velden: subject, heading, body, segment' }, { status: 400 })
  }

  if (!['leden', 'prospects', 'churned', 'iedereen'].includes(segment)) {
    return NextResponse.json({ error: 'Ongeldig segment' }, { status: 400 })
  }

  if (ctaUrl && !/^https?:\/\/.+/.test(ctaUrl)) {
    return NextResponse.json({ error: 'CTA URL moet beginnen met http(s)://' }, { status: 400 })
  }

  // Fetch all people with subscriptions to determine segments
  const supabase = createAdminClient()

  const { data: people, error: fetchError } = await supabase
    .from('people')
    .select('id, email, first_name, unsubscribe_token, archived_at, unsubscribed_at')

  if (fetchError || !people) {
    return NextResponse.json({ error: 'Fout bij ophalen contacten' }, { status: 500 })
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  const subMap = new Map<string, NonNullable<typeof subscriptions>[number]>()
  if (subscriptions) {
    for (const sub of subscriptions) {
      subMap.set(sub.person_id, sub)
    }
  }

  // Filter recipients based on segment, exclude archived/unsubscribed
  const recipients = people.filter(person => {
    if (!person.email || person.archived_at || person.unsubscribed_at) return false
    if (!person.unsubscribe_token) return false

    if (segment === 'iedereen') return true

    const sub = subMap.get(person.id) || null
    const list: ListType = computeListType(sub)
    return list === segment
  })

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'Geen ontvangers in dit segment' }, { status: 400 })
  }

  // Determine base URL for unsubscribe links
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'beta.rijksuitgaven.nl'
  const baseUrl = `${proto}://${hostHeader}`

  // Build per-recipient emails
  const resend = new Resend(RESEND_API_KEY)
  const stats = { sent: 0, failed: 0, total: recipients.length }

  // Process in batches
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    const emails = batch.map(person => {
      const unsubscribeUrl = `${baseUrl}/afmelden?token=${person.unsubscribe_token}`
      const html = renderCampaignEmail({
        subject,
        heading,
        preheader: preheader || undefined,
        body,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        firstName: person.first_name || undefined,
        unsubscribeUrl,
      })

      return {
        from: FROM_EMAIL,
        to: [person.email!],
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    })

    try {
      const { data, error } = await resend.batch.send(emails)
      if (error) {
        console.error(`[Campaign] Batch ${i / BATCH_SIZE + 1} error:`, error)
        stats.failed += batch.length
      } else {
        stats.sent += data?.data?.length || batch.length
      }
    } catch (err) {
      console.error(`[Campaign] Batch ${i / BATCH_SIZE + 1} exception:`, err)
      stats.failed += batch.length
    }

    // Rate limit delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Save campaign to history
  try {
    const sessionClient = await createClient()
    const { data: { session } } = await sessionClient.auth.getSession()
    await supabase.from('campaigns').insert({
      subject,
      heading,
      preheader: preheader || null,
      body,
      cta_text: ctaText || null,
      cta_url: ctaUrl || null,
      segment,
      sent_count: stats.sent,
      failed_count: stats.failed,
      sent_by: session?.user?.id || null,
    })
  } catch (err) {
    // Non-fatal: campaign was sent, history save failed
    console.error('[Campaign] Failed to save campaign history:', err)
  }

  return NextResponse.json({
    success: true,
    sent: stats.sent,
    failed: stats.failed,
    total: stats.total,
    segment,
  })
}
