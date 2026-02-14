'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  BarChart3, Search, Download, MousePointerClick, Users, AlertTriangle,
  ChevronDown, ChevronRight, Eye, SlidersHorizontal, Columns, Clock,
  ArrowUpDown, ArrowRight, Sparkles, ChevronsRight, Trash2, CheckCircle,
  ExternalLink,
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
  field: string
  filter_count: number
  top_module: string
}

interface ColumnItem {
  column_name: string
  usage_count: number
  top_module: string
}

interface ExportItem {
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
  module_count: number
}

interface ActorDetailEvent {
  event_type: string
  module: string | null
  properties: Record<string, unknown>
  created_at: string
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

  const clearErrors = useCallback(() => {
    fetch(`/api/v1/team/statistieken`, { method: 'DELETE' })
      .then(res => {
        if (res.ok && data) {
          setData({ ...data, errors: [] })
        }
      })
      .catch(() => {})
  }, [data])

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
            <div className={`grid grid-cols-2 ${errorCount > 0 ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4 mb-6`}>
              <PulseCard
                icon={<Users className="w-4 h-4" />}
                label="Actieve gebruikers"
                value={moduleViews.actors}
                subtext={`van ${data.total_members} leden`}
              />
              <PulseCard
                icon={<Search className="w-4 h-4" />}
                label="Zoekopdrachten"
                value={searches.count}
                subtext={`${searches.actors} unieke gebruikers`}
              />
              <PulseCard
                icon={<Download className="w-4 h-4" />}
                label="Exports"
                value={exports.count}
                subtext={data.exports.map(e => `${e.export_count} ${e.format.toUpperCase()}`).join(', ') || 'geen'}
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
            <ErrorsSection errors={data.errors} onClear={clearErrors} />

            {/* ═══ ACT 2: INZICHTEN ═══ */}

            {/* Search insights — combined table with zero results inline */}
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
                    {/* Searches with results */}
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

                    {/* Divider + zero results */}
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

                {/* Right: Filters, columns, exports stacked */}
                <div className="space-y-5">
                  {/* Filters */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                      Meest gebruikte filters
                    </h3>
                    {data.filters.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)] italic">Nog geen filters gebruikt</p>
                    ) : (
                      <div className="space-y-1">
                        {data.filters.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--navy-dark)]">{FIELD_LABELS[f.field] || f.field}</span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{f.filter_count}</span>
                              <ModuleBadge module={f.top_module} small />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Columns */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                      Extra kolommen
                    </h3>
                    {data.columns.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)] italic">Nog geen kolommen geselecteerd</p>
                    ) : (
                      <div className="space-y-1">
                        {data.columns.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--navy-dark)]">{FIELD_LABELS[c.column_name] || c.column_name}</span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{c.usage_count}</span>
                              <ModuleBadge module={c.top_module} small />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exports */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                      Exports
                    </h3>
                    {data.exports.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)] italic">Nog geen exports</p>
                    ) : (
                      <div className="flex gap-4">
                        {data.exports.map((e, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--navy-dark)] uppercase bg-[var(--gray-light)] px-2 py-0.5 rounded">
                              {e.format}
                            </span>
                            <span className="text-lg font-bold text-[var(--navy-dark)]">{e.export_count}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              gem. {e.avg_rows} rijen
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Section>

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
                        <th className="pb-2 pr-4">Gebruiker</th>
                        <th className="pb-2 pr-4">Laatst actief</th>
                        <th className="pb-2 pr-4 text-right">Acties</th>
                        <th className="pb-2 pr-4">Populairste module</th>
                        <th className="pb-2 pr-4 text-right">Zoekopdrachten</th>
                        <th className="pb-2 text-right">Exports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.actors.map((actor, i) => {
                        const isExpanded = expandedActor === actor.actor_hash
                        const color = getActivityColor(actor.last_seen)

                        return (
                          <ActorRow
                            key={actor.actor_hash}
                            actor={actor}
                            index={i}
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

function PulseCard({ icon, label, value, subtext, variant }: {
  icon: React.ReactNode
  label: string
  value: number
  subtext: string
  variant?: 'error'
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
      <div className={`text-3xl font-bold ${isError ? 'text-red-700' : 'text-[var(--navy-dark)]'}`}>{value.toLocaleString('nl-NL')}</div>
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

function ErrorsSection({ errors, onClear }: { errors: ErrorItem[]; onClear: () => void }) {
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
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
        >
          <Trash2 className="w-3 h-3" />
          Wissen
        </button>
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

          return (
            <div key={i} className="bg-red-50/60 border border-red-100 rounded-lg px-4 py-3">
              {/* Row 1: error message — the headline */}
              <div className="text-sm font-semibold text-red-700 mb-2">
                {err.message || 'Onbekende fout'}
              </div>
              {/* Row 2: metadata line */}
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

function ActorRow({ actor, index, isExpanded, color, onToggle, detail, detailLoading }: {
  actor: ActorItem
  index: number
  isExpanded: boolean
  color: 'green' | 'amber' | 'gray'
  onToggle: () => void
  detail: ActorDetailEvent[] | null
  detailLoading: boolean
}) {
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
            <span className={`w-2 h-2 rounded-full ${ACTIVITY_DOT_COLORS[color]}`} />
            <span className="font-medium text-[var(--navy-dark)]">Gebruiker {index + 1}</span>
          </div>
        </td>
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(actor.last_seen)}</span>
          </div>
        </td>
        <td className="py-2.5 pr-4 text-right font-medium text-[var(--navy-dark)]">
          {actor.event_count}
        </td>
        <td className="py-2.5 pr-4">
          {actor.top_module ? <ModuleBadge module={actor.top_module} /> : <span className="text-[var(--muted-foreground)]">—</span>}
        </td>
        <td className="py-2.5 pr-4 text-right">{actor.search_count}</td>
        <td className="py-2.5 text-right">{actor.export_count}</td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="bg-[var(--gray-light)]/20">
          <td colSpan={7} className="px-4 py-3">
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
