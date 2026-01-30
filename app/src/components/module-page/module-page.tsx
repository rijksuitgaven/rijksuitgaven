'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ExpandedRow } from '@/components/data-table'
import { FilterPanel, type FilterValues } from '@/components/filter-panel'
import { DetailPanel } from '@/components/detail-panel'
import { CrossModuleResults } from '@/components/cross-module-results'
import { ErrorBoundary } from '@/components/error-boundary'
import { fetchModuleData } from '@/lib/api'
import type { ModuleDataResponse, RecipientRow } from '@/types/api'

// Module configuration
export interface ModuleConfig {
  id: string
  title: string
  description: string
  primaryColumn: string
}

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  instrumenten: {
    id: 'instrumenten',
    title: 'Financiële Instrumenten',
    description: 'Subsidies, regelingen en bijdragen aan ontvangers',
    primaryColumn: 'Ontvanger',
  },
  apparaat: {
    id: 'apparaat',
    title: 'Apparaatsuitgaven',
    description: 'Operationele kosten per kostensoort',
    primaryColumn: 'Kostensoort',
  },
  inkoop: {
    id: 'inkoop',
    title: 'Inkoopuitgaven',
    description: 'Inkoop bij leveranciers per ministerie',
    primaryColumn: 'Leverancier',
  },
  provincie: {
    id: 'provincie',
    title: 'Provinciale Subsidies',
    description: 'Subsidies verstrekt door provincies',
    primaryColumn: 'Ontvanger',
  },
  gemeente: {
    id: 'gemeente',
    title: 'Gemeentelijke Subsidies',
    description: 'Subsidies verstrekt door gemeenten',
    primaryColumn: 'Ontvanger',
  },
  publiek: {
    id: 'publiek',
    title: 'Publiek',
    description: 'Uitbetalingen door RVO, COA en NWO',
    primaryColumn: 'Ontvanger',
  },
  integraal: {
    id: 'integraal',
    title: 'Integraal Zoeken',
    description: 'Zoek ontvangers over alle modules heen',
    primaryColumn: 'Ontvanger',
  },
}

interface ModulePageProps {
  moduleId: string
}

/**
 * Module page component - main page for displaying module data
 * Wraps content in Suspense for useSearchParams compatibility
 */
export function ModulePage({ moduleId }: ModulePageProps) {
  const config = MODULE_CONFIGS[moduleId]

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <p className="text-lg text-[var(--error)]">Module niet gevonden: {moduleId}</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<ModulePageSkeleton config={config} />}>
        <ModulePageContent moduleId={moduleId} config={config} />
      </Suspense>
    </ErrorBoundary>
  )
}

