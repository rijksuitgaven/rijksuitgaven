/**
 * Admin API: Manually Enroll Person in Sequence
 *
 * POST /api/v1/team/mail/sequences/[id]/enroll — Enroll a person
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

  let body: { person_id?: string }
  try {
    const text = await request.text()
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  if (!body.person_id || !UUID_REGEX.test(body.person_id)) {
    return NextResponse.json({ error: 'Geldig person_id is verplicht' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify sequence exists and is active
  const { data: seq, error: seqError } = await supabase
    .from('email_sequences')
    .select('id, status')
    .eq('id', id)
    .single()

  if (seqError || !seq) {
    return NextResponse.json({ error: 'Sequentie niet gevonden' }, { status: 404 })
  }

  // Verify person exists and is not suppressed
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('id, email, bounced_at, unsubscribed_at, archived_at')
    .eq('id', body.person_id)
    .single()

  if (personError || !person) {
    return NextResponse.json({ error: 'Persoon niet gevonden' }, { status: 404 })
  }

  if (person.bounced_at || person.unsubscribed_at || person.archived_at) {
    return NextResponse.json({ error: 'Persoon is uitgesloten (bounced, afgemeld of gearchiveerd)' }, { status: 400 })
  }

  // Insert enrollment (unique constraint prevents duplicates)
  const { data: enrollment, error } = await supabase
    .from('email_sequence_enrollments')
    .insert({
      sequence_id: id,
      person_id: body.person_id,
      current_step: 0,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Persoon is al ingeschreven in deze sequentie' }, { status: 409 })
    }
    console.error('[Sequences] Enroll error:', error)
    return NextResponse.json({ error: 'Fout bij inschrijven' }, { status: 500 })
  }

  return NextResponse.json({ enrollment }, { status: 201 })
}
