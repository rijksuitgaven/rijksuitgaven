/**
 * Admin API: Send welcome email with login link to a member
 *
 * POST /api/v1/team/leden/[id]/invite — Send (or resend) login link
 *
 * Handles three scenarios:
 * 1. User not in auth.users → create user + generate link + send via Resend
 * 2. User exists, never logged in → generate link + send via Resend
 * 3. User exists, already logged in → just set invited_at (no email needed)
 *
 * All emails use our custom branded template via Resend (never Supabase default).
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'

const ALLOWED_HOSTS = new Set([
  'rijksuitgaven.nl',
  'www.rijksuitgaven.nl',
  'beta.rijksuitgaven.nl',
  'localhost:3000',
  'localhost:3001',
])
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { autoEnrollInSequences } from '@/app/api/_lib/sequence-enrollment'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

function buildWelcomeEmail(firstName: string, email: string, actionLink: string, siteUrl: string): string {
  // Extract display hostname (e.g., "beta.rijksuitgaven.nl") from full origin URL
  const displayHost = siteUrl.replace(/^https?:\/\//, '')
  return `
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welkom bij Rijksuitgaven 2.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #E1EAF2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E1EAF2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

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
                    Welkom bij Rijksuitgaven 2.0
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="font-size: 16px; line-height: 24px; color: #4a4a4a; text-align: center; padding-bottom: 8px;">
                    Beste ${firstName},
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 16px; line-height: 24px; color: #4a4a4a; text-align: center; padding-bottom: 8px;">
                    Log in op het nieuwe Rijksuitgaven met de knop hieronder.
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 16px; line-height: 24px; color: #4a4a4a; text-align: center; padding-bottom: 8px;">
                    Er is geen wachtwoord. Na inloggen blijft u ingelogd zolang u het platform minstens één keer per 7 dagen bezoekt.
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 16px; line-height: 24px; color: #4a4a4a; text-align: center; padding-bottom: 28px;">
                    Uw persoonlijke inloglink is 24 uur geldig. Link verlopen? Ga naar <a href="${siteUrl}" style="color: #436FA3; text-decoration: none;">${displayHost}</a> en vraag een nieuwe aan.
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #D4286B; border-radius: 6px;">
                          <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 14px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                            Inloggen
                          </a>
                        </td>
                      </tr>
                    </table>
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
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center; padding-top: 8px;">
                    Vragen? Neem contact op met <a href="mailto:contact@rijksuitgaven.nl" style="color: #436FA3; text-decoration: none;">ons supportteam</a>.
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Get the subscription with person data via FK JOIN
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, person_id, last_active_at, people!inner(email, first_name)')
    .eq('id', id)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Extract person fields from JOIN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const person = (sub as any).people as { email: string; first_name: string }

  if (!RESEND_API_KEY) {
    console.error('[Admin] No RESEND_API_KEY configured')
    return NextResponse.json({ error: 'E-mail niet geconfigureerd' }, { status: 500 })
  }

  // Check if user already exists in auth
  // Use subscription's last_active_at (not auth's last_sign_in_at) to determine
  // if user is truly active — last_sign_in_at can be set by a failed PKCE exchange
  let needsCreate = false
  if ((sub as { user_id: string | null }).user_id) {
    if ((sub as { last_active_at: string | null }).last_active_at) {
      // User has actually used the app — just set invited_at, no email needed
      await supabase
        .from('subscriptions')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ success: true })
    }
  } else {
    needsCreate = true
  }

  // Create user in auth if needed (without Supabase's default invite email)
  if (needsCreate) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: person.email,
      email_confirm: true,
    })

    if (createError) {
      // User might already exist (e.g. from a previous partial flow)
      if (!createError.message?.includes('already been registered')) {
        console.error('[Admin] Create user error:', createError)
        return NextResponse.json({ error: 'Fout bij aanmaken account' }, { status: 500 })
      }
      // User already exists — look up their auth ID and link to subscription
      let existingUserId: string | null = null
      for (let page = 1; !existingUserId; page++) {
        const { data: { users: batch } } = await supabase.auth.admin.listUsers({ page, perPage: 50 })
        if (batch.length === 0) break
        const match = batch.find(u => u.email === person.email)
        if (match) existingUserId = match.id
      }
      if (existingUserId) {
        await supabase
          .from('subscriptions')
          .update({ user_id: existingUserId })
          .eq('id', id)
      }
    } else if (newUser?.user) {
      // Link the new auth user to the subscription
      await supabase
        .from('subscriptions')
        .update({ user_id: newUser.user.id })
        .eq('id', id)
    }
  }

  // Derive site origin from request headers (validate against whitelist)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost && ALLOWED_HOSTS.has(forwardedHost)
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin

  // Generate magic link for the user
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: person.email,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[Admin] generateLink error:', linkError)
    return NextResponse.json({ error: 'Fout bij aanmaken inloglink' }, { status: 500 })
  }

  // Build login link on our own domain (not Supabase's verify URL)
  // This avoids the scary supabase.co URL and uses verifyOtp() client-side
  const activationLink = `${origin}/auth/callback?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=magiclink`

  // Send branded welcome email via Resend
  const resend = new Resend(RESEND_API_KEY)
  const displayHost = origin.replace(/^https?:\/\//, '')
  const { error: sendError } = await resend.emails.send({
    from: 'Rijksuitgaven <contact@rijksuitgaven.nl>',
    to: person.email,
    subject: 'Uw inloglink voor Rijksuitgaven 2.0',
    html: buildWelcomeEmail(person.first_name, person.email, activationLink, origin),
    text: [
      'Welkom bij Rijksuitgaven 2.0',
      '',
      `Beste ${person.first_name},`,
      '',
      'Log in op het nieuwe Rijksuitgaven met de volgende link:',
      '',
      'Er is geen wachtwoord. Na inloggen blijft u ingelogd zolang u het platform minstens één keer per 7 dagen bezoekt.',
      '',
      `Uw persoonlijke inloglink is 24 uur geldig. Link verlopen? Ga naar ${displayHost} en vraag een nieuwe aan.`,
      '',
      activationLink,
    ].join('\n'),
  })

  if (sendError) {
    console.error('[Admin] Resend error:', sendError)
    return NextResponse.json({ error: 'Fout bij versturen e-mail' }, { status: 500 })
  }

  // Set invited_at timestamp
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[Admin] Update invited_at error:', updateError)
  }

  // Auto-enroll in active sequences (non-fatal)
  const personId = (sub as { person_id: string }).person_id
  if (personId) {
    try {
      await autoEnrollInSequences(personId)
    } catch (err) {
      console.error('[Admin] Auto-enroll error:', err)
    }
  }

  return NextResponse.json({ success: true })
}
