/**
 * Auth Callback Route Handler
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * PKCE flow: the code_verifier cookie must be present (same device/browser).
 *
 * IMPORTANT: Returns a 200 HTML page with Set-Cookie headers + JS redirect
 * instead of a 307 redirect. Railway's reverse proxy strips Set-Cookie
 * headers from redirect responses, so we must use a 200 response to ensure
 * the browser receives and stores the auth cookies.
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

/**
 * Returns a 200 HTML page that sets cookies and redirects via JS.
 * This bypasses proxy Set-Cookie stripping on redirect responses.
 */
function redirectWithCookies(url: string, response: NextResponse): NextResponse {
  const html = `<!DOCTYPE html>
<html><head>
<meta http-equiv="refresh" content="0;url=${url}">
<script>window.location.replace(${JSON.stringify(url)})</script>
</head><body>Redirecting...</body></html>`

  const htmlResponse = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })

  // Copy all cookies from the original response to the HTML response
  const setCookieHeaders = response.headers.getSetCookie()
  for (const cookie of setCookieHeaders) {
    htmlResponse.headers.append('Set-Cookie', cookie)
  }

  return htmlResponse
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = getOrigin(request)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    // Create a temporary redirect response to collect cookies on
    const redirectUrl = `${origin}${next}`
    const cookieResponse = NextResponse.redirect(redirectUrl)

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
              cookieResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Return 200 HTML with cookies + JS redirect (bypasses proxy stripping)
      return redirectWithCookies(redirectUrl, cookieResponse)
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
