'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

interface Entity {
  name: string
  sources: string
  source_count: number
  record_count: number
  totaal: number
  years_with_data: number
  per_year: Record<string, number>
}

interface RadarData {
  min_sources: number
  entities: Entity[]
  ring_summary: Record<number, number>
  data_notes: { last_updated: string; scope: string; amount_unit: string; note: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function SourceBadges({ sources }: { sources: string }) {
  const mods = sources.split(',').map(s => s.trim())
  const colors: Record<string, string> = {
    'Financiële instrumenten': '#1a2332',
    'Inkoopuitgaven': '#e91e63',
    'Publiek gefinancierd': '#8d6e63',
    'Gemeentelijke subsidieregisters': '#26a69a',
    'Provinciale subsidieregisters': '#5c6bc0',
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {mods.map(mod => (
        <span
          key={mod}
          className="text-[10px] px-1.5 py-0.5 rounded text-white"
          style={{ backgroundColor: colors[mod] || NAVY_MEDIUM }}
        >
          {mod.replace('Financiële instrumenten', 'Instrumenten')
            .replace('Gemeentelijke subsidieregisters', 'Gemeente')
            .replace('Provinciale subsidieregisters', 'Provincie')
            .replace('Publiek gefinancierd', 'Publiek')
            .replace('Inkoopuitgaven', 'Inkoop')}
        </span>
      ))}
    </div>
  )
}

function EntitySparkline({ data }: { data: Record<string, number> }) {
  const chartData = YEARS.map(y => ({ year: y, value: data[String(y)] || 0 }))
  return (
    <div className="h-6 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={NAVY_DARK} strokeWidth={1} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DependencyRadar() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<RadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [minSources, setMinSources] = useState(3)
  const [viewMode, setViewMode] = useState<'radial' | 'table'>('radial')
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    setSelectedEntity(null)
    fetch(`/api/v1/inzichten/cross-module?min_sources=${minSources}&limit=200`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [minSources])

  const renderRadial = useCallback(() => {
    if (!data || !svgRef.current || !containerRef.current || viewMode !== 'radial') return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 500
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.min(cx, cy) - 40

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Group entities by source_count
    const levels = new Map<number, Entity[]>()
    for (const e of data.entities) {
      const group = levels.get(e.source_count) || []
      group.push(e)
      levels.set(e.source_count, group)
    }

    const maxLevel = Math.max(...Array.from(levels.keys()))
    const minLevel = minSources

    // Draw concentric rings
    const ringLevels = Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => maxLevel - i)

    ringLevels.forEach((level, ringIdx) => {
      const radius = maxRadius * ((ringIdx + 1) / ringLevels.length)

      // Ring circle
      svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')

      // Ring label
      svg.append('text')
        .attr('x', cx + radius + 4)
        .attr('y', cy + 3)
        .attr('fill', NAVY_MEDIUM)
        .attr('font-size', 9)
        .attr('font-family', 'var(--font-condensed), sans-serif')
        .text(`${level} bronnen`)

      // Nodes for this level
      const entities = levels.get(level) || []
      const nodeRadius = Math.min(12, Math.max(3, 50 / Math.max(1, entities.length)))
      const ringR = radius - nodeRadius - 4

      // Amount scale for node size
      const amounts = entities.map(e => e.totaal)
      const sizeScale = d3.scaleSqrt()
        .domain([Math.min(...amounts, 0), Math.max(...amounts, 1)])
        .range([3, Math.min(16, nodeRadius)])

      entities.forEach((entity, i) => {
        const angle = (2 * Math.PI * i) / Math.max(1, entities.length) - Math.PI / 2
        const x = cx + ringR * Math.cos(angle)
        const y = cy + ringR * Math.sin(angle)
        const r = sizeScale(entity.totaal)

        // Color: gradient from navy to pink based on amount
        const t = amounts.length > 1
          ? (entity.totaal - Math.min(...amounts)) / (Math.max(...amounts) - Math.min(...amounts))
          : 0.5
        const color = d3.interpolateRgb(NAVY_DARK, PINK)(t)

        svg.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', r)
          .attr('fill', color)
          .attr('fill-opacity', 0.75)
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function (event) {
            d3.select(this).attr('fill-opacity', 1).attr('r', r + 2)
            const rect = container.getBoundingClientRect()
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              content: `${entity.name}\n${formatEuro(entity.totaal)}\n${entity.source_count} bronnen · ${entity.years_with_data} jaar`,
            })
          })
          .on('mouseout', function () {
            d3.select(this).attr('fill-opacity', 0.75).attr('r', r)
            setTooltip(null)
          })
          .on('click', () => {
            setSelectedEntity(entity)
          })
      })
    })

    // Center label
    svg.append('text')
      .attr('x', cx)
      .attr('y', cy - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', NAVY_DARK)
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .attr('font-family', 'var(--font-condensed), sans-serif')
      .text(`${data.entities.length}`)
    svg.append('text')
      .attr('x', cx)
      .attr('y', cy + 8)
      .attr('text-anchor', 'middle')
      .attr('fill', NAVY_MEDIUM)
      .attr('font-size', 9)
      .attr('font-family', 'var(--font-condensed), sans-serif')
      .text('organisaties')
  }, [data, viewMode, minSources])

