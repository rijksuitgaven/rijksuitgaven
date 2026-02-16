/**
 * Admin API: Contact Management (People without active subscription)
 *
 * GET  /api/v1/team/contacten — List people without active subscription
 * POST /api/v1/team/contacten — Create new person (prospect)
 *
 * Type is computed, not stored:
 *   - No subscription history, not archived → prospect
 *   - No subscription history, archived_at set → gearchiveerd
 *   - Had subscription, now expired/cancelled → churned
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncPersonToResend } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()

  // Get all people with their subscriptions (if any)
  const { data: people, error } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, organization, phone, source, notes, resend_contact_id, archived_at, created_at, updated_at, subscriptions(id, end_date, grace_ends_at, cancelled_at)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] List contacts error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen contacten' }, { status: 500 })
  }

  // Filter: keep only people WITHOUT active subscription
  const now = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contacts = (people ?? []).filter((person: any) => {
    const subs = person.subscriptions as { id: string; end_date: string; grace_ends_at: string | null; cancelled_at: string | null }[]
    if (!subs || subs.length === 0) return true // No subscription = prospect
    // Check if ANY subscription is still active
    const hasActive = subs.some(s => {
      if (s.cancelled_at) return false
      const graceEnd = s.grace_ends_at || s.end_date
      return graceEnd >= now
    })
    return !hasActive
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).map(({ subscriptions, ...person }: any) => {
    // Compute type: churned (had subscription), gearchiveerd (archived prospect), or prospect
    const subs = subscriptions as { id: string }[]
    let type: 'prospect' | 'churned' | 'gearchiveerd'
    if (subs && subs.length > 0) {
      type = 'churned'
    } else if (person.archived_at) {
      type = 'gearchiveerd'
    } else {
      type = 'prospect'
    }
    return { ...person, type }
  })

  return NextResponse.json({ contacts })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
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

  const { email, first_name, last_name, organization, phone, source, notes } = body as {
    email?: string
    first_name?: string
    last_name?: string
    organization?: string
    phone?: string
    source?: string
    notes?: string
  }

  if (!email) {
    return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const normalizedEmail = email.toLowerCase()

  // Check for duplicate email (case-insensitive via normalized lowercase)
  const { data: existing } = await supabase
    .from('people')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Dit e-mailadres bestaat al' }, { status: 409 })
  }

  const { data: person, error: insertError } = await supabase
    .from('people')
    .insert({
      email: normalizedEmail,
      first_name: first_name || null,
      last_name: last_name || null,
      organization: organization || null,
      phone: phone || null,
      source: source || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[Admin] Create person error:', insertError)
    return NextResponse.json({ error: 'Fout bij aanmaken contact' }, { status: 500 })
  }

  // Sync to Resend Audience (fire-and-forget)
  syncPersonToResend('create', person).catch(err => {
    console.error('[Resend] Sync error on create:', err)
  })

  return NextResponse.json({ contact: { ...person, type: 'prospect' } }, { status: 201 })
}
