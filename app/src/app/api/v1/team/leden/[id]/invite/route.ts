/**
 * Admin API: Send welcome/activation email to a member
 *
 * POST /api/v1/team/leden/[id]/invite — Send (or resend) activation link
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
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

function buildActivationEmail(firstName: string, email: string, actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Welkom bij Rijksuitgaven</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0E3261;padding:24px 32px;border-radius:8px 8px 0 0;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">RIJKSUITGAVEN.NL</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 32px 24px 32px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">
                Beste ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">
                Welkom bij Rijksuitgaven, het meest complete platform voor overheidsuitgaven in Nederland.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#1a1a1a;">
                Klik op onderstaande knop om uw account te activeren en direct aan de slag te gaan:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:6px;background-color:#E62D75;">
                    <a href="${actionLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Account activeren</a>
                  </td>
                </tr>
              </table>

              <!-- Expiry note -->
              <p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:#666666;">
                Deze link is 1 uur geldig.
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#666666;">
                Verlopen? Ga naar <a href="https://rijksuitgaven.nl" style="color:#436FA3;text-decoration:underline;">rijksuitgaven.nl</a>, klik op <strong>Inloggen</strong> en vraag een nieuwe link aan met dit e-mailadres (${email}).
              </p>

              <!-- Sign-off -->
              <p style="margin:0;font-size:16px;line-height:1.6;color:#1a1a1a;">
                Met vriendelijke groet,<br/>Team Rijksuitgaven
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0E3261;padding:20px 32px;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 4px;font-size:13px;color:#8DBADC;">
                <a href="https://rijksuitgaven.nl" style="color:#8DBADC;text-decoration:none;">rijksuitgaven.nl</a>
              </p>
              <p style="margin:0;font-size:13px;color:#8DBADC;">
                Vragen? <a href="mailto:contact@rijksuitgaven.nl" style="color:#8DBADC;text-decoration:underline;">contact@rijksuitgaven.nl</a>
              </p>
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Get the subscription to find the email and user_id
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('email, user_id, first_name')
    .eq('id', id)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  if (!RESEND_API_KEY) {
    console.error('[Admin] No RESEND_API_KEY configured')
    return NextResponse.json({ error: 'E-mail niet geconfigureerd' }, { status: 500 })
  }

  // Check if user already exists in auth
  let needsCreate = false
  if (sub.user_id) {
    const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id)

    if (user?.last_sign_in_at) {
      // Already active — just set invited_at, no email needed
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
      email: sub.email,
      email_confirm: true,
    })

    if (createError) {
      // User might already exist (e.g. from a previous partial flow)
      if (!createError.message?.includes('already been registered')) {
        console.error('[Admin] Create user error:', createError)
        return NextResponse.json({ error: 'Fout bij aanmaken account' }, { status: 500 })
      }
    } else if (newUser?.user) {
      // Link the new auth user to the subscription
      await supabase
        .from('subscriptions')
        .update({ user_id: newUser.user.id })
        .eq('id', id)
    }
  }

  // Generate magic link for the user
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: sub.email,
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[Admin] generateLink error:', linkError)
    return NextResponse.json({ error: 'Fout bij aanmaken activatielink' }, { status: 500 })
  }

  // Send branded activation email via Resend
  const resend = new Resend(RESEND_API_KEY)
  const { error: sendError } = await resend.emails.send({
    from: 'Rijksuitgaven <noreply@rijksuitgaven.nl>',
    to: sub.email,
    subject: 'Welkom bij Rijksuitgaven — activeer uw account',
    html: buildActivationEmail(sub.first_name, sub.email, linkData.properties.action_link),
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

  return NextResponse.json({ success: true })
}
