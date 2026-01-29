'use client'

import { useState, useMemo, Fragment } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type Row,
  type Column,
} from '@tanstack/react-table'
import { ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatAmount,
  calculateYoYChange,
  isAnomaly,
  formatPercentage,
  getAmountFontClass,
} from '@/lib/format'
import { ColumnSelector, getStoredColumns } from '@/components/column-selector'
import type { RecipientRow, YearAmount } from '@/types/api'

// Collapsible year range (2016-2020 by default)
const COLLAPSED_YEARS_START = 2016
const COLLAPSED_YEARS_END = 2020

const MAX_EXPORT_ROWS = 500

// Column meta type for sticky columns
interface ColumnMeta {
  sticky?: boolean
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
  onRowClick?: (primaryValue: string) => void // Click on recipient name to open detail panel
  renderExpandedRow?: (row: RecipientRow) => React.ReactNode
  moduleId?: string // For export filename
}

// Generate CSV content from data
function generateCSV(data: RecipientRow[], availableYears: number[], primaryColumnName: string): string {
  // Header row
  const headers = [primaryColumnName, ...availableYears.map(String), 'Totaal']
  const headerRow = headers.map(h => `"${h}"`).join(';')

  // Data rows
  const dataRows = data.slice(0, MAX_EXPORT_ROWS).map(row => {
    const yearAmounts = availableYears.map(year => {
      const amount = row.years.find(y => y.year === year)?.amount ?? 0
      return amount.toFixed(2)
    })
    return [`"${row.primary_value.replace(/"/g, '""')}"`, ...yearAmounts, row.total.toFixed(2)].join(';')
  })

  return [headerRow, ...dataRows].join('\n')
}

// Download CSV file
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
        hasAnomaly && 'bg-[var(--trend-anomaly-bg)] border border-[var(--trend-anomaly-border)] rounded px-1'
      )}
      title={percentChange !== null ? `${formatPercentage(percentChange)} vs vorig jaar` : undefined}
    >
      {formatted}
    </div>
  )
}

// Collapsed years cell (2016-2020 combined)
function CollapsedYearsCell({
  years,
  collapsedYearRange,
  onExpand,
}: {
  years: YearAmount[]
  collapsedYearRange: number[]
  onExpand: () => void
}) {
  const total = years
    .filter((y) => collapsedYearRange.includes(y.year))
    .reduce((sum, y) => sum + y.amount, 0)

  return (
    <button
      onClick={onExpand}
      className="flex items-center justify-end gap-1 w-full text-right tabular-nums text-sm hover:text-[var(--navy-medium)] transition-colors"
      aria-label={`${formatAmount(total)} - klik om jaren uit te klappen`}
    >
      {formatAmount(total)}
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
    </button>
  )
}

