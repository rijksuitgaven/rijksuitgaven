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

interface BeeswarmEntity {
  name: string
  amount: number
  log_amount: number
  ministry?: string
}

interface BeeswarmBracket {
  label: string
  min: number
  max: number
  count: number
}

interface BeeswarmData {
  module: string
  year: string
  total_entities: number
  entities: BeeswarmEntity[]
  brackets: BeeswarmBracket[]
  stats: { min: number; max: number; median: number; p90: number; p99: number }
  data_notes: { last_updated: string; scope: string; note: string }
}

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function formatEuroFull(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export default function Beeswarm() {
  const [module, setModule] = useState('instrumenten')
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<BeeswarmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ module, year })
    fetch(`/api/v1/inzichten/beeswarm?${params}`)
      .then(res => res.json())
      .then(d => { if (d.error) { setError(d.error); setData(null) } else setData(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [module, year])

  // Position dots along log scale x-axis with collision avoidance on y
  const dots = useMemo(() => {
    if (!data || data.entities.length === 0) return []

    const W = 800
    const H = 300
    const PAD_L = 60
    const PAD_R = 40
    const CY = H / 2

    const minLog = Math.log10(Math.max(1, data.stats.min))
    const maxLog = Math.log10(Math.max(1, data.stats.max))
    const range = maxLog - minLog || 1

    const xScale = (logAmt: number) => PAD_L + ((logAmt - minLog) / range) * (W - PAD_L - PAD_R)

    // Simple collision avoidance: stack dots vertically
    const placed: { x: number; y: number; r: number }[] = []
    const DOT_R = 3

    return data.entities.slice(0, 500).map((entity, idx) => {
      const targetX = xScale(entity.log_amount)
      let y = CY

      // Find free y position near center
      let attempts = 0
      while (attempts < 50) {
        const collides = placed.some(p =>
          Math.abs(p.x - targetX) < DOT_R * 2.2 && Math.abs(p.y - y) < DOT_R * 2.2
        )
        if (!collides) break
        y = CY + (attempts % 2 === 0 ? 1 : -1) * Math.ceil(attempts / 2) * (DOT_R * 2.2)
        attempts++
      }

      placed.push({ x: targetX, y, r: DOT_R })

      return {
        ...entity,
        cx: targetX,
        cy: y,
        idx,
      }
    })
  }, [data])

  const W = 800
  const H = 300

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Beeswarm Plot</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Elke ontvanger als punt. Hoe is het geld verdeeld? Van klein naar groot op een logaritmische schaal.
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
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {YEARS.map(y => (
          <button key={y} onClick={() => setYear(y)} className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${year === y ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'}`}>
            {y === 'totaal' ? 'Alle jaren' : y}{y === '2024' ? '*' : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><p className="text-sm text-[var(--navy-medium)]">Laden...</p></div>
      ) : error ? (
        <div className="flex items-center justify-center h-64"><p className="text-sm text-red-500">Fout: {error}</p></div>
      ) : data ? (
        <>
          {/* Distribution brackets */}
          <div className="grid grid-cols-7 gap-2">
            {data.brackets.map(b => (
              <div key={b.label} className="bg-white border border-[var(--border)] rounded-lg p-2 text-center">
                <p className="text-xs text-[var(--navy-medium)]">{b.label}</p>
                <p className="text-sm font-bold text-[var(--navy-dark)] tabular-nums">{b.count.toLocaleString('nl-NL')}</p>
              </div>
            ))}
          </div>

          {/* Beeswarm SVG */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              {data.total_entities.toLocaleString('nl-NL')} ontvangers — {year === 'totaal' ? 'cumulatief' : year}
              {data.entities.length < data.total_entities && (
                <span className="font-normal text-[var(--navy-medium)]"> (top {data.entities.length} getoond)</span>
              )}
            </h3>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* X axis labels */}
              {['€1K', '€10K', '€100K', '€1M', '€10M', '€100M', '€1B'].map((label, i) => {
                const logVal = 3 + i
                const minLog = Math.log10(Math.max(1, data.stats.min))
                const maxLog = Math.log10(Math.max(1, data.stats.max))
                const range = maxLog - minLog || 1
                const x = 60 + ((logVal - minLog) / range) * (W - 100)
                if (x < 40 || x > W - 20) return null
                return (
                  <g key={label}>
                    <line x1={x} y1={20} x2={x} y2={H - 20} stroke="#e5e7eb" strokeWidth={0.5} />
                    <text x={x} y={H - 6} textAnchor="middle" fontSize={9} fill={NAVY_MEDIUM}>{label}</text>
                  </g>
                )
              })}

              {/* Dots */}
              {dots.map(dot => (
                <circle
                  key={dot.idx}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={hoveredIdx === dot.idx ? 6 : 3}
                  fill={hoveredIdx === dot.idx ? PINK : NAVY_DARK}
                  fillOpacity={hoveredIdx === dot.idx ? 1 : 0.4}
                  stroke={hoveredIdx === dot.idx ? PINK : 'none'}
                  strokeWidth={1}
                  onMouseEnter={() => setHoveredIdx(dot.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                >
                  <title>{`${dot.name}: ${formatEuroFull(dot.amount)}`}</title>
                </circle>
              ))}

              {/* Hover label */}
              {hoveredIdx !== null && dots[hoveredIdx] && (
                <text
                  x={dots[hoveredIdx].cx}
                  y={dots[hoveredIdx].cy - 10}
                  textAnchor="middle"
                  fontSize={9}
                  fill={NAVY_DARK}
                  fontWeight="bold"
                >
                  {dots[hoveredIdx].name.length > 30 ? dots[hoveredIdx].name.slice(0, 28) + '..' : dots[hoveredIdx].name}: {formatEuro(dots[hoveredIdx].amount)}
                </text>
              )}
            </svg>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Kleinste', value: formatEuro(data.stats.min) },
              { label: 'Mediaan', value: formatEuro(data.stats.median) },
              { label: 'Top 10%', value: formatEuro(data.stats.p90) },
              { label: 'Top 1%', value: formatEuro(data.stats.p99) },
              { label: 'Grootste', value: formatEuro(data.stats.max) },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--navy-medium)]">{s.label}</p>
                <p className="text-sm font-bold text-[var(--navy-dark)] tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
