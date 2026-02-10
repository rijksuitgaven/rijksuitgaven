'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'

export function SubscriptionBanner() {
  const { status, plan, endDate, graceEndsAt, loading } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  if (loading || status !== 'grace' || dismissed) return null

  const formattedEndDate = endDate
    ? new Date(endDate + 'T00:00:00').toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const daysLeft = graceEndsAt
    ? Math.max(0, Math.ceil((new Date(graceEndsAt + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const message = plan === 'yearly'
    ? `Uw abonnement is verlopen op ${formattedEndDate}. Neem contact op voor verlenging.`
    : `Uw abonnement is verlopen. Neem binnen ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'} contact op voor verlenging.`

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <p className="text-sm text-amber-800">
          {message}{' '}
          <a href="mailto:contact@rijksuitgaven.nl" className="font-medium underline hover:no-underline">
            contact@rijksuitgaven.nl
          </a>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Sluiten"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
