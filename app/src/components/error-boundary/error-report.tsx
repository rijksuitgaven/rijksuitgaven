'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Undo2 } from 'lucide-react'

const ERROR_MESSAGE = 'Er is iets misgegaan'

/**
 * Shared error display with "Fout melden" → countdown → redirect flow.
 *
 * The error is already auto-logged via the analytics track('error', ...) call.
 * The button confirms to the user that the error has been registered,
 * then counts down 3-2-1 and navigates back.
 *
 * Flow: "Fout melden" → "✓ Fout is gemeld" (1s) → "↩ Terug in 3/2/1..." → router.back()
 *
 * Props:
 * - variant: 'page' (centered card) or 'inline' (compact, for panels/rows)
 */
export function ErrorReport({
  variant = 'page',
}: {
  variant?: 'page' | 'inline'
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'confirmed' | 'countdown'>('idle')
  const [countdown, setCountdown] = useState(3)

  const handleReport = useCallback(() => {
    setPhase('confirmed')
  }, [])

  // Confirmed → start countdown after 1s
  useEffect(() => {
    if (phase !== 'confirmed') return
    const timer = setTimeout(() => setPhase('countdown'), 1000)
    return () => clearTimeout(timer)
  }, [phase])

  // Countdown 3 → 2 → 1 → redirect
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      router.back()
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, countdown, router])

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--error)]">{ERROR_MESSAGE}</span>
        <button
          onClick={handleReport}
          disabled={phase !== 'idle'}
          className={
            phase === 'idle'
              ? 'text-xs text-[var(--navy-medium)] hover:underline'
              : 'inline-flex items-center gap-1 text-xs text-green-700'
          }
        >
          {phase === 'idle' && 'Fout melden'}
          {phase === 'confirmed' && (
            <>
              <CheckCircle className="w-3 h-3" />
              Fout is gemeld
            </>
          )}
          {phase === 'countdown' && (
            <>
              <Undo2 className="w-3 h-3" />
              Terug in {countdown}...
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="text-center bg-white rounded-lg border border-[var(--border)] p-8 shadow-sm max-w-md">
      <AlertTriangle className="h-10 w-10 text-[var(--warning)] mx-auto mb-3" />
      <p className="text-lg font-medium text-[var(--navy-dark)]">{ERROR_MESSAGE}</p>
      <button
        onClick={handleReport}
        disabled={phase !== 'idle'}
        className={
          phase === 'countdown'
            ? 'mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--navy-medium)] bg-[var(--gray-light)] border border-[var(--border)] rounded-lg'
            : phase === 'confirmed'
              ? 'mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg'
              : 'mt-4 px-4 py-2 text-sm font-medium bg-[var(--pink)] text-white rounded-lg hover:opacity-90 transition-opacity'
        }
      >
        {phase === 'idle' && 'Fout melden'}
        {phase === 'confirmed' && (
          <>
            <CheckCircle className="w-4 h-4" />
            Fout is gemeld
          </>
        )}
        {phase === 'countdown' && (
          <>
            <Undo2 className="w-4 h-4" />
            Terug in {countdown}...
          </>
        )}
      </button>
    </div>
  )
}
