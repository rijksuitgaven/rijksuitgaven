'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function AfmeldenPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center" />
      </main>
    }>
      <AfmeldenContent />
    </Suspense>
  )
}

function AfmeldenContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('idle')

  // Prevent double submission
  useEffect(() => {
    if (!token) setStatus('error')
  }, [token])

  async function handleUnsubscribe() {
    if (!token || status === 'loading' || status === 'success') return
    setStatus('loading')

    try {
      const res = await fetch('/api/v1/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      // Always show success to prevent enumeration
      if (res.ok || res.status === 404) {
        setStatus('success')
      } else {
        setStatus('success') // Still show success — never reveal internal state
      }
    } catch {
      // Network error — still show success for privacy
      setStatus('success')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-green-600" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0E3261]" style={{ fontFamily: 'var(--font-heading, -apple-system, sans-serif)' }}>
              U bent afgemeld
            </h1>
            <p className="text-[#436FA3]">
              U ontvangt geen e-mails meer van Rijksuitgaven.nl.
              Uw eventuele abonnement blijft ongewijzigd.
            </p>
            <a
              href="https://beta.rijksuitgaven.nl"
              className="inline-block text-sm text-[#436FA3] hover:underline"
            >
              Naar Rijksuitgaven.nl
            </a>
          </>
        ) : !token ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-amber-500" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0E3261]" style={{ fontFamily: 'var(--font-heading, -apple-system, sans-serif)' }}>
              Ongeldige link
            </h1>
            <p className="text-[#436FA3]">
              Deze afmeldlink is niet geldig. Gebruik de link uit uw e-mail.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#0E3261]" style={{ fontFamily: 'var(--font-heading, -apple-system, sans-serif)' }}>
              Afmelden voor e-mails
            </h1>
            <p className="text-[#436FA3]">
              Wilt u zich afmelden voor e-mails van Rijksuitgaven.nl?
              Uw eventuele abonnement blijft ongewijzigd.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={status === 'loading'}
              className="w-full px-4 py-3 bg-[#D4286B] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
            >
              {status === 'loading' ? 'Bezig met afmelden...' : 'Ja, afmelden'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
