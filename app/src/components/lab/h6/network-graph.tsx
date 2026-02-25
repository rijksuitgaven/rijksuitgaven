'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

interface NetworkNode {
  id: string
  type: string
  value: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface NetworkEdge {
  source: string
  target: string
  value: number
}

interface NetworkData {
  year: string
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  stats: { total_nodes: number; total_edges: number; multi_funded: number; max_connections: number }
  data_notes: { last_updated: string; scope: string; note: string }
}

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

// Simple force simulation (no D3 dependency)
function simulateForces(nodes: NetworkNode[], edges: NetworkEdge[], width: number, height: number, iterations: number = 80) {
  const cx = width / 2
  const cy = height / 2
  const maxVal = Math.max(...nodes.map(n => n.value), 1)

  // Initialize positions in a circle
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI
    const r = n.type === 'ministry' ? 80 : 180
    n.x = cx + r * Math.cos(angle) + (Math.random() - 0.5) * 20
    n.y = cy + r * Math.sin(angle) + (Math.random() - 0.5) * 20
    n.vx = 0
    n.vy = 0
  })

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 0.3 * (1 - iter / iterations)

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = (b.x || 0) - (a.x || 0)
        const dy = (b.y || 0) - (a.y || 0)
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const force = (800 / (dist * dist)) * alpha
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx! -= fx
        a.vy! -= fy
        b.vx! += fx
        b.vy! += fy
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) continue
      const dx = (target.x || 0) - (source.x || 0)
      const dy = (target.y || 0) - (source.y || 0)
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const strength = Math.min(0.1, (edge.value / maxVal) * 0.15) * alpha
      const fx = dx * strength
      const fy = dy * strength
      source.vx! += fx
      source.vy! += fy
      target.vx! -= fx
      target.vy! -= fy
    }

    // Center gravity
    for (const n of nodes) {
      n.vx! += (cx - (n.x || 0)) * 0.01 * alpha
      n.vy! += (cy - (n.y || 0)) * 0.01 * alpha
    }

    // Apply velocities with damping
    for (const n of nodes) {
      n.vx! *= 0.6
      n.vy! *= 0.6
      n.x = Math.max(30, Math.min(width - 30, (n.x || 0) + (n.vx || 0)))
      n.y = Math.max(30, Math.min(height - 30, (n.y || 0) + (n.vy || 0)))
    }
  }

  return nodes
}

export default function NetworkGraph() {
  const [year, setYear] = useState('2024')
  const [topN, setTopN] = useState(20)
  const [data, setData] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [simulatedNodes, setSimulatedNodes] = useState<NetworkNode[]>([])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/inzichten/network?year=${year}&top=${topN}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) { setError(d.error); setData(null) }
        else {
          setData(d)
          const simulated = simulateForces([...d.nodes], d.edges, 700, 500)
          setSimulatedNodes(simulated)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [year, topN])

  const W = 700
  const H = 500

  const maxNodeVal = Math.max(...(simulatedNodes.map(n => n.value) || [1]))
  const nodeRadius = useCallback((value: number) => {
    return 4 + Math.sqrt(value / maxNodeVal) * 20
  }, [maxNodeVal])

  const connectedTo = (nodeId: string) => {
    if (!data) return new Set<string>()
    const connected = new Set<string>()
    for (const e of data.edges) {
      if (e.source === nodeId) connected.add(e.target)
      if (e.target === nodeId) connected.add(e.source)
    }
    connected.add(nodeId)
    return connected
  }

  const hoveredConnections = hovered ? connectedTo(hovered) : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Bestedingsnetwerk</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoe zijn ministeries en ontvangers verbonden? Hover om verbindingen te zien.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 overflow-x-auto">
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)} className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${year === y ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'}`}>
              {y === 'totaal' ? 'Alle jaren' : y}{y === '2024' ? '*' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Ontvangers:</span>
          {[15, 20, 30].map(n => (
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
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Nodes', value: data.stats.total_nodes },
              { label: 'Verbindingen', value: data.stats.total_edges },
              { label: 'Multi-gefinancierd', value: data.stats.multi_funded },
              { label: 'Max. verbindingen', value: data.stats.max_connections },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                <p className="text-xs text-[var(--navy-medium)]">{s.label}</p>
                <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[var(--border)] rounded-lg p-5 overflow-hidden">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Edges */}
              {data.edges.map((e, idx) => {
                const source = simulatedNodes.find(n => n.id === e.source)
                const target = simulatedNodes.find(n => n.id === e.target)
                if (!source || !target) return null
                const isActive = !hoveredConnections || (hoveredConnections.has(e.source) && hoveredConnections.has(e.target))
                return (
                  <line
                    key={idx}
                    x1={source.x || 0} y1={source.y || 0}
                    x2={target.x || 0} y2={target.y || 0}
                    stroke={NAVY_MEDIUM}
                    strokeWidth={Math.max(0.5, Math.min(3, (e.value / maxNodeVal) * 5))}
                    strokeOpacity={isActive ? 0.3 : 0.03}
                    style={{ transition: 'stroke-opacity 0.2s' }}
                  />
                )
              })}

              {/* Nodes */}
              {simulatedNodes.map(node => {
                const r = nodeRadius(node.value)
                const isActive = !hoveredConnections || hoveredConnections.has(node.id)
                const isMinistry = node.type === 'ministry'
                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={node.x || 0} cy={node.y || 0} r={r}
                      fill={isMinistry ? NAVY_DARK : PINK}
                      fillOpacity={isActive ? (isMinistry ? 0.85 : 0.7) : 0.1}
                      stroke="white" strokeWidth={1}
                      style={{ transition: 'fill-opacity 0.15s' }}
                    />
                    {(isActive && r > 8) && (
                      <text
                        x={(node.x || 0)} y={(node.y || 0) - r - 4}
                        textAnchor="middle" fontSize={8}
                        fill={NAVY_DARK} fontWeight={hovered === node.id ? 'bold' : 'normal'}
                      >
                        {node.id.length > 22 ? node.id.slice(0, 20) + '..' : node.id}
                      </text>
                    )}
                    {hovered === node.id && (
                      <text
                        x={(node.x || 0)} y={(node.y || 0) + 3}
                        textAnchor="middle" fontSize={8} fill="white" fontWeight="bold"
                      >
                        {formatEuro(node.value)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-[var(--navy-medium)]">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: NAVY_DARK }} /> Ministerie</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: PINK }} /> Ontvanger</div>
            <span>Grootte = bedrag · Lijn = geldstroom</span>
          </div>

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
