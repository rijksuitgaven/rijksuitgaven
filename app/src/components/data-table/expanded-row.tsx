'use client'

import { useState, useEffect, Fragment } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
}: ExpandedRowProps) {
  const [grouping, setGrouping] = useState(GROUPABLE_FIELDS[module]?.[0]?.value ?? 'regeling')
  const [details, setDetails] = useState<DetailRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearsExpanded, setYearsExpanded] = useState(false)

  const groupableFields = GROUPABLE_FIELDS[module] ?? []

  // Calculate collapsible years (same logic as main table)
  const collapsedYears = availableYears.filter(
    (y) => y >= COLLAPSED_YEARS_START && y <= COLLAPSED_YEARS_END
  )
  const visibleYears = yearsExpanded
    ? availableYears
    : availableYears.filter((y) => y > COLLAPSED_YEARS_END)

  // Number of columns before years: expand(1) + primary(1) + extras(N)
  const contentColSpan = 2 + extraColumnsCount

  // Fetch details when row is expanded or grouping changes
  useEffect(() => {
    const abortController = new AbortController()

    async function fetchDetails() {
      setIsLoading(true)
      setError(null)

      try {
        const encodedValue = encodeURIComponent(row.primary_value)
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
        setError(err instanceof Error ? err.message : 'Er ging iets mis')
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
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="h-4 w-4 animate-spin" />
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
          <div className="text-sm text-[var(--error)]">{error}</div>
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
              <div className="relative">
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value)}
                  className="appearance-none pl-2 pr-6 py-1 text-sm font-semibold text-[var(--navy-dark)] border border-[var(--border)] rounded bg-white hover:border-[var(--navy-medium)] transition-colors cursor-pointer"
                >
                  {groupableFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            ) : (
              <span className="text-sm font-semibold text-[var(--navy-dark)]">
                {groupableFields[0]?.label || 'Details'}
              </span>
            )}
            <span className="text-sm text-[var(--muted-foreground)]">
              {details.length} items
            </span>
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
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">{isLast ? '└' : '├'}</span>
                <span className="text-sm text-[var(--navy-dark)] truncate max-w-[400px]" title={detail.group_value || '-'}>
                  {detail.group_value || '-'}
                </span>
              </div>
            </td>
            {/* Collapsed years cell */}
            {!yearsExpanded && collapsedYears.length > 0 && (
              <td className={cn(
                'px-3 py-2.5 text-right tabular-nums border-b border-[var(--border)]',
                collapsedFontClass,
                collapsedTotal === 0 && 'text-[var(--muted-foreground)]'
              )}>
                {collapsedTotal === 0 ? '-' : collapsedFormatted}
              </td>
            )}
            {/* Empty cell for collapse button column when expanded */}
            {yearsExpanded && collapsedYears.length > 0 && (
              <td className="px-3 py-2.5 border-b border-[var(--border)]" />
            )}
            {/* Year cells */}
            {visibleYears.map((year) => {
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
