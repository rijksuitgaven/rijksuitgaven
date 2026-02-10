/**
 * Auth Callback — Step 1: Server-side code exchange.
 *
 * Exchanges the PKCE code for a session (server-side has access to the
 * code_verifier cookie). Then passes tokens to a client-side page that
 * uses createBrowserClient to persist them in cookies.
 *
 * We return HTML with a JS redirect instead of a 302 because:
 * 1. Set-Cookie headers on 302 redirects don't persist on Railway
 * 2. The client page uses createBrowserClient's serialize() which DOES persist
 * 3. Hash fragments keep tokens out of server logs / Referer headers
 */

import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return redirectToLogin(request, 'no_code')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[AUTH CALLBACK] Exchange failed:', error?.message ?? 'no session')
    return redirectToLogin(request, 'exchange_failed')
  }

  const { access_token, refresh_token } = data.session

  // Pass tokens to client page via URL hash fragment.
  // Hash fragments are never sent to the server (safe from logs/proxies).
  // URLSearchParams.toString() encodes values for safe embedding in JS/HTML.
  const params = new URLSearchParams({
    access_token,
    refresh_token,
  }).toString()

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>Inloggen...</title>
</head>
<body>
  <p>Inloggen...</p>
  <script>
    window.location.replace('/auth/callback/complete#${params}');
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL('/login', request.nextUrl.origin)
  url.searchParams.set('error', error)

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>Inloggen mislukt</title>
</head>
<body>
  <p>Inloggen mislukt. Je wordt doorgestuurd...</p>
  <script>
    window.location.replace('${url.pathname}${url.search}');
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
