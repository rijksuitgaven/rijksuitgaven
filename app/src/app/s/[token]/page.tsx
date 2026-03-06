/**
 * Shared View Page — /s/[token]
 *
 * V2.5 Phase 4a+4b:
 * - Subscriber: redirect to full module page with state reconstructed in URL
 * - Non-subscriber: read-only table with 25 rows, context banner, conversion CTA
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { BACKEND_API_URL, BFF_SECRET } from '@/app/api/_lib/proxy'
import { formatAmount } from '@/lib/format'
import { Link2, ArrowRight, Search, SlidersHorizontal, Download, BarChart3, Lock } from 'lucide-react'
import Link from 'next/link'

const PUBLIC_ROW_LIMIT = 25

const VALID_MODULES = new Set([
  'instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek', 'integraal',
])

const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Financiële Instrumenten',
  apparaat: 'Apparaatskosten',
  inkoop: 'Inkoopuitgaven',
  provincie: 'Provinciale Subsidieregisters',
  gemeente: 'Gemeentelijke Subsidieregisters',
  publiek: 'Publiek',
  integraal: 'Doorzoek Ontvangers',
}

const PRIMARY_COLUMN_NAMES: Record<string, string> = {
  instrumenten: 'Ontvanger',
  apparaat: 'Kostensoort',
  inkoop: 'Leverancier',
  provincie: 'Ontvanger',
  gemeente: 'Ontvanger',
  publiek: 'Ontvanger',
  integraal: 'Ontvanger',
}

interface ShareState {
  module: string
  search: string | null
  filters: Record<string, unknown>
  sort_by: string
  sort_order: string
  columns: string[]
  expanded: string | null
  expanded_grouping: string | null
  expanded_columns: string[] | null
  created_at: string
}

interface ApiRow {
  primary_value: string
  years: Record<string, number>
  totaal: number
  extra_columns?: Record<string, string | null>
  matched_field?: string | null
  matched_value?: string | null
}

interface ApiResponse {
  success: boolean
  data: ApiRow[]
  meta: {
    total: number
    years: number[]
  }
}

function buildRedirectUrl(state: ShareState): string {
  const params = new URLSearchParams()
  if (state.search) params.set('q', state.search)
  if (state.filters && typeof state.filters === 'object') {
    for (const [key, value] of Object.entries(state.filters)) {
      if (key === 'jaar' && value) {
        params.set('jaar', String(value))
      } else if (key === 'min_bedrag' && value) {
        params.set('min_bedrag', String(value))
      } else if (key === 'max_bedrag' && value) {
        params.set('max_bedrag', String(value))
      } else if (Array.isArray(value) && value.length > 0) {
        value.forEach(v => params.append(key, String(v)))
      }
    }
  }
  if (state.sort_by && state.sort_by !== 'random') {
    params.set('sort', state.sort_by)
    if (state.sort_order === 'asc') params.set('order', 'asc')
  }
  if (state.columns && state.columns.length > 0) {
    params.set('cols', state.columns.join(','))
  }
  if (state.expanded) {
    params.set('expand', state.expanded)
    if (state.expanded_grouping) params.set('group', state.expanded_grouping)
  }
  const qs = params.toString()
  return `/${state.module}${qs ? `?${qs}` : ''}`
}

function buildBackendParams(state: ShareState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('limit', String(PUBLIC_ROW_LIMIT))
  params.set('offset', '0')
  if (state.search) params.set('q', state.search)
  if (state.sort_by) params.set('sort_by', state.sort_by)
  if (state.sort_order) params.set('sort_order', state.sort_order)
  if (state.filters && typeof state.filters === 'object') {
    for (const [key, value] of Object.entries(state.filters)) {
      if (value === null || value === undefined) continue
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)))
      } else {
        params.set(key, String(value))
      }
    }
  }
  if (state.columns && state.columns.length > 0) {
    params.set('columns', state.columns.join(','))
  }
  return params
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function SharedViewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token || token.length > 50) {
    return <NotFound />
  }

  // Fetch share state
  const admin = createAdminClient()
  const { data: link, error } = await admin
    .from('shared_links')
    .select('module, search, filters, sort_by, sort_order, columns, expanded, expanded_grouping, expanded_columns, created_at')
    .eq('token', token)
    .is('deleted_at', null)
    .single()

  if (error || !link) {
    return <NotFound />
  }

  if (!VALID_MODULES.has(link.module)) {
    return <NotFound />
  }

  // Increment view count (fire-and-forget)
  admin.rpc('increment_shared_link_views', { link_token: token }).then(() => {}, () => {})

  // Check if user is authenticated subscriber → redirect
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('role, cancelled_at, grace_ends_at')
      .eq('user_id', user.id)
      .single()

    if (sub) {
      const today = new Date().toISOString().split('T')[0]
      const isActive = sub.role === 'admin' || (!sub.cancelled_at && today <= sub.grace_ends_at)
      if (isActive) {
        redirect(buildRedirectUrl(link as ShareState))
      }
    }
  }

  // Non-subscriber: fetch data from backend and render read-only view
  const state = link as ShareState
  const moduleLabel = MODULE_LABELS[state.module] ?? state.module
  const primaryColumn = PRIMARY_COLUMN_NAMES[state.module] ?? 'Ontvanger'

  let rows: ApiRow[] = []
  let totalRows = 0
  let years: number[] = []

  try {
    const backendParams = buildBackendParams(state)
    const url = `${BACKEND_API_URL}/api/v1/modules/${state.module}?${backendParams.toString()}`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(BFF_SECRET && { 'X-BFF-Secret': BFF_SECRET }),
      },
      cache: 'no-store',
    })

    if (res.ok) {
      const data: ApiResponse = await res.json()
      rows = data.data ?? []
      totalRows = data.meta?.total ?? 0
      years = (data.meta?.years ?? []).sort((a, b) => a - b)
    }
  } catch {
    // Backend unavailable — show empty table
  }

  // Determine which year columns to show (last 4 + total)
  const displayYears = years.length > 4 ? years.slice(-4) : years
  const hasMoreRows = totalRows > PUBLIC_ROW_LIMIT

  // Build filter chips for display
  const filterChips: string[] = []
  if (state.filters && typeof state.filters === 'object') {
    for (const [key, value] of Object.entries(state.filters)) {
      if (key === 'jaar' && value) filterChips.push(`Jaar: ${value}`)
      else if (key === 'min_bedrag' && value) filterChips.push(`Min: €${formatAmount(Number(value))}`)
      else if (key === 'max_bedrag' && value) filterChips.push(`Max: €${formatAmount(Number(value))}`)
      else if (Array.isArray(value) && value.length > 0) {
        filterChips.push(`${key}: ${value.length === 1 ? value[0] : `${value.length} filters`}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      {/* Share context banner */}
      <div className="px-6" style={{ background: 'var(--navy-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(230,45,117,0.15)', border: '1px solid rgba(230,45,117,0.25)' }}>
              <Link2 className="w-3.5 h-3.5" style={{ color: 'var(--pink)' }} />
            </div>
            <span className="text-[13px] text-white/90 font-medium">
              <strong className="text-white font-semibold">Gedeelde weergave</strong>
              <span className="text-white/25 mx-1.5">&middot;</span>
              {moduleLabel}
              {state.search && (
                <>
                  <span className="text-white/25 mx-1.5">&middot;</span>
                  &ldquo;{state.search}&rdquo;
                </>
              )}
            </span>
          </div>
          <span className="text-xs text-white/40 whitespace-nowrap shrink-0 hidden sm:inline">
            Gedeeld op {formatDate(state.created_at)}
          </span>
        </div>
      </div>

      {/* Conversion strip */}
      <div className="px-6 border-b" style={{ background: '#fdf0f3', borderColor: '#f5c6d0' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2 gap-4">
          <span className="text-[13px]" style={{ color: 'var(--navy-dark)' }}>
            <strong className="font-semibold">U bekijkt een gedeeld overzicht.</strong>{' '}
            Wilt u zelf zoeken, filteren en exporteren?
          </span>
          <Link
            href="/#aanmelden"
            className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold px-4 py-1.5 rounded-md whitespace-nowrap transition-all no-underline"
            style={{ background: 'var(--pink)' }}
          >
            Probeer gratis
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter chips (if any) */}
      {filterChips.length > 0 && (
        <div className="px-6">
          <div className="max-w-7xl mx-auto py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--navy-dark)]/50">Filters:</span>
            {filterChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-white border border-[var(--border)] rounded-full text-[var(--navy-dark)]">
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto pt-4 pb-2">
          <p className="text-sm text-[var(--navy-dark)]/70">
            {totalRows > 0 ? (
              <>
                {totalRows.toLocaleString('nl-NL')} resultaten
                {state.search && <> voor &ldquo;{state.search}&rdquo;</>}
                {hasMoreRows && <> — eerste {PUBLIC_ROW_LIMIT} getoond</>}
              </>
            ) : (
              'Geen resultaten'
            )}
          </p>
        </div>
      </div>

      {/* Data table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--navy-dark)] text-white text-left">
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{primaryColumn}</th>
                {state.search && (
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Komt ook voor in</th>
                )}
                {displayYears.map(year => (
                  <th key={year} className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">{year}</th>
                ))}
                <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap" style={{ background: 'var(--navy-medium)' }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={displayYears.length + 2 + (state.search ? 1 : 0)} className="px-4 py-12 text-center text-[var(--navy-dark)]/50">
                    Geen resultaten gevonden
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[var(--gray-light)]/50'}>
                    <td className="px-4 py-2 font-medium text-[var(--navy-dark)] max-w-[280px] truncate">
                      {row.primary_value}
                    </td>
                    {state.search && (
                      <td className="px-4 py-2 text-xs text-[var(--navy-dark)]/50 max-w-[180px] truncate">
                        {row.matched_field && row.matched_value
                          ? `${row.matched_field}: ${row.matched_value}`
                          : ''}
                      </td>
                    )}
                    {displayYears.map(year => (
                      <td key={year} className="px-4 py-2 text-right tabular-nums text-[var(--navy-dark)]/80">
                        {formatAmount(row.years?.[String(year)] ?? 0)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-[var(--navy-dark)]" style={{ background: idx % 2 === 0 ? 'rgba(0,31,63,0.03)' : 'rgba(0,31,63,0.06)' }}>
                      {formatAmount(row.totaal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* "More rows" indicator */}
        {hasMoreRows && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border)] rounded-full shadow-sm">
              <Lock className="w-3.5 h-3.5 text-[var(--pink)]" />
              <span className="text-sm text-[var(--navy-dark)]">
                Nog <strong>{(totalRows - PUBLIC_ROW_LIMIT).toLocaleString('nl-NL')}</strong> resultaten
              </span>
            </div>
          </div>
        )}

        {/* Bottom upsell */}
        <div className="mt-10 bg-white rounded-xl border border-[var(--border)] shadow-sm p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold text-[var(--navy-dark)] mb-2">
              Zelf zoeken in €1,75 biljoen aan rijksuitgaven?
            </h2>
            <p className="text-[var(--navy-dark)]/60 mb-6">
              Met een account kunt u zelf zoeken, filteren, vergelijken en exporteren.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Search, label: 'Zoeken in alle modules' },
                { icon: SlidersHorizontal, label: 'Geavanceerde filters' },
                { icon: Download, label: 'CSV & Excel export' },
                { icon: BarChart3, label: 'Jaar-op-jaar analyse' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[var(--gray-light)]">
                  <Icon className="w-5 h-5 text-[var(--pink)]" />
                  <span className="text-xs text-[var(--navy-dark)]/70 text-center">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/#aanmelden"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--pink)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Probeer gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border)] text-[var(--navy-dark)] font-medium rounded-lg hover:bg-[var(--gray-light)] transition-colors"
              >
                Inloggen
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--gray-light)] flex items-center justify-center" style={{ fontFamily: 'var(--font-body), sans-serif' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-3">Link niet gevonden</h1>
        <p className="text-[var(--navy-dark)]/70 mb-6">
          Deze deellink bestaat niet of is verlopen.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--navy-dark)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Naar de homepage
        </Link>
      </div>
    </div>
  )
}
