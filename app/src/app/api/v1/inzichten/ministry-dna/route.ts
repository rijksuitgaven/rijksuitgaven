/**
 * Inzichten Ministry DNA API — Sparkline matrix for all ministries
 *
 * Computes 5 structural metrics per ministry per year from instrumenten data:
 * 1. Total spending
 * 2. Unique recipient count
 * 3. Average per recipient
 * 4. Top-5 concentration (% of total)
 * 5. Distinct regelingen count
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  try {
    // Metric 1 & partial data: from instrumenten_aggregated (fast, pre-computed)
    const { data: aggData, error: aggError } = await supabase
      .from('instrumenten_aggregated')
      .select('ontvanger, begrotingsnaam, "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", totaal')
      .gt('totaal', 0)
      .limit(50000)

    if (aggError) throw aggError

    // Metric 5: regeling counts — need source table (distinct regeling per ministry per year)
    const { data: regelingData, error: regelingError } = await supabase
      .from('instrumenten')
      .select('begrotingsnaam, begrotingsjaar, regeling')
      .not('regeling', 'is', null)
      .limit(100000)

    if (regelingError) throw regelingError

    // Compute regeling counts per ministry per year
    const regelingCounts: Record<string, Record<string, Set<string>>> = {}
    for (const row of regelingData || []) {
      const ministry = row.begrotingsnaam as string
      const year = String(row.begrotingsjaar)
      if (!ministry) continue
      if (!regelingCounts[ministry]) regelingCounts[ministry] = {}
      if (!regelingCounts[ministry][year]) regelingCounts[ministry][year] = new Set()
      if (row.regeling) regelingCounts[ministry][year].add(row.regeling as string)
    }

    // Group aggregated data by ministry
    const ministryData: Record<string, typeof aggData> = {}
    for (const row of aggData || []) {
      const ministry = row.begrotingsnaam as string
      if (!ministry) continue
      if (!ministryData[ministry]) ministryData[ministry] = []
      ministryData[ministry].push(row)
    }

    // Compute metrics per ministry
    const ministries = Object.entries(ministryData)
      .map(([ministry, rows]) => {
        const metrics: {
          total: Record<string, number>
          recipients: Record<string, number>
          average: Record<string, number>
          concentration: Record<string, number>
          regelingen: Record<string, number>
        } = {
          total: {},
          recipients: {},
          average: {},
          concentration: {},
          regelingen: {},
        }

        for (const year of YEARS) {
          const yearStr = String(year)

          // Amounts per recipient for this year
          const amounts = rows
            .map(r => Number((r as unknown as Record<string, unknown>)[yearStr]) || 0)
            .filter(a => a > 0)
            .sort((a, b) => b - a)

          const total = amounts.reduce((sum, a) => sum + a, 0)
          const count = amounts.length
          const top5Sum = amounts.slice(0, 5).reduce((sum, a) => sum + a, 0)

          metrics.total[yearStr] = total
          metrics.recipients[yearStr] = count
          metrics.average[yearStr] = count > 0 ? Math.round(total / count) : 0
          metrics.concentration[yearStr] = total > 0 ? Math.round((top5Sum / total) * 100) : 0
          metrics.regelingen[yearStr] = regelingCounts[ministry]?.[yearStr]?.size || 0
        }

        const grandTotal = Object.values(metrics.total).reduce((s, v) => s + v, 0)

        return {
          ministry,
          grand_total: grandTotal,
          metrics,
        }
      })
      .filter(m => m.grand_total > 0)
      .sort((a, b) => b.grand_total - a.grand_total)

    return NextResponse.json({
      ministries,
      years: YEARS,
      metric_labels: {
        total: 'Totale uitgaven',
        recipients: 'Ontvangers',
        average: 'Gemiddeld per ontvanger',
        concentration: 'Top-5 concentratie (%)',
        regelingen: 'Regelingen',
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'Instrumenten (subsidies, bijdragen en leningen)',
        amount_unit: 'EUR',
      },
    })
  } catch (error) {
    console.error('Ministry DNA error:', error)
    return NextResponse.json({ error: 'Failed to compute ministry DNA' }, { status: 500 })
  }
}
