'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ExpandedRow } from '@/components/data-table'
import { FilterPanel, type FilterValues } from '@/components/filter-panel'
import { CrossModuleResults } from '@/components/cross-module-results'
import { ErrorBoundary } from '@/components/error-boundary'
import { fetchModuleData } from '@/lib/api'
import { getStoredColumns, getDefaultColumns } from '@/components/column-selector'
import { useAnalytics } from '@/hooks/use-analytics'
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
        <p className="text-lg text-[var(--error)]">Module niet gevonden</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <Suspense fallback={<ModulePageSkeleton config={config} />}>
          <ModulePageContent moduleId={moduleId} config={config} />
        </Suspense>
      </div>
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
  const { track } = useAnalytics()
  const hasTrackedView = useRef(false)
  const searchTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTrackedSearch = useRef('')

  const [data, setData] = useState<ModuleDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortBy, setSortBy] = useState<string>('random')  // Default: random (UX-002)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [userHasSorted, setUserHasSorted] = useState(false)  // Track if user explicitly sorted
  const [filterExpandTrigger, setFilterExpandTrigger] = useState(0)  // UX-020: auto-expand filter panel
  // Selected extra columns state - lifted from DataTable (UX-005)
  // Initialize with defaults (SSR-safe), then sync from localStorage after hydration
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => getDefaultColumns(moduleId))
  const [isHydrated, setIsHydrated] = useState(false)

  // Sync columns from localStorage after hydration (SSR-safe pattern)
  useEffect(() => {
    const stored = getStoredColumns(moduleId)
    setSelectedColumns(stored)
    setIsHydrated(true)
  }, [moduleId])

  // Initialize filters from URL params (including dynamic filter fields)
  const [filters, setFilters] = useState<FilterValues>(() => {
    const baseFilters: FilterValues = {
      search: searchParams.get('q') ?? '',
      jaar: searchParams.get('jaar') ? parseInt(searchParams.get('jaar')!, 10) : null,
      minBedrag: searchParams.get('min_bedrag') ? parseFloat(searchParams.get('min_bedrag')!) : null,
      maxBedrag: searchParams.get('max_bedrag') ? parseFloat(searchParams.get('max_bedrag')!) : null,
    }

    // Parse dynamic filter params (e.g., regeling=value, artikel=value)
    const standardKeys = ['q', 'jaar', 'min_bedrag', 'max_bedrag']
    searchParams.forEach((value, key) => {
      if (!standardKeys.includes(key) && value) {
        baseFilters[key] = [value]
      }
    })

    return baseFilters
  })

  // Get active filter field names (multiselect filters with values selected)
  // These will be shown as columns automatically (max 2, in filter order) - UX-006
  // Use useMemo to prevent infinite render loops from array reference changes
  const activeFilterColumns = useMemo((): string[] => {
    // Standard filter keys that are NOT column fields
    const nonColumnKeys = ['search', 'jaar', 'minBedrag', 'maxBedrag', 'betalingen']

    const activeFields: string[] = []

    // Check each filter - if it's an array with values, it's an active multiselect
    for (const [key, value] of Object.entries(filters)) {
      if (nonColumnKeys.includes(key)) continue
      if (Array.isArray(value) && value.length > 0) {
        activeFields.push(key)
      }
    }

    // Return first 2 active filter fields
    return activeFields.slice(0, 2)
  }, [filters])

  // Compute effective columns: active filters override user selection
  // Memoize to prevent unnecessary re-renders
  const effectiveColumns = useMemo(() => {
    return activeFilterColumns.length > 0 ? activeFilterColumns : selectedColumns
  }, [activeFilterColumns, selectedColumns])

  // Reset state when switching modules (UX-002: randomize on module switch)
  // Note: selectedColumns is handled in the hydration useEffect above
  useEffect(() => {
    setSortBy('random')
    setUserHasSorted(false)
    setPage(1)
    // Clear search tracking state on module switch
    lastTrackedSearch.current = ''
    if (searchTrackTimer.current) {
      clearTimeout(searchTrackTimer.current)
      searchTrackTimer.current = null
    }
  }, [moduleId])

  // Cleanup search track timer on unmount
  useEffect(() => {
    return () => {
      if (searchTrackTimer.current) clearTimeout(searchTrackTimer.current)
    }
  }, [])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('q', filters.search)
    if (filters.jaar) params.set('jaar', String(filters.jaar))
    if (filters.minBedrag) params.set('min_bedrag', String(filters.minBedrag))
    if (filters.maxBedrag) params.set('max_bedrag', String(filters.maxBedrag))

    // Include dynamic filter params (multiselect filters)
    const standardKeys = ['search', 'jaar', 'minBedrag', 'maxBedrag']
    Object.entries(filters).forEach(([key, value]) => {
      if (!standardKeys.includes(key) && Array.isArray(value) && value.length > 0) {
        // For multiselect, only include first value in URL (simple link sharing)
        // Full multi-value would need comma-separated or multiple params
        params.set(key, value[0])
      }
    })

    const newUrl = params.toString() ? `/${moduleId}?${params.toString()}` : `/${moduleId}`
    router.replace(newUrl, { scroll: false })
  }, [filters, router, moduleId])

  // Determine if this is the default view (no search, no filters)
  // Include multiselect filters (activeFilterColumns) in the check
  const isDefaultView = !filters.search && !filters.jaar && !filters.minBedrag && !filters.maxBedrag && activeFilterColumns.length === 0

  // Fetch data when filters, pagination, or sorting changes
  // Wait for hydration to ensure selectedColumns is loaded from localStorage
  useEffect(() => {
    // Don't fetch until hydration is complete (columns loaded from localStorage)
    if (!isHydrated) return

    const abortController = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // For default view: use random sort and filter to recipients with 4+ years (UX-002)
        const effectiveSortBy = isDefaultView && !userHasSorted ? 'random' : sortBy
        const minYears = isDefaultView && !userHasSorted ? 4 : undefined

        // Build base params
        const baseParams: Parameters<typeof fetchModuleData>[1] = {
          page,
          per_page: perPage,
          sort_by: effectiveSortBy,
          sort_order: sortOrder,
          search: filters.search || undefined,
          jaar: filters.jaar ?? undefined,
          min_bedrag: filters.minBedrag ?? undefined,
          max_bedrag: filters.maxBedrag ?? undefined,
          min_years: minYears,
          // Include effective columns: active filters override user selection (UX-006)
          columns: effectiveColumns.length > 0 ? effectiveColumns : undefined,
        }

        // Build module-specific filter params separately for type safety
        // These are dynamic keys validated at API level
        const excludedKeys = ['search', 'jaar', 'minBedrag', 'maxBedrag'] as const
        const moduleFilters: Record<string, string | string[] | number> = {}

        Object.entries(filters).forEach(([key, value]) => {
          if (!excludedKeys.includes(key as typeof excludedKeys[number]) && value !== null && value !== undefined && value !== '') {
            // Only add non-null, non-empty values
            if (Array.isArray(value)) {
              if (value.length > 0) {
                moduleFilters[key] = value
              }
            } else if (typeof value === 'string' || typeof value === 'number') {
              moduleFilters[key] = value
            }
          }
        })

        // Merge params - moduleFilters has compatible index signature
        const params = { ...baseParams, ...moduleFilters }

        const response = await fetchModuleData(moduleId, params, abortController.signal)
        setData(response)

        // Track module_view on first load only (not on filter/sort/page changes)
        if (!hasTrackedView.current) {
          hasTrackedView.current = true
          track('module_view', moduleId, {
            search_query: filters.search || undefined,
            result_count: response.pagination.totalRows,
            has_filters: !isDefaultView,
          })
        }

        // Debounced search tracking — 2s quiet period captures final intent, not keystrokes
        // Fixes: tracks only final query, uses real result_count from response
        if (filters.search && filters.search.trim()) {
          if (searchTrackTimer.current) clearTimeout(searchTrackTimer.current)
          const querySnap = filters.search
          const countSnap = response.pagination.totalRows
          searchTrackTimer.current = setTimeout(() => {
            if (querySnap !== lastTrackedSearch.current) {
              lastTrackedSearch.current = querySnap
              track('search', moduleId, {
                query: querySnap,
                result_count: countSnap,
                search_type: 'module_filter',
              })
            }
          }, 2000)
        } else if (!filters.search) {
          // Clear tracking state when search is cleared
          lastTrackedSearch.current = ''
          if (searchTrackTimer.current) {
            clearTimeout(searchTrackTimer.current)
            searchTrackTimer.current = null
          }
        }
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
  }, [moduleId, page, perPage, sortBy, sortOrder, filters, isDefaultView, userHasSorted, effectiveColumns, isHydrated])

  // Track search and filter changes
  const prevFiltersRef = useRef<FilterValues>(filters)

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const prev = prevFiltersRef.current

    // Track filter changes (multiselect filters only — search tracked after data loads)
    const nonFilterKeys = ['search', 'jaar', 'minBedrag', 'maxBedrag']
    for (const [key, value] of Object.entries(newFilters)) {
      if (nonFilterKeys.includes(key)) continue
      if (Array.isArray(value) && value.length > 0) {
        const prevValue = prev[key]
        if (!Array.isArray(prevValue) || JSON.stringify(prevValue) !== JSON.stringify(value)) {
          track('filter_apply', moduleId, {
            field: key,
            values: value,
          })
        }
      }
    }

    prevFiltersRef.current = newFilters
    setFilters(newFilters)
    setPage(1)
  }, [track, moduleId])

  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    // Transform data-table column IDs (year-2024) → backend format (y2024)
    const backendColumn = column.startsWith('year-') ? `y${column.slice(5)}` : column
    setSortBy(backendColumn)
    setSortOrder(direction)
    setUserHasSorted(true)  // User explicitly sorted, don't reset to random
    setPage(1)
    track('sort_change', moduleId, { column: backendColumn, direction })
  }, [track, moduleId])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    if (newPage > 1) {
      track('page_change', moduleId, { page: newPage, per_page: perPage })
    }
  }, [track, moduleId, perPage])

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage)
    setPage(1)
  }, [])

  const handleRowExpand = useCallback((primaryValue: string) => {
    track('row_expand', moduleId, {
      recipient: primaryValue,
      search_query: filters.search || undefined,
    })
  }, [track, moduleId, filters.search])

  const handleNavigateToModule = useCallback((targetModule: string, recipient: string) => {
    track('cross_module_nav', moduleId, {
      target_module: targetModule,
      recipient,
      origin: 'expanded_row',
    })
    router.push(`/${targetModule}?q=${encodeURIComponent(recipient)}`)
  }, [router, track, moduleId])

  // Handle click on extra column value - apply filter (clear start) + auto-expand filter panel (UX-020)
  const handleFilterLinkClick = useCallback((field: string, value: string) => {
    // Clear all filters and apply only the clicked filter
    setFilters({
      search: '',
      jaar: null,
      minBedrag: null,
      maxBedrag: null,
      [field]: [value],
    })
    setPage(1)
    setFilterExpandTrigger(prev => prev + 1)
  }, [])

  const isSearching = Boolean(filters.search && filters.search.trim().length > 0)

  const renderExpandedRow = useCallback((row: RecipientRow) => (
    <ExpandedRow
      row={row}
      module={moduleId}
      availableYears={data?.availableYears ?? []}
      extraColumnsCount={effectiveColumns.length}
      isSearching={isSearching}
      onFilterLinkClick={handleFilterLinkClick}
    />
  ), [moduleId, data?.availableYears, effectiveColumns.length, isSearching, handleFilterLinkClick])

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
            autoExpandTrigger={filterExpandTrigger}
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
            onFilterLinkClick={handleFilterLinkClick}
            renderExpandedRow={renderExpandedRow}
            moduleId={moduleId}
            selectedColumns={effectiveColumns}
            onColumnsChange={(cols) => {
              setSelectedColumns(cols)
              track('column_change', moduleId, { columns: cols })
            }}
            onExport={(format, rowCount) => {
              track('export', moduleId, {
                format,
                row_count: rowCount,
                search_query: filters.search || undefined,
                has_filters: !isDefaultView,
              })
            }}
            hasActiveFilters={activeFilterColumns.length > 0}
            searchQuery={filters.search}
            totals={data?.totals}
          />
        </div>
      </main>

    </div>
  )
}