function ModulePageSkeleton({ config }: { config: ModuleConfig }) {
  // config used for type consistency, title/description removed per UX decision
  void config
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[var(--gray-light)] rounded-lg" />
            <div className="h-64 bg-[var(--gray-light)] rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}

function ModulePageContent({ moduleId, config }: { moduleId: string; config: ModuleConfig }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<ModuleDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortBy, setSortBy] = useState<string>('random')  // Default: random (UX-002)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [userHasSorted, setUserHasSorted] = useState(false)  // Track if user explicitly sorted
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterValues>(() => ({
    search: searchParams.get('q') ?? '',
    jaar: searchParams.get('jaar') ? parseInt(searchParams.get('jaar')!, 10) : null,
    minBedrag: searchParams.get('min_bedrag') ? parseFloat(searchParams.get('min_bedrag')!) : null,
    maxBedrag: searchParams.get('max_bedrag') ? parseFloat(searchParams.get('max_bedrag')!) : null,
  }))

  // Reset sort state when switching modules (UX-002: randomize on module switch)
  useEffect(() => {
    setSortBy('random')
    setUserHasSorted(false)
    setPage(1)
  }, [moduleId])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('q', filters.search)
    if (filters.jaar) params.set('jaar', String(filters.jaar))
    if (filters.minBedrag) params.set('min_bedrag', String(filters.minBedrag))
    if (filters.maxBedrag) params.set('max_bedrag', String(filters.maxBedrag))

    const newUrl = params.toString() ? `/${moduleId}?${params.toString()}` : `/${moduleId}`
    router.replace(newUrl, { scroll: false })
  }, [filters, router, moduleId])

  // Determine if this is the default view (no search, no filters)
  const isDefaultView = !filters.search && !filters.jaar && !filters.minBedrag && !filters.maxBedrag

  // Fetch data when filters, pagination, or sorting changes
  useEffect(() => {
    const abortController = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // For default view: use random sort and filter to recipients with 4+ years (UX-002)
        const effectiveSortBy = isDefaultView && !userHasSorted ? 'random' : sortBy
        const minYears = isDefaultView && !userHasSorted ? 4 : undefined

        // Build params including module-specific filters (provincie, gemeente, etc.)
        const params: Parameters<typeof fetchModuleData>[1] = {
          page,
          per_page: perPage,
          sort_by: effectiveSortBy,
          sort_order: sortOrder,
          search: filters.search || undefined,
          jaar: filters.jaar ?? undefined,
          min_bedrag: filters.minBedrag ?? undefined,
          max_bedrag: filters.maxBedrag ?? undefined,
          min_years: minYears,
        }

        // Add module-specific filters (arrays for multiselect, strings for text)
        Object.entries(filters).forEach(([key, value]) => {
          if (!['search', 'jaar', 'minBedrag', 'maxBedrag'].includes(key) && value) {
            // Cast to any to allow dynamic keys - types are validated at API level
            (params as Record<string, unknown>)[key] = value
          }
        })

        const response = await fetchModuleData(moduleId, params, abortController.signal)
        setData(response)
      } catch (err) {
        // Ignore abort errors - they're expected when deps change
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Er ging iets mis')
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      abortController.abort()
    }
  }, [moduleId, page, perPage, sortBy, sortOrder, filters, isDefaultView, userHasSorted])

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortBy(column)
    setSortOrder(direction)
    setUserHasSorted(true)  // User explicitly sorted, don't reset to random
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage)
    setPage(1)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRowExpand = useCallback((_primaryValue: string) => {
    // Placeholder for future analytics or prefetch
  }, [])

  const handleNavigateToModule = useCallback((targetModule: string, recipient: string) => {
    router.push(`/${targetModule}?q=${encodeURIComponent(recipient)}`)
  }, [router])

  const handleRowClick = useCallback((recipientName: string) => {
    setSelectedRecipient(recipientName)
    setIsDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false)
  }, [])

  const renderExpandedRow = useCallback((row: RecipientRow) => (
    <ExpandedRow
      row={row}
      module={moduleId}
      availableYears={data?.availableYears ?? []}
      onNavigateToModule={handleNavigateToModule}
    />
  ), [moduleId, data?.availableYears, handleNavigateToModule])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-lg border border-[var(--border)] p-8 shadow-sm">
          <p className="text-lg font-medium text-[var(--error)]">Er ging iets mis</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[var(--pink)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* White card for search and table area */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <FilterPanel
            module={moduleId}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />

          {data && (
            <div className="mb-4 text-sm text-[var(--muted-foreground)]">
              {isDefaultView ? (
                'Random resultaten'
              ) : (
                <>
                  {data.pagination.totalRows.toLocaleString('nl-NL')} resultaten
                  {filters.search && (
                    <span> voor &ldquo;{filters.search}&rdquo;</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Cross-module search results */}
          {filters.search && moduleId !== 'integraal' && (
            <CrossModuleResults
              searchQuery={filters.search}
              currentModule={moduleId}
            />
          )}

          <DataTable
            data={data?.rows ?? []}
            availableYears={data?.availableYears ?? []}
            primaryColumnName={config.primaryColumn}
            isLoading={isLoading}
            totalRows={data?.pagination.totalRows ?? 0}
            page={page}
            perPage={perPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSortChange={handleSortChange}
            onRowExpand={handleRowExpand}
            onRowClick={handleRowClick}
            renderExpandedRow={renderExpandedRow}
            moduleId={moduleId}
          />
        </div>
      </main>

      {/* Detail Side Panel */}
      {selectedRecipient && (
        <DetailPanel
          recipientName={selectedRecipient}
          moduleId={moduleId}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onNavigateToModule={handleNavigateToModule}
        />
      )}
    </div>
  )
}
