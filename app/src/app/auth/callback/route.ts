/**
 * Auth Callback Route Handler — Server-side PKCE code exchange.
 *
 * WHY a Route Handler instead of a Page Component?
 * Page components trigger layout.tsx which calls getUser(). When there's no
 * session yet (only a code-verifier cookie), getUser() calls setAll() to
 * "clean up" — which in Next.js 16 dynamic rendering DELETES the code-verifier
 * cookie via Set-Cookie response headers. The client-side exchangeCodeForSession()
 * then fails because the verifier is gone.
 *
 * Route Handlers bypass layouts entirely, avoiding this interference.
 *
 * WHY a 200 HTML response instead of a 307 redirect?
 * Railway's reverse proxy does not reliably preserve Set-Cookie headers on
 * redirect responses (proven across 12+ attempts). A 200 response with
 * Set-Cookie headers works reliably.
 *
 * Flow:
 * 1. User clicks magic link → Supabase redirects to /auth/callback?code=xxx
 * 2. This Route Handler reads code from URL + code-verifier from request cookies
 * 3. Server exchanges code for session (no layout interference)
 * 4. 200 response includes Set-Cookie headers with auth tokens
 * 5. Browser processes cookies, then meta-refresh redirects to /
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = getOrigin(request)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Build our own response so we control the Set-Cookie headers directly.
  // Do NOT use createClient() from server.ts — that ties into cookieStore
  // which may not transfer cookies to a custom response object.
  const response = new NextResponse(
    `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/">
  <title>Inloggen...</title>
</head>
<body>
  <p>Even geduld, je wordt ingelogd...</p>
  <script>window.location.replace('/')</script>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )

  // Create Supabase client with manual cookie management:
  // - READ from the incoming request cookies (has code-verifier)
  // - WRITE to our response object (sets auth token cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse cookies from the request
          const cookieHeader = request.headers.get('cookie') ?? ''
          return cookieHeader.split(';').filter(Boolean).map(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            return { name, value: rest.join('=') }
          })
        },
        setAll(cookiesToSet) {
          // Write cookies to OUR response object
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Cross-device: code verifier cookie is missing (opened link in different browser)
    if (error.message.includes('code verifier') || error.message.includes('both auth code and code verifier')) {
      return NextResponse.redirect(`${origin}/login?error=cross_device`)
    }
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  // Success: return 200 HTML with Set-Cookie headers containing auth tokens.
  // Browser processes cookies, then meta-refresh + JS redirect to homepage.
  return response
}
