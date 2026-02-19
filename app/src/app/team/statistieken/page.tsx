'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  BarChart3, Search, Download, MousePointerClick, Users, AlertTriangle,
  ChevronDown, ChevronRight, Eye, SlidersHorizontal, Columns, Clock,
  ArrowUpDown, ArrowRight, Sparkles, ChevronsRight,
  ExternalLink, TrendingUp, TrendingDown, Minus, Timer,
  Target, Activity, Globe, LogIn, Phone, MousePointer,
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
  search_end: 'Zoeksessie einde',
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
  enter_count: number
  autocomplete_count: number
  avg_duration: number | null
  engagement_rate: number | null
}

interface FilterItem {
  module: string
  field: string
  filter_count: number
  origin: string
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
  retry_count: number
}

interface SearchEngagementItem {
  action_type: string
  action_count: number
  unique_searches: number
}

interface ModuleEventItem {
  module: string
  event_type: string
  event_count: number
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
  cohort_week: string
  week_offset: number
  active_count: number
  cohort_size: number
  retention_rate: number
}

// UX-036: Public analytics types
interface PublicPageView { page: string; view_count: number; unique_sessions: number }
interface PublicInteraction { action: string; interaction_count: number; unique_sessions: number }
interface PublicFunnelStep { step: string; step_count: number; unique_sessions: number }
interface PublicReferrer { referrer: string; visit_count: number; unique_sessions: number }
interface PublicCtaClick { section: string; element: string; click_count: number; unique_sessions: number }
interface PublicScrollFunnel { section: string; view_count: number; unique_sessions: number }
interface PublicUtmCampaign { utm_source: string; utm_medium: string; utm_campaign: string; visit_count: number; unique_sessions: number }

