'use client'

/**
 * Auth Callback — Fully client-side auth exchange.
 *
 * Handles two flows:
 * A) PKCE code exchange (regular magic link login via signInWithOtp)
 *    → /auth/callback?code=xxx
 * B) Token hash verification (admin invite via generateLink)
 *    → /auth/callback?token_hash=xxx&type=magiclink
 *
 * WHY client-side?
 * Server-side approaches (Route Handlers, Server Components) add Set-Cookie
 * headers to responses. Through Next.js 16 + Railway's reverse proxy, these
 * headers intermittently clear auth cookies. By doing the exchange entirely
 * on the client, the browser Supabase client manages cookies directly in the
 * cookie jar — no server-side Set-Cookie interference.
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
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const supabase = createClient()

    // Flow B: Token hash from admin invite (generateLink)
    if (tokenHash && type) {
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'magiclink',
      }).then(({ error }) => {
        if (error) {
          window.location.replace('/login?error=invalid_link')
          return
        }
        fetch('/api/v1/me/activate', { method: 'POST' }).catch(() => {})
        window.location.replace('/')
      })
      return
    }

    // Flow A: PKCE code exchange (regular magic link)
    if (!code) {
      window.location.replace('/login?error=no_code')
      return
    }

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

      // Success — cookies set by browser client.
      // Set activated_at on first login (fire-and-forget, don't block redirect)
      fetch('/api/v1/me/activate', { method: 'POST' }).catch(() => {})
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
