/**
 * Admin API: Send invite email to a member
 *
 * POST /api/v1/team/leden/[id]/invite — Send (or resend) magic link invite
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

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
    .select('email, user_id')
    .eq('id', id)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Send invite via Supabase (magic link email)
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(sub.email)

  if (inviteError) {
    console.error('[Admin] Invite error:', inviteError)
    return NextResponse.json(
      { error: `Fout bij versturen uitnodiging: ${inviteError.message}` },
      { status: 500 }
    )
  }

  // Set invited_at timestamp
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[Admin] Update invited_at error:', updateError)
    // Invite was sent, just log the update failure
  }

  return NextResponse.json({ success: true })
}