interface PublicData {
  page_views: PublicPageView[]
  interactions: PublicInteraction[]
  contact_funnel: PublicFunnelStep[]
  referrers: PublicReferrer[]
  cta_clicks: PublicCtaClick[]
  scroll_funnel: PublicScrollFunnel[]
  login_funnel: PublicFunnelStep[]
  utm_campaigns: PublicUtmCampaign[]
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
  search_engagement: SearchEngagementItem[]
  pulse_previous: PulseItem[]
  module_events: ModuleEventItem[]
  // UX-036: Public page analytics
  public?: PublicData
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

function getDelta(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' }
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

function DeltaBadge({ current, previous, dark }: { current: number; previous: number; dark?: boolean }) {
  const { pct, direction } = getDelta(current, previous)
  if (direction === 'flat' && pct === 0) return <span className={`text-xs ${dark ? 'text-white/40' : 'text-[var(--muted-foreground)]'}`}>—</span>
  const lightStyles = {
    up: 'text-emerald-700 bg-emerald-50/80 border-emerald-200/60',
    down: 'text-[#E62D75] bg-pink-50/60 border-pink-200/60',
    flat: 'text-[var(--muted-foreground)] bg-[var(--gray-light)] border-[var(--border)]',
  }
  const darkStyles = {
    up: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30',
    down: 'text-pink-300 bg-pink-500/20 border-pink-400/30',
    flat: 'text-white/50 bg-white/10 border-white/20',
  }
  const styles = dark ? darkStyles : lightStyles
  const arrows = { up: '↑', down: '↓', flat: '—' }
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full border ${styles[direction]}`}>
      {arrows[direction]} {pct}%
    </span>
  )
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
        text: `Zocht "${props.query}" in ${mod} — ${props.result_count ?? 0} resultaten (${props.commit_type === 'autocomplete' ? 'autocomplete' : 'Enter'})`,
        time: timestamp,
      }
    case 'search_end':
      return {
        icon: <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />,
        text: `Zoeksessie beëindigd na ${props.duration_seconds ?? '?'}s — ${props.exit_action || 'onbekend'}`,
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
  const [tab, setTab] = useState<'gebruik' | 'website'>('gebruik')

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
  const filtersApplied = getPulseValue(data?.pulse ?? [], 'filter_apply')
  const ss = data?.sessions_summary
  const sc = data?.search_success

  // Previous period for deltas
  const prev = data?.pulse_previous ?? []
  const prevSearches = getPulseValue(prev, 'search')
  const prevExports = getPulseValue(prev, 'export')
  const prevExpands = getPulseValue(prev, 'row_expand')
  const prevModuleViews = getPulseValue(prev, 'module_view')
  const prevExternalLinks = getPulseValue(prev, 'external_link')
  const prevFilters = getPulseValue(prev, 'filter_apply')

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
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <TeamNav />

        {/* Header + date range */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[var(--navy-dark)] tracking-tight">Gebruiksstatistieken</h1>
          <div className="flex gap-1 bg-white rounded-lg shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-1">
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

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-1 w-fit">
          <button
            onClick={() => setTab('gebruik')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'gebruik'
                ? 'bg-[var(--navy-dark)] text-white'
                : 'text-[var(--navy-medium)] hover:bg-[var(--gray-light)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Gebruik
          </button>
          <button
            onClick={() => setTab('website')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'website'
                ? 'bg-[var(--navy-dark)] text-white'
                : 'text-[var(--navy-medium)] hover:bg-[var(--gray-light)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Website
          </button>
        </div>

        {loading ? (
          /* Loading skeleton — shared across tabs */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-[var(--navy-dark)] rounded-xl p-5 animate-pulse overflow-hidden shadow-lg shadow-[var(--navy-dark)]/20">
                  <div className="h-3 bg-white/10 rounded w-28 mb-3" />
                  <div className="h-10 bg-white/10 rounded w-20 mb-1.5" />
                  <div className="h-3 bg-white/10 rounded w-24" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-5 animate-pulse">
              <div className="h-4 bg-[var(--gray-light)] rounded w-36 mb-5" />
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 h-4 bg-[var(--gray-light)] rounded" />
                    <div className="flex-1 h-6 bg-[var(--gray-light)]/60 rounded" />
                    <div className="w-10 h-4 bg-[var(--gray-light)] rounded" />
                    <div className="w-10 h-4 bg-[var(--gray-light)] rounded" />
                    <div className="w-12 h-4 bg-[var(--gray-light)] rounded" />
                    <div className="w-14 h-3 bg-[var(--gray-light)] rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : data && tab === 'website' ? (
          <WebsiteSection publicData={data.public} />
        ) : data ? (
          <>
            {/* ═══ ACT 1: PULSE ═══ */}

            {/* Tier 1: Hero metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <PulseCard
                icon={<Users className="w-5 h-5" />}
                label="Actieve gebruikers"
                value={moduleViews.actors}
                subtext={`van ${data.total_members} leden`}
                delta={<DeltaBadge current={moduleViews.actors} previous={prevModuleViews.actors} dark />}
                hero
              />
              <PulseCard
                icon={<Activity className="w-5 h-5" />}
                label="Sessies"
                value={ss?.total_sessions ?? 0}
                subtext={ss ? `gem. ${formatDuration(ss.avg_duration_seconds)} · ${ss.avg_events_per_session ?? 0} acties/sessie` : 'geen data'}
                hero
              />
            </div>

            {/* Feature Adoption */}
            <AdoptionFunnel
              views={moduleViews.count}
              features={[
                { label: 'Gezocht', value: searches.count, actors: searches.actors, previous: prevSearches.count, icon: 'search' },
                { label: 'Gefilterd', value: filtersApplied.count, actors: filtersApplied.actors, previous: prevFilters.count, icon: 'filter' },
                { label: 'Uitgeklapt', value: expands.count, actors: expands.actors, previous: prevExpands.count, icon: 'expand' },
                { label: 'Geëxporteerd', value: exports.count, actors: exports.actors, previous: prevExports.count, icon: 'export' },
                { label: 'Externe links', value: externalLinks.count, actors: externalLinks.actors, previous: prevExternalLinks.count, icon: 'external' },
              ]}
            />

            {/* ═══ ACT 2: INZICHTEN ═══ */}

            {/* Platform usage — activity per module */}
            <Section title="Activiteit per module" icon={<BarChart3 className="w-4 h-4" />}>
              <ModuleActivitySection
                modules={data.modules}
                filters={data.filters}
                columns={data.columns}
                exports={data.exports}
                searches={data.searches}
                zeroResults={data.zero_results}
                moduleEvents={data.module_events ?? []}
              />
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
          <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-8 text-center text-[var(--muted-foreground)]">
            Fout bij ophalen statistieken
          </div>
        )}
      </main>
    </div>
  )
}


// --- Subcomponents ---

interface AdoptionFeature {
  label: string
  value: number
  actors: number
  previous: number
  icon: 'search' | 'filter' | 'expand' | 'export' | 'external'
}

const ADOPTION_ICONS: Record<string, typeof Search> = {
  search: Search,
  filter: SlidersHorizontal,
  expand: MousePointerClick,
  export: Download,
  external: ExternalLink,
}

function AdoptionFunnel({ views, features }: {
  views: number
  features: AdoptionFeature[]
}) {
  const sorted = [...features].sort((a, b) => b.value - a.value)

  return (
    <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-5 mb-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[var(--navy-medium)]"><Target className="w-4 h-4" /></span>
          <h2 className="text-sm font-semibold text-[var(--navy-dark)] uppercase tracking-wider">Feature Adoption</h2>
        </div>
        {views > 0 && (
          <span className="text-xs text-[var(--muted-foreground)]">
            van <strong className="text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{views.toLocaleString('nl-NL')}</strong> weergaven
          </span>
        )}
      </div>
      {views === 0 ? (
        <EmptyState>Nog geen activiteit in deze periode</EmptyState>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((feat, i) => {
            const pct = Math.round((feat.value / views) * 100)
            const barWidth = Math.max((feat.value / views) * 100, 1)
            const Icon = ADOPTION_ICONS[feat.icon]
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--navy-medium)]" />
                  <span className="text-sm font-medium text-[var(--navy-dark)]">{feat.label}</span>
                </div>
                <div className="flex-1 h-6 bg-[var(--gray-light)]/60 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${barWidth}%`,
                      opacity: feat.value === 0 ? 0.15 : 1,
                      background: 'linear-gradient(90deg, var(--navy-dark), var(--navy-medium))',
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--navy-dark)] w-10 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {feat.value.toLocaleString('nl-NL')}
                </span>
                <span className={`text-sm font-bold w-10 text-right ${
                  pct >= 50 ? 'text-emerald-600' : pct >= 20 ? 'text-[var(--navy-dark)]' : pct > 0 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'
                }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {pct}%
                </span>
                <DeltaBadge current={feat.value} previous={feat.previous} />
                <span className="text-[11px] text-[var(--muted-foreground)] w-14 text-right shrink-0">
                  {feat.actors} gebr.
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PulseCard({ icon, label, value, subtext, delta, hero, isString }: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtext: string
  delta?: React.ReactNode
  hero?: boolean
  isString?: boolean
}) {
  const formatted = isString ? value : (typeof value === 'number' ? value.toLocaleString('nl-NL') : value)

  if (hero) {
    return (
      <div className="bg-[var(--navy-dark)] rounded-xl p-5 relative overflow-hidden shadow-lg shadow-[var(--navy-dark)]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3 text-white/60">
            {icon}
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatted}
            </span>
            {delta}
          </div>
          <div className="text-xs text-white/50 mt-1.5">{subtext}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1 text-[var(--muted-foreground)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatted}
        </span>
        {delta}
      </div>
      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{subtext}</div>
    </div>
  )
}

function Section({ title, icon, children }: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-5 mb-4">
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

function EngagementBadge({ score, label, color }: { score: number; label: string; color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const show = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return (
    <>
      <span
        ref={ref}
        className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold cursor-help ${color}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => { e.stopPropagation(); setPos(prev => prev ? null : undefined as never); show() }}
      >
        {Math.round(score)} — {label}
      </span>
      {pos && (
        <div
          className="fixed z-[9999] w-56 p-3 bg-[var(--navy-dark)] text-white text-xs rounded-lg shadow-xl"
          style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <p className="font-semibold mb-1.5">Score {Math.round(score)}</p>
          <p className="text-white/70 mb-1">Gewogen som van acties:</p>
          <ul className="space-y-0.5 text-white/90 mb-2">
            <li>Export, cross-module = 3 pt</li>
            <li>Zoeken, filteren, ext. link = 2 pt</li>
            <li>Bekijken, uitklappen, sorteren = 1 pt</li>
          </ul>
          <p className="text-white/70 border-t border-white/20 pt-1.5">
            {label}: {label === 'Power' ? 'top 33%' : label === 'Regulier' ? 'middelste 33%' : label === 'Casual' ? 'onderste 33%' : 'niet actief >7d'}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--navy-dark)]" />
        </div>
      )}
    </>
  )
}

function ModuleActivitySection({ modules, filters, columns, exports, searches, zeroResults, moduleEvents }: {
  modules: ModuleItem[]
  filters: FilterItem[]
  columns: ColumnItem[]
  exports: ExportItem[]
  searches: SearchItem[]
  zeroResults: ZeroResultItem[]
  moduleEvents: ModuleEventItem[]
}) {
  // All 7 modules, always shown
  const allModuleKeys = Object.keys(MODULE_LABELS)

  // Build comprehensive activity map per module
  type ModActivity = {
    views: number; actors: number
    searches: SearchItem[]; zeroResults: ZeroResultItem[]
    panelFilters: FilterItem[]; drilldownFilters: FilterItem[]
    cols: ColumnItem[]; exps: ExportItem[]
    googleClicks: number; rowExpands: number
  }

  const moduleMap = new Map<string, ModActivity>()

  for (const mod of allModuleKeys) {
    moduleMap.set(mod, {
      views: 0, actors: 0,
      searches: [], zeroResults: [],
      panelFilters: [], drilldownFilters: [],
      cols: [], exps: [],
      googleClicks: 0, rowExpands: 0,
    })
  }

  for (const m of modules) {
    const entry = moduleMap.get(m.module)
    if (entry) { entry.views = m.view_count; entry.actors = m.unique_actors }
  }
  for (const s of searches) {
    const entry = moduleMap.get(s.top_module)
    if (entry) entry.searches.push(s)
  }
  for (const z of zeroResults) {
    const entry = moduleMap.get(z.top_module)
    if (entry) entry.zeroResults.push(z)
  }
  for (const f of filters) {
    const entry = moduleMap.get(f.module)
    if (!entry) continue
    if (f.origin === 'expanded_row') entry.drilldownFilters.push(f)
    else entry.panelFilters.push(f)
  }
  for (const c of columns) {
    const entry = moduleMap.get(c.module)
    if (entry) entry.cols.push(c)
  }
  for (const e of exports) {
    const entry = moduleMap.get(e.module)
    if (entry) entry.exps.push(e)
  }
  for (const me of moduleEvents) {
    const entry = moduleMap.get(me.module)
    if (!entry) continue
    if (me.event_type === 'external_link') entry.googleClicks = me.event_count
    if (me.event_type === 'row_expand') entry.rowExpands = me.event_count
  }

  // Sort: active modules first (by views desc), then inactive alphabetically
  const entries = [...moduleMap.entries()].sort((a, b) => {
    if (b[1].views !== a[1].views) return b[1].views - a[1].views
    return a[0].localeCompare(b[0])
  })

  const activeEntries = entries.filter(([, a]) => a.views > 0 || a.searches.length > 0 || a.zeroResults.length > 0)
  const inactiveEntries = entries.filter(([, a]) => a.views === 0 && a.searches.length === 0 && a.zeroResults.length === 0)

  return (
    <div className="space-y-3">
      {activeEntries.map(([mod, a]) => (
        <div key={mod} className="rounded-lg relative overflow-hidden pl-5 pr-4 py-4 bg-white shadow-sm shadow-black/[0.04] border border-[var(--border)]/40">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-[var(--navy-dark)]" />

          {/* Header */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
              {MODULE_LABELS[mod] || mod}
            </h3>
            <span className="text-sm text-[var(--muted-foreground)]">
              <strong className="text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{a.views}</strong> weergaven · {a.actors} gebruiker{a.actors !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Searches — horizontal bars proportional to result count */}
          {a.searches.length > 0 && (() => {
            const maxResults = Math.max(...a.searches.map(s => Number(s.avg_results) || 0), 1)
            return (
              <div className="mb-2.5 space-y-1">
                {a.searches.map((s, i) => {
                  const results = Number(s.avg_results) || 0
                  const barWidth = Math.max((results / maxResults) * 100, 3)
                  const hasResults = results > 0
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--navy-dark)] truncate min-w-0 w-36 shrink-0">&ldquo;{s.query}&rdquo;</span>
                      <div className="w-28 shrink-0 h-4 bg-[var(--gray-light)]/40 rounded overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${barWidth}%`,
                            background: hasResults
                              ? 'linear-gradient(90deg, var(--navy-dark), var(--navy-medium))'
                              : 'linear-gradient(90deg, #D97706, #F59E0B)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--navy-dark)] w-20 shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {s.search_count}× gezocht
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded w-24 shrink-0 text-center ${
                        hasResults ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {results > 0 ? `${results.toLocaleString('nl-NL')} resultaten` : '0 resultaten'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded w-24 shrink-0 text-center bg-[var(--gray-light)] text-[var(--navy-medium)]">
                        {s.autocomplete_count > 0 ? 'via autocomplete' : 'via enter'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Zero results */}
          {a.zeroResults.length > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              {a.zeroResults.map((z, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700">
                  {z.query} {z.search_count}×
                  {z.retry_count > 0 && <span className="text-amber-500">→ {z.retry_count} herpoging</span>}
                </span>
              ))}
            </div>
          )}

          {/* Engagement row — compact single line with separator dots */}
          {(() => {
            const totalFilters = a.panelFilters.reduce((s, f) => s + f.filter_count, 0)
            const filterField = a.panelFilters.length === 1 ? (FIELD_LABELS[a.panelFilters[0].field] || a.panelFilters[0].field) : null
            const totalDrilldowns = a.drilldownFilters.reduce((s, f) => s + f.filter_count, 0)
            const drilldownField = a.drilldownFilters.length === 1 ? (FIELD_LABELS[a.drilldownFilters[0].field] || a.drilldownFilters[0].field) : null
            const totalCols = a.cols.reduce((s, c) => s + c.usage_count, 0)
            const colField = a.cols.length === 1 ? (FIELD_LABELS[a.cols[0].column_name] || a.cols[0].column_name) : null
            const totalExports = a.exps.reduce((s, e) => s + e.export_count, 0)
            const exportFormat = a.exps.length === 1 ? a.exps[0].format.toUpperCase() : null

            const entries: { icon: React.ReactNode; text: string }[] = []
            if (totalFilters > 0) entries.push({
              icon: <SlidersHorizontal className="w-3 h-3" />,
              text: `${totalFilters}× gefilterd${filterField ? ` (${filterField})` : ''}`,
            })
            if (totalDrilldowns > 0) entries.push({
              icon: <ChevronDown className="w-3 h-3" />,
              text: `${totalDrilldowns}× drilldown${drilldownField ? ` (${drilldownField})` : ''}`,
            })
            if (a.rowExpands > 0) entries.push({
              icon: <MousePointerClick className="w-3 h-3" />,
              text: `${a.rowExpands}× uitgeklapt`,
            })
            if (totalCols > 0) entries.push({
              icon: <Columns className="w-3 h-3" />,
              text: `${totalCols}× kolom${totalCols > 1 ? 'men' : ''} gewijzigd${colField ? ` (${colField})` : ''}`,
            })
            if (a.googleClicks > 0) entries.push({
              icon: <ExternalLink className="w-3 h-3" />,
              text: `${a.googleClicks}× Google`,
            })
            if (totalExports > 0) entries.push({
              icon: <Download className="w-3 h-3" />,
              text: `${totalExports}× export${exportFormat ? ` (${exportFormat})` : ''}`,
            })

            if (entries.length === 0) return null
            return (
              <div className="flex items-center gap-0 text-xs text-[var(--navy-medium)] border-t border-[var(--border)]/30 pt-2.5 mt-1">
                {entries.map((e, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-[var(--border)] mx-2">·</span>}
                    <span className="text-[var(--navy-medium)]/60">{e.icon}</span>
                    <span>{e.text}</span>
                  </span>
                ))}
              </div>
            )
          })()}
        </div>
      ))}

      {/* Inactive modules — collapsed into one row */}
      {inactiveEntries.length > 0 && (
        <div className="flex items-center gap-2 px-1 pt-1">
          <span className="text-xs text-[var(--muted-foreground)] italic shrink-0">Niet bezocht:</span>
          <div className="flex flex-wrap gap-1.5">
            {inactiveEntries.map(([mod]) => (
              <span key={mod} className="text-xs px-2 py-0.5 rounded bg-[var(--gray-light)]/60 text-[var(--muted-foreground)] border border-[var(--border)]/20">
                {MODULE_LABELS[mod] || mod}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


function RetentionSection({ retention }: { retention: RetentionItem[] }) {
  // Build cohort grid: rows = cohort weeks, columns = week offsets
  const cohorts = [...new Set(retention.map(r => r.cohort_week))].sort()
  const maxOffset = Math.max(...retention.map(r => r.week_offset), 0)
  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i)

  // Lookup map
  const lookup = new Map<string, RetentionItem>()
  for (const r of retention) {
    lookup.set(`${r.cohort_week}-${r.week_offset}`, r)
  }

  function getRetentionColor(rate: number): string {
    if (rate >= 80) return 'bg-green-100 text-green-800'
    if (rate >= 60) return 'bg-green-50 text-green-700'
    if (rate >= 40) return 'bg-amber-50 text-amber-700'
    if (rate >= 20) return 'bg-red-50 text-red-600'
    return 'bg-red-100 text-red-700'
  }

  return (
    <Section title="Retentie (wekelijks)" icon={<Timer className="w-4 h-4" />}>
      {cohorts.length === 0 ? (
        <EmptyState>Nog geen retentiedata</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                <th className="pb-2 pr-4 text-left">Week</th>
                <th className="pb-2 pr-2 text-right">Gebruikers</th>
                {offsets.map(o => (
                  <th key={o} className="pb-2 px-2 text-center w-14">
                    {o === 0 ? 'W0' : `+${o}`}
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
          <EngagementBadge score={actor.engagement_score} label={engagement.label} color={engagement.color} />
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

// ═══════════════════════════════════════════════════════════════════════════
// Website Section — UX-036 Public Page Analytics
// ═══════════════════════════════════════════════════════════════════════════

const PAGE_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  login: 'Login',
  privacybeleid: 'Privacybeleid',
  voorwaarden: 'Voorwaarden',
  over: 'Over ons',
  support: 'Support / FAQ',
  dataoverzicht: 'Dataoverzicht',
  verlopen: 'Verlopen',
  afmelden: 'Afmelden',
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  trust: 'Trust Bar',
  audience: 'Doelgroepen',
  features: 'Features',
  subscriptions: 'Abonnementen',
  b2g: 'B2G Overheden',
  contact: 'Contact',
}

const ACTION_LABELS: Record<string, string> = {
  cta_click: 'CTA klik',
  section_view: 'Sectie gezien',
  audience_tab: 'Doelgroep tab',
  contact_form_start: 'Formulier gestart',
  contact_form_submit: 'Formulier verzonden',
  login_attempt: 'Login poging',
  login_magic_link_sent: 'Magic link verzonden',
}

function WebsiteSection({ publicData }: { publicData?: PublicData }) {
  if (!publicData) {
    return (
      <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-8 text-center text-[var(--muted-foreground)]">
        Nog geen websitedata beschikbaar. Voer migratie 062 uit op de database.
      </div>
    )
  }

  const totalViews = publicData.page_views.reduce((s, p) => s + p.view_count, 0)
  const totalSessions = publicData.page_views.reduce((s, p) => s + p.unique_sessions, 0)
  const uniqueSessions = new Set(publicData.page_views.map(p => p.unique_sessions)).size > 0 ? totalSessions : 0
  const totalInteractions = publicData.interactions.reduce((s, i) => s + i.interaction_count, 0)
  const contactStarts = publicData.contact_funnel.find(s => s.step === 'start')?.step_count ?? 0
  const contactSuccess = publicData.contact_funnel.find(s => s.step === 'submit_success')?.step_count ?? 0
  const loginAttempts = publicData.login_funnel.find(s => s.step === 'login_attempt')?.step_count ?? 0
  const loginSent = publicData.login_funnel.find(s => s.step === 'login_magic_link_sent')?.step_count ?? 0

  const noData = totalViews === 0 && totalInteractions === 0

  if (noData) {
    return (
      <div className="bg-white rounded-xl shadow-sm shadow-black/[0.04] border border-[var(--border)]/40 p-8 text-center text-[var(--muted-foreground)]">
        <Globe className="w-8 h-8 mx-auto mb-3 text-[var(--navy-medium)]/40" />
        <p className="text-sm">Nog geen websiteverkeer geregistreerd in deze periode</p>
      </div>
    )
  }

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <PulseCard
          icon={<Eye className="w-4 h-4" />}
          label="Paginaweergaven"
          value={totalViews}
          subtext={`${uniqueSessions} unieke sessies`}
        />
        <PulseCard
          icon={<MousePointer className="w-4 h-4" />}
          label="Interacties"
          value={totalInteractions}
          subtext="CTA's, tabs, formulier"
        />
        <PulseCard
          icon={<Phone className="w-4 h-4" />}
          label="Contactformulier"
          value={contactSuccess}
          subtext={contactStarts > 0 ? `${contactStarts} gestart → ${contactSuccess} verzonden` : 'geen formulieren'}
        />
        <PulseCard
          icon={<LogIn className="w-4 h-4" />}
          label="Loginpogingen"
          value={loginAttempts}
          subtext={loginSent > 0 ? `${loginSent} magic links verzonden` : 'geen pogingen'}
        />
      </div>

      {/* Page views breakdown */}
      <Section title="Paginaweergaven" icon={<Eye className="w-4 h-4" />}>
        {publicData.page_views.length === 0 ? (
          <EmptyState>Nog geen paginaweergaven</EmptyState>
        ) : (
          <div className="space-y-2">
            {publicData.page_views.map((p, i) => {
              const maxViews = publicData.page_views[0]?.view_count || 1
              const barWidth = Math.max((p.view_count / maxViews) * 100, 3)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--navy-dark)] w-32 shrink-0 truncate">
                    {PAGE_LABELS[p.page] || p.page}
                  </span>
                  <div className="flex-1 h-5 bg-[var(--gray-light)]/40 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, var(--navy-dark), var(--navy-medium))' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--navy-dark)] w-12 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {p.view_count}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] w-20 text-right shrink-0">
                    {p.unique_sessions} sessies
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Scroll funnel */}
      {publicData.scroll_funnel.length > 0 && (
        <Section title="Scroll funnel (homepage)" icon={<ChevronDown className="w-4 h-4" />}>
          <div className="space-y-1.5">
            {/* Sort by expected order: hero → trust → audience → features → subscriptions → b2g → contact */}
            {['hero', 'trust', 'audience', 'features', 'subscriptions', 'b2g', 'contact']
              .map(section => publicData.scroll_funnel.find(s => s.section === section))
              .filter((s): s is PublicScrollFunnel => !!s)
              .map((s, i, arr) => {
                const maxViews = arr[0]?.view_count || 1
                const pct = Math.round((s.view_count / maxViews) * 100)
                const barWidth = Math.max(pct, 3)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--navy-dark)] w-28 shrink-0">
                      {SECTION_LABELS[s.section] || s.section}
                    </span>
                    <div className="flex-1 h-5 bg-[var(--gray-light)]/40 rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${barWidth}%`,
                          background: `linear-gradient(90deg, var(--navy-dark), var(--navy-medium))`,
                          opacity: pct < 30 ? 0.6 : 1,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[var(--navy-dark)] w-10 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pct}%
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] w-16 text-right shrink-0">
                      {s.view_count}×
                    </span>
                  </div>
                )
              })}
          </div>
        </Section>
      )}

      {/* CTA clicks */}
      {publicData.cta_clicks.length > 0 && (
        <Section title="CTA klikken" icon={<MousePointerClick className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="pb-2 pr-4">Sectie</th>
                  <th className="pb-2 pr-4">Element</th>
                  <th className="pb-2 pr-4 text-right">Kliks</th>
                  <th className="pb-2 text-right">Sessies</th>
                </tr>
              </thead>
              <tbody>
                {publicData.cta_clicks.map((c, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4 font-medium text-[var(--navy-dark)]">
                      {SECTION_LABELS[c.section] || c.section}
                    </td>
                    <td className="py-2 pr-4 text-[var(--navy-medium)]">
                      {c.element.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 pr-4 text-right font-bold text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.click_count}
                    </td>
                    <td className="py-2 text-right text-[var(--muted-foreground)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.unique_sessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Referrers + UTM campaigns side by side */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Referrers */}
        <Section title="Referrers" icon={<ExternalLink className="w-4 h-4" />}>
          {publicData.referrers.length === 0 ? (
            <EmptyState>Geen externe referrers</EmptyState>
          ) : (
            <div className="space-y-1.5">
              {publicData.referrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[var(--navy-dark)] truncate">{r.referrer}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.visit_count}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{r.unique_sessions} sessies</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* UTM campaigns */}
        <Section title="Campagnes (UTM)" icon={<Target className="w-4 h-4" />}>
          {publicData.utm_campaigns.length === 0 ? (
            <EmptyState>Geen UTM-campagnes gedetecteerd</EmptyState>
          ) : (
            <div className="space-y-1.5">
              {publicData.utm_campaigns.map((u, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <div className="truncate">
                    <span className="font-medium text-[var(--navy-dark)]">{u.utm_source}</span>
                    {u.utm_medium && <span className="text-[var(--muted-foreground)]"> / {u.utm_medium}</span>}
                    {u.utm_campaign && <span className="text-[var(--navy-medium)]"> — {u.utm_campaign}</span>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-[var(--navy-dark)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{u.visit_count}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{u.unique_sessions} sessies</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  )
}
