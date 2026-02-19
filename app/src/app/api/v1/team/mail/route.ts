/**
 * Admin API: Email audience management
 *
 * GET  /api/v1/team/mail — Get list counts + sync status
 * POST /api/v1/team/mail — Trigger full Resend Audience sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { backfillResendAudience, computeListType } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()

  // Fetch all people with subscriptions to compute list counts
  const { data: people } = await supabase
    .from('people')
    .select('id, archived_at, resend_contact_id')

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  // Build person_id → subscription map
  const subMap = new Map<string, NonNullable<typeof subscriptions>[number]>()
  if (subscriptions) {
    for (const sub of subscriptions) {
      subMap.set(sub.person_id, sub)
    }
  }

  // Compute counts
  const counts = { leden: 0, churned: 0, prospects: 0 }
  let resendContacts = 0

  if (people) {
    for (const person of people) {
      if (person.archived_at) continue
      const sub = subMap.get(person.id) || null
      const list = computeListType(sub)
      counts[list]++
      if (person.resend_contact_id) resendContacts++
    }
  }

  return NextResponse.json({
    counts,
    resend_contacts: resendContacts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  try {
    const stats = await backfillResendAudience()
    return NextResponse.json({
      success: true,
      ...stats,
    })
  } catch (err) {
    console.error('[Mail] Sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Synchronisatie mislukt' },
      { status: 500 }
    )
  }
}
