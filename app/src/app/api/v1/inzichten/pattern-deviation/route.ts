/**
 * Inzichten Pattern Deviation API — Statistical variance proxy
 *
 * Computes rolling 3-year average as baseline, compares to actual spending.
 * Shows which entities deviated most from their own historical pattern.
 * NOT budget vs actual — honest proxy using historical averages.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const MODULE_VIEWS: Record<string, { view: string; primary: string; group?: string }> = {
  instrumenten: { view: 'instrumenten_aggregated', primary: 'ontvanger', group: 'begrotingsnaam' },
  apparaat: { view: 'apparaat_aggregated', primary: 'kostensoort', group: 'begrotingsnaam' },
  inkoop: { view: 'inkoop_aggregated', primary: 'leverancier' },
  provincie: { view: 'provincie_aggregated', primary: 'ontvanger' },
  gemeente: { view: 'gemeente_aggregated', primary: 'ontvanger' },
  publiek: { view: 'publiek_aggregated', primary: 'ontvanger' },
}

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
// First usable year is 2019 (avg of 2016, 2017, 2018)
const DEVIATION_YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const year = parseInt(searchParams.get('year') || '2024')
  const level = searchParams.get('level') || 'ministry'
  const top = Math.min(parseInt(searchParams.get('top') || '20'), 50)

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  if (!DEVIATION_YEARS.includes(year)) {
    return NextResponse.json({ error: `Year must be 2019-2024 (need 3 prior years for rolling average)` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from(config.view)
      .select(`${config.primary}${config.group ? `, ${config.group}` : ''}, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Group by level
    const groupField = level === 'ministry' && config.group ? config.group : config.primary
    const grouped: Record<string, Record<string, number>> = {}

    for (const row of rows) {
      const key = String(row[groupField] || 'Onbekend')
      if (!grouped[key]) {
        grouped[key] = {}
        for (const y of YEARS) grouped[key][String(y)] = 0
      }
      for (const y of YEARS) {
        grouped[key][String(y)] += Number(row[String(y)]) || 0
      }
    }

    // Compute rolling 3-year average and deviation for each entity
    const deviations = Object.entries(grouped).map(([name, data]) => {
      // Rolling 3-year avg for the target year
      const yearIdx = YEARS.indexOf(year)
      const prior3 = [
        data[String(YEARS[yearIdx - 3])] || 0,
        data[String(YEARS[yearIdx - 2])] || 0,
        data[String(YEARS[yearIdx - 1])] || 0,
      ]
      const expected = prior3.reduce((s, v) => s + v, 0) / 3
      const actual = data[String(year)] || 0
      const deviation = actual - expected
      const deviationPct = expected > 0 ? (deviation / expected) * 100 : 0

      // Full deviation history for heatmap
      const history = DEVIATION_YEARS.map(y => {
        const yIdx = YEARS.indexOf(y)
        const p3 = [
          data[String(YEARS[yIdx - 3])] || 0,
          data[String(YEARS[yIdx - 2])] || 0,
          data[String(YEARS[yIdx - 1])] || 0,
        ]
        const exp = p3.reduce((s, v) => s + v, 0) / 3
        const act = data[String(y)] || 0
        const dev = act - exp
        return {
          year: y,
          actual: act,
          expected: Math.round(exp),
          deviation: Math.round(dev),
          deviation_pct: exp > 0 ? Math.round((dev / exp) * 100 * 10) / 10 : 0,
        }
      })

      return {
        name,
        actual,
        expected: Math.round(expected),
        deviation: Math.round(deviation),
        deviation_pct: Math.round(deviationPct * 10) / 10,
        abs_deviation: Math.abs(deviation),
        history,
      }
    })

    // Filter out entities with insufficient history (expected near zero)
    const meaningful = deviations.filter(d => d.expected > 100000) // At least €100K expected

    // Sort by absolute deviation, take top-N
    const topDeviators = meaningful
      .sort((a, b) => b.abs_deviation - a.abs_deviation)
      .slice(0, top)

    // Summary
    const positiveDeviations = topDeviators.filter(d => d.deviation > 0)
    const negativeDeviations = topDeviators.filter(d => d.deviation < 0)

    return NextResponse.json({
      module,
      year,
      level,
      deviators: topDeviators,
      summary: {
        total_analyzed: meaningful.length,
        above_pattern: positiveDeviations.length,
        below_pattern: negativeDeviations.length,
        total_above: positiveDeviations.reduce((s, d) => s + d.deviation, 0),
        total_below: negativeDeviations.reduce((s, d) => s + d.deviation, 0),
      },
      deviation_years: DEVIATION_YEARS,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${config.view}`,
        note: `Verwachting berekend op basis van 3-jarig voortschrijdend gemiddelde. Entiteiten met verwachting <€100K uitgesloten. Dit is GEEN begrotingsafwijking.${year === 2024 ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Pattern deviation error:', error)
    return NextResponse.json({ error: 'Failed to compute deviation data' }, { status: 500 })
  }
}
