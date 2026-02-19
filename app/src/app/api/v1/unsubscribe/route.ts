/**
 * Public API: Email Unsubscribe
 *
 * POST /api/v1/unsubscribe — Unsubscribe via opaque token
 *
 * Always returns 200 with { ok: true } to prevent enumeration.
 * Rate limited: 10 requests per minute per IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY

// In-memory rate limiter (per IP, 10/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const WINDOW_MS = 60_000

// Periodic cleanup
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key)
  }
}, 60_000)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// Cap map size to prevent memory abuse
const MAX_MAP_SIZE = 10_000

const SUCCESS_RESPONSE = NextResponse.json({ ok: true })

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimitMap.size < MAX_MAP_SIZE && isRateLimited(ip)) {
    // Still return success to prevent enumeration
    return SUCCESS_RESPONSE
  }

  // Parse body
  let token: string
  try {
    const text = await request.text()
    if (text.length > 1_000) return SUCCESS_RESPONSE
    const body = JSON.parse(text)
    token = body.token
  } catch {
    return SUCCESS_RESPONSE
  }

  if (!token || typeof token !== 'string') {
    return SUCCESS_RESPONSE
  }

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return SUCCESS_RESPONSE
  }

  try {
    const supabase = createAdminClient()

    // Look up person by unsubscribe_token
    const { data: person } = await supabase
      .from('people')
      .select('id, resend_contact_id, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .single()

    if (!person) {
      // Token not found — still return success (no enumeration)
      return SUCCESS_RESPONSE
    }

    // Already unsubscribed — idempotent
    if (person.unsubscribed_at) {
      return SUCCESS_RESPONSE
    }

    // Mark as unsubscribed in our DB
    await supabase
      .from('people')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', person.id)

    // Remove from Resend contacts (fire-and-forget)
    if (person.resend_contact_id && RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY)
        await resend.contacts.remove({ id: person.resend_contact_id })
        await supabase
          .from('people')
          .update({ resend_contact_id: null })
          .eq('id', person.id)
      } catch (err) {
        console.error('[Unsubscribe] Resend remove error:', err)
        // Non-critical — person is already marked unsubscribed in our DB
      }
    }
  } catch (err) {
    console.error('[Unsubscribe] Error:', err)
    // Still return success
  }

  return SUCCESS_RESPONSE
}
