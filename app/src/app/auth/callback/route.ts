/**
 * Auth Callback Route Handler
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * PKCE flow: the code_verifier cookie must be present (same device/browser).
 *
 * IMPORTANT: Uses createServerClient directly (NOT createClient from server.ts)
 * so that cookies are set on the redirect response object. The server.ts pattern
 * uses cookieStore.set() which does NOT merge into NextResponse.redirect().
 *
 * Handles cross-device failure: if code_verifier is missing, shows Dutch error.
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
  const { searchParams } = new URL(request.url)
  const origin = getOrigin(request)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Create the redirect response FIRST, then bind cookies to it.
    // This ensures exchangeCodeForSession() writes Set-Cookie headers
    // directly on the response the browser receives.
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
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful login — return redirect WITH session cookies
      return response
    }

    // PKCE cross-device error or expired link
    const errorMessage = error.message?.includes('code_verifier')
      ? 'Deze inloglink moet geopend worden in dezelfde browser waar je de link hebt aangevraagd.'
      : 'Deze inloglink is verlopen of ongeldig. Vraag een nieuwe aan.'

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(loginUrl.toString())
  }

  // No code in URL — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
