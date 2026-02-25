'use client'

import { useState, useEffect, useMemo } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'

const SEGMENT_COLORS = [
  '#1a2332', '#5c6bc0', '#26a69a', '#e91e63', '#8d6e63',
  '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a', '#ffa726', '#bdbdbd',
]

interface MarimekkoSegment {
  name: string
  amount: number
  pct: number
}

interface MarimekkoMinistry {
  name: string
  total: number
  width_pct: number
  recipient_count: number
  segments: MarimekkoSegment[]
}

interface MarimekkoData {
  year: string
  grand_total: number
  ministries: MarimekkoMinistry[]
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

export default function Marimekko() {
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<MarimekkoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<{ ministry: string; segment?: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/inzichten/marimekko?year=${year}`)
      .then(res => res.json())
      .then(d => { if (d.error) { setError(d.error); setData(null) } else setData(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [year])

  const chart = useMemo(() => {
    if (!data || data.ministries.length === 0) return null

    const W = 900
    const H = 450
    const PAD_T = 60
    const PAD_B = 40
    const PAD_L = 10
    const PAD_R = 10
    const GAP = 3

    const totalWidth = W - PAD_L - PAD_R - (data.ministries.length - 1) * GAP
    const chartH = H - PAD_T - PAD_B

    let x = PAD_L

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {data.ministries.map((ministry) => {
          const colW = (ministry.width_pct / 100) * totalWidth
          const currentX = x
          x += colW + GAP

          const isMinistryHovered = hovered?.ministry === ministry.name

          let segY = PAD_T
          const segRects = ministry.segments.map((seg, sIdx) => {
            const segH = (seg.pct / 100) * chartH
            const rect = (
              <g
                key={`${ministry.name}-${seg.name}`}
                onMouseEnter={() => setHovered({ ministry: ministry.name, segment: seg.name })}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={currentX}
                  y={segY}
                  width={Math.max(1, colW)}
                  height={Math.max(1, segH)}
                  fill={SEGMENT_COLORS[sIdx % SEGMENT_COLORS.length]}
                  fillOpacity={
                    hovered === null ? 0.8 :
                    (isMinistryHovered && hovered.segment === seg.name) ? 1 :
                    isMinistryHovered ? 0.5 : 0.15
                  }
                  stroke="white"
                  strokeWidth={0.5}
                  style={{ transition: 'fill-opacity 0.15s' }}
                >
                  <title>{`${ministry.name} → ${seg.name}: ${formatEuroFull(seg.amount)} (${seg.pct}%)`}</title>
                </rect>
                {segH > 14 && colW > 40 && (
                  <text
                    x={currentX + colW / 2}
                    y={segY + segH / 2 + 3}
                    textAnchor="middle"
                    fontSize={7}
                    fill="white"
                    fontWeight="bold"
                  >
                    {seg.name.length > Math.floor(colW / 5) ? seg.name.slice(0, Math.floor(colW / 5) - 1) + '..' : seg.name}
                  </text>
                )}
              </g>
            )
            segY += segH
            return rect
          })

          // Ministry label
          const labelAngle = colW < 60 ? -45 : 0
          return (
            <g key={ministry.name}>
              {segRects}
              <text
                x={currentX + colW / 2}
                y={PAD_T - 8}
                textAnchor={labelAngle ? 'end' : 'middle'}
                fontSize={colW > 30 ? 8 : 7}
                fill={isMinistryHovered ? NAVY_DARK : NAVY_MEDIUM}
                fontWeight={isMinistryHovered ? 'bold' : 'normal'}
                transform={labelAngle ? `rotate(${labelAngle}, ${currentX + colW / 2}, ${PAD_T - 8})` : undefined}
              >
                {ministry.name.length > 20 ? ministry.name.slice(0, 18) + '..' : ministry.name}
              </text>
              <text
                x={currentX + colW / 2}
                y={H - PAD_B + 14}
                textAnchor="middle"
                fontSize={7}
                fill={NAVY_MEDIUM}
              >
                {formatEuro(ministry.total)}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }, [data, hovered])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Marimekko Chart</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wie krijgt wat, en hoe groot? Breedte = ministeriegrootte, hoogte = samenstelling per ontvanger.
        </p>
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
          <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-1">
              Ministeriesamenstelling — {year === 'totaal' ? 'Cumulatief' : year}
            </h3>
            <p className="text-xs text-[var(--navy-medium)] mb-3">
              Totaal: {formatEuro(data.grand_total)} · Hover voor details
            </p>
            {chart}
          </div>

          {/* Hover detail */}
          {hovered && (() => {
            const ministry = data.ministries.find(m => m.name === hovered.ministry)
            if (!ministry) return null
            return (
              <div className="bg-white border border-[var(--border)] rounded-lg p-4">
                <h4 className="text-xs font-semibold text-[var(--navy-dark)]">{ministry.name}</h4>
                <p className="text-xs text-[var(--navy-medium)]">
                  Totaal: {formatEuroFull(ministry.total)} · {ministry.width_pct}% van totaal · {ministry.recipient_count} ontvangers
                </p>
                <div className="mt-2 space-y-1">
                  {ministry.segments.map((seg, idx) => (
                    <div key={seg.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }} />
                        <span className={hovered.segment === seg.name ? 'font-bold text-[var(--navy-dark)]' : 'text-[var(--navy-medium)]'}>
                          {seg.name}
                        </span>
                      </div>
                      <span className="tabular-nums text-[var(--navy-medium)]">{formatEuro(seg.amount)} ({seg.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
