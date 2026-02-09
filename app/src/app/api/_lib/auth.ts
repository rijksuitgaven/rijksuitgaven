/**
 * BFF Auth Guard
 *
 * Uses getSession() for fast local JWT decode (no server call).
 * Returns the session or null. Callers should return 401 when null.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Niet ingelogd' },
    { status: 401 }
  )
}