export function DataTable({
  data,
  availableYears,
  primaryColumnName,
  isLoading = false,
  totalRows = 0,
  page = 1,
  perPage = 25,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onRowExpand,
  onRowClick,
  renderExpandedRow,
  moduleId = 'export',
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [yearsExpanded, setYearsExpanded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => getStoredColumns(moduleId))

  // Export handler
  const handleExport = () => {
    if (data.length === 0) return
    setIsExporting(true)

    try {
      const csvContent = generateCSV(data, availableYears, primaryColumnName)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `rijksuitgaven-${moduleId}-${timestamp}.csv`
      downloadCSV(csvContent, filename)
    } finally {
      setIsExporting(false)
    }
  }

  // Determine which years to show based on expansion state
  const collapsedYears = availableYears.filter(
    (y) => y >= COLLAPSED_YEARS_START && y <= COLLAPSED_YEARS_END
  )
  const visibleYears = yearsExpanded
    ? availableYears
    : availableYears.filter((y) => y > COLLAPSED_YEARS_END)

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
        cell: ({ row }) => (
          <div>
            <button
              onClick={() => onRowClick?.(row.original.primary_value)}
              className="font-medium text-[var(--navy-dark)] hover:text-[var(--pink)] hover:underline text-left transition-colors"
            >
              {row.original.primary_value}
            </button>
            {/* Cross-module indicator */}
            {row.original.sources && row.original.sources.length > 1 && (
              <div className="text-xs text-[var(--navy-medium)] mt-0.5">
                Ook in: {row.original.sources.filter(s => s !== 'current').join(', ')}
              </div>
            )}
          </div>
        ),
        minSize: 200,
        meta: { sticky: true }, // Mark as sticky column
      },
    ]

    // Collapsed years column (2016-2020)
    if (!yearsExpanded && collapsedYears.length > 0) {
      cols.push({
        id: 'collapsed-years',
        header: () => (
          <button
            onClick={() => setYearsExpanded(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors"
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
            onExpand={() => setYearsExpanded(true)}
          />
        ),
        size: 100,
      })
    }

    // Individual year columns
    visibleYears.forEach((year, index) => {
      const yearIndex = availableYears.indexOf(year)
      const previousYear = yearIndex > 0 ? availableYears[yearIndex - 1] : null

      cols.push({
        id: `year-${year}`,
        accessorFn: (row) => row.years.find((y) => y.year === year)?.amount ?? 0,
        header: ({ column }) => (
          <SortableHeader column={column} onSortChange={onSortChange}>
            {year}
            {/* Partial data indicator - will be populated from data_freshness */}
            {year === Math.max(...availableYears) && (
              <span className="text-[var(--warning)]" title="Data nog niet compleet">*</span>
            )}
          </SortableHeader>
        ),
        cell: ({ row }) => {
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
        size: 80,
      })
    })

    // Collapse button when expanded
    if (yearsExpanded && collapsedYears.length > 0) {
      cols.push({
        id: 'collapse-years',
        header: () => (
          <button
            onClick={() => setYearsExpanded(false)}
            className="p-1 hover:bg-[var(--gray-light)] rounded"
            title="Jaren inklappen"
            aria-label="Jaren inklappen"
          >
            <ChevronRight className="h-3 w-3 rotate-180" aria-hidden="true" />
          </button>
        ),
        cell: () => null,
        size: 30,
      })
    }

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
      size: 100,
    })

    return cols
  }, [availableYears, yearsExpanded, collapsedYears, visibleYears, primaryColumnName, onSortChange, onRowExpand])

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
      {/* Table container with horizontal scroll for expanded years */}
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-[var(--gray-light)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const isSticky = (header.column.columnDef.meta as ColumnMeta | undefined)?.sticky || headerIndex === 0 || headerIndex === 1
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2 text-left text-xs font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]',
                        isSticky && 'sticky left-0 bg-[var(--gray-light)] z-10',
                        headerIndex === 1 && 'sticky left-10 bg-[var(--gray-light)] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                      )}
                      style={{ width: header.getSize() }}
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
          <tbody>
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
                      'hover:bg-[var(--gray-light)] transition-colors',
                      row.getIsExpanded() && 'bg-[var(--gray-light)]'
                    )}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isSticky = (cell.column.columnDef.meta as ColumnMeta | undefined)?.sticky || cellIndex === 0 || cellIndex === 1
                      const isExpanded = row.getIsExpanded()
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-3 py-2 border-b border-[var(--border)]',
                            isSticky && 'sticky left-0 bg-white z-10',
                            cellIndex === 1 && 'sticky left-10 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]',
                            isExpanded && isSticky && 'bg-[var(--gray-light)]'
                          )}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                  {/* Expanded row content */}
                  {row.getIsExpanded() && renderExpandedRow && (
                    <tr>
                      <td colSpan={columns.length} className="bg-[var(--gray-light)] border-b border-[var(--border)]">
                        <div className="px-6 py-4">
                          {renderExpandedRow(row.original)}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
        <div className="flex items-center gap-4">
          <div className="text-xs text-[var(--muted-foreground)]">
            Bedragen in &euro;
            {availableYears.includes(Math.max(...availableYears)) && (
              <span className="ml-4">* Data nog niet compleet</span>
            )}
          </div>

          {/* Column selector (UX-005) */}
          <ColumnSelector
            moduleId={moduleId}
            selectedColumns={selectedColumns}
            onColumnsChange={setSelectedColumns}
          />

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isLoading || isExporting || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={`Download als CSV (max ${MAX_EXPORT_ROWS} rijen)`}
            aria-label={`Download als CSV, maximaal ${MAX_EXPORT_ROWS} rijen`}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {isExporting ? 'Bezig...' : 'CSV Export'}
          </button>
          {data.length > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              (max {MAX_EXPORT_ROWS} rijen)
            </span>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-4">
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

          <select
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            className="px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-white"
            aria-label="Aantal rijen per pagina"
          >
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} per pagina
              </option>
            ))}
          </select>
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

  return (
    <button
      onClick={handleSort}
      className="flex items-center gap-1 hover:text-[var(--navy-medium)] transition-colors"
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
