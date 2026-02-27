'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-banner-dismissed'

export function CookieBanner() {
  // Start with null to indicate "not yet determined" (SSR-safe)
  const [visible, setVisible] = useState<boolean | null>(null)

  useEffect(() => {
    // Check localStorage after hydration (not available during SSR)
    // This is an intentional pattern for SSR apps - we must wait for client-side
    // Wrapped in try-catch for private browsing mode where localStorage may throw
    try {
      const shouldShow = !localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: SSR requires post-hydration check
      setVisible(shouldShow)
    } catch {
      // localStorage unavailable (private browsing, storage full, etc.)
      // Default to not showing banner to avoid repeated prompts
      setVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors - banner will just reappear on next visit
    }
    setVisible(false)
    // Notify other components (e.g. FeedbackButton) that banner is gone
    window.dispatchEvent(new Event('cookie-banner-change'))
  }

  // Don't render during SSR (null) or when dismissed (false)
  if (visible !== true) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--navy-dark)] text-white px-4 sm:px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] animate-fade-in"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">
          Deze website gebruikt alleen noodzakelijke cookies voor het functioneren van de site.{' '}
          Meer informatie in ons{' '}
          <Link href="/privacybeleid" className="underline hover:no-underline">
            Privacybeleid
          </Link>.
        </p>
        <button
          onClick={handleDismiss}
          className="bg-[var(--pink)] hover:opacity-90 text-white px-4 py-2 rounded text-sm font-medium transition-opacity min-w-[44px] min-h-[44px]"
        >
          OK
        </button>
      </div>
    </div>
  )
}
