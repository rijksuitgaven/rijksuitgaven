'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'

const COLORS = [
  '#1a2332', '#5c6bc0', '#26a69a', '#e91e63', '#8d6e63',
  '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a', '#ffa726',
  '#78909c', '#ab47bc', '#29b6f6', '#ff7043', '#9ccc65', '#ec407a',
]

interface ChordNode {
  name: string
  type: 'ministry' | 'recipient'
  total: number
}

interface ChordData {
  year: string
  nodes: ChordNode[]
  matrix: number[][]
  data_notes: { last_updated: string; scope: string; note: string }
}

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`
}

export default function ChordDiagram() {
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<ChordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/inzichten/chord?year=${year}`)
      .then(res => res.json())
      .then(d => { if (d.error) { setError(d.error); setData(null) } else setData(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [year])

  const SIZE = 500
  const CX = SIZE / 2
  const CY = SIZE / 2
  const OUTER_R = 210
  const INNER_R = 190
  const GAP = 2

  const renderChord = useCallback(() => {
    if (!data || data.nodes.length === 0) return null

    const n = data.nodes.length
    const totals = data.nodes.map((_, i) =>
      data.matrix[i].reduce((s, v) => s + v, 0)
    )
    const grandTotal = totals.reduce((s, v) => s + v, 0)
    if (grandTotal === 0) return <text x={CX} y={CY} textAnchor="middle" fontSize={12} fill={NAVY_MEDIUM}>Geen data</text>

    // Compute arc angles per node
    const totalGap = GAP * n
    const available = 360 - totalGap
    const arcs: { start: number; end: number; mid: number }[] = []
    let angle = 0

    for (let i = 0; i < n; i++) {
      const span = grandTotal > 0 ? (totals[i] / grandTotal) * available : 0
      arcs.push({ start: angle, end: angle + span, mid: angle + span / 2 })
      angle += span + GAP
    }

    // Build ribbons
    const ribbons: React.JSX.Element[] = []
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = data.matrix[i][j]
        if (val === 0) continue

        // Ribbon from arc i to arc j
        const iSpan = totals[i] > 0 ? (val / totals[i]) * (arcs[i].end - arcs[i].start) : 0
        const jSpan = totals[j] > 0 ? (val / totals[j]) * (arcs[j].end - arcs[j].start) : 0

        const iStart = polarToCartesian(CX, CY, INNER_R, arcs[i].start)
        const iEnd = polarToCartesian(CX, CY, INNER_R, arcs[i].start + iSpan)
        const jStart = polarToCartesian(CX, CY, INNER_R, arcs[j].start)
        const jEnd = polarToCartesian(CX, CY, INNER_R, arcs[j].start + jSpan)

        const iLarge = iSpan > 180 ? 1 : 0
        const jLarge = jSpan > 180 ? 1 : 0

        const opacity = hovered === null ? 0.3 : (hovered === i || hovered === j) ? 0.6 : 0.05

        ribbons.push(
          <path
            key={`${i}-${j}`}
            d={`M ${iStart.x} ${iStart.y} A ${INNER_R} ${INNER_R} 0 ${iLarge} 1 ${iEnd.x} ${iEnd.y} Q ${CX} ${CY} ${jStart.x} ${jStart.y} A ${INNER_R} ${INNER_R} 0 ${jLarge} 1 ${jEnd.x} ${jEnd.y} Q ${CX} ${CY} ${iStart.x} ${iStart.y}`}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={opacity}
            stroke="none"
            style={{ transition: 'fill-opacity 0.2s' }}
          />
        )
      }
    }

    // Build arcs
    const arcPaths = data.nodes.map((node, i) => {
      const color = COLORS[i % COLORS.length]
      const isHovered = hovered === i
      return (
        <g key={i}>
          <path
            d={describeArc(CX, CY, OUTER_R, arcs[i].start, arcs[i].end)}
            stroke={color}
            strokeWidth={isHovered ? 14 : 10}
            fill="none"
            strokeLinecap="round"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
          />
          {(arcs[i].end - arcs[i].start) > 12 && (
            <text
              x={polarToCartesian(CX, CY, OUTER_R + 16, arcs[i].mid).x}
              y={polarToCartesian(CX, CY, OUTER_R + 16, arcs[i].mid).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fill={NAVY_DARK}
              transform={`rotate(${arcs[i].mid > 90 && arcs[i].mid < 270 ? arcs[i].mid + 180 : arcs[i].mid}, ${polarToCartesian(CX, CY, OUTER_R + 16, arcs[i].mid).x}, ${polarToCartesian(CX, CY, OUTER_R + 16, arcs[i].mid).y})`}
            >
              {node.name.length > 20 ? node.name.slice(0, 18) + '..' : node.name}
            </text>
          )}
        </g>
      )
    })

    return (
      <>
        {ribbons}
        {arcPaths}
      </>
    )
  }, [data, hovered, CX, CY])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Chord Diagram</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Wie financiert wie? Bilaterale geldstromen tussen ministeries en ontvangers.
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
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0 mx-auto">
                <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                  {hovered !== null && data.nodes[hovered] && (
                    <>
                      <text x={CX} y={CY - 8} textAnchor="middle" fontSize={11} fill={NAVY_DARK} fontWeight="bold">
                        {data.nodes[hovered].name.length > 22 ? data.nodes[hovered].name.slice(0, 20) + '..' : data.nodes[hovered].name}
                      </text>
                      <text x={CX} y={CY + 8} textAnchor="middle" fontSize={10} fill={NAVY_MEDIUM}>
                        {formatEuro(data.nodes[hovered].total)}
                      </text>
                      <text x={CX} y={CY + 22} textAnchor="middle" fontSize={9} fill={NAVY_MEDIUM}>
                        {data.nodes[hovered].type === 'ministry' ? 'Ministerie' : 'Ontvanger'}
                      </text>
                    </>
                  )}
                  {renderChord()}
                </svg>
              </div>

              <div className="flex-1 min-w-[200px]">
                <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-2">Legenda</h3>
                <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
                  {data.nodes.map((node, idx) => (
                    <div key={node.name} className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-xs"
                      onMouseEnter={() => setHovered(idx)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className={`truncate ${node.type === 'ministry' ? 'font-medium text-[var(--navy-dark)]' : 'text-[var(--navy-medium)]'}`}>
                          {node.name}
                        </span>
                      </div>
                      <span className="tabular-nums text-[var(--navy-medium)] whitespace-nowrap ml-2">{formatEuro(node.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
