/**
 * Share API: Create shared link
 *
 * POST /api/v1/share — Store current view state, return shareable token.
 * Deduplicates: if the same user already shared the same module+search+sort+filters,
 * returns the existing token instead of creating a new row.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/app/api/_lib/auth'
import { csrfCheck } from '@/app/api/_lib/auth'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const VALID_MODULES = new Set([
  'instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek', 'integraal',
])

const MAX_COLUMNS = 50
const MAX_FILTERS_SIZE = 10_000

export async function POST(request: NextRequest) {
  const csrfError = csrfCheck(request)
  if (csrfError) return csrfError

  const auth = await getAuthenticatedUser()
  if (!auth) return unauthorizedResponse()

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const module = body.module as string
  if (!module || !VALID_MODULES.has(module)) {
    return NextResponse.json({ error: 'Ongeldig module' }, { status: 400 })
  }

  const search = typeof body.search === 'string' ? body.search.slice(0, 200) : null
  const filters = body.filters && typeof body.filters === 'object' ? body.filters : {}
  const filtersStr = JSON.stringify(filters)
  if (filtersStr.length > MAX_FILTERS_SIZE) {
    return NextResponse.json({ error: 'Filters te groot' }, { status: 400 })
  }

  const sort_by = typeof body.sort_by === 'string' ? body.sort_by.slice(0, 50) : 'totaal'
  const sort_order = body.sort_order === 'asc' ? 'asc' : 'desc'
  const columns = Array.isArray(body.columns)
    ? (body.columns as string[]).filter(c => typeof c === 'string').slice(0, MAX_COLUMNS)
    : []
  const expanded = typeof body.expanded === 'string' ? body.expanded.slice(0, 200) : null
  const expanded_grouping = typeof body.expanded_grouping === 'string'
    ? body.expanded_grouping.slice(0, 50)
    : null
  const expanded_columns = Array.isArray(body.expanded_columns)
    ? (body.expanded_columns as string[]).filter(c => typeof c === 'string').slice(0, MAX_COLUMNS)
    : null

  const supabase = createAdminClient()
  const userId = auth.user.id

  // Dedup: find existing active link with same module+search+sort+filters
  const { data: candidates } = await supabase
    .from('shared_links')
    .select('token, search, filters')
    .eq('created_by', userId)
    .eq('module', module)
    .eq('sort_by', sort_by)
    .eq('sort_order', sort_order)
    .is('deleted_at', null)
    .limit(50)

  const dedupMatch = candidates?.find(c =>
    (c.search ?? null) === (search ?? null) &&
    JSON.stringify(c.filters) === filtersStr
  )

  if (dedupMatch) {
    return NextResponse.json({ token: dedupMatch.token })
  }

  const { data: created, error } = await supabase
    .from('shared_links')
    .insert({
      created_by: userId,
      module,
      search,
      filters,
      sort_by,
      sort_order,
      columns,
      expanded,
      expanded_grouping,
      expanded_columns,
    })
    .select('token')
    .single()

  if (error) {
    console.error('[Share] Create error:', error)
    return NextResponse.json({ error: 'Fout bij aanmaken deellink', debug: error.message }, { status: 500 })
  }

  return NextResponse.json({ token: created.token }, { status: 201 })
}
