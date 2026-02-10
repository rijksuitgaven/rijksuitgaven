/**
 * Admin API: Update/Delete individual member
 *
 * PATCH  /api/v1/team/leden/[id] — Update subscription fields
 * DELETE /api/v1/team/leden/[id] — Cancel subscription (set cancelled_at)
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
  if ('plan' in updates && !['monthly', 'yearly'].includes(updates.plan as string)) {
    return NextResponse.json({ error: 'Plan moet "monthly" of "yearly" zijn' }, { status: 400 })
  }

  // Validate role if provided
  if ('role' in updates && !['member', 'admin'].includes(updates.role as string)) {
    return NextResponse.json({ error: 'Role moet "member" of "admin" zijn' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
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
