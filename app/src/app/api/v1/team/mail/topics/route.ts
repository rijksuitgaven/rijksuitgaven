/**
 * Admin API: Email Topics
 *
 * GET  /api/v1/team/mail/topics — List all topics
 * POST /api/v1/team/mail/topics — Create new topic
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: topics, error } = await supabase
    .from('email_topics')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Fout bij ophalen topics' }, { status: 500 })
  }

  return NextResponse.json({ topics: topics || [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let body: { name?: string; slug?: string; description?: string; is_default?: boolean; sort_order?: number }
  try {
    const text = await request.text()
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  if (!body.name?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'Naam en slug zijn verplicht' }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json({ error: 'Slug mag alleen kleine letters, cijfers en streepjes bevatten' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: topic, error } = await supabase
    .from('email_topics')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      is_default: body.is_default ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug bestaat al' }, { status: 409 })
    }
    console.error('[Topics] Create error:', error)
    return NextResponse.json({ error: 'Fout bij aanmaken topic' }, { status: 500 })
  }

  return NextResponse.json({ topic }, { status: 201 })
}
