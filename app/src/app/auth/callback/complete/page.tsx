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

      // Step 3: Clear hash from URL
      window.history.replaceState(null, '', '/auth/callback/complete')
      addStep('4. Hash cleared', 'OK', true)

      // Step 4: Clear stale cookies BEFORE creating client
      // Delete any existing auth cookies that might corrupt the singleton
      const cookiesBefore = document.cookie.split(';').map(c => c.trim())
      const staleCookies = cookiesBefore.filter(c => c.includes('auth-token'))
      for (const cookie of staleCookies) {
        const name = cookie.split('=')[0]
        document.cookie = `${name}=; path=/; max-age=0`
      }
      addStep('5. Stale cookies cleared', `Removed ${staleCookies.length} auth cookies`, true)

      // Step 5: Verify cookies are cleared
      const cookiesAfterClear = document.cookie.split(';').filter(c => c.includes('auth-token')).length
      addStep('6. Auth cookies after clear', `${cookiesAfterClear}`, cookiesAfterClear === 0)

      // Step 6: Create client + signOut to reset internal state
      try {
        const supabase = createClient()
        addStep('7. Client created', 'OK', true)

        // Sign out to reset the singleton's internal auth state
        // (ignore errors — there may be no valid session to sign out of)
        try {
          await supabase.auth.signOut({ scope: 'local' })
          addStep('8. signOut (local)', 'OK', true)
        } catch {
          addStep('8. signOut (local)', 'Error (ignored)', true)
        }

        // Step 7: Now set the new session
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (error) {
          addStep('9. setSession', `ERROR: ${error.message}`, false)

          // Diagnostic: decode JWT
          try {
            const parts = access_token.split('.')
            addStep('9a. JWT parts', `${parts.length} parts`, parts.length === 3)
            if (parts[1]) {
              const payload = JSON.parse(atob(parts[1]))
              const exp = payload.exp
              const now = Math.floor(Date.now() / 1000)
              addStep('9b. JWT exp', `exp=${exp}, now=${now}, diff=${exp - now}s`, exp > now)
              addStep('9c. JWT sub', payload.sub?.substring(0, 8) ?? 'missing', !!payload.sub)
            }
          } catch (e) {
            addStep('9a. JWT decode', `Failed: ${e}`, false)
          }

          // Alternative: try getUser directly to check if token is valid
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser(access_token)
            if (userError) {
              addStep('9d. getUser', `ERROR: ${userError.message}`, false)
            } else {
              addStep('9d. getUser', `OK: ${userData.user?.email ?? 'no email'}`, true)
            }
          } catch (e) {
            addStep('9d. getUser', `EXCEPTION: ${e}`, false)
          }

          setDone(true)
          return
        }

        addStep('9. setSession', `OK — user: ${data.session?.user?.email ?? 'unknown'}`, true)

        // Step 8: Verify cookies AFTER setSession
        const cookiesAfter = document.cookie
        const authCookiesAfter = cookiesAfter.split(';').filter(c => c.includes('auth-token')).length
        addStep('10. Cookies AFTER', `${authCookiesAfter} auth cookies`, authCookiesAfter > 0)

        const allNames = cookiesAfter.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
        addStep('11. Cookie names', allNames.join(', ') || 'NONE', allNames.length > 0)

        addStep('RESULT', 'SUCCESS — ready to redirect', true)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        addStep('9. setSession', `EXCEPTION: ${msg}`, false)
      }

      setDone(true)
    }

    completeAuth()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Auth Callback — Step 2 (Diagnostic v2)</h2>

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
