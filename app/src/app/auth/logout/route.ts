/**
 * Logout Route Handler
 *
 * Signs out the user, clears session cookies, and redirects to /login.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(`${origin}/login`)
}
