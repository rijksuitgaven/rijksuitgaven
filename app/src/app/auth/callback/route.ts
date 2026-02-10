/**
 * Auth Callback Route Handler — DIAGNOSTIC VERSION
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * Shows diagnostic info before redirecting to verify cookies are set.
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
      // Build document.cookie assignments
      const cookieAssignments = pendingCookies.map(({ name, value, options }) => {
        const parts = [`${name}=${value}`]
        if (options.path) parts.push(`path=${options.path}`)
        if (typeof options.maxAge === 'number') parts.push(`max-age=${options.maxAge}`)
        if (options.sameSite) parts.push(`samesite=${options.sameSite}`)
        if (options.secure) parts.push('secure')
        return parts.join('; ')
      })

      // Diagnostic HTML — shows cookie info and verifies they're set
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Auth Callback Debug</title></head>
<body style="font-family:monospace;padding:2rem;">
<h2>Auth Callback — Diagnostic</h2>
<div id="output"></div>
<button id="go" style="margin-top:1rem;padding:0.5rem 1rem;font-size:1rem;">Continue to app</button>
<script>
var out = document.getElementById('output');
var log = function(msg) { out.innerHTML += '<p>' + msg + '</p>'; };

log('Step 1: Callback reached ✓');
log('Step 2: Exchange succeeded ✓');
log('Step 3: Cookies to set: ' + ${JSON.stringify(pendingCookies.length)});

// Show cookies before
log('Step 4: document.cookie BEFORE: ' + (document.cookie || '(empty)'));

// Set each cookie
var assignments = ${JSON.stringify(cookieAssignments)};
for (var i = 0; i < assignments.length; i++) {
  log('Setting cookie ' + (i+1) + ': ' + assignments[i].substring(0, 80) + '...');
  document.cookie = assignments[i];
}

// Show cookies after
log('Step 5: document.cookie AFTER: ' + (document.cookie ? document.cookie.substring(0, 200) + '...' : '(empty)'));

// Check if auth cookie exists
var hasAuth = document.cookie.indexOf('auth-token') !== -1;
log('Step 6: Auth cookie present: ' + (hasAuth ? 'YES ✓' : 'NO ✗'));

document.getElementById('go').onclick = function() {
  window.location.replace(${JSON.stringify(redirectUrl)});
};
</script>
</body></html>`

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      })
    }

    // Exchange failed — show error info
    const errorHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Auth Callback Error</title></head>
<body style="font-family:monospace;padding:2rem;">
<h2>Auth Callback — Error</h2>
<p>Exchange failed: ${error.message}</p>
<p>Error code: ${error.status || 'unknown'}</p>
<p><a href="/login">Back to login</a></p>
</body></html>`

    return new NextResponse(errorHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    })
  }

  // No code in URL — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
