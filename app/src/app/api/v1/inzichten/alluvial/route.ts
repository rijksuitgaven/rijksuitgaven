/**
 * Inzichten Alluvial API — Multi-stage categorical spending flow
 *
 * Returns links across stages: Ministry → Instrument → Regeling → Top Recipients.
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
  const topPerStage = Math.min(parseInt(searchParams.get('top') || '10'), 20)

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`begrotingsnaam, instrument, regeling, ontvanger, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    const yearKey = year === 'totaal' ? 'totaal' : year

    // Build links between stages
    // Stage 0: Ministry → Instrument
    // Stage 1: Instrument → Regeling
    // Stage 2: Regeling → Recipient
    const linkMap: Record<string, Record<string, number>> = {
      '0': {}, // ministry|instrument → amount
      '1': {}, // instrument|regeling → amount
      '2': {}, // regeling|recipient → amount
    }

    for (const row of rows) {
      const amount = Math.max(0, Number(row[yearKey]) || 0)
      if (amount === 0) continue

      const ministry = String(row.begrotingsnaam || 'Onbekend')
      const instrument = String(row.instrument || 'Onbekend')
      const regeling = String(row.regeling || 'Onbekend')
      const recipient = String(row.ontvanger || 'Onbekend')

      const key0 = `${ministry}|${instrument}`
      const key1 = `${instrument}|${regeling}`
      const key2 = `${regeling}|${recipient}`

      linkMap['0'][key0] = (linkMap['0'][key0] || 0) + amount
      linkMap['1'][key1] = (linkMap['1'][key1] || 0) + amount
      linkMap['2'][key2] = (linkMap['2'][key2] || 0) + amount
    }

    // Get top nodes per stage
    const stageTotals: Record<string, Record<string, number>> = {
      ministry: {},
      instrument: {},
      regeling: {},
      recipient: {},
    }

    for (const [key, amount] of Object.entries(linkMap['0'])) {
      const [m, i] = key.split('|')
      stageTotals.ministry[m] = (stageTotals.ministry[m] || 0) + amount
      stageTotals.instrument[i] = (stageTotals.instrument[i] || 0) + amount
    }
    for (const [key, amount] of Object.entries(linkMap['1'])) {
      const [, r] = key.split('|')
      stageTotals.regeling[r] = (stageTotals.regeling[r] || 0) + amount
    }
    for (const [key, amount] of Object.entries(linkMap['2'])) {
      const [, rec] = key.split('|')
      stageTotals.recipient[rec] = (stageTotals.recipient[rec] || 0) + amount
    }

    const topOf = (totals: Record<string, number>) =>
      Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, topPerStage).map(([name]) => name)

    const topMinistries = topOf(stageTotals.ministry)
    const topInstruments = topOf(stageTotals.instrument)
    const topRegelingen = topOf(stageTotals.regeling)
    const topRecipients = topOf(stageTotals.recipient)

    // Build nodes with stage index
    const nodes = [
      ...topMinistries.map(n => ({ name: n, stage: 0, total: stageTotals.ministry[n] })),
      ...topInstruments.map(n => ({ name: n, stage: 1, total: stageTotals.instrument[n] })),
      ...topRegelingen.map(n => ({ name: n, stage: 2, total: stageTotals.regeling[n] })),
      ...topRecipients.map(n => ({ name: n, stage: 3, total: stageTotals.recipient[n] })),
    ]

    // Build filtered links (only between top nodes)
    const topSets = [new Set(topMinistries), new Set(topInstruments), new Set(topRegelingen), new Set(topRecipients)]

    const links: { source: string; target: string; value: number; stage: number }[] = []

    for (const stage of [0, 1, 2]) {
      const stageLinks = linkMap[String(stage)]
      for (const [key, amount] of Object.entries(stageLinks)) {
        const [source, target] = key.split('|')
        if (topSets[stage].has(source) && topSets[stage + 1].has(target)) {
          links.push({ source, target, value: amount, stage })
        }
      }
    }

    return NextResponse.json({
      year,
      stages: ['Ministerie', 'Instrument', 'Regeling', 'Ontvanger'],
      nodes,
      links: links.sort((a, b) => b.value - a.value),
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Top ${topPerStage} per fase. Geldstroom: Ministerie → Instrument → Regeling → Ontvanger.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Alluvial error:', error)
    return NextResponse.json({ error: 'Failed to compute alluvial data' }, { status: 500 })
  }
}
