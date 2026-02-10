/**
 * Auth Callback — Step 2: Client-side session storage.
 *
 * Reads tokens from URL hash (set by route.ts) and uses
 * createBrowserClient's setSession() to persist them in cookies.
 *
 * createBrowserClient uses the `cookie` package's serialize() function
 * which correctly persists cookies (proven via DevTools testing).
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackComplete() {
  const [status, setStatus] = useState('Inloggen...')

  useEffect(() => {
    async function completeAuth() {
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
          setStatus('Fout: geen sessiegegevens gevonden.')
          setTimeout(() => {
            window.location.replace('/login?error=no_tokens')
          }, 1500)
          return
        }

        // Clear tokens from URL immediately (no longer visible in address bar)
        window.history.replaceState(null, '', '/auth/callback/complete')

        // createBrowserClient stores session in cookies via serialize()
        const supabase = createClient()
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (error) {
          console.error('[AUTH COMPLETE] setSession failed:', error.message)
          setStatus(`Fout bij inloggen: ${error.message}`)
          setTimeout(() => {
            window.location.replace('/login?error=session_failed')
          }, 2000)
          return
        }

        // Session is now stored in cookies — navigate to app
        window.location.replace('/')
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        console.error('[AUTH COMPLETE] Unexpected error:', message)
        setStatus(`Onverwachte fout: ${message}`)
        setTimeout(() => {
          window.location.replace('/login?error=unexpected')
        }, 2000)
      }
    }

    completeAuth()
  }, [])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      fontFamily: 'var(--font-body), sans-serif',
    }}>
      <p style={{ color: '#666', fontSize: '1rem' }}>{status}</p>
    </div>
  )
}
