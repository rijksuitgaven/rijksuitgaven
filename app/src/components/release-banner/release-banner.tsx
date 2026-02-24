'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
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

  // Build description text based on item count
  let description: string
  if (unseen.length === 1) {
    description = unseen[0].title
  } else if (unseen.length <= 3) {
    description = visibleTitles.join(' · ') + (remaining > 0 ? ` en ${remaining} meer` : '')
  } else {
    description = `${unseen.length} verbeteringen sinds uw vorige bezoek`
  }

  return (
    <div
      className="border-b"
      style={{ backgroundColor: 'rgba(225, 234, 242, 0.6)', borderColor: 'rgba(67, 111, 163, 0.15)' }}
      role="region"
      aria-label="Update melding"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <p className="text-[13px] leading-5 min-w-0" style={{ color: '#0E3261', fontFamily: 'var(--font-body)' }}>
          <span className="font-semibold">Nieuw</span>
          <span className="mx-1.5" style={{ color: 'rgba(67, 111, 163, 0.4)' }}>|</span>
          <span style={{ color: 'rgba(14, 50, 97, 0.8)' }}>
            {description}
          </span>
          <span className="mx-1" style={{ color: 'rgba(67, 111, 163, 0.4)' }}>&middot;</span>
          <Link
            href="/versiegeschiedenis"
            className="font-semibold hover:underline whitespace-nowrap"
            style={{ color: '#0E3261' }}
          >
            Bekijk alles &rarr;
          </Link>
        </p>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded border transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            color: '#436FA3',
            borderColor: 'rgba(67, 111, 163, 0.35)',
          }}
          aria-label="Sluiten"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
