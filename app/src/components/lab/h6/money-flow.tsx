'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sankey, Tooltip, Layer, Rectangle } from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

interface SankeyNode {
  name: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
}

interface Ministry {
  name: string
  total: number
}

interface MoneyFlowData {
  year: string
  depth: number
  top: number
  ministry_filter: string
  sankey: { nodes: SankeyNode[]; links: SankeyLink[] }
  ministries: Ministry[]
  grand_total: number
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

// Color palette for nodes
const NODE_COLORS = [
  '#1a2332', '#2d3e50', '#37474f', '#455a64', '#546e7a',
  '#607d8b', '#78909c', '#5c6bc0', '#7986cb', '#e91e63',
  '#ad1457', '#26a69a', '#00897b', '#8d6e63', '#6d4c41',
]

// Custom node renderer with label
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomNode({ x, y, width, height, index, payload }: any) {
  const color = NODE_COLORS[index % NODE_COLORS.length]
  const name = payload.name || ''
  const truncatedName = name.length > 25 ? name.slice(0, 22) + '...' : name

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.9}
        rx={2}
      />
      {height > 14 && (
        <text
          x={x + width + 6}
          y={y + height / 2}
          textAnchor="start"
          dominantBaseline="middle"
          style={{
            fontSize: 10,
            fill: NAVY_DARK,
            fontFamily: 'var(--font-condensed), sans-serif',
          }}
        >
          {truncatedName}
        </text>
      )}
    </Layer>
  )
}

export default function MoneyFlow() {
  const [year, setYear] = useState('2024')
  const [ministryFilter, setMinistryFilter] = useState('all')
  const [topN, setTopN] = useState(10)
  const [depth, setDepth] = useState(2)
  const [data, setData] = useState<MoneyFlowData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      year,
      ministry: ministryFilter,
      top: String(topN),
      depth: String(depth),
    })
    fetch(`/api/v1/inzichten/money-flow?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, ministryFilter, topN, depth])

  // Calculate container width for Sankey
  const sankeyWidth = useMemo(() => {
    if (typeof window === 'undefined') return 900
    return Math.min(1200, window.innerWidth - 80)
  }, [])

  // Height scales with number of nodes
  const sankeyHeight = useMemo(() => {
    if (!data) return 500
    return Math.max(500, data.sankey.nodes.length * 20)
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Money Flow</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Volg het geld: van ministerie via regeling naar de ontvangers. Waar stroomt het naartoe?
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year */}
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

        {/* Depth */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Diepte:</span>
          <div className="flex gap-1">
            {[2, 3].map(d => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  depth === d ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {d === 2 ? 'Min → Reg' : 'Min → Reg → Ontv'}
              </button>
            ))}
          </div>
        </div>

        {/* Top-N */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Top:</span>
          <div className="flex gap-1">
            {[5, 10, 15].map(n => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  topN === n ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ministry filter */}
      {data && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Ministerie:</span>
          <button
            onClick={() => setMinistryFilter('all')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              ministryFilter === 'all' ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {data.ministries.slice(0, 12).map(m => (
            <button
              key={m.name}
              onClick={() => setMinistryFilter(m.name)}
              className={`px-2 py-1 text-[10px] rounded transition-colors truncate max-w-[150px] ${
                ministryFilter === m.name ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
              title={`${m.name} — ${formatEuro(m.total)}`}
            >
              {m.name.length > 20 ? m.name.slice(0, 18) + '...' : m.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {data.sankey.nodes.length > 0 && data.sankey.links.length > 0 ? (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-x-auto">
              <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-3">
                {data.year} · Totaal: {formatEuro(data.grand_total)}
                {ministryFilter !== 'all' && ` · Filter: ${ministryFilter}`}
              </h3>
              <div style={{ minWidth: 700 }}>
                <Sankey
                  width={sankeyWidth}
                  height={sankeyHeight}
                  data={data.sankey}
                  node={CustomNode}
                  nodePadding={8}
                  nodeWidth={8}
                  linkCurvature={0.5}
                  margin={{ top: 10, right: 180, bottom: 10, left: 10 }}
                  link={{ stroke: '#d1d5db', strokeOpacity: 0.4 }}
                >
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0]?.payload
                      if (!item) return null

                      // Node tooltip
                      if (item.name) {
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2">
                            <p className="text-xs font-semibold text-[var(--navy-dark)]">{item.name}</p>
                            {item.value !== undefined && (
                              <p className="text-[10px] text-[var(--navy-medium)]">{formatEuroFull(item.value)}</p>
                            )}
                          </div>
                        )
                      }

                      // Link tooltip
                      if (item.source !== undefined && item.target !== undefined) {
                        const sourceName = data.sankey.nodes[item.source]?.name || '?'
                        const targetName = data.sankey.nodes[item.target]?.name || '?'
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2">
                            <p className="text-[10px] text-[var(--navy-medium)]">
                              {sourceName} → {targetName}
                            </p>
                            <p className="text-xs font-semibold text-[var(--navy-dark)]">{formatEuroFull(item.value)}</p>
                          </div>
                        )
                      }

                      return null
                    }}
                  />
                </Sankey>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
              <p className="text-sm text-[var(--navy-medium)]">Geen data beschikbaar voor deze selectie.</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-[var(--navy-medium)]">
            <span>Links: Ministerie</span>
            <span>Midden: Regeling</span>
            {depth >= 3 && <span>Rechts: Ontvanger</span>}
            <span>· Dikte = bedrag</span>
          </div>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
            {year === '2024' && <span> · *2024 data kan onvolledig zijn</span>}
          </p>
        </>
      ) : null}
    </div>
  )
}
