/**
 * Admin API: Update/Delete individual member
 *
 * PATCH  /api/v1/team/leden/[id] — Update person + subscription fields
 * DELETE /api/v1/team/leden/[id] — Delete subscription (person preserved in people table)
 *
 * Person fields (first_name, last_name, organization) are updated on `people`.
 * Subscription fields (plan, dates, role, notes) are updated on `subscriptions`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncPersonToResend, computeListType } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

const PERSON_FIELDS = new Set(['first_name', 'last_name', 'organization'])
const SUBSCRIPTION_FIELDS = new Set(['plan', 'start_date', 'end_date', 'grace_ends_at', 'notes', 'role', 'cancelled_at'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params

  // Verify origin matches expected domain (basic CSRF protection)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  // Get current user's subscription ID to prevent self-demotion
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

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

  // Split updates into person fields and subscription fields
  const personUpdates: Record<string, unknown> = {}
  const subUpdates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(body)) {
    if (PERSON_FIELDS.has(key)) {
      personUpdates[key] = value
    } else if (SUBSCRIPTION_FIELDS.has(key)) {
      subUpdates[key] = value
    }
  }

  if (Object.keys(personUpdates).length === 0 && Object.keys(subUpdates).length === 0) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 })
  }

  // Validate plan if provided
  if ('plan' in subUpdates && !['monthly', 'yearly', 'trial'].includes(subUpdates.plan as string)) {
    return NextResponse.json({ error: 'Plan moet "monthly", "yearly" of "trial" zijn' }, { status: 400 })
  }

  // Validate role if provided
  if ('role' in subUpdates) {
    if (!['member', 'trial', 'admin'].includes(subUpdates.role as string)) {
      return NextResponse.json({ error: 'Role moet "member", "trial" of "admin" zijn' }, { status: 400 })
    }

    // Prevent admin from demoting themselves (would lock them out)
    if (currentUserId) {
      const adminClient = createAdminClient()
      const { data: targetSub } = await adminClient
        .from('subscriptions')
        .select('user_id, role')
        .eq('id', id)
        .single()

      if (targetSub?.user_id === currentUserId && targetSub.role === 'admin' && subUpdates.role === 'member') {
        return NextResponse.json({ error: 'U kunt uzelf niet degraderen naar member' }, { status: 400 })
      }
    }
  }

  const adminSupabase = createAdminClient()

  // Get subscription to find person_id
  const { data: sub, error: subLookupError } = await adminSupabase
    .from('subscriptions')
    .select('id, person_id')
    .eq('id', id)
    .single()

  if (subLookupError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Update person fields if any
  if (Object.keys(personUpdates).length > 0) {
    const { error: personError } = await adminSupabase
      .from('people')
      .update(personUpdates)
      .eq('id', sub.person_id)

    if (personError) {
      console.error('[Admin] Update person error:', personError)
      return NextResponse.json({ error: 'Fout bij bijwerken persoonsgegevens' }, { status: 500 })
    }
  }

  // Update subscription fields if any
  if (Object.keys(subUpdates).length > 0) {
    const { error: subError } = await adminSupabase
      .from('subscriptions')
      .update(subUpdates)
      .eq('id', id)

    if (subError) {
      console.error('[Admin] Update subscription error:', subError)
      return NextResponse.json({ error: 'Fout bij bijwerken abonnement' }, { status: 500 })
    }
  }

  // Fetch updated member with person data for response
  const { data: updated, error: fetchError } = await adminSupabase
    .from('subscriptions')
    .select('id, user_id, person_id, plan, role, start_date, end_date, grace_ends_at, cancelled_at, invited_at, activated_at, last_active_at, notes, created_at, people!inner(email, first_name, last_name, organization, resend_contact_id)')
    .eq('id', id)
    .single()

  if (fetchError || !updated) {
    return NextResponse.json({ error: 'Fout bij ophalen bijgewerkt lid' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { people, ...subData } = updated as any

  // Sync to Resend with updated segment (fire-and-forget)
  const list = computeListType(subData)
  syncPersonToResend('update', {
    id: sub.person_id,
    email: people.email,
    first_name: people.first_name,
    last_name: people.last_name,
    resend_contact_id: people.resend_contact_id,
  }, list).catch(err => {
    console.error('[Resend] Sync error on member update:', err)
  })

  return NextResponse.json({
    member: {
      ...subData,
      email: people.email,
      first_name: people.first_name,
      last_name: people.last_name,
      organization: people.organization,
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  // Look up the subscription to get user_id and person_id
  const { data: sub, error: lookupError } = await adminClient
    .from('subscriptions')
    .select('user_id, person_id')
    .eq('id', id)
    .single()

  if (lookupError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Prevent self-deletion
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id === sub.user_id) {
    return NextResponse.json({ error: 'U kunt uzelf niet verwijderen' }, { status: 400 })
  }

  // Soft-delete: set deleted_at + cancelled_at so person shows as "churned" on contacten
  const now = new Date().toISOString()
  const { error: softDeleteError } = await adminClient
    .from('subscriptions')
    .update({ deleted_at: now, cancelled_at: now })
    .eq('id', id)

  if (softDeleteError) {
    console.error('[Admin] Soft-delete subscription error:', softDeleteError)
    return NextResponse.json({ error: 'Fout bij verwijderen lid' }, { status: 500 })
  }

  // Set pipeline stage to ex_klant
  await adminClient
    .from('people')
    .update({ pipeline_stage: 'ex_klant' })
    .eq('id', sub.person_id)

  // Sync to Resend as churned (fire-and-forget)
  const { data: person } = await adminClient
    .from('people')
    .select('id, email, first_name, last_name, resend_contact_id')
    .eq('id', sub.person_id)
    .single()

  if (person) {
    syncPersonToResend('update', person, 'churned').catch(err => {
      console.error('[Resend] Sync error on member delete:', err)
    })
  }

  return NextResponse.json({ ok: true })
}
