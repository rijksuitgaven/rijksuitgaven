/**
 * Admin API: Campaign Detail
 *
 * GET /api/v1/team/mail/campaigns/[id] — Campaign stats + per-recipient events + link stats + device stats
 * DELETE /api/v1/team/mail/campaigns/[id] — Delete campaign + cascading events
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Ongeldig campagne-ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  }

  // Fetch all events for this campaign (include UA columns)
  const { data: events, error: eventsError } = await supabase
    .from('campaign_events')
    .select('person_id, email, event_type, link_url, occurred_at, ua_client, ua_device, ua_os')
    .eq('campaign_id', id)
    .order('occurred_at', { ascending: true })

  if (eventsError) {
    console.error('[Campaign Detail] Events fetch error:', eventsError)
    return NextResponse.json({ error: 'Fout bij ophalen events' }, { status: 500 })
  }

  // Aggregate counts (unique recipients per event type)
  const uniqueByType = new Map<string, Set<string>>()
  for (const evt of events || []) {
    if (!uniqueByType.has(evt.event_type)) {
      uniqueByType.set(evt.event_type, new Set())
    }
    uniqueByType.get(evt.event_type)!.add(evt.email)
  }

  const stats = {
    delivered: uniqueByType.get('delivered')?.size || 0,
    opened: uniqueByType.get('opened')?.size || 0,
    clicked: uniqueByType.get('clicked')?.size || 0,
    bounced: uniqueByType.get('bounced')?.size || 0,
    complained: uniqueByType.get('complained')?.size || 0,
  }

  // Build per-recipient view: one row per email with first occurrence of each event
  const recipientMap = new Map<string, {
    person_id: string | null
    email: string
    delivered_at: string | null
    opened_at: string | null
    clicked_at: string | null
    clicked_url: string | null
    bounced_at: string | null
    complained_at: string | null
    unsubscribed_at: string | null
  }>()

  // Link stats: aggregate clicks per URL
  const linkClickMap = new Map<string, { total: number; clickers: Set<string> }>()

  // Device stats: aggregate UA data
  const clientCounts = new Map<string, number>()
  const deviceCounts = new Map<string, number>()
  const osCounts = new Map<string, number>()

  for (const evt of events || []) {
    if (!recipientMap.has(evt.email)) {
      recipientMap.set(evt.email, {
        person_id: evt.person_id,
        email: evt.email,
        delivered_at: null,
        opened_at: null,
        clicked_at: null,
        clicked_url: null,
        bounced_at: null,
        complained_at: null,
        unsubscribed_at: null,
      })
    }
    const r = recipientMap.get(evt.email)!
    // Store first occurrence only
    switch (evt.event_type) {
      case 'delivered':
        if (!r.delivered_at) r.delivered_at = evt.occurred_at
        break
      case 'opened':
        if (!r.opened_at) r.opened_at = evt.occurred_at
        break
      case 'clicked':
        if (!r.clicked_at) {
          r.clicked_at = evt.occurred_at
          r.clicked_url = evt.link_url
        }
        // Accumulate link stats
        if (evt.link_url) {
          if (!linkClickMap.has(evt.link_url)) {
            linkClickMap.set(evt.link_url, { total: 0, clickers: new Set() })
          }
          const lc = linkClickMap.get(evt.link_url)!
          lc.total++
          lc.clickers.add(evt.email)
        }
        // Accumulate device stats
        if (evt.ua_client) {
          clientCounts.set(evt.ua_client, (clientCounts.get(evt.ua_client) || 0) + 1)
        }
        if (evt.ua_device) {
          deviceCounts.set(evt.ua_device, (deviceCounts.get(evt.ua_device) || 0) + 1)
        }
        if (evt.ua_os) {
          osCounts.set(evt.ua_os, (osCounts.get(evt.ua_os) || 0) + 1)
        }
        break
      case 'bounced':
        if (!r.bounced_at) r.bounced_at = evt.occurred_at
        break
      case 'complained':
        if (!r.complained_at) r.complained_at = evt.occurred_at
        break
    }
  }

  // Enrich with person names and unsubscribe status
  const personIds = [...new Set(
    [...recipientMap.values()]
      .map(r => r.person_id)
      .filter((id): id is string => id !== null)
  )]

  const nameMap = new Map<string, { first_name: string | null; unsubscribed_at: string | null }>()
  if (personIds.length > 0) {
    const { data: persons } = await supabase
      .from('people')
      .select('id, first_name, unsubscribed_at')
      .in('id', personIds)

    for (const p of persons || []) {
      nameMap.set(p.id, { first_name: p.first_name, unsubscribed_at: p.unsubscribed_at })
    }
  }

  const recipients = [...recipientMap.values()].map(r => {
    const person = r.person_id ? nameMap.get(r.person_id) : null
    return {
      ...r,
      first_name: person?.first_name || null,
      unsubscribed_at: person?.unsubscribed_at || null,
    }
  })

  // Build link stats sorted by unique clickers desc
  const link_stats = [...linkClickMap.entries()]
    .map(([url, data]) => ({
      url,
      total_clicks: data.total,
      unique_clickers: data.clickers.size,
    }))
    .sort((a, b) => b.unique_clickers - a.unique_clickers)

  // Build device stats sorted by count desc
  const mapToSorted = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

  const device_stats = {
    clients: mapToSorted(clientCounts),
    devices: mapToSorted(deviceCounts),
    operating_systems: mapToSorted(osCounts),
  }

  return NextResponse.json({
    campaign,
    stats,
    recipients,
    link_stats,
    device_stats,
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Ongeldig campagne-ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // campaign_events has ON DELETE CASCADE, so this cleans up events too
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Campaign Delete] Error:', error)
    return NextResponse.json({ error: 'Fout bij verwijderen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
