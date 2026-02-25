/**
 * Inzichten Per Capita API — Spending per capita by province/municipality
 *
 * Uses static CBS population data (2024) to compute spending per inhabitant
 * for provincie and gemeente modules.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

// CBS population data 2024 (bevolking per provincie, afgerond)
const PROVINCE_POPULATION: Record<string, number> = {
  'Groningen': 596_000,
  'Friesland': 654_000,
  'Drenthe': 500_000,
  'Overijssel': 1_176_000,
  'Flevoland': 438_000,
  'Gelderland': 2_113_000,
  'Utrecht': 1_389_000,
  'Noord-Holland': 2_923_000,
  'Zuid-Holland': 3_758_000,
  'Zeeland': 389_000,
  'Noord-Brabant': 2_608_000,
  'Limburg': 1_121_000,
}

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || '2024'
  const module = searchParams.get('module') || 'provincie'

  if (!['provincie', 'gemeente'].includes(module)) {
    return NextResponse.json({
      error: 'Per capita alleen beschikbaar voor provincie en gemeente modules'
    }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')
  const view = module === 'provincie' ? 'provincie_aggregated' : 'gemeente_aggregated'
  const groupField = module === 'provincie' ? 'provincie' : 'gemeente'

  try {
    const { data: rawData, error } = await supabase
      .from(view)
      .select(`ontvanger, ${groupField}, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Aggregate by province/gemeente
    const grouped: Record<string, Record<string, number>> = {}
    for (const row of rows) {
      const key = String(row[groupField] || 'Onbekend')
      if (!grouped[key]) {
        grouped[key] = {}
        for (const y of YEARS) grouped[key][String(y)] = 0
        grouped[key]['totaal'] = 0
      }
      for (const y of YEARS) {
        grouped[key][String(y)] += Number(row[String(y)]) || 0
      }
      grouped[key]['totaal'] += Number(row.totaal) || 0
    }

    const yearCol = year === 'totaal' ? 'totaal' : year

    // Compute per-capita for provinces
    const results = Object.entries(grouped)
      .map(([name, data]) => {
        const amount = data[yearCol] || 0
        const population = PROVINCE_POPULATION[name] || null
        const perCapita = population ? Math.round(amount / population) : null

        return {
          name,
          amount,
          population,
          per_capita: perCapita,
          sparkline: YEARS.map(y => ({
            year: y,
            value: data[String(y)] || 0,
            per_capita: population ? Math.round((data[String(y)] || 0) / population) : null,
          })),
        }
      })
      .filter(r => r.amount > 0)
      .sort((a, b) => (b.per_capita || 0) - (a.per_capita || 0))

    const withPerCapita = results.filter(r => r.per_capita !== null)
    const totalAmount = withPerCapita.reduce((s, r) => s + r.amount, 0)
    const totalPop = withPerCapita.reduce((s, r) => s + (r.population || 0), 0)
    const avgPerCapita = totalPop > 0 ? Math.round(totalAmount / totalPop) : 0

    return NextResponse.json({
      module,
      year,
      entities: results,
      summary: {
        total_amount: totalAmount,
        total_population: totalPop,
        average_per_capita: avgPerCapita,
        entities_with_population: withPerCapita.length,
        entities_without_population: results.length - withPerCapita.length,
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: view,
        note: `Bevolkingsaantallen: CBS 2024 (afgerond). ${module === 'gemeente' ? 'Gemeente-niveau: bevolkingsdata niet beschikbaar, alleen totaalbedragen.' : 'Per capita = totaalbedrag / inwoners.'}${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Per capita error:', error)
    return NextResponse.json({ error: 'Failed to compute per capita data' }, { status: 500 })
  }
}
