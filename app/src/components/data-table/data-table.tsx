'use client'

import { useState, useMemo, useRef, Fragment, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type Column,
} from '@tanstack/react-table'
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ChevronsUpDown, Download, FileSpreadsheet, ExternalLink, Info, Search, MousePointerClick, AlertTriangle, SlidersHorizontal, Columns3 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
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

// Sticky column offset for primary column (in pixels)
const STICKY_PRIMARY_OFFSET_PX = 40

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
  renderExpandedRow?: (row: RecipientRow) => React.ReactNode
  moduleId?: string // For export filename
  selectedColumns?: string[]  // Selected extra columns (UX-005)
  onColumnsChange?: (columns: string[]) => void  // Callback for column selection changes
  searchQuery?: string  // Current search query (for Match column display)
  hasActiveFilters?: boolean  // True when multiselect filters are active (UX-006)
  totals?: TotalsData | null  // Aggregated totals for all search results (not just current page)
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
  // Get column labels for selected extra columns
  const moduleColumns = MODULE_COLUMNS[moduleId] || []
  const extraColumnLabels = selectedColumns.map(colKey => {
    const config = moduleColumns.find(c => c.value === colKey)
    return config?.label || colKey
  })

  // Header row: Primary, Extra Columns, Years, Totaal
  const headers = [primaryColumnName, ...extraColumnLabels, ...availableYears.map(String), 'Totaal']
  const headerRow = headers.map(h => `"${h}"`).join(';')

  // Data rows
  const dataRows = data.slice(0, MAX_EXPORT_ROWS).map(row => {
    // Extra column values
    const extraValues = selectedColumns.map(colKey => {
      const value = row.extraColumns?.[colKey] || ''
      return `"${value.replace(/"/g, '""')}"`
    })

    const yearAmounts = availableYears.map(year => {
      const amount = row.years.find(y => y.year === year)?.amount ?? 0
      return amount.toFixed(2)
    })
    return [`"${row.primary_value.replace(/"/g, '""')}"`, ...extraValues, ...yearAmounts, row.total.toFixed(2)].join(';')
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
  // Get column labels for selected extra columns
  const moduleColumns = MODULE_COLUMNS[moduleId] || []
  const extraColumnLabels = selectedColumns.map(colKey => {
    const config = moduleColumns.find(c => c.value === colKey)
    return config?.label || colKey
  })

  // Build worksheet data: Primary, Extra Columns, Years, Totaal
  const headers = [primaryColumnName, ...extraColumnLabels, ...availableYears.map(String), 'Totaal']

  const rows = data.slice(0, MAX_EXPORT_ROWS).map(row => {
    // Extra column values
    const extraValues = selectedColumns.map(colKey => row.extraColumns?.[colKey] || '')

    const yearAmounts = availableYears.map(year => {
      return row.years.find(y => y.year === year)?.amount ?? 0
    })
    return [row.primary_value, ...extraValues, ...yearAmounts, row.total]
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

  return (
    <div
      className={cn(
        'text-right tabular-nums',
        fontClass,
        hasAnomaly && 'bg-[var(--trend-anomaly-bg)] rounded-sm -mx-2 px-2'
      )}
      data-tooltip-center={percentChange !== null ? `${formatPercentage(percentChange)} vs vorig jaar` : undefined}
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
  totals,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [yearsExpanded, setYearsExpanded] = useState(false)

  // Reset expanded state when data changes (e.g., after filter applied)
  useEffect(() => {
    setExpanded({})
  }, [data])
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingXLS, setIsExportingXLS] = useState(false)
  const [isStaffelOpen, setIsStaffelOpen] = useState(false)
  const staffelRef = useRef<HTMLDivElement>(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [showInfoPulse, setShowInfoPulse] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

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

  // CSV Export handler
  const handleExportCSV = () => {
    if (data.length === 0) return
    setIsExportingCSV(true)

    try {
      const csvContent = generateCSV(data, availableYears, primaryColumnName, selectedColumns, moduleId)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `rijksuitgaven-${moduleId}-${timestamp}.csv`
      downloadCSV(csvContent, filename)
    } finally {
      setIsExportingCSV(false)
    }
  }

  // XLS Export handler
  const handleExportXLS = () => {
    if (data.length === 0) return
    setIsExportingXLS(true)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `rijksuitgaven-${moduleId}-${timestamp}.xlsx`
      downloadXLS(data, availableYears, primaryColumnName, filename, selectedColumns, moduleId)
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
      // Expand button column
      {
        id: 'expand',
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={() => {
              row.toggleExpanded()
              if (!row.getIsExpanded() && onRowExpand) {
                onRowExpand(row.original.primary_value)
              }
            }}
            className="p-1 hover:bg-[var(--gray-light)] rounded transition-colors"
            aria-expanded={row.getIsExpanded()}
            aria-label={row.getIsExpanded() ? 'Rij inklappen' : 'Rij uitklappen'}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4 text-[var(--navy-medium)]" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--navy-medium)]" aria-hidden="true" />
            )}
          </button>
        ),
        size: 40,
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
                    row.toggleExpanded()
                    if (!row.getIsExpanded() && onRowExpand) {
                      onRowExpand(row.original.primary_value)
                    }
                  }}
                  className="font-medium text-[var(--navy-dark)] hover:text-[var(--pink)] hover:underline text-left transition-colors"
                >
                  {row.original.primary_value}
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(row.original.primary_value)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-tooltip-center="Zoek op Google"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 text-[var(--navy-medium)] hover:text-[var(--pink)] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
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
      // "Gevonden in" column when searching - shows matched value and field
      cols.push({
        id: 'matched',
        header: () => (
          <span className="text-sm font-semibold text-white">Gevonden in</span>
        ),
        cell: ({ row }) => {
          const matchedField = row.original.matchedField
          const matchedValue = row.original.matchedValue
          const matchedFieldLabel = matchedField ? (FIELD_LABELS[matchedField] || matchedField) : null

          if (!matchedValue && !matchedFieldLabel) {
            return <span className="text-[var(--muted-foreground)]">-</span>
          }

          return (
            <div className="max-w-[200px]" data-tooltip={matchedValue || undefined}>
              {/* Line 1: The matched value */}
              <div className="text-sm text-[var(--navy-dark)] truncate">
                {matchedValue || '-'}
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
            header: () => (
              <span className="text-sm font-semibold text-white">{config.label}</span>
            ),
            cell: ({ row }) => {
              const value = row.original.extraColumns?.[colKey]
              const count = row.original.extraColumnCounts?.[colKey] ?? 1
              const hasMore = count > 1

              if (!value) {
                return <span className="text-[var(--muted-foreground)]">-</span>
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
                        row.toggleExpanded()
                        if (!row.getIsExpanded() && onRowExpand) {
                          onRowExpand(row.original.primary_value)
                        }
                      }}
                      className="text-xs text-[var(--navy-medium)] mt-0.5 cursor-pointer"
                      style={{ fontSize: '12px' }}
                    >
                      +{count - 1} meer
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
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
    } else if (yearsExpanded && collapsedYears.length > 0) {
      // Show collapse header: "< 2016-20" that collapses on click
      cols.push({
        id: 'collapse-years-header',
        header: () => (
          <button
            onClick={() => setYearsExpanded(false)}
            className="flex items-center gap-1 text-sm font-semibold text-white hover:text-white/80 transition-colors"
            aria-label={`Jaren ${COLLAPSED_YEARS_START} tot ${COLLAPSED_YEARS_END} inklappen`}
            title="Klik om jaren in te klappen"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
          </button>
        ),
        cell: () => null,
        size: 80,
      })
    }

    // Individual year columns
    visibleYears.forEach((year) => {
      const yearIndex = availableYears.indexOf(year)
      const previousYear = yearIndex > 0 ? availableYears[yearIndex - 1] : null

      cols.push({
        id: `year-${year}`,
        accessorFn: (row) => row.years.find((y) => y.year === year)?.amount ?? 0,
        header: ({ column }) => (
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
  }, [availableYears, yearsExpanded, collapsedYears, visibleYears, primaryColumnName, onSortChange, onRowExpand, onFilterLinkClick, selectedColumns, moduleId, searchQuery]) // collapsedYears and visibleYears are now stable memoized refs

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      expanded,
    },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true, // Server-side pagination
    pageCount: Math.ceil(totalRows / perPage),
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

        {/* Right: Info + Kolommen + CSV Export */}
        <div className="flex items-center gap-2">
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
                    <p className="text-sm text-white/80">Doorzoekt ook regelingen, artikelen en categorieën. De kolom &ldquo;Gevonden in&rdquo; toont wáár.</p>
                  </div>
                  <div className="flex gap-3">
                    <ChevronRight className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Klik op een ontvanger om details te zien. Groepeer op regeling, artikel of categorie.</p>
                  </div>
                  <div className="flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-[var(--pink)] shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">Rood gemarkeerd = 50%+ mutatie t.o.v. vorig jaar. Hover voor het percentage.</p>
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

          {/* CSV Export button */}
          <button
            onClick={handleExportCSV}
            disabled={isLoading || isExportingCSV || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Download als CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isExportingCSV ? 'Bezig...' : 'CSV'}
          </button>

          {/* XLS Export button */}
          <button
            onClick={handleExportXLS}
            disabled={isLoading || isExportingXLS || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Download als Excel"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            {isExportingXLS ? 'Bezig...' : 'XLS'}
          </button>
        </div>
      </div>

      {/* Table container with horizontal scroll for expanded years */}
      <div className="overflow-x-auto">
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
                        isYearOrTotal ? 'text-right' : 'text-left',
                        isSticky && 'sticky left-0 bg-[var(--navy-dark)] z-10',
                        headerIndex === 1 && `sticky bg-[var(--navy-dark)] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]`,
                        isTotaal && 'bg-[var(--navy-medium)]',
                        isFirst && 'rounded-l-lg',
                        isLast && 'rounded-r-lg'
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
              table.getRowModel().rows.map((row) => (
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
                      // Year columns and Totaal are right-aligned
                      const isYearOrTotal = cell.column.id.startsWith('year-') || cell.column.id === 'collapsed-years' || cell.column.id === 'total'
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-3 py-2 border-b border-[var(--border)] transition-colors',
                            isYearOrTotal ? 'text-right' : 'text-left',
                            isSticky && 'sticky left-0 bg-white group-hover:bg-[var(--gray-light)] z-10',
                            cellIndex === 1 && 'sticky bg-white group-hover:bg-[var(--gray-light)] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]',
                            isExpanded && isSticky && 'bg-[var(--gray-light)]',
                            isTotaal && 'bg-[var(--totaal-bg)] font-semibold'
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
                  {row.getIsExpanded() && renderExpandedRow && renderExpandedRow(row.original)}
                </Fragment>
              ))
            )}
          </tbody>
          {/* Totals row - only shown when searching/filtering */}
          {totals && (
            <tfoot>
              <tr className="bg-[var(--navy-dark)] text-white font-semibold text-sm">
                {/* Expand column placeholder */}
                <td className="px-2 py-2 border-b border-[var(--border)]"></td>
                {/* Primary column - show "Totaal (X ontvangers)" */}
                <td className="px-3 py-2 border-b border-[var(--border)] sticky left-[40px] bg-[var(--navy-dark)] z-10">
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
                {yearsExpanded && collapsedYears.length > 0 && (
                  <td className="px-3 py-2 border-b border-[var(--border)]"></td>
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
                <td className="px-3 py-2 text-right tabular-nums text-xs border-b border-[var(--border)] bg-[var(--navy-medium)]">
                  {formatAmount(totals.totaal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
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
    const newDirection = isSorted === 'asc' ? 'desc' : 'asc'
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
        <ChevronsUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
      )}
    </button>
  )
}
