/**
 * Auth Callback — Standard Supabase PKCE code exchange.
 *
 * Pattern: create redirect response FIRST, then create Supabase client
 * with setAll that writes cookies directly to the response object.
 *
 * Uses response.cookies.set() (proven to work via /api/cookie-test)
 * instead of cookieStore.set() from next/headers (which doesn't reliably
 * attach to the returned response).
 *
 * This matches the pattern used by working Railway-deployed apps
 * (AgentDesk, fpl-chat-app, qwikfinx).
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin))
  }

  // Create the redirect response FIRST — cookies will be set on this object
  const response = NextResponse.redirect(new URL('/', origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set directly on the response object — proven to work via cookie-test
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[AUTH CALLBACK] Exchange failed:', error.message)
    return NextResponse.redirect(new URL('/login?error=exchange_failed', origin))
  }

  return response
}
