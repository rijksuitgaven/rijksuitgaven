'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'apparaat', label: 'Apparaat' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'publiek', label: 'Publiek' },
]

const DEVIATION_YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

interface DeviatorEntry {
  name: string
  actual: number
  expected: number
  deviation: number
  deviation_pct: number
  abs_deviation: number
  history: { year: number; actual: number; expected: number; deviation: number; deviation_pct: number }[]
}

interface DeviationData {
  module: string
  year: number
  level: string
  deviators: DeviatorEntry[]
  summary: { total_analyzed: number; above_pattern: number; below_pattern: number; total_above: number; total_below: number }
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

function getDeviationColor(pct: number): string {
  if (pct > 50) return '#b71c1c'
  if (pct > 20) return '#e53935'
  if (pct > 0) return '#ef9a9a'
  if (pct > -20) return '#a5d6a7'
  if (pct > -50) return '#66bb6a'
  return '#2e7d32'
}

export default function PatternDeviation() {
  const [module, setModule] = useState('instrumenten')
  const [year, setYear] = useState(2024)
  const [level, setLevel] = useState('ministry')
  const [data, setData] = useState<DeviationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<DeviatorEntry | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ module, year: String(year), level, top: '30' })
    fetch(`/api/v1/inzichten/pattern-deviation?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, year, level])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.deviators.map(d => ({
      name: d.name.length > 35 ? d.name.slice(0, 33) + '...' : d.name,
      fullName: d.name,
      deviation: d.deviation,
      deviation_pct: d.deviation_pct,
      isPositive: d.deviation > 0,
    }))
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Patroon Afwijking</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Waar wijkt de werkelijkheid af van het historisch patroon? Op basis van 3-jarig voortschrijdend gemiddelde.
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1 inline-block">
          Let op: dit is géén begrotingsafwijking — het vergelijkt met het eigen historisch patroon.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Niveau:</span>
          {['ministry', 'entity'].map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                level === l ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
              }`}
            >
              {l === 'ministry' ? 'Ministerie' : 'Ontvanger'}
            </button>
          ))}
        </div>

        <div className="flex gap-1 border-l border-[var(--border)] pl-4">
          {DEVIATION_YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                year === y
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {y}{y === 2024 ? '*' : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Geanalyseerd</p>
              <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{data.summary.total_analyzed}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Boven patroon</p>
              <p className="text-lg font-bold text-red-700 tabular-nums">{data.summary.above_pattern}</p>
              <p className="text-xs text-red-500 tabular-nums">+{formatEuro(data.summary.total_above)}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Onder patroon</p>
              <p className="text-lg font-bold text-green-700 tabular-nums">{data.summary.below_pattern}</p>
              <p className="text-xs text-green-600 tabular-nums">{formatEuro(data.summary.total_below)}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Netto afwijking</p>
              <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">
                {formatEuro(data.summary.total_above + data.summary.total_below)}
              </p>
            </div>
          </div>

          {/* Deviation bar chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              Top afwijkingen — {year} vs. verwachting (3-jarig gemiddelde)
            </h3>
            <div style={{ height: Math.max(400, chartData.length * 28) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 60, bottom: 5, left: 200 }}>
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
                    width={195}
                  />
                  <Tooltip
                    formatter={(value) => [formatEuroFull(Number(value || 0)), 'Afwijking']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <ReferenceLine x={0} stroke={NAVY_DARK} strokeWidth={1} />
                  <Bar dataKey="deviation" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.isPositive ? '#e53935' : '#43a047'}
                        cursor="pointer"
                        onClick={() => {
                          const full = data.deviators.find(d => d.name === entry.fullName)
                          if (full) setSelectedEntity(full)
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Entity detail: deviation history heatmap */}
          {selectedEntity && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--navy-dark)]">{selectedEntity.name}</h3>
                  <p className="text-xs text-[var(--navy-medium)]">
                    {year}: Werkelijk {formatEuroFull(selectedEntity.actual)} · Verwacht {formatEuroFull(selectedEntity.expected)}
                    · Afwijking {selectedEntity.deviation_pct > 0 ? '+' : ''}{selectedEntity.deviation_pct}%
                  </p>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                  Sluiten
                </button>
              </div>

              {/* History heatmap */}
              <div className="flex gap-2">
                {selectedEntity.history.map(h => (
                  <div
                    key={h.year}
                    className="flex-1 rounded-lg p-2 text-center"
                    style={{ backgroundColor: getDeviationColor(h.deviation_pct) }}
                  >
                    <p className="text-xs font-medium" style={{ color: Math.abs(h.deviation_pct) > 30 ? '#fff' : NAVY_DARK }}>
                      {h.year}{h.year === 2024 ? '*' : ''}
                    </p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: Math.abs(h.deviation_pct) > 30 ? '#fff' : NAVY_DARK }}>
                      {h.deviation_pct > 0 ? '+' : ''}{h.deviation_pct}%
                    </p>
                    <p className="text-xs tabular-nums mt-0.5" style={{ color: Math.abs(h.deviation_pct) > 30 ? 'rgba(255,255,255,0.8)' : NAVY_MEDIUM }}>
                      {formatEuro(h.deviation)}
                    </p>
                  </div>
                ))}
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
