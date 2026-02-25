'use client'

import { useState, useEffect, useMemo } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'

const COLORS = [
  '#1a2332', '#5c6bc0', '#26a69a', '#e91e63', '#8d6e63',
  '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a', '#ffa726',
  '#78909c', '#ab47bc', '#29b6f6', '#ff7043', '#9ccc65',
]

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'apparaat', label: 'Apparaat' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'publiek', label: 'Publiek' },
]

interface BumpSeries {
  name: string
  ranks: { year: number; rank: number; value: number }[]
  total: number
}

interface BumpData {
  module: string
  level: string
  years: number[]
  series: BumpSeries[]
  data_notes: { last_updated: string; scope: string; note: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

export default function BumpChart() {
  const [module, setModule] = useState('instrumenten')
  const [level, setLevel] = useState('ministry')
  const [topN, setTopN] = useState(10)
  const [data, setData] = useState<BumpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ module, level, top: String(topN) })
    fetch(`/api/v1/inzichten/bump-chart?${params}`)
      .then(res => res.json())
      .then(d => { if (d.error) { setError(d.error); setData(null) } else setData(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [module, level, topN])

  const chart = useMemo(() => {
    if (!data) return null

    const W = 800
    const H = 450
    const PAD_L = 180
    const PAD_R = 180
    const PAD_T = 30
    const PAD_B = 30
    const years = data.years
    const maxRank = topN

    const xScale = (year: number) => PAD_L + ((year - years[0]) / (years[years.length - 1] - years[0])) * (W - PAD_L - PAD_R)
    const yScale = (rank: number) => PAD_T + ((rank - 1) / (maxRank - 1)) * (H - PAD_T - PAD_B)

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Year labels */}
        {years.map(y => (
          <text key={y} x={xScale(y)} y={14} textAnchor="middle" fontSize={10} fill={NAVY_MEDIUM}>{y}</text>
        ))}

        {/* Rank labels */}
        {Array.from({ length: maxRank }, (_, i) => i + 1).map(rank => (
          <text key={rank} x={PAD_L - 8} y={yScale(rank) + 3} textAnchor="end" fontSize={9} fill={NAVY_MEDIUM}>#{rank}</text>
        ))}

        {/* Grid lines */}
        {years.map(y => (
          <line key={`g-${y}`} x1={xScale(y)} y1={PAD_T - 5} x2={xScale(y)} y2={H - PAD_B + 5} stroke="#e5e7eb" strokeWidth={0.5} />
        ))}

        {/* Series lines */}
        {data.series.map((s, idx) => {
          const isActive = hovered === null || hovered === s.name
          const points = s.ranks
            .filter(r => r.rank <= maxRank)
            .map(r => `${xScale(r.year)},${yScale(r.rank)}`)

          if (points.length < 2) return null

          return (
            <g key={s.name} onMouseEnter={() => setHovered(s.name)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={isActive ? 3 : 1.5}
                strokeOpacity={isActive ? 1 : 0.15}
                strokeLinejoin="round"
                style={{ transition: 'stroke-width 0.15s, stroke-opacity 0.15s' }}
              />
              {s.ranks.filter(r => r.rank <= maxRank).map(r => (
                <circle
                  key={r.year}
                  cx={xScale(r.year)}
                  cy={yScale(r.rank)}
                  r={isActive ? 4 : 2.5}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={isActive ? 1 : 0.2}
                  style={{ transition: 'r 0.15s, fill-opacity 0.15s' }}
                />
              ))}
              {/* Name label at last point */}
              {isActive && s.ranks.length > 0 && s.ranks[s.ranks.length - 1].rank <= maxRank && (
                <text
                  x={xScale(years[years.length - 1]) + 8}
                  y={yScale(s.ranks[s.ranks.length - 1].rank) + 3}
                  fontSize={9}
                  fill={COLORS[idx % COLORS.length]}
                  fontWeight="bold"
                >
                  {s.name.length > 25 ? s.name.slice(0, 23) + '..' : s.name}
                </text>
              )}
              {/* Name label at first point */}
              {isActive && s.ranks.length > 0 && s.ranks[0].rank <= maxRank && (
                <text
                  x={xScale(years[0]) - 8}
                  y={yScale(s.ranks[0].rank) + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill={COLORS[idx % COLORS.length]}
                  fontWeight="bold"
                >
                  {s.name.length > 25 ? s.name.slice(0, 23) + '..' : s.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    )
  }, [data, hovered, topN])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Bump Chart</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wie stijgt, wie daalt? Rangschikkingen door de jaren heen.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setModule(m.id)} className={`px-2.5 py-1 text-xs rounded transition-colors ${module === m.id ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'}`}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Niveau:</span>
          {['ministry', 'entity'].map(l => (
            <button key={l} onClick={() => setLevel(l)} className={`px-2 py-1 text-xs rounded transition-colors ${level === l ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'}`}>
              {l === 'ministry' ? 'Ministerie' : 'Ontvanger'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Top:</span>
          {[10, 15, 20].map(n => (
            <button key={n} onClick={() => setTopN(n)} className={`px-2 py-1 text-xs rounded transition-colors ${topN === n ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><p className="text-sm text-[var(--navy-medium)]">Laden...</p></div>
      ) : error ? (
        <div className="flex items-center justify-center h-64"><p className="text-sm text-red-500">Fout: {error}</p></div>
      ) : data ? (
        <>
          <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              Ranglijst {level === 'ministry' ? 'ministeries' : 'ontvangers'} — 2016–2024
            </h3>
            {chart}
          </div>

          {/* Detail table for hovered */}
          {hovered && data.series.find(s => s.name === hovered) && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[var(--navy-dark)] mb-2">{hovered}</h4>
              <div className="flex gap-3 overflow-x-auto">
                {data.series.find(s => s.name === hovered)!.ranks.map(r => (
                  <div key={r.year} className="text-center min-w-[60px]">
                    <p className="text-xs text-[var(--navy-medium)]">{r.year}</p>
                    <p className="text-sm font-bold text-[var(--navy-dark)]">#{r.rank}</p>
                    <p className="text-xs text-[var(--navy-medium)] tabular-nums">{formatEuro(r.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
