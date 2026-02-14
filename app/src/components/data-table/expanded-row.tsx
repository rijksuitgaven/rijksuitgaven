'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ErrorReport } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/use-analytics'
import { formatAmount, getAmountFontClass } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import type { RecipientRow } from '@/types/api'

// Collapsible year range (same as main table)
const COLLAPSED_YEARS_START = 2016
const COLLAPSED_YEARS_END = 2020

// Groupable fields per module (per search-requirements.md)
// Ordered by usefulness - most commonly used groupings first
const GROUPABLE_FIELDS: Record<string, { value: string; label: string }[]> = {
  instrumenten: [
    { value: 'regeling', label: 'Regeling' },
    { value: 'artikel', label: 'Artikel' },
    { value: 'instrument', label: 'Instrument' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam' },
    { value: 'artikelonderdeel', label: 'Artikelonderdeel' },
    { value: 'detail', label: 'Detail' },
  ],
  apparaat: [
    { value: 'kostensoort', label: 'Kostensoort' },
    { value: 'artikel', label: 'Artikel' },
    { value: 'detail', label: 'Detail' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam' },
  ],
  inkoop: [
    { value: 'ministerie', label: 'Ministerie' },
    { value: 'categorie', label: 'Categorie' },
    { value: 'staffel', label: 'Staffel' },
  ],
  provincie: [
    { value: 'provincie', label: 'Provincie' },
    { value: 'omschrijving', label: 'Omschrijving' },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente' },
    { value: 'beleidsterrein', label: 'Beleidsterrein' },
    { value: 'regeling', label: 'Regeling' },
    { value: 'omschrijving', label: 'Omschrijving' },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie' },
    { value: 'regeling', label: 'Regeling' },
    { value: 'sectoren', label: 'Sectoren' },
    { value: 'trefwoorden', label: 'Trefwoorden' },
  ],
  integraal: [
    { value: 'module', label: 'Module' },
  ],
}

/** Format count with Dutch locale separator: 1234 → "1.234" */
function formatCount(count: number): string {
  return count.toLocaleString('nl-NL')
}

// =============================================================================
// GroupingSelect — single-select dropdown matching MultiSelect filter styling
// =============================================================================

function GroupingSelect({ value, onChange, options, counts }: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  counts: Record<string, number> | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedLabel = options.find(o => o.value === value)?.label ?? 'Selecteer...'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-2.5 py-1.5 border rounded-lg text-sm text-left flex items-center gap-2 transition-colors',
          'border-[var(--muted-foreground)] bg-white',
          'focus:outline-none focus:ring-1 focus:ring-[var(--muted-foreground)]/30'
        )}
      >
        <span className="font-semibold text-[var(--navy-dark)] whitespace-nowrap">{selectedLabel}</span>
        {counts && counts[value] != null && (
          <span className="text-[var(--navy-medium)] text-xs">({formatCount(counts[value])})</span>
        )}
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform flex-shrink-0',
          isOpen && 'rotate-180'
        )} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-max min-w-full bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-72 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left hover:bg-[var(--gray-light)] transition-colors flex items-center gap-2',
                value === opt.value && 'text-[var(--navy-dark)] font-medium'
              )}
            >
              {value === opt.value ? (
                <Check className="h-3.5 w-3.5 text-[var(--navy-dark)] flex-shrink-0" />
              ) : (
                <span className="w-3.5 flex-shrink-0" />
              )}
              <span className="whitespace-nowrap">{opt.label}</span>
              {counts && counts[opt.value] != null && (
                <span className="text-[var(--navy-medium)] text-xs ml-auto whitespace-nowrap">
                  ({formatCount(counts[opt.value])})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ExpandedRow
// =============================================================================

interface DetailRow {
  group_by: string
  group_value: string | null
  years: Record<string, number>
  totaal: number
  row_count: number
}

interface ExpandedRowProps {
  row: RecipientRow
  module: string
  availableYears: number[]
  extraColumnsCount?: number
  isSearching?: boolean
  onFilterLinkClick?: (field: string, value: string) => void
}

/**
 * Expanded row component - returns <tr> elements to render within parent table
 * This ensures column alignment with the parent table
 */
export function ExpandedRow({
  row,
  module,
  availableYears,
  extraColumnsCount = 0,
  isSearching = false,
  onFilterLinkClick,
}: ExpandedRowProps) {
  const { track } = useAnalytics()
  const [grouping, setGrouping] = useState(GROUPABLE_FIELDS[module]?.[0]?.value ?? 'regeling')
  const [details, setDetails] = useState<DetailRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearsExpanded, setYearsExpanded] = useState(false)
  const [groupingCounts, setGroupingCounts] = useState<Record<string, number> | null>(null)

  const groupableFields = GROUPABLE_FIELDS[module] ?? []

  // Calculate collapsible years (same logic as main table)
  const collapsedYears = availableYears.filter(
    (y) => y >= COLLAPSED_YEARS_START && y <= COLLAPSED_YEARS_END
  )
  const visibleYears = yearsExpanded
    ? availableYears
    : availableYears.filter((y) => y > COLLAPSED_YEARS_END)

  // Number of columns before years: expand(1) + primary(1) + extras(N)
  // When searching, extra columns are replaced by a single "Gevonden in" column
  const extraCols = isSearching ? 1 : extraColumnsCount
  const contentColSpan = 2 + extraCols

  // Fetch grouping counts once when the row expands (not on grouping change)
  useEffect(() => {
    if (module === 'integraal' || groupableFields.length <= 1) return

    const abortController = new AbortController()

    async function fetchCounts() {
      try {
        const encodedValue = encodeURIComponent(encodeURIComponent(row.primary_value))
        const url = `${API_BASE_URL}/api/v1/modules/${module}/${encodedValue}/grouping-counts`
        const response = await fetch(url, { signal: abortController.signal })
        if (!response.ok) return
        const data = await response.json()
        if (!abortController.signal.aborted) {
          setGroupingCounts(data)
        }
      } catch {
        // Silently fail — counts are a nice-to-have enhancement
      }
    }

    fetchCounts()
    return () => { abortController.abort() }
  }, [row.primary_value, module, groupableFields.length])

  // Fetch details when row is expanded or grouping changes
  useEffect(() => {
    const abortController = new AbortController()

    async function fetchDetails() {
      setIsLoading(true)
      setError(null)

      try {
        // Double-encode to preserve %2F through Next.js routing (slashes in kostensoort like "Vaklit/abonn/overig")
        const encodedValue = encodeURIComponent(encodeURIComponent(row.primary_value))
        const url = `${API_BASE_URL}/api/v1/modules/${module}/${encodedValue}/details?group_by=${grouping}`

        const response = await fetch(url, { signal: abortController.signal })
        if (!response.ok) {
          throw new Error('Fout bij laden details')
        }

        const data = await response.json()
        setDetails(data.details || [])
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('[ExpandedRow]', err instanceof Error ? err.message : err)
        setError('Details konden niet worden geladen')
        track('error', module, { message: err instanceof Error ? err.message : String(err), trigger: 'row_expand' })
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchDetails()

    return () => {
      abortController.abort()
    }
  }, [row.primary_value, module, grouping])

  // Loading state
  if (isLoading) {
    return (
      <tr className="bg-[var(--gray-light)]">
        <td colSpan={contentColSpan + (collapsedYears.length > 0 ? 1 : 0) + visibleYears.length + 1} className="px-3 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Laden...</span>
          </div>
        </td>
      </tr>
    )
  }

  // Error state
  if (error) {
    return (
      <tr className="bg-[var(--gray-light)]">
        <td colSpan={contentColSpan + (collapsedYears.length > 0 ? 1 : 0) + visibleYears.length + 1} className="px-3 py-4 border-b border-[var(--border)]">
          <ErrorReport variant="inline" />
        </td>
      </tr>
    )
  }

  // Empty state
  if (details.length === 0) {
    return (
      <tr className="bg-[var(--gray-light)]">
        <td colSpan={contentColSpan + (collapsedYears.length > 0 ? 1 : 0) + visibleYears.length + 1} className="px-3 py-4 border-b border-[var(--border)]">
          <div className="text-sm text-[var(--muted-foreground)]">Geen details beschikbaar</div>
        </td>
      </tr>
    )
  }

  return (
    <Fragment>
      {/* Header row with dropdown and year headers */}
      <tr className="bg-[var(--gray-light)]">
        {/* Content columns: dropdown + count */}
        <td colSpan={contentColSpan} className="px-3 py-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {groupableFields.length > 1 ? (
              <GroupingSelect
                value={grouping}
                onChange={setGrouping}
                options={groupableFields}
                counts={groupingCounts}
              />
            ) : (
              <span className="text-sm font-semibold text-[var(--navy-dark)]">
                {groupableFields[0]?.label || 'Details'}
              </span>
            )}
          </div>
        </td>
        {/* Collapsed years toggle */}
        {!yearsExpanded && collapsedYears.length > 0 && (
          <td className="px-3 py-2 text-right border-b border-[var(--border)]">
            <button
              onClick={() => setYearsExpanded(true)}
              className="flex items-center gap-1 text-sm font-semibold text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors ml-auto"
            >
              {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
              <ChevronRight className="h-4 w-4" />
            </button>
          </td>
        )}
        {/* Collapse button when expanded */}
        {yearsExpanded && collapsedYears.length > 0 && (
          <td className="px-3 py-2 text-right border-b border-[var(--border)]">
            <button
              onClick={() => setYearsExpanded(false)}
              className="flex items-center gap-1 text-sm font-semibold text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
            </button>
          </td>
        )}
        {/* Year headers */}
        {visibleYears.map((year) => (
          <td key={year} className="px-3 py-2 text-right text-sm font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">
            {year}
          </td>
        ))}
        {/* Total header */}
        <td className="px-3 py-2 text-right text-sm font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">
          Totaal
        </td>
      </tr>

      {/* Data rows */}
      {details.map((detail, index) => {
        const totalFormatted = formatAmount(detail.totaal)
        const totalFontClass = getAmountFontClass(totalFormatted)

        const collapsedTotal = collapsedYears.reduce(
          (sum, y) => sum + (detail.years[String(y)] || 0),
          0
        )
        const collapsedFormatted = formatAmount(collapsedTotal)
        const collapsedFontClass = getAmountFontClass(collapsedFormatted)
        const isLast = index === details.length - 1

        return (
          <tr key={`${detail.group_value}-${index}`} className="bg-[var(--gray-light)] hover:bg-[var(--gray-light)]/80 transition-colors">
            {/* Content cell with tree branch */}
            <td colSpan={contentColSpan} className="px-3 py-2.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2" data-tooltip={detail.group_value || undefined}>
                <span className="text-[var(--muted-foreground)]">{isLast ? '└' : '├'}</span>
                {detail.group_value ? (
                  grouping === 'module' ? (
                    <a
                      href={`/${detail.group_value}?q=${encodeURIComponent(row.primary_value)}`}
                      className="text-sm text-[var(--navy-dark)] truncate max-w-[400px] text-left hover:text-[var(--pink)] hover:underline transition-colors cursor-pointer"
                    >
                      {detail.group_value}
                    </a>
                  ) : (
                    <button
                      onClick={() => onFilterLinkClick?.(grouping, detail.group_value!)}
                      className="text-sm text-[var(--navy-dark)] truncate max-w-[400px] text-left hover:text-[var(--pink)] hover:underline transition-colors cursor-pointer"
                    >
                      {detail.group_value}
                    </button>
                  )
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">-</span>
                )}
              </div>
            </td>
            {/* Collapsed years cell */}
            {!yearsExpanded && collapsedYears.length > 0 && (() => {
              const availableCollapsed = collapsedYears.filter((y) => {
                const from = row.dataAvailableFrom
                const to = row.dataAvailableTo
                if (from == null || to == null) return true
                return y >= from && y <= to
              })
              if (availableCollapsed.length === 0) {
                return (
                  <td className="px-3 py-2.5 text-right text-[var(--muted-foreground)] border-b border-[var(--border)]"
                    title="Geen data beschikbaar voor deze periode"
                  >
                    —
                  </td>
                )
              }
              const availTotal = availableCollapsed.reduce(
                (sum, y) => sum + (detail.years[String(y)] || 0), 0
              )
              const availFormatted = formatAmount(availTotal)
              const availFontClass = getAmountFontClass(availFormatted)
              return (
                <td className={cn(
                  'px-3 py-2.5 text-right tabular-nums border-b border-[var(--border)]',
                  availFontClass,
                  availTotal === 0 && 'text-[var(--muted-foreground)]'
                )}>
                  {availTotal === 0 ? '-' : availFormatted}
                </td>
              )
            })()}
            {/* Empty cell for collapse button column when expanded */}
            {yearsExpanded && collapsedYears.length > 0 && (
              <td className="px-3 py-2.5 border-b border-[var(--border)]" />
            )}
            {/* Year cells */}
            {visibleYears.map((year) => {
              // Check availability from parent row
              const from = row.dataAvailableFrom
              const to = row.dataAvailableTo
              const available = (from == null || to == null) ? true : (year >= from && year <= to)

              if (!available) {
                return (
                  <td
                    key={year}
                    className="px-3 py-2.5 text-right text-[var(--muted-foreground)] border-b border-[var(--border)]"
                    title="Geen data beschikbaar voor deze periode"
                  >
                    —
                  </td>
                )
              }

              const amount = detail.years[String(year)] || 0
              const formatted = formatAmount(amount)
              const fontClass = getAmountFontClass(formatted)

              return (
                <td
                  key={year}
                  className={cn(
                    'px-3 py-2.5 text-right tabular-nums border-b border-[var(--border)]',
                    fontClass,
                    amount === 0 && 'text-[var(--muted-foreground)]'
                  )}
                >
                  {amount === 0 ? '-' : formatted}
                </td>
              )
            })}
            {/* Total cell */}
            <td className={cn(
              'px-3 py-2.5 text-right tabular-nums font-semibold border-b border-[var(--border)]',
              totalFontClass
            )}>
              {totalFormatted}
            </td>
          </tr>
        )
      })}
    </Fragment>
  )
}
