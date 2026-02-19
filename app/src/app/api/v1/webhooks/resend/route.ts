/**
 * Resend Webhook Handler
 *
 * POST /api/v1/webhooks/resend — Receives Resend webhook events
 *
 * Handles:
 * - contact.updated: Sync unsubscribes from Gmail List-Unsubscribe header
 * - email.delivered/opened/clicked/bounced/complained: Campaign engagement tracking
 *
 * Verification: Svix signature (HMAC-SHA256).
 * Required env var: RESEND_WEBHOOK_SECRET (from Resend Dashboard → Webhooks)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

// Email event types we track for campaign analytics
const TRACKED_EMAIL_EVENTS = new Set([
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
])

function verifySignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Svix secret format: "whsec_BASE64"
  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64')
  const toSign = `${svixId}.${svixTimestamp}.${payload}`

  const expectedSig = createHmac('sha256', secretBytes)
    .update(toSign)
    .digest('base64')

  // Svix sends multiple signatures separated by spaces, each prefixed with "v1,"
  const signatures = svixSignature.split(' ')
  return signatures.some(sig => {
    const value = sig.split(',')[1]
    if (!value) return false
    try {
      return timingSafeEqual(
        Buffer.from(expectedSig),
        Buffer.from(value)
      )
    } catch {
      return false
    }
  })
}

interface EmailEventData {
  email_id?: string
  from?: string
  to?: string[]
  subject?: string
  created_at?: string
  tags?: Record<string, string>
  click?: {
    link?: string
    timestamp?: string
  }
  bounce?: {
    message?: string
    type?: string
  }
}

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] Missing RESEND_WEBHOOK_SECRET — skipping verification')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Read headers
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
  }

  // Timestamp validation (reject events older than 5 minutes)
  const now = Math.floor(Date.now() / 1000)
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 })
  }

  // Read body
  const payload = await request.text()
  if (payload.length > 50_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // Verify signature
  if (!verifySignature(payload, svixId, svixTimestamp, svixSignature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse event
  let event: { type: string; created_at?: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Handle contact.updated — sync unsubscribe status
  if (event.type === 'contact.updated' && event.data?.unsubscribed === true) {
    const contactId = event.data.id as string
    if (contactId) {
      try {
        await supabase
          .from('people')
          .update({
            unsubscribed_at: new Date().toISOString(),
            resend_contact_id: null,
          })
          .eq('resend_contact_id', contactId)

        console.log(`[Webhook] Contact ${contactId} unsubscribed via Resend`)
      } catch (err) {
        console.error('[Webhook] DB update error:', err)
      }
    }
  }

  // Handle email events — campaign engagement tracking
  if (TRACKED_EMAIL_EVENTS.has(event.type)) {
    const data = event.data as EmailEventData
    const campaignId = data.tags?.campaign_id
    const recipientEmail = data.to?.[0]
    const resendEmailId = data.email_id

    // Only track if we have a campaign_id tag (our campaigns, not transactional)
    if (campaignId && recipientEmail) {
      try {
        // Strip "email." prefix for storage: "email.opened" → "opened"
        const eventType = event.type.replace('email.', '')

        // Look up person by email
        const { data: person } = await supabase
          .from('people')
          .select('id')
          .eq('email', recipientEmail)
          .single()

        // Determine occurred_at from event-specific fields or top-level
        const occurredAt = data.click?.timestamp || event.created_at || new Date().toISOString()

        await supabase.from('campaign_events').insert({
          campaign_id: campaignId,
          person_id: person?.id || null,
          email: recipientEmail,
          event_type: eventType,
          link_url: data.click?.link || null,
          resend_email_id: resendEmailId || null,
          occurred_at: occurredAt,
        })
      } catch (err) {
        // Likely a duplicate (unique index on resend_email_id + event_type)
        // This is expected for webhook retries — silently ignore
        const message = err instanceof Error ? err.message : String(err)
        if (!message.includes('duplicate') && !message.includes('23505')) {
          console.error('[Webhook] Campaign event insert error:', err)
        }
      }
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true })
}