  useEffect(() => {
    renderRadial()
    const handleResize = () => renderRadial()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderRadial])

  // Table sort
  const [sortKey, setSortKey] = useState<'totaal' | 'source_count' | 'name'>('source_count')
  const [sortDesc, setSortDesc] = useState(true)

  const sortedEntities = useMemo(() => {
    if (!data) return []
    return [...data.entities].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'totaal') cmp = a.totaal - b.totaal
      else if (sortKey === 'source_count') cmp = a.source_count - b.source_count
      else cmp = a.name.localeCompare(b.name)
      return sortDesc ? -cmp : cmp
    })
  }, [data, sortKey, sortDesc])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDesc(p => !p)
    else { setSortKey(key); setSortDesc(true) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Dependency Radar</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Organisaties die in meerdere databronnen voorkomen — hoe meer bronnen, hoe centraler in de ring.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--navy-medium)]">Minimum bronnen:</span>
          <div className="flex gap-1">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setMinSources(n)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  minSources === n ? 'bg-[var(--navy-dark)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 border-l border-[var(--border)] pl-4">
          <button
            onClick={() => setViewMode('radial')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'radial' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Radar
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'table' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Tabel
          </button>
        </div>
      </div>

      {/* Ring summary */}
      {data && (
        <div className="flex gap-3">
          {Object.entries(data.ring_summary)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([level, count]) => (
              <div key={level} className="text-center">
                <span className="block text-lg font-bold text-[var(--navy-dark)]">{count}</span>
                <span className="text-[10px] text-[var(--navy-medium)]">{level} bronnen</span>
              </div>
            ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {viewMode === 'radial' ? (
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
          ) : (
            /* Table view */
            <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th
                      className="text-left px-3 py-2 font-medium text-[var(--navy-medium)] cursor-pointer hover:text-[var(--navy-dark)]"
                      onClick={() => toggleSort('name')}
                    >
                      Organisatie {sortKey === 'name' ? (sortDesc ? '↓' : '↑') : ''}
                    </th>
                    <th
                      className="text-center px-3 py-2 font-medium text-[var(--navy-medium)] cursor-pointer hover:text-[var(--navy-dark)] w-20"
                      onClick={() => toggleSort('source_count')}
                    >
                      Bronnen {sortKey === 'source_count' ? (sortDesc ? '↓' : '↑') : ''}
                    </th>
                    <th
                      className="text-right px-3 py-2 font-medium text-[var(--navy-medium)] cursor-pointer hover:text-[var(--navy-dark)] w-24"
                      onClick={() => toggleSort('totaal')}
                    >
                      Totaal {sortKey === 'totaal' ? (sortDesc ? '↓' : '↑') : ''}
                    </th>
                    <th className="text-center px-3 py-2 font-medium text-[var(--navy-medium)] w-20">Trend</th>
                    <th className="text-left px-3 py-2 font-medium text-[var(--navy-medium)]">Databronnen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntities.slice(0, 100).map(entity => (
                    <tr
                      key={entity.name}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => setSelectedEntity(selectedEntity?.name === entity.name ? null : entity)}
                    >
                      <td className="px-3 py-2 font-medium text-[var(--navy-dark)] truncate max-w-[250px]" title={entity.name}>
                        {entity.name}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100">
                          {entity.source_count}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--navy-dark)]">
                        {formatEuro(entity.totaal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <EntitySparkline data={entity.per_year} />
                      </td>
                      <td className="px-3 py-2">
                        <SourceBadges sources={entity.sources} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected entity detail */}
          {selectedEntity && (
            <div className="bg-white border border-[var(--pink)] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--navy-dark)]">{selectedEntity.name}</h4>
                  <p className="text-xs text-[var(--navy-medium)]">
                    {selectedEntity.source_count} databronnen · {selectedEntity.years_with_data} jaar actief ·
                    {selectedEntity.record_count} betalingen · Totaal: {formatEuro(selectedEntity.totaal)}
                  </p>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                  Sluiten
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[var(--navy-dark)] mb-1">Databronnen</p>
                  <SourceBadges sources={selectedEntity.sources} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--navy-dark)] mb-1">Verloop</p>
                  <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={YEARS.map(y => ({ year: y, value: selectedEntity.per_year[String(y)] || 0 }))}>
                        <Line type="monotone" dataKey="value" stroke={NAVY_DARK} strokeWidth={1.5} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Year breakdown */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      {YEARS.map(y => (
                        <th key={y} className="px-2 py-1 text-center font-medium text-[var(--navy-medium)]">{y}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {YEARS.map(y => (
                        <td key={y} className="px-2 py-1 text-center tabular-nums text-[var(--navy-dark)]">
                          {selectedEntity.per_year[String(y)] > 0 ? formatEuro(selectedEntity.per_year[String(y)]) : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} ·
            {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
