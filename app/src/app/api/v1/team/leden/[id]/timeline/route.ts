/**
 * Admin API: Per-Person Email Timeline
 *
 * GET /api/v1/team/leden/[id]/timeline — All campaign events for a person
 *
 * Takes a subscription ID, resolves person_id, returns grouped timeline + engagement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface EngagementResult {
  engagement_level: string
  last_engagement_at: string | null
  campaigns_sent: number
  campaigns_opened: number
  campaigns_clicked: number
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up subscription → person_id
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('person_id, plan, role, start_date, end_date, grace_ends_at, cancelled_at')
    .eq('id', id)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
  }

  // Get person data
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, pipeline_stage, bounced_at, unsubscribed_at')
    .eq('id', sub.person_id)
    .single()

  if (personError || !person) {
    return NextResponse.json({ error: 'Persoon niet gevonden' }, { status: 404 })
  }

  // Fetch all campaign events for this person
  const { data: events, error: eventsError } = await supabase
    .from('campaign_events')
    .select('campaign_id, event_type, occurred_at, link_url, ua_client')
    .eq('person_id', person.id)
    .order('occurred_at', { ascending: false })

  if (eventsError) {
    console.error('[Timeline] Events fetch error:', eventsError)
    return NextResponse.json({ error: 'Fout bij ophalen events' }, { status: 500 })
  }

  // Get campaign metadata for all campaign_ids
  const campaignIds = [...new Set((events || []).map(e => e.campaign_id).filter(Boolean))]
  const campaignMap = new Map<string, { subject: string; sent_at: string | null }>()

  if (campaignIds.length > 0) {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, subject, sent_at')
      .in('id', campaignIds)

    for (const c of campaigns || []) {
      campaignMap.set(c.id, { subject: c.subject, sent_at: c.sent_at })
    }
  }

  // Group events by campaign
  const timelineMap = new Map<string, {
    campaign_id: string
    campaign_subject: string
    campaign_sent_at: string | null
    events: Array<{ event_type: string; occurred_at: string; link_url: string | null; ua_client: string | null }>
  }>()

  for (const evt of events || []) {
    if (!evt.campaign_id) continue
    if (!timelineMap.has(evt.campaign_id)) {
      const campaign = campaignMap.get(evt.campaign_id)
      timelineMap.set(evt.campaign_id, {
        campaign_id: evt.campaign_id,
        campaign_subject: campaign?.subject || 'Onbekende campagne',
        campaign_sent_at: campaign?.sent_at || null,
        events: [],
      })
    }
    timelineMap.get(evt.campaign_id)!.events.push({
      event_type: evt.event_type,
      occurred_at: evt.occurred_at,
      link_url: evt.link_url,
      ua_client: evt.ua_client,
    })
  }

  // Sort timeline by campaign sent_at desc
  const timeline = [...timelineMap.values()].sort((a, b) => {
    const aTime = a.campaign_sent_at || ''
    const bTime = b.campaign_sent_at || ''
    return bTime.localeCompare(aTime)
  })

  // Get engagement score
  const { data: engagementData } = await supabase.rpc('get_person_engagement', {
    p_person_id: person.id,
  })

  const engRow = (engagementData as EngagementResult[] | null)?.[0]
  const engagement = engRow
    ? {
        level: engRow.engagement_level,
        last_engagement_at: engRow.last_engagement_at,
        campaigns_sent: engRow.campaigns_sent,
        campaigns_opened: engRow.campaigns_opened,
        campaigns_clicked: engRow.campaigns_clicked,
      }
    : { level: 'new', last_engagement_at: null, campaigns_sent: 0, campaigns_opened: 0, campaigns_clicked: 0 }

  return NextResponse.json({
    person,
    subscription: sub,
    timeline,
    engagement,
  })
}
