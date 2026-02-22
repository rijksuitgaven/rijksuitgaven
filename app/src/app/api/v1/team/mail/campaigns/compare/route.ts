/**
 * Admin API: Campaign Comparison
 *
 * POST /api/v1/team/mail/campaigns/compare — Compare 2-4 campaigns side-by-side
 *
 * Returns per-campaign stats with computed rates (open_rate, click_rate, bounce_rate).
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let body: { campaign_ids?: string[] }
  try {
    const text = await request.text()
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { campaign_ids } = body
  if (!Array.isArray(campaign_ids) || campaign_ids.length < 2 || campaign_ids.length > 4) {
    return NextResponse.json({ error: 'Selecteer 2-4 campagnes' }, { status: 400 })
  }

  if (campaign_ids.some(id => !UUID_REGEX.test(id))) {
    return NextResponse.json({ error: 'Ongeldig campagne-ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch campaigns
  const { data: campaignRows, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, subject, sent_count')
    .in('id', campaign_ids)

  if (campaignsError || !campaignRows) {
    return NextResponse.json({ error: 'Fout bij ophalen campagnes' }, { status: 500 })
  }

  // Fetch events for all campaigns
  const { data: events, error: eventsError } = await supabase
    .from('campaign_events')
    .select('campaign_id, email, event_type')
    .in('campaign_id', campaign_ids)

  if (eventsError) {
    return NextResponse.json({ error: 'Fout bij ophalen events' }, { status: 500 })
  }

  // Aggregate per campaign: unique recipients per event type
  const statsMap = new Map<string, { delivered: Set<string>; opened: Set<string>; clicked: Set<string>; bounced: Set<string> }>()
  for (const id of campaign_ids) {
    statsMap.set(id, { delivered: new Set(), opened: new Set(), clicked: new Set(), bounced: new Set() })
  }

  for (const evt of events || []) {
    const s = statsMap.get(evt.campaign_id)
    if (!s) continue
    switch (evt.event_type) {
      case 'delivered': s.delivered.add(evt.email); break
      case 'opened': s.opened.add(evt.email); break
      case 'clicked': s.clicked.add(evt.email); break
      case 'bounced': s.bounced.add(evt.email); break
    }
  }

  const campaigns = campaignRows.map(c => {
    const s = statsMap.get(c.id)!
    const sentCount = c.sent_count || 0
    return {
      id: c.id,
      subject: c.subject,
      sent_count: sentCount,
      delivered_count: s.delivered.size,
      opened_count: s.opened.size,
      clicked_count: s.clicked.size,
      bounced_count: s.bounced.size,
      open_rate: sentCount > 0 ? (s.opened.size / sentCount) * 100 : 0,
      click_rate: sentCount > 0 ? (s.clicked.size / sentCount) * 100 : 0,
      bounce_rate: sentCount > 0 ? (s.bounced.size / sentCount) * 100 : 0,
    }
  })

  // Preserve order of input campaign_ids
  const ordered = campaign_ids
    .map(id => campaigns.find(c => c.id === id))
    .filter(Boolean)

  return NextResponse.json({ campaigns: ordered })
}
