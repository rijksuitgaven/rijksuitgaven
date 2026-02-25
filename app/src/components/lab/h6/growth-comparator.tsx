'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'publiek', label: 'Publiek' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'apparaat', label: 'Apparaat' },
]

const LINE_COLORS = ['#1a2332', '#e91e63', '#5c6bc0', '#26a69a', '#8d6e63']

interface EntityData {
  name: string
  total: number
  base_year: number
  base_amount: number
  has_base: boolean
  small_base: boolean
  absolute: { year: number; value: number }[]
  indexed: { year: number; value: number }[]
}

interface GrowthData {
  module: string
  base_year: number
  entities: EntityData[]
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

export default function GrowthComparator() {
  const [module, setModule] = useState('instrumenten')
  const [baseYear, setBaseYear] = useState(2016)
  const [mode, setMode] = useState<'indexed' | 'absolute'>('indexed')
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['ProRail'])
  const [entityInput, setEntityInput] = useState('')
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (selectedEntities.length === 0) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    const params = new URLSearchParams({
      module,
      entities: selectedEntities.join(','),
      base_year: String(baseYear),
    })
    fetch(`/api/v1/inzichten/growth-comparator?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, selectedEntities, baseYear])

  const chartData = useMemo(() => {
    if (!data || data.entities.length === 0) return []
    return YEARS.map((y, idx) => {
      const entry: Record<string, number | string> = { year: String(y) }
      for (const entity of data.entities) {
        const key = entity.name
        const series = mode === 'indexed' ? entity.indexed : entity.absolute
        entry[key] = series[idx]?.value || 0
      }
      return entry
    })
  }, [data, mode])

  const filteredSuggestions = useMemo(() => {
    if (!data || !entityInput) return []
    return data.suggestions
      .filter(s => s.toLowerCase().includes(entityInput.toLowerCase()))
      .filter(s => !selectedEntities.includes(s))
      .slice(0, 8)
  }, [data, entityInput, selectedEntities])

  const addEntity = useCallback((name: string) => {
    if (selectedEntities.length >= 5) return
    if (!selectedEntities.includes(name)) {
      setSelectedEntities(prev => [...prev, name])
    }
    setEntityInput('')
    setShowSuggestions(false)
  }, [selectedEntities])

  const removeEntity = useCallback((name: string) => {
    setSelectedEntities(prev => prev.filter(e => e !== name))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Growth Comparator</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Vergelijk groeisnelheden ongeacht schaal — alles start op index 100 in het basisjaar.
        </p>
      </div>

      {/* Controls row 1 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Module */}
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

        {/* Mode toggle */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Modus:</span>
          <div className="flex gap-1">
            {(['indexed', 'absolute'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  mode === m ? 'bg-[var(--pink)] text-white' : 'bg-gray-100 text-[var(--navy-medium)]'
                }`}
              >
                {m === 'indexed' ? 'Index (100)' : 'Absoluut (€)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Base year selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--navy-medium)]">Basisjaar:</span>
        <div className="flex gap-1">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setBaseYear(y)}
              className={`w-9 h-6 text-[10px] rounded transition-colors ${
                baseYear === y
                  ? 'bg-[var(--pink)] text-white'
                  : 'bg-gray-100 text-[var(--navy-medium)] hover:bg-gray-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Entity picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--navy-medium)]">Vergelijk:</span>
        {selectedEntities.map((name, idx) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded"
            style={{ backgroundColor: LINE_COLORS[idx] + '20', color: LINE_COLORS[idx], border: `1px solid ${LINE_COLORS[idx]}40` }}
          >
            {name.length > 25 ? name.slice(0, 23) + '...' : name}
            <button onClick={() => removeEntity(name)} className="hover:opacity-60">×</button>
          </span>
        ))}
        {selectedEntities.length < 5 && (
          <div className="relative">
            <input
              type="text"
              value={entityInput}
              onChange={e => { setEntityInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' && entityInput.trim()) {
                  addEntity(entityInput.trim())
                }
              }}
              placeholder="+ Toevoegen..."
              className="px-2 py-1 text-xs border border-[var(--border)] rounded w-40 focus:outline-none focus:border-[var(--navy-medium)]"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 mt-1 w-64 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => addEntity(s)}
                    className="w-full text-left px-3 py-1.5 text-xs text-[var(--navy-dark)] hover:bg-gray-50 truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {data?.entities.some(e => e.small_base) && mode === 'indexed' && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
          ⚠ Kleine basis — sommige entiteiten hadden &lt;€1M in {baseYear}. Percentages kunnen misleidend zijn.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data && data.entities.length > 0 ? (
        <>
          {/* Chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-3">
              {mode === 'indexed'
                ? `Groei-index (${baseYear} = 100)`
                : 'Absoluut bedrag per jaar'}
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: NAVY_MEDIUM }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) => mode === 'indexed' ? String(v) : formatEuro(v)}
                    width={mode === 'indexed' ? 40 : 70}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value || 0)
                      if (mode === 'indexed') {
                        // Find absolute amount for this entity/year
                        const entity = data.entities.find(e => e.name === name)
                        const yearEntry = entity?.absolute.find(a => a.value)
                        return [`Index: ${v.toFixed(1)}`, String(name)]
                      }
                      return [formatEuroFull(v), String(name)]
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  {mode === 'indexed' && (
                    <ReferenceLine y={100} stroke="#9ca3af" strokeDasharray="4 4" />
                  )}
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value: string) => value.length > 30 ? value.slice(0, 28) + '...' : value}
                  />
                  {data.entities.map((entity, idx) => (
                    <Line
                      key={entity.name}
                      type="monotone"
                      dataKey={entity.name}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                      strokeDasharray={!entity.has_base && mode === 'indexed' ? '4 4' : undefined}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Entity summary table */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 text-[var(--navy-medium)] font-medium">Entiteit</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Basis ({baseYear})</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Laatste (2024)</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Groei</th>
                  <th className="text-right px-3 py-2 text-[var(--navy-medium)] font-medium">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {data.entities.map((entity, idx) => {
                  const baseVal = entity.base_amount
                  const latestVal = entity.absolute.find(a => a.year === 2024)?.value || 0
                  const growth = baseVal > 0 ? ((latestVal - baseVal) / baseVal) * 100 : 0
                  return (
                    <tr key={entity.name} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-2 text-[var(--navy-dark)] font-medium">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS[idx] }} />
                        {entity.name}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{formatEuro(baseVal)}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{formatEuro(latestVal)}</td>
                      <td className={`text-right px-3 py-2 tabular-nums ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {entity.has_base ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{formatEuro(entity.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-lg p-12 text-center">
          <p className="text-sm text-[var(--navy-medium)]">Voeg entiteiten toe om groei te vergelijken.</p>
        </div>
      )}
    </div>
  )
}
