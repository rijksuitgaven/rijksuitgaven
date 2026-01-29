'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, getAmountFontClass } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import type { RecipientRow, YearAmount } from '@/types/api'

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

// Context fields per module (headline + breadcrumb hierarchy)
// UX Enhancement 3: Prominent Expanded Context
const CONTEXT_FIELDS: Record<string, { headline: string; headlineLabel: string; breadcrumb: string[] }> = {
  instrumenten: { headline: 'regeling', headlineLabel: 'Regeling', breadcrumb: ['artikel', 'begrotingsnaam'] },
  apparaat: { headline: 'kostensoort', headlineLabel: 'Kostensoort', breadcrumb: ['artikel', 'begrotingsnaam'] },
  inkoop: { headline: 'categorie', headlineLabel: 'Categorie', breadcrumb: ['ministerie'] },
  provincie: { headline: 'omschrijving', headlineLabel: 'Omschrijving', breadcrumb: ['provincie'] },
  gemeente: { headline: 'regeling', headlineLabel: 'Regeling', breadcrumb: ['beleidsterrein', 'gemeente'] },
  publiek: { headline: 'regeling', headlineLabel: 'Regeling', breadcrumb: ['source'] },
  integraal: { headline: 'module', headlineLabel: 'Module', breadcrumb: [] },
}

// Module display names for cross-module indicator
const MODULE_NAMES: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  publiek: 'Publiek',
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

  const groupableFields = GROUPABLE_FIELDS[module] ?? []

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

  // Extract context from first detail row (UX Enhancement 3: Prominent Expanded Context)
  const contextConfig = CONTEXT_FIELDS[module]
  const firstDetail = details[0] as DetailRow | undefined

  // Get headline value from the detail row
  const headlineValue = firstDetail?.[contextConfig?.headline as keyof DetailRow] as string | undefined
    || (firstDetail?.group_by === contextConfig?.headline ? firstDetail?.group_value : null)
    || null

  // Get breadcrumb values
  const breadcrumbValues = contextConfig?.breadcrumb
    ?.map(field => firstDetail?.[field as keyof DetailRow] as string | undefined)
    .filter(Boolean) ?? []

  return (
    <div className="space-y-4">
      {/* Prominent Context Header (UX Enhancement 3) */}
      {!isLoading && !error && headlineValue && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-[var(--navy-medium)] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {/* Headline (e.g., Regeling name) */}
              <h4 className="text-lg font-semibold text-[var(--navy-dark)] leading-tight">
                {headlineValue}
              </h4>
              {/* Breadcrumb hierarchy (e.g., Artikel › Begrotingsnaam) */}
              {breadcrumbValues.length > 0 && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {breadcrumbValues.join(' › ')}
                </p>
              )}
              {/* Cross-module indicator */}
              {otherSources.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--navy-medium)]">
                  <span className="font-medium">Ook in:</span>
                  {otherSources.map((source) => (
                    <button
                      key={source}
                      onClick={() => onNavigateToModule?.(source, row.primary_value)}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--gray-light)] hover:bg-[var(--blue-light)] transition-colors"
                    >
                      {MODULE_NAMES[source] || source}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipient info and controls */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-medium text-[var(--navy-dark)]">
            {row.primary_value}
          </h4>
          {row.row_count > 1 && (
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {row.row_count} regelingen
            </p>
          )}
          {/* Cross-module indicator (fallback if no context header) */}
          {!headlineValue && otherSources.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--navy-medium)]">
              <span className="font-medium">Ook in:</span>
              {otherSources.map((source) => (
                <button
                  key={source}
                  onClick={() => onNavigateToModule?.(source, row.primary_value)}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--gray-light)] hover:bg-[var(--blue-light)] transition-colors"
                >
                  {MODULE_NAMES[source] || source}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grouping selector */}
        {groupableFields.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--muted-foreground)]">
              Groeperen op:
            </label>
            <div className="relative">
              <select
                value={grouping}
                onChange={(e) => setGrouping(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-[var(--border)] rounded bg-white hover:border-[var(--navy-medium)] transition-colors"
              >
                {groupableFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Detail rows */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laden...
        </div>
      ) : error ? (
        <div className="py-4 text-sm text-[var(--error)]">{error}</div>
      ) : details.length === 0 ? (
        <div className="py-4 text-sm text-[var(--muted-foreground)]">
          Geen details beschikbaar
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">
                  {groupableFields.find((f) => f.value === grouping)?.label || 'Groep'}
                </th>
                {availableYears.map((year) => (
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
                    {availableYears.map((year) => {
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
      )}
    </div>
  )
}
