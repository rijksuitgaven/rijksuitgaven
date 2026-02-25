'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'publiek', label: 'Publiek' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'apparaat', label: 'Apparaat' },
]

interface ConcentrationData {
  module: string
  gini_per_year: Record<string, number>
  top_n_shares: {
    top_10: Record<string, number>
    top_50: Record<string, number>
    top_100: Record<string, number>
  }
  recipients_per_year: Record<string, number>
  total_per_year: Record<string, number>
  lorenz: {
    year: number
    points: { pct_recipients: number; pct_amount: number }[]
  }
  data_notes: { last_updated: string; scope: string; note: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function KpiCard({ label, value, sparkData, suffix }: {
  label: string
  value: string
  sparkData: { year: number; value: number }[]
  suffix?: string
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between">
      <div className="text-xs text-[var(--navy-medium)] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-[var(--navy-dark)] tabular-nums mb-2">
        {value}{suffix || ''}
      </div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="value" stroke={NAVY_DARK} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Concentration() {
  const [module, setModule] = useState('instrumenten')
  const [data, setData] = useState<ConcentrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lorenzYear, setLorenzYear] = useState(2024)
  const [topNView, setTopNView] = useState<'top_10' | 'top_50' | 'top_100'>('top_10')

  // Fetch data when module or lorenz year changes
  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/inzichten/concentration?module=${module}&lorenz_year=${lorenzYear}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, lorenzYear])

  // Lorenz chart data
  const lorenzData = useMemo(() => {
    if (!data) return []
    return data.lorenz.points.map(p => ({
      pct_recipients: Math.round(p.pct_recipients * 10) / 10,
      pct_amount: Math.round(p.pct_amount * 10) / 10,
      equality: Math.round(p.pct_recipients * 10) / 10,
    }))
  }, [data])

  // Top-N share trend data
  const shareTrendData = useMemo(() => {
    if (!data) return []
    return YEARS.map(y => ({
      year: String(y),
      top_10: data.top_n_shares.top_10[String(y)] || 0,
      top_50: data.top_n_shares.top_50[String(y)] || 0,
      top_100: data.top_n_shares.top_100[String(y)] || 0,
    }))
  }, [data])

  // Gini sparkline data
  const giniSpark = useMemo(() => {
    if (!data) return []
    return YEARS.map(y => ({ year: y, value: data.gini_per_year[String(y)] || 0 }))
  }, [data])

  const recipientSpark = useMemo(() => {
    if (!data) return []
    return YEARS.map(y => ({ year: y, value: data.recipients_per_year[String(y)] || 0 }))
  }, [data])

  const top10Spark = useMemo(() => {
    if (!data) return []
    return YEARS.map(y => ({ year: y, value: data.top_n_shares.top_10[String(y)] || 0 }))
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Concentration Index</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wordt de koek eerlijker verdeeld, of krijgen steeds minder organisaties steeds meer?
        </p>
      </div>

      {/* Module selector */}
      <div className="flex gap-1">
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setModule(m.id)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              module === m.id
                ? 'bg-[var(--navy-dark)] text-white'
                : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              label="Gini-coëfficiënt 2024"
              value={String(data.gini_per_year['2024'] || 0)}
              sparkData={giniSpark}
            />
            <KpiCard
              label="Top-10 aandeel 2024"
              value={`${data.top_n_shares.top_10['2024'] || 0}%`}
              sparkData={top10Spark}
            />
            <KpiCard
              label="Ontvangers 2024"
              value={(data.recipients_per_year['2024'] || 0).toLocaleString('nl-NL')}
              sparkData={recipientSpark}
            />
          </div>

          {/* Lorenz Curve */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
                  Lorenzcurve — {lorenzYear}{lorenzYear === 2024 ? '*' : ''}
                </h3>
                <p className="text-[10px] text-[var(--navy-medium)] mt-0.5">
                  Hoe verder de curve onder de diagonaal buigt, hoe geconcentreerder de verdeling.
                </p>
              </div>
              <div className="flex gap-1">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => setLorenzYear(y)}
                    className={`w-7 h-6 text-[10px] rounded transition-colors ${
                      lorenzYear === y
                        ? 'bg-[var(--pink)] text-white'
                        : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
                    }`}
                  >
                    {String(y).slice(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lorenzData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="pct_recipients"
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    label={{ value: '% ontvangers (laag → hoog)', position: 'insideBottom', offset: -5, fontSize: 10, fill: NAVY_MEDIUM }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    label={{ value: '% totaalbedrag', angle: -90, position: 'insideLeft', fontSize: 10, fill: NAVY_MEDIUM }}
                    domain={[0, 100]}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const label = name === 'equality' ? 'Gelijke verdeling' : 'Werkelijke verdeling'
                      return [`${Number(value || 0).toFixed(1)}%`, label]
                    }}
                    labelFormatter={(label) => `${label}% van alle ontvangers`}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  {/* Equality line (diagonal) */}
                  <Area
                    type="linear"
                    dataKey="equality"
                    stroke="#9ca3af"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                    name="equality"
                  />
                  {/* Lorenz curve */}
                  <Area
                    type="monotone"
                    dataKey="pct_amount"
                    stroke={NAVY_DARK}
                    strokeWidth={2}
                    fill={NAVY_DARK}
                    fillOpacity={0.1}
                    name="lorenz"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-[var(--navy-medium)] mt-2 text-center">
              Gini-coëfficiënt: <strong>{data.gini_per_year[String(lorenzYear)] || '—'}</strong>
              {' '}· Interpretatie: {(data.gini_per_year[String(lorenzYear)] || 0) > 0.8
                ? 'Sterk geconcentreerd'
                : (data.gini_per_year[String(lorenzYear)] || 0) > 0.6
                  ? 'Matig geconcentreerd'
                  : 'Relatief gespreid'}
            </p>
          </div>

          {/* Top-N Share Trend */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
                Aandeel top ontvangers door de jaren (2016–2024)
              </h3>
              <div className="flex gap-1">
                {(['top_10', 'top_50', 'top_100'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => setTopNView(key)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      topNView === key
                        ? 'bg-[var(--pink)] text-white'
                        : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
                    }`}
                  >
                    {key === 'top_10' ? 'Top 10' : key === 'top_50' ? 'Top 50' : 'Top 100'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shareTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value || 0).toFixed(1)}%`, topNView === 'top_10' ? 'Top 10' : topNView === 'top_50' ? 'Top 50' : 'Top 100']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey={topNView}
                    fill={NAVY_DARK}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <ReferenceLine y={50} stroke={PINK} strokeDasharray="4 4" label={{ value: '50%', fontSize: 9, fill: PINK }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gini trend */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              Gini-coëfficiënt over tijd
            </h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={giniSpark} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: NAVY_MEDIUM }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value || 0).toFixed(3), 'Gini']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="value" stroke={PINK} strokeWidth={2} dot={{ r: 3, fill: PINK }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
            {lorenzYear === 2024 && <span> · *2024 data kan onvolledig zijn</span>}
          </p>
        </>
      ) : null}
    </div>
  )
}
