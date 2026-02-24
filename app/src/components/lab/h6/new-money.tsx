'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts'

const PINK = '#e91e63'
const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
const ALL_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
const THRESHOLDS = [
  { value: 100_000, label: '€100K' },
  { value: 1_000_000, label: '€1M' },
  { value: 10_000_000, label: '€10M' },
  { value: 50_000_000, label: '€50M' },
]

interface Entrant {
  ontvanger: string
  first_year: number
  first_amount: number
  totaal: number
  sources: string
  source_count: number
  subsequent: Record<string, number>
}

interface NewMoneyData {
  year: number
  min_amount: number
  entrants: Entrant[]
  total_count: number
  total_amount: number
  year_counts: Record<string, number>
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

function SourceBadges({ sources }: { sources: string }) {
  const mods = sources.split(',').map(s => s.trim())
  return (
    <div className="flex gap-1 flex-wrap">
      {mods.map(mod => (
        <span key={mod} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[var(--navy-medium)]">
          {mod}
        </span>
      ))}
    </div>
  )
}

function SubsequentSparkline({ data }: { data: Record<string, number> }) {
  const chartData = ALL_YEARS.map(y => ({ year: y, value: data[String(y)] || 0 }))
  return (
    <div className="h-6 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={NAVY_DARK} strokeWidth={1} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function NewMoney() {
  const [year, setYear] = useState(2024)
  const [threshold, setThreshold] = useState(1_000_000)
  const [data, setData] = useState<NewMoneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setExpandedIdx(null)
    fetch(`/api/v1/inzichten/new-entrants?year=${year}&min_amount=${threshold}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, threshold])

  const barData = useMemo(() => {
    if (!data) return []
    return data.entrants.slice(0, 30).map((e, i) => ({
      name: e.ontvanger.length > 35 ? e.ontvanger.slice(0, 32) + '...' : e.ontvanger,
      fullName: e.ontvanger,
      amount: e.first_amount,
      idx: i,
    }))
  }, [data])

  return (
    <div className="space-y-5">
      {/* Header + Summary */}
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">New Money</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Organisaties die voor het eerst in de dataset verschijnen met significante bedragen.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year selector */}
        <div className="flex gap-1">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                year === y
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {y}{y === 2024 ? '*' : ''}
            </button>
          ))}
        </div>

        {/* Threshold */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Minimum:</span>
          <div className="flex gap-1">
            {THRESHOLDS.map(t => (
              <button
                key={t.value}
                onClick={() => setThreshold(t.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  threshold === t.value
                    ? 'bg-[var(--pink)] text-white'
                    : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary stat */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-4">
            <p className="text-sm text-[var(--navy-dark)]">
              In <strong>{data.year}</strong>, verschenen{' '}
              <strong className="text-[var(--pink)]">{data.total_count}</strong> nieuwe ontvangers
              met samen <strong className="text-[var(--pink)]">{formatEuro(data.total_amount)}</strong>.
            </p>
            <p className="text-xs text-[var(--navy-medium)] mt-1">
              {data.data_notes.note}
            </p>
          </div>

          {/* Year overview bar */}
          {data.year_counts && (
            <div className="flex items-end gap-1 h-12">
              {YEARS.map(y => {
                const count = data.year_counts[String(y)] || 0
                const maxCount = Math.max(...Object.values(data.year_counts))
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className="flex-1 flex flex-col items-center gap-0.5"
                    title={`${y}: ${count} nieuwe ontvangers`}
                  >
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${height}%`,
                        minHeight: count > 0 ? 4 : 1,
                        backgroundColor: y === year ? PINK : '#e5e7eb',
                      }}
                    />
                    <span className={`text-[9px] ${y === year ? 'font-bold text-[var(--navy-dark)]' : 'text-[var(--navy-medium)]'}`}>
                      {y}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Main bar chart */}
          {barData.length > 0 ? (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-3">
                Nieuwe ontvangers in {year} (top {Math.min(30, data.total_count)})
              </h3>
              <div style={{ height: Math.max(200, barData.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 160 }}>
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                      tickFormatter={(v: number) => formatEuro(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: NAVY_DARK }}
                      width={160}
                    />
                    <Tooltip
                      formatter={(value) => [formatEuroFull(Number(value) || 0), 'Bedrag']}
                      labelFormatter={(label) => {
                        const entry = barData.find(b => b.name === String(label))
                        return entry?.fullName || String(label)
                      }}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} cursor="pointer"
                      onClick={(_, idx) => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      {barData.map((_, i) => (
                        <Cell key={i} fill={expandedIdx === i ? PINK : NAVY_DARK} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[var(--border)] rounded-lg p-8 text-center">
              <p className="text-sm text-[var(--navy-medium)]">
                Geen nieuwe ontvangers gevonden voor {year} boven {formatEuro(threshold)}.
              </p>
            </div>
          )}

          {/* Expanded detail */}
          {expandedIdx !== null && data.entrants[expandedIdx] && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5 animate-in slide-in-from-top-2">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--navy-dark)]">
                    {data.entrants[expandedIdx].ontvanger}
                  </h4>
                  <p className="text-xs text-[var(--navy-medium)] mt-0.5">
                    Eerste verschijning: {data.entrants[expandedIdx].first_year} ·
                    Totaal alle jaren: {formatEuro(data.entrants[expandedIdx].totaal)}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedIdx(null)}
                  className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]"
                >
                  Sluiten
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Modules */}
                <div>
                  <p className="text-xs font-medium text-[var(--navy-dark)] mb-1">Databronnen ({data.entrants[expandedIdx].source_count})</p>
                  <SourceBadges sources={data.entrants[expandedIdx].sources} />
                </div>

                {/* Sparkline */}
                <div>
                  <p className="text-xs font-medium text-[var(--navy-dark)] mb-1">Verloop (2016–2024)</p>
                  <SubsequentSparkline data={data.entrants[expandedIdx].subsequent} />
                </div>
              </div>

              {/* Year breakdown table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {ALL_YEARS.map(y => (
                        <th key={y} className={`px-2 py-1 text-center font-medium ${
                          y === data.entrants[expandedIdx!].first_year ? 'text-[var(--pink)]' : 'text-[var(--navy-medium)]'
                        }`}>
                          {y}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {ALL_YEARS.map(y => {
                        const amount = data.entrants[expandedIdx!].subsequent[String(y)] || 0
                        return (
                          <td key={y} className={`px-2 py-1 text-center tabular-nums ${
                            y === data.entrants[expandedIdx!].first_year ? 'font-bold text-[var(--pink)]' : 'text-[var(--navy-dark)]'
                          }`}>
                            {amount > 0 ? formatEuro(amount) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope}
          </p>
        </>
      ) : null}
    </div>
  )
}
