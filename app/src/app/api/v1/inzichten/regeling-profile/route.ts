/**
 * Inzichten Regeling Profile API — Regeling-centric distribution
 *
 * For a given regeling, shows: total, recipient count, average,
 * concentration (Gini, top-5), distribution histogram, and recipient list.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const BRACKETS = [
  { label: '< €100K', min: 0, max: 100_000 },
  { label: '€100K–€1M', min: 100_000, max: 1_000_000 },
  { label: '€1M–€10M', min: 1_000_000, max: 10_000_000 },
  { label: '€10M+', min: 10_000_000, max: Infinity },
]

function computeGini(sortedAsc: number[]): number {
  const n = sortedAsc.length
  if (n === 0) return 0
  const total = sortedAsc.reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  let numerator = 0
  for (let i = 0; i < n; i++) {
    numerator += (i + 1) * sortedAsc[i]
  }
  return (2 * numerator) / (n * total) - (n + 1) / n
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const regeling = searchParams.get('regeling') || ''
  const year = searchParams.get('year') || '2024'
  const mode = searchParams.get('mode') || 'profile' // 'profile' or 'list'

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    if (mode === 'list') {
      // Return list of all regelingen with recipient counts
      const { data: rawData, error } = await supabase
        .from('instrumenten_aggregated')
        .select('regeling, totaal')
        .gt('totaal', 0)
        .limit(50000)

      if (error) throw error
      const rows = (rawData || []) as unknown as Record<string, unknown>[]

      const regelingen: Record<string, { count: number; total: number }> = {}
      for (const row of rows) {
        const reg = String(row.regeling || 'Geen regeling')
        if (!regelingen[reg]) regelingen[reg] = { count: 0, total: 0 }
        regelingen[reg].count++
        regelingen[reg].total += Number(row.totaal) || 0
      }

      const sorted = Object.entries(regelingen)
        .map(([name, data]) => ({ name, count: data.count, total: data.total }))
        .sort((a, b) => b.total - a.total)

      return NextResponse.json({ regelingen: sorted })
    }

    if (!regeling) {
      return NextResponse.json({ error: 'regeling parameter required' }, { status: 400 })
    }

    // Fetch all rows for this regeling
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`ontvanger, begrotingsnaam, regeling, ${yearColumns}, totaal`)
      .eq('regeling', regeling)
      .gt('totaal', 0)
      .limit(10000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Regeling niet gevonden', regeling }, { status: 404 })
    }

    const yearCol = year === 'totaal' ? 'totaal' : year
    const amounts = rows
      .map(row => ({
        name: String(row.ontvanger || ''),
        ministry: String(row.begrotingsnaam || ''),
        amount: Number(row[yearCol]) || 0,
        total: Number(row.totaal) || 0,
        sparkline: YEARS.map(y => ({ year: y, value: Number(row[String(y)]) || 0 })),
      }))
      .filter(r => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    const totalAmount = amounts.reduce((s, a) => s + a.amount, 0)
    const recipientCount = amounts.length
    const average = recipientCount > 0 ? totalAmount / recipientCount : 0

    // Gini
    const sortedAsc = amounts.map(a => a.amount).sort((a, b) => a - b)
    const gini = recipientCount > 10 ? Math.round(computeGini(sortedAsc) * 1000) / 1000 : null

    // Top-5 share
    const top5 = amounts.slice(0, 5)
    const top5Total = top5.reduce((s, a) => s + a.amount, 0)
    const top5Share = totalAmount > 0 ? Math.round((top5Total / totalAmount) * 1000) / 10 : 0

    // Distribution histogram
    const histogram = BRACKETS.map(b => ({
      label: b.label,
      count: amounts.filter(a => a.amount >= b.min && (b.max === Infinity ? true : a.amount < b.max)).length,
    }))

    // Ministry context
    const ministries = [...new Set(rows.map(r => String((r as Record<string, unknown>).begrotingsnaam || '')))]

    return NextResponse.json({
      regeling,
      year,
      profile: {
        total_amount: totalAmount,
        recipient_count: recipientCount,
        average,
        gini,
        top_5_share: top5Share,
        top_5: top5.map(a => ({ name: a.name, amount: a.amount })),
        ministries,
      },
      histogram,
      recipients: amounts.slice(0, 50).map(a => ({
        name: a.name,
        amount: a.amount,
        total: a.total,
        sparkline: a.sparkline,
      })),
      total_recipients: recipientCount,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Profiel van regeling "${regeling}". Bron: Instrumenten.${gini === null ? ' Gini niet berekend (minder dan 10 ontvangers).' : ''} ${year === '2024' ? '*2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Regeling profile error:', error)
    return NextResponse.json({ error: 'Failed to compute regeling profile' }, { status: 500 })
  }
}
