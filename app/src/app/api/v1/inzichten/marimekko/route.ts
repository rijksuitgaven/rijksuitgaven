/**
 * Inzichten Marimekko API — Ministry size × recipient composition
 *
 * Width = ministry total, height segments = top recipient shares.
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
  const topRecipients = Math.min(parseInt(searchParams.get('top_recipients') || '5'), 10)

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

    // Aggregate by ministry → recipient
    const ministries: Record<string, { total: number; recipients: Record<string, number> }> = {}

    for (const row of rows) {
      const ministry = String(row.begrotingsnaam || 'Onbekend')
      const recipient = String(row.ontvanger || 'Onbekend')
      const amount = Math.max(0, Number(row[yearKey]) || 0)
      if (amount === 0) continue

      if (!ministries[ministry]) ministries[ministry] = { total: 0, recipients: {} }
      ministries[ministry].total += amount
      ministries[ministry].recipients[recipient] = (ministries[ministry].recipients[recipient] || 0) + amount
    }

    // Sort ministries by total
    const grandTotal = Object.values(ministries).reduce((s, m) => s + m.total, 0)

    const sorted = Object.entries(ministries)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 12)
      .map(([name, data]) => {
        // Top recipients within this ministry
        const topRecs = Object.entries(data.recipients)
          .sort(([, a], [, b]) => b - a)
          .slice(0, topRecipients)

        const topTotal = topRecs.reduce((s, [, v]) => s + v, 0)
        const otherTotal = data.total - topTotal

        const segments = [
          ...topRecs.map(([recName, amount]) => ({
            name: recName,
            amount,
            pct: Math.round((amount / data.total) * 1000) / 10,
          })),
          ...(otherTotal > 0
            ? [{ name: 'Overig', amount: otherTotal, pct: Math.round((otherTotal / data.total) * 1000) / 10 }]
            : []),
        ]

        return {
          name,
          total: data.total,
          width_pct: Math.round((data.total / grandTotal) * 1000) / 10,
          recipient_count: Object.keys(data.recipients).length,
          segments,
        }
      })

    return NextResponse.json({
      year,
      grand_total: grandTotal,
      ministries: sorted,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Top ${topRecipients} ontvangers per ministerie. Breedte = ministeriegrootte, hoogte = ontvangersamenstelling.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Marimekko error:', error)
    return NextResponse.json({ error: 'Failed to compute marimekko data' }, { status: 500 })
  }
}
