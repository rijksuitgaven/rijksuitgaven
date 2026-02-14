/**
 * Admin API: Update/Delete individual contact (person without active subscription)
 *
 * PATCH  /api/v1/team/contacten/[id] — Update person fields (+ Resend sync)
 * DELETE /api/v1/team/contacten/[id] — Delete person (only if no subscription history)
 *
 * Type is computed, not editable. ON DELETE RESTRICT on subscriptions.person_id
 * prevents deletion of people with subscription history.
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
  const allowedFields = ['first_name', 'last_name', 'organization', 'phone', 'source', 'notes'] as const
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params
  const supabase = createAdminClient()

  // Get person for Resend cleanup
  const { data: person } = await supabase
    .from('people')
    .select('id, resend_contact_id')
    .eq('id', id)
    .single()

  if (!person) {
    return NextResponse.json({ error: 'Contact niet gevonden' }, { status: 404 })
  }

  // Check for subscription history — only prospects (no subscriptions ever) can be deleted
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('person_id', id)
    .limit(1)

  if (subs && subs.length > 0) {
    return NextResponse.json({
      error: 'Dit contact heeft abonnementsgeschiedenis en kan niet worden verwijderd'
    }, { status: 409 })
  }

  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Admin] Delete person error:', error)
    return NextResponse.json({ error: 'Fout bij verwijderen contact' }, { status: 500 })
  }

  // Remove from Resend Audience (fire-and-forget)
  if (person.resend_contact_id) {
    syncPersonToResend('delete', person).catch(err => {
      console.error('[Resend] Sync error on delete:', err)
    })
  }

  return NextResponse.json({ success: true })
}
