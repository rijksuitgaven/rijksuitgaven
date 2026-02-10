/**
 * Auth Callback Page — Client-side PKCE code exchange.
 *
 * Why client-side instead of a route handler?
 * Set-Cookie headers on 307 redirect responses don't reliably persist
 * through Railway's reverse proxy (proven across 12+ attempts).
 * Cookie-test proved 200 responses work, but the real fix is avoiding
 * server-side cookie setting entirely.
 *
 * Flow:
 * 1. User clicks magic link -> Supabase redirects to /auth/callback?code=xxx
 * 2. This page loads (no auth required — excluded from middleware matcher)
 * 3. Client component reads code, calls exchangeCodeForSession()
 * 4. Browser client stores session cookies via document.cookie
 * 5. Client redirects to /
 *
 * The code verifier (set during signInWithOtp on the client) is available
 * in document.cookie — the browser client reads it automatically.
 */

import { Suspense } from 'react'
import { AuthCallbackHandler } from './auth-callback-handler'

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-[var(--navy-medium)]">Even geduld, je wordt ingelogd...</p>
        <Suspense fallback={null}>
          <AuthCallbackHandler />
        </Suspense>
      </div>
    </main>
  )
}
