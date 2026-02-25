/**
 * Inzichten Money Flow API — Sankey diagram data
 *
 * Builds a node/link structure for Recharts Sankey:
 * Ministry → Regeling → Top recipients
 * Uses instrumenten_aggregated for the richest hierarchy.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

interface SankeyNode {
  name: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || '2024'
  const ministryFilter = searchParams.get('ministry') || 'all'
  const topN = Math.min(parseInt(searchParams.get('top') || '10'), 20)
  const depth = Math.min(parseInt(searchParams.get('depth') || '3'), 3)

  const supabase = createAdminClient()

  try {
    const yearCol = year === 'totaal' ? 'totaal' : year

    // Fetch instrumenten_aggregated with hierarchy columns
    let query = supabase
      .from('instrumenten_aggregated')
      .select(`ontvanger, begrotingsnaam, regeling, "${yearCol}"`)
      .gt(yearCol === 'totaal' ? 'totaal' : `"${yearCol}"` as string, 0)
      .limit(50000)

    if (ministryFilter !== 'all') {
      query = query.eq('begrotingsnaam', ministryFilter)
    }

    const { data: rawData, error } = await query
    if (error) throw error
    const data = (rawData || []) as unknown as Record<string, unknown>[]

    // Step 1: Aggregate ministry → regeling → recipient
    const ministries: Record<string, {
      total: number
      regelingen: Record<string, {
        total: number
        recipients: Record<string, number>
      }>
    }> = {}

    for (const row of data) {
      const ministry = (row.begrotingsnaam as string) || 'Onbekend'
      const regeling = (row.regeling as string) || 'Geen regeling'
      const recipient = row.ontvanger as string
      const amount = Number(row[yearCol]) || 0
      if (amount <= 0) continue

      if (!ministries[ministry]) ministries[ministry] = { total: 0, regelingen: {} }
      ministries[ministry].total += amount

      if (!ministries[ministry].regelingen[regeling]) {
        ministries[ministry].regelingen[regeling] = { total: 0, recipients: {} }
      }
      ministries[ministry].regelingen[regeling].total += amount
      ministries[ministry].regelingen[regeling].recipients[recipient] =
        (ministries[ministry].regelingen[regeling].recipients[recipient] || 0) + amount
    }

    // Step 2: Build Sankey nodes and links
    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []
    const nodeIndex = new Map<string, number>()

    function getNodeIdx(name: string, prefix: string): number {
      const key = `${prefix}::${name}`
      if (!nodeIndex.has(key)) {
        nodeIndex.set(key, nodes.length)
        nodes.push({ name })
      }
      return nodeIndex.get(key)!
    }

    // Sort ministries by total descending, take top-N
    const sortedMinistries = Object.entries(ministries)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, topN)

    let overigMinistry = 0
    const allMinistries = Object.entries(ministries).sort(([, a], [, b]) => b.total - a.total)
    for (let i = topN; i < allMinistries.length; i++) {
      overigMinistry += allMinistries[i][1].total
    }

    for (const [ministryName, ministryData] of sortedMinistries) {
      const ministryIdx = getNodeIdx(ministryName, 'ministry')

      if (depth >= 2) {
        // Top-N regelingen per ministry
        const sortedRegelingen = Object.entries(ministryData.regelingen)
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, topN)

        let overigRegeling = 0
        const allRegelingen = Object.entries(ministryData.regelingen).sort(([, a], [, b]) => b.total - a.total)
        for (let i = topN; i < allRegelingen.length; i++) {
          overigRegeling += allRegelingen[i][1].total
        }

        for (const [regelingName, regelingData] of sortedRegelingen) {
          const regelingIdx = getNodeIdx(regelingName, `reg_${ministryName}`)
          links.push({ source: ministryIdx, target: regelingIdx, value: regelingData.total })

          if (depth >= 3) {
            // Top-N recipients per regeling
            const sortedRecipients = Object.entries(regelingData.recipients)
              .sort(([, a], [, b]) => b - a)
              .slice(0, Math.min(topN, 5)) // Cap at 5 recipients per regeling to keep readable

            let overigRecipient = 0
            const allRecipients = Object.entries(regelingData.recipients).sort(([, a], [, b]) => b - a)
            for (let i = Math.min(topN, 5); i < allRecipients.length; i++) {
              overigRecipient += allRecipients[i][1]
            }

            for (const [recipientName, recipientAmount] of sortedRecipients) {
              const recipientIdx = getNodeIdx(recipientName, `rec_${regelingName}`)
              links.push({ source: regelingIdx, target: recipientIdx, value: recipientAmount })
            }

            if (overigRecipient > 0) {
              const overigIdx = getNodeIdx(`Overig (${allRecipients.length - Math.min(topN, 5)} ontvangers)`, `rec_overig_${regelingName}`)
              links.push({ source: regelingIdx, target: overigIdx, value: overigRecipient })
            }
          }
        }

        if (overigRegeling > 0) {
          const overigIdx = getNodeIdx(`Overige regelingen (${allRegelingen.length - topN})`, `reg_overig_${ministryName}`)
          links.push({ source: ministryIdx, target: overigIdx, value: overigRegeling })
        }
      }
    }

    // Add "Overige ministeries" if applicable
    if (overigMinistry > 0 && depth >= 2) {
      const overigIdx = getNodeIdx(`Overige ministeries (${allMinistries.length - topN})`, 'ministry_overig')
      // No outgoing links from this node in the Sankey — it's just a bucket
      // We need a dummy target to make it visible
      const dummyIdx = getNodeIdx('Overig', 'reg_overig_all')
      links.push({ source: overigIdx, target: dummyIdx, value: overigMinistry })
    }

    // Collect unique ministries for filter dropdown
    const ministryList = Object.entries(ministries)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([name, d]) => ({ name, total: d.total }))

    const grandTotal = Object.values(ministries).reduce((s, m) => s + m.total, 0)

    return NextResponse.json({
      year: year === 'totaal' ? 'Alle jaren' : year,
      depth,
      top: topN,
      ministry_filter: ministryFilter,
      sankey: { nodes, links },
      ministries: ministryList,
      grand_total: grandTotal,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'Instrumenten (subsidies, bijdragen en leningen)',
        amount_unit: 'EUR',
        note: 'Bedragen genormaliseerd. "Overig" = restant buiten top-N.',
      },
    })
  } catch (error) {
    console.error('Money flow error:', error)
    return NextResponse.json({ error: 'Failed to compute money flow' }, { status: 500 })
  }
}
