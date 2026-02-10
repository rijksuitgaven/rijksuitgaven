'use client'

import { useSubscription } from '@/hooks/use-subscription'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export default function VerlopenPage() {
  const { endDate, plan } = useSubscription()
  const { userEmail } = useAuth()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  const formattedDate = endDate
    ? new Date(endDate + 'T00:00:00').toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const planLabel = plan === 'monthly' ? 'maandelijks' : 'jaarlijks'

  return (
    <main className="min-h-[calc(100vh-theme(spacing.24)-theme(spacing.16))] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-red-500" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), serif' }}>
          Abonnement verlopen
        </h1>

        {formattedDate && (
          <p className="text-[var(--navy-medium)]">
            Uw {planLabel} abonnement is verlopen op {formattedDate}.
          </p>
        )}

        <p className="text-[var(--navy-medium)]">
          Neem contact op om uw abonnement te verlengen.
        </p>

        <div className="space-y-3 pt-2">
          <a
            href="mailto:contact@rijksuitgaven.nl"
            className="block w-full px-4 py-2.5 bg-[var(--pink)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            contact@rijksuitgaven.nl
          </a>
          <a
            href="tel:0850806960"
            className="block w-full px-4 py-2.5 text-[var(--navy-dark)] border border-[var(--border)] rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            085-0806960
          </a>
        </div>

        {userEmail && (
          <p className="text-sm text-[var(--navy-medium)]">
            Ingelogd als {userEmail}
          </p>
        )}

        <button
          onClick={handleLogout}
          className="text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
        >
          Uitloggen
        </button>
      </div>
    </main>
  )
}
