/**
 * Inzichten Head-to-Head API — Entity comparison radar
 *
 * Returns normalized (0-100 percentile) scores across 6 dimensions
 * for 2-3 entities, plus absolute values for the comparison table.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const entitiesParam = searchParams.get('entities') || ''

  const entityNames = entitiesParam.split(',').map(e => e.trim()).filter(Boolean).slice(0, 3)
  if (entityNames.length === 0) {
    return NextResponse.json({ error: 'No entities specified' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    // Get universal_search data for cross-module presence
    const { data: usData, error: usError } = await supabase
      .from('universal_search')
      .select(`ontvanger, source_count, sources, ${yearColumns}, totaal`)
      .in('ontvanger', entityNames)

    if (usError) throw usError
    const usRows = (usData || []) as unknown as Record<string, unknown>[]

    // Get all entities for percentile computation (sample)
    const { data: allData, error: allError } = await supabase
      .from('universal_search')
      .select(`ontvanger, source_count, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (allError) throw allError
    const allRows = (allData || []) as unknown as Record<string, unknown>[]

    // Compute distributions for percentile ranking
    const allTotals = allRows.map(r => Number(r.totaal) || 0).sort((a, b) => a - b)
    const allSourceCounts = allRows.map(r => Number(r.source_count) || 0).sort((a, b) => a - b)

    // Growth: (2024 - 2021) / 2021 * 100 (3-year growth)
    const allGrowths = allRows
      .map(r => {
        const base = Number(r['2021']) || 0
        const latest = Number(r['2024']) || 0
        return base > 0 ? ((latest - base) / base) * 100 : 0
      })
      .filter(g => g !== 0)
      .sort((a, b) => a - b)

    // Years active: count non-zero years
    const allYearsActive = allRows
      .map(r => YEARS.filter(y => (Number(r[String(y)]) || 0) > 0).length)
      .sort((a, b) => a - b)

    function percentile(sorted: number[], value: number): number {
      if (sorted.length === 0) return 50
      const idx = sorted.findIndex(v => v >= value)
      if (idx === -1) return 100
      return Math.round((idx / sorted.length) * 100)
    }

    // Build entity profiles
    const entities = entityNames.map(name => {
      const row = usRows.find(r => String(r.ontvanger) === name)
      if (!row) {
        return {
          name,
          found: false,
          scores: { total: 0, growth: 0, modules: 0, stability: 0, average: 0, concentration: 0 },
          absolute: { total: 0, growth: 0, modules: 0, stability: 0, average: 0, concentration: 0 },
          sparkline: YEARS.map(y => ({ year: y, value: 0 })),
        }
      }

      const total = Number(row.totaal) || 0
      const sourceCount = Number(row.source_count) || 0
      const base = Number(row['2021']) || 0
      const latest = Number(row['2024']) || 0
      const growth = base > 0 ? ((latest - base) / base) * 100 : 0
      const yearsActive = YEARS.filter(y => (Number(row[String(y)]) || 0) > 0).length
      const avgPerYear = yearsActive > 0 ? total / yearsActive : 0

      // Simple concentration proxy: what % of their latest year is the total
      const concentration = total > 0 ? (latest / total) * 100 : 0

      return {
        name,
        found: true,
        scores: {
          total: percentile(allTotals, total),
          growth: percentile(allGrowths, growth),
          modules: Math.round((sourceCount / 6) * 100), // Normalize 1-6 to 0-100
          stability: Math.round((yearsActive / 9) * 100), // Normalize 1-9 to 0-100
          average: percentile(allTotals, avgPerYear),
          concentration: Math.round(concentration), // Already 0-100ish
        },
        absolute: {
          total,
          growth: Math.round(growth * 10) / 10,
          modules: sourceCount,
          stability: yearsActive,
          average: Math.round(avgPerYear),
          concentration: Math.round(concentration * 10) / 10,
        },
        sparkline: YEARS.map(y => ({ year: y, value: Number(row[String(y)]) || 0 })),
        sources: String(row.sources || ''),
      }
    })

    // Suggestions for entity picker
    const { data: topEntities } = await supabase
      .from('universal_search')
      .select('ontvanger')
      .gt('totaal', 0)
      .order('totaal', { ascending: false })
      .limit(50)

    const suggestions = (topEntities || []).map(r => String((r as Record<string, unknown>).ontvanger || ''))

    return NextResponse.json({
      entities,
      dimensions: [
        { key: 'total', label: 'Totale uitgaven', description: 'Percentiel van totaalbedrag' },
        { key: 'growth', label: 'Groei (3 jaar)', description: 'Percentiel van 3-jarige groei (2021→2024)' },
        { key: 'modules', label: 'Module-spreiding', description: 'Aantal databronnen (1-6)' },
        { key: 'stability', label: 'Jaren actief', description: 'Aantal jaren met bedrag (1-9)' },
        { key: 'average', label: 'Gemiddeld/jaar', description: 'Percentiel van gemiddeld jaarbedrag' },
        { key: 'concentration', label: 'Recentheid', description: 'Aandeel van 2024 in totaal' },
      ],
      suggestions,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'universal_search',
        note: 'Scores zijn percentielen (0-100) ten opzichte van alle ontvangers. Op basis van naamherkenning.',
      },
    })
  } catch (error) {
    console.error('Head-to-head error:', error)
    return NextResponse.json({ error: 'Failed to compute comparison data' }, { status: 500 })
  }
}
