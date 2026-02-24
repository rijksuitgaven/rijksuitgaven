/**
 * Inzichten Pulse API — KPIs + module breakdown for Spending Pulse dashboard
 *
 * Returns pre-computed headline metrics and module-level yearly totals.
 * All amounts normalized to absolute EUR.
 * Admin-only endpoint.
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] as const

interface ModuleTotal {
  [year: string]: number
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  try {
    // Parallel queries for all data
    const [
      universalRes,
      instrumentenRes,
      apparaatRes,
      inkoopRes,
      provincieRes,
      gemeenteRes,
      publiekRes,
    ] = await Promise.all([
      // KPIs from universal_search
      supabase.rpc('get_inzichten_pulse'),
      // Module breakdowns — sum year columns per module
      supabase.from('instrumenten_aggregated').select('*').limit(0).csv(),
      supabase.from('apparaat_aggregated').select('*').limit(0).csv(),
      supabase.from('inkoop_aggregated').select('*').limit(0).csv(),
      supabase.from('provincie_aggregated').select('*').limit(0).csv(),
      supabase.from('gemeente_aggregated').select('*').limit(0).csv(),
      supabase.from('publiek_aggregated').select('*').limit(0).csv(),
    ])

    // Since we can't easily SUM columns via Supabase JS client, use raw SQL via RPC
    // Let's do the aggregation via individual module queries instead
    const moduleQueries = await Promise.all([
      supabase.rpc('get_inzichten_module_totals', { module_name: 'instrumenten' }),
      supabase.rpc('get_inzichten_module_totals', { module_name: 'apparaat' }),
      supabase.rpc('get_inzichten_module_totals', { module_name: 'inkoop' }),
      supabase.rpc('get_inzichten_module_totals', { module_name: 'provincie' }),
      supabase.rpc('get_inzichten_module_totals', { module_name: 'gemeente' }),
      supabase.rpc('get_inzichten_module_totals', { module_name: 'publiek' }),
    ])

    // If RPC functions don't exist yet, fall back to raw queries
    if (universalRes.error || moduleQueries[0].error) {
      // Fallback: direct table queries with manual aggregation
      return await getFallbackPulseData(supabase)
    }

    return NextResponse.json({
      kpis: universalRes.data,
      modules: {
        instrumenten: moduleQueries[0].data,
        apparaat: moduleQueries[1].data,
        inkoop: moduleQueries[2].data,
        provincie: moduleQueries[3].data,
        gemeente: moduleQueries[4].data,
        publiek: moduleQueries[5].data,
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: '6 openbare databronnen',
        amount_unit: 'EUR',
      },
    })
  } catch {
    return await getFallbackPulseData(createAdminClient())
  }
}

/**
 * Fallback: compute pulse data without RPC functions using direct queries
 */
async function getFallbackPulseData(supabase: ReturnType<typeof createAdminClient>) {
  try {
    // Fetch all recipients from universal_search to compute KPIs
    // This is heavy but acceptable for admin-only lab prototype
    const { data: universalData, error: uError } = await supabase
      .from('universal_search')
      .select('ontvanger, "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", totaal, source_count')
      .order('totaal', { ascending: false })
      .limit(10000)

    if (uError) throw uError

    // Compute KPIs from universal_search data
    const totalPerYear: Record<string, number> = {}
    const recipientsPerYear: Record<string, number> = {}
    const largestPerYear: Record<string, { name: string; amount: number }> = {}

    for (const year of YEARS) {
      const yearStr = String(year)
      let total = 0
      let count = 0
      let maxAmount = 0
      let maxName = ''

      for (const row of universalData || []) {
        const amount = Number((row as unknown as Record<string, unknown>)[yearStr]) || 0
        if (amount > 0) {
          total += amount
          count++
          if (amount > maxAmount) {
            maxAmount = amount
            maxName = row.ontvanger as string
          }
        }
      }

      totalPerYear[yearStr] = total
      recipientsPerYear[yearStr] = count
      largestPerYear[yearStr] = { name: maxName, amount: maxAmount }
    }

    // Module breakdown: fetch top-level sums from each aggregated view
    const moduleNames = ['instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek'] as const
    const moduleData: Record<string, ModuleTotal> = {}

    const moduleResults = await Promise.all(
      moduleNames.map(m =>
        supabase
          .from(`${m}_aggregated`)
          .select('"2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"')
          .limit(50000)
      )
    )

    for (let i = 0; i < moduleNames.length; i++) {
      const name = moduleNames[i]
      const rows = moduleResults[i].data || []
      const yearTotals: ModuleTotal = {}

      for (const year of YEARS) {
        const yearStr = String(year)
        let sum = 0
        for (const row of rows) {
          sum += Number((row as unknown as Record<string, unknown>)[yearStr]) || 0
        }
        yearTotals[yearStr] = sum
      }

      moduleData[name] = yearTotals
    }

    return NextResponse.json({
      kpis: {
        total_per_year: totalPerYear,
        recipients_per_year: recipientsPerYear,
        largest_per_year: largestPerYear,
        average_per_year: Object.fromEntries(
          YEARS.map(y => {
            const ys = String(y)
            const count = recipientsPerYear[ys] || 1
            return [ys, Math.round((totalPerYear[ys] || 0) / count)]
          })
        ),
      },
      modules: moduleData,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: '6 openbare databronnen (top 10.000 ontvangers voor KPIs)',
        amount_unit: 'EUR',
      },
    })
  } catch (error) {
    console.error('Pulse fallback error:', error)
    return NextResponse.json({ error: 'Failed to compute pulse data' }, { status: 500 })
  }
}
