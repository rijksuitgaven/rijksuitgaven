/**
 * Feedback API
 *
 * POST /api/v1/feedback — Store feedback in database + send email notification via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FEEDBACK_TO = 'contact@rijksuitgaven.nl'
const FEEDBACK_FROM = 'Rijksuitgaven Feedback <contact@rijksuitgaven.nl>'

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
  if (origin && host && new URL(origin).host !== host) {
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

  const { category, message, screenshot, element, pageUrl, userAgent } = body as {
    category?: string
    message?: string
    screenshot?: string
    element?: { selector?: string; text?: string; tag?: string; rect?: { x: number; y: number; width: number; height: number } }
    pageUrl?: string
    userAgent?: string
  }

  // Validate category
  const validCategories = ['suggestie', 'bug', 'vraag'] as const
  const feedbackCategory = validCategories.includes(category as typeof validCategories[number])
    ? (category as typeof validCategories[number])
    : 'suggestie'

  const categoryLabels: Record<string, string> = {
    suggestie: 'Suggestie',
    bug: 'Bug',
    vraag: 'Vraag',
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

  const adminClient = createAdminClient()
  const userEmail = session.user.email || 'onbekend'

  // Upload screenshot to Supabase Storage if present
  let screenshotPath: string | null = null
  if (screenshot) {
    try {
      const base64Data = screenshot.replace('data:image/png;base64,', '')
      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `${crypto.randomUUID()}.png`

      const { error: uploadError } = await adminClient.storage
        .from('feedback-screenshots')
        .upload(filename, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (!uploadError) {
        screenshotPath = filename
      } else {
        console.error('[Feedback] Screenshot upload error:', uploadError)
      }
    } catch (err) {
      console.error('[Feedback] Screenshot upload failed:', err)
    }
  }

  // INSERT into feedback table
  const { error: insertError } = await adminClient
    .from('feedback')
    .insert({
      user_id: session.user.id,
      user_email: userEmail,
      category: feedbackCategory,
      message: message.trim(),
      page_url: (pageUrl as string) || null,
      user_agent: (userAgent as string) || null,
      element_selector: element?.selector || null,
      element_tag: element?.tag || null,
      element_text: element?.text || null,
      screenshot_path: screenshotPath,
    })

  if (insertError) {
    console.error('[Feedback] Database insert error:', insertError)
    // Continue to send email even if DB insert fails
  }

  // Send email notification (keep as trigger alongside DB storage)
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY)
      const subjectPreview = message.trim().slice(0, 50)
      const categoryTag = categoryLabels[feedbackCategory]

      const now = new Date()
      const dutchMonths = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
      const formattedTime = `${now.getDate()} ${dutchMonths[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const friendlyBrowser = parseBrowser((userAgent as string) || '')
      const pageName = pageUrl ? formatPageName(pageUrl as string) : 'onbekend'
      const pageLink = pageUrl ? `<a href="${escapeHtml(pageUrl as string)}" style="color: #436FA3; text-decoration: none;">${escapeHtml(pageName)}</a>` : 'onbekend'

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
          <h2 style="color: #0E3261; margin-bottom: 4px;">Feedback van ${escapeHtml(userEmail)}</h2>
          <p style="margin: 0 0 16px 0;">
            <span style="display: inline-block; padding: 2px 10px; font-size: 12px; font-weight: 600; border-radius: 12px; ${
              feedbackCategory === 'bug'
                ? 'background: #fef2f2; color: #dc2626;'
                : feedbackCategory === 'vraag'
                ? 'background: #eff6ff; color: #2563eb;'
                : 'background: #f0fdf4; color: #16a34a;'
            }">${categoryTag}</span>
          </p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message.trim())}</p>
          </div>
          ${screenshot ? '<p style="color: #666; font-size: 13px;">Schermafbeelding bijgevoegd</p>' : ''}
          <table style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px;">
            <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Pagina</td><td>${pageLink}</td></tr>
            <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Browser</td><td>${escapeHtml(friendlyBrowser)}</td></tr>
            <tr><td style="padding: 2px 12px 2px 0; font-weight: 600;">Tijdstip</td><td>${formattedTime}</td></tr>
          </table>
        </div>
      `

      const attachments = screenshot
        ? [{
            filename: 'screenshot.png',
            content: screenshot.replace('data:image/png;base64,', ''),
            contentType: 'image/png' as const,
          }]
        : []

      const { error: sendError } = await resend.emails.send({
        from: FEEDBACK_FROM,
        to: FEEDBACK_TO,
        subject: `[${categoryTag}] ${subjectPreview}`,
        html: emailHtml,
        text: `Feedback van ${userEmail}\n\n[${categoryTag}]\n\n${message.trim()}\n\nPagina: ${pageName}\nBrowser: ${friendlyBrowser}\nTijdstip: ${formattedTime}`,
        attachments,
      })

      if (sendError) {
        console.error('[Feedback] Resend error:', sendError)
      }
    } catch (err) {
      console.error('[Feedback] Email send error:', err)
      // Don't fail the request if email fails — feedback is saved in DB
    }
  }

  return NextResponse.json({ success: true })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseBrowser(ua: string): string {
  if (!ua) return 'onbekend'
  let browser = 'onbekend'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
  let os = ''
  if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'
  return os ? `${browser}, ${os}` : browser
}

function formatPageName(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const segment = pathname.split('/').filter(Boolean)[0] || 'Home'
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  } catch {
    return url
  }
}
