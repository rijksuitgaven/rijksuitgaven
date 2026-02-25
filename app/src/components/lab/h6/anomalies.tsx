'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const RED = '#dc2626'
const ORANGE = '#ea580c'
const BLUE = '#2563eb'
const GRAY = '#6b7280'

type AnomalyType = 'explosive_growth' | 'sharp_decline' | 'new_large' | 'disappeared'

const ANOMALY_CONFIG: Record<AnomalyType, { label: string; labelNl: string; color: string; icon: string }> = {
  explosive_growth: { label: 'Explosive Growth', labelNl: 'Explosieve groei', color: RED, icon: '🔺' },
  sharp_decline: { label: 'Sharp Decline', labelNl: 'Scherpe daling', color: ORANGE, icon: '🔻' },
  new_large: { label: 'New & Large', labelNl: 'Nieuw & groot', color: BLUE, icon: '🆕' },
  disappeared: { label: 'Disappeared', labelNl: 'Verdwenen', color: GRAY, icon: '👻' },
}

const YEAR_PAIRS = [
  { from: 2016, to: 2017 }, { from: 2017, to: 2018 }, { from: 2018, to: 2019 },
  { from: 2019, to: 2020 }, { from: 2020, to: 2021 }, { from: 2021, to: 2022 },
  { from: 2022, to: 2023 }, { from: 2023, to: 2024 },
]

const THRESHOLDS = [
  { value: 100_000, label: '€100K' },
  { value: 1_000_000, label: '€1M' },
  { value: 5_000_000, label: '€5M' },
  { value: 10_000_000, label: '€10M' },
]

interface Anomaly {
  ontvanger: string
  type: AnomalyType
  amount_from: number
  amount_to: number
  abs_change: number
  pct_change: number | null
  sources: string
  source_count: number
}

