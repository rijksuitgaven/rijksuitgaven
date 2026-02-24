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
    <div style={{ backgroundColor: '#E1EAF2', borderBottom: '1px solid #8DBADC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-start gap-2">
          <div className="text-sm min-w-0" style={{ color: '#0E3261' }}>
            {unseen.length === 1 ? (
              <p className="flex items-center flex-wrap gap-x-1">
                <span style={{ color: '#D4286B' }}>✦</span>
                <span className="font-medium">Nieuw:</span>
                <Link
                  href="/versiegeschiedenis"
                  className="underline hover:no-underline"
                  style={{ color: '#D4286B' }}
                >
                  {unseen[0].title}
                </Link>
              </p>
            ) : (
              <p className="flex items-center flex-wrap gap-x-1">
                <span style={{ color: '#D4286B' }}>✦</span>
                <span className="font-medium">Nieuw sinds uw laatste bezoek</span>
                <span className="hidden sm:inline" style={{ color: '#8DBADC' }}>—</span>
                <span>
                  {visibleTitles.join(' · ')}
                  {remaining > 0 && (
                    <span style={{ color: '#436FA3' }}> en {remaining} meer</span>
                  )}
                </span>
                <Link
                  href="/versiegeschiedenis"
                  className="font-medium underline hover:no-underline whitespace-nowrap"
                  style={{ color: '#D4286B' }}
                >
                  Bekijk alles &rarr;
                </Link>
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1.5 rounded transition-colors hover:bg-white/50"
            style={{ color: '#436FA3' }}
            aria-label="Sluiten"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
