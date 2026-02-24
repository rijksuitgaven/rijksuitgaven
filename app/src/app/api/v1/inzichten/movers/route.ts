/**
 * Inzichten Movers API — Top N recipients ranked over time
 *
 * For a given module, computes the rank of each recipient per year
 * and returns those that appear in the top N for any year.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULE_TABLE: Record<string, string> = {
  instrumenten: 'instrumenten_aggregated',
  apparaat: 'apparaat_aggregated',
  inkoop: 'inkoop_aggregated',
  provincie: 'provincie_aggregated',
  gemeente: 'gemeente_aggregated',
  publiek: 'publiek_aggregated',
}

const MODULE_PRIMARY: Record<string, string> = {
  instrumenten: 'ontvanger',
  apparaat: 'kostensoort',
  inkoop: 'leverancier',
  provincie: 'ontvanger',
  gemeente: 'ontvanger',
  publiek: 'ontvanger',
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const top = Math.min(parseInt(searchParams.get('top') || '25'), 50)

  const table = MODULE_TABLE[module]
  const primary = MODULE_PRIMARY[module]
  if (!table || !primary) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Fetch all rows with year columns (aggregated views are manageable size)
    const { data: rawData, error } = await supabase
      .from(table)
      .select('*')
      .gt('totaal', 0)
      .order('totaal', { ascending: false })
      .limit(50000)

    if (error) throw error
    const data = (rawData || []) as unknown as Record<string, unknown>[]

    // For each year, rank all recipients by amount DESC
    const yearRanks: Record<string, Map<string, number>> = {}
    const yearAmounts: Record<string, Map<string, number>> = {}

    for (const year of YEARS) {
      const yearStr = String(year)
      const sorted = data
        .map(row => ({ name: row[primary] as string, amount: Number(row[yearStr]) || 0 }))
        .filter(r => r.amount > 0)
        .sort((a, b) => b.amount - a.amount)

      const rankMap = new Map<string, number>()
      const amountMap = new Map<string, number>()
      sorted.forEach((item, idx) => {
        rankMap.set(item.name, idx + 1)
        amountMap.set(item.name, item.amount)
      })
      yearRanks[yearStr] = rankMap
      yearAmounts[yearStr] = amountMap
    }

    // Find all recipients that appear in top N for ANY year
    const topRecipients = new Set<string>()
    for (const year of YEARS) {
      const yearStr = String(year)
      const rankMap = yearRanks[yearStr]
      for (const [name, rank] of rankMap) {
        if (rank <= top) topRecipients.add(name)
      }
    }

    // Build result with ranks and amounts per year
    const recipients = Array.from(topRecipients).map(name => {
      const ranks: Record<string, number | null> = {}
      const amounts: Record<string, number | null> = {}

      for (const year of YEARS) {
        const yearStr = String(year)
        const rank = yearRanks[yearStr].get(name)
        const amount = yearAmounts[yearStr].get(name)
        ranks[yearStr] = rank !== undefined && rank <= top * 2 ? rank : null
        amounts[yearStr] = amount !== undefined ? amount : null
      }

      const totalRow = data.find(r => r[primary] === name)
      return {
        name,
        ranks,
        amounts,
        totaal: Number(totalRow?.totaal) || 0,
      }
    })

    // Sort by total DESC
    recipients.sort((a, b) => b.totaal - a.totaal)

    return NextResponse.json({
      module,
      top,
      total_entities: data?.length || 0,
      recipients: recipients.slice(0, top * 2),
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${module}_aggregated`,
        amount_unit: 'EUR',
      },
    })
  } catch (error) {
    console.error('Movers error:', error)
    return NextResponse.json({ error: 'Failed to compute movers' }, { status: 500 })
  }
}
