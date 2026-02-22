/**
 * Admin API: Engagement Scores
 *
 * GET /api/v1/team/leden/engagement — Bulk engagement scores for all persons
 *
 * Returns Record<person_id, { level, last_engagement_at, campaigns_sent/opened/clicked }>
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

interface EngagementRow {
  person_id: string
  engagement_level: string
  last_engagement_at: string | null
  campaigns_sent: number
  campaigns_opened: number
  campaigns_clicked: number
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_engagement_scores')

  if (error) {
    console.error('[Engagement] RPC error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen engagement' }, { status: 500 })
  }

  // Convert array to map keyed by person_id
  const engagement: Record<string, {
    level: string
    last_engagement_at: string | null
    campaigns_sent: number
    campaigns_opened: number
    campaigns_clicked: number
  }> = {}

  for (const row of (data as EngagementRow[]) || []) {
    engagement[row.person_id] = {
      level: row.engagement_level,
      last_engagement_at: row.last_engagement_at,
      campaigns_sent: row.campaigns_sent,
      campaigns_opened: row.campaigns_opened,
      campaigns_clicked: row.campaigns_clicked,
    }
  }

  return NextResponse.json({ engagement })
}
