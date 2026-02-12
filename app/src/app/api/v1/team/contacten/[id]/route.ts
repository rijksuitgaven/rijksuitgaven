/**
 * Admin API: Update/Delete individual contact
 *
 * PATCH  /api/v1/team/contacten/[id] — Update contact fields (+ Resend sync)
 * DELETE /api/v1/team/contacten/[id] — Delete contact (+ remove from Resend)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncContactToResend } from '@/app/api/_lib/resend-audience'

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

  const allowedFields = ['first_name', 'last_name', 'organization', 'type', 'source', 'notes', 'subscription_id'] as const
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  if ('type' in updates && !['prospect', 'subscriber', 'churned'].includes(updates.type as string)) {
    return NextResponse.json({ error: 'Type moet "prospect", "subscriber" of "churned" zijn' }, { status: 400 })
  }

  // Semi-automatic: linking a subscription auto-sets type to subscriber
  if ('subscription_id' in updates && updates.subscription_id) {
    updates.type = 'subscriber'
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Admin] Update contact error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken contact' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Contact niet gevonden' }, { status: 404 })
  }

  // Sync to Resend Audience (fire-and-forget)
  syncContactToResend('update', data).catch(err => {
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

  // Get contact first for Resend cleanup
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, resend_contact_id')
    .eq('id', id)
    .single()

  if (!contact) {
    return NextResponse.json({ error: 'Contact niet gevonden' }, { status: 404 })
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Admin] Delete contact error:', error)
    return NextResponse.json({ error: 'Fout bij verwijderen contact' }, { status: 500 })
  }

  // Remove from Resend Audience (fire-and-forget)
  if (contact.resend_contact_id) {
    syncContactToResend('delete', contact).catch(err => {
      console.error('[Resend] Sync error on delete:', err)
    })
  }

  return NextResponse.json({ success: true })
}
