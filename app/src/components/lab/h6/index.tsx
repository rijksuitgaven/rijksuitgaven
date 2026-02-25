'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// Lazy-loaded concept components
const NewMoney = lazy(() => import('./new-money'))
const Movers = lazy(() => import('./movers'))
const MinistryDNA = lazy(() => import('./ministry-dna'))
const SpendingLandscape = lazy(() => import('./spending-landscape'))
const DependencyRadar = lazy(() => import('./dependency-radar'))
const Concentration = lazy(() => import('./concentration'))
const Anomalies = lazy(() => import('./anomalies'))
const MoneyFlow = lazy(() => import('./money-flow'))
const ShareShift = lazy(() => import('./share-shift'))
const GrowthComparator = lazy(() => import('./growth-comparator'))
const SpendingSpectrum = lazy(() => import('./spending-spectrum'))
const LeaderboardView = lazy(() => import('./leaderboard'))
const SunburstView = lazy(() => import('./sunburst'))
const SpendingVelocity = lazy(() => import('./spending-velocity'))
const PatternDeviation = lazy(() => import('./pattern-deviation'))
const ReverseFlow = lazy(() => import('./reverse-flow'))
const MinistryStructure = lazy(() => import('./ministry-structure'))
const SpendingPerCapita = lazy(() => import('./spending-per-capita'))
const RegelingProfile = lazy(() => import('./regeling-profile'))
const HeadToHead = lazy(() => import('./head-to-head'))
const TopTabellen = lazy(() => import('./top-tabellen'))

// ─── Constants ────────────────────────────────────────────────────
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const MODULE_COLORS: Record<string, string> = {
  instrumenten: '#1a2332',
  apparaat: '#37474f',
  inkoop: '#e91e63',
  provincie: '#5c6bc0',
  gemeente: '#26a69a',
  publiek: '#8d6e63',
}
const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  publiek: 'Publiek',
}

