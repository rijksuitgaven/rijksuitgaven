/**
 * Auth Callback — Step 2: Client-side session storage.
 *
 * DIAGNOSTIC VERSION — shows step-by-step results on screen.
 * Remove after auth is working.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DiagStep {
  label: string
  value: string
  ok: boolean
}

export default function AuthCallbackComplete() {
  const [steps, setSteps] = useState<DiagStep[]>([])
  const [done, setDone] = useState(false)

  function addStep(label: string, value: string, ok: boolean) {
    setSteps(prev => [...prev, { label, value, ok }])
  }

  useEffect(() => {
    async function completeAuth() {
      // Step 1: Read hash
      const rawHash = window.location.hash
      addStep('1. Raw hash', rawHash ? `${rawHash.length} chars` : 'EMPTY', rawHash.length > 1)

      const hash = rawHash.substring(1)
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      // Step 2: Token extraction
      addStep('2. access_token', access_token ? `${access_token.substring(0, 20)}... (${access_token.length} chars)` : 'NULL', !!access_token)
      addStep('3. refresh_token', refresh_token ? `${refresh_token.substring(0, 20)}... (${refresh_token.length} chars)` : 'NULL', !!refresh_token)

      if (!access_token || !refresh_token) {
        addStep('RESULT', 'No tokens in hash — cannot proceed', false)
        setDone(true)
        return
      }

      // Step 3: Clear hash
      window.history.replaceState(null, '', '/auth/callback/complete')
      addStep('4. Hash cleared', 'OK', true)

      // Step 4: Cookies BEFORE setSession
      const cookiesBefore = document.cookie
      const authCookiesBefore = cookiesBefore.split(';').filter(c => c.includes('auth-token')).length
      addStep('5. Cookies BEFORE', `${authCookiesBefore} auth cookies`, true)

      // Step 5: Create client + setSession
      try {
        const supabase = createClient()
        addStep('6. Client created', 'OK', true)

        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (error) {
          addStep('7. setSession', `ERROR: ${error.message}`, false)

          // Extra diagnostic: try to decode the JWT to see if it's valid
          try {
            const parts = access_token.split('.')
            addStep('7a. JWT parts', `${parts.length} parts`, parts.length === 3)
            if (parts[1]) {
              const payload = JSON.parse(atob(parts[1]))
              const exp = payload.exp
              const now = Math.floor(Date.now() / 1000)
              addStep('7b. JWT exp', `exp=${exp}, now=${now}, diff=${exp - now}s`, exp > now)
              addStep('7c. JWT iss', payload.iss ?? 'missing', !!payload.iss)
            }
          } catch (e) {
            addStep('7a. JWT decode', `Failed: ${e}`, false)
          }

          setDone(true)
          return
        }

        addStep('7. setSession', `OK — user: ${data.session?.user?.email ?? 'unknown'}`, true)

        // Step 6: Cookies AFTER setSession
        const cookiesAfter = document.cookie
        const authCookiesAfter = cookiesAfter.split(';').filter(c => c.includes('auth-token')).length
        addStep('8. Cookies AFTER', `${authCookiesAfter} auth cookies`, authCookiesAfter > 0)

        // Show all cookie names
        const allNames = cookiesAfter.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
        addStep('9. Cookie names', allNames.join(', ') || 'NONE', allNames.length > 0)

        addStep('RESULT', 'SUCCESS — ready to redirect', true)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        addStep('7. setSession', `EXCEPTION: ${msg}`, false)
      }

      setDone(true)
    }

    completeAuth()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Auth Callback — Step 2 (Diagnostic)</h2>

      {steps.map((step, i) => (
        <div key={i} style={{
          padding: '0.5rem',
          marginBottom: '0.25rem',
          backgroundColor: step.ok ? '#e8f5e9' : '#ffebee',
          borderRadius: '4px',
        }}>
          <strong>{step.label}:</strong> {step.value}
        </div>
      ))}

      {done && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => window.location.replace('/')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Continue to app →
          </button>
        </div>
      )}
    </div>
  )
}
