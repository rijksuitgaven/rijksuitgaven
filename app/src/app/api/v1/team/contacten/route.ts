/**
 * Admin API: Contact Management
 *
 * GET  /api/v1/team/contacten — List all contacts
 * POST /api/v1/team/contacten — Create new contact (+ Resend Audience sync)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncContactToResend } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name, organization, phone, type, source, notes, resend_contact_id, subscription_id, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] List contacts error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen contacten' }, { status: 500 })
  }

  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

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

  const { email, first_name, last_name, organization, phone, type, source, notes } = body as {
    email?: string
    first_name?: string
    last_name?: string
    organization?: string
    phone?: string
    type?: string
    source?: string
    notes?: string
  }

  if (!email) {
    return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
  }
  if (type && !['prospect', 'subscriber', 'churned'].includes(type)) {
    return NextResponse.json({ error: 'Type moet "prospect", "subscriber" of "churned" zijn' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Dit e-mailadres bestaat al als contact' }, { status: 409 })
  }

  const { data: contact, error: insertError } = await supabase
    .from('contacts')
    .insert({
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      organization: organization || null,
      phone: phone || null,
      type: type || 'prospect',
      source: source || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[Admin] Create contact error:', insertError)
    return NextResponse.json({ error: 'Fout bij aanmaken contact' }, { status: 500 })
  }

  // Sync to Resend Audience (fire-and-forget, don't fail the operation)
  syncContactToResend('create', contact).catch(err => {
    console.error('[Resend] Sync error on create:', err)
  })

  return NextResponse.json({ contact }, { status: 201 })
}
