/**
 * Admin API: Email audience management
 *
 * GET  /api/v1/team/mail — Get pipeline-based recipient counts
 * POST /api/v1/team/mail — Trigger full Resend Audience sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { backfillResendAudience } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()

  const { data: people } = await supabase
    .from('people')
    .select('id, pipeline_stage, archived_at, unsubscribed_at, unsubscribe_token, bounced_at')

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  // Build active subscription map: person_id → plan
  const activeSubMap = new Map<string, string>()
  if (subscriptions) {
    const now = new Date().toISOString().split('T')[0]
    for (const sub of subscriptions) {
      if (sub.cancelled_at || sub.deleted_at) continue
      const graceEnd = sub.grace_ends_at || sub.end_date
      if (graceEnd && graceEnd >= now) {
        activeSubMap.set(sub.person_id, sub.plan)
      }
    }
  }

  const counts: Record<string, number> = {
    nieuw: 0,
    in_gesprek: 0,
    leden_maandelijks: 0,
    leden_jaarlijks: 0,
    verloren: 0,
    ex_klant: 0,
  }

  if (people) {
    for (const person of people) {
      if (!person.unsubscribe_token || person.archived_at || person.unsubscribed_at || person.bounced_at) continue

      // Active subscription determines "leden" segments (regardless of pipeline stage)
      const plan = activeSubMap.get(person.id)
      if (plan === 'monthly') {
        counts.leden_maandelijks++
      } else if (plan === 'yearly') {
        counts.leden_jaarlijks++
      } else {
        const stage = person.pipeline_stage
        if (stage in counts) {
          counts[stage]++
        }
      }
    }
  }

  return NextResponse.json({ counts })
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
