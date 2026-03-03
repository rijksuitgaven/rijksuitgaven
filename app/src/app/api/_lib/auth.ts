/**
 * BFF Auth Guard
 *
 * Uses getUser() for server-verified auth (validates JWT with Supabase).
 * Checks subscription status to ensure user has active access.
 *
 * Note: BFF routes skip middleware (excluded in matcher), so tokens are NOT
 * refreshed before reaching here. getUser() verifies the JWT server-side,
 * unlike getSession() which only decodes locally without verification.
 *
 * Returns the session if authenticated AND subscribed, null otherwise.
 * Callers should return unauthorizedResponse() or forbiddenResponse() when null.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * CSRF protection — requires custom header that forms cannot set.
 *
 * HTML forms can only send GET/POST with standard headers. They cannot
 * set X-Requested-With, so its presence proves the request came from
 * JavaScript (fetch/XMLHttpRequest). Combined with SameSite cookies,
 * this blocks cross-origin form-based CSRF attacks.
 *
 * Returns a 403 NextResponse if the check fails, or null if it passes.
 */
export function csrfCheck(request: NextRequest): NextResponse | null {
  // Only check mutating methods
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return null
  }

  // Require X-Requested-With header (forms cannot set this)
  if (request.headers.get('x-requested-with') !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  // Also validate Origin header when present (defense in depth)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  return null
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()

  // getUser() validates the JWT server-side with Supabase Auth.
  // Unlike getSession() which only decodes locally, this catches
  // expired, revoked, or tampered tokens.
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Check subscription status — mirrors middleware logic
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('role, cancelled_at, grace_ends_at')
    .eq('user_id', user.id)
    .single()

  if (!sub) return null // No subscription → deny

  // Admins never expire
  if (sub.role === 'admin') return { user }

  // Check expiry: cancelled or past grace period
  const today = new Date().toISOString().split('T')[0]
  if (sub.cancelled_at || today > sub.grace_ends_at) return null

  return { user }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Niet ingelogd' },
    { status: 401 }
  )
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: 'Geen actief abonnement' },
    { status: 403 }
  )
}
