/**
 * Auth Callback Route Handler
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * PKCE flow: the code_verifier cookie must be present (same device/browser).
 *
 * IMPORTANT: Uses createServerClient directly (NOT createClient from server.ts)
 * so that cookies are set on the redirect response object.
 *
 * TEMPORARY: Returns JSON diagnostic instead of redirecting (remove after fix).
 */

import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  return new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = getOrigin(request)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Collect ALL request info for diagnostics
  const allCookies = request.cookies.getAll()
  const codeVerifierCookies = allCookies.filter(c => c.name.includes('code-verifier'))
  const authCookies = allCookies.filter(c => c.name.includes('auth-token'))

  const debug: Record<string, unknown> = {
    step: 'callback-entry',
    requestUrl: request.url,
    origin,
    codePresent: !!code,
    codeLength: code?.length ?? 0,
    nextParam: next,
    totalCookies: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
    codeVerifierCookies: codeVerifierCookies.map(c => ({ name: c.name, len: c.value.length })),
    authCookies: authCookies.map(c => ({ name: c.name, len: c.value.length })),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    host: request.headers.get('host'),
    hashFragment: 'not available server-side',
  }

  if (!code) {
    debug.step = 'no-code'
    debug.action = 'would redirect to /login (no code in URL)'
    // TEMPORARY: return diagnostic JSON instead of redirecting
    return NextResponse.json(debug, { status: 200 })
  }

  // Create the redirect response FIRST, then bind cookies to it
  const redirectUrl = `${origin}${next}`
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          debug.setAllCalled = true
          debug.cookiesBeingSet = cookiesToSet.map(c => ({
            name: c.name,
            valueLen: c.value.length,
            maxAge: c.options?.maxAge,
          }))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      debug.step = 'exchange-success'
      debug.action = `would redirect to ${redirectUrl} with cookies`
      debug.responseCookies = response.headers.getSetCookie?.() ?? 'getSetCookie not available'
      // TEMPORARY: return diagnostic JSON instead of redirecting
      return NextResponse.json(debug, { status: 200 })
    }

    debug.step = 'exchange-error'
    debug.error = error.message
    debug.errorCode = error.status
    debug.action = 'would redirect to /login with error'
  } catch (e) {
    debug.step = 'exchange-exception'
    debug.error = e instanceof Error ? e.message : String(e)
  }

  // TEMPORARY: return diagnostic JSON instead of redirecting
  return NextResponse.json(debug, { status: 200 })
}
