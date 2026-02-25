/**
 * Inzichten Sunburst API — Hierarchical spending breakdown
 *
 * Returns tree: Ministerie → Regeling → Top ontvangers
 * for building a sunburst / nested treemap visualization.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || '2024'
  const topRegelingen = Math.min(parseInt(searchParams.get('top_regelingen') || '15'), 30)
  const topOntvangers = Math.min(parseInt(searchParams.get('top_ontvangers') || '5'), 10)

  const supabase = createAdminClient()
  const yearCol = year === 'totaal' ? 'totaal' : `"${year}"`

  try {
    const { data: rawData, error } = await supabase
      .from('instrumenten_aggregated')
      .select(`begrotingsnaam, regeling, ontvanger, ${yearCol}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    // Build hierarchy: ministry → regeling → ontvanger
    const tree: Record<string, Record<string, Record<string, number>>> = {}
    let grandTotal = 0

    for (const row of rows) {
      const ministry = String(row.begrotingsnaam || 'Onbekend')
      const regeling = String(row.regeling || 'Geen regeling')
      const ontvanger = String(row.ontvanger || 'Onbekend')
      const amount = Math.max(0, Number(row[year === 'totaal' ? 'totaal' : year]) || 0)

      if (amount <= 0) continue
      grandTotal += amount

      if (!tree[ministry]) tree[ministry] = {}
      if (!tree[ministry][regeling]) tree[ministry][regeling] = {}
      tree[ministry][regeling][ontvanger] = (tree[ministry][regeling][ontvanger] || 0) + amount
    }

    // Build sunburst children
    const children = Object.entries(tree)
      .map(([ministry, regelingen]) => {
        const regelingenArr = Object.entries(regelingen)
          .map(([regeling, ontvangers]) => {
            const regelingTotal = Object.values(ontvangers).reduce((s, v) => s + v, 0)

            // Top ontvangers per regeling
            const topOntvArr = Object.entries(ontvangers)
              .sort((a, b) => b[1] - a[1])
              .slice(0, topOntvangers)

            const topOntvTotal = topOntvArr.reduce((s, [, v]) => s + v, 0)
            const overigOntv = regelingTotal - topOntvTotal

            const ontvChildren = topOntvArr.map(([name, value]) => ({
              name,
              value,
            }))

            if (overigOntv > 0) {
              ontvChildren.push({ name: 'Overig', value: overigOntv })
            }

            return {
              name: regeling,
              value: regelingTotal,
              children: ontvChildren,
            }
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, topRegelingen)

        const ministryTotal = regelingenArr.reduce((s, r) => s + r.value, 0)
        const origMinistryTotal = Object.values(regelingen).reduce(
          (s, ontvangers) => s + Object.values(ontvangers).reduce((s2, v) => s2 + v, 0), 0
        )
        const overigRegeling = origMinistryTotal - ministryTotal

        if (overigRegeling > 0) {
          regelingenArr.push({
            name: 'Overige regelingen',
            value: overigRegeling,
            children: [],
          })
        }

        return {
          name: ministry,
          value: origMinistryTotal,
          children: regelingenArr,
        }
      })
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      year,
      tree: {
        name: 'Rijksoverheid',
        value: grandTotal,
        children,
      },
      total: grandTotal,
      ministry_count: children.length,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'instrumenten_aggregated',
        note: `Hiërarchie: Ministerie → Regeling → Ontvanger. Top ${topRegelingen} regelingen per ministerie, top ${topOntvangers} ontvangers per regeling. Negatieve bedragen uitgesloten.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Sunburst error:', error)
    return NextResponse.json({ error: 'Failed to compute sunburst data' }, { status: 500 })
  }
}
