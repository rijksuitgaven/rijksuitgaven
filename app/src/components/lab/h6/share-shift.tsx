'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'

// Distinct colors for up to 13 ministries (12 + Overig)
const MINISTRY_COLORS = [
  '#1a2332', '#e91e63', '#5c6bc0', '#26a69a', '#8d6e63',
  '#37474f', '#7986cb', '#ad1457', '#00897b', '#6d4c41',
  '#546e7a', '#ef5350', '#78909c',
]

interface ShareShiftData {
  ministries: string[]
  ministry_summary: { name: string; total: number; latest: number }[]
  chart_data: Record<string, number | string>[]
  total_ministries: number
  overig_count: number
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

export default function ShareShift() {
  const [mode, setMode] = useState<'absolute' | 'proportional'>('proportional')
  const [data, setData] = useState<ShareShiftData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/v1/inzichten/share-shift?top=12')
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => {
    if (!data) return []
    if (mode === 'proportional') {
      // Use _pct fields
      return data.chart_data.map(row => {
        const entry: Record<string, number | string> = { year: row.year }
        for (const name of data.ministries) {
          entry[name] = Number(row[`${name}_pct`]) || 0
        }
        return entry
      })
    }
    return data.chart_data
  }, [data, mode])

  // Truncate ministry names for legend
  const truncateName = (name: string) => name.length > 22 ? name.slice(0, 20) + '...' : name

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Share Shift</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoe verschuift het aandeel van ministeries in de totale uitgaven door de jaren heen?
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Weergave:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setMode('proportional')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                mode === 'proportional'
                  ? 'bg-[var(--pink)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              Proportioneel (100%)
            </button>
            <button
              onClick={() => setMode('absolute')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                mode === 'absolute'
                  ? 'bg-[var(--pink)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              Absoluut (€)
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Context */}
          <p className="text-xs text-[var(--navy-medium)]">
            Top {data.ministries.filter(m => m !== 'Overig').length} ministeries van {data.total_ministries} totaal
            {data.overig_count > 0 && ` · ${data.overig_count} ministeries in "Overig"`}
          </p>

          {/* Stacked bar chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-3">
              {mode === 'proportional'
                ? 'Aandeel per ministerie (2016–2024)'
                : 'Uitgaven per ministerie (2016–2024)'}
            </h3>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      mode === 'proportional' ? `${v}%` : formatEuro(v)
                    }
                    width={mode === 'proportional' ? 40 : 70}
                    domain={mode === 'proportional' ? [0, 100] : ['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value || 0)
                      if (mode === 'proportional') {
                        return [`${v.toFixed(1)}%`, String(name)]
                      }
                      return [formatEuroFull(v), String(name)]
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    labelFormatter={(label) => `${label}${label === '2024' ? '*' : ''}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value: string) => truncateName(value)}
                  />
                  {data.ministries.map((name, idx) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="1"
                      fill={MINISTRY_COLORS[idx % MINISTRY_COLORS.length]}
                      fillOpacity={name === 'Overig' ? 0.4 : 0.85}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ministry summary table */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 text-[var(--navy-medium)] font-medium">Ministerie</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Totaal (2016–2024)</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">2024*</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Aandeel 2024</th>
                </tr>
              </thead>
              <tbody>
                {data.ministry_summary.map((m, idx) => {
                  const grandTotal2024 = data.ministry_summary.reduce((s, ms) => s + (ms.latest || 0), 0)
                  const share = grandTotal2024 > 0 ? ((m.latest || 0) / grandTotal2024) * 100 : 0
                  return (
                    <tr key={m.name} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-2 text-[var(--navy-dark)]">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: MINISTRY_COLORS[idx % MINISTRY_COLORS.length] }}
                        />
                        {m.name}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{formatEuro(m.total)}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{formatEuro(m.latest || 0)}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{share.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
