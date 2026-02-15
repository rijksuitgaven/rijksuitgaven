'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAnalytics } from '@/hooks/use-analytics'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LoginForm() {
  const searchParams = useSearchParams()
  const { track } = useAnalytics()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Show error from auth callback (e.g., cross-device PKCE failure)
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      const errorMessages: Record<string, string> = {
        no_code: 'De inloglink is ongeldig. Probeer opnieuw in te loggen.',
        cross_device: 'De inloglink moet op hetzelfde apparaat worden geopend als waar u deze hebt aangevraagd.',
        exchange_failed: 'De inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.',
        invalid_link: 'De activatielink is verlopen of al gebruikt. Vraag een nieuwe aan via uw beheerder.',
      }
      setErrorMessage(errorMessages[error] || 'Er ging iets mis bij het inloggen.')
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
      const res = await fetch('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      if (res.status === 429) {
        setErrorMessage('Te veel pogingen. Probeer het over een paar minuten opnieuw.')
        setState('error')
        track('error', undefined, { message: 'Rate limited', trigger: 'login' })
        return
      }

      // Always show success (server returns 200 even for non-existent users)
      setState('success')
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
    } catch (err) {
      setErrorMessage('Er ging iets mis. Controleer uw internetverbinding en probeer het opnieuw.')
      setState('error')
      track('error', undefined, { message: err instanceof Error ? err.message : 'Network error during login', trigger: 'login' })
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
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {state === 'success' && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">
            Inloglink verzonden naar <strong>{email.trim().toLowerCase()}</strong>.
            Check ook uw spam folder.
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
          Geen e-mail ontvangen? Check uw spam folder of probeer het opnieuw na de wachttijd.
        </p>
      )}
    </form>
  )
}
