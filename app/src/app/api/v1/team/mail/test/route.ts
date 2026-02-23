/**
 * Admin API: Send Test Email to Self
 *
 * POST /api/v1/team/mail/test — Send a test version of the campaign to the admin's email
 *
 * Uses the admin's own email address and person record for personalization.
 * Subject is prefixed with [TEST]. No campaign_id tag (not tracked as a real send).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'
import { renderCampaignEmail, renderCampaignEmailText } from '@/app/api/_lib/campaign-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Rijksuitgaven.nl <contact@rijksuitgaven.nl>'

interface TestRequest {
  subject: string
  heading: string
  preheader?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  email?: string
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Resend niet geconfigureerd' }, { status: 500 })
  }

  // Parse body
  let params: TestRequest
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    params = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, preheader, body, ctaText, ctaUrl, email: customEmail } = params

  if (!subject?.trim() || !heading?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Verplichte velden: subject, heading, body' }, { status: 400 })
  }

  // Validate custom email if provided
  if (customEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
  }

  // Get admin's email from session (used as default and for person lookup)
  const sessionClient = await createClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Geen sessie gevonden' }, { status: 401 })
  }

  const adminEmail = customEmail?.trim() || session.user.email

  // Look up person record for first_name + unsubscribe_token
  const supabase = createAdminClient()
  const { data: person } = await supabase
    .from('people')
    .select('first_name, unsubscribe_token')
    .eq('email', adminEmail)
    .single()

  // Build unsubscribe URL (placeholder for test)
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'beta.rijksuitgaven.nl'
  const baseUrl = `${proto}://${hostHeader}`
  const unsubscribeUrl = person?.unsubscribe_token
    ? `${baseUrl}/afmelden?token=${person.unsubscribe_token}`
    : '#afmelden'

  // Render email with [TEST] prefix
  const html = renderCampaignEmail({
    subject: `[TEST] ${subject.trim()}`,
    heading: heading.trim(),
    preheader: preheader?.trim() || undefined,
    body: body.trim(),
    ctaText: ctaText?.trim() || undefined,
    ctaUrl: ctaUrl?.trim() || undefined,
    firstName: person?.first_name || undefined,
    unsubscribeUrl,
  })

  // Send single email (NOT batch, NO campaign_id tag)
  const resend = new Resend(RESEND_API_KEY)
  const textParams = {
    subject: `[TEST] ${subject.trim()}`,
    heading: heading.trim(),
    preheader: preheader?.trim() || undefined,
    body: body.trim(),
    ctaText: ctaText?.trim() || undefined,
    ctaUrl: ctaUrl?.trim() || undefined,
    firstName: person?.first_name || undefined,
    unsubscribeUrl,
  }
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: 'contact@rijksuitgaven.nl',
    to: adminEmail,
    subject: `[TEST] ${subject.trim()}`,
    html,
    text: renderCampaignEmailText(textParams),
  })

  if (sendError) {
    console.error('[Test Email] Send error:', sendError)
    return NextResponse.json({ error: 'Fout bij versturen test e-mail' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: adminEmail })
}
