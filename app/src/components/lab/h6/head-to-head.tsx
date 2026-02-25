'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const ENTITY_COLORS = ['#1a2332', '#e91e63', '#5c6bc0']

interface EntityProfile {
  name: string
  found: boolean
  scores: Record<string, number>
  absolute: Record<string, number>
  sparkline: { year: number; value: number }[]
  sources?: string
}

interface Dimension {
  key: string
  label: string
  description: string
}

interface H2HData {
  entities: EntityProfile[]
  dimensions: Dimension[]
  suggestions: string[]
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

export default function HeadToHead() {
  const [entityInputs, setEntityInputs] = useState<string[]>(['', ''])
  const [activeEntities, setActiveEntities] = useState<string[]>([])
  const [data, setData] = useState<H2HData | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Fetch suggestions on mount
  useEffect(() => {
    fetch('/api/v1/inzichten/head-to-head?entities=_')
      .then(res => res.json())
      .then(d => { if (d.suggestions) setSuggestions(d.suggestions) })
      .catch(() => {})
  }, [])

  // Fetch comparison data
  useEffect(() => {
    if (activeEntities.length === 0) return
    setLoading(true)
    const params = new URLSearchParams({ entities: activeEntities.join(',') })
    fetch(`/api/v1/inzichten/head-to-head?${params}`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) {
          setData(d)
          if (d.suggestions) setSuggestions(d.suggestions)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeEntities])

  const radarData = useMemo(() => {
    if (!data) return []
    return (data.dimensions || []).map(dim => {
      const entry: Record<string, string | number> = { dimension: dim.label }
      data.entities.forEach((e, i) => {
        entry[`entity${i}`] = e.scores[dim.key] || 0
      })
      return entry
    })
  }, [data])

  const handleCompare = () => {
    const valid = entityInputs.filter(e => e.trim()).map(e => e.trim())
    if (valid.length >= 2) setActiveEntities(valid)
  }

  const addEntitySlot = () => {
    if (entityInputs.length < 3) setEntityInputs([...entityInputs, ''])
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Head-to-Head</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Vergelijk 2-3 organisaties op 6 dimensies: totaal, groei, spreiding, stabiliteit, gemiddelde en recentheid.
        </p>
      </div>

      {/* Entity inputs */}
      <div className="space-y-2">
        {entityInputs.map((input, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ENTITY_COLORS[idx] }} />
            <input
              type="text"
              value={input}
              onChange={e => {
                const newInputs = [...entityInputs]
                newInputs[idx] = e.target.value
                setEntityInputs(newInputs)
              }}
              onKeyDown={e => e.key === 'Enter' && handleCompare()}
              placeholder={`Organisatie ${idx + 1}...`}
              className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--navy-medium)]"
              list={`suggestions-${idx}`}
            />
            <datalist id={`suggestions-${idx}`}>
              {suggestions.map(s => <option key={s} value={s} />)}
            </datalist>
            {idx >= 2 && (
              <button
                onClick={() => setEntityInputs(entityInputs.filter((_, i) => i !== idx))}
                className="text-xs text-[var(--navy-medium)] hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          {entityInputs.length < 3 && (
            <button onClick={addEntitySlot} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
              + Organisatie toevoegen
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={entityInputs.filter(e => e.trim()).length < 2}
            className="px-3 py-1 text-xs bg-[var(--navy-dark)] text-white rounded hover:bg-[var(--navy-dark)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vergelijken
          </button>
        </div>
      </div>

      {/* Quick suggestions */}
      {!data && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-[var(--navy-medium)]">Populair:</span>
          {suggestions.slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => {
                // Fill first empty input
                const idx = entityInputs.findIndex(e => !e.trim())
                if (idx >= 0) {
                  const newInputs = [...entityInputs]
                  newInputs[idx] = s
                  setEntityInputs(newInputs)
                }
              }}
              className="text-xs px-2 py-0.5 bg-gray-100 text-[var(--navy-medium)] rounded hover:bg-gray-200 transition-colors truncate max-w-[200px]"
            >
              {s}
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
          {/* Not found warnings */}
          {data.entities.filter(e => !e.found).map(e => (
            <p key={e.name} className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              &quot;{e.name}&quot; niet gevonden in de database
            </p>
          ))}

          {/* Radar chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">Profiel vergelijking (0-100 schaal)</h3>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: NAVY_DARK }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: NAVY_MEDIUM }} />
                  {data.entities.filter(e => e.found).map((e, i) => (
                    <Radar
                      key={e.name}
                      name={e.name}
                      dataKey={`entity${data.entities.indexOf(e)}`}
                      stroke={ENTITY_COLORS[data.entities.indexOf(e)]}
                      fill={ENTITY_COLORS[data.entities.indexOf(e)]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 font-medium text-[var(--navy-dark)]">Dimensie</th>
                  {data.entities.filter(e => e.found).map((e, i) => (
                    <th key={e.name} className="text-right px-3 py-2 font-medium" style={{ color: ENTITY_COLORS[data.entities.indexOf(e)] }}>
                      {e.name.length > 20 ? e.name.slice(0, 18) + '...' : e.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.dimensions || []).map(dim => (
                  <tr key={dim.key} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-1.5">
                      <span className="font-medium text-[var(--navy-dark)]">{dim.label}</span>
                      <span className="block text-[var(--navy-medium)] text-[10px]">{dim.description}</span>
                    </td>
                    {data.entities.filter(e => e.found).map(e => {
                      const absValue = e.absolute[dim.key]
                      const score = e.scores[dim.key]
                      let displayValue = String(absValue)
                      if (dim.key === 'total' || dim.key === 'average') displayValue = formatEuro(absValue)
                      else if (dim.key === 'growth' || dim.key === 'concentration') displayValue = `${absValue}%`
                      return (
                        <td key={e.name} className="px-3 py-1.5 text-right tabular-nums">
                          <span className="text-[var(--navy-dark)] font-medium">{displayValue}</span>
                          <span className="block text-[var(--navy-medium)] text-[10px]">score: {score}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sparklines side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.entities.filter(e => e.found).map((e, i) => (
              <div key={e.name} className="bg-white border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ENTITY_COLORS[data.entities.indexOf(e)] }} />
                  <h4 className="text-xs font-semibold text-[var(--navy-dark)] truncate">{e.name}</h4>
                </div>
                {e.sources && (
                  <p className="text-[10px] text-[var(--navy-medium)] mb-2">Bronnen: {e.sources}</p>
                )}
                <div className="h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={e.sparkline} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: NAVY_MEDIUM }} tickLine={false} />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={ENTITY_COLORS[data.entities.indexOf(e)]}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
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
