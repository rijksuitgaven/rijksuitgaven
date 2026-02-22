/**
 * Admin API: Email Sequences
 *
 * GET  /api/v1/team/mail/sequences — List all sequences with step count + enrollment stats
 * POST /api/v1/team/mail/sequences — Create new sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Fout bij ophalen sequenties' }, { status: 500 })
  }

  // Fetch step counts
  const { data: steps } = await supabase
    .from('email_sequence_steps')
    .select('sequence_id')

  const stepCounts = new Map<string, number>()
  for (const s of steps || []) {
    stepCounts.set(s.sequence_id, (stepCounts.get(s.sequence_id) || 0) + 1)
  }

  // Fetch enrollment counts (active only)
  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select('sequence_id, status')

  const enrollCounts = new Map<string, { active: number; completed: number; total: number }>()
  for (const e of enrollments || []) {
    if (!enrollCounts.has(e.sequence_id)) {
      enrollCounts.set(e.sequence_id, { active: 0, completed: 0, total: 0 })
    }
    const c = enrollCounts.get(e.sequence_id)!
    c.total++
    if (e.status === 'active') c.active++
    if (e.status === 'completed') c.completed++
  }

  const result = (sequences || []).map(seq => ({
    ...seq,
    step_count: stepCounts.get(seq.id) || 0,
    enrollment_active: enrollCounts.get(seq.id)?.active || 0,
    enrollment_completed: enrollCounts.get(seq.id)?.completed || 0,
    enrollment_total: enrollCounts.get(seq.id)?.total || 0,
  }))

  return NextResponse.json({ sequences: result })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let body: { name?: string; description?: string; send_time?: string }
  try {
    const text = await request.text()
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
  }

  // Validate send_time format (HH:MM)
  const sendTime = body.send_time || '09:00'
  if (!/^\d{2}:\d{2}$/.test(sendTime)) {
    return NextResponse.json({ error: 'Ongeldig tijdformat (HH:MM)' }, { status: 400 })
  }

  // Get current user ID
  let createdBy: string | null = null
  try {
    const sessionClient = await createClient()
    const { data: { session } } = await sessionClient.auth.getSession()
    createdBy = session?.user?.id || null
  } catch {
    // Non-fatal
  }

  const supabase = createAdminClient()

  const { data: seq, error } = await supabase
    .from('email_sequences')
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      send_time: sendTime,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) {
    console.error('[Sequences] Create error:', error)
    return NextResponse.json({ error: 'Fout bij aanmaken sequentie' }, { status: 500 })
  }

  return NextResponse.json({ sequence: seq }, { status: 201 })
}
