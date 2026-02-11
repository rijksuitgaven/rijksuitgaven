/**
 * Admin API: Send invite email to a member
 *
 * POST /api/v1/team/leden/[id]/invite — Send (or resend) magic link invite
 *
 * Handles three scenarios:
 * 1. User not in auth.users → inviteUserByEmail (creates + sends invite)
 * 2. User exists, never logged in → generateLink + send via Resend
 * 3. User exists, already logged in → just set invited_at (no email needed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

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

  // Try the standard invite flow first
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(sub.email)

  if (inviteError) {
    // User already exists in auth.users — handle gracefully
    if (inviteError.message?.includes('already been registered')) {
      // Check if user has ever logged in
      const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id)

      if (user?.last_sign_in_at) {
        // Already active — just set invited_at, no email needed
        await supabase
          .from('subscriptions')
          .update({ invited_at: new Date().toISOString() })
          .eq('id', id)
        return NextResponse.json({ success: true })
      }

      // User exists but never logged in — generate magic link and send via Resend
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: sub.email,
      })

      if (linkError || !linkData?.properties?.action_link) {
        console.error('[Admin] generateLink error:', linkError)
        return NextResponse.json(
          { error: 'Fout bij aanmaken uitnodigingslink' },
          { status: 500 }
        )
      }

      // Send the magic link via Resend
      if (!RESEND_API_KEY) {
        console.error('[Admin] No RESEND_API_KEY configured')
        return NextResponse.json(
          { error: 'E-mail niet geconfigureerd' },
          { status: 500 }
        )
      }

      const resend = new Resend(RESEND_API_KEY)
      const { error: sendError } = await resend.emails.send({
        from: 'Rijksuitgaven <noreply@rijksuitgaven.nl>',
        to: sub.email,
        subject: 'Uitnodiging voor Rijksuitgaven',
        html: `
          <p>Hoi ${sub.first_name},</p>
          <p>Je bent uitgenodigd voor Rijksuitgaven. Klik op de link hieronder om in te loggen:</p>
          <p><a href="${linkData.properties.action_link}" style="display:inline-block;padding:12px 24px;background:#c81e6a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Inloggen bij Rijksuitgaven</a></p>
          <p>Of kopieer deze link:<br/>${linkData.properties.action_link}</p>
          <p>Met vriendelijke groet,<br/>Team Rijksuitgaven</p>
        `,
      })

      if (sendError) {
        console.error('[Admin] Resend error:', sendError)
        return NextResponse.json(
          { error: 'Fout bij versturen e-mail' },
          { status: 500 }
        )
      }
    } else {
      // Unexpected error
      console.error('[Admin] Invite error:', inviteError)
      return NextResponse.json(
        { error: `Fout bij versturen uitnodiging: ${inviteError.message}` },
        { status: 500 }
      )
    }
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
