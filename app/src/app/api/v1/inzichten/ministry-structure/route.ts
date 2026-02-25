/**
 * Inzichten Ministry Cost Structure API — Cross-module allocation per ministry
 *
 * Shows how each ministry divides spending across instrumenten, apparaat, and inkoop.
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
  const year = searchParams.get('year') || '2024'

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    // Fetch from instrumenten (has begrotingsnaam)
    const { data: instrData, error: instrErr } = await supabase
      .from('instrumenten_aggregated')
      .select(`begrotingsnaam, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (instrErr) throw instrErr

    // Fetch from apparaat (has begrotingsnaam)
    const { data: appData, error: appErr } = await supabase
      .from('apparaat_aggregated')
      .select(`begrotingsnaam, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (appErr) throw appErr

    const instrRows = (instrData || []) as unknown as Record<string, unknown>[]
    const appRows = (appData || []) as unknown as Record<string, unknown>[]

    // Aggregate by ministry
    const yearKey = year === 'totaal' ? 'totaal' : year
    const ministries: Record<string, { instrumenten: number; apparaat: number; inkoop: number }> = {}

    for (const row of instrRows) {
      const name = String(row.begrotingsnaam || 'Onbekend')
      const amount = Number(row[yearKey]) || 0
      if (!ministries[name]) ministries[name] = { instrumenten: 0, apparaat: 0, inkoop: 0 }
      ministries[name].instrumenten += Math.max(0, amount)
    }

    for (const row of appRows) {
      const name = String(row.begrotingsnaam || 'Onbekend')
      const amount = Number(row[yearKey]) || 0
      if (!ministries[name]) ministries[name] = { instrumenten: 0, apparaat: 0, inkoop: 0 }
      ministries[name].apparaat += Math.max(0, amount)
    }

    // Build sorted list
    const sorted = Object.entries(ministries)
      .map(([name, amounts]) => ({
        name,
        instrumenten: amounts.instrumenten,
        apparaat: amounts.apparaat,
        inkoop: amounts.inkoop,
        total: amounts.instrumenten + amounts.apparaat + amounts.inkoop,
        instrumenten_pct: 0,
        apparaat_pct: 0,
        inkoop_pct: 0,
      }))
      .sort((a, b) => b.total - a.total)

    // Compute percentages
    for (const m of sorted) {
      if (m.total > 0) {
        m.instrumenten_pct = Math.round((m.instrumenten / m.total) * 1000) / 10
        m.apparaat_pct = Math.round((m.apparaat / m.total) * 1000) / 10
        m.inkoop_pct = Math.round((m.inkoop / m.total) * 1000) / 10
      }
    }

    return NextResponse.json({
      year,
      ministries: sorted.slice(0, 20),
      total_ministries: sorted.length,
      modules_included: ['instrumenten', 'apparaat'],
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated + apparaat_aggregated',
        note: `Gebaseerd op modules met begrotingsnaam (instrumenten + apparaat). Inkoop, gemeente, provincie, publiek niet opgenomen (geen begrotingsnaam). Negatieve bedragen uitgesloten.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Ministry structure error:', error)
    return NextResponse.json({ error: 'Failed to compute ministry structure' }, { status: 500 })
  }
}
