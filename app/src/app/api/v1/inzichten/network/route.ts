/**
 * Inzichten Network Graph API — Spending relationship network
 *
 * Returns nodes (ministries, regelingen, recipients) and edges for
 * force-directed visualization.
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
  const topRecipients = Math.min(parseInt(searchParams.get('top') || '30'), 50)

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`ontvanger, begrotingsnaam, regeling, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    const yearKey = year === 'totaal' ? 'totaal' : year

    // Aggregate: recipient totals, ministry totals, regeling totals
    const recipientTotals: Record<string, number> = {}
    const ministryTotals: Record<string, number> = {}
    const regelingTotals: Record<string, number> = {}
    const edges: Record<string, number> = {} // "source|target" → amount

    for (const row of rows) {
      const amount = Math.max(0, Number(row[yearKey]) || 0)
      if (amount === 0) continue

      const ministry = String(row.begrotingsnaam || 'Onbekend')
      const regeling = String(row.regeling || 'Onbekend')
      const recipient = String(row.ontvanger || 'Onbekend')

      recipientTotals[recipient] = (recipientTotals[recipient] || 0) + amount
      ministryTotals[ministry] = (ministryTotals[ministry] || 0) + amount
      regelingTotals[regeling] = (regelingTotals[regeling] || 0) + amount

      // Ministry → Recipient edge
      const edgeKey = `${ministry}|${recipient}`
      edges[edgeKey] = (edges[edgeKey] || 0) + amount
    }

    // Select top recipients
    const topRecipientNames = Object.entries(recipientTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topRecipients)
      .map(([name]) => name)
    const topRecipientSet = new Set(topRecipientNames)

    // Find ministries connected to top recipients
    const connectedMinistries = new Set<string>()
    for (const [key] of Object.entries(edges)) {
      const [ministry, recipient] = key.split('|')
      if (topRecipientSet.has(recipient)) {
        connectedMinistries.add(ministry)
      }
    }

    // Build nodes
    const nodes: { id: string; type: string; value: number }[] = []

    for (const name of connectedMinistries) {
      nodes.push({ id: name, type: 'ministry', value: ministryTotals[name] })
    }
    for (const name of topRecipientNames) {
      nodes.push({ id: name, type: 'recipient', value: recipientTotals[name] })
    }

    // Build filtered edges
    const nodeIds = new Set(nodes.map(n => n.id))
    const filteredEdges: { source: string; target: string; value: number }[] = []

    for (const [key, amount] of Object.entries(edges)) {
      const [source, target] = key.split('|')
      if (nodeIds.has(source) && nodeIds.has(target)) {
        filteredEdges.push({ source, target, value: amount })
      }
    }

    // Count connections per recipient (how many ministries fund them)
    const connectionCounts: Record<string, number> = {}
    for (const edge of filteredEdges) {
      connectionCounts[edge.target] = (connectionCounts[edge.target] || 0) + 1
    }

    return NextResponse.json({
      year,
      nodes,
      edges: filteredEdges.sort((a, b) => b.value - a.value).slice(0, 200),
      stats: {
        total_nodes: nodes.length,
        total_edges: filteredEdges.length,
        multi_funded: Object.values(connectionCounts).filter(c => c > 1).length,
        max_connections: Math.max(0, ...Object.values(connectionCounts)),
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Top ${topRecipients} ontvangers en hun ministerie-verbindingen.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Network error:', error)
    return NextResponse.json({ error: 'Failed to compute network data' }, { status: 500 })
  }
}
