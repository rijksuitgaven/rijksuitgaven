/**
 * Admin API: Email Topic Detail
 *
 * PATCH  /api/v1/team/mail/topics/[id] — Update topic
 * DELETE /api/v1/team/mail/topics/[id] — Delete topic
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const allowedFields = ['name', 'description', 'is_default', 'sort_order']
  const updates: Record<string, unknown> = {}

  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen wijzigingen' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: updated, error } = await supabase
    .from('email_topics')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Fout bij bijwerken topic' }, { status: 500 })
  }

  return NextResponse.json({ topic: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('email_topics')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Fout bij verwijderen topic' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
