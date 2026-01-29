'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/api-config'

interface ModuleCount {
  module: string
  count: number
}

interface CrossModuleResultsProps {
  searchQuery: string
  currentModule: string
  className?: string
}

// All searchable modules
const ALL_MODULES = ['instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek', 'integraal']

// Module labels for display
const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  inkoop: 'Inkoop',
  publiek: 'Publiek',
  gemeente: 'Gemeente',
  provincie: 'Provincie',
  apparaat: 'Apparaat',
  integraal: 'Integraal',
}

export function CrossModuleResults({ searchQuery, currentModule, className }: CrossModuleResultsProps) {
  const [moduleCounts, setModuleCounts] = useState<ModuleCount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch counts from other modules when search query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setModuleCounts([])
      return
    }

    const controller = new AbortController()
    const signal = controller.signal

    async function fetchCounts() {
      setIsLoading(true)

      const otherModules = ALL_MODULES.filter(m => m !== currentModule && m !== 'integraal')

      try {
        const results = await Promise.all(
          otherModules.map(async (module) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/v1/modules/${module}?` +
                new URLSearchParams({
                  q: searchQuery,
                  limit: '1',
                  offset: '0',
                }),
                { signal }
              )

              if (!response.ok) return null

              const data = await response.json()
              const count = data.pagination?.totalRows || 0

              return { module, count }
            } catch {
              return null
            }
          })
        )

        // Filter modules with results and sort by count descending
        const validResults = results
          .filter((r): r is ModuleCount => r !== null && r.count > 0)
          .sort((a, b) => b.count - a.count)

        setModuleCounts(validResults)
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the fetch
    const timeout = setTimeout(fetchCounts, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery, currentModule])

  // Don't render if no search or no results in other modules
  if (!searchQuery || searchQuery.length < 2 || moduleCounts.length === 0) {
    return null
  }

  return (
    <div className={cn('text-sm text-[var(--muted-foreground)] mb-4', className)}>
      <span className="font-medium text-[var(--navy-medium)]">Ook in:</span>{' '}
      {moduleCounts.map((item, index) => (
        <span key={item.module}>
          <Link
            href={`/${item.module}?q=${encodeURIComponent(searchQuery)}`}
            className="text-[var(--navy-medium)] hover:text-[var(--pink)] hover:underline transition-colors"
          >
            {MODULE_LABELS[item.module] || item.module}{' '}
            <span className="text-[var(--muted-foreground)]">({item.count.toLocaleString('nl-NL')})</span>
          </Link>
          {index < moduleCounts.length - 1 && <span className="mx-1">&bull;</span>}
        </span>
      ))}
      {isLoading && <span className="ml-2 text-xs text-[var(--muted-foreground)]">Laden...</span>}
    </div>
  )
}
