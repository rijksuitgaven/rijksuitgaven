/**
 * Inzichten Reverse Flow API — Recipient-centric source breakdown
 *
 * For a given recipient, returns all modules/sources it appears in
 * with amounts, for building a reverse Sankey diagram.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULE_VIEWS: Record<string, { view: string; primary: string; extra?: string[] }> = {
  instrumenten: { view: 'instrumenten_aggregated', primary: 'ontvanger', extra: ['begrotingsnaam', 'regeling'] },
  apparaat: { view: 'apparaat_aggregated', primary: 'kostensoort' },
  inkoop: { view: 'inkoop_aggregated', primary: 'leverancier' },
  provincie: { view: 'provincie_aggregated', primary: 'ontvanger' },
  gemeente: { view: 'gemeente_aggregated', primary: 'ontvanger' },
  publiek: { view: 'publiek_aggregated', primary: 'ontvanger' },
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const recipient = searchParams.get('recipient') || ''
  const year = searchParams.get('year') || 'totaal'

  if (!recipient) {
    return NextResponse.json({ error: 'recipient parameter required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const moduleResults: {
      module: string
      total: number
      year_amount: number
      sparkline: { year: number; value: number }[]
      details: { ministry?: string; regeling?: string; amount: number }[]
    }[] = []

    // Search each module for this recipient
    for (const [modName, config] of Object.entries(MODULE_VIEWS)) {
      const extraCols = config.extra ? `, ${config.extra.join(', ')}` : ''
      const { data: rows, error } = await supabase
        .from(config.view)
        .select(`${config.primary}${extraCols}, ${yearColumns}, totaal`)
        .ilike(config.primary, recipient)

      if (error || !rows || rows.length === 0) continue

      const typedRows = rows as unknown as Record<string, unknown>[]

      let moduleTotal = 0
      let moduleYearAmount = 0
      const yearTotals: Record<number, number> = {}
      for (const y of YEARS) yearTotals[y] = 0

      const details: { ministry?: string; regeling?: string; amount: number }[] = []

      for (const row of typedRows) {
        const total = Number(row.totaal) || 0
        const yearAmt = year === 'totaal' ? total : (Number(row[year]) || 0)
        moduleTotal += total
        moduleYearAmount += yearAmt

        for (const y of YEARS) {
          yearTotals[y] += Number(row[String(y)]) || 0
        }

        if (config.extra) {
          details.push({
            ministry: row.begrotingsnaam ? String(row.begrotingsnaam) : undefined,
            regeling: row.regeling ? String(row.regeling) : undefined,
            amount: yearAmt,
          })
        }
      }

      if (moduleTotal > 0) {
        moduleResults.push({
          module: modName,
          total: moduleTotal,
          year_amount: moduleYearAmount,
          sparkline: YEARS.map(y => ({ year: y, value: yearTotals[y] })),
          details: details.filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount),
        })
      }
    }

    // Sort by amount
    moduleResults.sort((a, b) => b.year_amount - a.year_amount)

    // Build Sankey data: sources → modules → recipient
    const nodes: { name: string }[] = []
    const links: { source: number; target: number; value: number }[] = []

    // Add module nodes
    for (const mr of moduleResults) {
      nodes.push({ name: mr.module.charAt(0).toUpperCase() + mr.module.slice(1) })
    }

    // Add recipient node
    const recipientIdx = nodes.length
    nodes.push({ name: recipient })

    // Add detail nodes (ministries/regelingen) and links
    for (let i = 0; i < moduleResults.length; i++) {
      const mr = moduleResults[i]
      if (mr.details.length > 0) {
        // Add ministry/regeling detail nodes
        for (const detail of mr.details.slice(0, 5)) {
          const detailName = detail.ministry || detail.regeling || mr.module
          let detailIdx = nodes.findIndex(n => n.name === detailName)
          if (detailIdx === -1) {
            detailIdx = nodes.length
            nodes.push({ name: detailName })
          }
          // Detail → module
          links.push({ source: detailIdx, target: i, value: detail.amount })
        }
        // Module → recipient
        links.push({ source: i, target: recipientIdx, value: mr.year_amount })
      } else {
        // Direct: module → recipient
        links.push({ source: i, target: recipientIdx, value: mr.year_amount })
      }
    }

    const grandTotal = moduleResults.reduce((s, mr) => s + mr.year_amount, 0)

    return NextResponse.json({
      recipient,
      year,
      modules: moduleResults,
      sankey: { nodes, links },
      grand_total: grandTotal,
      module_count: moduleResults.length,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'Alle modules (universal)',
        note: `Op basis van naamherkenning — sommige organisaties kunnen onder meerdere namen voorkomen. ${year === 'totaal' ? 'Cumulatief 2016–2024.' : `Jaar ${year}.`}`,
      },
    })
  } catch (error) {
    console.error('Reverse flow error:', error)
    return NextResponse.json({ error: 'Failed to compute reverse flow data' }, { status: 500 })
  }
}
