/**
 * Admin API: Sequence Detail
 *
 * GET    /api/v1/team/mail/sequences/[id] — Detail with steps + enrollments
 * PATCH  /api/v1/team/mail/sequences/[id] — Update sequence (name, status, send_time)
 * DELETE /api/v1/team/mail/sequences/[id] — Delete sequence (cascades)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
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

  const { data: sequence, error: seqError } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (seqError || !sequence) {
    return NextResponse.json({ error: 'Sequentie niet gevonden' }, { status: 404 })
  }

  // Fetch steps
  const { data: steps } = await supabase
    .from('email_sequence_steps')
    .select('*')
    .eq('sequence_id', id)
    .order('step_order', { ascending: true })

  // Fetch enrollments with person data
  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select('id, person_id, current_step, status, enrolled_at, completed_at, cancelled_at')
    .eq('sequence_id', id)
    .order('enrolled_at', { ascending: false })

  // Enrich enrollments with person info
  const personIds = [...new Set((enrollments || []).map(e => e.person_id))]
  const personMap = new Map<string, { email: string; first_name: string | null }>()
  if (personIds.length > 0) {
    const { data: persons } = await supabase
      .from('people')
      .select('id, email, first_name')
      .in('id', personIds)

    for (const p of persons || []) {
      personMap.set(p.id, { email: p.email, first_name: p.first_name })
    }
  }

  const enrichedEnrollments = (enrollments || []).map(e => ({
    ...e,
    email: personMap.get(e.person_id)?.email || null,
    first_name: personMap.get(e.person_id)?.first_name || null,
  }))

  return NextResponse.json({
    sequence,
    steps: steps || [],
    enrollments: enrichedEnrollments,
  })
}

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

  const allowedFields = ['name', 'description', 'status', 'send_time']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  // Validate status
  if (updates.status && !['draft', 'active', 'paused'].includes(updates.status as string)) {
    return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: updated, error } = await supabase
    .from('email_sequences')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Fout bij bijwerken' }, { status: 500 })
  }

  return NextResponse.json({ sequence: updated })
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
    .from('email_sequences')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Fout bij verwijderen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
