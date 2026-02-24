/**
 * Inzichten Cross-Module API — Organizations appearing in multiple modules
 *
 * Uses universal_search (which already has source_count and sources columns)
 * to find organizations with multi-module presence.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const minSources = Math.max(2, parseInt(searchParams.get('min_sources') || '3'))
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('universal_search')
      .select('ontvanger, sources, source_count, record_count, "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", totaal, years_with_data')
      .gte('source_count', minSources)
      .order('source_count', { ascending: false })
      .order('totaal', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Group by source_count for ring summary
    const ringCounts: Record<number, number> = {}
    const ringTotals: Record<number, number> = {}

    for (const row of data || []) {
      const sc = Number(row.source_count)
      ringCounts[sc] = (ringCounts[sc] || 0) + 1
      ringTotals[sc] = (ringTotals[sc] || 0) + (Number(row.totaal) || 0)
    }

    // Get total counts for each source_count level (even beyond the limit)
    const { data: countData } = await supabase
      .from('universal_search')
      .select('source_count')
      .gte('source_count', 2)
      .order('source_count', { ascending: false })
      .limit(50000)

    const fullRingCounts: Record<number, number> = {}
    for (const row of countData || []) {
      const sc = Number(row.source_count)
      fullRingCounts[sc] = (fullRingCounts[sc] || 0) + 1
    }

    const entities = (data || []).map(row => ({
      name: row.ontvanger,
      sources: row.sources,
      source_count: Number(row.source_count),
      record_count: Number(row.record_count),
      totaal: Number(row.totaal),
      years_with_data: Number(row.years_with_data),
      per_year: {
        '2016': Number(row['2016']) || 0,
        '2017': Number(row['2017']) || 0,
        '2018': Number(row['2018']) || 0,
        '2019': Number(row['2019']) || 0,
        '2020': Number(row['2020']) || 0,
        '2021': Number(row['2021']) || 0,
        '2022': Number(row['2022']) || 0,
        '2023': Number(row['2023']) || 0,
        '2024': Number(row['2024']) || 0,
      },
    }))

    return NextResponse.json({
      min_sources: minSources,
      entities,
      ring_summary: fullRingCounts,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'universal_search (5 modules, excl. apparaat)',
        amount_unit: 'EUR',
        note: 'Op basis van naamherkenning. Sommige organisaties kunnen onder meerdere namen voorkomen.',
      },
    })
  } catch (error) {
    console.error('Cross-module error:', error)
    return NextResponse.json({ error: 'Failed to compute cross-module data' }, { status: 500 })
  }
}
