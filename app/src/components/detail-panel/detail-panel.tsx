'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ExternalLink, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS, FIELD_LABELS } from '@/lib/constants'

interface YearAmount {
  year: number
  amount: number
}

interface DetailData {
  primary_value: string
  years: YearAmount[]
  total: number
  row_count: number
  sources?: string[]
  details?: {
    regeling?: string
    artikel?: string
    begrotingsnaam?: string
    instrument?: string
    kostensoort?: string
    ministerie?: string
    categorie?: string
    provincie?: string
    gemeente?: string
    beleidsterrein?: string
    omschrijving?: string
    source?: string
  }
}

// API response row type from details endpoint
interface ApiDetailRow {
  group_by?: string
  group_value?: string | null
  years?: Record<string, number>
  totaal?: number
  row_count?: number
  // Optional detail fields
  regeling?: string
  artikel?: string
  begrotingsnaam?: string
  instrument?: string
  kostensoort?: string
  ministerie?: string
  categorie?: string
  provincie?: string
  gemeente?: string
  beleidsterrein?: string
  omschrijving?: string
  source?: string
}

interface DetailPanelProps {
  recipientName: string
  moduleId: string
  isOpen: boolean
  onClose: () => void
  onNavigateToModule?: (module: string, recipientName: string) => void
}

// Fields to display per module (component-specific, not shared)
const MODULE_DETAIL_FIELDS: Record<string, string[]> = {
  instrumenten: ['regeling', 'artikel', 'begrotingsnaam', 'instrument'],
  apparaat: ['kostensoort', 'artikel', 'begrotingsnaam'],
  inkoop: ['ministerie', 'categorie'],
  provincie: ['provincie', 'omschrijving'],
  gemeente: ['gemeente', 'beleidsterrein', 'regeling', 'omschrijving'],
  publiek: ['source', 'regeling', 'omschrijving'],
  integraal: [],
}

