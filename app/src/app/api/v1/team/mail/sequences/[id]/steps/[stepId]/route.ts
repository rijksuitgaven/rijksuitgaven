/**
 * Admin API: Sequence Step Detail
 *
 * PATCH  /api/v1/team/mail/sequences/[id]/steps/[stepId] — Update step
 * DELETE /api/v1/team/mail/sequences/[id]/steps/[stepId] — Remove step
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  const { id, stepId } = await params
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(stepId)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const allowedFields = ['subject', 'heading', 'preheader', 'body', 'cta_text', 'cta_url', 'delay_days', 'step_order']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  // Validate delay_days
  if (updates.delay_days !== undefined) {
    const d = updates.delay_days as number
    if (typeof d !== 'number' || d < 0 || d > 365) {
      return NextResponse.json({ error: 'Ongeldige delay_days (0-365)' }, { status: 400 })
    }
  }

  // Validate step_order
  if (updates.step_order !== undefined) {
    const o = updates.step_order as number
    if (typeof o !== 'number' || o < 1) {
      return NextResponse.json({ error: 'Ongeldige step_order' }, { status: 400 })
    }
  }

  const supabase = createAdminClient()

  const { data: updated, error } = await supabase
    .from('email_sequence_steps')
    .update(updates)
    .eq('id', stepId)
    .eq('sequence_id', id)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Fout bij bijwerken stap' }, { status: 500 })
  }

  return NextResponse.json({ step: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id, stepId } = await params
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(stepId)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('email_sequence_steps')
    .delete()
    .eq('id', stepId)
    .eq('sequence_id', id)

  if (error) {
    return NextResponse.json({ error: 'Fout bij verwijderen stap' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
