/**
 * Middleware Supabase client + session refresh + subscription check.
 *
 * Called on every page navigation to:
 * 1. Refresh expired access tokens (local JWT validation, no network call)
 * 2. Redirect unauthenticated users to /login
 * 3. Redirect expired subscription users to /verlopen
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

  // Subscription check — skip for public pages and /verlopen itself
  const skipSubscriptionCheck =
    !session ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/verlopen'

  if (!skipSubscriptionCheck) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('end_date, grace_ends_at, cancelled_at')
      .eq('user_id', session.user.id)
      .single()

    if (sub) {
      const today = new Date().toISOString().split('T')[0]
      const isExpired = sub.cancelled_at || today > sub.grace_ends_at

      if (isExpired) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
        if (forwardedHost) {
          return NextResponse.redirect(new URL('/verlopen', `${forwardedProto}://${forwardedHost}`))
        }
        const url = request.nextUrl.clone()
        url.pathname = '/verlopen'
        return NextResponse.redirect(url)
      }
    }
    // No subscription row = allow access (new users before subscription is created,
    // or admin setting up the system). Access control tightened once subscriptions
    // are populated for all users.
  }

  // IMPORTANT: Return supabaseResponse, NOT a fresh NextResponse.next().
  // Otherwise the browser won't get the updated session cookies.
  return supabaseResponse
}
