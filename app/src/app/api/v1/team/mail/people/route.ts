/**
 * Admin API: List People by Segment
 *
 * GET /api/v1/team/mail/people?segments=leden_jaarlijks,leden_maandelijks
 *
 * Returns people matching selected segments (same logic as send route).
 * Used by the person picker UI for targeted sends.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const VALID_SEGMENTS = new Set(['nieuw', 'in_gesprek', 'leden_maandelijks', 'leden_jaarlijks', 'verloren', 'ex_klant'])

function isActiveSub(sub: { cancelled_at: string | null; deleted_at: string | null; end_date: string | null; grace_ends_at: string | null }): boolean {
  if (sub.cancelled_at || sub.deleted_at) return false
  const now = new Date().toISOString().split('T')[0]
  const graceEnd = sub.grace_ends_at || sub.end_date
  return !!graceEnd && graceEnd >= now
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const segmentsParam = request.nextUrl.searchParams.get('segments')
  if (!segmentsParam) {
    return NextResponse.json({ error: 'segments parameter vereist' }, { status: 400 })
  }

  const segments = segmentsParam.split(',').filter(s => VALID_SEGMENTS.has(s))
  if (segments.length === 0) {
    return NextResponse.json({ error: 'Geen geldige segmenten' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: people, error: fetchError } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, pipeline_stage, unsubscribe_token, archived_at, unsubscribed_at, bounced_at')

  if (fetchError || !people) {
    return NextResponse.json({ error: 'Fout bij ophalen contacten' }, { status: 500 })
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  const subMap = new Map<string, NonNullable<typeof subscriptions>[number]>()
  if (subscriptions) {
    for (const sub of subscriptions) {
      subMap.set(sub.person_id, sub)
    }
  }

  const segmentSet = new Set(segments)

  const matched = people
    .filter(person => {
      if (!person.email || person.archived_at || person.unsubscribed_at || person.bounced_at) return false
      if (!person.unsubscribe_token) return false

      const sub = subMap.get(person.id)
      if (sub && isActiveSub(sub)) {
        if (sub.plan === 'monthly' && segmentSet.has('leden_maandelijks')) return true
        if (sub.plan === 'yearly' && segmentSet.has('leden_jaarlijks')) return true
      }

      return segmentSet.has(person.pipeline_stage)
    })
    .map(person => {
      // Determine which segment this person matched
      const sub = subMap.get(person.id)
      let segment = person.pipeline_stage
      if (sub && isActiveSub(sub)) {
        if (sub.plan === 'monthly' && segmentSet.has('leden_maandelijks')) segment = 'leden_maandelijks'
        else if (sub.plan === 'yearly' && segmentSet.has('leden_jaarlijks')) segment = 'leden_jaarlijks'
      }

      return {
        id: person.id,
        email: person.email,
        first_name: person.first_name,
        last_name: person.last_name,
        segment,
      }
    })
    .sort((a, b) => {
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase()
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase()
      return nameA.localeCompare(nameB)
    })

  return NextResponse.json({ people: matched })
}
