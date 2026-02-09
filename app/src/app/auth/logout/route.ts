/**
 * Logout Route Handler
 *
 * Signs out the user, clears session cookies, and redirects to /login.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const origin = getOrigin(request)
  const supabase = await createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(`${origin}/login`)
}
