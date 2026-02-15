/**
 * BFF Auth Guard
 *
 * Uses getSession() for fast local JWT decode (no server call).
 * Checks subscription status to ensure user has active access.
 *
 * Returns the session if authenticated AND subscribed, null otherwise.
 * Callers should return unauthorizedResponse() or forbiddenResponse() when null.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return null

  // Check subscription status — mirrors middleware logic
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('role, cancelled_at, grace_ends_at')
    .eq('user_id', session.user.id)
    .single()

  if (!sub) return null // No subscription → deny

  // Admins never expire
  if (sub.role === 'admin') return session

  // Check expiry: cancelled or past grace period
  const today = new Date().toISOString().split('T')[0]
  if (sub.cancelled_at || today > sub.grace_ends_at) return null

  return session
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
