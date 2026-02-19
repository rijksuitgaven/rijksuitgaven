/**
 * Resend Contact Sync
 *
 * Syncs people to Resend Contacts for email broadcasts.
 * Each contact is assigned to one of 3 segments: leden, churned, prospects.
 * Graceful degradation: sync failures are logged but don't block operations.
 *
 * Uses the new Contacts API (no audienceId — audiences are deprecated).
 * Contacts are created directly and assigned to segments via the `segments` array.
 *
 * Required env vars:
 *   RESEND_API_KEY              — Resend API key (full access)
 *   RESEND_SEGMENT_LEDEN        — Segment ID for active members
 *   RESEND_SEGMENT_CHURNED      — Segment ID for churned members
 *   RESEND_SEGMENT_PROSPECTS    — Segment ID for prospects
 */

import { Resend } from 'resend'
import { createAdminClient } from './supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY

const SEGMENT_IDS = {
  leden: process.env.RESEND_SEGMENT_LEDEN,
  churned: process.env.RESEND_SEGMENT_CHURNED,
  prospects: process.env.RESEND_SEGMENT_PROSPECTS,
} as const

export type ListType = keyof typeof SEGMENT_IDS

interface PersonRow {
  id: string
  email?: string
  first_name?: string | null
  last_name?: string | null
  resend_contact_id?: string | null
}

function isConfigured(): boolean {
  return !!RESEND_API_KEY
}

function segmentsForList(list?: ListType): { id: string }[] | undefined {
  if (!list) return undefined
  const segmentId = SEGMENT_IDS[list]
  return segmentId ? [{ id: segmentId }] : undefined
}

/**
 * Sync a single person to Resend with segment assignment.
 */
export async function syncPersonToResend(
  action: 'create' | 'update' | 'delete',
  person: PersonRow,
  list?: ListType
): Promise<void> {
  if (!isConfigured()) {
    console.warn('[Resend] Missing RESEND_API_KEY — skipping sync')
    return
  }

  const resend = new Resend(RESEND_API_KEY)

  if (action === 'create' && person.email) {
    const { data, error } = await resend.contacts.create({
      email: person.email,
      firstName: person.first_name || undefined,
      lastName: person.last_name || undefined,
      segments: segmentsForList(list),
    })

    if (error) {
      console.error('[Resend] Create contact error:', error)
      return
    }

    if (data?.id) {
      const supabase = createAdminClient()
      await supabase
        .from('people')
        .update({ resend_contact_id: data.id })
        .eq('id', person.id)
    }
  }

  if (action === 'update' && person.resend_contact_id) {
    const { error } = await resend.contacts.update({
      id: person.resend_contact_id,
      firstName: person.first_name || undefined,
      lastName: person.last_name || undefined,
    })

    if (error) {
      console.error('[Resend] Update contact error:', error)
    }
  }

  if (action === 'delete' && person.resend_contact_id) {
    const { error } = await resend.contacts.remove({
      id: person.resend_contact_id,
    })

    if (error) {
      console.error('[Resend] Delete contact error:', error)
    }

    const supabase = createAdminClient()
    await supabase
      .from('people')
      .update({ resend_contact_id: null })
      .eq('id', person.id)
  }
}

/**
 * Compute which list a person belongs to based on their subscription status.
 */
export function computeListType(sub: {
  plan?: string | null
  cancelled_at?: string | null
  deleted_at?: string | null
  end_date?: string | null
  grace_ends_at?: string | null
} | null): ListType {
  if (!sub) return 'prospects'
  if (sub.cancelled_at || sub.deleted_at) return 'churned'

  const now = new Date()
  const endDate = sub.end_date ? new Date(sub.end_date) : null
  const graceEnds = sub.grace_ends_at ? new Date(sub.grace_ends_at) : null
  const effectiveEnd = graceEnds || endDate

  if (effectiveEnd && effectiveEnd < now) return 'churned'

  if (sub.plan === 'monthly' || sub.plan === 'yearly') return 'leden'

  return 'prospects'
}

/**
 * Full backfill: sync ALL people to Resend with correct segments.
 * Returns sync statistics.
 */
export async function backfillResendAudience(): Promise<{
  synced: number
  created: number
  updated: number
  removed: number
  errors: number
  error_messages: string[]
}> {
  if (!isConfigured()) {
    throw new Error('Resend not configured — missing RESEND_API_KEY')
  }

  const supabase = createAdminClient()
  const stats = { synced: 0, created: 0, updated: 0, removed: 0, errors: 0, error_messages: [] as string[] }

  const { data: people, error: fetchError } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, resend_contact_id, archived_at')

  if (fetchError || !people) {
    throw new Error(`Failed to fetch people: ${fetchError?.message}`)
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  const subMap = new Map<string, typeof subscriptions extends (infer T)[] | null ? T : never>()
  if (subscriptions) {
    for (const sub of subscriptions) {
      subMap.set(sub.person_id, sub)
    }
  }

  const resend = new Resend(RESEND_API_KEY)
  const CONCURRENCY = 1  // Resend free plan: 2 req/s — sequential to stay within limit
  const DELAY_MS = 600   // 600ms between requests to stay under 2/s
  const queue = [...people]

  async function processOne(person: NonNullable<typeof people>[number]): Promise<void> {
    try {
      // Archived people should be removed from Resend
      if (person.archived_at) {
        if (person.resend_contact_id) {
          await resend.contacts.remove({ id: person.resend_contact_id })
          await supabase
            .from('people')
            .update({ resend_contact_id: null })
            .eq('id', person.id)
          stats.removed++
        }
        return
      }

      if (!person.email) return

      const sub = subMap.get(person.id) || null
      const list = computeListType(sub)
      const segments = segmentsForList(list)

      if (person.resend_contact_id) {
        const { error: updateError } = await resend.contacts.update({
          id: person.resend_contact_id,
          firstName: person.first_name || undefined,
          lastName: person.last_name || undefined,
        })
        if (updateError) {
          console.error(`[Resend] Update error for ${person.email}:`, updateError)
          stats.error_messages.push(`${person.email}: ${updateError.message || JSON.stringify(updateError)}`)
          stats.errors++
          return
        }
        stats.updated++
      } else {
        const { data, error: createError } = await resend.contacts.create({
          email: person.email,
          firstName: person.first_name || undefined,
          lastName: person.last_name || undefined,
          segments,
        })

        if (createError) {
          console.error(`[Resend] Create error for ${person.email}:`, createError)
          stats.error_messages.push(`${person.email}: ${createError.message || JSON.stringify(createError)}`)
          stats.errors++
          return
        }

        if (data?.id) {
          await supabase
            .from('people')
            .update({ resend_contact_id: data.id })
            .eq('id', person.id)
          stats.created++
        }
      }
      stats.synced++
    } catch (err) {
      console.error(`[Resend] Sync error for person ${person.id}:`, err)
      stats.error_messages.push(`${person.email}: ${err instanceof Error ? err.message : String(err)}`)
      stats.errors++
    }
  }

  for (const person of queue) {
    await processOne(person)
    await new Promise(resolve => setTimeout(resolve, DELAY_MS))
  }

  return stats
}
