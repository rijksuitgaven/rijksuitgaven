'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Show error from auth callback (e.g., cross-device PKCE failure)
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorMessage(error)
      setState('error')
    }
  }, [searchParams])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage('Voer een geldig e-mailadres in.')
      setState('error')
      return
    }

    if (cooldown > 0) return

    setState('loading')
    setErrorMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message?.includes('rate') || error.status === 429) {
          setErrorMessage('Te veel pogingen. Probeer het over een paar minuten opnieuw.')
        } else {
          setErrorMessage('Er ging iets mis. Controleer je internetverbinding en probeer het opnieuw.')
        }
        setState('error')
        return
      }

      setState('success')
      // Start 60s cooldown
      setCooldown(60)
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setErrorMessage('Er ging iets mis. Controleer je internetverbinding en probeer het opnieuw.')
      setState('error')
    }
  }, [email, cooldown])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder="jouw@email.nl"
          required
          autoComplete="email"
          autoFocus
          disabled={state === 'loading'}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {state === 'error' && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {state === 'success' && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">
            Inloglink verzonden naar <strong>{email.trim().toLowerCase()}</strong>.
            Check ook je spam folder.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || cooldown > 0}
        className="w-full py-2.5 px-4 bg-[var(--pink)] text-white text-sm font-semibold rounded-md
                   hover:opacity-90 transition-opacity
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading'
          ? 'Verzenden...'
          : cooldown > 0
            ? `Opnieuw versturen (${cooldown}s)`
            : 'Inloglink versturen'}
      </button>

      {state === 'success' && (
        <p className="text-xs text-[var(--navy-medium)] text-center">
          Geen e-mail ontvangen? Check je spam folder of probeer het opnieuw na de wachttijd.
        </p>
      )}
    </form>
  )
}
