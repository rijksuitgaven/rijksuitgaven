/**
 * Inzichten Spending Spectrum API — Distribution explorer
 *
 * Returns log-scale histogram buckets, box plot statistics per year,
 * and optional entity highlight position within the distribution.
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

// Log-scale brackets for histogram
const BRACKETS = [
  { label: '< €1K', min: 0, max: 1_000 },
  { label: '€1K–€10K', min: 1_000, max: 10_000 },
  { label: '€10K–€100K', min: 10_000, max: 100_000 },
  { label: '€100K–€1M', min: 100_000, max: 1_000_000 },
  { label: '€1M–€10M', min: 1_000_000, max: 10_000_000 },
  { label: '€10M–€100M', min: 10_000_000, max: 100_000_000 },
  { label: '€100M–€1B', min: 100_000_000, max: 1_000_000_000 },
  { label: '> €1B', min: 1_000_000_000, max: Infinity },
]

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const year = searchParams.get('year') || '2024'
  const highlight = searchParams.get('highlight') || ''

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from(config.view)
      .select(`${config.primary}, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Histogram for the selected year
    const yearCol = year === 'totaal' ? 'totaal' : year
    const amounts = rows
      .map(row => ({ name: String(row[config.primary] || ''), amount: Number(row[yearCol]) || 0 }))
      .filter(r => r.amount > 0)
      .sort((a, b) => a.amount - b.amount)

    const histogram = BRACKETS.map(bracket => {
      const inBracket = amounts.filter(a =>
        a.amount >= bracket.min && (bracket.max === Infinity ? true : a.amount < bracket.max)
      )
      return {
        label: bracket.label,
        count: inBracket.length,
        total_amount: inBracket.reduce((s, a) => s + a.amount, 0),
        min: bracket.min,
        max: bracket.max === Infinity ? null : bracket.max,
      }
    })

    // Box plot statistics per year
    const boxPlots = YEARS.map(y => {
      const yearAmounts = rows
        .map(row => Number(row[String(y)]) || 0)
        .filter(a => a > 0)
        .sort((a, b) => a - b)

      if (yearAmounts.length === 0) {
        return { year: y, min: 0, p25: 0, median: 0, p75: 0, p95: 0, max: 0, count: 0 }
      }

      return {
        year: y,
        min: yearAmounts[0],
        p25: computePercentile(yearAmounts, 25),
        median: computePercentile(yearAmounts, 50),
        p75: computePercentile(yearAmounts, 75),
        p95: computePercentile(yearAmounts, 95),
        max: yearAmounts[yearAmounts.length - 1],
        count: yearAmounts.length,
      }
    })

    // Highlight entity position
    let highlightData = null
    if (highlight) {
      const match = amounts.find(a => a.name.toLowerCase().includes(highlight.toLowerCase()))
      if (match) {
        const rank = amounts.filter(a => a.amount >= match.amount).length
        const percentile = Math.round(((amounts.length - rank) / amounts.length) * 100 * 10) / 10
        const bracket = BRACKETS.find(b =>
          match.amount >= b.min && (b.max === Infinity ? true : match.amount < b.max)
        )

        highlightData = {
          name: match.name,
          amount: match.amount,
          rank,
          percentile,
          bracket: bracket?.label || '',
          total_in_module: amounts.length,
        }
      }
    }

    // Negative amounts summary (separate section)
    const negativeCount = rows.filter(row => (Number(row[yearCol]) || 0) < 0).length

    return NextResponse.json({
      module,
      year,
      histogram,
      box_plots: boxPlots,
      highlight: highlightData,
      summary: {
        total_recipients: amounts.length,
        total_amount: amounts.reduce((s, a) => s + a.amount, 0),
        median: amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)].amount : 0,
        mean: amounts.length > 0 ? amounts.reduce((s, a) => s + a.amount, 0) / amounts.length : 0,
        negative_count: negativeCount,
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${config.view}`,
        note: `Verdeling van positieve bedragen. ${negativeCount > 0 ? `${negativeCount} negatieve bedragen uitgesloten.` : ''} ${year === '2024' ? '*2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Spending spectrum error:', error)
    return NextResponse.json({ error: 'Failed to compute spectrum data' }, { status: 500 })
  }
}
