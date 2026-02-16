/**
 * Public API: Magic Link Login
 *
 * POST /api/v1/auth/magic-link — Generate magic link + send via Resend
 *
 * Replaces Supabase's built-in signInWithOtp email to:
 * - Use our own domain in the link (not supabase.co)
 * - Use our branded email template via Resend
 * - Verify via token_hash in /auth/callback (no PKCE code_verifier needed)
 *
 * Security:
 * - Always returns 200 to prevent email enumeration
 * - In-memory rate limit: 1 request per email per 60 seconds
 * - Body size limit: 1KB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY

// Simple in-memory rate limit: email → last request timestamp
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 60_000

// Periodic cleanup every 5 minutes to prevent memory growth
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_MS
  for (const [key, ts] of rateLimitMap) {
    if (ts < cutoff) rateLimitMap.delete(key)
  }
}, 5 * 60_000).unref()

// Allowed domains for magic link origin (prevents x-forwarded-host injection)
const ALLOWED_HOSTS = new Set([
  'rijksuitgaven.nl',
  'www.rijksuitgaven.nl',
  'beta.rijksuitgaven.nl',
  'localhost:3000',
  'localhost:3001',
])

function buildMagicLinkEmail(actionLink: string, siteUrl: string): string {
  const displayHost = siteUrl.replace(/^https?:\/\//, '')
  return `
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inloggen bij Rijksuitgaven</title>
</head>
<body style="margin: 0; padding: 0; background-color: #E1EAF2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E1EAF2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${siteUrl}/logo.png" alt="Rijksuitgaven" width="220" style="display: block; width: 220px; height: auto;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 8px; padding: 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Heading -->
                <tr>
                  <td style="font-size: 22px; font-weight: 700; color: #0E3261; text-align: center; padding-bottom: 16px;">
                    Inloggen bij uw account
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="font-size: 15px; line-height: 24px; color: #4a4a4a; text-align: center; padding-bottom: 28px;">
                    Klik hieronder om in te loggen.
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #E62D75; border-radius: 6px;">
                          <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 14px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                            Inloggen
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry notice -->
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center; padding-bottom: 28px;">
                    Deze link is een uur geldig.
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="border-top: 1px solid #eeeeee;"></td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Disclaimer -->
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center;">
                    Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren.
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center; padding-top: 8px;">
                    Lukt het niet? Neem contact op met <a href="mailto:contact@${displayHost}" style="color: #436FA3; text-decoration: none;">ons supportteam</a>.
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

export async function POST(request: NextRequest) {
  // Parse body
  const text = await request.text()
  if (text.length > 1024) {
    return NextResponse.json({ ok: true }) // Silent reject, prevent enumeration
  }

  let body: { email?: string }
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: true })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true })
  }

  // Rate limit: 1 request per email per 60s
  const lastRequest = rateLimitMap.get(email)
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  rateLimitMap.set(email, Date.now())

  // Cleanup handled by periodic setInterval above

  if (!RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[MagicLink] Missing RESEND_API_KEY or SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ ok: true })
  }

  const supabase = createAdminClient()

  // Generate magic link — will fail if user doesn't exist
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    // User doesn't exist or other error — return success to prevent enumeration
    return NextResponse.json({ ok: true })
  }

  // Build link on our own domain (validate x-forwarded-host against whitelist)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost && ALLOWED_HOSTS.has(forwardedHost)
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin

  const magicLink = `${origin}/auth/callback?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=magiclink`

  // Send via Resend (fire-and-forget style but await for error handling)
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    await resend.emails.send({
      from: 'Rijksuitgaven.nl <noreply@rijksuitgaven.nl>',
      to: email,
      subject: 'Uw inloglink voor Rijksuitgaven',
      html: buildMagicLinkEmail(magicLink, origin),
    })
  } catch (err) {
    console.error('[MagicLink] Resend error:', err)
  }

  return NextResponse.json({ ok: true })
}
