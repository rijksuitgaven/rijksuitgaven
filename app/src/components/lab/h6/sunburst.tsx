'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const MINISTRY_COLORS = [
  '#1a2332', '#37474f', '#5c6bc0', '#26a69a', '#e91e63',
  '#8d6e63', '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a',
  '#ffa726', '#78909c', '#ab47bc',
]

interface TreeNode {
  name: string
  value: number
  children?: TreeNode[]
}

interface SunburstData {
  year: string
  tree: TreeNode
  total: number
  ministry_count: number
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

// Flatten tree for rendering as concentric rings
interface ArcData {
  name: string
  value: number
  depth: number
  startAngle: number
  endAngle: number
  color: string
  parent?: string
  percentage: number
}

function flattenTree(node: TreeNode, depth: number, startAngle: number, endAngle: number, colorIdx: number, parent?: string): ArcData[] {
  const arcs: ArcData[] = []
  const angleRange = endAngle - startAngle

  if (depth > 0) {
    arcs.push({
      name: node.name,
      value: node.value,
      depth,
      startAngle,
      endAngle,
      color: MINISTRY_COLORS[colorIdx % MINISTRY_COLORS.length],
      parent,
      percentage: 0, // computed later
    })
  }

  if (node.children && node.children.length > 0) {
    const total = node.children.reduce((s, c) => s + c.value, 0)
    let currentAngle = startAngle
    node.children.forEach((child, idx) => {
      const childAngle = total > 0 ? (child.value / total) * angleRange : 0
      const childColorIdx = depth === 0 ? idx : colorIdx
      arcs.push(
        ...flattenTree(child, depth + 1, currentAngle, currentAngle + childAngle, childColorIdx, node.name)
      )
      currentAngle += childAngle
    })
  }

  return arcs
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  const start1 = polarToCartesian(cx, cy, outerR, endAngle)
  const end1 = polarToCartesian(cx, cy, outerR, startAngle)
  const start2 = polarToCartesian(cx, cy, innerR, startAngle)
  const end2 = polarToCartesian(cx, cy, innerR, endAngle)

  const angleDiff = endAngle - startAngle
  const largeArc = angleDiff > 180 ? 1 : 0

  return [
    `M ${start1.x} ${start1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${end1.x} ${end1.y}`,
    `L ${start2.x} ${start2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${end2.x} ${end2.y}`,
    'Z',
  ].join(' ')
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function findNode(node: TreeNode, name: string): TreeNode | null {
  if (node.name === name) return node
  for (const child of node.children || []) {
    const found = findNode(child, name)
    if (found) return found
  }
  return null
}

export default function Sunburst() {
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<SunburstData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<ArcData | null>(null)
  const [zoomPath, setZoomPath] = useState<string[]>([]) // stack of node names we've zoomed into
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setLoading(true)
    setZoomPath([])
    fetch(`/api/v1/inzichten/sunburst?year=${year}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  // Resolve current zoom root node
  const zoomRoot = (() => {
    if (!data || zoomPath.length === 0) return data?.tree ?? null
    let node: TreeNode | null = data.tree
    for (const name of zoomPath) {
      node = node ? findNode(node, name) : null
    }
    return node
  })()

  const arcs = (() => {
    if (!zoomRoot) return []
    const flat = flattenTree(zoomRoot, 0, 0, 360, 0)
    const rootTotal = zoomRoot.value
    return flat.map(a => ({
      ...a,
      percentage: rootTotal > 0 ? Math.round((a.value / rootTotal) * 1000) / 10 : 0,
    }))
  })()

  const handleArcClick = useCallback((arc: ArcData) => {
    // Only zoom if the arc has children (check in tree)
    if (!zoomRoot) return
    const targetNode = findNode(zoomRoot, arc.name)
    if (targetNode?.children && targetNode.children.length > 0) {
      setZoomPath(prev => [...prev, arc.name])
      setHovered(null)
    }
  }, [zoomRoot])

  const handleZoomOut = useCallback(() => {
    setZoomPath(prev => prev.slice(0, -1))
    setHovered(null)
  }, [])

  const SIZE = 500
  const CX = SIZE / 2
  const CY = SIZE / 2
  const RING_WIDTH = 55
  const INNER_R = 60

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Sunburst</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hiërarchische verdeling: Ministerie → Regeling → Ontvangers. Klik op een ring om in te zoomen.
        </p>
      </div>

      {/* Year selector */}
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Breadcrumb */}
          {zoomPath.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setZoomPath([])}
                className="text-[var(--pink)] hover:underline"
              >
                Rijksoverheid
              </button>
              {zoomPath.map((name, idx) => (
                <span key={name} className="flex items-center gap-1">
                  <span className="text-[var(--navy-medium)]">›</span>
                  <button
                    onClick={() => setZoomPath(prev => prev.slice(0, idx + 1))}
                    className={idx === zoomPath.length - 1 ? 'text-[var(--navy-dark)] font-medium' : 'text-[var(--pink)] hover:underline'}
                  >
                    {name.length > 30 ? name.slice(0, 28) + '...' : name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Sunburst SVG */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0 mx-auto">
                <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                  {/* Center circle — click to zoom out */}
                  <circle
                    cx={CX}
                    cy={CY}
                    r={INNER_R - 2}
                    fill="white"
                    onClick={zoomPath.length > 0 ? handleZoomOut : undefined}
                    style={{ cursor: zoomPath.length > 0 ? 'pointer' : 'default' }}
                  />
                  {/* Center label */}
                  <text
                    x={CX}
                    y={CY - (hovered ? 8 : 4)}
                    textAnchor="middle"
                    fontSize={11}
                    fill={zoomPath.length > 0 ? PINK : NAVY_DARK}
                    fontWeight="bold"
                    onClick={zoomPath.length > 0 ? handleZoomOut : undefined}
                    style={{ cursor: zoomPath.length > 0 ? 'pointer' : 'default' }}
                  >
                    {hovered
                      ? (hovered.name.length > 18 ? hovered.name.slice(0, 16) + '...' : hovered.name)
                      : zoomPath.length > 0
                        ? '‹ Terug'
                        : 'Rijksoverheid'}
                  </text>
                  <text x={CX} y={CY + 8} textAnchor="middle" fontSize={10} fill={NAVY_MEDIUM}>
                    {hovered ? formatEuro(hovered.value) : zoomRoot ? formatEuro(zoomRoot.value) : ''}
                  </text>
                  {hovered && (
                    <text x={CX} y={CY + 22} textAnchor="middle" fontSize={9} fill={NAVY_MEDIUM}>
                      {hovered.percentage}%
                    </text>
                  )}

                  {/* Arcs */}
                  {arcs.map((arc, idx) => {
                    const innerR = INNER_R + (arc.depth - 1) * RING_WIDTH
                    const outerR = innerR + RING_WIDTH - 2
                    const angleDiff = arc.endAngle - arc.startAngle

                    // Skip very small arcs
                    if (angleDiff < 0.5) return null

                    return (
                      <path
                        key={idx}
                        d={describeArc(CX, CY, innerR, outerR, arc.startAngle, arc.endAngle)}
                        fill={arc.color}
                        fillOpacity={hovered?.name === arc.name ? 1 : arc.depth === 1 ? 0.85 : arc.depth === 2 ? 0.6 : 0.4}
                        stroke="white"
                        strokeWidth={1}
                        onMouseEnter={() => setHovered(arc)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleArcClick(arc)}
                        style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
                      />
                    )
                  })}
                </svg>
              </div>

              {/* Legend + hover detail */}
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-2">
                  {zoomPath.length === 0 ? `Ministeries (${data.ministry_count})` : `${zoomRoot?.name ?? ''} (${zoomRoot?.children?.length ?? 0})`}
                </h3>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {(zoomRoot?.children ?? []).map((child, idx) => (
                    <div
                      key={child.name}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 cursor-pointer"
                      onMouseEnter={() => setHovered({
                        name: child.name,
                        value: child.value,
                        depth: 1,
                        startAngle: 0,
                        endAngle: 0,
                        color: MINISTRY_COLORS[idx % MINISTRY_COLORS.length],
                        percentage: zoomRoot && zoomRoot.value > 0 ? Math.round((child.value / zoomRoot.value) * 1000) / 10 : 0,
                      })}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        if (child.children && child.children.length > 0) {
                          setZoomPath(prev => [...prev, child.name])
                          setHovered(null)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: MINISTRY_COLORS[idx % MINISTRY_COLORS.length] }}
                        />
                        <span className="text-xs text-[var(--navy-dark)] truncate">{child.name}</span>
                      </div>
                      <span className="text-xs tabular-nums text-[var(--navy-medium)] whitespace-nowrap ml-2">
                        {formatEuro(child.value)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hovered details */}
                {hovered && hovered.depth > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-[var(--navy-dark)]">{hovered.name}</p>
                    <p className="text-xs text-[var(--navy-medium)] mt-0.5">
                      Bedrag: {formatEuroFull(hovered.value)}
                    </p>
                    <p className="text-xs text-[var(--navy-medium)]">
                      Aandeel: {hovered.percentage}%
                    </p>
                    {hovered.parent && (
                      <p className="text-xs text-[var(--navy-medium)]">
                        Binnen: {hovered.parent}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
