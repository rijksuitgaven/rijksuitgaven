/**
 * Admin API: Feedback Management
 *
 * GET /api/v1/team/feedback — List all feedback (with optional count_only mode)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get('count_only') === 'true'

  const supabase = createAdminClient()

  if (countOnly) {
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'nieuw')

    return NextResponse.json({ new_count: count || 0 })
  }

  // Fetch all feedback
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] List feedback error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen feedback' }, { status: 500 })
  }

  // Generate signed URLs for screenshots
  const items = await Promise.all(
    (data || []).map(async (item) => {
      if (item.screenshot_path) {
        const { data: urlData } = await supabase.storage
          .from('feedback-screenshots')
          .createSignedUrl(item.screenshot_path, 3600)
        return { ...item, screenshot_url: urlData?.signedUrl || null }
      }
      return { ...item, screenshot_url: null }
    })
  )

  return NextResponse.json({ items })
}