interface AnomaliesData {
  year_from: number
  year_to: number
  min_amount: number
  anomalies: Anomaly[]
  total_count: number
  summary: {
    explosive_growth: number
    sharp_decline: number
    new_large: number
    disappeared: number
    total_amount_involved: number
  }
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

export default function Anomalies() {
  const [yearPairIdx, setYearPairIdx] = useState(YEAR_PAIRS.length - 1)
  const [threshold, setThreshold] = useState(1_000_000)
  const [data, setData] = useState<AnomaliesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTypes, setActiveTypes] = useState<Set<AnomalyType>>(new Set(['explosive_growth', 'sharp_decline', 'new_large', 'disappeared']))
  const [viewMode, setViewMode] = useState<'scatter' | 'table'>('scatter')
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)

  const yearPair = YEAR_PAIRS[yearPairIdx]

  useEffect(() => {
    setLoading(true)
    setSelectedAnomaly(null)
    fetch(`/api/v1/inzichten/anomalies?year_from=${yearPair.from}&year_to=${yearPair.to}&min_amount=${threshold}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [yearPair.from, yearPair.to, threshold])

  const toggleType = (type: AnomalyType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const filteredAnomalies = useMemo(() => {
    if (!data) return []
    return data.anomalies.filter(a => activeTypes.has(a.type))
  }, [data, activeTypes])

  // Scatter data: x = max(amount_from, amount_to), y = pct_change (capped)
  const scatterData = useMemo(() => {
    return filteredAnomalies.slice(0, 100).map(a => ({
      x: Math.max(a.amount_from, a.amount_to),
      y: a.pct_change !== null ? Math.max(-100, Math.min(a.pct_change, 2000)) : (a.type === 'new_large' ? 1000 : -100),
      z: a.abs_change,
      name: a.ontvanger,
      type: a.type,
      original: a,
    }))
  }, [filteredAnomalies])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Anomaly Detector</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wat is er dramatisch veranderd? Ontdek explosieve groei, scherpe dalingen en verschijningen.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year pair selector */}
        <div className="flex gap-1">
          {YEAR_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              onClick={() => setYearPairIdx(idx)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                yearPairIdx === idx
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {pair.to}{pair.to === 2024 ? '*' : ''}
            </button>
          ))}
        </div>

        {/* Threshold */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Min:</span>
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

        {/* View mode */}
        <div className="flex gap-1 border-l border-[var(--border)] pl-4">
          <button
            onClick={() => setViewMode('scatter')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'scatter' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Scatter
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'table' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Tabel
          </button>
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
            {(Object.entries(ANOMALY_CONFIG) as [AnomalyType, typeof ANOMALY_CONFIG[AnomalyType]][]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`bg-white border rounded-lg p-3 text-left transition-all ${
                  activeTypes.has(type)
                    ? 'border-current shadow-sm'
                    : 'border-[var(--border)] opacity-40'
                }`}
                style={{ borderColor: activeTypes.has(type) ? config.color : undefined }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-[10px] font-medium text-[var(--navy-medium)] uppercase tracking-wide">{config.labelNl}</span>
                </div>
                <span className="text-lg font-bold tabular-nums" style={{ color: config.color }}>
                  {data.summary[type]}
                </span>
              </button>
            ))}
          </div>

          {/* Scatter plot */}
          {viewMode === 'scatter' ? (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-3">
                {yearPair.from} → {yearPair.to}: {filteredAnomalies.length} anomalieën
              </h3>
              {scatterData.length > 0 ? (
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Bedrag"
                        tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                        tickFormatter={(v: number) => formatEuro(v)}
                        label={{ value: `Bedrag in ${yearPair.to}`, position: 'insideBottom', offset: -10, fontSize: 10, fill: NAVY_MEDIUM }}
                        scale="log"
                        domain={['auto', 'auto']}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Verandering %"
                        tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                        tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
                        label={{ value: 'Verandering %', angle: -90, position: 'insideLeft', fontSize: 10, fill: NAVY_MEDIUM }}
                        width={55}
                      />
                      <ZAxis type="number" dataKey="z" range={[20, 400]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]?.payload
                          if (!d?.original) return null
                          const a: Anomaly = d.original
                          const config = ANOMALY_CONFIG[a.type]
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 max-w-xs">
                              <p className="text-xs font-semibold text-[var(--navy-dark)] mb-1">{a.ontvanger}</p>
                              <p className="text-[10px] mb-1" style={{ color: config.color }}>
                                {config.icon} {config.labelNl}
                              </p>
                              <p className="text-[10px] text-[var(--navy-medium)]">
                                {yearPair.from}: {formatEuroFull(a.amount_from)}
                              </p>
                              <p className="text-[10px] text-[var(--navy-medium)]">
                                {yearPair.to}: {formatEuroFull(a.amount_to)}
                              </p>
                              <p className="text-[10px] text-[var(--navy-medium)]">
                                Verschil: {formatEuroFull(a.abs_change)}
                                {a.pct_change !== null && ` (${a.pct_change > 0 ? '+' : ''}${a.pct_change}%)`}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Scatter data={scatterData} cursor="pointer"
                        onClick={(d) => { if (d?.original) setSelectedAnomaly(d.original) }}
                      >
                        {scatterData.map((entry, idx) => (
                          <Cell key={idx} fill={ANOMALY_CONFIG[entry.type].color} fillOpacity={0.7} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-[var(--navy-medium)] text-center py-12">
                  Geen anomalieën gevonden met deze filters.
                </p>
              )}
            </div>
          ) : (
            /* Table view */
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-3 py-2 font-medium text-[var(--navy-medium)]">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-[var(--navy-medium)]">Ontvanger</th>
                    <th className="text-right px-3 py-2 font-medium text-[var(--navy-medium)]">{yearPair.from}</th>
                    <th className="text-right px-3 py-2 font-medium text-[var(--navy-medium)]">{yearPair.to}</th>
                    <th className="text-right px-3 py-2 font-medium text-[var(--navy-medium)]">Verschil</th>
                    <th className="text-right px-3 py-2 font-medium text-[var(--navy-medium)]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalies.slice(0, 100).map((a, i) => {
                    const config = ANOMALY_CONFIG[a.type]
                    return (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => setSelectedAnomaly(selectedAnomaly?.ontvanger === a.ontvanger ? null : a)}
                      >
                        <td className="px-3 py-2">
                          <span className="text-sm">{config.icon}</span>
                        </td>
                        <td className="px-3 py-2 font-medium text-[var(--navy-dark)] truncate max-w-[250px]" title={a.ontvanger}>
                          {a.ontvanger}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--navy-dark)]">
                          {a.amount_from > 0 ? formatEuro(a.amount_from) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[var(--navy-dark)]">
                          {a.amount_to > 0 ? formatEuro(a.amount_to) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: config.color }}>
                          {formatEuro(a.abs_change)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: config.color }}>
                          {a.pct_change !== null ? `${a.pct_change > 0 ? '+' : ''}${a.pct_change}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected anomaly detail */}
          {selectedAnomaly && (
            <div className="bg-white border rounded-lg p-4" style={{ borderColor: ANOMALY_CONFIG[selectedAnomaly.type].color }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--navy-dark)]">{selectedAnomaly.ontvanger}</h4>
                  <p className="text-xs mt-0.5" style={{ color: ANOMALY_CONFIG[selectedAnomaly.type].color }}>
                    {ANOMALY_CONFIG[selectedAnomaly.type].icon} {ANOMALY_CONFIG[selectedAnomaly.type].labelNl}
                  </p>
                </div>
                <button onClick={() => setSelectedAnomaly(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                  Sluiten
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[var(--navy-medium)]">{yearPair.from}:</span>
                  <span className="ml-1 font-medium text-[var(--navy-dark)]">{formatEuroFull(selectedAnomaly.amount_from)}</span>
                </div>
                <div>
                  <span className="text-[var(--navy-medium)]">{yearPair.to}:</span>
                  <span className="ml-1 font-medium text-[var(--navy-dark)]">{formatEuroFull(selectedAnomaly.amount_to)}</span>
                </div>
                <div>
                  <span className="text-[var(--navy-medium)]">Verschil:</span>
                  <span className="ml-1 font-medium" style={{ color: ANOMALY_CONFIG[selectedAnomaly.type].color }}>
                    {formatEuroFull(selectedAnomaly.abs_change)}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {selectedAnomaly.sources.split(',').map(s => (
                  <span key={s.trim()} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[var(--navy-medium)]">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            {yearPair.from} → {yearPair.to} · {data.total_count} anomalieën ·
            Totaal betrokken: {formatEuro(data.summary.total_amount_involved)} ·
            {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
