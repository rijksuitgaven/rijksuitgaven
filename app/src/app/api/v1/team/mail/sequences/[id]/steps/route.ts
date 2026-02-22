/**
 * Admin API: Sequence Steps
 *
 * POST /api/v1/team/mail/sequences/[id]/steps — Add step to sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
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
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, body: stepBody, preheader, cta_text, cta_url, delay_days } = body as {
    subject?: string
    heading?: string
    body?: string
    preheader?: string
    cta_text?: string
    cta_url?: string
    delay_days?: number
  }

  if (!subject?.trim() || !heading?.trim() || !stepBody?.trim()) {
    return NextResponse.json({ error: 'Subject, heading en body zijn verplicht' }, { status: 400 })
  }

  if (delay_days !== undefined && (typeof delay_days !== 'number' || delay_days < 0 || delay_days > 365)) {
    return NextResponse.json({ error: 'Ongeldige delay_days (0-365)' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify sequence exists
  const { data: seq, error: seqError } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('id', id)
    .single()

  if (seqError || !seq) {
    return NextResponse.json({ error: 'Sequentie niet gevonden' }, { status: 404 })
  }

  // Get next step_order
  const { data: existingSteps } = await supabase
    .from('email_sequence_steps')
    .select('step_order')
    .eq('sequence_id', id)
    .order('step_order', { ascending: false })
    .limit(1)

  const nextOrder = existingSteps && existingSteps.length > 0
    ? existingSteps[0].step_order + 1
    : 1

  const { data: step, error } = await supabase
    .from('email_sequence_steps')
    .insert({
      sequence_id: id,
      step_order: nextOrder,
      delay_days: delay_days ?? 0,
      subject: subject.trim(),
      heading: heading.trim(),
      preheader: preheader?.trim() || null,
      body: stepBody.trim(),
      cta_text: cta_text?.trim() || null,
      cta_url: cta_url?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Sequences] Create step error:', error)
    return NextResponse.json({ error: 'Fout bij aanmaken stap' }, { status: 500 })
  }

  return NextResponse.json({ step }, { status: 201 })
}
