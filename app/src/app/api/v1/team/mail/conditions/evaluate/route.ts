/**
 * Admin API: Evaluate campaign conditions
 *
 * POST /api/v1/team/mail/conditions/evaluate
 *
 * Evaluates AND/OR conditions against campaign_events and engagement scores
 * to determine which people match. Returns count + person IDs.
 *
 * Used by the compose UI for live recipient count preview.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VALID_CONDITION_TYPES = new Set([
  'campaign_delivered',
  'campaign_opened',
  'campaign_clicked',
  'segment',
  'engagement_level',
])

const VALID_SEGMENTS = new Set([
  'nieuw', 'in_gesprek', 'leden_maandelijks', 'leden_jaarlijks', 'verloren', 'ex_klant',
])

const VALID_ENGAGEMENT_LEVELS = new Set(['new', 'active', 'at_risk', 'cold'])

// Map condition type to campaign_events event_type
const EVENT_TYPE_MAP: Record<string, string> = {
  campaign_delivered: 'delivered',
  campaign_opened: 'opened',
  campaign_clicked: 'clicked',
}

interface Condition {
  type: string
  campaign_id?: string
  segment?: string
  level?: string
  negated: boolean
}

interface ConditionGroup {
  conditions: Condition[]
}

interface EvaluateRequest {
  groups: ConditionGroup[]
  // Base person IDs to filter from (from segment selection)
  base_person_ids?: string[]
}

function validateCondition(c: Condition): string | null {
  if (!VALID_CONDITION_TYPES.has(c.type)) return `Ongeldig conditietype: ${c.type}`
  if (typeof c.negated !== 'boolean') return 'negated moet een boolean zijn'

  if (c.type.startsWith('campaign_')) {
    if (!c.campaign_id || !UUID_RE.test(c.campaign_id)) return 'campaign_id is verplicht voor campagne-condities'
  }

  if (c.type === 'segment') {
    if (!c.segment || !VALID_SEGMENTS.has(c.segment)) return `Ongeldig segment: ${c.segment}`
  }

  if (c.type === 'engagement_level') {
    if (!c.level || !VALID_ENGAGEMENT_LEVELS.has(c.level)) return `Ongeldig engagement level: ${c.level}`
  }

  return null
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let params: EvaluateRequest
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    params = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { groups, base_person_ids } = params

  if (!Array.isArray(groups) || groups.length === 0) {
    return NextResponse.json({ error: 'Minimaal één conditiegroep vereist' }, { status: 400 })
  }

  if (groups.length > 10) {
    return NextResponse.json({ error: 'Maximaal 10 conditiegroepen' }, { status: 400 })
  }

  // Validate all conditions
  for (const group of groups) {
    if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
      return NextResponse.json({ error: 'Elke groep moet minimaal één conditie bevatten' }, { status: 400 })
    }
    if (group.conditions.length > 10) {
      return NextResponse.json({ error: 'Maximaal 10 condities per groep' }, { status: 400 })
    }
    for (const condition of group.conditions) {
      const err = validateCondition(condition)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
    }
  }

  if (base_person_ids && (!Array.isArray(base_person_ids) || base_person_ids.some(id => !UUID_RE.test(id)))) {
    return NextResponse.json({ error: 'Ongeldige base_person_ids' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Evaluate each group: OR within group (union), AND between groups (intersection)
    const groupResults: Set<string>[] = []

    for (const group of groups) {
      const conditionSets: Set<string>[] = []

      for (const condition of group.conditions) {
        let personIds: Set<string>

        if (condition.type.startsWith('campaign_')) {
          // Query campaign_events for specific event type + campaign
          const eventType = EVENT_TYPE_MAP[condition.type]
          const { data: events } = await supabase
            .from('campaign_events')
            .select('person_id')
            .eq('campaign_id', condition.campaign_id!)
            .eq('event_type', eventType)
            .not('person_id', 'is', null)

          personIds = new Set((events || []).map(e => e.person_id!).filter(Boolean))
        } else if (condition.type === 'engagement_level') {
          // Use the engagement scoring function
          const { data: scores } = await supabase.rpc('get_engagement_scores')
          personIds = new Set(
            (scores || [])
              .filter((s: { engagement_level: string }) => s.engagement_level === condition.level)
              .map((s: { person_id: string }) => s.person_id)
          )
        } else if (condition.type === 'segment') {
          // Segment conditions need people + subscriptions lookup
          // This is handled differently — we return the segment name and the frontend
          // already filters by segment. But for completeness in condition evaluation:
          const { data: people } = await supabase
            .from('people')
            .select('id, pipeline_stage, archived_at, unsubscribed_at, bounced_at, unsubscribe_token')

          const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

          const now = new Date().toISOString().split('T')[0]
          const subMap = new Map<string, string>()
          if (subscriptions) {
            for (const sub of subscriptions) {
              if (sub.cancelled_at || sub.deleted_at) continue
              const graceEnd = sub.grace_ends_at || sub.end_date
              if (graceEnd && graceEnd >= now) {
                subMap.set(sub.person_id, sub.plan)
              }
            }
          }

          personIds = new Set<string>()
          if (people) {
            for (const person of people) {
              if (!person.unsubscribe_token || person.archived_at || person.unsubscribed_at || person.bounced_at) continue
              const stage = person.pipeline_stage
              if (condition.segment === 'leden_maandelijks' && stage === 'gewonnen' && subMap.get(person.id) === 'monthly') {
                personIds.add(person.id)
              } else if (condition.segment === 'leden_jaarlijks' && stage === 'gewonnen' && subMap.get(person.id) === 'yearly') {
                personIds.add(person.id)
              } else if (stage === condition.segment) {
                personIds.add(person.id)
              }
            }
          }
        } else {
          personIds = new Set()
        }

        // Apply negation: if negated, we need the complement relative to base
        if (condition.negated) {
          // Get all eligible person IDs (base set)
          if (!base_person_ids) {
            // Without a base, get all non-archived/non-unsubscribed people
            const { data: allPeople } = await supabase
              .from('people')
              .select('id')
              .is('archived_at', null)
              .is('unsubscribed_at', null)
              .is('bounced_at', null)
              .not('unsubscribe_token', 'is', null)

            const allIds = new Set((allPeople || []).map(p => p.id))
            // Complement: all people NOT in the condition set
            const negated = new Set<string>()
            for (const id of allIds) {
              if (!personIds.has(id)) negated.add(id)
            }
            conditionSets.push(negated)
          } else {
            const baseSet = new Set(base_person_ids)
            const negated = new Set<string>()
            for (const id of baseSet) {
              if (!personIds.has(id)) negated.add(id)
            }
            conditionSets.push(negated)
          }
        } else {
          conditionSets.push(personIds)
        }
      }

      // OR within group = union of all condition sets
      const groupSet = new Set<string>()
      for (const set of conditionSets) {
        for (const id of set) {
          groupSet.add(id)
        }
      }
      groupResults.push(groupSet)
    }

    // AND between groups = intersection of all group sets
    let result: Set<string>
    if (groupResults.length === 0) {
      result = new Set()
    } else {
      result = groupResults[0]
      for (let i = 1; i < groupResults.length; i++) {
        const next = new Set<string>()
        for (const id of result) {
          if (groupResults[i].has(id)) next.add(id)
        }
        result = next
      }
    }

    // If base_person_ids provided, intersect with base
    if (base_person_ids) {
      const baseSet = new Set(base_person_ids)
      const filtered = new Set<string>()
      for (const id of result) {
        if (baseSet.has(id)) filtered.add(id)
      }
      result = filtered
    }

    const personIds = Array.from(result)

    return NextResponse.json({
      count: personIds.length,
      person_ids: personIds,
    })
  } catch (err) {
    console.error('[Conditions] Evaluation error:', err)
    return NextResponse.json({ error: 'Fout bij evalueren condities' }, { status: 500 })
  }
}
