'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/use-analytics'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS, ALL_MODULES } from '@/lib/constants'

interface ModuleCount {
  module: string
  count: number
}

interface CrossModuleResultsProps {
  searchQuery: string
  currentModule: string
  className?: string
}

export function CrossModuleResults({ searchQuery, currentModule, className }: CrossModuleResultsProps) {
  const { track } = useAnalytics()
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
        const settled = await Promise.allSettled(
          otherModules.map(async (module) => {
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
            // API returns meta.total (not pagination.totalRows - that's the transformed format)
            const count = data.meta?.total ?? 0

            return { module, count }
          })
        )

        const results = settled
          .filter((r): r is PromiseFulfilledResult<ModuleCount | null> => r.status === 'fulfilled')
          .map(r => r.value)

        // Filter modules with results and sort by count descending
        const validResults = results
          .filter((r): r is ModuleCount => r !== null && r.count > 0)
          .sort((a, b) => b.count - a.count)

        if (!signal.aborted) {
          setModuleCounts(validResults)
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
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
            onClick={() => track('cross_module_nav', currentModule, { target_module: item.module, recipient: searchQuery, origin: 'cross_module_results' })}
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
