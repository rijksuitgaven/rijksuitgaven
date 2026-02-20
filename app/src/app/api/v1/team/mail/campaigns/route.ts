/**
 * Admin API: Campaign History
 *
 * GET /api/v1/team/mail/campaigns — List sent campaigns with engagement stats
 *
 * Returns compose fields for reuse as templates, plus aggregated open/click counts.
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Fetch campaigns (drafts + sent)
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, subject, heading, preheader, body, cta_text, cta_url, segment, sent_count, failed_count, sent_at, status, updated_at')
    .order('status', { ascending: true }) // 'draft' before 'sent'
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Campaigns] Fetch error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen campagnes' }, { status: 500 })
  }

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ campaigns: [] })
  }

  // Fetch aggregated event counts per campaign
  const campaignIds = campaigns.map(c => c.id)
  const { data: events } = await supabase
    .from('campaign_events')
    .select('campaign_id, event_type, email')
    .in('campaign_id', campaignIds)

  // Build unique-recipient counts per campaign per event type
  const statsMap = new Map<string, { delivered: Set<string>; opened: Set<string>; clicked: Set<string>; bounced: Set<string> }>()

  for (const evt of events || []) {
    if (!statsMap.has(evt.campaign_id)) {
      statsMap.set(evt.campaign_id, {
        delivered: new Set(),
        opened: new Set(),
        clicked: new Set(),
        bounced: new Set(),
      })
    }
    const s = statsMap.get(evt.campaign_id)!
    if (evt.event_type === 'delivered') s.delivered.add(evt.email)
    else if (evt.event_type === 'opened') s.opened.add(evt.email)
    else if (evt.event_type === 'clicked') s.clicked.add(evt.email)
    else if (evt.event_type === 'bounced') s.bounced.add(evt.email)
  }

  const enriched = campaigns.map(c => {
    const s = statsMap.get(c.id)
    return {
      ...c,
      delivered_count: s?.delivered.size || 0,
      opened_count: s?.opened.size || 0,
      clicked_count: s?.clicked.size || 0,
      bounced_count: s?.bounced.size || 0,
    }
  })

  return NextResponse.json({ campaigns: enriched })
}
