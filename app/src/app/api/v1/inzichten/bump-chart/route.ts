/**
 * Inzichten Bump Chart API — Ranking changes over time
 *
 * Returns rank positions per year for top entities.
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

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const level = searchParams.get('level') || 'ministry'
  const topN = Math.min(parseInt(searchParams.get('top') || '15'), 25)

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
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

    // Group by requested level
    const groupField = level === 'ministry' && config.group ? config.group : config.primary
    const grouped: Record<string, Record<string, number>> = {}

    for (const row of rows) {
      const key = String(row[groupField] || 'Onbekend')
      if (!grouped[key]) {
        grouped[key] = {}
        for (const y of YEARS) grouped[key][String(y)] = 0
        grouped[key].totaal = 0
      }
      for (const y of YEARS) {
        grouped[key][String(y)] += Number(row[String(y)]) || 0
      }
      grouped[key].totaal += Number(row.totaal) || 0
    }

    // Get top N by total
    const topEntities = Object.entries(grouped)
      .sort(([, a], [, b]) => b.totaal - a.totaal)
      .slice(0, topN)
      .map(([name]) => name)

    // Compute ranks per year
    const series = topEntities.map(name => {
      const ranks: { year: number; rank: number; value: number }[] = []

      for (const year of YEARS) {
        // Rank all entities for this year
        const yearValues = Object.entries(grouped)
          .map(([n, d]) => ({ name: n, value: d[String(year)] || 0 }))
          .filter(e => e.value > 0)
          .sort((a, b) => b.value - a.value)

        const idx = yearValues.findIndex(e => e.name === name)
        ranks.push({
          year,
          rank: idx >= 0 ? idx + 1 : topN + 1,
          value: grouped[name][String(year)] || 0,
        })
      }

      return { name, ranks, total: grouped[name].totaal }
    })

    return NextResponse.json({
      module,
      level,
      years: YEARS,
      series,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: config.view,
        note: `Top ${topN} ${level === 'ministry' ? 'ministeries' : 'ontvangers'} gerangschikt per jaar.`,
      },
    })
  } catch (error) {
    console.error('Bump chart error:', error)
    return NextResponse.json({ error: 'Failed to compute bump chart data' }, { status: 500 })
  }
}
