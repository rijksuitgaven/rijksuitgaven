'use client'

import { useState, useMemo, useRef, Fragment, useEffect, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type RowPinningState,
  type Column,
} from '@tanstack/react-table'
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ChevronsUpDown, Download, FileSpreadsheet, Info, Search, MousePointerClick, AlertTriangle, SlidersHorizontal, Columns3, Pin, PinOff } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/use-analytics'
import { StaffelPopover } from '@/components/staffel-popover/staffel-popover'
import {
  formatAmount,
  calculateYoYChange,
  isAnomaly,
  formatPercentage,
  getAmountFontClass,
} from '@/lib/format'
import { FIELD_LABELS } from '@/lib/constants'
import { ColumnSelector, MODULE_COLUMNS } from '@/components/column-selector'
import type { RecipientRow, YearAmount } from '@/types/api'

// Collapsible year range (2016-2020 by default)
const COLLAPSED_YEARS_START = 2016
const COLLAPSED_YEARS_END = 2020

const MAX_EXPORT_ROWS = 500
const MAX_PINNED_ROWS = 5

// Sticky column offset for primary column (in pixels)
const STICKY_PRIMARY_OFFSET_PX = 32
const STICKY_PRIMARY_OFFSET_PINNED_PX = 56 // Extra width when pinned rows exist (unpin + chevron)

// Column meta type for sticky columns
interface ColumnMeta {
  sticky?: boolean
}

// Totals row data structure (from API meta.totals)
interface TotalsData {
  years: Record<number, number>
  totaal: number
}

interface DataTableProps {
  data: RecipientRow[]
  availableYears: number[]
  primaryColumnName: string
  isLoading?: boolean
  totalRows?: number
  page?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  onRowExpand?: (primaryValue: string) => void
  onFilterLinkClick?: (field: string, value: string) => void // Click on extra column value to filter
  renderExpandedRow?: (row: RecipientRow, initialGrouping?: string, isPinned?: boolean) => React.ReactNode
  moduleId?: string // For export filename
  selectedColumns?: string[]  // Selected extra columns (UX-005)
  onColumnsChange?: (columns: string[]) => void  // Callback for column selection changes
  searchQuery?: string  // Current search query (for Match column display)
  onExport?: (format: 'csv' | 'xls', rowCount: number) => void  // Analytics callback (UX-032)
  hasActiveFilters?: boolean  // True when multiselect filters are active (UX-006)
  totals?: TotalsData | null  // Aggregated totals for all search results (not just current page)
  initialExpandedPrimary?: string | null  // UX-041: Auto-expand this row on load (from URL)
  initialExpandGrouping?: string | null  // UX-041: Auto-select grouping in expanded row (from URL)
  onExpandedChange?: (primaryValue: string | null, grouping?: string | null) => void  // UX-041: Notify parent of expand/collapse + grouping
}

/**
 * Generate CSV content from data rows
 * Formats data with semicolon separator for Dutch Excel compatibility
 */
