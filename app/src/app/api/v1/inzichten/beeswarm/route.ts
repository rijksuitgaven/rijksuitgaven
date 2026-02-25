/**
 * Inzichten Beeswarm API — Distribution of all recipients as dots
 *
 * Returns all entities with their amounts for beeswarm/strip plot visualization.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const MODULE_VIEWS: Record<string, { view: string; primary: string; group?: string }> = {
  instrumenten: { view: 'instrumenten_aggregated', primary: 'ontvanger', group: 'begrotingsnaam' },
  apparaat: { view: 'apparaat_aggregated', primary: 'kostensoort', group: 'begrotingsnaam' },
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
  const year = searchParams.get('year') || '2024'

  const config = MODULE_VIEWS[module]
  if (!config) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const yearColumns = YEARS.map(y => `"${y}"`).join(', ')

  try {
    const { data: rawData, error } = await supabase
      .from(config.view)
      .select(`${config.primary}${config.group ? `, ${config.group}` : ''}, ${yearColumns}, totaal`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const rows = (rawData || []) as unknown as Record<string, unknown>[]

    const yearKey = year === 'totaal' ? 'totaal' : year

    // Group by primary field
    const grouped: Record<string, { amount: number; ministry?: string }> = {}

    for (const row of rows) {
      const name = String(row[config.primary] || 'Onbekend')
      const amount = Number(row[yearKey]) || 0
      if (amount <= 0) continue

      if (!grouped[name]) {
        grouped[name] = {
          amount: 0,
          ministry: config.group ? String(row[config.group] || '') : undefined,
        }
      }
      grouped[name].amount += amount
    }

    // Build entities list, sorted by amount
    const entities = Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        ministry: data.ministry,
        log_amount: Math.log10(Math.max(1, data.amount)),
      }))
      .sort((a, b) => b.amount - a.amount)

    // Compute distribution buckets
    const amounts = entities.map(e => e.amount)
    const brackets = [
      { label: '<€10K', min: 0, max: 10000 },
      { label: '€10K-€100K', min: 10000, max: 100000 },
      { label: '€100K-€1M', min: 100000, max: 1000000 },
      { label: '€1M-€10M', min: 1000000, max: 10000000 },
      { label: '€10M-€100M', min: 10000000, max: 100000000 },
      { label: '€100M-€1B', min: 100000000, max: 1000000000 },
      { label: '>€1B', min: 1000000000, max: Infinity },
    ].map(b => ({
      ...b,
      count: amounts.filter(a => a >= b.min && a < b.max).length,
    }))

    return NextResponse.json({
      module,
      year,
      total_entities: entities.length,
      entities: entities.slice(0, 2000), // Cap at 2000 for rendering
      brackets,
      stats: {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: amounts[Math.floor(amounts.length / 2)] || 0,
        p90: amounts[Math.floor(amounts.length * 0.1)] || 0,
        p99: amounts[Math.floor(amounts.length * 0.01)] || 0,
      },
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: config.view,
        note: `Alle ontvangers als individuele punten. ${entities.length} entiteiten.${year === '2024' ? ' *2024 data kan onvolledig zijn.' : ''}`,
      },
    })
  } catch (error) {
    console.error('Beeswarm error:', error)
    return NextResponse.json({ error: 'Failed to compute beeswarm data' }, { status: 500 })
  }
}
