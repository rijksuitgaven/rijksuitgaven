'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

interface TreeNode {
  name: string
  amount?: number
  recipients?: number
  children?: TreeNode[]
}

interface TreeData {
  year: string
  tree: TreeNode
  grand_total: number
  ministry_count: number
  data_notes: { last_updated: string; scope: string; amount_unit: string; note: string }
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

// Color scale for treemap cells
const colorScale = d3.scaleOrdinal<string>()
  .range([
    '#1a2332', '#2d3e50', '#37474f', '#455a64', '#546e7a',
    '#607d8b', '#78909c', '#90a4ae', '#5c6bc0', '#7986cb',
    '#e91e63', '#ad1457', '#880e4f', '#26a69a', '#00897b',
  ])

export default function SpendingLandscape() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState('totaal')
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Rijksoverheid'])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)
  const [currentRoot, setCurrentRoot] = useState<d3.HierarchyRectangularNode<TreeNode> | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/inzichten/spending-tree?year=${year}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const renderTreemap = useCallback(() => {
    if (!data || !svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 500

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Build hierarchy
    const root = d3.hierarchy<TreeNode>(data.tree)
      .sum(d => d.children ? 0 : (d.amount || 0))
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    d3.treemap<TreeNode>()
      .size([width, height])
      .padding(2)
      .paddingTop(18)
      .round(true)(root)

    // Determine which level to show based on breadcrumb
    let displayNode = root as d3.HierarchyRectangularNode<TreeNode>
    for (let i = 1; i < breadcrumb.length; i++) {
      const child = displayNode.children?.find(c => c.data.name === breadcrumb[i])
      if (child) displayNode = child
    }
    setCurrentRoot(displayNode)

    // Re-treemap from the display node
    d3.treemap<TreeNode>()
      .size([width, height])
      .padding(2)
      .paddingTop(20)
      .round(true)(displayNode as d3.HierarchyNode<TreeNode> as d3.HierarchyRectangularNode<TreeNode>)

    const children = displayNode.children || []

    // Assign colors based on ministry name
    const g = svg.selectAll('g')
      .data(children)
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)
      .style('cursor', d => d.children ? 'pointer' : 'default')

    // Rectangles
    g.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', d => {
        // Use top-level ministry name for consistent coloring
        let node: d3.HierarchyRectangularNode<TreeNode> = d
        while (node.parent && node.depth > 1) node = node.parent
        return colorScale(node.data.name)
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill-opacity', 1)
        const rect = container.getBoundingClientRect()
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          content: `${d.data.name}\n${formatEuroFull(d.value || 0)}\n${d.data.recipients || 0} ontvangers`,
        })
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', 0.85)
        setTooltip(null)
      })
      .on('click', (_, d) => {
        if (d.children) {
          setBreadcrumb(prev => [...prev, d.data.name])
        }
      })

    // Labels (only if cell is large enough)
    g.each(function (d) {
      const cellWidth = d.x1 - d.x0
      const cellHeight = d.y1 - d.y0
      const group = d3.select(this)

      if (cellWidth > 60 && cellHeight > 22) {
        // Name
        group.append('text')
          .attr('x', 4)
          .attr('y', 13)
          .attr('fill', 'white')
          .attr('font-size', Math.min(11, cellWidth / 8))
          .attr('font-family', 'var(--font-condensed), sans-serif')
          .attr('font-weight', 600)
          .text(d.data.name.length > cellWidth / 6 ? d.data.name.slice(0, Math.floor(cellWidth / 6)) + '...' : d.data.name)
      }

      if (cellWidth > 50 && cellHeight > 36) {
        // Amount
        group.append('text')
          .attr('x', 4)
          .attr('y', 26)
          .attr('fill', 'rgba(255,255,255,0.8)')
          .attr('font-size', 9)
          .attr('font-family', 'var(--font-condensed), sans-serif')
          .text(formatEuro(d.value || 0))
      }
    })
  }, [data, breadcrumb])

  useEffect(() => {
    renderTreemap()
    const handleResize = () => renderTreemap()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderTreemap])

  const goBack = () => {
    if (breadcrumb.length > 1) {
      setBreadcrumb(prev => prev.slice(0, -1))
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Spending Landscape</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hiërarchische weergave: Ministerie → Regeling → Instrument. Klik om in te zoomen.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 overflow-x-auto">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => { setYear(y); setBreadcrumb(['Rijksoverheid']) }}
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
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[var(--navy-medium)]">/</span>}
            <button
              onClick={() => setBreadcrumb(breadcrumb.slice(0, i + 1))}
              className={`${
                i === breadcrumb.length - 1
                  ? 'font-semibold text-[var(--navy-dark)]'
                  : 'text-[var(--navy-medium)] hover:text-[var(--pink)]'
              }`}
            >
              {crumb}
            </button>
          </span>
        ))}
        {breadcrumb.length > 1 && (
          <button onClick={goBack} className="ml-2 text-[10px] text-[var(--navy-medium)] hover:text-[var(--pink)]">
            ← Terug
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          <div ref={containerRef} className="relative bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <svg ref={svgRef} />
            {tooltip && (
              <div
                className="absolute pointer-events-none bg-[var(--navy-dark)] text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-pre-line z-50"
                style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
              >
                {tooltip.content}
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--navy-medium)]">
            {data.year} · {data.ministry_count} ministeries · Totaal: {formatEuro(data.grand_total)} ·
            Bron: {data.data_notes.scope}
          </p>
        </>
      ) : null}
    </div>
  )
}