const TABS = [
  { id: 'pulse', label: 'Pulse', description: 'Overzicht & KPIs' },
  { id: 'new-money', label: 'New Money', description: 'Nieuwe ontvangers' },
  { id: 'movers', label: 'Movers', description: 'Top 25 verschuivingen' },
  { id: 'ministry-dna', label: 'Ministry DNA', description: 'Ministerie-analyse' },
  { id: 'treemap', label: 'Landscape', description: 'Uitgavenstructuur' },
  { id: 'radar', label: 'Radar', description: 'Cross-module analyse' },
  { id: 'concentration', label: 'Concentratie', description: 'Ongelijkheid & Gini' },
  { id: 'anomalies', label: 'Anomalieën', description: 'Dramatische veranderingen' },
  { id: 'money-flow', label: 'Money Flow', description: 'Sankey geldstromen' },
  { id: 'share-shift', label: 'Share Shift', description: 'Aandeel ministeries' },
  { id: 'sunburst', label: 'Sunburst', description: 'Hiërarchische verdeling' },
  { id: 'growth', label: 'Growth', description: 'Groei vergelijken' },
  { id: 'velocity', label: 'Velocity', description: 'YoY veranderingen' },
  { id: 'deviation', label: 'Afwijking', description: 'Patroon afwijkingen' },
  { id: 'spectrum', label: 'Spectrum', description: 'Verdeling & schaal' },
  { id: 'reverse-flow', label: 'Reverse Flow', description: 'Ontvanger → bron' },
  { id: 'ministry-cost', label: 'Kostenstructuur', description: 'Instrumenten vs apparaat' },
  { id: 'per-capita', label: 'Per Capita', description: 'Uitgaven per inwoner' },
  { id: 'regeling', label: 'Regeling', description: 'Regeling-profiel' },
  { id: 'leaderboard', label: 'Leaderboard', description: 'Top ontvangers' },
  { id: 'head-to-head', label: 'Head-to-Head', description: 'Vergelijk organisaties' },
  { id: 'top-tabellen', label: 'Top Tabellen', description: 'Ranglijsten per dimensie' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Types ────────────────────────────────────────────────────────
interface PulseData {
  kpis: {
    total_per_year: Record<string, number>
    recipients_per_year: Record<string, number>
    largest_per_year: Record<string, { name: string; amount: number }>
    average_per_year: Record<string, number>
  }
  modules: Record<string, Record<string, number>>
  data_notes: {
    last_updated: string
    scope: string
    amount_unit: string
  }
}

// ─── Formatting ───────────────────────────────────────────────────
function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function formatEuroFull(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function formatDelta(current: number, previous: number): { text: string; positive: boolean } {
  if (!previous) return { text: '—', positive: true }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return { text: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

// ─── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, values, formatFn, suffix }: {
  label: string
  values: Record<string, number>
  formatFn: (n: number) => string
  suffix?: string
}) {
  const sparkData = YEARS.map(y => ({ year: y, value: values[String(y)] || 0 }))
  const currentYear = '2024'
  const prevYear = '2023'
  const current = values[currentYear] || 0
  const delta = formatDelta(current, values[prevYear] || 0)

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between">
      <div className="text-xs text-[var(--navy-medium)] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-xl font-bold text-[var(--navy-dark)] tabular-nums">
          {formatFn(current)}{suffix || ''}
        </span>
        <span className={`text-xs font-medium tabular-nums ${delta.positive ? 'text-green-600' : 'text-red-500'}`}>
          {delta.text}
        </span>
      </div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={NAVY_DARK}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── KPI Card for "Largest" (special format) ──────────────────────
function LargestKpiCard({ label, data }: {
  label: string
  data: Record<string, { name: string; amount: number }>
}) {
  const current = data['2024']
  const sparkData = YEARS.map(y => ({ year: y, value: data[String(y)]?.amount || 0 }))

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between">
      <div className="text-xs text-[var(--navy-medium)] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="mb-1">
        <span className="text-sm font-bold text-[var(--navy-dark)] truncate block">
          {current?.name || '—'}
        </span>
        <span className="text-xs text-[var(--navy-medium)] tabular-nums">
          {current ? formatEuro(current.amount) : '—'}
        </span>
      </div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={PINK}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Hero Stacked Area Chart ──────────────────────────────────────
function HeroChart({ modules }: { modules: Record<string, Record<string, number>> }) {
  const chartData = useMemo(() => {
    return YEARS.map(year => {
      const yearStr = String(year)
      const entry: Record<string, number | string> = { year: yearStr }
      for (const [mod, yearData] of Object.entries(modules)) {
        entry[mod] = (yearData[yearStr] || 0)
      }
      return entry
    })
  }, [modules])

  const moduleOrder = ['instrumenten', 'inkoop', 'publiek', 'gemeente', 'provincie', 'apparaat']

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-4">
        Totale uitgaven per databron (2016–2024)
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
              tickLine={false}
              tickFormatter={(v: number) => formatEuro(v)}
              width={70}
            />
            <Tooltip
              formatter={(value) => [formatEuroFull(Number(value) || 0), '']}
              labelFormatter={(label) => `Jaar ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend
              formatter={(value: string) => MODULE_LABELS[value] || value}
              wrapperStyle={{ fontSize: 11 }}
            />
            {moduleOrder.map(mod => (
              <Area
                key={mod}
                type="monotone"
                dataKey={mod}
                stackId="1"
                stroke={MODULE_COLORS[mod]}
                fill={MODULE_COLORS[mod]}
                fillOpacity={0.7}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Concept Navigation Cards ─────────────────────────────────────
function ConceptCards({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const concepts = [
    { tab: 'new-money' as TabId, title: 'New Money', desc: 'Ontdek welke organisaties voor het eerst grote bedragen ontvangen', icon: '💰' },
    { tab: 'movers' as TabId, title: 'The Movers', desc: 'Volg de top 25 ontvangers door de jaren heen — wie stijgt, wie daalt?', icon: '📈' },
    { tab: 'ministry-dna' as TabId, title: 'Ministry DNA', desc: 'Vergelijk structurele uitgavenpatronen van alle ministeries', icon: '🧬' },
    { tab: 'treemap' as TabId, title: 'Spending Landscape', desc: 'Ontdek de hiërarchie van overheidsuitgaven: ministerie → regeling → instrument', icon: '🗺' },
    { tab: 'radar' as TabId, title: 'Dependency Radar', desc: 'Welke organisaties ontvangen geld via meerdere databronnen?', icon: '📡' },
    { tab: 'concentration' as TabId, title: 'Concentration Index', desc: 'Wordt de koek eerlijker verdeeld, of krijgen steeds minder organisaties meer?', icon: '⚖️' },
    { tab: 'anomalies' as TabId, title: 'Anomaly Detector', desc: 'Wat is er dramatisch veranderd? Explosieve groei, verdwijningen en uitschieters.', icon: '🔍' },
    { tab: 'money-flow' as TabId, title: 'Money Flow', desc: 'Volg het geld van ministerie via regeling naar de ontvangers.', icon: '💸' },
    { tab: 'share-shift' as TabId, title: 'Share Shift', desc: 'Hoe verschuift het aandeel van ministeries door de jaren?', icon: '📊' },
    { tab: 'sunburst' as TabId, title: 'Sunburst', desc: 'Zoom in op de hiërarchie: ministerie → regeling → ontvanger.', icon: '🎯' },
    { tab: 'growth' as TabId, title: 'Growth Comparator', desc: 'Vergelijk groeisnelheden ongeacht schaal — alles start op index 100.', icon: '📐' },
    { tab: 'velocity' as TabId, title: 'Spending Velocity', desc: 'Hoe snel veranderen uitgaven? Jaar-op-jaar als heatmap.', icon: '⚡' },
    { tab: 'deviation' as TabId, title: 'Patroon Afwijking', desc: 'Waar wijkt de werkelijkheid af van het historisch patroon?', icon: '📉' },
    { tab: 'spectrum' as TabId, title: 'Spending Spectrum', desc: 'Hoe is het geld verdeeld? Van €1K tot €1B+ in één overzicht.', icon: '🌈' },
    { tab: 'reverse-flow' as TabId, title: 'Reverse Flow', desc: 'Volg het geld terug: van ontvanger naar alle databronnen.', icon: '🔄' },
    { tab: 'ministry-cost' as TabId, title: 'Kostenstructuur', desc: 'Instrumenten vs apparaat: hoe verdelen ministeries hun budget?', icon: '🏛' },
    { tab: 'per-capita' as TabId, title: 'Per Capita', desc: 'Overheidsuitgaven per inwoner, per provincie.', icon: '👤' },
    { tab: 'regeling' as TabId, title: 'Regeling Profiel', desc: 'Dompel je onder in één regeling: verdeling, concentratie, ontvangers.', icon: '📋' },
    { tab: 'leaderboard' as TabId, title: 'Leaderboard', desc: 'Wie ontvangt het meeste? De top ontvangers per module en jaar.', icon: '🏆' },
    { tab: 'head-to-head' as TabId, title: 'Head-to-Head', desc: 'Vergelijk 2-3 organisaties op 6 dimensies in een radar chart.', icon: '⚔️' },
    { tab: 'top-tabellen' as TabId, title: 'Top Tabellen', desc: 'Klassieke ranglijsten: per begroting, ontvanger, instrument of regeling.', icon: '📑' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
      {concepts.map(c => (
        <button
          key={c.tab}
          onClick={() => onNavigate(c.tab)}
          className="text-left bg-white border border-[var(--border)] rounded-lg p-4 hover:border-[var(--navy-medium)] transition-colors group"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{c.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-[var(--navy-dark)] group-hover:text-[var(--pink)] transition-colors">
                {c.title}
              </h4>
              <p className="text-xs text-[var(--navy-medium)] mt-0.5 line-clamp-2">{c.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Spending Pulse (Concept 1) ───────────────────────────────────
function SpendingPulse({ data, onNavigate }: { data: PulseData; onNavigate: (tab: TabId) => void }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Totale uitgaven"
          values={data.kpis.total_per_year}
          formatFn={formatEuro}
        />
        <KpiCard
          label="Unieke ontvangers"
          values={data.kpis.recipients_per_year}
          formatFn={(n) => n.toLocaleString('nl-NL')}
        />
        <LargestKpiCard
          label="Grootste ontvanger"
          data={data.kpis.largest_per_year}
        />
        <KpiCard
          label="Gemiddeld per ontvanger"
          values={data.kpis.average_per_year}
          formatFn={formatEuro}
        />
      </div>

      {/* Hero Chart */}
      <HeroChart modules={data.modules} />

      {/* Provenance Footer */}
      <p className="text-xs text-[var(--navy-medium)]">
        Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · Bedragen in euro&apos;s
        {data.data_notes.scope.includes('10.000') && (
          <span className="ml-1">(sample — volledige dataset voor exacte cijfers)</span>
        )}
      </p>

      {/* Navigation Cards */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-2">
          Verder verkennen
        </h3>
        <ConceptCards onNavigate={onNavigate} />
      </div>
    </div>
  )
}

// ─── Loading Fallback ─────────────────────────────────────────────
function ConceptLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-[var(--navy-medium)] text-sm">Laden...</p>
    </div>
  )
}

// ─── Main H6 Component ───────────────────────────────────────────
export default function InzichtenDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('pulse')
  const [pulseData, setPulseData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/inzichten/pulse')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.error) throw new Error(data.error)
        setPulseData(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[var(--navy-medium)]">Inzichten laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-2">
            <p className="text-[var(--navy-dark)] font-medium">Fout bij het laden van data</p>
            <p className="text-sm text-[var(--navy-medium)]">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-[var(--navy-dark)]">
          Inzichten
          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">V5.0 prototype</span>
        </h1>
        <p className="text-sm text-[var(--navy-medium)] mt-0.5">
          Interactieve visualisaties van Nederlandse overheidsuitgaven — trends, patronen en anomalieën.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[var(--navy-dark)] text-[var(--navy-dark)]'
                : 'border-transparent text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'pulse' && pulseData && (
        <SpendingPulse data={pulseData} onNavigate={setActiveTab} />
      )}
      {activeTab === 'new-money' && (
        <Suspense fallback={<ConceptLoading />}>
          <NewMoney />
        </Suspense>
      )}
      {activeTab === 'movers' && (
        <Suspense fallback={<ConceptLoading />}>
          <Movers />
        </Suspense>
      )}
      {activeTab === 'ministry-dna' && (
        <Suspense fallback={<ConceptLoading />}>
          <MinistryDNA />
        </Suspense>
      )}
      {activeTab === 'treemap' && (
        <Suspense fallback={<ConceptLoading />}>
          <SpendingLandscape />
        </Suspense>
      )}
      {activeTab === 'radar' && (
        <Suspense fallback={<ConceptLoading />}>
          <DependencyRadar />
        </Suspense>
      )}
      {activeTab === 'concentration' && (
        <Suspense fallback={<ConceptLoading />}>
          <Concentration />
        </Suspense>
      )}
      {activeTab === 'anomalies' && (
        <Suspense fallback={<ConceptLoading />}>
          <Anomalies />
        </Suspense>
      )}
      {activeTab === 'money-flow' && (
        <Suspense fallback={<ConceptLoading />}>
          <MoneyFlow />
        </Suspense>
      )}
      {activeTab === 'share-shift' && (
        <Suspense fallback={<ConceptLoading />}>
          <ShareShift />
        </Suspense>
      )}
      {activeTab === 'sunburst' && (
        <Suspense fallback={<ConceptLoading />}>
          <SunburstView />
        </Suspense>
      )}
      {activeTab === 'growth' && (
        <Suspense fallback={<ConceptLoading />}>
          <GrowthComparator />
        </Suspense>
      )}
      {activeTab === 'velocity' && (
        <Suspense fallback={<ConceptLoading />}>
          <SpendingVelocity />
        </Suspense>
      )}
      {activeTab === 'deviation' && (
        <Suspense fallback={<ConceptLoading />}>
          <PatternDeviation />
        </Suspense>
      )}
      {activeTab === 'spectrum' && (
        <Suspense fallback={<ConceptLoading />}>
          <SpendingSpectrum />
        </Suspense>
      )}
      {activeTab === 'reverse-flow' && (
        <Suspense fallback={<ConceptLoading />}>
          <ReverseFlow />
        </Suspense>
      )}
      {activeTab === 'ministry-cost' && (
        <Suspense fallback={<ConceptLoading />}>
          <MinistryStructure />
        </Suspense>
      )}
      {activeTab === 'per-capita' && (
        <Suspense fallback={<ConceptLoading />}>
          <SpendingPerCapita />
        </Suspense>
      )}
      {activeTab === 'regeling' && (
        <Suspense fallback={<ConceptLoading />}>
          <RegelingProfile />
        </Suspense>
      )}
      {activeTab === 'leaderboard' && (
        <Suspense fallback={<ConceptLoading />}>
          <LeaderboardView />
        </Suspense>
      )}
      {activeTab === 'head-to-head' && (
        <Suspense fallback={<ConceptLoading />}>
          <HeadToHead />
        </Suspense>
      )}
      {activeTab === 'top-tabellen' && (
        <Suspense fallback={<ConceptLoading />}>
          <TopTabellen />
        </Suspense>
      )}
    </div>
  )
}
