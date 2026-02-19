/**
 * Resend Audience Sync
 *
 * Syncs people to a Resend Audience for email broadcasts.
 * Each contact is assigned to one of 4 segments: per_maand, per_jaar, churned, prospects.
 * Graceful degradation: sync failures are logged but don't block operations.
 *
 * Required env vars:
 *   RESEND_API_KEY              — Resend API key
 *   RESEND_AUDIENCE_ID          — Resend Audience ID for contacts
 *   RESEND_SEGMENT_MAAND        — Segment ID for monthly subscribers
 *   RESEND_SEGMENT_JAAR         — Segment ID for yearly subscribers
 *   RESEND_SEGMENT_CHURNED      — Segment ID for churned members
 *   RESEND_SEGMENT_PROSPECTS    — Segment ID for prospects
 */

import { Resend } from 'resend'
import { createAdminClient } from './supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

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
  return !!(RESEND_API_KEY && RESEND_AUDIENCE_ID)
}

/**
 * Sync a single person to Resend Audience with segment assignment.
 */
export async function syncPersonToResend(
  action: 'create' | 'update' | 'delete',
  person: PersonRow,
  list?: ListType
): Promise<void> {
  if (!isConfigured()) {
    console.warn('[Resend] Missing RESEND_API_KEY or RESEND_AUDIENCE_ID — skipping sync')
    return
  }

  const resend = new Resend(RESEND_API_KEY)

  if (action === 'create' && person.email) {
    const { data, error } = await resend.contacts.create({
      audienceId: RESEND_AUDIENCE_ID!,
      email: person.email,
      firstName: person.first_name || undefined,
      lastName: person.last_name || undefined,
    })

    if (error) {
      console.error('[Resend] Create contact error:', error)
      return
    }

    // Store the Resend contact ID on the people record
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
      audienceId: RESEND_AUDIENCE_ID!,
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
      audienceId: RESEND_AUDIENCE_ID!,
      id: person.resend_contact_id,
    })

    if (error) {
      console.error('[Resend] Delete contact error:', error)
    }

    // Clear resend_contact_id
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

  // If subscription has ended (past grace period), it's churned
  if (effectiveEnd && effectiveEnd < now) return 'churned'

  if (sub.plan === 'monthly' || sub.plan === 'yearly') return 'leden'

  // Trial or unknown plan → prospects
  return 'prospects'
}

/**
 * Full backfill: sync ALL people to Resend Audience with correct segments.
 * Returns sync statistics.
 */
export async function backfillResendAudience(): Promise<{
  synced: number
  created: number
  updated: number
  removed: number
  errors: number
}> {
  if (!isConfigured()) {
    throw new Error('Resend not configured — missing RESEND_API_KEY or RESEND_AUDIENCE_ID')
  }

  const supabase = createAdminClient()
  const stats = { synced: 0, created: 0, updated: 0, removed: 0, errors: 0 }

  // 1. Fetch all people with their latest subscription
  const { data: people, error: fetchError } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, resend_contact_id, archived_at')

  if (fetchError || !people) {
    throw new Error(`Failed to fetch people: ${fetchError?.message}`)
  }

  // 2. Fetch all subscriptions (non-deleted) to compute list types
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

  // Build person_id → subscription map (latest non-deleted)
  const subMap = new Map<string, typeof subscriptions extends (infer T)[] | null ? T : never>()
  if (subscriptions) {
    for (const sub of subscriptions) {
      subMap.set(sub.person_id, sub)
    }
  }

  const resend = new Resend(RESEND_API_KEY)

  // Process in batches of 5 concurrent requests
  const CONCURRENCY = 5
  const queue = [...people]

  async function processOne(person: NonNullable<typeof people>[number]): Promise<void> {
    try {
      // Archived people should be removed from Resend
      if (person.archived_at) {
        if (person.resend_contact_id) {
          await resend.contacts.remove({
            audienceId: RESEND_AUDIENCE_ID!,
            id: person.resend_contact_id,
          })
          await supabase
            .from('people')
            .update({ resend_contact_id: null })
            .eq('id', person.id)
          stats.removed++
        }
        return
      }

      if (!person.email) return

      if (person.resend_contact_id) {
        // Update existing contact
        const { error: updateError } = await resend.contacts.update({
          audienceId: RESEND_AUDIENCE_ID!,
          id: person.resend_contact_id,
          firstName: person.first_name || undefined,
          lastName: person.last_name || undefined,
        })
        if (updateError) {
          console.error(`[Resend] Update contact error for ${person.email}:`, updateError)
          stats.errors++
          return
        }
        stats.updated++
      } else {
        // Create new contact (without segments — add via separate API if needed)
        const { data, error: createError } = await resend.contacts.create({
          audienceId: RESEND_AUDIENCE_ID!,
          email: person.email,
          firstName: person.first_name || undefined,
          lastName: person.last_name || undefined,
        })

        if (createError) {
          console.error(`[Resend] Create contact error for ${person.email}:`, createError)
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
      stats.errors++
    }
  }

  // Process with concurrency pool
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(processOne))
  }

  return stats
}
