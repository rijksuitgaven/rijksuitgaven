/**
 * Inzichten Anomalies API — Dramatic year-over-year changes
 *
 * Compares consecutive year columns in universal_search to flag
 * statistical outliers: explosive growth, sharp decline, new large
 * entrants, and disappearances.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

type AnomalyType = 'explosive_growth' | 'sharp_decline' | 'new_large' | 'disappeared'

interface Anomaly {
  ontvanger: string
  type: AnomalyType
  amount_from: number
  amount_to: number
  abs_change: number
  pct_change: number | null
  sources: string
  source_count: number
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const yearFrom = parseInt(searchParams.get('year_from') || '2023')
  const yearTo = parseInt(searchParams.get('year_to') || '2024')
  const minAmount = parseInt(searchParams.get('min_amount') || '1000000')

  if (yearFrom < 2016 || yearTo > 2024 || yearTo <= yearFrom) {
    return NextResponse.json({ error: 'Invalid year range' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    const yearFromStr = String(yearFrom)
    const yearToStr = String(yearTo)

    const { data: rawData, error } = await supabase
      .from('universal_search')
      .select(`ontvanger, "${yearFromStr}", "${yearToStr}", totaal, sources, source_count`)
      .gt('totaal', 0)
      .limit(50000)

    if (error) throw error
    const data = (rawData || []) as unknown as Record<string, unknown>[]

    const anomalies: Anomaly[] = []

    for (const row of data) {
      const amountFrom = Number(row[yearFromStr]) || 0
      const amountTo = Number(row[yearToStr]) || 0
      const absChange = Math.abs(amountTo - amountFrom)

      let type: AnomalyType | null = null
      let pctChange: number | null = null

      if (amountFrom > 0) {
        pctChange = ((amountTo - amountFrom) / amountFrom) * 100
      }

      // Classification rules
      if (amountFrom === 0 && amountTo >= minAmount) {
        // New & large
        type = 'new_large'
      } else if (amountTo === 0 && amountFrom >= minAmount) {
        // Disappeared
        type = 'disappeared'
        pctChange = -100
      } else if (amountFrom > 0 && amountTo > 0) {
        if (pctChange !== null && pctChange >= 500 && amountTo >= minAmount) {
          // Explosive growth: >500% AND > threshold in new year
          type = 'explosive_growth'
        } else if (pctChange !== null && pctChange <= -80 && amountFrom >= minAmount) {
          // Sharp decline: >80% drop AND was > threshold
          type = 'sharp_decline'
        }
      }

      if (type) {
        anomalies.push({
          ontvanger: row.ontvanger as string,
          type,
          amount_from: amountFrom,
          amount_to: amountTo,
          abs_change: absChange,
          pct_change: pctChange !== null ? Math.round(pctChange * 10) / 10 : null,
          sources: row.sources as string,
          source_count: Number(row.source_count) || 1,
        })
      }
    }

    // Sort by absolute change descending
    anomalies.sort((a, b) => b.abs_change - a.abs_change)

    // Summary counts
    const summary = {
      explosive_growth: 0,
      sharp_decline: 0,
      new_large: 0,
      disappeared: 0,
      total_amount_involved: 0,
    }
    for (const a of anomalies) {
      summary[a.type]++
      summary.total_amount_involved += a.abs_change
    }

    return NextResponse.json({
      year_from: yearFrom,
      year_to: yearTo,
      min_amount: minAmount,
      anomalies: anomalies.slice(0, 200),
      total_count: anomalies.length,
      summary,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'universal_search (alle modules)',
        amount_unit: 'EUR',
        note: 'Verschijning/verdwijning = binnen deze dataset. Organisaties kunnen onder andere namen voorkomen.',
      },
    })
  } catch (error) {
    console.error('Anomalies error:', error)
    return NextResponse.json({ error: 'Failed to compute anomalies' }, { status: 500 })
  }
}
