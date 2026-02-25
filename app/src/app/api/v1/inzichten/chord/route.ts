/**
 * Inzichten Chord Diagram API — Ministry ↔ Recipient bilateral flows
 *
 * Returns a matrix of top recipients per ministry for chord visualization.
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
  const topN = Math.min(parseInt(searchParams.get('top') || '8'), 15)

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`ontvanger, begrotingsnaam, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    const yearKey = year === 'totaal' ? 'totaal' : year

    // Aggregate: ministry → recipient → amount
    const flows: Record<string, Record<string, number>> = {}
    const ministryTotals: Record<string, number> = {}
    const recipientTotals: Record<string, number> = {}

    for (const row of rows) {
      const ministry = String(row.begrotingsnaam || 'Onbekend')
      const recipient = String(row.ontvanger || 'Onbekend')
      const amount = Math.max(0, Number(row[yearKey]) || 0)
      if (amount === 0) continue

      if (!flows[ministry]) flows[ministry] = {}
      flows[ministry][recipient] = (flows[ministry][recipient] || 0) + amount
      ministryTotals[ministry] = (ministryTotals[ministry] || 0) + amount
      recipientTotals[recipient] = (recipientTotals[recipient] || 0) + amount
    }

    // Get top ministries by total
    const topMinistries = Object.entries(ministryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([name]) => name)

    // Get top recipients overall
    const topRecipients = Object.entries(recipientTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([name]) => name)

    // Build nodes: ministries first, then recipients
    const nodes = [
      ...topMinistries.map(name => ({ name, type: 'ministry' as const, total: ministryTotals[name] })),
      ...topRecipients.map(name => ({ name, type: 'recipient' as const, total: recipientTotals[name] })),
    ]

    const n = nodes.length
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

    // Fill matrix: ministry→recipient flows
    for (let i = 0; i < topMinistries.length; i++) {
      const ministry = topMinistries[i]
      for (let j = 0; j < topRecipients.length; j++) {
        const recipient = topRecipients[j]
        const amount = flows[ministry]?.[recipient] || 0
        if (amount > 0) {
          matrix[i][topMinistries.length + j] = amount
          matrix[topMinistries.length + j][i] = amount
        }
      }
    }

    return NextResponse.json({
      year,
      nodes,
      matrix,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Top ${topN} ministeries en ontvangers. Bilaterale geldstromen via instrumenten.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Chord error:', error)
    return NextResponse.json({ error: 'Failed to compute chord data' }, { status: 500 })
  }
}
