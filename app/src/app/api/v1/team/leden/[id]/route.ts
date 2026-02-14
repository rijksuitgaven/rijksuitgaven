/**
 * Admin API: Update/Delete individual member
 *
 * PATCH  /api/v1/team/leden/[id] — Update subscription fields
 * DELETE /api/v1/team/leden/[id] — Hard delete subscription + auth user
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params

  // Verify origin matches expected domain (basic CSRF protection)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  // Get current user's subscription ID to prevent self-demotion
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 10_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  // Only allow specific fields to be updated
  const allowedFields = ['first_name', 'last_name', 'organization', 'plan', 'start_date', 'end_date', 'grace_ends_at', 'notes', 'role', 'cancelled_at'] as const
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  // Validate plan if provided
  if ('plan' in updates && !['monthly', 'yearly', 'trial'].includes(updates.plan as string)) {
    return NextResponse.json({ error: 'Plan moet "monthly", "yearly" of "trial" zijn' }, { status: 400 })
  }

  // Validate role if provided
  if ('role' in updates) {
    if (!['member', 'trial', 'admin'].includes(updates.role as string)) {
      return NextResponse.json({ error: 'Role moet "member", "trial" of "admin" zijn' }, { status: 400 })
    }

    // Prevent admin from demoting themselves (would lock them out)
    if (currentUserId) {
      const adminClient = createAdminClient()
      const { data: targetSub } = await adminClient
        .from('subscriptions')
        .select('user_id, role')
        .eq('id', id)
        .single()

      if (targetSub?.user_id === currentUserId && targetSub.role === 'admin' && updates.role === 'member') {
        return NextResponse.json({ error: 'Je kunt jezelf niet degraderen naar member' }, { status: 400 })
      }
    }
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Admin] Update member error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken lid' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  return NextResponse.json({ member: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  // Look up the subscription to get user_id
  const { data: sub, error: lookupError } = await adminClient
    .from('subscriptions')
    .select('user_id')
    .eq('id', id)
    .single()

  if (lookupError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Prevent self-deletion
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id === sub.user_id) {
    return NextResponse.json({ error: 'U kunt uzelf niet verwijderen' }, { status: 400 })
  }

  // Delete subscription row (CASCADE will handle FK, but be explicit)
  const { error: deleteSubError } = await adminClient
    .from('subscriptions')
    .delete()
    .eq('id', id)

  if (deleteSubError) {
    console.error('[Admin] Delete subscription error:', deleteSubError)
    return NextResponse.json({ error: 'Fout bij verwijderen abonnement' }, { status: 500 })
  }

  // Delete auth user
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(sub.user_id)
  if (deleteUserError) {
    console.error('[Admin] Delete auth user error:', deleteUserError)
    // Subscription already deleted — log but don't fail
  }

  return NextResponse.json({ ok: true })
}
