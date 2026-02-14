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
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
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
    memberCountResult,
  ] = await Promise.all([
    supabase.rpc('get_usage_pulse', { since_date: sinceISO }),
    supabase.rpc('get_usage_modules', { since_date: sinceISO }),
    supabase.rpc('get_usage_searches', { since_date: sinceISO, max_results: 15 }),
    supabase.rpc('get_usage_filters', { since_date: sinceISO, max_results: 10 }),
    supabase.rpc('get_usage_columns', { since_date: sinceISO, max_results: 10 }),
    supabase.rpc('get_usage_exports', { since_date: sinceISO }),
    supabase.rpc('get_usage_zero_results', { since_date: sinceISO, max_results: 10 }),
    supabase.rpc('get_usage_actors', { since_date: sinceISO, max_results: 30 }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
  ])

  // Check for errors (actor query is new — don't block if it fails)
  const coreResults = [pulseResult, moduleResult, searchResult, filterResult, columnResult, exportResult, zeroResult]
  const errors = coreResults.filter(r => r.error)
  if (errors.length > 0) {
    console.error('[Statistics] Query errors:', errors.map(e => e.error?.message))
    return NextResponse.json({ error: 'Fout bij ophalen statistieken' }, { status: 500 })
  }

  if (actorResult.error) {
    console.error('[Statistics] Actor query error (non-blocking):', actorResult.error.message)
  }

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
    actors: actorResult.data ?? [],
  })
}
