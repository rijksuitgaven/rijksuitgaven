'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LineChart, Line,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'publiek', label: 'Publiek' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'apparaat', label: 'Apparaat' },
]

interface LeaderboardEntry {
  rank: number
  name: string
  amount: number
  total: number
  sparkline: { year: number; value: number }[]
}

interface LeaderboardData {
  module: string
  year: string
  top: number
  total_count: number
  entries: LeaderboardEntry[]
  highlight: (LeaderboardEntry & { in_top: boolean }) | null
  data_notes: { last_updated: string; scope: string; note: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function formatEuroFull(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export default function Leaderboard() {
  const [module, setModule] = useState('instrumenten')
  const [year, setYear] = useState('2024')
  const [topN, setTopN] = useState(25)
  const [highlightQuery, setHighlightQuery] = useState('')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      module,
      year,
      top: String(topN),
      ...(highlightQuery ? { highlight: highlightQuery } : {}),
    })
    fetch(`/api/v1/inzichten/leaderboard?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, year, topN, highlightQuery])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.entries.map(e => ({
      name: e.name.length > 30 ? e.name.slice(0, 28) + '...' : e.name,
      fullName: e.name,
      amount: e.amount,
      rank: e.rank,
      isHighlight: data.highlight?.name === e.name,
    })).reverse() // Reverse for horizontal bar (bottom = rank 1)
  }, [data])

  const chartHeight = useMemo(() => {
    return Math.max(400, (data?.entries.length || 25) * 28)
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Leaderboard</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wie ontvangt het meeste? De top ontvangers per module, jaar en bedrag.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Module */}
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

        {/* Top-N */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Top:</span>
          <div className="flex gap-1">
            {[10, 25, 50].map(n => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  topN === n ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Entity highlight */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Markeer:</span>
          <input
            type="text"
            value={highlightQuery}
            onChange={e => setHighlightQuery(e.target.value)}
            placeholder="Zoek organisatie..."
            className="px-2 py-1 text-xs border border-[var(--border)] rounded w-40 focus:outline-none focus:border-[var(--navy-medium)]"
          />
        </div>
      </div>

      {/* Year selector */}
      <div className="flex gap-1 overflow-x-auto">
        {YEARS.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              year === y
                ? 'bg-[var(--navy-dark)] text-white'
                : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
            }`}
          >
            {y === 'totaal' ? 'Alle jaren' : y}{y === '2024' ? '*' : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Context label */}
          <p className="text-xs text-[var(--navy-medium)]">
            Top {data.entries.length} van {data.total_count.toLocaleString('nl-NL')} ontvangers
            {data.highlight && !data.highlight.in_top && (
              <span className="ml-2 text-[var(--pink)]">
                · {data.highlight.name} staat op #{data.highlight.rank}
              </span>
            )}
          </p>

          {/* Lollipop chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
            <div style={{ minWidth: 600, height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 60, bottom: 5, left: 180 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) => formatEuro(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: NAVY_DARK }}
                    tickLine={false}
                    width={175}
                  />
                  <Tooltip
                    formatter={(value) => [formatEuroFull(Number(value || 0)), 'Bedrag']}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.isHighlight ? PINK : NAVY_DARK}
                        fillOpacity={entry.isHighlight ? 1 : 0.7}
                        cursor="pointer"
                        onClick={() => {
                          const full = data.entries.find(e => e.name === entry.fullName)
                          if (full) setSelectedEntry(full)
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail panel */}
          {selectedEntry && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
                    #{selectedEntry.rank} · {selectedEntry.name}
                  </h3>
                  <p className="text-xs text-[var(--navy-medium)]">
                    {year === 'totaal' ? 'Cumulatief' : year}: {formatEuroFull(selectedEntry.amount)}
                    {' '}· Totaal alle jaren: {formatEuroFull(selectedEntry.total)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]"
                >
                  Sluiten
                </button>
              </div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedEntry.sparkline} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                      tickLine={false}
                      tickFormatter={(v: number) => formatEuro(v)}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value) => [formatEuroFull(Number(value || 0)), 'Bedrag']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Line type="monotone" dataKey="value" stroke={PINK} strokeWidth={2} dot={{ r: 3, fill: PINK }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
