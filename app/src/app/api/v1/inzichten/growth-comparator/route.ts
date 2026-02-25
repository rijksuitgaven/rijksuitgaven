/**
 * Inzichten Growth Comparator API — Indexed growth lines
 *
 * Returns time series for up to 5 entities, rebased to index 100
 * in a user-selected base year. Supports absolute and indexed modes.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const MODULE_VIEWS: Record<string, { view: string; primary: string }> = {
  instrumenten: { view: 'instrumenten_aggregated', primary: 'ontvanger' },
  apparaat: { view: 'apparaat_aggregated', primary: 'kostensoort' },
  inkoop: { view: 'inkoop_aggregated', primary: 'leverancier' },
  provincie: { view: 'provincie_aggregated', primary: 'ontvanger' },
  gemeente: { view: 'gemeente_aggregated', primary: 'ontvanger' },
  publiek: { view: 'publiek_aggregated', primary: 'ontvanger' },
}

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') || 'instrumenten'
  const entitiesParam = searchParams.get('entities') || ''
  const baseYear = parseInt(searchParams.get('base_year') || '2016')

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const entityNames = entitiesParam.split(',').map(e => e.trim()).filter(Boolean).slice(0, 5)
  if (entityNames.length === 0) {
    return NextResponse.json({ error: 'No entities specified' }, { status: 400 })
  }

  if (!YEARS.includes(baseYear)) {
    return NextResponse.json({ error: `Invalid base year: ${baseYear}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    // Fetch all requested entities
    const { data: rawData, error } = await supabase
      .from(config.view)
      .select(`${config.primary}, ${yearColumns}, totaal`)
      .in(config.primary, entityNames)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    const entities = rows.map(row => {
      const name = String(row[config.primary] || '')
      const baseAmount = Number(row[String(baseYear)]) || 0
      const hasBase = baseAmount > 0

      const absolute = YEARS.map(y => ({
        year: y,
        value: Number(row[String(y)]) || 0,
      }))

      const indexed = YEARS.map(y => ({
        year: y,
        value: hasBase ? Math.round(((Number(row[String(y)]) || 0) / baseAmount) * 100 * 10) / 10 : 0,
      }))

      return {
        name,
        total: Number(row.totaal) || 0,
        base_year: baseYear,
        base_amount: baseAmount,
        has_base: hasBase,
        small_base: hasBase && baseAmount < 1_000_000,
        absolute,
        indexed,
      }
    })

    // Also provide autocomplete suggestions for entity picker
    const { data: topEntities } = await supabase
      .from(config.view)
      .select(config.primary)
      .gt('totaal', 0)
      .order('totaal', { ascending: false })
      .limit(50)

    const suggestions = (topEntities || []).map(row => {
      const r = row as unknown as Record<string, unknown>
      return String(r[config.primary] || '')
    })

    return NextResponse.json({
      module,
      base_year: baseYear,
      entities,
      suggestions,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: `${config.view}`,
        note: `Index 100 = bedrag in basisjaar ${baseYear}. Entiteiten zonder bedrag in basisjaar zijn uitgesloten van indexering.`,
      },
    })
  } catch (error) {
    console.error('Growth comparator error:', error)
    return NextResponse.json({ error: 'Failed to compute growth data' }, { status: 500 })
  }
}
