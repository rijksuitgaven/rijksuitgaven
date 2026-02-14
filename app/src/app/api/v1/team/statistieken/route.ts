/**
 * Admin API: Usage Statistics Dashboard (UX-032)
 *
 * GET /api/v1/team/statistieken?days=7
 *
 * Returns aggregated analytics data for the admin dashboard.
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
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const supabase = createAdminClient()

  // Run all queries in parallel
  const [
    pulseResult,
    moduleResult,
    searchResult,
    filterResult,
    columnResult,
    exportResult,
    zeroResult,
    memberCountResult,
  ] = await Promise.all([
    // 1. Pulse: counts per event type + unique actors
    supabase.rpc('get_usage_pulse', { since_date: sinceISO }),

    // 2. Module views: count + unique actors per module
    supabase.rpc('get_usage_modules', { since_date: sinceISO }),

    // 3. Top search terms
    supabase.rpc('get_usage_searches', { since_date: sinceISO, max_results: 15 }),

    // 4. Top filters used
    supabase.rpc('get_usage_filters', { since_date: sinceISO, max_results: 10 }),

    // 5. Top columns selected
    supabase.rpc('get_usage_columns', { since_date: sinceISO, max_results: 10 }),

    // 6. Export breakdown
    supabase.rpc('get_usage_exports', { since_date: sinceISO }),

    // 7. Zero-result searches
    supabase.rpc('get_usage_zero_results', { since_date: sinceISO, max_results: 10 }),

    // 8. Total member count (for "van X leden" context)
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
  ])

  // Check for errors
  const errors = [pulseResult, moduleResult, searchResult, filterResult, columnResult, exportResult, zeroResult].filter(r => r.error)
  if (errors.length > 0) {
    console.error('[Statistics] Query errors:', errors.map(e => e.error?.message))
    return NextResponse.json({ error: 'Fout bij ophalen statistieken' }, { status: 500 })
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
  })
}
