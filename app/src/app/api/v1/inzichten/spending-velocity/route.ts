/**
 * Inzichten Spending Velocity API — YoY% change heatmap
 *
 * Returns a grid of year-over-year percentage changes per entity,
 * for use in an acceleration/deceleration heatmap.
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
const YEAR_PAIRS = YEARS.slice(1).map((y, i) => ({ from: YEARS[i], to: y, label: `${YEARS[i]}→${y}` }))

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const level = searchParams.get('level') || 'ministry' // 'ministry' or 'recipient'
  const top = Math.min(parseInt(searchParams.get('top') || '20'), 50)
  const minChange = parseInt(searchParams.get('min_change') || '100000') // Minimum absolute change

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

    // Group by the requested level
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

    // Sort by total, take top-N
    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b.totaal - a.totaal)
      .slice(0, top)

    // Compute YoY % changes per entity per year-pair
    const entities = sorted.map(([name, data]) => {
      const changes = YEAR_PAIRS.map(pair => {
        const fromVal = data[String(pair.from)] || 0
        const toVal = data[String(pair.to)] || 0
        const absChange = toVal - fromVal

        // Skip if base is near zero or change is below threshold
        if (Math.abs(fromVal) < 1000 || Math.abs(absChange) < minChange) {
          return { pair: pair.label, pct_change: null, abs_change: absChange, from: fromVal, to: toVal }
        }

        const pctChange = ((toVal - fromVal) / Math.abs(fromVal)) * 100
        // Cap at ±200% for visual sanity
        const capped = Math.max(-200, Math.min(200, pctChange))

        return {
          pair: pair.label,
          pct_change: Math.round(capped * 10) / 10,
          abs_change: Math.round(absChange),
          from: fromVal,
          to: toVal,
        }
      })

      return {
        name,
        total: data.totaal,
        latest: data['2024'],
        changes,
      }
    })

    return NextResponse.json({
      module,
      level,
      top,
      year_pairs: YEAR_PAIRS.map(p => p.label),
      entities,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${config.view}`,
        note: `YoY % verandering per ${level === 'ministry' ? 'ministerie' : 'ontvanger'}. Begrensd op ±200%. Veranderingen <€${(minChange/1000).toFixed(0)}K uitgesloten.`,
      },
    })
  } catch (error) {
    console.error('Spending velocity error:', error)
    return NextResponse.json({ error: 'Failed to compute velocity data' }, { status: 500 })
  }
}
