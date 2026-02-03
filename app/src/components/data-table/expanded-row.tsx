'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, getAmountFontClass } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS } from '@/lib/constants'
import type { RecipientRow } from '@/types/api'

// Collapsible year range (same as main table)
const COLLAPSED_YEARS_START = 2016
const COLLAPSED_YEARS_END = 2020

// Groupable fields per module
const GROUPABLE_FIELDS: Record<string, { value: string; label: string }[]> = {
  instrumenten: [
    { value: 'regeling', label: 'Regeling' },
    { value: 'artikel', label: 'Artikel' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam' },
  ],
  apparaat: [
    { value: 'artikel', label: 'Artikel' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam' },
  ],
  inkoop: [
    { value: 'ministerie', label: 'Ministerie' },
    { value: 'categorie', label: 'Categorie' },
  ],
  provincie: [
    { value: 'provincie', label: 'Provincie' },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente' },
    { value: 'beleidsterrein', label: 'Beleidsterrein' },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie' },
    { value: 'regeling', label: 'Regeling' },
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
  // Context fields (may be present depending on API response)
  regeling?: string
  artikel?: string
  begrotingsnaam?: string
  kostensoort?: string
  ministerie?: string
  categorie?: string
  provincie?: string
  gemeente?: string
  beleidsterrein?: string
  omschrijving?: string
  source?: string
  module?: string
}

interface ExpandedRowProps {
  row: RecipientRow
  module: string
  availableYears: number[]
  onNavigateToModule?: (module: string, recipient: string) => void
}

/**
 * Expanded row component showing detailed breakdown by grouping field
 * Fetches and displays detail data when a row is expanded in the main table
 */
export function ExpandedRow({
  row,
  module,
  availableYears,
  onNavigateToModule,
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
        // Ignore abort errors - they're expected when component unmounts or deps change
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

  // Cross-module sources (excluding current module)
  const otherSources = row.sources?.filter((s) => s !== module && s !== 'current') ?? []

  return (
    <div className="space-y-2">
      {/* Cross-module indicator (if applicable) */}
      {otherSources.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[var(--navy-medium)]">
          <span className="font-medium">Ook in:</span>
          {otherSources.map((source) => (
            <button
              key={source}
              onClick={() => onNavigateToModule?.(source, row.primary_value)}
              className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--gray-light)] hover:bg-[var(--blue-light)] transition-colors"
            >
              {MODULE_LABELS[source] || source}
            </button>
          ))}
        </div>
      )}

      {/* Detail table with integrated toolbar */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Laden...</span>
        </div>
      ) : error ? (
        <div className="py-4 text-sm text-[var(--error)]">{error}</div>
      ) : details.length === 0 ? (
        <div className="py-4 text-sm text-[var(--muted-foreground)]">
          Geen details beschikbaar
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded overflow-hidden">
          {/* Table with integrated controls in header */}
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--gray-light)]">
              <tr>
                {/* First column: Dropdown + count + total - all in one cell */}
                <th className="px-3 py-2 text-left border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    {/* Grouping dropdown */}
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
                    {/* Count only - TODO: Add total back when "Details API total mismatch" backlog item is fixed (see VERSIONING.md) */}
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {details.length} items
                    </span>
                  </div>
                </th>
                {/* Collapsed years toggle (2016-2020) */}
                {!yearsExpanded && collapsedYears.length > 0 && (
                  <th className="px-3 py-2 text-right font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] w-24">
                    <button
                      onClick={() => setYearsExpanded(true)}
                      className="flex items-center gap-1 text-sm font-semibold text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors ml-auto"
                      aria-label={`Jaren ${COLLAPSED_YEARS_START} tot ${COLLAPSED_YEARS_END} uitklappen`}
                    >
                      {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </th>
                )}
                {/* Collapse button when expanded */}
                {yearsExpanded && collapsedYears.length > 0 && (
                  <th className="px-3 py-2 text-right font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] w-20">
                    <button
                      onClick={() => setYearsExpanded(false)}
                      className="flex items-center gap-1 text-sm font-semibold text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors"
                      aria-label={`Jaren ${COLLAPSED_YEARS_START} tot ${COLLAPSED_YEARS_END} inklappen`}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      {COLLAPSED_YEARS_START}-{String(COLLAPSED_YEARS_END).slice(-2)}
                    </button>
                  </th>
                )}
                {visibleYears.map((year) => (
                  <th
                    key={year}
                    className="px-3 py-2 text-right font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] w-20"
                  >
                    {year}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] w-24">
                  Totaal
                </th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => {
                const totalFormatted = formatAmount(detail.totaal)
                const totalFontClass = getAmountFontClass(totalFormatted)

                // Calculate collapsed years total for this row
                const collapsedTotal = collapsedYears.reduce(
                  (sum, y) => sum + (detail.years[String(y)] || 0),
                  0
                )
                const collapsedFormatted = formatAmount(collapsedTotal)
                const collapsedFontClass = getAmountFontClass(collapsedFormatted)

                return (
                  <tr
                    key={`${detail.group_value}-${index}`}
                    className="hover:bg-[var(--gray-light)]/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-[var(--navy-dark)] border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        {index === details.length - 1 ? (
                          <span className="text-[var(--muted-foreground)]">└</span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">├</span>
                        )}
                        <span className="truncate max-w-[300px]" title={detail.group_value || '-'}>
                          {detail.group_value || '-'}
                        </span>
                      </div>
                    </td>
                    {/* Collapsed years cell (2016-2020 combined) */}
                    {!yearsExpanded && collapsedYears.length > 0 && (
                      <td
                        className={cn(
                          'px-3 py-2 text-right tabular-nums border-b border-[var(--border)]',
                          collapsedFontClass,
                          collapsedTotal === 0 && 'text-[var(--muted-foreground)]'
                        )}
                      >
                        {collapsedTotal === 0 ? '-' : collapsedFormatted}
                      </td>
                    )}
                    {/* Empty cell for collapse button column when expanded */}
                    {yearsExpanded && collapsedYears.length > 0 && (
                      <td className="px-3 py-2 border-b border-[var(--border)]" />
                    )}
                    {visibleYears.map((year) => {
                      const amount = detail.years[String(year)] || 0
                      const formatted = formatAmount(amount)
                      const fontClass = getAmountFontClass(formatted)

                      return (
                        <td
                          key={year}
                          className={cn(
                            'px-3 py-2 text-right tabular-nums border-b border-[var(--border)]',
                            fontClass,
                            amount === 0 && 'text-[var(--muted-foreground)]'
                          )}
                        >
                          {amount === 0 ? '-' : formatted}
                        </td>
                      )
                    })}
                    <td
                      className={cn(
                        'px-3 py-2 text-right tabular-nums font-semibold border-b border-[var(--border)]',
                        totalFontClass
                      )}
                    >
                      {totalFormatted}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
