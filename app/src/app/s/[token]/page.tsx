/**
 * Shared View Page — /s/[token]
 *
 * V2.5 Phase 4a: Subscriber redirect.
 *
 * - Subscriber: redirect to full module page with state reconstructed in URL
 * - Non-subscriber: placeholder with login CTA (Phase 4b: full read-only view)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import Link from 'next/link'

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

function buildRedirectUrl(state: ShareState): string {
  const params = new URLSearchParams()

  if (state.search) params.set('q', state.search)

  // Reconstruct filters as URL params
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

  // Sort (omit defaults)
  if (state.sort_by && state.sort_by !== 'random') {
    params.set('sort', state.sort_by)
    if (state.sort_order === 'asc') params.set('order', 'asc')
  }

  // Columns
  if (state.columns && state.columns.length > 0) {
    params.set('cols', state.columns.join(','))
  }

  // Expanded row
  if (state.expanded) {
    params.set('expand', state.expanded)
    if (state.expanded_grouping) params.set('group', state.expanded_grouping)
  }

  const qs = params.toString()
  return `/${state.module}${qs ? `?${qs}` : ''}`
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

  // Fetch share state (admin client — public endpoint)
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

  // Validate module
  if (!VALID_MODULES.has(link.module)) {
    return <NotFound />
  }

  // Increment view count (fire-and-forget)
  admin.rpc('increment_shared_link_views', { link_token: token }).then(() => {}, () => {})

  // Check if user is authenticated subscriber
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check subscription
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

  // Non-subscriber: show placeholder
  const state = link as ShareState
  const moduleLabel = MODULE_LABELS[state.module] ?? state.module

  return (
    <div className="min-h-screen bg-[var(--gray-light)]" style={{ fontFamily: 'var(--font-body), sans-serif' }}>
      {/* Context bar */}
      <div className="bg-[var(--navy-dark)] text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-sm text-white/60 mb-1">Gedeelde weergave</p>
          <h1 className="text-xl font-semibold">{moduleLabel}</h1>
          {state.search && (
            <p className="mt-2 text-white/80">
              Zoekterm: &ldquo;{state.search}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pink)]/10 mb-4">
              <svg className="w-8 h-8 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--navy-dark)] mb-3">
              Log in om deze weergave te openen
            </h2>
            <p className="text-[var(--navy-dark)]/70 max-w-md mx-auto">
              Deze link bevat een gedeelde weergave uit {moduleLabel}.
              Log in met uw account om de volledige resultaten te bekijken.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--pink)] text-white font-semibold rounded-lg hover:bg-[var(--pink-hover)] transition-colors"
          >
            Inloggen
          </Link>

          <p className="mt-6 text-sm text-[var(--navy-dark)]/50">
            Nog geen account? Neem contact op via{' '}
            <a href="mailto:contact@rijksuitgaven.nl" className="underline hover:text-[var(--navy-dark)]">
              contact@rijksuitgaven.nl
            </a>
          </p>
        </div>
      </div>
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
