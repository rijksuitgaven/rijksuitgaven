'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const CATEGORY_COLORS: Record<string, string> = {
  instrumenten: '#1a2332',
  apparaat: '#5c6bc0',
  inkoop: '#e91e63',
}

interface MinistryEntry {
  name: string
  instrumenten: number
  apparaat: number
  inkoop: number
  total: number
  instrumenten_pct: number
  apparaat_pct: number
  inkoop_pct: number
}

interface StructureData {
  year: string
  ministries: MinistryEntry[]
  total_ministries: number
  modules_included: string[]
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

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

export default function MinistryStructure() {
  const [year, setYear] = useState('2024')
  const [viewMode, setViewMode] = useState<'absolute' | 'proportional'>('absolute')
  const [data, setData] = useState<StructureData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/inzichten/ministry-structure?year=${year}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.ministries.map(m => ({
      name: m.name.length > 25 ? m.name.slice(0, 23) + '...' : m.name,
      fullName: m.name,
      instrumenten: viewMode === 'proportional' ? m.instrumenten_pct : m.instrumenten,
      apparaat: viewMode === 'proportional' ? m.apparaat_pct : m.apparaat,
      total: m.total,
    })).reverse()
  }, [data, viewMode])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Ministry Cost Structure</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoe verdelen ministeries hun uitgaven over instrumenten (subsidies) en apparaat (personeel)?
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Weergave:</span>
          {[
            { id: 'absolute' as const, label: 'Absoluut (€)' },
            { id: 'proportional' as const, label: 'Verhouding (%)' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                viewMode === v.id
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {v.label}
            </button>
          ))}
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
          {/* Stacked bar chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              Kostenstructuur per ministerie — {year === 'totaal' ? 'Cumulatief' : year}
            </h3>
            <div style={{ height: Math.max(400, chartData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 60, bottom: 5, left: 180 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) => viewMode === 'proportional' ? `${v}%` : formatEuro(v)}
                    domain={viewMode === 'proportional' ? [0, 100] : undefined}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: NAVY_DARK }}
                    tickLine={false}
                    width={175}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const label = name === 'instrumenten' ? 'Instrumenten' : name === 'apparaat' ? 'Apparaat' : 'Inkoop'
                      return [viewMode === 'proportional' ? `${value}%` : formatEuroFull(Number(value || 0)), label]
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'instrumenten' ? 'Instrumenten (subsidies)' :
                      value === 'apparaat' ? 'Apparaat (personeel)' : value
                    }
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="instrumenten" stackId="1" fill={CATEGORY_COLORS.instrumenten} />
                  <Bar dataKey="apparaat" stackId="1" fill={CATEGORY_COLORS.apparaat} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 font-medium text-[var(--navy-dark)]">Ministerie</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--navy-dark)]">Instrumenten</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--navy-dark)]">Apparaat</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--navy-dark)]">Totaal</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--navy-dark)]">Instr. %</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--navy-dark)]">App. %</th>
                </tr>
              </thead>
              <tbody>
                {data.ministries.map((m, idx) => (
                  <tr key={m.name} className={idx % 2 === 0 ? '' : 'bg-gray-50/50'}>
                    <td className="px-3 py-1.5 text-[var(--navy-dark)] font-medium truncate max-w-[250px]">{m.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[var(--navy-medium)]">{formatEuro(m.instrumenten)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[var(--navy-medium)]">{formatEuro(m.apparaat)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[var(--navy-dark)]">{formatEuro(m.total)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[var(--navy-medium)]">{m.instrumenten_pct}%</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[var(--navy-medium)]">{m.apparaat_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note about missing modules */}
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Gebaseerd op modules met begrotingsnaam (instrumenten + apparaat). Inkoop, gemeente, provincie en publiek zijn niet opgenomen (geen begrotingsnaam in de data).
          </p>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
