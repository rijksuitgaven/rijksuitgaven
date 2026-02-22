'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface TopicPreference {
  id: string
  slug: string
  name: string
  description: string | null
  subscribed: boolean
}

interface PersonInfo {
  first_name: string | null
  email: string
  unsubscribed: boolean
}

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'unsubscribed' | 'error'

export default function VoorkeurenPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center" />
      </main>
    }>
      <VoorkeurenContent />
    </Suspense>
  )
}

function VoorkeurenContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')
  const [person, setPerson] = useState<PersonInfo | null>(null)
  const [topics, setTopics] = useState<TopicPreference[]>([])
  const [confirmUnsubAll, setConfirmUnsubAll] = useState(false)

  const loadPreferences = useCallback(async () => {
    if (!token) {
      setStatus('error')
      return
    }

    try {
      const res = await fetch(`/api/v1/preferences?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        setStatus('error')
        return
      }
      const data = await res.json()
      setPerson(data.person)
      setTopics(data.topics || [])
      setStatus(data.person?.unsubscribed ? 'unsubscribed' : 'ready')
    } catch {
      setStatus('error')
    }
  }, [token])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  async function handleSave() {
    if (!token) return
    setStatus('saving')

    try {
      const res = await fetch('/api/v1/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          preferences: topics.map(t => ({
            topic_id: t.id,
            subscribed: t.subscribed,
          })),
        }),
      })

      if (res.ok) {
        setStatus('saved')
        setTimeout(() => setStatus('ready'), 3000)
      } else {
        setStatus('ready')
      }
    } catch {
      setStatus('ready')
    }
  }

  async function handleUnsubscribeAll() {
    if (!token) return
    setStatus('saving')
    setConfirmUnsubAll(false)

    try {
      const res = await fetch('/api/v1/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, unsubscribe_all: true }),
      })

      if (res.ok) {
        setStatus('unsubscribed')
        setPerson(prev => prev ? { ...prev, unsubscribed: true } : prev)
      } else {
        setStatus('ready')
      }
    } catch {
      setStatus('ready')
    }
  }

  async function handleResubscribe() {
    if (!token) return
    setStatus('saving')

    try {
      // Re-subscribe by sending preferences (clears unsubscribed_at)
      const res = await fetch('/api/v1/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          preferences: topics.map(t => ({
            topic_id: t.id,
            subscribed: true,
          })),
        }),
      })

      if (res.ok) {
        setTopics(prev => prev.map(t => ({ ...t, subscribed: true })))
        setStatus('ready')
        setPerson(prev => prev ? { ...prev, unsubscribed: false } : prev)
      } else {
        setStatus('unsubscribed')
      }
    } catch {
      setStatus('unsubscribed')
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/50 rounded w-48 mx-auto" />
            <div className="h-4 bg-white/50 rounded w-64 mx-auto" />
          </div>
        </div>
      </main>
    )
  }

  if (status === 'error' || !token) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-amber-500" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0E3261]" style={{ fontFamily: 'var(--font-heading, -apple-system, sans-serif)' }}>
            Ongeldige link
          </h1>
          <p className="text-[#436FA3]">
            Deze link is niet geldig. Gebruik de link uit uw e-mail.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E1EAF2] to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Rijksuitgaven"
            width={180}
            className="mx-auto mb-6"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E1EAF2] p-6 space-y-5">
          {/* Greeting */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0E3261]" style={{ fontFamily: 'var(--font-heading, -apple-system, sans-serif)' }}>
              E-mailvoorkeuren
            </h1>
            {person?.first_name && (
              <p className="text-sm text-[#436FA3] mt-1">
                Beste {person.first_name}
              </p>
            )}
          </div>

          {status === 'unsubscribed' ? (
            <>
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-green-600" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-[#0E3261] font-medium">U bent afgemeld voor alle e-mails</p>
                <p className="text-sm text-[#436FA3] mt-1">
                  U ontvangt geen e-mails meer van Rijksuitgaven.nl.
                </p>
              </div>
              <button
                onClick={handleResubscribe}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#0E3261] bg-white border border-[#E1EAF2] rounded-lg hover:bg-[#E1EAF2]/50 transition-colors"
              >
                Opnieuw inschrijven
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#436FA3]">
                Kies welke e-mails u wilt ontvangen van Rijksuitgaven.nl.
              </p>

              {/* Topic toggles */}
              <div className="space-y-3">
                {topics.map(topic => (
                  <label
                    key={topic.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#E1EAF2] cursor-pointer hover:bg-[#E1EAF2]/30 transition-colors"
                  >
                    <div className="pt-0.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={topic.subscribed}
                        onClick={() => {
                          setTopics(prev => prev.map(t =>
                            t.id === topic.id ? { ...t, subscribed: !t.subscribed } : t
                          ))
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4286B] focus:ring-offset-2 ${
                          topic.subscribed ? 'bg-[#D4286B]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            topic.subscribed ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#0E3261]">{topic.name}</div>
                      {topic.description && (
                        <div className="text-xs text-[#436FA3] mt-0.5">{topic.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={status === 'saving'}
                className="w-full px-4 py-3 bg-[#D4286B] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
              >
                {status === 'saving' ? 'Opslaan...' : status === 'saved' ? 'Opgeslagen!' : 'Wijzigingen opslaan'}
              </button>

              {/* Unsubscribe all */}
              <div className="border-t border-[#E1EAF2] pt-4 text-center">
                {confirmUnsubAll ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[#436FA3]">
                      Weet u zeker dat u zich voor alle e-mails wilt afmelden?
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleUnsubscribeAll}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        Ja, voor alles afmelden
                      </button>
                      <button
                        onClick={() => setConfirmUnsubAll(false)}
                        className="px-4 py-2 text-sm text-[#436FA3] hover:text-[#0E3261] transition-colors"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmUnsubAll(true)}
                    className="text-sm text-[#436FA3] hover:text-[#0E3261] underline transition-colors"
                  >
                    Alles uitschrijven
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <a
            href="https://beta.rijksuitgaven.nl"
            className="text-sm text-[#436FA3] hover:underline"
          >
            Naar Rijksuitgaven.nl
          </a>
        </div>
      </div>
    </main>
  )
}
