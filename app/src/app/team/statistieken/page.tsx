'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  BarChart3, Search, Download, MousePointerClick, Users, AlertTriangle,
  ChevronDown, ChevronRight, Eye, SlidersHorizontal, Columns, Clock,
  ArrowUpDown, ArrowRight, Sparkles, ChevronsRight, Trash2, CheckCircle,
  ExternalLink, Copy, Check, TrendingUp, TrendingDown, Minus, Timer,
  Target, LogOut, Activity,
} from 'lucide-react'

// --- Constants ---

const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  publiek: 'Publiek',
  integraal: 'Integraal',
}

const FIELD_LABELS: Record<string, string> = {
  begrotingsnaam: 'Begrotingsnaam',
  artikel: 'Artikel',
  artikelonderdeel: 'Artikelonderdeel',
  instrument: 'Instrument',
  regeling: 'Regeling',
  kostensoort: 'Kostensoort',
  detail: 'Detail',
  ministerie: 'Ministerie',
  categorie: 'Categorie',
  staffel: 'Staffel',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  omschrijving: 'Omschrijving',
  beleidsterrein: 'Beleidsterrein',
  organisatie: 'Organisatie',
  trefwoorden: 'Trefwoorden',
  sectoren: 'Sectoren',
  onderdeel: 'Onderdeel',
  source: 'Bron',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  module_view: 'Module bekijken',
  search: 'Zoeken',
  row_expand: 'Rij uitklappen',
  filter_apply: 'Filteren',
  export: 'Exporteren',
  column_change: 'Kolommen',
  autocomplete_search: 'Autocomplete',
  autocomplete_click: 'Autocomplete klik',
  cross_module_nav: 'Cross-module',
  sort_change: 'Sorteren',
  page_change: 'Pagineren',
  external_link: 'Externe link',
  error: 'Fout',
}

const DATE_RANGES = [
  { label: '7 dagen', value: 7 },
  { label: '30 dagen', value: 30 },
  { label: '90 dagen', value: 90 },
  { label: 'Alles', value: 365 },
]

// --- Types ---

interface PulseItem {
  event_type: string
  event_count: number
  unique_actors: number
}

interface ModuleItem {
  module: string
  view_count: number
  unique_actors: number
}

interface SearchItem {
  query: string
  search_count: number
  unique_actors: number
  avg_results: number
  top_module: string
}

interface FilterItem {
  module: string
  field: string
  filter_count: number
}

interface ColumnItem {
  module: string
  column_name: string
  usage_count: number
}

interface ExportItem {
  module: string
  format: string
  export_count: number
  avg_rows: number
  unique_actors: number
}

interface ZeroResultItem {
  query: string
  search_count: number
  top_module: string
}

interface ErrorItem {
  module: string
  message: string
  properties: Record<string, unknown>
  actor_hash: string
  created_at: string
}

interface ActorItem {
  actor_hash: string
  last_seen: string
  event_count: number
  top_module: string | null
  search_count: number
  export_count: number
  external_link_count: number
  module_count: number
  // V3 enhanced fields
  session_count: number
  avg_session_seconds: number
  engagement_score: number
  avg_gap_days: number
  gap_trend: string
  user_name: string | null
  user_email: string | null
}

interface ActorDetailEvent {
  event_type: string
  module: string | null
  properties: Record<string, unknown>
  created_at: string
}

interface SessionsSummary {
  total_sessions: number
  unique_actors: number
  avg_duration_seconds: number
  avg_events_per_session: number
  avg_modules_per_session: number
}

interface ExitIntentItem {
  last_event_type: string
  session_count: number
  percentage: number
}

interface SearchSuccess {
  total_searches: number
  successful_searches: number
  success_rate: number
}

interface RetentionItem {
  cohort_month: string
  month_offset: number
  active_count: number
  cohort_size: number
  retention_rate: number
}

interface StatsData {
  days: number
  total_members: number
  pulse: PulseItem[]
  modules: ModuleItem[]
  searches: SearchItem[]
  filters: FilterItem[]
  columns: ColumnItem[]
  exports: ExportItem[]
  zero_results: ZeroResultItem[]
  actors: ActorItem[]
  errors: ErrorItem[]
  // V3 analytics
  sessions_summary: SessionsSummary | null
  exit_intent: ExitIntentItem[]
  search_success: SearchSuccess | null
  retention: RetentionItem[]
}

// --- Helpers ---

