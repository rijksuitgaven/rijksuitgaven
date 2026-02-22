'use client'

import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { createClient } from '@/lib/supabase/client'

export default function ProfielPage() {
  const { userEmail } = useAuth()
  const { plan, endDate, graceEndsAt, firstName, lastName, organization, status, loading } = useSubscription()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  const formattedEndDate = endDate
    ? new Date(endDate + 'T00:00:00').toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const planLabel = plan === 'monthly' ? 'Maandelijks' : plan === 'yearly' ? 'Jaarlijks' : null

  const isGrace = status === 'grace'
  const graceFormattedDate = graceEndsAt
    ? new Date(graceEndsAt + 'T00:00:00').toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <main className="min-h-[calc(100vh-theme(spacing.24)-theme(spacing.16))] max-w-2xl mx-auto px-4 py-12" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-8">
        Profiel
      </h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
            E-mailadres
          </label>
          <p className="text-[var(--navy-dark)]">{userEmail ?? '...'}</p>
        </div>

        {!loading && (firstName || lastName) && (
          <div>
            <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
              Naam
            </label>
            <p className="text-[var(--navy-dark)]">{[firstName, lastName].filter(Boolean).join(' ')}</p>
          </div>
        )}

        {!loading && organization && (
          <div>
            <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
              Organisatie
            </label>
            <p className="text-[var(--navy-dark)]">{organization}</p>
          </div>
        )}

        {!loading && planLabel && (
          <div className="pt-4 border-t border-[var(--border)]">
            <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
              Abonnement
            </label>
            <p className="text-[var(--navy-dark)]">{planLabel}</p>
          </div>
        )}

        {!loading && formattedEndDate && (
          <div>
            <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
              Loopt tot
            </label>
            <p className={isGrace ? 'text-red-600 font-medium' : 'text-[var(--navy-dark)]'}>
              {formattedEndDate}
              {isGrace && (
                <span className="block text-sm mt-1">
                  Verlengingsperiode tot {graceFormattedDate}. Neem contact op voor verlenging.
                </span>
              )}
            </p>
          </div>
        )}

        {!loading && planLabel && (
          <p className="text-sm text-[var(--navy-medium)]">
            Wilt u uw abonnement wijzigen?{' '}
            <a href="mailto:contact@rijksuitgaven.nl" className="underline hover:no-underline">
              Neem contact op
            </a>.
          </p>
        )}

        <button
          onClick={handleLogout}
          className="text-sm text-[var(--navy-medium)] underline hover:no-underline transition-colors"
        >
          Uitloggen
        </button>
      </div>
    </main>
  )
}
