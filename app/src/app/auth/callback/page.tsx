/**
 * Auth Callback Page — Client-Side Exchange
 *
 * Uses createBrowserClient to exchange the PKCE code for a session.
 * The browser client handles cookie storage natively via its own
 * storage adapter (document.cookie + serialize() + chunking).
 *
 * This replaces the Route Handler approach because Railway's reverse
 * proxy does not reliably deliver Set-Cookie headers to the browser.
 *
 * TEMPORARY: includes diagnostic output. Remove after auth is confirmed working.
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Bezig met inloggen...')
  const [debug, setDebug] = useState<string[]>([])

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      window.location.href = '/login'
      return
    }

    const log = (msg: string) => setDebug(prev => [...prev, msg])

    log('1. Code found in URL')

    const supabase = createClient()
    log('2. Browser client created')

    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (error) {
        log(`3. Exchange FAILED: ${error.message}`)
        const msg = error.message?.includes('code_verifier')
          ? 'Deze inloglink moet geopend worden in dezelfde browser waar je de link hebt aangevraagd.'
          : 'Deze inloglink is verlopen of ongeldig. Vraag een nieuwe aan.'
        setStatus(msg)
        return
      }

      log('3. Exchange succeeded ✓')
      log(`4. document.cookie length: ${document.cookie.length}`)
      log(`5. Has auth-token cookie: ${document.cookie.includes('auth-token') ? 'YES ✓' : 'NO ✗'}`)

      // Verify server can see the cookies
      try {
        const res = await fetch('/api/auth-debug')
        const data = await res.json()
        log(`6. Server sees ${data.totalCookies} cookies`)
        log(`7. Server auth cookies: ${data.authCookies?.length ?? 0}`)
        log(`8. Server getSession: ${data.getSession?.result}`)
        log(`9. Server getUser: ${data.getUser?.result}`)
      } catch (e) {
        log(`6. Server check failed: ${e}`)
      }

      setStatus('Exchange succeeded — check debug info, then click Continue.')
    })
  }, [searchParams])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px' }}>
      <h2>Auth Callback</h2>
      <p><strong>{status}</strong></p>
      {debug.map((d, i) => <p key={i} style={{ margin: '0.25rem 0' }}>{d}</p>)}
      {status.includes('succeeded') && (
        <button
          onClick={() => { window.location.replace('/') }}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Continue to app
        </button>
      )}
      {status !== 'Bezig met inloggen...' && !status.includes('succeeded') && (
        <p style={{ marginTop: '1rem' }}>
          <a href="/login">Terug naar inloggen</a>
        </p>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Laden...</p>}>
      <CallbackHandler />
    </Suspense>
  )
}
