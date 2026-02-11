'use client'

/**
 * Auth Callback — Fully client-side PKCE code exchange.
 *
 * WHY client-side?
 * Server-side approaches (Route Handlers, Server Components) add Set-Cookie
 * headers to responses. Through Next.js 16 + Railway's reverse proxy, these
 * headers intermittently clear auth cookies. By doing the exchange entirely
 * on the client, the browser Supabase client manages cookies directly in the
 * cookie jar — no server-side Set-Cookie interference.
 *
 * Flow:
 * 1. User clicks magic link → Supabase redirects to /auth/callback?code=xxx
 * 2. This page reads code from URL
 * 3. Browser Supabase client exchanges code + code-verifier (from cookie) for session
 * 4. Browser client stores auth tokens directly in cookies
 * 5. window.location.replace('/') navigates to homepage with cookies intact
 */

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const exchangeAttempted = useRef(false)

  useEffect(() => {
    // Prevent double-execution in React strict mode
    if (exchangeAttempted.current) return
    exchangeAttempted.current = true

    const code = searchParams.get('code')
    if (!code) {
      window.location.replace('/login?error=no_code')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        if (
          error.message.includes('code verifier') ||
          error.message.includes('both auth code and code verifier')
        ) {
          window.location.replace('/login?error=cross_device')
        } else {
          window.location.replace('/login?error=exchange_failed')
        }
        return
      }

      // Success — cookies set by browser client. Navigate to homepage.
      window.location.replace('/')
    })
  }, [searchParams])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-[var(--navy-medium)]">Even geduld, u wordt ingelogd...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--navy-medium)]">Even geduld, u wordt ingelogd...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
