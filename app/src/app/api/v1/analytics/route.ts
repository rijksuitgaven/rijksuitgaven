/**
 * Analytics Event Ingestion (UX-032)
 *
 * POST /api/v1/analytics — Receive batched events from client
 *
 * - Validates event structure (max 20 per batch)
 * - Extracts user_id from session, hashes to actor_hash
 * - Responds 200 immediately, writes to Supabase async (fire-and-forget)
 * - No PII stored — only pseudonymized actor_hash
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createHash } from 'crypto'

const VALID_EVENT_TYPES = [
  'module_view',
  'search',
  'row_expand',
  'filter_apply',
  'export',
  'column_change',
  'autocomplete_search',
  'autocomplete_click',
  'cross_module_nav',
  'sort_change',
  'page_change',
  'error',
  'external_link',
] as const

const VALID_MODULES = [
  'instrumenten',
  'apparaat',
  'inkoop',
  'provincie',
  'gemeente',
  'publiek',
  'integraal',
]

const MAX_BATCH_SIZE = 20
const HASH_SECRET = process.env.ANALYTICS_HASH_SECRET || 'rijksuitgaven-analytics-default-secret'

interface IncomingEvent {
  event_type: string
  module?: string
  properties?: Record<string, unknown>
  timestamp?: string
}

function hashUserId(userId: string): string {
  return createHash('sha256')
    .update(userId + HASH_SECRET)
    .digest('hex')
    .substring(0, 16)
}

function validateEvent(event: unknown): event is IncomingEvent {
  if (!event || typeof event !== 'object') return false
  const e = event as Record<string, unknown>
  if (typeof e.event_type !== 'string') return false
  if (!VALID_EVENT_TYPES.includes(e.event_type as typeof VALID_EVENT_TYPES[number])) return false
  if (e.module !== undefined && typeof e.module !== 'string') return false
  if (e.module && !VALID_MODULES.includes(e.module)) return false
  return true
}

export async function POST(request: NextRequest) {
  // Get user session for hashing
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Anonymous users: use a fixed hash (still tracked but not identifiable)
  const actorHash = session?.user?.id
    ? hashUserId(session.user.id)
    : 'anon_000000000000'

  // Parse body
  let body: { events?: unknown[] }
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: 'No events' }, { status: 400 })
  }

  // Cap at MAX_BATCH_SIZE
  const rawEvents = body.events.slice(0, MAX_BATCH_SIZE)

  // Validate and transform
  const validEvents = rawEvents
    .filter(validateEvent)
    .map((event) => ({
      event_type: event.event_type,
      actor_hash: actorHash,
      module: event.module || null,
      properties: event.properties || {},
      created_at: event.timestamp || new Date().toISOString(),
    }))

  if (validEvents.length === 0) {
    return NextResponse.json({ error: 'No valid events' }, { status: 400 })
  }

  // Respond immediately — write async (fire-and-forget)
  const response = NextResponse.json({ accepted: validEvents.length })

  // Fire-and-forget write to Supabase (skip if service role key not configured)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient()
    adminClient
      .from('usage_events')
      .insert(validEvents)
      .then(({ error }) => {
        if (error) {
          console.error('[Analytics] Insert error:', error.message)
        }
      })
  }

  return response
}
