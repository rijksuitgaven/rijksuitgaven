/**
 * Inzichten Concentration API — Inequality metrics per module
 *
 * Computes Gini coefficient, top-N shares, and Lorenz curve data
 * for each year within a selected module's aggregated view.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULE_VIEWS: Record<string, string> = {
  instrumenten: 'instrumenten_aggregated',
  apparaat: 'apparaat_aggregated',
  inkoop: 'inkoop_aggregated',
  provincie: 'provincie_aggregated',
  gemeente: 'gemeente_aggregated',
  publiek: 'publiek_aggregated',
}

function computeGini(sortedAsc: number[]): number {
  const n = sortedAsc.length
  if (n === 0) return 0
  const total = sortedAsc.reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  let numerator = 0
  for (let i = 0; i < n; i++) {
    numerator += (i + 1) * sortedAsc[i]
  }
  return (2 * numerator) / (n * total) - (n + 1) / n
}

function computeTopNShare(sortedDesc: number[], n: number, total: number): number {
  if (total === 0) return 0
  const topN = sortedDesc.slice(0, n).reduce((s, v) => s + v, 0)
  return (topN / total) * 100
}

function computeLorenzPoints(sortedAsc: number[], numPoints: number = 100): { pct_recipients: number; pct_amount: number }[] {
  const n = sortedAsc.length
  if (n === 0) return []
  const total = sortedAsc.reduce((s, v) => s + v, 0)
  if (total === 0) return []

  const points: { pct_recipients: number; pct_amount: number }[] = [{ pct_recipients: 0, pct_amount: 0 }]
  const step = Math.max(1, Math.floor(n / numPoints))
  let cumAmount = 0

  for (let i = 0; i < n; i++) {
    cumAmount += sortedAsc[i]
    if ((i + 1) % step === 0 || i === n - 1) {
      points.push({
        pct_recipients: ((i + 1) / n) * 100,
        pct_amount: (cumAmount / total) * 100,
      })
    }
  }

  return points
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const lorenzYear = parseInt(searchParams.get('lorenz_year') || '2024')

  const view = MODULE_VIEWS[module]
  if (!view) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    const { data: rawData, error } = await supabase
      .from(view)
      .select('"2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", totaal')
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const data = (rawData || []) as unknown as Record<string, unknown>[]

    // Per-year metrics
    const giniPerYear: Record<string, number> = {}
    const top10PerYear: Record<string, number> = {}
    const top50PerYear: Record<string, number> = {}
    const top100PerYear: Record<string, number> = {}
    const recipientsPerYear: Record<string, number> = {}
    const totalPerYear: Record<string, number> = {}

    for (const year of YEARS) {
      const yearStr = String(year)
      const amounts = data
        .map(row => Number(row[yearStr]) || 0)
        .filter(a => a > 0)

      if (amounts.length === 0) {
        giniPerYear[yearStr] = 0
        top10PerYear[yearStr] = 0
        top50PerYear[yearStr] = 0
        top100PerYear[yearStr] = 0
        recipientsPerYear[yearStr] = 0
        totalPerYear[yearStr] = 0
        continue
      }

      const sortedAsc = [...amounts].sort((a, b) => a - b)
      const sortedDesc = [...amounts].sort((a, b) => b - a)
      const total = amounts.reduce((s, v) => s + v, 0)

      giniPerYear[yearStr] = Math.round(computeGini(sortedAsc) * 1000) / 1000
      top10PerYear[yearStr] = Math.round(computeTopNShare(sortedDesc, 10, total) * 10) / 10
      top50PerYear[yearStr] = Math.round(computeTopNShare(sortedDesc, 50, total) * 10) / 10
      top100PerYear[yearStr] = Math.round(computeTopNShare(sortedDesc, 100, total) * 10) / 10
      recipientsPerYear[yearStr] = amounts.length
      totalPerYear[yearStr] = total
    }

    // Lorenz curve for the selected year
    const lorenzYearStr = String(lorenzYear)
    const lorenzAmounts = data
      .map(row => Number(row[lorenzYearStr]) || 0)
      .filter(a => a > 0)
      .sort((a, b) => a - b)
    const lorenzPoints = computeLorenzPoints(lorenzAmounts, 100)

    return NextResponse.json({
      module,
      gini_per_year: giniPerYear,
      top_n_shares: {
        top_10: top10PerYear,
        top_50: top50PerYear,
        top_100: top100PerYear,
      },
      recipients_per_year: recipientsPerYear,
      total_per_year: totalPerYear,
      lorenz: {
        year: lorenzYear,
        points: lorenzPoints,
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${module}_aggregated`,
        amount_unit: 'EUR',
        note: 'Gini: 0 = volledig gelijk, 1 = volledig geconcentreerd. Negatieve bedragen uitgesloten.',
      },
    })
  } catch (error) {
    console.error('Concentration error:', error)
    return NextResponse.json({ error: 'Failed to compute concentration data' }, { status: 500 })
  }
}
