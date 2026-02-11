/**
 * Feedback API
 *
 * POST /api/v1/feedback — Send user feedback with optional screenshot via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FEEDBACK_TO = 'contact@rijksuitgaven.nl'
const FEEDBACK_FROM = 'Rijksuitgaven Feedback <noreply@rijksuitgaven.nl>'

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  // Parse body (limit size: 10MB for screenshot)
  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 10_000_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { message, screenshot, pageUrl, userAgent } = body as {
    message?: string
    screenshot?: string
    pageUrl?: string
    userAgent?: string
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Bericht is verplicht' }, { status: 400 })
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Bericht is te lang (max 5000 tekens)' }, { status: 400 })
  }

  // Validate screenshot is a data URL if provided
  if (screenshot && (typeof screenshot !== 'string' || !screenshot.startsWith('data:image/png;base64,'))) {
    return NextResponse.json({ error: 'Ongeldig screenshot formaat' }, { status: 400 })
  }

  if (!RESEND_API_KEY) {
    console.error('[Feedback] RESEND_API_KEY not configured')
    return NextResponse.json({ error: 'E-mail service niet geconfigureerd' }, { status: 500 })
  }

  const resend = new Resend(RESEND_API_KEY)
  const userEmail = session.user.email || 'onbekend'
  const timestamp = new Date().toISOString()
  const subjectPreview = message.trim().slice(0, 50)

  // Build email HTML
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
      <h2 style="color: #0E3261; margin-bottom: 16px;">Feedback van ${userEmail}</h2>

      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message.trim())}</p>
      </div>

      ${screenshot ? '<p style="color: #666; font-size: 13px;">📎 Schermafbeelding bijgevoegd</p>' : ''}

      <table style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
        <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Pagina</td><td>${escapeHtml(pageUrl || 'onbekend')}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Browser</td><td>${escapeHtml(userAgent || 'onbekend')}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Tijdstip</td><td>${timestamp}</td></tr>
      </table>
    </div>
  `

  // Build attachments
  const attachments = screenshot
    ? [{
        filename: 'screenshot.png',
        content: screenshot.replace('data:image/png;base64,', ''),
        contentType: 'image/png' as const,
      }]
    : []

  try {
    const { error: sendError } = await resend.emails.send({
      from: FEEDBACK_FROM,
      to: FEEDBACK_TO,
      subject: `Feedback: ${subjectPreview}`,
      html: emailHtml,
      attachments,
    })

    if (sendError) {
      console.error('[Feedback] Resend error:', sendError)
      return NextResponse.json({ error: 'Verzenden mislukt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Feedback] Send error:', err)
    return NextResponse.json({ error: 'Verzenden mislukt' }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
