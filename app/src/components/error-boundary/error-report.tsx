'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Shared error display with "Fout melden" button.
 *
 * The error is already auto-logged via the analytics track('error', ...) call.
 * The button simply confirms to the user that the error has been registered.
 *
 * Props:
 * - message: Dutch user-facing message (never raw err.message)
 * - variant: 'page' (centered card) or 'inline' (compact, for panels/rows)
 */
export function ErrorReport({
  message,
  variant = 'page',
}: {
  message: string
  variant?: 'page' | 'inline'
}) {
  const [reported, setReported] = useState(false)

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--error)]">{message}</span>
        <button
          onClick={() => setReported(true)}
          disabled={reported}
          className={
            reported
              ? 'inline-flex items-center gap-1 text-xs text-green-700'
              : 'text-xs text-[var(--navy-medium)] hover:underline'
          }
        >
          {reported ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Fout is gemeld
            </>
          ) : (
            'Fout melden'
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="text-center bg-white rounded-lg border border-[var(--border)] p-8 shadow-sm max-w-md">
      <AlertTriangle className="h-10 w-10 text-[var(--warning)] mx-auto mb-3" />
      <p className="text-lg font-medium text-[var(--navy-dark)]">{message}</p>
      <button
        onClick={() => setReported(true)}
        disabled={reported}
        className={
          reported
            ? 'mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg'
            : 'mt-4 px-4 py-2 text-sm font-medium bg-[var(--pink)] text-white rounded-lg hover:opacity-90 transition-opacity'
        }
      >
        {reported ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Fout is gemeld
          </>
        ) : (
          'Fout melden'
        )}
      </button>
    </div>
  )
}
