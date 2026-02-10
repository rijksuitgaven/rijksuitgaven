/**
 * Middleware Supabase client + session refresh.
 *
 * Called on every page navigation to refresh expired access tokens.
 * Uses getSession() for fast local JWT validation (no network call).
 *
 * CRITICAL: Must return supabaseResponse (not a fresh NextResponse.next())
 * to preserve Set-Cookie headers from session refresh.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getSession().
  // A simple mistake could make it very hard to debug auth issues.

  const { data } = await supabase.auth.getSession()
  const session = data?.session

  if (
    !session &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
    if (forwardedHost) {
      return NextResponse.redirect(new URL('/login', `${forwardedProto}://${forwardedHost}`))
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return supabaseResponse, NOT a fresh NextResponse.next().
  // Otherwise the browser won't get the updated session cookies.
  return supabaseResponse
}
