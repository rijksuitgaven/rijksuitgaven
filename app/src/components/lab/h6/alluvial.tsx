'use client'

import { useState, useEffect, useMemo } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'

const STAGE_COLORS = ['#1a2332', '#5c6bc0', '#26a69a', '#e91e63']

interface AlluvialNode {
  name: string
  stage: number
  total: number
}

interface AlluvialLink {
  source: string
  target: string
  value: number
  stage: number
}

interface AlluvialData {
  year: string
  stages: string[]
  nodes: AlluvialNode[]
  links: AlluvialLink[]
  data_notes: { last_updated: string; scope: string; note: string }
}

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

export default function Alluvial() {
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<AlluvialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/inzichten/alluvial?year=${year}`)
      .then(res => res.json())
      .then(d => { if (d.error) { setError(d.error); setData(null) } else setData(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [year])

  const chart = useMemo(() => {
    if (!data) return null

    const W = 900
    const H = 500
    const PAD = 40
    const NODE_W = 12
    const stages = [0, 1, 2, 3]
    const stageX = stages.map(s => PAD + (s / 3) * (W - 2 * PAD))

    // Group nodes by stage, sort by total desc
    const nodesByStage: Record<number, (AlluvialNode & { y: number; h: number })[]> = {}

    for (const stage of stages) {
      const stageNodes = data.nodes
        .filter(n => n.stage === stage)
        .sort((a, b) => b.total - a.total)

      const stageTotal = stageNodes.reduce((s, n) => s + n.total, 0)
      const availableH = H - 2 * PAD - stageNodes.length * 2
      let y = PAD

      nodesByStage[stage] = stageNodes.map(node => {
        const h = Math.max(4, (node.total / stageTotal) * availableH)
        const result = { ...node, y, h }
        y += h + 2
        return result
      })
    }

    // Helper to find node position
    const findNode = (name: string, stage: number) =>
      nodesByStage[stage]?.find(n => n.name === name)

    // Track used space per node for stacking links
    const nodeUsed: Record<string, number> = {}
    const getNodeKey = (name: string, stage: number) => `${stage}:${name}`

    // Build link paths
    const linkPaths = data.links.map((link, idx) => {
      const sourceNode = findNode(link.source, link.stage)
      const targetNode = findNode(link.target, link.stage + 1)
      if (!sourceNode || !targetNode) return null

      const sourceKey = getNodeKey(link.source, link.stage)
      const targetKey = getNodeKey(link.target, link.stage + 1)

      const sourceOffset = nodeUsed[sourceKey] || 0
      const targetOffset = nodeUsed[targetKey] || 0

      const linkH_source = sourceNode.h > 0 ? (link.value / sourceNode.total) * sourceNode.h : 0
      const linkH_target = targetNode.h > 0 ? (link.value / targetNode.total) * targetNode.h : 0

      nodeUsed[sourceKey] = sourceOffset + linkH_source
      nodeUsed[targetKey] = targetOffset + linkH_target

      const x1 = stageX[link.stage] + NODE_W
      const x2 = stageX[link.stage + 1]
      const y1_top = sourceNode.y + sourceOffset
      const y1_bot = y1_top + linkH_source
      const y2_top = targetNode.y + targetOffset
      const y2_bot = y2_top + linkH_target

      const cx = (x1 + x2) / 2

      const isActive = hoveredNode === null || hoveredNode === link.source || hoveredNode === link.target

      return (
        <path
          key={idx}
          d={`M ${x1} ${y1_top} C ${cx} ${y1_top}, ${cx} ${y2_top}, ${x2} ${y2_top} L ${x2} ${y2_bot} C ${cx} ${y2_bot}, ${cx} ${y1_bot}, ${x1} ${y1_bot} Z`}
          fill={STAGE_COLORS[link.stage]}
          fillOpacity={isActive ? 0.25 : 0.04}
          stroke={STAGE_COLORS[link.stage]}
          strokeOpacity={isActive ? 0.4 : 0.05}
          strokeWidth={0.5}
          style={{ transition: 'fill-opacity 0.2s, stroke-opacity 0.2s' }}
        >
          <title>{`${link.source} → ${link.target}: ${formatEuro(link.value)}`}</title>
        </path>
      )
    })

    // Build node rects + labels
    const nodeElements = stages.flatMap(stage =>
      (nodesByStage[stage] || []).map(node => {
        const x = stageX[stage]
        const isActive = hoveredNode === null || hoveredNode === node.name

        return (
          <g
            key={`${stage}:${node.name}`}
            onMouseEnter={() => setHoveredNode(node.name)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x}
              y={node.y}
              width={NODE_W}
              height={node.h}
              fill={STAGE_COLORS[stage]}
              fillOpacity={isActive ? 0.9 : 0.3}
              rx={2}
              style={{ transition: 'fill-opacity 0.15s' }}
            />
            {node.h > 10 && (
              <text
                x={stage < 2 ? x + NODE_W + 4 : x - 4}
                y={node.y + node.h / 2 + 3}
                textAnchor={stage < 2 ? 'start' : 'end'}
                fontSize={8}
                fill={isActive ? NAVY_DARK : NAVY_MEDIUM}
                fontWeight={isActive ? 'bold' : 'normal'}
              >
                {node.name.length > 28 ? node.name.slice(0, 26) + '..' : node.name}
              </text>
            )}
          </g>
        )
      })
    )

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Stage headers */}
        {data.stages.map((name, i) => (
          <text key={name} x={stageX[i] + NODE_W / 2} y={16} textAnchor="middle" fontSize={10} fill={STAGE_COLORS[i]} fontWeight="bold">
            {name}
          </text>
        ))}
        {linkPaths}
        {nodeElements}
      </svg>
    )
  }, [data, hoveredNode])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Het Pad van het Geld</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Volg het geld door 4 niveaus: Ministerie → Instrument → Regeling → Ontvanger.
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
            {chart}
          </div>

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
