/**
 * Admin API: Campaign History
 *
 * GET /api/v1/team/mail/campaigns — List sent campaigns (newest first)
 *
 * Returns compose fields for reuse as templates.
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, subject, heading, preheader, body, cta_text, cta_url, segment, sent_count, failed_count, sent_at')
    .order('sent_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Campaigns] Fetch error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen campagnes' }, { status: 500 })
  }

  return NextResponse.json({ campaigns: data })
}
