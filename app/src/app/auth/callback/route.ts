/**
 * Auth Callback — Server-side code exchange + Set-Cookie.
 *
 * Uses createServerClient directly (NOT the shared server.ts client)
 * to capture cookies from the exchange and add them to the response.
 *
 * Returns a 200 HTML page (not a 302 redirect) because:
 * - Set-Cookie headers on 302 responses don't persist on Railway's proxy
 * - A 200 response lets the browser process Set-Cookie before JS redirects
 * - This is the standard Supabase SSR pattern, adapted for Railway
 *
 * Flow: exchange code → Set-Cookie headers on 200 response → JS redirect to /
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    console.error('[AUTH CALLBACK] No code parameter')
    return htmlRedirect('/login?error=no_code')
  }

  // Capture cookies that @supabase/ssr wants to set during exchange
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          // Don't write to cookieStore — capture for manual response header attachment
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[AUTH CALLBACK] Exchange failed:', error?.message ?? 'no session')
    return htmlRedirect('/login?error=exchange_failed')
  }

  console.error(`[AUTH CALLBACK] Exchange OK — user: ${data.session.user?.email}, cookies to set: ${cookiesToSet.length}`)

  // Log cookie sizes for debugging
  for (const cookie of cookiesToSet) {
    console.error(`[AUTH CALLBACK] Cookie: ${cookie.name} = ${cookie.value.length} chars`)
  }

  // Return 200 HTML with Set-Cookie headers.
  // Browser processes Set-Cookie before executing the JS redirect.
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><title>Inloggen...</title></head>
<body>
  <p>Inloggen...</p>
  <script>window.location.replace('/');</script>
</body>
</html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })

  // Attach captured cookies as Set-Cookie headers on the 200 response
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Record<string, string>)
  }

  return response
}

function htmlRedirect(path: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><title>Doorsturen...</title></head>
<body>
  <p>Doorsturen...</p>
  <script>window.location.replace('${path}');</script>
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
