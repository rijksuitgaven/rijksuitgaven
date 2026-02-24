/**
 * Inzichten New Entrants API — First-appearance detection across all modules
 *
 * Computes the first year each recipient appeared with a non-zero amount,
 * then returns entrants for the selected year above a minimum threshold.
 * All amounts normalized to absolute EUR.
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
  const targetYear = parseInt(searchParams.get('year') || '2024')
  const minAmount = parseInt(searchParams.get('min_amount') || '1000000')

  if (targetYear < 2017 || targetYear > 2024) {
    return NextResponse.json({ error: 'Year must be 2017-2024' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // Fetch from universal_search — already normalized to EUR, has all modules
    const { data: rawData, error } = await supabase
      .from('universal_search')
      .select('*')
      .gt('totaal', 0)
      .order('totaal', { ascending: false })
      .limit(50000)

    if (error) throw error
    const data = (rawData || []) as unknown as Record<string, unknown>[]

    // Compute first appearance year for each recipient
    const entrants: {
      ontvanger: string
      first_year: number
      first_amount: number
      totaal: number
      sources: string
      source_count: number
      subsequent: Record<string, number>
    }[] = []

    for (const row of data) {
      let firstYear: number | null = null
      let firstAmount = 0

      for (const year of YEARS) {
        const amount = Number(row[String(year)]) || 0
        if (amount > 0 && firstYear === null) {
          firstYear = year
          firstAmount = amount
          break
        }
      }

      if (firstYear === targetYear && firstAmount >= minAmount) {
        const subsequent: Record<string, number> = {}
        for (const year of YEARS) {
          subsequent[String(year)] = Number(row[String(year)]) || 0
        }

        entrants.push({
          ontvanger: row.ontvanger as string,
          first_year: firstYear,
          first_amount: firstAmount,
          totaal: Number(row.totaal) || 0,
          sources: row.sources as string,
          source_count: Number(row.source_count) || 1,
          subsequent,
        })
      }
    }

    // Sort by first year amount descending
    entrants.sort((a, b) => b.first_amount - a.first_amount)

    // Summary stats
    const totalNewAmount = entrants.reduce((sum, e) => sum + e.first_amount, 0)

    // Per-year counts (for the year selector)
    const yearCounts: Record<string, number> = {}
    for (const year of YEARS.filter(y => y >= 2017)) {
      let count = 0
      for (const row of data) {
        let fy: number | null = null
        for (const y of YEARS) {
          if ((Number(row[String(y)]) || 0) > 0 && fy === null) {
            fy = y
            break
          }
        }
        if (fy === year && (Number(row[String(year)]) || 0) >= minAmount) count++
      }
      yearCounts[String(year)] = count
    }

    return NextResponse.json({
      year: targetYear,
      min_amount: minAmount,
      entrants: entrants.slice(0, 100),
      total_count: entrants.length,
      total_amount: totalNewAmount,
      year_counts: yearCounts,
      data_notes: {
        last_updated: new Date().toISOString().split('T')[0],
        scope: 'universal_search (5 modules, excl. apparaat)',
        note: 'Eerste verschijning in deze dataset — de organisatie kan al langer bestaan.',
      },
    })
  } catch (error) {
    console.error('New entrants error:', error)
    return NextResponse.json({ error: 'Failed to compute new entrants' }, { status: 500 })
  }
}
