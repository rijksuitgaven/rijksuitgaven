/**
 * Public API: Email Preferences
 *
 * GET  /api/v1/preferences?token=xxx — Get person's topic preferences
 * POST /api/v1/preferences — Update preferences
 *
 * Public endpoint — secured by unsubscribe_token (no admin check).
 * Rate limited: 10 requests per minute per IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

// In-memory rate limit (same pattern as magic-link)
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS = 10

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS * 2
  for (const [key, ts] of rateLimitMap) {
    if (ts < cutoff) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const key = `pref:${ip}`

  // Count recent requests
  let count = 0
  for (const [k, ts] of rateLimitMap) {
    if (k.startsWith(`pref:${ip}:`) && ts > now - RATE_LIMIT_WINDOW_MS) {
      count++
    }
  }

  if (count >= MAX_REQUESTS) return true

  rateLimitMap.set(`pref:${ip}:${now}`, now)
  return false
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 })
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token || token.length < 10 || token.length > 200) {
    return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up person by unsubscribe_token
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('id, email, first_name, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .single()

  if (personError || !person) {
    return NextResponse.json({ error: 'Token niet gevonden' }, { status: 404 })
  }

  // Get all topics
  const { data: topics } = await supabase
    .from('email_topics')
    .select('*')
    .order('sort_order', { ascending: true })

  // Get person's preferences
  const { data: preferences } = await supabase
    .from('email_preferences')
    .select('topic_id, subscribed')
    .eq('person_id', person.id)

  const prefMap = new Map<string, boolean>()
  for (const p of preferences || []) {
    prefMap.set(p.topic_id, p.subscribed)
  }

  // Build response with preference per topic
  const topicPreferences = (topics || []).map(t => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    subscribed: prefMap.has(t.id) ? prefMap.get(t.id)! : t.is_default,
  }))

  return NextResponse.json({
    person: {
      first_name: person.first_name,
      email: person.email,
      unsubscribed: !!person.unsubscribed_at,
    },
    topics: topicPreferences,
  })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Te veel verzoeken' }, { status: 429 })
  }

  let body: {
    token?: string
    preferences?: { topic_id: string; subscribed: boolean }[]
    unsubscribe_all?: boolean
  }
  try {
    const text = await request.text()
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  if (!body.token || body.token.length < 10 || body.token.length > 200) {
    return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up person
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('id')
    .eq('unsubscribe_token', body.token)
    .single()

  if (personError || !person) {
    return NextResponse.json({ error: 'Token niet gevonden' }, { status: 404 })
  }

  // Handle full unsubscribe
  if (body.unsubscribe_all) {
    await supabase
      .from('people')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', person.id)

    return NextResponse.json({ ok: true, unsubscribed: true })
  }

  // Handle re-subscribe (clear unsubscribed_at if was unsubscribed and setting preferences)
  if (body.preferences && body.preferences.length > 0) {
    // Clear unsubscribed_at to re-subscribe
    await supabase
      .from('people')
      .update({ unsubscribed_at: null })
      .eq('id', person.id)
      .not('unsubscribed_at', 'is', null)

    // Upsert preferences
    const upserts = body.preferences.map(p => ({
      person_id: person.id,
      topic_id: p.topic_id,
      subscribed: p.subscribed,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('email_preferences')
      .upsert(upserts, { onConflict: 'person_id,topic_id' })

    if (error) {
      console.error('[Preferences] Upsert error:', error)
      return NextResponse.json({ error: 'Fout bij opslaan voorkeuren' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
