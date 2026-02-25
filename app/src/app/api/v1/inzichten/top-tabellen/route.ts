/**
 * Inzichten Top Tabellen API — Ranked tables by dimension
 *
 * Aggregates instrumenten_aggregated by a chosen dimension
 * (begrotingsnaam, ontvanger, instrument, regeling) and returns
 * ranked results with position changes vs previous year.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const VALID_DIMENSIONS = ['begrotingsnaam', 'ontvanger', 'instrument', 'regeling'] as const

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dimension = searchParams.get('dimension') || 'ontvanger'
  const year = searchParams.get('year') || '2024'
  const top = Math.min(parseInt(searchParams.get('top') || '50'), 100)
  const mode = searchParams.get('mode') || 'year' // 'year' or 'cumulative'

  if (!VALID_DIMENSIONS.includes(dimension as typeof VALID_DIMENSIONS[number])) {
    return NextResponse.json({ error: `Invalid dimension: ${dimension}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    // Fetch all rows with the dimension field + year columns
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`${dimension}, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Aggregate by dimension
    const grouped: Record<string, { years: Record<string, number>; count: number; totaal: number }> = {}

    for (const row of rows) {
      const key = String(row[dimension] || 'Onbekend')
      if (!grouped[key]) {
        grouped[key] = { years: {}, count: 0, totaal: 0 }
        for (const y of YEARS) grouped[key].years[String(y)] = 0
      }
      grouped[key].count++
      grouped[key].totaal += Number(row.totaal) || 0
      for (const y of YEARS) {
        grouped[key].years[String(y)] += Number(row[String(y)]) || 0
      }
    }

    // Determine sort column
    const yearCol = mode === 'cumulative' ? 'totaal' : year

    // Build ranked entries for current period
    const entries = Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        amount: mode === 'cumulative' ? data.totaal : (data.years[yearCol] || 0),
        count: data.count,
        totaal: data.totaal,
        years: data.years,
      }))
      .filter(e => e.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, top)
      .map((e, idx) => ({ ...e, rank: idx + 1 }))

    // Compute previous year ranks for position change
    let prevYearRanks: Record<string, number> = {}
    if (mode === 'year' && year !== '2016') {
      const prevYear = String(parseInt(year) - 1)
      const prevEntries = Object.entries(grouped)
        .map(([name, data]) => ({
          name,
          amount: data.years[prevYear] || 0,
        }))
        .filter(e => e.amount > 0)
        .sort((a, b) => b.amount - a.amount)

      prevEntries.forEach((e, idx) => {
        prevYearRanks[e.name] = idx + 1
      })
    }

    // Attach position changes
    const enrichedEntries = entries.map(e => ({
      rank: e.rank,
      name: e.name,
      amount: e.amount,
      count: e.count,
      totaal: e.totaal,
      prev_rank: prevYearRanks[e.name] || null,
      rank_change: prevYearRanks[e.name] ? prevYearRanks[e.name] - e.rank : null,
      sparkline: YEARS.map(y => ({ year: y, value: e.years[String(y)] })),
    }))

    // Grand totals
    const grandTotal = Object.values(grouped).reduce((s, g) =>
      s + (mode === 'cumulative' ? g.totaal : (g.years[yearCol] || 0)), 0
    )
    const totalEntities = Object.values(grouped).filter(g =>
      mode === 'cumulative' ? g.totaal > 0 : (g.years[yearCol] || 0) > 0
    ).length

    // Dimension labels
    const dimensionLabels: Record<string, string> = {
      begrotingsnaam: 'Begroting',
      ontvanger: 'Ontvanger',
      instrument: 'Instrument',
      regeling: 'Regeling',
    }

    return NextResponse.json({
      dimension,
      dimension_label: dimensionLabels[dimension] || dimension,
      year: mode === 'cumulative' ? 'totaal' : year,
      mode,
      top,
      entries: enrichedEntries,
      total_entities: totalEntities,
      grand_total: grandTotal,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Top ${top} ${dimensionLabels[dimension] || dimension} ${mode === 'cumulative' ? '(cumulatief 2016–2024)' : `in ${year}`}. Positie(vorig jaar) toont verandering t.o.v. ${mode === 'cumulative' ? 'n.v.t.' : parseInt(year) - 1}.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Top tabellen error:', error)
    return NextResponse.json({ error: 'Failed to compute ranking data' }, { status: 500 })
  }
}
