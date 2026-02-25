/**
 * Inzichten Leaderboard API — Ranked recipient list per module
 *
 * Returns top-N recipients sorted by amount for a given year/module,
 * with optional entity highlight for contextual comparison.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const MODULE_VIEWS: Record<string, { view: string; primary: string }> = {
  instrumenten: { view: 'instrumenten_aggregated', primary: 'ontvanger' },
  apparaat: { view: 'apparaat_aggregated', primary: 'kostensoort' },
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
  const year = searchParams.get('year') || 'totaal'
  const top = Math.min(parseInt(searchParams.get('top') || '25'), 100)
  const highlight = searchParams.get('highlight') || ''

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const sortColumn = year === 'totaal' ? 'totaal' : `"${year}"`

  try {
    // Fetch top-N by the selected year/total
    const yearColumns = YEARS.map(y => `"${y}"`).join(', ')
    const { data: rawData, error } = await supabase
      .from(config.view)
      .select(`${config.primary}, ${yearColumns}, totaal`)
      .gt(year === 'totaal' ? 'totaal' : year, 0)
      .order(year === 'totaal' ? 'totaal' : year, { ascending: false })
      .limit(top)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Get total count for context ("Top N van X")
    const { count, error: countError } = await supabase
      .from(config.view)
      .select('*', { count: 'exact', head: true })
      .gt(year === 'totaal' ? 'totaal' : year, 0)

    if (countError) throw countError

    // Format entries
    const entries = rows.map((row, idx) => {
      const sparkline = YEARS.map(y => ({
        year: y,
        value: Number(row[String(y)]) || 0,
      }))

      return {
        rank: idx + 1,
        name: String(row[config.primary] || ''),
        amount: Number(row[year === 'totaal' ? 'totaal' : year]) || 0,
        total: Number(row.totaal) || 0,
        sparkline,
      }
    })

    // If highlight entity is not in top-N, find its position
    let highlightEntry = null
    if (highlight) {
      const existing = entries.find(e => e.name.toLowerCase() === highlight.toLowerCase())
      if (existing) {
        highlightEntry = { ...existing, in_top: true }
      } else {
        // Find the highlighted entity separately
        const { data: hlData } = await supabase
          .from(config.view)
          .select(`${config.primary}, ${yearColumns}, totaal`)
          .ilike(config.primary, `%${highlight}%`)
          .limit(1)

        if (hlData && hlData.length > 0) {
          const hlRow = hlData[0] as unknown as Record<string, unknown>
          const hlAmount = Number(hlRow[year === 'totaal' ? 'totaal' : year]) || 0

          // Approximate rank
          const { count: aboveCount } = await supabase
            .from(config.view)
            .select('*', { count: 'exact', head: true })
            .gt(year === 'totaal' ? 'totaal' : year, hlAmount)

          highlightEntry = {
            rank: (aboveCount || 0) + 1,
            name: String(hlRow[config.primary] || ''),
            amount: hlAmount,
            total: Number(hlRow.totaal) || 0,
            sparkline: YEARS.map(y => ({
              year: y,
              value: Number(hlRow[String(y)]) || 0,
            })),
            in_top: false,
          }
        }
      }
    }

    return NextResponse.json({
      module,
      year,
      top,
      total_count: count || 0,
      entries,
      highlight: highlightEntry,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${config.view}`,
        note: year === 'totaal'
          ? 'Cumulatief 2016–2024. Negatieve bedragen uitgesloten.'
          : `Alleen jaar ${year}. Negatieve bedragen uitgesloten.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to compute leaderboard data' }, { status: 500 })
  }
}
