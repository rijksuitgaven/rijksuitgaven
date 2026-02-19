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

  // Public paths that don't require authentication
  const isPublicPath =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/privacybeleid' ||
    request.nextUrl.pathname === '/voorwaarden' ||
    request.nextUrl.pathname === '/over' ||
    request.nextUrl.pathname === '/afmelden'

  if (!session && !isPublicPath) {
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
      .select('end_date, grace_ends_at, cancelled_at, role')
      .eq('user_id', session.user.id)
      .single()

    if (sub) {
      const today = new Date().toISOString().split('T')[0]
      // Admins never expire
      // CRITICAL: cancelled_at takes precedence - even if grace_ends_at is in the future
      const isExpired = sub.role !== 'admin' && (!!sub.cancelled_at || today > sub.grace_ends_at)

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

      // Track last_active_at (throttled: max once per 5 minutes via cookie)
      const lastPing = request.cookies.get('_la')?.value
      const now = Date.now()
      if (!lastPing || now - Number(lastPing) > 5 * 60 * 1000) {
        // Must await — Edge Runtime cancels pending promises after response
        const { error: pingError } = await supabase
          .from('subscriptions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('user_id', session.user.id)
        if (pingError) console.error('[middleware] last_active_at update failed:', pingError.message)
        supabaseResponse.cookies.set('_la', String(now), {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 300,
        })
      }
    } else {
      // No subscription row for this user — deny access.
      // All legitimate users have a subscription created by admin via /team/leden.
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

  // IMPORTANT: Return supabaseResponse, NOT a fresh NextResponse.next().
  // Otherwise the browser won't get the updated session cookies.
  return supabaseResponse
}
