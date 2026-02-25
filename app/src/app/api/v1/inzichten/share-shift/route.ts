/**
 * Inzichten Share Shift API — Proportional allocation over time
 *
 * Returns per-ministry spending shares per year for instrumenten module.
 * Supports both absolute and proportional (100%) views.
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
  const top = Math.min(parseInt(searchParams.get('top') || '12'), 20)

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    // Get all rows with begrotingsnaam from instrumenten_aggregated
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`begrotingsnaam, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Aggregate by begrotingsnaam (ministry)
    const ministryTotals: Record<string, Record<string, number>> = {}

    for (const row of rows) {
      const ministry = String(row.begrotingsnaam || 'Onbekend')
      if (!ministryTotals[ministry]) {
        ministryTotals[ministry] = {}
        for (const y of YEARS) ministryTotals[ministry][String(y)] = 0
        ministryTotals[ministry].totaal = 0
      }
      for (const y of YEARS) {
        ministryTotals[ministry][String(y)] += Number(row[String(y)]) || 0
      }
      ministryTotals[ministry].totaal += Number(row.totaal) || 0
    }

    // Sort ministries by total, take top-N + aggregate "Overig"
    const sorted = Object.entries(ministryTotals)
      .sort(([, a], [, b]) => b.totaal - a.totaal)

    const topMinistries = sorted.slice(0, top)
    const restMinistries = sorted.slice(top)

    // Build "Overig" bucket
    if (restMinistries.length > 0) {
      const overig: Record<string, number> = {}
      for (const y of YEARS) overig[String(y)] = 0
      overig.totaal = 0
      for (const [, data] of restMinistries) {
        for (const y of YEARS) overig[String(y)] += data[String(y)]
        overig.totaal += data.totaal
      }
      topMinistries.push(['Overig', overig])
    }

    // Build chart data: per year, per ministry
    const ministryNames = topMinistries.map(([name]) => name)
    const chartData = YEARS.map(y => {
      const yearStr = String(y)
      const entry: Record<string, number | string> = { year: yearStr }
      let yearTotal = 0

      for (const [name, data] of topMinistries) {
        const amount = Math.max(0, data[yearStr]) // Exclude negatives from stacked view
        entry[name] = amount
        yearTotal += amount
      }
      entry._total = yearTotal

      // Proportional (100%) version
      for (const [name] of topMinistries) {
        entry[`${name}_pct`] = yearTotal > 0
          ? Math.round(((Number(entry[name]) || 0) / yearTotal) * 1000) / 10
          : 0
      }

      return entry
    })

    // Ministry summary for legend
    const ministries = topMinistries.map(([name, data]) => ({
      name,
      total: data.totaal,
      latest: data['2024'],
    }))

    return NextResponse.json({
      ministries: ministryNames,
      ministry_summary: ministries,
      chart_data: chartData,
      total_ministries: sorted.length,
      overig_count: restMinistries.length,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: 'Bron: Instrumenten — subsidies, bijdragen en leningen. Negatieve bedragen uitgesloten van proportionele weergave. *2024 data kan onvolledig zijn.',
      },
    })
  } catch (error) {
    console.error('Share shift error:', error)
    return NextResponse.json({ error: 'Failed to compute share shift data' }, { status: 500 })
  }
}
