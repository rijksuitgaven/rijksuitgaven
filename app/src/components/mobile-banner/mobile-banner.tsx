'use client'

import { useState, useEffect, useRef } from 'react'
import { Monitor, X } from 'lucide-react'

const STORAGE_KEY = 'mobile-banner-dismissed'

/**
 * MobileBanner - Friendly message for mobile users (< 768px viewport)
 *
 * Informs users that Rijksuitgaven works best on larger screens.
 * Non-blocking: users can dismiss and continue using the site.
 * Persists dismissal in localStorage (one-time per device).
 *
 * @requirement UX-003 Mobile Responsiveness
 */
export function MobileBanner() {
  // null = not yet determined (SSR-safe), false = dismissed, true = show
  const [visible, setVisible] = useState<boolean | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Only show on mobile viewports (< 768px)
    const isMobile = window.innerWidth < 768

    if (!isMobile) {
      setVisible(false)
      return
    }

    // Check localStorage for previous dismissal
    try {
      const wasDismissed = localStorage.getItem(STORAGE_KEY)
      setVisible(!wasDismissed)
    } catch {
      // localStorage unavailable (private browsing, etc.)
      // Default to not showing to avoid annoyance
      setVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors
    }
    setVisible(false)
  }

  // Escape key handler and auto-focus
  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    buttonRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  // Don't render during SSR or when not visible
  if (visible !== true) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-banner-title"
    >
      <div
        className="relative w-full bg-[var(--navy-dark)] text-white px-6 py-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)] animate-slide-up"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Sluiten"
        >
          <X size={20} />
        </button>

        <div className="max-w-md mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--navy-medium)] flex items-center justify-center">
              <Monitor size={32} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2
            id="mobile-banner-title"
            className="text-lg font-semibold mb-2"
          >
            Beter op een groter scherm
          </h2>

          {/* Message */}
          <p className="text-sm text-white/80 mb-6 leading-relaxed">
            Rijksuitgaven bevat uitgebreide tabellen met financiële data.
            Voor de beste ervaring raden we een laptop of desktop aan.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              ref={buttonRef}
              onClick={handleDismiss}
              className="w-full bg-[var(--pink)] hover:opacity-90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-opacity"
            >
              Doorgaan
            </button>
          </div>

          {/* Subtle hint */}
          <p className="text-xs text-white/50 mt-4">
            U ziet dit bericht één keer
          </p>
        </div>
      </div>
    </div>
  )
}
