'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ExpandedRow } from '@/components/data-table'
import { FilterPanel, type FilterValues } from '@/components/filter-panel'
import { CrossModuleResults } from '@/components/cross-module-results'
import { ErrorBoundary, ErrorReport } from '@/components/error-boundary'
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
  const lastTrigger = useRef<string>('page_load')

  // Committed search tracking (UX-034) — tracks only explicit user actions (Enter / autocomplete click)
  const activeSearchId = useRef<string | null>(null)
  const searchStartTime = useRef<number | null>(null)
  const lastSearchResult = useRef<{ query: string; count: number; searchId: string; timestamp: number } | null>(null)
  const visibilityPauseStart = useRef<number | null>(null) // ms (Date.now())
  const pausedDuration = useRef(0) // ms — accumulated hidden time
  // Refs to avoid stale closures in handleSearchCommit
  const dataRef = useRef<ModuleDataResponse | null>(null)
  const filtersRef = useRef<FilterValues>({ search: '', jaar: null, minBedrag: null, maxBedrag: null })

  // Generate unique search ID
  const generateSearchId = useCallback(() => {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  }, [])

  // End the current search session and track search_end
  const endCurrentSearch = useCallback((exitAction: string) => {
    if (!activeSearchId.current || !searchStartTime.current) return
    const now = Date.now()
    const rawDuration = (now - searchStartTime.current) / 1000
    const duration = Math.min(rawDuration - pausedDuration.current / 1000, 300) // seconds - ms/1000 = seconds; cap at 5 min
    track('search_end', moduleId, {
      search_id: activeSearchId.current,
      duration_seconds: Math.round(duration),
      exit_action: exitAction,
    })
    activeSearchId.current = null
    searchStartTime.current = null
    pausedDuration.current = 0
  }, [track, moduleId])

  // Track a committed search event (shared by immediate and deferred paths)
  const trackSearchCommit = useCallback((query: string, commitType: 'enter' | 'autocomplete', resultCount: number, typedText?: string) => {
    const searchId = generateSearchId()
    activeSearchId.current = searchId
    searchStartTime.current = Date.now()
    pausedDuration.current = 0

    const props: Record<string, unknown> = {
      search_id: searchId,
      query,
      result_count: resultCount,
      commit_type: commitType,
    }
    if (typedText) props.autocomplete_typed = typedText
    // Retry chain: link to previous zero-result search within 60s
    if (lastSearchResult.current && lastSearchResult.current.count === 0) {
      const elapsed = Date.now() - lastSearchResult.current.timestamp
      if (elapsed < 60_000) props.prev_search_id = lastSearchResult.current.searchId
    }
    track('search', moduleId, props)
    lastSearchResult.current = { query, count: resultCount, searchId, timestamp: Date.now() }
  }, [generateSearchId, track, moduleId])

  // Pending search commit — set by filter-panel callbacks, consumed after data loads (when result_count is known)
  const pendingSearchCommit = useRef<{
    query: string
    commitType: 'enter' | 'autocomplete'
    typedText?: string // what user actually typed (autocomplete only)
  } | null>(null)

  // Signal a committed search from filter-panel
  // If data is already loaded for this query, track immediately (Enter after debounce loaded data)
  // Otherwise, store as pending for consumption after data loads
  const handleSearchCommit = useCallback((query: string, commitType: 'enter' | 'autocomplete', typedText?: string) => {
    endCurrentSearch('new_search')

    // Check if data is already loaded for this exact query (Enter pressed after debounce loaded data)
    const currentData = dataRef.current
    const currentSearch = filtersRef.current.search
    if (currentData && currentSearch === query) {
      trackSearchCommit(query, commitType, currentData.pagination.totalRows, typedText)
      pendingSearchCommit.current = null
      return
    }

    // Data not ready yet — store for deferred consumption after data loads
    pendingSearchCommit.current = { query, commitType, typedText }
  }, [endCurrentSearch, trackSearchCommit])

  // Pause duration tracking when tab is hidden
  useEffect(() => {
    function handleVisChange() {
      if (document.visibilityState === 'hidden') {
        visibilityPauseStart.current = Date.now()
      } else if (visibilityPauseStart.current) {
        pausedDuration.current += Date.now() - visibilityPauseStart.current
        visibilityPauseStart.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisChange)
    return () => document.removeEventListener('visibilitychange', handleVisChange)
  }, [])

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

  // Compute effective columns: user controls column selection via Kolommen (UX-005)
  // Filter columns no longer auto-override user selection (UX-006 revised)
  const effectiveColumns = useMemo(() => {
    return selectedColumns
  }, [selectedColumns])

  // Keep refs in sync for handleSearchCommit (avoids stale closures)
  dataRef.current = data
  filtersRef.current = filters

  // Reset state when switching modules (UX-002: randomize on module switch)
  // Note: selectedColumns is handled in the hydration useEffect above
  useEffect(() => {
    setSortBy('random')
    setUserHasSorted(false)
    setPage(1)
    // End current search session on module switch
    endCurrentSearch('module_switch')
  }, [moduleId, endCurrentSearch])

  // End search on unmount (navigation away)
  useEffect(() => {
    return () => {
      endCurrentSearch('page_leave')
    }
  }, [endCurrentSearch])

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

        // Committed search tracking (UX-034): consume pending commit now that result_count is known
        // (deferred path — for when Enter/autocomplete fires BEFORE data loads)
        if (pendingSearchCommit.current) {
          const commit = pendingSearchCommit.current
          pendingSearchCommit.current = null
          // Only track if the loaded data matches the committed query
          if (filters.search === commit.query) {
            trackSearchCommit(commit.query, commit.commitType, response.pagination.totalRows, commit.typedText)
          }
        }

        // When search is cleared, end the current search session
        if (!filters.search && activeSearchId.current) {
          endCurrentSearch('search_clear')
        }
      } catch (err) {
        // Ignore abort errors and transient network errors from navigation/cancelled requests
        if (err instanceof Error) {
          const msg = err.message
          if (
            err.name === 'AbortError' ||
            msg.includes('NetworkError') ||
            msg === 'Failed to fetch' ||
            msg.endsWith('data: ') // "Failed to fetch X data: " with empty error
          ) {
            return
          }
        }
        const internalMsg = err instanceof Error ? err.message : String(err)
        console.error('[Module]', internalMsg)
        setError('De gegevens konden niet worden geladen')
        track('error', moduleId, {
          message: internalMsg,
          trigger: lastTrigger.current,
          search_query: filters.search || undefined,
          sort_by: sortBy,
          has_filters: !isDefaultView,
        })
        lastTrigger.current = 'page_load' // Reset for next fetch
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
  const filterOriginRef = useRef<'filter_panel' | 'expanded_row'>('filter_panel')

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    const prev = prevFiltersRef.current
    const origin = filterOriginRef.current
    filterOriginRef.current = 'filter_panel' // Reset after consumption

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
            origin,
          })
        }
      }
    }

    prevFiltersRef.current = newFilters
    // Detect if search changed vs filter changed
    lastTrigger.current = newFilters.search !== prev.search ? 'search' : 'filter_apply'
    setFilters(newFilters)
    setPage(1)
  }, [track, moduleId])

  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    // Map data-table column IDs → backend sort_by values
    // IMPORTANT: Every sortable column ID must have an entry here or use a dynamic pattern.
    // If a column ID is missing, the backend rejects it with 400 and the user sees stale data.
    // See: CLAUDE.md "Sort Field Contract"
    const SORT_FIELD_MAP: Record<string, string> = {
      'total': 'totaal',
      'primary': 'primary',
    }
    let backendColumn = SORT_FIELD_MAP[column]
    if (!backendColumn) {
      // Dynamic patterns: year-2024→y2024, extra-source→extra-source (passthrough)
      if (column.startsWith('year-')) {
        backendColumn = `y${column.slice(5)}`
      } else {
        backendColumn = column
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Sort] Column "${column}" not in SORT_FIELD_MAP — verify backend accepts sort_by=${column}`)
        }
      }
    }
    lastTrigger.current = 'sort_change'
    setSortBy(backendColumn)
    setSortOrder(direction)
    setUserHasSorted(true)  // User explicitly sorted, don't reset to random
    setPage(1)
    track('sort_change', moduleId, { column: backendColumn, direction, search_id: activeSearchId.current || undefined })
  }, [track, moduleId])

  const handlePageChange = useCallback((newPage: number) => {
    lastTrigger.current = 'page_change'
    setPage(newPage)
    if (newPage > 1) {
      track('page_change', moduleId, { page: newPage, per_page: perPage, search_id: activeSearchId.current || undefined })
    }
  }, [track, moduleId, perPage])

  const handlePerPageChange = useCallback((newPerPage: number) => {
    lastTrigger.current = 'page_change'
    setPerPage(newPerPage)
    setPage(1)
  }, [])

  const handleRowExpand = useCallback((primaryValue: string) => {
    track('row_expand', moduleId, {
      recipient: primaryValue,
      search_query: filters.search || undefined,
      search_id: activeSearchId.current || undefined,
    })
  }, [track, moduleId, filters.search])

  const handleNavigateToModule = useCallback((targetModule: string, recipient: string) => {
    track('cross_module_nav', moduleId, {
      target_module: targetModule,
      recipient,
      origin: 'expanded_row',
      search_id: activeSearchId.current || undefined,
    })
    router.push(`/${targetModule}?q=${encodeURIComponent(recipient)}`)
  }, [router, track, moduleId])

  // Handle click on extra column value - apply filter (clear start) + auto-expand filter panel (UX-020)
  const handleFilterLinkClick = useCallback((field: string, value: string) => {
    // Mark origin so handleFilterChange tracks it as expanded_row
    filterOriginRef.current = 'expanded_row'
    lastTrigger.current = 'filter_apply'
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

  // Extract active multiselect filters for expanded row scoping
  const activeMultiselectFilters = useMemo(() => {
    const result: Record<string, string[]> = {}
    const nonFilterKeys = ['search', 'jaar', 'minBedrag', 'maxBedrag']
    for (const [key, value] of Object.entries(filters)) {
      if (nonFilterKeys.includes(key)) continue
      if (Array.isArray(value) && value.length > 0) {
        result[key] = value
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }, [filters])

  const renderExpandedRow = useCallback((row: RecipientRow, initialGrouping?: string) => (
    <ExpandedRow
      row={row}
      module={moduleId}
      availableYears={data?.availableYears ?? []}
      extraColumnsCount={effectiveColumns.length}
      isSearching={isSearching}
      searchQuery={isSearching ? filters.search : undefined}
      activeFilters={activeMultiselectFilters}
      onFilterLinkClick={handleFilterLinkClick}
      initialGrouping={initialGrouping}
    />
  ), [moduleId, data?.availableYears, effectiveColumns.length, isSearching, filters.search, activeMultiselectFilters, handleFilterLinkClick])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <ErrorReport />
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
            onSearchCommit={handleSearchCommit}
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
              track('column_change', moduleId, { columns: cols, search_id: activeSearchId.current || undefined })
            }}
            onExport={(format, rowCount) => {
              track('export', moduleId, {
                format,
                row_count: rowCount,
                search_query: filters.search || undefined,
                has_filters: !isDefaultView,
                search_id: activeSearchId.current || undefined,
              })
            }}
            searchQuery={filters.search}
            totals={data?.totals}
          />
        </div>
      </main>

    </div>
  )
}
