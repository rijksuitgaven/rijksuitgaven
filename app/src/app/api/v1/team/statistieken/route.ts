/**
 * Admin API: Usage Statistics Dashboard (UX-032)
 *
 * GET /api/v1/team/statistieken?days=7
 *   Returns aggregated analytics data for the admin dashboard.
 *
 * GET /api/v1/team/statistieken?days=7&actor=abc123
 *   Returns detail events for a specific pseudonymized actor.
 *
 * All queries use service_role to bypass RLS.
 * Actor de-anonymization: hashes subscription user_ids to match actor_hash.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createHash } from 'crypto'

const HASH_SECRET = process.env.ANALYTICS_HASH_SECRET || 'rijksuitgaven-analytics-default-secret'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

function hashUserId(userId: string): string {
  return createHash('sha256')
    .update(userId + HASH_SECRET)
    .digest('hex')
    .substring(0, 16)
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 365)
  const actor = searchParams.get('actor')

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const supabase = createAdminClient()

  // Actor detail mode: return events for a specific actor
  if (actor) {
    // Validate actor hash format (16 hex chars)
    if (!/^[a-f0-9]{16}$/.test(actor)) {
      return NextResponse.json({ error: 'Ongeldig actor formaat' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('get_usage_actor_detail', {
      target_actor: actor,
      since_date: sinceISO,
    })

    if (error) {
      console.error('[Statistics] Actor detail error:', error.message)
      return NextResponse.json({ error: 'Fout bij ophalen gebruikersdetail' }, { status: 500 })
    }

    return NextResponse.json({ events: data ?? [] })
  }

  // Dashboard mode: run all queries in parallel
  const [
    pulseResult,
    moduleResult,
    searchResult,
    filterResult,
    columnResult,
    exportResult,
    zeroResult,
    actorResult,
    errorResult,
    memberCountResult,
    sessionsResult,
    exitIntentResult,
    searchSuccessResult,
    retentionResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabase.rpc('get_usage_pulse', { since_date: sinceISO }),
    supabase.rpc('get_usage_modules', { since_date: sinceISO }),
    supabase.rpc('get_usage_searches', { since_date: sinceISO, max_results: 15 }),
    supabase.rpc('get_usage_filters', { since_date: sinceISO, max_results: 30 }),
    supabase.rpc('get_usage_columns', { since_date: sinceISO, max_results: 30 }),
    supabase.rpc('get_usage_exports', { since_date: sinceISO }),
    supabase.rpc('get_usage_zero_results', { since_date: sinceISO, max_results: 10 }),
    supabase.rpc('get_usage_actors', { since_date: sinceISO, max_results: 30 }),
    supabase.rpc('get_usage_errors', { since_date: sinceISO, max_results: 20 }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).is('cancelled_at', null).is('deleted_at', null),
    // New V3 analytics
    supabase.rpc('get_usage_sessions_summary', { since_date: sinceISO }),
    supabase.rpc('get_usage_exit_intent', { since_date: sinceISO, max_results: 10 }),
    supabase.rpc('get_usage_search_success', { since_date: sinceISO }),
    supabase.rpc('get_usage_retention', { since_date: sinceISO }),
    // Fetch all subscriptions with person data for de-anonymization
    supabase.from('subscriptions').select('user_id, people!inner(first_name, last_name, email)'),
  ])

  // Check for errors (core queries block, new queries don't)
  const coreResults = [pulseResult, moduleResult, searchResult, filterResult, columnResult, exportResult, zeroResult]
  const errors = coreResults.filter(r => r.error)
  if (errors.length > 0) {
    console.error('[Statistics] Query errors:', errors.map(e => e.error?.message))
    return NextResponse.json({ error: 'Fout bij ophalen statistieken' }, { status: 500 })
  }

  if (actorResult.error) {
    console.error('[Statistics] Actor query error (non-blocking):', actorResult.error.message)
  }
  if (errorResult.error) {
    console.error('[Statistics] Error query error (non-blocking):', errorResult.error.message)
  }
  if (sessionsResult.error) {
    console.error('[Statistics] Sessions query error (non-blocking):', sessionsResult.error.message)
  }
  if (exitIntentResult.error) {
    console.error('[Statistics] Exit intent query error (non-blocking):', exitIntentResult.error.message)
  }
  if (searchSuccessResult.error) {
    console.error('[Statistics] Search success query error (non-blocking):', searchSuccessResult.error.message)
  }
  if (retentionResult.error) {
    console.error('[Statistics] Retention query error (non-blocking):', retentionResult.error.message)
  }

  // De-anonymize actors: hash each subscription user_id and match to actor_hash
  const hashToUser = new Map<string, { name: string; email: string }>()
  if (subscriptionsResult.data) {
    for (const sub of subscriptionsResult.data) {
      if (sub.user_id) {
        const hash = hashUserId(sub.user_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (sub as any).people as { first_name: string | null; last_name: string | null; email: string }
        hashToUser.set(hash, {
          name: [p.first_name, p.last_name].filter(Boolean).join(' '),
          email: p.email || '',
        })
      }
    }
  }

  // Enrich actors with real names
  const actors = (actorResult.data ?? []).map((actor: Record<string, unknown>) => ({
    ...actor,
    user_name: hashToUser.get(actor.actor_hash as string)?.name || null,
    user_email: hashToUser.get(actor.actor_hash as string)?.email || null,
  }))

  // Sessions summary (single row or empty)
  const sessionsSummary = sessionsResult.data?.[0] ?? null

  // Search success (single row or empty)
  const searchSuccess = searchSuccessResult.data?.[0] ?? null

  return NextResponse.json({
    days,
    total_members: memberCountResult.count ?? 0,
    pulse: pulseResult.data ?? [],
    modules: moduleResult.data ?? [],
    searches: searchResult.data ?? [],
    filters: filterResult.data ?? [],
    columns: columnResult.data ?? [],
    exports: exportResult.data ?? [],
    zero_results: zeroResult.data ?? [],
    actors,
    errors: errorResult.data ?? [],
    // New V3 analytics
    sessions_summary: sessionsSummary,
    exit_intent: exitIntentResult.data ?? [],
    search_success: searchSuccess,
    retention: retentionResult.data ?? [],
  })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const createdAt = searchParams.get('created_at')

  let query = supabase
    .from('usage_events')
    .delete()
    .eq('event_type', 'error')

  if (createdAt) {
    query = query.eq('created_at', createdAt)
  }

  const { error } = await query

  if (error) {
    console.error('[Statistics] Clear errors failed:', error.message)
    return NextResponse.json({ error: 'Fout bij wissen' }, { status: 500 })
  }

  return NextResponse.json({ cleared: true })
}
