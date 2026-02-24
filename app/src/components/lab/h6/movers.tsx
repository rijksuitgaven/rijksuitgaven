'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const PINK = '#e91e63'
const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'publiek', label: 'Publiek' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'apparaat', label: 'Apparaat' },
]

interface Recipient {
  name: string
  ranks: Record<string, number | null>
  amounts: Record<string, number | null>
  totaal: number
}

interface MoversData {
  module: string
  top: number
  total_entities: number
  recipients: Recipient[]
  data_notes: { last_updated: string; scope: string; amount_unit: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

// Generate distinct colors for up to 50 lines
function getLineColor(index: number): string {
  const hues = [210, 340, 160, 30, 270, 190, 60, 300, 120, 0]
  const hue = hues[index % hues.length]
  const lightness = 35 + (index % 3) * 10
  return `hsl(${hue}, 60%, ${lightness}%)`
}

export default function Movers() {
  const [module, setModule] = useState('instrumenten')
  const [data, setData] = useState<MoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  const [pinnedLines, setPinnedLines] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'rank' | 'amount'>('rank')

  useEffect(() => {
    setLoading(true)
    setHoveredLine(null)
    setPinnedLines(new Set())
    fetch(`/api/v1/inzichten/movers?module=${module}&top=25`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module])

  // Build chart data: one entry per year, with each recipient as a series
  const { chartData, visibleRecipients } = useMemo(() => {
    if (!data) return { chartData: [], visibleRecipients: [] }

    // Filter to top 25 by total
    const top25 = data.recipients.slice(0, 25)

    const chartData = YEARS.map(year => {
      const yearStr = String(year)
      const entry: Record<string, number | string | null> = { year: yearStr }
      for (const r of top25) {
        entry[r.name] = viewMode === 'rank' ? r.ranks[yearStr] : r.amounts[yearStr]
      }
      return entry
    })

    return { chartData, visibleRecipients: top25 }
  }, [data, viewMode])

  const togglePin = (name: string) => {
    setPinnedLines(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else if (next.size < 3) next.add(name)
      return next
    })
  }

  const isHighlighted = (name: string) =>
    hoveredLine === name || pinnedLines.has(name)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">The Movers</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Volg de top 25 ontvangers door de jaren heen — wie stijgt, wie daalt, wie verschijnt?
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setModule(m.id)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                module === m.id
                  ? 'bg-[var(--navy-dark)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 border-l border-[var(--border)] pl-4">
          <button
            onClick={() => setViewMode('rank')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'rank' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Positie
          </button>
          <button
            onClick={() => setViewMode('amount')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'amount' ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
            }`}
          >
            Bedrag
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          <p className="text-xs text-[var(--navy-medium)]">
            Top 25 van <strong>{data.total_entities.toLocaleString('nl-NL')}</strong> ontvangers.
            Klik op een lijn om vast te zetten (max 3). Hover voor details.
          </p>

          {/* Chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    reversed={viewMode === 'rank'}
                    domain={viewMode === 'rank' ? [1, 25] : ['auto', 'auto']}
                    tickFormatter={viewMode === 'rank'
                      ? (v: number) => `#${v}`
                      : (v: number) => formatEuro(v)
                    }
                    width={viewMode === 'rank' ? 35 : 70}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const highlighted = payload.filter(p =>
                        isHighlighted(p.dataKey as string)
                      )
                      const items = highlighted.length > 0 ? highlighted : payload.slice(0, 5)
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 max-w-xs">
                          <p className="text-xs font-medium text-[var(--navy-dark)] mb-1">Jaar {label}</p>
                          {items.map(item => {
                            const name = item.dataKey as string
                            const recipient = visibleRecipients.find(r => r.name === name)
                            const rank = recipient?.ranks[String(label)]
                            const amount = recipient?.amounts[String(label)]
                            return (
                              <p key={name} className="text-[10px] text-[var(--navy-medium)] truncate">
                                <span style={{ color: item.color }}>{name.slice(0, 30)}</span>
                                {rank ? ` — #${rank}` : ''}
                                {amount ? ` (${formatEuro(amount)})` : ''}
                              </p>
                            )
                          })}
                        </div>
                      )
                    }}
                  />
                  {visibleRecipients.map((r, i) => {
                    const highlighted = isHighlighted(r.name)
                    return (
                      <Line
                        key={r.name}
                        type="monotone"
                        dataKey={r.name}
                        stroke={highlighted ? (pinnedLines.has(r.name) ? PINK : NAVY_DARK) : getLineColor(i)}
                        strokeWidth={highlighted ? 2.5 : 1}
                        strokeOpacity={hoveredLine || pinnedLines.size > 0 ? (highlighted ? 1 : 0.08) : 0.3}
                        dot={false}
                        connectNulls={false}
                        onMouseEnter={() => setHoveredLine(r.name)}
                        onMouseLeave={() => setHoveredLine(null)}
                        onClick={() => togglePin(r.name)}
                        style={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pinned details */}
          {pinnedLines.size > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from(pinnedLines).map(name => {
                const r = visibleRecipients.find(v => v.name === name)
                if (!r) return null
                return (
                  <div key={name} className="bg-white border border-[var(--pink)] rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-xs font-semibold text-[var(--navy-dark)] truncate flex-1">{name}</h4>
                      <button
                        onClick={() => togglePin(name)}
                        className="text-[10px] text-[var(--navy-medium)] hover:text-[var(--pink)] ml-2"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-[var(--navy-medium)] mb-2">
                      Totaal: <strong>{formatEuro(r.totaal)}</strong>
                    </p>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr>
                          {YEARS.map(y => (
                            <th key={y} className="px-0.5 text-center font-medium text-[var(--navy-medium)]">{String(y).slice(2)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {YEARS.map(y => (
                            <td key={y} className="px-0.5 text-center tabular-nums text-[var(--navy-dark)]">
                              {r.ranks[String(y)] ? `#${r.ranks[String(y)]}` : '—'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope}
          </p>
        </>
      ) : null}
    </div>
  )
}
