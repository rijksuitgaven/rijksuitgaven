'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function TeamNav() {
  const pathname = usePathname()
  const [newCount, setNewCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    fetch('/api/v1/team/feedback?count_only=true')
      .then(res => res.json())
      .then(data => setNewCount(data.new_count || 0))
      .catch(() => {})

    fetch('/api/v1/team/statistieken?days=7')
      .then(res => res.json())
      .then(data => setErrorCount(data.errors?.length || 0))
      .catch(() => {})
  }, [])

  const tabs: { href: string; label: string; exact: boolean; count?: number; countVariant?: 'pink' | 'red' }[] = [
    { href: '/team', label: 'Dashboard', exact: true },
    { href: '/team/leden', label: 'Leden', exact: false },
    { href: '/team/contacten', label: 'Contacten', exact: false },
    { href: '/team/feedback', label: 'Feedback', exact: false, count: newCount, countVariant: 'pink' },
    { href: '/team/statistieken', label: 'Statistieken', exact: false },
    { href: '/team/fouten', label: 'Fouten', exact: false, count: errorCount, countVariant: 'red' },
  ]

  return (
    <nav className="flex gap-1 border-b border-[var(--border)] mb-6">
      {tabs.map(tab => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)
        const badgeBg = tab.countVariant === 'red' ? 'bg-red-500' : 'bg-[var(--pink)]'
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[var(--navy-dark)] text-[var(--navy-dark)]'
                : 'border-transparent text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] px-1 py-0.5 text-xs font-bold rounded-full ${badgeBg} text-white`}>
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
