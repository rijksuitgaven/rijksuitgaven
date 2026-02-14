/**
 * Admin API: Update individual contact (person without active subscription)
 *
 * PATCH  /api/v1/team/contacten/[id] — Update person fields (+ Resend sync)
 *
 * Type is computed, not editable. No deletion — use archived_at for prospects.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncPersonToResend } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function PATCH(
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

  // Person fields only (type is computed, not editable)
  const allowedFields = ['first_name', 'last_name', 'organization', 'phone', 'source', 'notes', 'archived_at'] as const
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Admin] Update person error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken contact' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Contact niet gevonden' }, { status: 404 })
  }

  // Sync to Resend Audience (fire-and-forget)
  syncPersonToResend('update', data).catch(err => {
    console.error('[Resend] Sync error on update:', err)
  })

  return NextResponse.json({ contact: data })
}

