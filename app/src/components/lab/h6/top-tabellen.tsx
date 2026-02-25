'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, ResponsiveContainer,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const DIMENSIONS = [
  { id: 'begrotingsnaam', label: 'Op Begroting', icon: '🏛' },
  { id: 'ontvanger', label: 'Op Ontvanger', icon: '🏢' },
  { id: 'instrument', label: 'Op Instrument', icon: '📄' },
  { id: 'regeling', label: 'Op Regeling', icon: '📋' },
] as const

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']

interface TableEntry {
  rank: number
  name: string
  amount: number
  count: number
  totaal: number
  prev_rank: number | null
  rank_change: number | null
  sparkline: { year: number; value: number }[]
}

interface TabellenData {
  dimension: string
  dimension_label: string
  year: string
  mode: string
  top: number
  entries: TableEntry[]
  total_entities: number
  grand_total: number
  data_notes: { last_updated: string; scope: string; note: string }
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function RankBadge({ rank, prevRank, rankChange }: { rank: number; prevRank: number | null; rankChange: number | null }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold tabular-nums text-[var(--navy-dark)] w-6 text-right">{rank}</span>
      {prevRank !== null && rankChange !== null && (
        <span className="text-[10px] tabular-nums text-[var(--navy-medium)] w-10">
          {rankChange > 0 ? (
            <span className="text-green-600">▲ {rankChange}</span>
          ) : rankChange < 0 ? (
            <span className="text-red-500">▼ {Math.abs(rankChange)}</span>
          ) : (
            <span className="text-[var(--navy-medium)]">— 0</span>
          )}
        </span>
      )}
      {prevRank === null && <span className="w-10 text-[10px] text-amber-500">nieuw</span>}
    </div>
  )
}

function MiniSparkline({ data }: { data: { year: number; value: number }[] }) {
  return (
    <div className="w-[72px] h-[24px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
  )
}

export default function TopTabellen() {
  const [dimension, setDimension] = useState<string>('ontvanger')
  const [year, setYear] = useState('2024')
  const [mode, setMode] = useState<'year' | 'cumulative'>('year')
  const [topN, setTopN] = useState(50)
  const [data, setData] = useState<TabellenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      dimension,
      year: mode === 'cumulative' ? 'totaal' : year,
      mode,
      top: String(topN),
    })
    fetch(`/api/v1/inzichten/top-tabellen?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dimension, year, mode, topN])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Top Tabellen</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Ranglijsten per dimensie — wie ontvangt het meeste, per begroting, ontvanger, instrument of regeling.
        </p>
      </div>

      {/* Dimension tabs — mimicking old platform style */}
      <div className="bg-white border border-[var(--border)] rounded-lg">
        <div className="flex border-b border-[var(--border)]">
          {DIMENSIONS.map(dim => (
            <button
              key={dim.id}
              onClick={() => setDimension(dim.id)}
              className={`flex-1 px-4 py-3 text-center transition-colors relative ${
                dimension === dim.id
                  ? 'text-[var(--navy-dark)] font-semibold'
                  : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)]'
              }`}
            >
              <span className="text-sm">{dim.label}</span>
              {dimension === dim.id && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-[var(--pink)] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Period toggle + year selector */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-4 border-b border-gray-100">
          <div className="flex gap-1">
            <button
              onClick={() => setMode('year')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                mode === 'year'
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              Per jaar
            </button>
            <button
              onClick={() => setMode('cumulative')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                mode === 'cumulative'
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              Alle jaren samen
            </button>
          </div>

          {mode === 'year' && (
            <div className="flex gap-1">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    year === y
                      ? 'bg-[var(--pink)] text-white'
                      : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
                  }`}
                >
                  {y}{y === '2024' ? '*' : ''}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[var(--navy-medium)]">Top:</span>
            {[25, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  topN === n ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
          </div>
        ) : data ? (
          <div>
            {/* Context */}
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs text-[var(--navy-medium)]">
                Top {data.entries.length} van {data.total_entities.toLocaleString('nl-NL')} {data.dimension_label.toLowerCase()}
                {data.dimension_label.toLowerCase() !== 'ontvanger' ? '' : 's'}
                {' '}· Totaal: {formatCompact(data.grand_total)}
              </span>
              {year === '2024' && mode === 'year' && (
                <span className="text-xs text-amber-600">* 2024 data kan onvolledig zijn</span>
              )}
            </div>

            {/* Table header */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left pl-4 pr-2 py-2.5 text-xs font-semibold text-[var(--navy-dark)] w-[80px]">Positie</th>
                  <th className="text-left px-2 py-2.5 text-xs font-semibold text-[var(--navy-dark)]">{data.dimension_label}</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold text-[var(--navy-dark)] w-[72px]">Trend</th>
                  <th className="text-right px-2 py-2.5 text-xs font-semibold text-[var(--navy-dark)] w-[100px]">Aantal</th>
                  <th className="text-right pl-2 pr-4 py-2.5 text-xs font-semibold text-[var(--navy-dark)] w-[140px]">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => {
                  const shareOfTotal = data.grand_total > 0 ? (entry.amount / data.grand_total) * 100 : 0
                  const isHovered = hoveredRow === entry.rank

                  return (
                    <tr
                      key={entry.name}
                      className={`border-b border-gray-100 last:border-0 transition-colors ${
                        isHovered ? 'bg-blue-50/50' : entry.rank % 2 === 0 ? 'bg-gray-50/30' : ''
                      }`}
                      onMouseEnter={() => setHoveredRow(entry.rank)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="pl-4 pr-2 py-2">
                        <RankBadge rank={entry.rank} prevRank={entry.prev_rank} rankChange={entry.rank_change} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="min-w-0">
                          <span className={`text-sm block truncate ${entry.rank <= 3 ? 'font-semibold' : 'font-medium'} text-[var(--navy-dark)]`}>
                            {entry.name}
                          </span>
                          {/* Proportional bar */}
                          <div className="mt-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, shareOfTotal * (100 / Math.max(1, (data.entries[0]?.amount / data.grand_total) * 100)))}%`,
                                backgroundColor: entry.rank <= 3 ? PINK : NAVY_DARK,
                                opacity: entry.rank <= 3 ? 0.8 : 0.3,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <MiniSparkline data={entry.sparkline} />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="text-xs tabular-nums text-[var(--navy-medium)]">
                          {entry.count.toLocaleString('nl-NL')}
                        </span>
                      </td>
                      <td className="pl-2 pr-4 py-2 text-right">
                        <span className={`text-sm tabular-nums ${entry.rank <= 3 ? 'font-semibold text-[var(--navy-dark)]' : 'font-medium text-[var(--navy-dark)]'}`}>
                          {formatEuro(entry.amount)}
                        </span>
                        <span className="block text-[10px] tabular-nums text-[var(--navy-medium)]">
                          {shareOfTotal.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border)] bg-gray-50/50">
              <p className="text-xs text-[var(--navy-medium)]">
                Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