function generateCSV(
  data: RecipientRow[],
  availableYears: number[],
  primaryColumnName: string,
  selectedColumns: string[] = [],
  moduleId: string = ''
): string {
  // Get column labels for selected extra columns (O(1) via Map)
  const moduleColumns = MODULE_COLUMNS[moduleId] || []
  const columnMap = new Map(moduleColumns.map(c => [c.value, c.label]))
  const extraColumnLabels = selectedColumns.map(colKey => columnMap.get(colKey) || colKey)

  // Header row: Primary, Extra Columns, Years, Totaal
  const headers = [primaryColumnName, ...extraColumnLabels, ...availableYears.map(String), 'Totaal']
  const headerRow = headers.map(h => `"${h}"`).join(';')

  // Sanitize CSV cell value to prevent formula injection (=, +, -, @, tab, CR)
  const sanitizeCell = (value: string): string => {
    const escaped = value.replace(/"/g, '""')
    // Prefix formula-trigger characters with a single quote to prevent execution
    if (/^[=+\-@\t\r]/.test(escaped)) {
      return `"'${escaped}"`
    }
    return `"${escaped}"`
  }

  // Data rows (O(1) year lookup via Map)
  const dataRows = data.slice(0, MAX_EXPORT_ROWS).map(row => {
    const extraValues = selectedColumns.map(colKey => {
      const value = row.extraColumns?.[colKey] || ''
      return sanitizeCell(value)
    })

    const yearMap = createYearMap(row.years)
    const yearAmounts = availableYears.map(year => (yearMap.get(year) ?? 0).toFixed(2))
    return [sanitizeCell(row.primary_value), ...extraValues, ...yearAmounts, row.total.toFixed(2)].join(';')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file with UTF-8 BOM for Excel compatibility
 */
function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Sanitize XLS cell value to prevent formula injection (=, +, -, @, tab, CR)
 * Prefix formula-trigger characters with a single quote to prevent execution
 */
function sanitizeXlsCell(value: string): string {
  if (typeof value !== 'string') return value
  // Prefix formula-trigger characters with a single quote to prevent execution
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`
  }
  return value
}

/**
 * Generate and download XLS file
 * Uses same data structure as CSV export
 */
function downloadXLS(
  data: RecipientRow[],
  availableYears: number[],
  primaryColumnName: string,
  filename: string,
  selectedColumns: string[] = [],
  moduleId: string = ''
) {
  // Get column labels for selected extra columns (O(1) via Map)
  const moduleColumns = MODULE_COLUMNS[moduleId] || []
  const columnMap = new Map(moduleColumns.map(c => [c.value, c.label]))
  const extraColumnLabels = selectedColumns.map(colKey => columnMap.get(colKey) || colKey)

  // Build worksheet data: Primary, Extra Columns, Years, Totaal
  const headers = [primaryColumnName, ...extraColumnLabels, ...availableYears.map(String), 'Totaal']

  const rows = data.slice(0, MAX_EXPORT_ROWS).map(row => {
    const extraValues = selectedColumns.map(colKey => sanitizeXlsCell(row.extraColumns?.[colKey] || ''))

    const yearMap = createYearMap(row.years)
    const yearAmounts = availableYears.map(year => yearMap.get(year) ?? 0)
    return [sanitizeXlsCell(row.primary_value), ...extraValues, ...yearAmounts, row.total]
  })

  // Create worksheet
  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // Primary column
    ...extraColumnLabels.map(() => ({ wch: 20 })), // Extra columns
    ...availableYears.map(() => ({ wch: 12 })), // Year columns
    { wch: 14 }, // Totaal
  ]

  // Create workbook and export
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rijksuitgaven')
  XLSX.writeFile(wb, filename)
}

/**
 * Create a Map from year amounts for O(1) lookup performance
 * Avoids repeated .find() calls in cell rendering
 */
function createYearMap(years: YearAmount[]): Map<number, number> {
  return new Map(years.map(y => [y.year, y.amount]))
}

/**
 * Check if a year falls within a row's data availability range.
 * Returns true if data exists for this year (amount may be 0).
 * Returns false if no data exists (should show em-dash).
 */
function isYearAvailable(year: number, row: RecipientRow): boolean {
  const from = row.dataAvailableFrom
  const to = row.dataAvailableTo
  // If no availability info, assume all years are available (backwards compat)
  if (from == null || to == null) return true
  return year >= from && year <= to
}

// No-data cell (em-dash with tooltip)
function NoDataCell() {
  return (
    <div
      className="text-right text-[var(--muted-foreground)]"
      title="Geen data beschikbaar voor deze periode"
    >
      —
    </div>
  )
}

// Amount cell with trend anomaly indicator
function AmountCell({
  amount,
  previousAmount,
  isFirstYear,
}: {
  amount: number
  previousAmount?: number
  isFirstYear: boolean
}) {
  const formatted = formatAmount(amount)
  const fontClass = getAmountFontClass(formatted)
  const percentChange = isFirstYear ? null : calculateYoYChange(amount, previousAmount)
  const hasAnomaly = isAnomaly(percentChange)

  const trend = percentChange !== null ? (percentChange >= 0 ? 'positive' : 'negative') : undefined

  return (
    <div
      className={cn(
        'text-right tabular-nums',
        fontClass,
        hasAnomaly && 'bg-[var(--trend-anomaly-bg)] rounded-sm -mx-2 px-2'
      )}
      data-tooltip-center={percentChange !== null ? `${formatPercentage(percentChange)} vs vorig jaar` : undefined}
      data-trend={trend}
    >
      {formatted}
    </div>
  )
}

// Collapsed years cell (2016-2020 combined)
function CollapsedYearsCell({
  years,
  collapsedYearRange,
  row,
  onExpand,
}: {
  years: YearAmount[]
  collapsedYearRange: number[]
  row: RecipientRow
  onExpand: () => void
}) {
  // Filter to only available years
  const availableCollapsedYears = collapsedYearRange.filter((y) => isYearAvailable(y, row))

  // All collapsed years are outside availability range
  if (availableCollapsedYears.length === 0) {
    return (
      <button
        onClick={onExpand}
        className="flex items-center justify-end gap-1 w-full text-right text-[var(--muted-foreground)] hover:text-[var(--navy-medium)] transition-colors"
        title="Geen data beschikbaar voor deze periode"
        aria-label="Geen data - klik om jaren uit te klappen"
      >
        —
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </button>
    )
  }

  // Sum only available years
  const total = years
    .filter((y) => availableCollapsedYears.includes(y.year))
    .reduce((sum, y) => sum + y.amount, 0)

  const formatted = formatAmount(total)
  const fontClass = getAmountFontClass(formatted)

  return (
    <button
      onClick={onExpand}
      className={cn(
        'flex items-center justify-end gap-1 w-full text-right tabular-nums hover:text-[var(--navy-medium)] transition-colors',
        fontClass
      )}
      aria-label={`${formatted} - klik om jaren uit te klappen`}
    >
      {formatted}
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
    </button>
  )
}

/**
 * Main data table component with year columns, expandable rows, and CSV export
 * Supports sticky columns, sorting, pagination, and collapsible year ranges
 * Field labels imported from @/lib/constants
 */

export function DataTable({
  data,
  availableYears,
  primaryColumnName,
  isLoading = false,
  totalRows = 0,
  page = 1,
  perPage = 50,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onRowExpand,
  onFilterLinkClick,
  renderExpandedRow,
  moduleId = 'export',
  selectedColumns = [],
  onColumnsChange,
  searchQuery,
  hasActiveFilters = false,
  onExport,
  totals,
  initialExpandedPrimary,
  initialExpandGrouping,
  onExpandedChange,
}: DataTableProps) {
  const { track } = useAnalytics()
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const expandGroupingRef = useRef<Record<string, string>>({})
  const [yearsExpanded, setYearsExpanded] = useState(false)
  const [rowPinning, setRowPinning] = useState<RowPinningState>({ top: [], bottom: [] })

  // Number of currently pinned rows
  const pinnedCount = rowPinning.top?.length ?? 0

  // Cache pinned row data so they survive search/filter changes (server-side pagination)
  const pinnedRowsCache = useRef<Map<string, RecipientRow>>(new Map())

  // Update cache: add newly pinned rows, remove unpinned ones
  useEffect(() => {
    const pinnedIds = new Set(rowPinning.top ?? [])
    for (const row of data) {
      if (pinnedIds.has(row.primary_value)) {
        pinnedRowsCache.current.set(row.primary_value, row)
      }
    }
    for (const key of pinnedRowsCache.current.keys()) {
      if (!pinnedIds.has(key)) {
        pinnedRowsCache.current.delete(key)
      }
    }
  }, [rowPinning.top, data])

  // Merge cached pinned rows into data so TanStack always has them in its row model
  const tableData = useMemo(() => {
    const dataIds = new Set(data.map(r => r.primary_value))
    const missingPinned = (rowPinning.top ?? [])
      .map(id => pinnedRowsCache.current.get(id))
      .filter((r): r is RecipientRow => r != null && !dataIds.has(r.primary_value))
    return missingPinned.length > 0 ? [...missingPinned, ...data] : data
  }, [data, rowPinning.top])

  // Reset expanded state when data changes — but preserve expanded state for pinned rows
  useEffect(() => {
    setExpanded(prev => {
      const pinnedIds = new Set(rowPinning.top ?? [])
      const preserved: Record<string, boolean> = {}
      for (const [key, val] of Object.entries(prev as Record<string, boolean>)) {
        if (val && pinnedIds.has(key)) {
          preserved[key] = true
        }
      }
      return preserved
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Clear pins on module change — pins are a view-level tool, not persisted
  // Cross-module comparison is a separate feature (V2.5 Vergelijkpagina)
  useEffect(() => {
    pinnedRowsCache.current = new Map()
    setRowPinning({ top: [], bottom: [] })
  }, [moduleId])

  // UX-041: Auto-expand row from URL on first data load only
  const hasAutoExpanded = useRef(false)
  useEffect(() => {
    if (initialExpandedPrimary && data.length > 0 && !hasAutoExpanded.current) {
      const found = data.find(r => r.primary_value === initialExpandedPrimary)
      if (found) {
        setExpanded({ [found.primary_value]: true })
        // Set initial grouping if provided via URL
        if (initialExpandGrouping) {
          expandGroupingRef.current[initialExpandedPrimary] = initialExpandGrouping
        }
        hasAutoExpanded.current = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingXLS, setIsExportingXLS] = useState(false)
  const [isStaffelOpen, setIsStaffelOpen] = useState(false)
  const staffelRef = useRef<HTMLDivElement>(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [showInfoPulse, setShowInfoPulse] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  // Scroll state for horizontal scroll indicator
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Show pulse animation on first visit (UX-019)
  useEffect(() => {
    const hasSeen = localStorage.getItem('rijksuitgaven-info-seen')
    if (!hasSeen) {
      setShowInfoPulse(true)
    }
  }, [])

  // Close staffel popover when clicking outside
  useEffect(() => {
    if (!isStaffelOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (staffelRef.current && !staffelRef.current.contains(e.target as Node)) {
        setIsStaffelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isStaffelOpen])

  // Close info popover when clicking outside or pressing Escape (UX-019)
  useEffect(() => {
    if (!isInfoOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setIsInfoOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsInfoOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isInfoOpen])

  // Track horizontal scroll state for scroll indicator
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const check = () => {
      setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 2)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])

  // Set of row IDs in current data — used to filter phantom rows from keepPinnedRows
  const dataIdSet = useMemo(() => new Set(data.map(r => r.primary_value)), [data])

  // Get pinned row data for export selection (UX-039)
  const getPinnedData = useCallback((): RecipientRow[] => {
    return (rowPinning.top ?? [])
      .map(id => pinnedRowsCache.current.get(id))
      .filter((r): r is RecipientRow => r != null)
  }, [rowPinning])

  // CSV Export handler (UX-039: selectionOnly for pinned rows)
  const handleExportCSV = (selectionOnly = false) => {
    const exportData = selectionOnly ? getPinnedData() : data
    if (exportData.length === 0) return
    setIsExportingCSV(true)

    try {
      const csvContent = generateCSV(exportData, availableYears, primaryColumnName, selectedColumns, moduleId)
      const timestamp = new Date().toISOString().split('T')[0]
      const suffix = selectionOnly ? '-selectie' : ''
      const filename = `rijksuitgaven-${moduleId}${suffix}-${timestamp}.csv`
      downloadCSV(csvContent, filename)
      const exportCount = Math.min(exportData.length, MAX_EXPORT_ROWS)
      onExport?.('csv', exportCount)
    } finally {
      setIsExportingCSV(false)
    }
  }

  // XLS Export handler (UX-039: selectionOnly for pinned rows)
  const handleExportXLS = (selectionOnly = false) => {
    const exportData = selectionOnly ? getPinnedData() : data
    if (exportData.length === 0) return
    setIsExportingXLS(true)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const suffix = selectionOnly ? '-selectie' : ''
      const filename = `rijksuitgaven-${moduleId}${suffix}-${timestamp}.xlsx`
      downloadXLS(exportData, availableYears, primaryColumnName, filename, selectedColumns, moduleId)
      const exportCount = Math.min(exportData.length, MAX_EXPORT_ROWS)
      onExport?.('xls', exportCount)
    } finally {
      setIsExportingXLS(false)
    }
  }

  // Determine which years to show based on expansion state (memoized for stable refs)
  const collapsedYears = useMemo(
    () => availableYears.filter((y) => y >= COLLAPSED_YEARS_START && y <= COLLAPSED_YEARS_END),
    [availableYears]
  )
  const visibleYears = useMemo(
    () => yearsExpanded ? availableYears : availableYears.filter((y) => y > COLLAPSED_YEARS_END),
    [availableYears, yearsExpanded]
  )

  // Build columns dynamically based on available years
  const columns = useMemo<ColumnDef<RecipientRow>[]>(() => {
    const cols: ColumnDef<RecipientRow>[] = [
      // Expand/Pin button column (UX-039)
      {
        id: 'expand',
        header: () => null,
        cell: ({ row }) => {
          const isPinned = row.getIsPinned()

          // Pinned rows show unpin icon + expand chevron
          if (isPinned) {
            return (
              <div className="flex items-center w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRowPinning(prev => ({
                      ...prev,
                      top: (prev.top ?? []).filter(id => id !== row.id),
                    }))
                  }}
                  className="p-1 shrink-0 hover:bg-[var(--pink)]/10 rounded transition-colors"
                  aria-label="Verwijder uit vergelijking"
                >
                  <PinOff className="h-4 w-4 text-[var(--pink)]" aria-hidden="true" />
                </button>
                <button
                  onClick={() => {
                    delete expandGroupingRef.current[row.original.primary_value]
                    row.toggleExpanded()
                    if (!row.getIsExpanded() && onRowExpand) {
                      onRowExpand(row.original.primary_value)
                    }
                  }}
                  className="p-1 cursor-pointer hover:bg-blue-100/80 rounded transition-colors"
                  aria-expanded={row.getIsExpanded()}
                  aria-label={row.getIsExpanded() ? 'Rij inklappen' : 'Rij uitklappen'}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDown className="h-4 w-4 text-[var(--pink)]" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--pink)]" aria-hidden="true" />
                  )}
                </button>
              </div>
            )
          }

          return (
            <div className="flex items-center">
              {/* Pin button — visible on hover via group-hover */}
              <Tooltip.Provider delayDuration={0}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => {
                        if (pinnedCount < MAX_PINNED_ROWS) {
                          row.pin('top')
                          if (row.getIsExpanded()) row.toggleExpanded()
                        }
                      }}
                      className={cn(
                        'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity -mr-1',
                        pinnedCount >= MAX_PINNED_ROWS
                          ? 'cursor-not-allowed text-[var(--muted-foreground)]'
                          : 'hover:bg-[var(--pink)]/10 text-[var(--navy-medium)] hover:text-[var(--pink)]'
                      )}
                      disabled={pinnedCount >= MAX_PINNED_ROWS}
                    >
                      <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="px-[10px] py-[6px] bg-[var(--navy-dark,#1e3a5f)] text-white text-[13px] font-normal leading-[1.4] rounded whitespace-nowrap z-[9999]" sideOffset={6}>
                      {pinnedCount >= MAX_PINNED_ROWS ? `Maximaal ${MAX_PINNED_ROWS}` : 'Vergelijk'}
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
              {/* Expand button */}
              <button
                onClick={() => {
                  delete expandGroupingRef.current[row.original.primary_value]
                  row.toggleExpanded()
                  if (!row.getIsExpanded() && onRowExpand) {
                    onRowExpand(row.original.primary_value)
                  }
                }}
                className="p-1 cursor-pointer hover:bg-[var(--gray-light)] rounded transition-colors group/expand"
                aria-expanded={row.getIsExpanded()}
                aria-label={row.getIsExpanded() ? 'Rij inklappen' : 'Rij uitklappen'}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4 text-[var(--navy-medium)] group-hover/expand:text-[var(--pink)]" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--navy-medium)] group-hover/expand:text-[var(--pink)]" aria-hidden="true" />
                )}
              </button>
            </div>
          )
        },
        size: 32,
      },
      // Primary column (Ontvanger) - sticky on mobile
      {
        id: 'primary',
        accessorKey: 'primary_value',
        header: ({ column }) => (
          <SortableHeader column={column} onSortChange={onSortChange}>
            {primaryColumnName}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const isSearching = Boolean(searchQuery && searchQuery.trim().length > 0)

          return (
            <div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    delete expandGroupingRef.current[row.original.primary_value]
                    row.toggleExpanded()
                    if (!row.getIsExpanded() && onRowExpand) {
                      onRowExpand(row.original.primary_value)
                    }
                  }}
                  className="font-medium text-[var(--navy-dark)] hover:text-[var(--pink)] text-left transition-colors"
                >
                  {row.original.primary_value}
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(row.original.primary_value)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-tooltip-center="Zoek op Google"
                  onClick={(e) => {
                    e.stopPropagation()
                    track('external_link', moduleId, { recipient: row.original.primary_value, origin: 'data_table' })
                  }}
                  className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[var(--navy-medium)] hover:text-[var(--pink)] transition-all"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </a>
              </div>
              {/* Module indicator - different behavior for Integraal vs other modules */}
              {!isSearching && moduleId === 'integraal' ? (
                // Integraal: Always show "In: [modules]" - this IS the overview page
                row.original.sources && row.original.sources.length > 0 && (
                  <div className="text-xs text-[var(--navy-medium)] mt-0.5">
                    In: {row.original.sources.join(', ')}
                  </div>
                )
              ) : !isSearching && (
                // Other modules: Show "Ook in:" only when recipient appears in multiple modules
                row.original.sources && row.original.sources.length > 1 && (
                  <div className="text-xs text-[var(--navy-medium)] mt-0.5">
                    Ook in: {row.original.sources.filter(s => s !== 'current').join(', ')}
                  </div>
                )
              )}
            </div>
          )
        },
        minSize: 160,
        meta: { sticky: true }, // Mark as sticky column
      },
    ]

    // Dynamic columns (UX-005)
    // Extra columns shown when not searching (matched field shown under name when searching)
    const moduleColumns = MODULE_COLUMNS[moduleId] || []
    const isSearching = Boolean(searchQuery && searchQuery.trim().length > 0)

    if (isSearching) {
      // "Ook in" column when searching - shows which secondary field also matched
      cols.push({
        id: 'matched',
        header: () => (
          <span className="text-sm font-semibold text-white">Komt ook voor in</span>
        ),
        cell: ({ row }) => {
          const matchedField = row.original.matchedField
          const matchedValue = row.original.matchedValue
          const matchedFieldLabel = matchedField ? (FIELD_LABELS[matchedField] || matchedField) : null

          if (!matchedValue && !matchedFieldLabel) {
            return null // Empty cell — no secondary match
          }

          return (
            <div className="max-w-[200px]" data-tooltip={matchedValue || undefined}>
              {/* Line 1: The matched value */}
              <div className="text-sm text-[var(--navy-dark)] truncate">
                {matchedValue}
              </div>
              {/* Line 2: The field name (small) */}
              {matchedFieldLabel && (
                <div className="text-xs text-[var(--navy-medium)]">
                  {matchedFieldLabel}
                </div>
              )}
            </div>
          )
        },
        size: 200,
      })
    } else {
      // Static extra columns when not searching
      selectedColumns.forEach((colKey) => {
        const config = moduleColumns.find(c => c.value === colKey)
        if (config) {
          cols.push({
            id: `extra-${colKey}`,
            header: ({ column }) => (
              <SortableHeader column={column} onSortChange={onSortChange}>
                {config.label}
              </SortableHeader>
            ),
            cell: ({ row }) => {
              const value = row.original.extraColumns?.[colKey]
              const count = row.original.extraColumnCounts?.[colKey] ?? 1
              const hasMore = count > 1

              if (!value) {
                return <span className="text-[var(--muted-foreground)]">-</span>
              }

              // Betalingen is a count — render as plain text, not a filter link
              if (colKey === 'betalingen') {
                return <span className="text-sm text-[var(--navy-dark)] tabular-nums">{value}</span>
              }

              return (
                <div className="max-w-[140px]" data-tooltip={value}>
                  {/* Clickable value - filters to show all recipients with this value */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFilterLinkClick?.(colKey, value)
                    }}
                    className="text-sm text-[var(--navy-dark)] line-clamp-2 text-left hover:text-[var(--pink)] hover:underline transition-colors cursor-pointer"
                  >
                    {value}
                  </button>
                  {/* "+X meer" indicator when multiple distinct values exist */}
                  {hasMore && (
                    <button
                      onClick={() => {
                        expandGroupingRef.current[row.original.primary_value] = colKey
                        row.toggleExpanded()
                        if (!row.getIsExpanded() && onRowExpand) {
                          onRowExpand(row.original.primary_value)
                        }
                      }}
                      className="text-xs text-[var(--navy-medium)] mt-0.5 cursor-pointer"
                      style={{ fontSize: '12px' }}
                    >
                      +{count - 1} {count - 1 === 1 ? 'resultaat' : 'resultaten'}
                    </button>
                  )}
                </div>
              )
            },
            size: 140,
          })
        }
      })
    }

    // Collapsed years column (2016-2020) OR collapse header when expanded
    if (!yearsExpanded && collapsedYears.length > 0) {
      // Show collapsed state: "2016-20 >" that expands on click
      cols.push({
        id: 'collapsed-years',
        header: () => (
          <button
            onClick={() => setYearsExpanded(true)}
            className="flex items-center gap-1 text-sm font-semibold text-white hover:text-white/80 transition-colors ml-auto"
            aria-label={`Jaren ${COLLAPSED_YEARS_START} tot ${COLLAPSED_YEARS_END} uitklappen`}
          >
            {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </button>
        ),
        cell: ({ row }) => (
          <CollapsedYearsCell
            years={row.original.years}
            collapsedYearRange={collapsedYears}
            row={row.original}
            onExpand={() => setYearsExpanded(true)}
          />
        ),
        size: 95,
      })
    }

    // Individual year columns
    visibleYears.forEach((year, yearArrayIndex) => {
      const yearIndex = availableYears.indexOf(year)
      const previousYear = yearIndex > 0 ? availableYears[yearIndex - 1] : null
      const isFirstCollapsible = yearsExpanded && yearArrayIndex === 0 && collapsedYears.length > 0

      cols.push({
        id: `year-${year}`,
        accessorFn: (row) => row.years.find((y) => y.year === year)?.amount ?? 0,
        header: ({ column }) => isFirstCollapsible ? (
          <div className="flex items-center gap-0.5 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); setYearsExpanded(false) }}
              className="text-white/70 hover:text-white transition-colors"
              aria-label={`Jaren ${COLLAPSED_YEARS_START} tot ${COLLAPSED_YEARS_END} inklappen`}
            >
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
            </button>
            <SortableHeader column={column} onSortChange={onSortChange}>
              {year}
            </SortableHeader>
          </div>
        ) : (
          <SortableHeader column={column} onSortChange={onSortChange}>
            {year}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          // Check if year is within this row's data availability range
          if (!isYearAvailable(year, row.original)) {
            return <NoDataCell />
          }

          const amount = row.original.years.find((y) => y.year === year)?.amount ?? 0
          const prevAmount = previousYear
            ? row.original.years.find((y) => y.year === previousYear)?.amount
            : undefined

          return (
            <AmountCell
              amount={amount}
              previousAmount={prevAmount}
              isFirstYear={yearIndex === 0}
            />
          )
        },
        size: 95,
      })
    })

    // Totaal column
    cols.push({
      id: 'total',
      accessorKey: 'total',
      header: ({ column }) => (
        <SortableHeader column={column} onSortChange={onSortChange}>
          Totaal
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const formatted = formatAmount(row.original.total)
        const fontClass = getAmountFontClass(formatted)
        return (
          <div className={cn('text-right tabular-nums font-semibold', fontClass)}>
            {formatted}
          </div>
        )
      },
      size: 110,
    })

    return cols
  }, [availableYears, yearsExpanded, collapsedYears, visibleYears, primaryColumnName, onSortChange, onRowExpand, onFilterLinkClick, selectedColumns, moduleId, searchQuery, pinnedCount]) // pinnedCount: cell renderers use it for max-pin checks

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      expanded,
      rowPinning,
    },
    onSortingChange: setSorting,
    onExpandedChange: (updater) => {
      setExpanded(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        // UX-041: Notify parent of expanded row + grouping for URL state
        // Find the NEWLY expanded row (in next but not prev), not just first key
        if (onExpandedChange) {
          const prevKeys = new Set(Object.entries(prev as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k))
          const nextKeys = Object.entries(next as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k)
          const newlyExpanded = nextKeys.find(k => !prevKeys.has(k))
          if (newlyExpanded) {
            onExpandedChange(newlyExpanded, expandGroupingRef.current[newlyExpanded] || null)
          } else if (nextKeys.length > 0) {
            // No new key — might be a grouping change on existing expanded row
            onExpandedChange(nextKeys[nextKeys.length - 1], expandGroupingRef.current[nextKeys[nextKeys.length - 1]] || null)
          } else {
            onExpandedChange(null)
          }
        }
        return next
      })
    },
    onRowPinningChange: setRowPinning,
    enableRowPinning: true,
    keepPinnedRows: true,
    sortDescFirst: true, // Financial data: show highest values first on initial click
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true, // Server-side pagination
    pageCount: Math.ceil(totalRows / perPage),
    getRowId: (row) => row.primary_value,
  })

  const totalPages = Math.ceil(totalRows / perPage)

  return (
    <div className="w-full">
      {/* Toolbar above table */}
      <div className="flex items-center justify-between mb-3">
        {/* Left: Results per page dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            className="px-2 py-1.5 text-sm font-medium border border-[var(--border)] rounded bg-white"
            aria-label="Aantal resultaten weergeven"
          >
            {[50, 100, 150, 250, 500].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-[var(--navy-dark)]">resultaten weergeven</span>
        </div>

        {/* Right: Wis selectie + Info + Kolommen + CSV Export */}
        <div className="flex items-center gap-2">
          {/* Wis selectie (UX-039) — only shown when rows are pinned */}
          {pinnedCount > 0 && (
            <button
              onClick={() => setRowPinning({ top: [], bottom: [] })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--pink)] border border-[var(--pink)]/30 rounded hover:bg-[var(--pink)]/5 transition-colors"
            >
              Wis selectie ({pinnedCount})
            </button>
          )}
          {/* Info popover (UX-019) */}
          <div className="relative" ref={infoRef}>
            <button
              type="button"
              onClick={() => {
                setIsInfoOpen(!isInfoOpen)
                setShowInfoPulse(false)
                localStorage.setItem('rijksuitgaven-info-seen', 'true')
              }}
              className={cn(
                'flex items-center justify-center px-2 py-1.5 border rounded transition-all',
                isInfoOpen
                  ? 'bg-[var(--navy-dark)] text-white border-[var(--navy-dark)]'
                  : 'border-[var(--border)] hover:bg-[var(--gray-light)] text-[var(--navy-dark)]',
                showInfoPulse && 'animate-pulse-ring'
              )}
              aria-label="Korte uitleg"
              aria-expanded={isInfoOpen}
            >
              <Info className="h-4 w-4" />
            </button>

            {isInfoOpen && (
              <div className="absolute top-full right-0 mt-2 w-[340px] bg-[var(--navy-dark)] text-white rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="h-1 bg-[var(--pink)]" />
                <div className="px-4 pt-4 pb-4 space-y-3">
                  <div className="flex gap-3">
                    <Search className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Zoek op meerdere woorden, gebruik <strong>&ldquo;aanhalingstekens&rdquo;</strong> voor een exacte woordgroep, of een <strong>sterretje*</strong> voor alles dat begint met&hellip; De kolom &ldquo;Komt ook voor in&rdquo; toont waar de zoekterm ook voorkomt.</p>
                  </div>
                  <div className="flex gap-3">
                    <ChevronRight className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Klik op een ontvanger om details te zien. Groepeer op regeling, artikel of categorie.</p>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Gemarkeerd = 50%+ mutatie t.o.v. vorig jaar. Hover voor het percentage.</p>
                  </div>
                  <div className="flex gap-3">
                    <SlidersHorizontal className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Filter via de knop, of klik op een waarde in de tabel om direct te filteren.</p>
                  </div>
                  <div className="flex gap-3">
                    <Columns3 className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Kies extra kolommen via &ldquo;Kolommen&rdquo;. Bij actieve filters passen ze automatisch aan.</p>
                  </div>
                  <div className="flex gap-3">
                    <Download className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Exporteer als CSV of Excel. Maximaal 500 rijen met zichtbare kolommen.</p>
                  </div>
                  <div className="flex gap-3">
                    <Pin className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Pin tot 5 rijen vast om te vergelijken.</p>
                  </div>
                  <div className="flex gap-3">
                    <svg className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    <p className="text-sm text-white/80">Bookmark de URL om uw weergave op te slaan.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column selector (UX-005) - hidden when filters control columns (UX-006) */}
          {onColumnsChange && !hasActiveFilters && (
            <ColumnSelector
              moduleId={moduleId}
              selectedColumns={selectedColumns}
              onColumnsChange={onColumnsChange}
            />
          )}

          {/* CSV Export button (UX-039: selection export when rows pinned) */}
          {pinnedCount > 0 ? (
            <ExportDropdown
              label="CSV"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
              isExporting={isExportingCSV}
              disabled={isLoading || data.length === 0}
              pinnedCount={pinnedCount}
              totalCount={data.length}
              onExportAll={() => handleExportCSV(false)}
              onExportSelection={() => handleExportCSV(true)}
            />
          ) : (
            <button
              onClick={() => handleExportCSV(false)}
              disabled={isLoading || isExportingCSV || data.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Download als CSV"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExportingCSV ? 'Bezig...' : 'CSV'}
            </button>
          )}

          {/* XLS Export button (UX-039: selection export when rows pinned) */}
          {pinnedCount > 0 ? (
            <ExportDropdown
              label="XLS"
              icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
              isExporting={isExportingXLS}
              disabled={isLoading || data.length === 0}
              pinnedCount={pinnedCount}
              totalCount={data.length}
              onExportAll={() => handleExportXLS(false)}
              onExportSelection={() => handleExportXLS(true)}
            />
          ) : (
            <button
              onClick={() => handleExportXLS(false)}
              disabled={isLoading || isExportingXLS || data.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Download als Excel"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              {isExportingXLS ? 'Bezig...' : 'XLS'}
            </button>
          )}
        </div>
      </div>

      {/* Table container with horizontal scroll for expanded years */}
      <div className="relative">
        <div ref={scrollContainerRef} className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-[var(--navy-dark)]">
                {headerGroup.headers.map((header, headerIndex) => {
                  const isSticky = (header.column.columnDef.meta as ColumnMeta | undefined)?.sticky || headerIndex === 0 || headerIndex === 1
                  const isTotaal = header.column.id === 'total'
                  const isFirst = headerIndex === 0
                  const isLast = headerIndex === headerGroup.headers.length - 1
                  // Year columns and Totaal are right-aligned, first two columns left-aligned
                  const isYearOrTotal = header.column.id.startsWith('year-') || header.column.id === 'collapsed-years' || header.column.id === 'total'
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2.5 text-sm font-semibold text-white',
                        isFirst && 'px-1', // Tighter padding on expand column
                        isYearOrTotal ? 'text-right' : 'text-left',
                        isSticky && 'sticky left-0 bg-[var(--navy-dark)] z-10',
                        headerIndex === 1 && `sticky bg-[var(--navy-dark)] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]`,
                        isTotaal && 'sticky right-0 bg-[var(--navy-medium)] z-10 border-l border-white/20',
                        isFirst && 'rounded-l-lg',
                        isLast && !isTotaal && 'rounded-r-lg'
                      )}
                      style={{
                        width: header.getSize(),
                        left: headerIndex === 1 ? `${STICKY_PRIMARY_OFFSET_PX}px` : undefined
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white border border-[var(--border)] border-t-0">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={`skeleton-${i}-${j}`} className="px-3 py-3 border-b border-[var(--border)]">
                      <div className="h-4 bg-[var(--gray-light)] rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="text-[var(--muted-foreground)]">
                    <p className="text-lg font-medium">Geen resultaten gevonden</p>
                    <p className="text-sm mt-1">Suggesties:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>Controleer de spelling</li>
                      <li>Probeer minder filters</li>
                      <li>Zoek op een deel van de naam</li>
                    </ul>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* Pinned rows (UX-039) — always visible at top */}
                {(table.getTopRows() ?? []).filter(row => (rowPinning.top ?? []).includes(row.id)).map((row) => (
                  <Fragment key={row.id}>
                    <tr className={cn(
                      'group bg-blue-50/60 border-l-2 border-l-[var(--pink)] hover:bg-blue-50/80 transition-colors',
                      row.getIsExpanded() && 'bg-blue-50/80'
                    )}>
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isSticky = (cell.column.columnDef.meta as ColumnMeta | undefined)?.sticky || cellIndex === 0 || cellIndex === 1
                        const isTotaal = cell.column.id === 'total'
                        const isYearOrTotal = cell.column.id.startsWith('year-') || cell.column.id === 'collapsed-years' || cell.column.id === 'total'
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              'px-3 py-2 border-b border-[var(--border)] transition-colors',
                              cellIndex === 0 && 'px-1', // Tighter padding on expand column
                              isYearOrTotal ? 'text-right' : 'text-left',
                              isSticky && 'sticky left-0 bg-blue-50/60 group-hover:bg-blue-50/80 z-10',
                              cellIndex === 1 && 'sticky bg-blue-50/60 group-hover:bg-blue-50/80 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]',
                              isTotaal && 'sticky right-0 bg-blue-100/60 font-semibold z-10 border-l border-[var(--border)]'
                            )}
                            style={{
                              width: cellIndex === 0 ? STICKY_PRIMARY_OFFSET_PINNED_PX : cell.column.getSize(),
                              left: cellIndex === 1 ? `${STICKY_PRIMARY_OFFSET_PINNED_PX}px` : undefined
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        )
                      })}
                    </tr>
                    {/* Expanded row content for pinned rows */}
                    {row.getIsExpanded() && renderExpandedRow && renderExpandedRow(row.original, expandGroupingRef.current[row.original.primary_value], true)}
                  </Fragment>
                ))}
                {/* Separator between pinned and unpinned rows */}
                {pinnedCount > 0 && (
                  <tr>
                    <td colSpan={columns.length} className="h-0 border-b-2 border-[var(--pink)]/30 p-0" />
                  </tr>
                )}
                {/* Regular (unpinned) rows — filter out phantom rows from keepPinnedRows when searching */}
                {table.getCenterRows().filter(row => dataIdSet.has(row.id)).map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        'group hover:bg-[var(--gray-light)] transition-colors',
                        row.getIsExpanded() && 'bg-[var(--gray-light)]'
                      )}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isSticky = (cell.column.columnDef.meta as ColumnMeta | undefined)?.sticky || cellIndex === 0 || cellIndex === 1
                        const isExpanded = row.getIsExpanded()
                        const isTotaal = cell.column.id === 'total'
                        const isYearOrTotal = cell.column.id.startsWith('year-') || cell.column.id === 'collapsed-years' || cell.column.id === 'total'
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              'px-3 py-2 border-b border-[var(--border)] transition-colors',
                              cellIndex === 0 && 'px-1', // Tighter padding on expand column
                              isYearOrTotal ? 'text-right' : 'text-left',
                              isSticky && 'sticky left-0 bg-white group-hover:bg-[var(--gray-light)] z-10',
                              cellIndex === 1 && 'sticky bg-white group-hover:bg-[var(--gray-light)] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]',
                              isExpanded && isSticky && 'bg-[var(--gray-light)]',
                              isTotaal && 'sticky right-0 bg-[var(--totaal-bg)] font-semibold z-10 border-l border-[var(--border)]'
                            )}
                            style={{
                              width: cell.column.getSize(),
                              left: cellIndex === 1 ? `${STICKY_PRIMARY_OFFSET_PX}px` : undefined
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        )
                      })}
                    </tr>
                    {/* Expanded row content - renders directly as <tr> elements */}
                    {row.getIsExpanded() && renderExpandedRow && renderExpandedRow(row.original, expandGroupingRef.current[row.original.primary_value])}
                  </Fragment>
                ))}
              </>
            )}
          </tbody>
          {/* Totals row - only shown when searching/filtering */}
          {totals && (
            <tfoot>
              <tr className="bg-[var(--navy-dark)] text-white font-semibold text-sm">
                {/* Expand column placeholder */}
                <td className="px-2 py-2 border-b border-[var(--border)]"></td>
                {/* Primary column - show "Totaal (X ontvangers)" */}
                <td className="px-3 py-2 border-b border-[var(--border)] sticky bg-[var(--navy-dark)] z-10" style={{ left: `${STICKY_PRIMARY_OFFSET_PX}px` }}>
                  <div className="flex flex-col">
                    <span>Totaal</span>
                    <span className="text-xs font-normal opacity-75">{totalRows.toLocaleString('nl-NL')} {primaryColumnName.toLowerCase()}{totalRows !== 1 ? 's' : ''}</span>
                  </div>
                </td>
                {/* Extra columns or Match column - empty for totals */}
                {(searchQuery && searchQuery.trim().length > 0) ? (
                  <td className="px-3 py-2 border-b border-[var(--border)]"></td>
                ) : (
                  selectedColumns.map((col) => (
                    <td key={`total-${col}`} className="px-3 py-2 border-b border-[var(--border)]"></td>
                  ))
                )}
                {/* Collapsed years (2016-2020) or placeholder for collapse header */}
                {!yearsExpanded && collapsedYears.length > 0 && (
                  <td className="px-3 py-2 text-right tabular-nums text-xs border-b border-[var(--border)]">
                    {collapsedYears.every((y) => data.length > 0 && data.every((row) => !isYearAvailable(y, row))) ? (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    ) : (
                      formatAmount(
                        collapsedYears.reduce((sum, y) => sum + (totals.years[y] || 0), 0)
                      )
                    )}
                  </td>
                )}
                {/* Individual year columns */}
                {(yearsExpanded ? availableYears : availableYears.filter(y => y > 2020)).map((year) => (
                  <td key={`total-${year}`} className="px-3 py-2 text-right tabular-nums text-xs border-b border-[var(--border)]">
                    {data.length > 0 && data.every((row) => !isYearAvailable(year, row)) ? (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    ) : (
                      formatAmount(totals.years[year] || 0)
                    )}
                  </td>
                ))}
                {/* Grand total */}
                <td className="px-3 py-2 text-right tabular-nums text-xs border-b border-[var(--border)] bg-[var(--navy-medium)] sticky right-0 z-10 border-l border-l-white/20">
                  {formatAmount(totals.totaal)}
                </td>
              </tr>
            </tfoot>
          )}
          </table>
        </div>

        {/* Scroll indicator — dark shadow edge before sticky Totaal */}
        <div
          className={cn(
            'absolute top-0 bottom-0 pointer-events-none transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            right: 110, // Totaal column width
            width: 40,
            background: 'linear-gradient(to left, rgba(14, 50, 97, 0.22), transparent)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
        {/* Left: Amount note - module-specific */}
        <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-1.5">
          {moduleId === 'inkoop' ? (
            <span className="relative" ref={staffelRef}>
              Gemiddelde <button type="button" onClick={() => setIsStaffelOpen(!isStaffelOpen)} className="underline decoration-dotted underline-offset-2 hover:text-[var(--navy-dark)] transition-colors cursor-pointer">staffelbedragen</button> in €, incl. BTW
              {isStaffelOpen && <StaffelPopover position="above" />}
            </span>
          ) : moduleId === 'publiek' ? (
            <span className="relative" ref={staffelRef}>
              RVO, ZonMW en NWO: absolute bedragen. COA: gemiddeld <button type="button" onClick={() => setIsStaffelOpen(!isStaffelOpen)} className="underline decoration-dotted underline-offset-2 hover:text-[var(--navy-dark)] transition-colors cursor-pointer">staffelbedrag</button> incl. BTW
              {isStaffelOpen && <StaffelPopover position="above" />}
            </span>
          ) : (
            'Absolute bedragen in €'
          )}
        </div>

        {/* Right: Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &#9664; Vorige
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Pagina {page} van {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Volgende &#9654;
          </button>
        </div>
      </div>
    </div>
  )
}

// Export dropdown with "all" and "selection" options (UX-039)
function ExportDropdown({
  label,
  icon,
  isExporting,
  disabled,
  pinnedCount,
  totalCount,
  onExportAll,
  onExportSelection,
}: {
  label: string
  icon: React.ReactNode
  isExporting: boolean
  disabled: boolean
  pinnedCount: number
  totalCount: number
  onExportAll: () => void
  onExportSelection: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={`Download als ${label}`}
        aria-expanded={isOpen}
      >
        {icon}
        {isExporting ? 'Bezig...' : label}
        <ChevronDown className="h-3 w-3 ml-0.5" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[200px] py-1">
          <button
            onClick={() => { onExportAll(); setIsOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--gray-light)] transition-colors"
          >
            Exporteer alles ({Math.min(totalCount, MAX_EXPORT_ROWS)})
          </button>
          <button
            onClick={() => { onExportSelection(); setIsOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--gray-light)] transition-colors text-[var(--pink)]"
          >
            Exporteer selectie ({pinnedCount})
          </button>
        </div>
      )}
    </div>
  )
}

// Sortable header component
function SortableHeader({
  column,
  children,
  onSortChange,
}: {
  column: Column<RecipientRow, unknown>
  children: React.ReactNode
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
}) {
  const isSorted = column.getIsSorted()

  const handleSort = () => {
    // UX-040: First click → desc (high to low), second → asc (low to high)
    const newDirection = isSorted === 'desc' ? 'asc' : 'desc'
    column.toggleSorting(newDirection === 'desc')
    onSortChange?.(column.id, newDirection)
  }

  const sortLabel = isSorted === 'asc'
    ? 'Gesorteerd oplopend, klik voor aflopend'
    : isSorted === 'desc'
    ? 'Gesorteerd aflopend, klik voor oplopend'
    : 'Klik om te sorteren'

  // Check if this is a year or total column (should be right-aligned)
  const isYearOrTotal = column.id.startsWith('year-') || column.id === 'total'

  return (
    <button
      onClick={handleSort}
      className={cn(
        "flex items-center gap-1 hover:text-white/80 transition-colors",
        isYearOrTotal && "ml-auto"
      )}
      aria-label={sortLabel}
    >
      {children}
      {isSorted === 'asc' ? (
        <ChevronUp className="h-3 w-3" aria-hidden="true" />
      ) : isSorted === 'desc' ? (
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-80" aria-hidden="true" />
      )}
    </button>
  )
}
