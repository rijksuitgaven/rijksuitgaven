/**
 * Auth Callback Route Handler
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * PKCE flow: the code_verifier cookie must be present (same device/browser).
 *
 * Sets session cookies via client-side JavaScript (document.cookie) instead of
 * Set-Cookie response headers. Railway's reverse proxy does not reliably forward
 * Set-Cookie headers to the browser, so we embed cookie assignments in an HTML
 * page that auto-redirects after setting them.
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

  if (code) {
    const redirectUrl = `${origin}${next}`

    // Capture cookies that @supabase/ssr wants to set during exchange
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            pendingCookies.push(...cookiesToSet)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Build document.cookie statements for client-side cookie setting.
      // Each cookie from @supabase/ssr gets a separate document.cookie assignment.
      const cookieJS = pendingCookies.map(({ name, value, options }) => {
        const parts = [`${name}=${value}`]
        if (options.path) parts.push(`path=${options.path}`)
        if (typeof options.maxAge === 'number') parts.push(`max-age=${options.maxAge}`)
        if (options.sameSite) parts.push(`samesite=${options.sameSite}`)
        if (options.secure) parts.push('secure')
        return `document.cookie=${JSON.stringify(parts.join('; '))};`
      }).join('\n')

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
${cookieJS}
window.location.replace(${JSON.stringify(redirectUrl)});
</script></head>
<body><p>Redirecting...</p></body></html>`

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      })
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
