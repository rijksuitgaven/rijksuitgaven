/**
 * TEMPORARY diagnostic endpoint — remove after auth bug is fixed.
 *
 * Returns auth cookie state and session status as JSON.
 * Hit this while logged in to verify cookies are present and parseable.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Find auth-related cookies (sb-*-auth-token*)
  const authCookies = allCookies.filter(c => c.name.includes('auth-token'))
  const authCookieSummary = authCookies.map(c => ({
    name: c.name,
    length: c.value.length,
    prefix: c.value.substring(0, 20) + '...',
  }))

  // Test getSession (local JWT decode)
  let sessionResult: string = 'unknown'
  let sessionEmail: string | null = null
  let sessionError: string | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      sessionResult = 'error'
      sessionError = error.message
    } else if (data.session) {
      sessionResult = 'ok'
      sessionEmail = data.session.user?.email ?? null
    } else {
      sessionResult = 'null'
    }
  } catch (e) {
    sessionResult = 'exception'
    sessionError = e instanceof Error ? e.message : String(e)
  }

  // Test getUser (network call to Supabase)
  let userResult: string = 'unknown'
  let userEmail: string | null = null
  let userError: string | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      userResult = 'error'
      userError = error.message
    } else if (data.user) {
      userResult = 'ok'
      userEmail = data.user.email ?? null
    } else {
      userResult = 'null'
    }
  } catch (e) {
    userResult = 'exception'
    userError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    totalCookies: allCookies.length,
    authCookies: authCookieSummary,
    getSession: { result: sessionResult, email: sessionEmail, error: sessionError },
    getUser: { result: userResult, email: userEmail, error: userError },
  })
}