function getPulseValue(pulse: PulseItem[], eventType: string): { count: number; actors: number } {
  const item = pulse.find(p => p.event_type === eventType)
  return { count: item?.event_count ?? 0, actors: item?.unique_actors ?? 0 }
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 5) return 'Nu'
  if (diffMin < 60) return `${diffMin} min geleden`
  if (diffHr < 24) return `${diffHr} uur geleden`
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
  return `${Math.floor(diffDays / 30)} maanden geleden`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min} min`
  const hr = Math.floor(min / 60)
  return `${hr}u ${min % 60}m`
}

function getActivityColor(lastSeen: string): 'green' | 'amber' | 'gray' {
  const diffHours = (Date.now() - new Date(lastSeen).getTime()) / 3600000
  if (diffHours < 24) return 'green'
  if (diffHours < 168) return 'amber'
  return 'gray'
}

const ACTIVITY_DOT_COLORS = {
  green: 'bg-[var(--success)]',
  amber: 'bg-amber-400',
  gray: 'bg-gray-300',
}

function getEngagementLabel(score: number, actors: ActorItem[]): { label: string; color: string } {
  // Determine percentile rank among all actors
  const scores = actors.map(a => a.engagement_score).sort((a, b) => a - b)
  const rank = scores.filter(s => s <= score).length / scores.length

  // At risk: last seen > 7 days ago is handled separately in the UI
  if (rank >= 0.67) return { label: 'Power', color: 'text-green-700 bg-green-50 border-green-200' }
  if (rank >= 0.33) return { label: 'Regulier', color: 'text-[var(--navy-dark)] bg-[var(--gray-light)] border-[var(--border)]' }
  return { label: 'Casual', color: 'text-amber-700 bg-amber-50 border-amber-200' }
}

function formatEventLine(event: ActorDetailEvent): { icon: React.ReactNode; text: string; time: string } {
  const mod = MODULE_LABELS[event.module || ''] || event.module || ''
  const time = new Date(event.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(event.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const timestamp = `${date} ${time}`
  const props = event.properties || {}

  switch (event.event_type) {
    case 'search':
      return {
        icon: <Search className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Zocht "${props.query}" in ${mod} — ${props.result_count ?? 0} resultaten`,
        time: timestamp,
      }
    case 'module_view':
      return {
        icon: <Eye className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Bekeek ${mod}`,
        time: timestamp,
      }
    case 'row_expand':
      return {
        icon: <ChevronDown className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Klapte uit: ${props.recipient || 'onbekend'}`,
        time: timestamp,
      }
    case 'export':
      return {
        icon: <Download className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Exporteerde ${(props.format as string || '').toUpperCase()} (${props.row_count ?? 0} rijen) uit ${mod}`,
        time: timestamp,
      }
    case 'filter_apply':
      return {
        icon: <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Filter: ${FIELD_LABELS[props.field as string] || props.field} in ${mod}`,
        time: timestamp,
      }
    case 'column_change':
      return {
        icon: <Columns className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Kolommen gewijzigd in ${mod}`,
        time: timestamp,
      }
    case 'autocomplete_search':
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Autocomplete: "${props.query}" — ${props.result_count ?? 0} suggesties`,
        time: timestamp,
      }
    case 'autocomplete_click':
      return {
        icon: <ArrowRight className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Klikte op ${props.result_type === 'recipient' ? 'ontvanger' : 'zoekterm'}: "${props.selected_value}" → ${MODULE_LABELS[(props.target_module as string) || ''] || props.target_module}`,
        time: timestamp,
      }
    case 'cross_module_nav':
      return {
        icon: <ChevronsRight className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `${mod} → ${MODULE_LABELS[(props.target_module as string) || ''] || props.target_module}: "${props.recipient}"`,
        time: timestamp,
      }
    case 'sort_change':
      return {
        icon: <ArrowUpDown className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Sorteerde op ${FIELD_LABELS[(props.column as string)] || props.column} (${props.direction === 'asc' ? 'oplopend' : 'aflopend'}) in ${mod}`,
        time: timestamp,
      }
    case 'page_change':
      return {
        icon: <ChevronsRight className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Pagina ${props.page} in ${mod}`,
        time: timestamp,
      }
    case 'external_link':
      return {
        icon: <ExternalLink className="w-3.5 h-3.5 text-[var(--navy-medium)]" />,
        text: `Zoek op Google: "${props.recipient}" vanuit ${props.origin === 'detail_panel' ? 'detailpaneel' : mod}`,
        time: timestamp,
      }
    case 'error':
      return {
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[var(--error)]" />,
        text: `Fout in ${mod}: ${props.message}`,
        time: timestamp,
      }
    default:
      return { icon: null, text: event.event_type, time: timestamp }
  }
}

// --- Main Page ---

export default function StatistiekenPage() {
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [expandedActor, setExpandedActor] = useState<string | null>(null)
  const [actorDetail, setActorDetail] = useState<ActorDetailEvent[] | null>(null)
  const [actorDetailLoading, setActorDetailLoading] = useState(false)
  const [sortField, setSortField] = useState<string>('engagement_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Fetch dashboard data
  useEffect(() => {
    if (!subLoading && role === 'admin') {
      setLoading(true)
      setExpandedActor(null)
      setActorDetail(null)
      fetch(`/api/v1/team/statistieken?days=${days}`)
        .then(res => res.json())
        .then(d => {
          setData(d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [subLoading, role, days])

  // Fetch actor detail when expanded
  useEffect(() => {
    if (!expandedActor) {
      setActorDetail(null)
      return
    }
    setActorDetailLoading(true)
    fetch(`/api/v1/team/statistieken?actor=${expandedActor}&days=${days}`)
      .then(res => res.json())
      .then(d => {
        setActorDetail(d.events ?? [])
        setActorDetailLoading(false)
      })
      .catch(() => {
        setActorDetail([])
        setActorDetailLoading(false)
      })
  }, [expandedActor, days])

  const toggleActor = useCallback((hash: string) => {
    setExpandedActor(prev => prev === hash ? null : hash)
  }, [])

  const clearOneError = useCallback((createdAt: string) => {
    fetch(`/api/v1/team/statistieken?created_at=${encodeURIComponent(createdAt)}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok && data) {
          setData({ ...data, errors: data.errors.filter(e => e.created_at !== createdAt) })
        }
      })
      .catch(() => {})
  }, [data])

  const clearAllErrors = useCallback(() => {
    fetch(`/api/v1/team/statistieken`, { method: 'DELETE' })
      .then(res => {
        if (res.ok && data) {
          setData({ ...data, errors: [] })
        }
      })
      .catch(() => {})
  }, [data])

  const handleSort = useCallback((field: string) => {
    setSortDir(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc')
    setSortField(field)
  }, [sortField])

  if (subLoading) return null
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <p className="text-[var(--error)]">Geen toegang</p>
      </div>
    )
  }

  const searches = getPulseValue(data?.pulse ?? [], 'search')
  const exports = getPulseValue(data?.pulse ?? [], 'export')
  const expands = getPulseValue(data?.pulse ?? [], 'row_expand')
  const moduleViews = getPulseValue(data?.pulse ?? [], 'module_view')
  const externalLinks = getPulseValue(data?.pulse ?? [], 'external_link')
  const errorCount = data?.errors?.length ?? 0
  const maxViews = data?.modules.length ? Math.max(...data.modules.map(m => m.view_count)) : 1
  const ss = data?.sessions_summary
  const sc = data?.search_success

  // Sort actors
  const sortedActors = [...(data?.actors ?? [])].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'user_name': {
        const na = a.user_name || a.user_email || a.actor_hash
        const nb = b.user_name || b.user_email || b.actor_hash
        return dir * na.localeCompare(nb)
      }
      case 'last_seen': return dir * (new Date(a.last_seen).getTime() - new Date(b.last_seen).getTime())
      case 'session_count': return dir * (a.session_count - b.session_count)
      case 'engagement_score': return dir * (a.engagement_score - b.engagement_score)
      case 'avg_gap_days': return dir * (a.avg_gap_days - b.avg_gap_days)
      case 'top_module': return dir * ((a.top_module ?? '').localeCompare(b.top_module ?? ''))
      case 'search_count': return dir * (a.search_count - b.search_count)
      case 'export_count': return dir * (a.export_count - b.export_count)
      case 'external_link_count': return dir * (a.external_link_count - b.external_link_count)
      default: return dir * (a.engagement_score - b.engagement_score)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <TeamNav />

        {/* Header + date range */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[var(--navy-dark)]">Gebruiksstatistieken</h1>
          <div className="flex gap-1 bg-white rounded-lg border border-[var(--border)] p-1">
            {DATE_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  days === range.value
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'text-[var(--navy-medium)] hover:bg-[var(--gray-light)]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg border border-[var(--border)] p-4 animate-pulse">
                  <div className="h-4 bg-[var(--gray-light)] rounded w-24 mb-2" />
                  <div className="h-8 bg-[var(--gray-light)] rounded w-16" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-[var(--border)] p-6 animate-pulse">
              <div className="h-5 bg-[var(--gray-light)] rounded w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-[var(--gray-light)] rounded" />)}
              </div>
            </div>
          </div>
        ) : data ? (
          <>
            {/* ═══ ACT 1: PULSE ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PulseCard
                icon={<Users className="w-4 h-4" />}
                label="Actieve gebruikers"
                value={moduleViews.actors}
                subtext={`van ${data.total_members} leden`}
              />
              <PulseCard
                icon={<Activity className="w-4 h-4" />}
                label="Sessies"
                value={ss?.total_sessions ?? 0}
                subtext={ss ? `gem. ${formatDuration(ss.avg_duration_seconds)}` : 'geen data'}
              />
              <PulseCard
                icon={<Search className="w-4 h-4" />}
                label="Zoekopdrachten"
                value={searches.count}
                subtext={`${searches.actors} unieke gebruikers`}
              />
              <PulseCard
                icon={<Target className="w-4 h-4" />}
                label="Zoeksucces"
                value={sc ? `${sc.success_rate}%` : '—'}
                subtext={sc ? `${sc.successful_searches} van ${sc.total_searches}` : 'geen data'}
                isString
              />
              <PulseCard
                icon={<Download className="w-4 h-4" />}
                label="Exports"
                value={exports.count}
                subtext={(() => {
                  const byFormat = new Map<string, number>()
                  for (const e of data.exports) {
                    byFormat.set(e.format, (byFormat.get(e.format) ?? 0) + e.export_count)
                  }
                  return [...byFormat.entries()].map(([f, c]) => `${c} ${f.toUpperCase()}`).join(', ') || 'geen'
                })()}
              />
              <PulseCard
                icon={<MousePointerClick className="w-4 h-4" />}
                label="Rij-uitklappingen"
                value={expands.count}
                subtext={`${expands.actors} unieke gebruikers`}
              />
              <PulseCard
                icon={<ExternalLink className="w-4 h-4" />}
                label="Externe links"
                value={externalLinks.count}
                subtext={`${externalLinks.actors} unieke gebruikers`}
              />
              {errorCount > 0 && (
                <PulseCard
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="Fouten"
                  value={errorCount}
                  subtext={`${new Set(data.errors.map(e => e.module)).size} modules`}
                  variant="error"
                />
              )}
            </div>

            {/* ═══ ERRORS SECTION ═══ */}
            <ErrorsSection errors={data.errors} onClearOne={clearOneError} onClearAll={clearAllErrors} />

            {/* ═══ ACT 2: INZICHTEN ═══ */}

            {/* Search insights + exit intent side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Search insights — 2/3 width */}
              <div className="lg:col-span-2">
                <Section title="Wat zoeken gebruikers?" icon={<Search className="w-4 h-4" />}>
                  {data.searches.length === 0 && data.zero_results.length === 0 ? (
                    <EmptyState>Nog geen zoekopdrachten geregistreerd</EmptyState>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                          <th className="pb-2 pr-4">Zoekterm</th>
                          <th className="pb-2 pr-4 text-right">Resultaten</th>
                          <th className="pb-2 pr-4 text-right">Aantal</th>
                          <th className="pb-2 pr-4 text-right">Gebruikers</th>
                          <th className="pb-2">Module</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.searches.map((s, i) => (
                          <tr key={`s-${i}`} className="border-t border-[var(--border)]">
                            <td className="py-2 pr-4 font-medium text-[var(--navy-dark)]">{s.query}</td>
                            <td className="py-2 pr-4 text-right text-[var(--navy-medium)]">
                              {Number(s.avg_results).toLocaleString('nl-NL')}
                            </td>
                            <td className="py-2 pr-4 text-right">{s.search_count}</td>
                            <td className="py-2 pr-4 text-right">{s.unique_actors}</td>
                            <td className="py-2">
                              <ModuleBadge module={s.top_module} />
                            </td>
                          </tr>
                        ))}
                        {data.zero_results.length > 0 && (
                          <>
                            <tr>
                              <td colSpan={5} className="pt-3 pb-1">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                                    Niet gevonden
                                  </span>
                                  <div className="flex-1 border-t border-amber-200" />
                                </div>
                              </td>
                            </tr>
                            {data.zero_results.map((z, i) => (
                              <tr key={`z-${i}`} className="border-t border-amber-100 bg-amber-50/50">
                                <td className="py-2 pr-4 font-medium text-amber-700">{z.query}</td>
                                <td className="py-2 pr-4 text-right">
                                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-amber-700 bg-amber-100 rounded">
                                    0
                                  </span>
                                </td>
                                <td className="py-2 pr-4 text-right text-amber-600">{z.search_count}</td>
                                <td className="py-2 pr-4 text-right text-amber-600">—</td>
                                <td className="py-2">
                                  <ModuleBadge module={z.top_module} variant="amber" />
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  )}
                </Section>
              </div>

              {/* Exit intent — 1/3 width */}
              <Section title="Waar stoppen sessies?" icon={<LogOut className="w-4 h-4" />}>
                {data.exit_intent.length === 0 ? (
                  <EmptyState>Nog geen sessiedata</EmptyState>
                ) : (
                  <div className="space-y-2">
                    {data.exit_intent.map((ei, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-28 text-sm text-[var(--navy-dark)] truncate">
                          {EVENT_TYPE_LABELS[ei.last_event_type] || ei.last_event_type}
                        </span>
                        <div className="flex-1 h-5 bg-[var(--gray-light)] rounded overflow-hidden">
                          <div
                            className="h-full bg-[var(--navy-medium)] rounded transition-all"
                            style={{ width: `${ei.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[var(--navy-dark)] w-12 text-right">
                          {ei.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Platform usage — modules + filters + exports */}
            <Section title="Hoe wordt het platform gebruikt?" icon={<BarChart3 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Module popularity */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                    Modules
                  </h3>
                  {data.modules.length === 0 ? (
                    <EmptyState>Nog geen moduleweergaven</EmptyState>
                  ) : (
                    <div className="space-y-2">
                      {data.modules.map(m => (
                        <div key={m.module} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-[var(--navy-dark)] font-medium truncate">
                            {MODULE_LABELS[m.module] || m.module}
                          </span>
                          <div className="flex-1 h-5 bg-[var(--gray-light)] rounded overflow-hidden">
                            <div
                              className="h-full bg-[var(--navy-medium)] rounded transition-all"
                              style={{ width: `${(m.view_count / maxViews) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[var(--navy-dark)] w-8 text-right">
                            {m.view_count}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] w-24">
                            ({m.unique_actors} gebruiker{m.unique_actors !== 1 ? 's' : ''})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Filters, columns, exports stacked — grouped by module */}
                <div className="space-y-5">
                  <ModuleGroupedList
                    title="Meest gebruikte filters"
                    items={data.filters}
                    getModule={f => f.module}
                    renderItem={f => (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--navy-dark)]">{FIELD_LABELS[f.field] || f.field}</span>
                        <span className="font-medium text-[var(--navy-medium)]">{f.filter_count}×</span>
                      </div>
                    )}
                    emptyText="Nog geen filters gebruikt"
                  />
                  <ModuleGroupedList
                    title="Kolommen"
                    subtitle="Kolommen die gebruikers selecteren — informeert standaardconfiguratie"
                    items={data.columns}
                    getModule={c => c.module}
                    renderItem={c => (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--navy-dark)]">{FIELD_LABELS[c.column_name] || c.column_name}</span>
                        <span className="font-medium text-[var(--navy-medium)]">{c.usage_count}×</span>
                      </div>
                    )}
                    emptyText="Nog geen kolommen geselecteerd"
                  />
                  <ModuleGroupedList
                    title="Exports"
                    items={data.exports}
                    getModule={e => e.module}
                    renderItem={e => (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--navy-dark)]">
                          <span className="text-xs font-bold uppercase bg-[var(--gray-light)] px-1.5 py-0.5 rounded mr-2">{e.format}</span>
                          {e.export_count}× <span className="text-[var(--muted-foreground)]">gem. {e.avg_rows} rijen</span>
                        </span>
                      </div>
                    )}
                    emptyText="Nog geen exports"
                  />
                </div>
              </div>
            </Section>

            {/* Retention cohorts */}
            {data.retention.length > 0 && (
              <RetentionSection retention={data.retention} />
            )}

            {/* ═══ ACT 3: GEBRUIKERS ═══ */}
            <Section title="Gebruikers" icon={<Users className="w-4 h-4" />}>
              {data.actors.length === 0 ? (
                <EmptyState>Nog geen gebruikersactiviteit geregistreerd</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="pb-2 w-8" />
                        <SortHeader field="user_name" label="Gebruiker" current={sortField} dir={sortDir} onSort={handleSort} />
                        <SortHeader field="last_seen" label="Laatst actief" current={sortField} dir={sortDir} onSort={handleSort} />
                        <SortHeader field="session_count" label="Sessies" current={sortField} dir={sortDir} onSort={handleSort} align="right" />
                        <SortHeader field="engagement_score" label="Score" current={sortField} dir={sortDir} onSort={handleSort} align="right" />
                        <SortHeader field="avg_gap_days" label="Trend" current={sortField} dir={sortDir} onSort={handleSort} />
                        <SortHeader field="top_module" label="Top module" current={sortField} dir={sortDir} onSort={handleSort} />
                        <SortHeader field="search_count" label="Zoeken" current={sortField} dir={sortDir} onSort={handleSort} align="right" />
                        <SortHeader field="external_link_count" label="Google" current={sortField} dir={sortDir} onSort={handleSort} align="right" />
                        <SortHeader field="export_count" label="Exports" current={sortField} dir={sortDir} onSort={handleSort} align="right" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedActors.map((actor) => {
                        const isExpanded = expandedActor === actor.actor_hash
                        const color = getActivityColor(actor.last_seen)

                        return (
                          <ActorRow
                            key={actor.actor_hash}
                            actor={actor}
                            allActors={data.actors}
                            isExpanded={isExpanded}
                            color={color}
                            onToggle={() => toggleActor(actor.actor_hash)}
                            detail={isExpanded ? actorDetail : null}
                            detailLoading={isExpanded && actorDetailLoading}
                          />
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            Fout bij ophalen statistieken
          </div>
        )}
      </main>
    </div>
  )
}

// --- Subcomponents ---

function PulseCard({ icon, label, value, subtext, variant, isString }: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtext: string
  variant?: 'error'
  isString?: boolean
}) {
  const isError = variant === 'error'
  return (
    <div className={`rounded-lg border p-4 ${
      isError
        ? 'bg-red-50 border-red-200'
        : 'bg-white border-[var(--border)]'
    }`}>
      <div className={`flex items-center gap-2 mb-1 ${isError ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${isError ? 'text-red-700' : 'text-[var(--navy-dark)]'}`}>
        {isString ? value : (typeof value === 'number' ? value.toLocaleString('nl-NL') : value)}
      </div>
      <div className={`text-xs mt-0.5 ${isError ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`}>{subtext}</div>
    </div>
  )
}

function Section({ title, icon, children }: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[var(--navy-medium)]">{icon}</span>}
        <h2 className="text-sm font-semibold text-[var(--navy-dark)] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[var(--muted-foreground)] italic py-4 text-center">{children}</p>
  )
}

function ModuleBadge({ module, small, variant }: {
  module: string
  small?: boolean
  variant?: 'amber'
}) {
  const label = MODULE_LABELS[module] || module
  if (variant === 'amber') {
    return (
      <span className={`inline-block ${small ? 'text-[10px] px-1 py-0' : 'text-xs px-1.5 py-0.5'} rounded font-medium bg-amber-100 text-amber-700`}>
        {label}
      </span>
    )
  }
  return (
    <span className={`inline-block ${small ? 'text-[10px] px-1 py-0' : 'text-xs px-1.5 py-0.5'} rounded font-medium bg-[var(--gray-light)] text-[var(--navy-medium)]`}>
      {label}
    </span>
  )
}

function ModuleGroupedList<T>({ title, subtitle, items, getModule, renderItem, emptyText }: {
  title: string
  subtitle?: string
  items: T[]
  getModule: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  emptyText: string
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-[var(--muted-foreground)] mb-2">{subtitle}</p>}
        <p className="text-sm text-[var(--muted-foreground)] italic">{emptyText}</p>
      </div>
    )
  }

  // Group items by module
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const mod = getModule(item)
    if (!grouped.has(mod)) grouped.set(mod, [])
    grouped.get(mod)!.push(item)
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-[var(--muted-foreground)] mb-2">{subtitle}</p>}
      <div className="space-y-2.5">
        {[...grouped.entries()].map(([mod, modItems]) => (
          <div key={mod}>
            <div className="text-xs font-semibold text-[var(--navy-dark)] mb-1">
              {MODULE_LABELS[mod] || mod}
            </div>
            <div className="space-y-0.5 pl-3 border-l-2 border-[var(--border)]">
              {modItems.map((item, i) => (
                <div key={i}>{renderItem(item)}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RetentionSection({ retention }: { retention: RetentionItem[] }) {
  // Build cohort grid: rows = cohort months, columns = month offsets
  const cohorts = [...new Set(retention.map(r => r.cohort_month))].sort()
  const maxOffset = Math.max(...retention.map(r => r.month_offset), 0)
  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i)

  // Lookup map
  const lookup = new Map<string, RetentionItem>()
  for (const r of retention) {
    lookup.set(`${r.cohort_month}-${r.month_offset}`, r)
  }

  function getRetentionColor(rate: number): string {
    if (rate >= 80) return 'bg-green-100 text-green-800'
    if (rate >= 60) return 'bg-green-50 text-green-700'
    if (rate >= 40) return 'bg-amber-50 text-amber-700'
    if (rate >= 20) return 'bg-red-50 text-red-600'
    return 'bg-red-100 text-red-700'
  }

  return (
    <Section title="Retentie (maandelijks)" icon={<Timer className="w-4 h-4" />}>
      {cohorts.length === 0 ? (
        <EmptyState>Nog geen retentiedata</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                <th className="pb-2 pr-4 text-left">Cohort</th>
                <th className="pb-2 pr-2 text-right">Grootte</th>
                {offsets.map(o => (
                  <th key={o} className="pb-2 px-2 text-center w-14">
                    {o === 0 ? 'M0' : `+${o}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map(cohort => {
                const size = lookup.get(`${cohort}-0`)?.cohort_size ?? 0
                return (
                  <tr key={cohort} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4 font-medium text-[var(--navy-dark)] whitespace-nowrap">
                      {cohort}
                    </td>
                    <td className="py-2 pr-2 text-right text-[var(--muted-foreground)]">
                      {size}
                    </td>
                    {offsets.map(o => {
                      const item = lookup.get(`${cohort}-${o}`)
                      if (!item) {
                        return <td key={o} className="py-2 px-2 text-center text-[var(--muted-foreground)]">—</td>
                      }
                      return (
                        <td key={o} className="py-2 px-1 text-center">
                          <span className={`inline-block w-12 px-1.5 py-0.5 rounded text-xs font-semibold ${getRetentionColor(item.retention_rate)}`}>
                            {item.retention_rate}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function formatErrorPrompt(err: ErrorItem): string {
  const mod = MODULE_LABELS[err.module] || err.module || 'onbekend'
  const props = err.properties || {}
  const lines: string[] = [
    `Fix this frontend error in rijksuitgaven:`,
    ``,
    `Error: "${err.message || 'Onbekende fout'}"`,
    `Module: ${mod}`,
  ]
  if (props.trigger) lines.push(`Trigger: ${props.trigger}`)
  if (props.search_query) lines.push(`Search query: "${props.search_query}"`)
  if (props.sort_by) lines.push(`Sort column: ${props.sort_by}`)
  if (props.has_filters) lines.push(`Active filters: yes`)
  if (props.path) lines.push(`Path: ${props.path}`)
  if (props.direction) lines.push(`Sort direction: ${props.direction}`)

  const knownKeys = ['trigger', 'search_query', 'sort_by', 'has_filters', 'path', 'direction', 'message']
  const extra = Object.fromEntries(Object.entries(props).filter(([k]) => !knownKeys.includes(k)))
  if (Object.keys(extra).length > 0) {
    lines.push(`Extra context: ${JSON.stringify(extra)}`)
  }

  lines.push(``, `Trace the root cause in the relevant component and fix it.`)
  return lines.join('\n')
}

function ErrorsSection({ errors, onClearOne, onClearAll }: { errors: ErrorItem[]; onClearOne: (createdAt: string) => void; onClearAll: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyPrompt = useCallback((err: ErrorItem, index: number) => {
    const prompt = formatErrorPrompt(err)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }, [])

  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span>
          <h2 className="text-sm font-semibold text-[var(--navy-dark)] uppercase tracking-wider">Fouten</h2>
          <span className="text-sm text-green-700 ml-2">— geen fouten geregistreerd</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-red-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-red-500"><AlertTriangle className="w-4 h-4" /></span>
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider">
            Fouten ({errors.length})
          </h2>
        </div>
        {errors.length > 1 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors border border-[var(--border)] hover:border-red-200"
          >
            <Trash2 className="w-3 h-3" />
            Wis alles
          </button>
        )}
      </div>
      <div className="space-y-2">
        {errors.map((err, i) => {
          const time = new Date(err.created_at).toLocaleString('nl-NL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })
          const contextPills: { label: string; value: string }[] = []
          if (err.properties?.trigger) {
            const triggerLabels: Record<string, string> = {
              page_load: 'Pagina laden',
              sort_change: 'Sorteren',
              filter_apply: 'Filteren',
              search: 'Zoeken',
              page_change: 'Pagineren',
              row_expand: 'Rij openen',
              detail_panel: 'Detailpaneel',
              filter_load: 'Filter laden',
              autocomplete: 'Autocomplete',
              feedback_submit: 'Feedback',
              login: 'Inloggen',
              contact_form: 'Contactformulier',
              '404': 'Pagina niet gevonden',
              react_render: 'React render crash',
            }
            contextPills.push({ label: 'Actie', value: triggerLabels[String(err.properties.trigger)] || String(err.properties.trigger) })
          }
          if (err.properties?.search_query) contextPills.push({ label: 'Zoekterm', value: String(err.properties.search_query) })
          if (err.properties?.sort_by) {
            const sortCol = String(err.properties.sort_by)
            const sortLabel = sortCol.startsWith('y') && sortCol.length === 5
              ? sortCol.slice(1)
              : FIELD_LABELS[sortCol] || sortCol
            contextPills.push({ label: 'Sortering', value: sortLabel })
          }
          if (err.properties?.has_filters) contextPills.push({ label: 'Filters', value: 'actief' })
          if (err.properties?.path) contextPills.push({ label: 'Pad', value: String(err.properties.path) })

          const isCopied = copiedIndex === i

          return (
            <div key={i} className="bg-red-50/60 border border-red-100 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-sm font-semibold text-red-700">
                  {err.message || 'Onbekende fout'}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyPrompt(err, i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all border ${
                      isCopied
                        ? 'text-green-700 bg-green-50 border-green-200'
                        : 'text-[var(--navy-medium)] bg-white/80 border-red-200 hover:bg-white hover:border-[var(--navy-medium)]'
                    }`}
                    title="Kopieer als prompt"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Gekopieerd' : 'Kopieer prompt'}
                  </button>
                  <button
                    onClick={() => onClearOne(err.created_at)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-500 bg-white/80 border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Verwijder deze fout"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
                <span className="text-xs text-[var(--muted-foreground)]">{time}</span>
                <ModuleBadge module={err.module} variant="amber" />
                {contextPills.map((cp, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1 text-xs bg-white/80 border border-red-200 rounded px-2 py-0.5"
                  >
                    <span className="font-semibold text-[var(--navy-dark)]">{cp.label}</span>
                    <span className="text-[var(--navy-medium)]">{cp.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SortHeader({ field, label, current, dir, onSort, align }: {
  field: string
  label: string
  current: string
  dir: 'asc' | 'desc'
  onSort: (field: string) => void
  align?: 'right'
}) {
  const isActive = current === field
  return (
    <th
      className={`pb-2 pr-4 cursor-pointer select-none hover:text-[var(--navy-dark)] transition-colors ${
        align === 'right' ? 'text-right' : ''
      } ${isActive ? 'text-[var(--navy-dark)]' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSort(field) }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <ArrowUpDown className="w-3 h-3" style={{ transform: dir === 'asc' ? 'scaleY(-1)' : undefined }} />
        )}
      </span>
    </th>
  )
}

function TrendIndicator({ trend, gapDays }: { trend: string; gapDays: number }) {
  if (trend === 'nieuw') {
    return <span className="text-xs text-[var(--muted-foreground)] italic">nieuw</span>
  }

  const icons = {
    stijgend: <TrendingUp className="w-3.5 h-3.5 text-green-600" />,
    dalend: <TrendingDown className="w-3.5 h-3.5 text-red-500" />,
    stabiel: <Minus className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />,
  }

  return (
    <div className="flex items-center gap-1.5" title={`Gem. ${gapDays}d tussen sessies`}>
      {icons[trend as keyof typeof icons] || icons.stabiel}
      <span className="text-xs text-[var(--muted-foreground)]">
        {gapDays > 0 ? `${gapDays}d` : ''}
      </span>
    </div>
  )
}

function ActorRow({ actor, allActors, isExpanded, color, onToggle, detail, detailLoading }: {
  actor: ActorItem
  allActors: ActorItem[]
  isExpanded: boolean
  color: 'green' | 'amber' | 'gray'
  onToggle: () => void
  detail: ActorDetailEvent[] | null
  detailLoading: boolean
}) {
  const isAtRisk = color === 'gray'
  const engagement = isAtRisk
    ? { label: 'Risico', color: 'text-red-700 bg-red-50 border-red-200' }
    : getEngagementLabel(actor.engagement_score, allActors)

  const displayName = actor.user_name || actor.user_email || `Gebruiker ${actor.actor_hash.slice(0, 6)}`

  return (
    <>
      <tr
        className={`border-t border-[var(--border)] cursor-pointer hover:bg-[var(--gray-light)]/50 transition-colors ${
          isExpanded ? 'bg-[var(--gray-light)]/30' : ''
        }`}
        onClick={onToggle}
      >
        <td className="py-2.5 pr-1">
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-[var(--navy-medium)]" />
            : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
          }
        </td>
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${ACTIVITY_DOT_COLORS[color]}`} />
            <span className="font-medium text-[var(--navy-dark)]">{displayName}</span>
          </div>
        </td>
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(actor.last_seen)}</span>
          </div>
        </td>
        <td className="py-2.5 pr-4 text-right font-medium text-[var(--navy-dark)]">
          {actor.session_count}
        </td>
        <td className="py-2.5 pr-4 text-right">
          <span className="relative group/score inline-flex">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold cursor-help ${engagement.color}`}
            >
              {Math.round(actor.engagement_score)} — {engagement.label}
            </span>
            <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-[var(--navy-dark)] text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/score:opacity-100 group-hover/score:pointer-events-auto transition-opacity z-50">
              <p className="font-semibold mb-1.5">Score {Math.round(actor.engagement_score)}</p>
              <p className="text-white/70 mb-1">Gewogen som van acties:</p>
              <ul className="space-y-0.5 text-white/90 mb-2">
                <li>Export, cross-module = 3 pt</li>
                <li>Zoeken, filteren, ext. link = 2 pt</li>
                <li>Bekijken, uitklappen, sorteren = 1 pt</li>
              </ul>
              <p className="text-white/70 border-t border-white/20 pt-1.5">
                {engagement.label}: {engagement.label === 'Power' ? 'top 33%' : engagement.label === 'Regulier' ? 'middelste 33%' : engagement.label === 'Casual' ? 'onderste 33%' : 'niet actief >7d'}
              </p>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--navy-dark)]" />
            </div>
          </span>
        </td>
        <td className="py-2.5 pr-4">
          <TrendIndicator trend={actor.gap_trend} gapDays={actor.avg_gap_days} />
        </td>
        <td className="py-2.5 pr-4">
          {actor.top_module ? <ModuleBadge module={actor.top_module} /> : <span className="text-[var(--muted-foreground)]">—</span>}
        </td>
        <td className="py-2.5 pr-4 text-right">{actor.search_count}</td>
        <td className="py-2.5 pr-4 text-right">{actor.external_link_count}</td>
        <td className="py-2.5 text-right">{actor.export_count}</td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="bg-[var(--gray-light)]/20">
          <td colSpan={10} className="px-4 py-3">
            {/* Session stats summary */}
            {actor.session_count > 0 && (
              <div className="flex items-center gap-6 mb-3 text-xs text-[var(--muted-foreground)]">
                <span>Gem. sessie: <strong className="text-[var(--navy-dark)]">{formatDuration(actor.avg_session_seconds)}</strong></span>
                <span>Modules bezocht: <strong className="text-[var(--navy-dark)]">{actor.module_count}</strong></span>
                <span>Acties totaal: <strong className="text-[var(--navy-dark)]">{actor.event_count}</strong></span>
              </div>
            )}
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] py-2">
                <div className="w-4 h-4 border-2 border-[var(--navy-medium)] border-t-transparent rounded-full animate-spin" />
                Activiteit laden...
              </div>
            ) : !detail || detail.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic py-2">Geen recente activiteit</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {detail.map((event, j) => {
                  const { icon, text, time } = formatEventLine(event)
                  return (
                    <div key={j} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 shrink-0">{icon}</span>
                      <span className="flex-1 text-[var(--navy-dark)]">{text}</span>
                      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">{time}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
