'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import { BarChart3, Search, Download, MousePointerClick, Users, AlertTriangle } from 'lucide-react'

// Module display names
const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  publiek: 'Publiek',
  integraal: 'Integraal',
}

// Field display names
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
}

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
}

const DATE_RANGES = [
  { label: '7 dagen', value: 7 },
  { label: '30 dagen', value: 30 },
  { label: '90 dagen', value: 90 },
  { label: 'Alles', value: 365 },
]

function getPulseValue(pulse: PulseItem[], eventType: string): { count: number; actors: number } {
  const item = pulse.find(p => p.event_type === eventType)
  return { count: item?.event_count ?? 0, actors: item?.unique_actors ?? 0 }
}

export default function StatistiekenPage() {
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      setLoading(true)
      fetch(`/api/v1/team/statistieken?days=${days}`)
        .then(res => res.json())
        .then(d => {
          setData(d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [subLoading, role, days])

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

  // Max view count for bar chart scaling
  const maxViews = data?.modules.length ? Math.max(...data.modules.map(m => m.view_count)) : 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <TeamNav />

        {/* Date range selector */}
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
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-[var(--border)] p-4 animate-pulse">
                <div className="h-4 bg-[var(--gray-light)] rounded w-24 mb-2" />
                <div className="h-8 bg-[var(--gray-light)] rounded w-16" />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Section 1: Pulse Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            </div>

            {/* Section 2: Module Popularity */}
            <Section title="Modules" icon={<BarChart3 className="w-4 h-4" />}>
              {data.modules.length === 0 ? (
                <EmptyState>Nog geen moduleweergaven geregistreerd</EmptyState>
              ) : (
                <div className="space-y-2">
                  {data.modules.map(m => (
                    <div key={m.module} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-[var(--navy-dark)] font-medium truncate">
                        {MODULE_LABELS[m.module] || m.module}
                      </span>
                      <div className="flex-1 h-6 bg-[var(--gray-light)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--navy-medium)] rounded-full transition-all"
                          style={{ width: `${(m.view_count / maxViews) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[var(--navy-dark)] w-12 text-right">
                        {m.view_count}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] w-28">
                        ({m.unique_actors} gebruiker{m.unique_actors !== 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Section 3: Top Search Terms */}
            <Section title="Top zoekopdrachten" icon={<Search className="w-4 h-4" />}>
              {data.searches.length === 0 ? (
                <EmptyState>Nog geen zoekopdrachten geregistreerd</EmptyState>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                      <th className="pb-2">Zoekterm</th>
                      <th className="pb-2 text-right">Aantal</th>
                      <th className="pb-2 text-right">Unieke gebruikers</th>
                      <th className="pb-2">Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.searches.map((s, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="py-1.5 font-medium text-[var(--navy-dark)]">{s.query}</td>
                        <td className="py-1.5 text-right">{s.search_count}</td>
                        <td className="py-1.5 text-right">{s.unique_actors}</td>
                        <td className="py-1.5 text-[var(--muted-foreground)]">
                          {MODULE_LABELS[s.top_module] || s.top_module}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Section 4: Filters & Columns (side by side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Section title="Meest gebruikte filters" compact>
                {data.filters.length === 0 ? (
                  <EmptyState>Nog geen filters gebruikt</EmptyState>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="pb-2">Filter</th>
                        <th className="pb-2 text-right">Aantal</th>
                        <th className="pb-2">Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.filters.map((f, i) => (
                        <tr key={i} className="border-t border-[var(--border)]">
                          <td className="py-1.5 font-medium text-[var(--navy-dark)]">
                            {FIELD_LABELS[f.field] || f.field}
                          </td>
                          <td className="py-1.5 text-right">{f.filter_count}</td>
                          <td className="py-1.5 text-[var(--muted-foreground)]">
                            {MODULE_LABELS[f.top_module] || f.top_module}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              <Section title="Meest gebruikte extra kolommen" compact>
                {data.columns.length === 0 ? (
                  <EmptyState>Nog geen kolommen geselecteerd</EmptyState>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="pb-2">Kolom</th>
                        <th className="pb-2 text-right">Aantal</th>
                        <th className="pb-2">Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.columns.map((c, i) => (
                        <tr key={i} className="border-t border-[var(--border)]">
                          <td className="py-1.5 font-medium text-[var(--navy-dark)]">
                            {FIELD_LABELS[c.column_name] || c.column_name}
                          </td>
                          <td className="py-1.5 text-right">{c.usage_count}</td>
                          <td className="py-1.5 text-[var(--muted-foreground)]">
                            {MODULE_LABELS[c.top_module] || c.top_module}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
            </div>

            {/* Section 5: Exports */}
            <Section title="Exports" icon={<Download className="w-4 h-4" />}>
              {data.exports.length === 0 ? (
                <EmptyState>Nog geen exports gedownload</EmptyState>
              ) : (
                <div className="flex gap-6">
                  {data.exports.map((e, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--navy-dark)] uppercase">{e.format}</span>
                      <span className="text-2xl font-bold text-[var(--navy-dark)]">{e.export_count}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        gem. {e.avg_rows} rijen | {e.unique_actors} gebruiker{e.unique_actors !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Section 6: Zero Result Searches */}
            <Section title="Geen resultaten" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
              {data.zero_results.length === 0 ? (
                <EmptyState>Geen zoekopdrachten zonder resultaten</EmptyState>
              ) : (
                <>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">
                    Zoektermen die 0 resultaten opleverden — gebruikers vertellen u wat ze verwachten maar niet vinden.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="pb-2">Zoekterm</th>
                        <th className="pb-2 text-right">Aantal</th>
                        <th className="pb-2">Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.zero_results.map((z, i) => (
                        <tr key={i} className="border-t border-[var(--border)]">
                          <td className="py-1.5 font-medium text-amber-700">{z.query}</td>
                          <td className="py-1.5 text-right">{z.search_count}</td>
                          <td className="py-1.5 text-[var(--muted-foreground)]">
                            {MODULE_LABELS[z.top_module] || z.top_module}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
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

function PulseCard({ icon, label, value, subtext }: {
  icon: React.ReactNode
  label: string
  value: number
  subtext: string
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--navy-dark)]">{value.toLocaleString('nl-NL')}</div>
      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtext}</div>
    </div>
  )
}

function Section({ title, icon, compact, children }: {
  title: string
  icon?: React.ReactNode
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-lg border border-[var(--border)] p-4 ${compact ? '' : 'mb-4'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
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
