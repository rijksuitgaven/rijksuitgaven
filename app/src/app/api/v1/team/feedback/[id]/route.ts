/**
 * Admin API: Update individual feedback item
 *
 * PATCH /api/v1/team/feedback/[id] — Update status, priority, notes, requirement ref
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

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

  const allowedFields = ['status', 'priority', 'admin_notes', 'requirement_ref'] as const
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  // Validate status
  if ('status' in updates) {
    const validStatuses = ['nieuw', 'in_behandeling', 'requirement', 'afgewezen', 'afgerond']
    if (!validStatuses.includes(updates.status as string)) {
      return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
    }
  }

  // Validate priority
  if ('priority' in updates) {
    const validPriorities = ['laag', 'normaal', 'hoog', 'kritiek']
    if (!validPriorities.includes(updates.priority as string)) {
      return NextResponse.json({ error: 'Ongeldige prioriteit' }, { status: 400 })
    }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Admin] Update feedback error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken feedback' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Feedback niet gevonden' }, { status: 404 })
  }

  return NextResponse.json({ item: data })
}
