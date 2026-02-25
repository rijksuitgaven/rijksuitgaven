'use client'

import { useState, useEffect, useMemo } from 'react'

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

interface VelocityEntry {
  name: string
  changes: { pair: string; from_year: number; to_year: number; pct_change: number; absolute_change: number }[]
  avg_change: number
  volatility: number
}

interface VelocityData {
  module: string
  level: string
  year_pairs: string[]
  entities: VelocityEntry[]
  summary: { total_entities: number; avg_positive: number; avg_negative: number }
  data_notes: { last_updated: string; scope: string; note: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function getHeatColor(pct: number): string {
  if (pct >= 100) return '#b71c1c'
  if (pct >= 50) return '#e53935'
  if (pct >= 20) return '#ef9a9a'
  if (pct >= 5) return '#ffcdd2'
  if (pct > -5) return '#f5f5f5'
  if (pct > -20) return '#c8e6c9'
  if (pct > -50) return '#66bb6a'
  return '#2e7d32'
}

function getTextColor(pct: number): string {
  if (Math.abs(pct) >= 50) return '#fff'
  return NAVY_DARK
}

export default function SpendingVelocity() {
  const [module, setModule] = useState('instrumenten')
  const [level, setLevel] = useState('ministry')
  const [topN, setTopN] = useState(20)
  const [data, setData] = useState<VelocityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'volatility' | 'avg'>('volatility')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ module, level, top: String(topN) })
    fetch(`/api/v1/inzichten/spending-velocity?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, level, topN])

  const sortedEntities = useMemo(() => {
    if (!data) return []
    return [...data.entities].sort((a, b) =>
      sortBy === 'volatility' ? b.volatility - a.volatility : Math.abs(b.avg_change) - Math.abs(a.avg_change)
    )
  }, [data, sortBy])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Spending Velocity</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoe snel veranderen uitgaven? Jaar-op-jaar veranderingen als heatmap.
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

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Sorteer:</span>
          {[
            { id: 'volatility' as const, label: 'Volatiliteit' },
            { id: 'avg' as const, label: 'Gem. groei' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === s.id ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
              }`}
            >
              {s.label}
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
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[var(--navy-medium)]">
            <span>Krimp</span>
            <div className="flex gap-0.5">
              {['#2e7d32', '#66bb6a', '#c8e6c9', '#f5f5f5', '#ffcdd2', '#ef9a9a', '#e53935', '#b71c1c'].map(c => (
                <div key={c} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>Groei</span>
          </div>

          {/* Heatmap table */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 font-medium text-[var(--navy-dark)] sticky left-0 bg-white min-w-[180px]">
                    {level === 'ministry' ? 'Ministerie' : 'Ontvanger'}
                  </th>
                  {data.year_pairs.map(pair => (
                    <th key={pair} className="text-center px-2 py-2 font-medium text-[var(--navy-dark)] min-w-[70px]">
                      {pair}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2 font-medium text-[var(--navy-dark)] min-w-[60px]">Gem.</th>
                  <th className="text-center px-2 py-2 font-medium text-[var(--navy-dark)] min-w-[60px]">Vol.</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntities.map((entity, idx) => (
                  <tr key={entity.name} className={idx % 2 === 0 ? '' : 'bg-gray-50/50'}>
                    <td className="px-3 py-1.5 font-medium text-[var(--navy-dark)] sticky left-0 bg-inherit truncate max-w-[200px]" title={entity.name}>
                      {entity.name}
                    </td>
                    {data.year_pairs.map(pair => {
                      const change = entity.changes.find(c => c.pair === pair)
                      const pct = change?.pct_change || 0
                      return (
                        <td
                          key={pair}
                          className="text-center px-1 py-1.5 tabular-nums"
                          style={{ backgroundColor: getHeatColor(pct), color: getTextColor(pct) }}
                          title={change ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% (${formatEuro(change.absolute_change)})` : '—'}
                        >
                          {pct !== 0 ? `${pct > 0 ? '+' : ''}${Math.round(pct)}%` : '—'}
                        </td>
                      )
                    })}
                    <td className="text-center px-1 py-1.5 tabular-nums font-medium" style={{ color: entity.avg_change >= 0 ? '#2e7d32' : '#b71c1c' }}>
                      {entity.avg_change > 0 ? '+' : ''}{Math.round(entity.avg_change)}%
                    </td>
                    <td className="text-center px-1 py-1.5 tabular-nums text-[var(--navy-medium)]">
                      {Math.round(entity.volatility)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Geanalyseerd</p>
              <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{data.summary.total_entities}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Gem. groei</p>
              <p className="text-lg font-bold text-green-700 tabular-nums">+{Math.round(data.summary.avg_positive)}%</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Gem. krimp</p>
              <p className="text-lg font-bold text-red-700 tabular-nums">{Math.round(data.summary.avg_negative)}%</p>
            </div>
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