export function DetailPanel({
  recipientName,
  moduleId,
  isOpen,
  onClose,
  onNavigateToModule,
}: DetailPanelProps) {
  const router = useRouter()
  const [data, setData] = useState<DetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllYears, setShowAllYears] = useState(false)

  // Fetch detail data
  useEffect(() => {
    if (!isOpen || !recipientName) return

    const abortController = new AbortController()

    async function fetchDetail() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/modules/${moduleId}/${encodeURIComponent(recipientName)}/details`,
          { signal: abortController.signal }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch details')
        }

        const json = await response.json()

        // Transform API response - API returns 'details' array, not 'rows'
        const rows = json.details || json.rows || []
        if (rows.length === 0) {
          setData(null)
          return
        }

        // Aggregate years from all rows
        const yearTotals: Record<number, number> = {}
        const detailFields: Record<string, string> = {}
        let totalAmount = 0

        rows.forEach((row: ApiDetailRow) => {
          // Aggregate year amounts
          if (row.years) {
            Object.entries(row.years).forEach(([year, amount]) => {
              const y = parseInt(year, 10)
              const a = Number(amount) || 0
              yearTotals[y] = (yearTotals[y] || 0) + a
              totalAmount += a
            })
          }

          // Capture first non-empty detail fields (from group_value or direct fields)
          if (row.group_by && row.group_value && !detailFields[row.group_by]) {
            detailFields[row.group_by] = row.group_value
          }
          Object.keys(FIELD_LABELS).forEach(field => {
            const value = row[field as keyof ApiDetailRow]
            if (value && typeof value === 'string' && !detailFields[field]) {
              detailFields[field] = value
            }
          })
        })

        // Convert yearTotals to sorted array
        const years = Object.entries(yearTotals)
          .map(([year, amount]) => ({ year: parseInt(year, 10), amount: Number(amount) }))
          .sort((a, b) => a.year - b.year)

        setData({
          primary_value: json.primary_value || recipientName,
          years,
          total: totalAmount,
          row_count: rows.reduce((sum: number, r: ApiDetailRow) => sum + (r.row_count || 1), 0),
          sources: json.sources || [],
          details: detailFields,
        })
      } catch (error) {
        // Ignore abort errors - they're expected when component unmounts or deps change
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setError('Kon gegevens niet laden')
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchDetail()

    return () => {
      abortController.abort()
    }
  }, [isOpen, recipientName, moduleId])

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Generate Google search URL
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(recipientName)}`

  // Handle CSV export
  const handleExport = useCallback(() => {
    if (!data) return

    const headers = ['Jaar', 'Bedrag']
    const rows = data.years.map(y => [y.year.toString(), y.amount.toFixed(2)])
    rows.push(['Totaal', data.total.toFixed(2)])

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    // Sanitize filename to prevent path traversal/injection and CSV formula injection
    const safeFilename = recipientName
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9\s\-_.]/g, '')  // Remove special chars
      .replace(/^[=+@-]/, '_')              // Block CSV formula injection chars at start
      .replace(/\.{2,}/g, '.')              // Block path traversal (..)
      .trim() || 'export'

    const link = document.createElement('a')
    link.href = url
    link.download = `rijksuitgaven-${safeFilename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [data, recipientName])

  // Handle module navigation
  const handleModuleClick = useCallback((module: string) => {
    if (onNavigateToModule) {
      onNavigateToModule(module, recipientName)
    } else {
      router.push(`/${module}?q=${encodeURIComponent(recipientName)}`)
    }
  }, [router, recipientName, onNavigateToModule])

  if (!isOpen) return null

  // Years to display (recent first, optionally limited)
  const displayYears = data?.years
    ? showAllYears
      ? [...data.years].reverse()
      : [...data.years].reverse().slice(0, 5)
    : []
  const hasMoreYears = (data?.years?.length || 0) > 5

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-white shadow-xl z-50 flex flex-col',
          'w-full lg:w-1/2 xl:w-[500px]',
          'transition-transform duration-200',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-light)]">
          <span className="text-sm text-[var(--muted-foreground)]">
            {data ? `${data.row_count} uitgaven aan` : 'Laden...'}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Sluiten"
          >
            <X className="h-5 w-5 text-[var(--navy-dark)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 text-[var(--navy-medium)] animate-spin" aria-hidden="true" />
              <span className="sr-only">Gegevens laden...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <p className="text-[var(--error)] mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[var(--navy-dark)] text-white rounded-lg hover:bg-[var(--navy-medium)] transition-colors"
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="p-6 space-y-6">
              {/* Recipient name */}
              <div>
                <h2
                  className="text-xl font-bold text-[var(--navy-dark)]"
                  style={{ fontFamily: 'var(--font-heading), serif' }}
                >
                  {data.primary_value}
                </h2>
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] mt-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Zoek op Google
                </a>
              </div>

              {/* Year breakdown */}
              <div className="bg-[var(--gray-light)] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider mb-3">
                  Belastinguitgaven
                </h3>
                <div className="space-y-1">
                  {displayYears.map(({ year, amount }) => (
                    <div key={year} className="flex justify-between text-sm">
                      <span className="text-[var(--navy-dark)]">{year}</span>
                      <span className={cn(
                        'font-medium',
                        amount === 0 ? 'text-[var(--muted-foreground)]' : 'text-[var(--navy-dark)]'
                      )}>
                        {formatAmount(amount)}
                      </span>
                    </div>
                  ))}
                  {hasMoreYears && (
                    <button
                      onClick={() => setShowAllYears(!showAllYears)}
                      className="flex items-center gap-1 text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] mt-2"
                    >
                      {showAllYears ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Minder jaren
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Alle {data.years.length} jaren
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="border-t border-[var(--border)] mt-3 pt-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-[var(--navy-dark)]">Totaal</span>
                    <span className="text-[var(--navy-dark)]">{formatAmount(data.total)}</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">Bedragen in &euro;</p>
              </div>

              {/* Detail fields (per module) */}
              {MODULE_DETAIL_FIELDS[moduleId]?.length > 0 && data.details && (
                <div className="space-y-4">
                  {MODULE_DETAIL_FIELDS[moduleId].map(field => {
                    const value = data.details?.[field as keyof typeof data.details]
                    if (!value) return null
                    return (
                      <div key={field} className="bg-[var(--gray-light)] rounded-lg p-4">
                        <h3 className="text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider mb-2">
                          {FIELD_LABELS[field]}
                        </h3>
                        <p className="text-sm text-[var(--navy-dark)]">{value}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cross-module indicator */}
              {data.sources && data.sources.length > 1 && (
                <div className="bg-[var(--blue-light)]/10 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider mb-3">
                    Ook in andere modules
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.sources
                      .filter(s => s !== moduleId)
                      .map(source => (
                        <button
                          key={source}
                          onClick={() => handleModuleClick(source)}
                          className="px-3 py-1.5 text-sm bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--gray-light)] transition-colors text-[var(--navy-dark)]"
                        >
                          {MODULE_LABELS[source] || source}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--gray-light)]">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--navy-dark)] hover:text-white hover:border-[var(--navy-dark)] transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        )}
      </div>
    </>
  )
}
