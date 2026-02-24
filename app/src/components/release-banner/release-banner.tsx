'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RELEASE_NOTES } from '@/lib/release-notes'

const STORAGE_KEY = 'rn-last-seen'
const MAX_VISIBLE_TITLES = 2

export function ReleaseBanner() {
  const [unseen, setUnseen] = useState<typeof RELEASE_NOTES>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY)
    const newItems = lastSeen
      ? RELEASE_NOTES.filter(n => n.date > lastSeen)
      : RELEASE_NOTES
    setUnseen(newItems)
  }, [])

  if (dismissed || unseen.length === 0) return null

  const handleDismiss = () => {
    const newest = RELEASE_NOTES[0]?.date
    if (newest) localStorage.setItem(STORAGE_KEY, newest)
    setDismissed(true)
  }

  const visibleTitles = unseen.slice(0, MAX_VISIBLE_TITLES).map(n => n.title)
  const remaining = unseen.length - MAX_VISIBLE_TITLES

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="text-sm text-blue-800 min-w-0">
          {unseen.length === 1 ? (
            <p>
              <span className="font-medium">Nieuw: </span>
              <Link href="/versiegeschiedenis" className="underline hover:no-underline">
                {unseen[0].title}
              </Link>
            </p>
          ) : (
            <>
              <p className="font-medium">
                {unseen.length} verbeteringen sinds uw laatste bezoek
              </p>
              <p className="mt-0.5">
                {visibleTitles.join(' · ')}
                {remaining > 0 && <span className="text-blue-600"> en {remaining} meer</span>}
                {' '}
                <Link href="/versiegeschiedenis" className="font-medium underline hover:no-underline">
                  Bekijk alles &rarr;
                </Link>
              </p>
            </>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-blue-600 hover:text-blue-800 transition-colors"
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
