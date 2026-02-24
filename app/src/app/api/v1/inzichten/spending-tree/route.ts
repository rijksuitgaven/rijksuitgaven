/**
 * Inzichten Spending Tree API — Hierarchical treemap data
 *
 * Returns ministry → regeling → instrument hierarchy with amounts
 * for the selected year. Used by the Spending Landscape treemap.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || 'totaal'

  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('instrumenten_aggregated')
      .select('ontvanger, begrotingsnaam, regeling, instrument, "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", totaal')
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error

    // Build hierarchy: ministry → regeling → instrument
    const ministries: Record<string, {
      name: string
      amount: number
      recipients: number
      regelingen: Record<string, {
        name: string
        amount: number
        recipients: number
        instruments: Record<string, { name: string; amount: number; recipients: number }>
      }>
    }> = {}

    for (const row of data || []) {
      const ministry = (row.begrotingsnaam as string) || 'Onbekend'
      const regeling = (row.regeling as string) || 'Geen regeling'
      const instrument = (row.instrument as string) || 'Geen instrument'
      const amount = year === 'totaal'
        ? Number(row.totaal) || 0
        : Number((row as unknown as Record<string, unknown>)[year]) || 0

      if (amount <= 0) continue

      if (!ministries[ministry]) {
        ministries[ministry] = { name: ministry, amount: 0, recipients: 0, regelingen: {} }
      }
      ministries[ministry].amount += amount
      ministries[ministry].recipients++

      if (!ministries[ministry].regelingen[regeling]) {
        ministries[ministry].regelingen[regeling] = { name: regeling, amount: 0, recipients: 0, instruments: {} }
      }
      ministries[ministry].regelingen[regeling].amount += amount
      ministries[ministry].regelingen[regeling].recipients++

      if (!ministries[ministry].regelingen[regeling].instruments[instrument]) {
        ministries[ministry].regelingen[regeling].instruments[instrument] = { name: instrument, amount: 0, recipients: 0 }
      }
      ministries[ministry].regelingen[regeling].instruments[instrument].amount += amount
      ministries[ministry].regelingen[regeling].instruments[instrument].recipients++
    }

    // Convert to tree structure for D3
    const tree = {
      name: 'Rijksoverheid',
      children: Object.values(ministries)
        .sort((a, b) => b.amount - a.amount)
        .map(m => ({
          name: m.name,
          amount: m.amount,
          recipients: m.recipients,
          children: Object.values(m.regelingen)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 30) // Cap at 30 regelingen per ministry
            .map(r => ({
              name: r.name,
              amount: r.amount,
              recipients: r.recipients,
              children: Object.values(r.instruments)
                .sort((a, b) => b.amount - a.amount)
                .map(i => ({
                  name: i.name,
                  amount: i.amount,
                  recipients: i.recipients,
                })),
            })),
        })),
    }

    const grandTotal = Object.values(ministries).reduce((s, m) => s + m.amount, 0)

    return NextResponse.json({
      year: year === 'totaal' ? 'Alle jaren' : year,
      tree,
      grand_total: grandTotal,
      ministry_count: Object.keys(ministries).length,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'Instrumenten (subsidies, bijdragen en leningen)',
        amount_unit: 'EUR',
        note: 'Bedragen in instrumenten zijn reeds genormaliseerd (×1000 toegepast in view).',
      },
    })
  } catch (error) {
    console.error('Spending tree error:', error)
    return NextResponse.json({ error: 'Failed to compute spending tree' }, { status: 500 })
  }
}
