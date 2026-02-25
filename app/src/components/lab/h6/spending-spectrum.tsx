'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LineChart, Line,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

const MODULES = [
  { id: 'instrumenten', label: 'Instrumenten' },
  { id: 'inkoop', label: 'Inkoop' },
  { id: 'publiek', label: 'Publiek' },
  { id: 'gemeente', label: 'Gemeente' },
  { id: 'provincie', label: 'Provincie' },
  { id: 'apparaat', label: 'Apparaat' },
]

interface HistogramBucket {
  label: string
  count: number
  total_amount: number
  min: number
  max: number | null
}

interface BoxPlot {
  year: number
  min: number
  p25: number
  median: number
  p75: number
  p95: number
  max: number
  count: number
}

interface HighlightData {
  name: string
  amount: number
  rank: number
  percentile: number
  bracket: string
  total_in_module: number
}

interface SpectrumData {
  module: string
  year: string
  histogram: HistogramBucket[]
  box_plots: BoxPlot[]
  highlight: HighlightData | null
  summary: {
    total_recipients: number
    total_amount: number
    median: number
    mean: number
    negative_count: number
  }
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

export default function SpendingSpectrum() {
  const [module, setModule] = useState('instrumenten')
  const [year, setYear] = useState('2024')
  const [highlightQuery, setHighlightQuery] = useState('')
  const [data, setData] = useState<SpectrumData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      module,
      year,
      ...(highlightQuery ? { highlight: highlightQuery } : {}),
    })
    fetch(`/api/v1/inzichten/spending-spectrum?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [module, year, highlightQuery])

  // Histogram data with highlight bracket
  const histogramData = useMemo(() => {
    if (!data) return []
    return data.histogram.map(b => ({
      ...b,
      isHighlight: data.highlight ? b.label === data.highlight.bracket : false,
    }))
  }, [data])

  // Box plot data for small multiples
  const boxPlotData = useMemo(() => {
    if (!data) return []
    return data.box_plots.map(bp => ({
      year: String(bp.year),
      median: bp.median,
      p25: bp.p25,
      p75: bp.p75,
      p95: bp.p95,
      min: bp.min,
      max: bp.max,
      count: bp.count,
      // For visual: IQR range as area
      iqr_low: bp.p25,
      iqr_high: bp.p75,
    }))
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Spending Spectrum</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoe is het geld verdeeld? Hoeveel ontvangers zitten in welke schaal?
        </p>
      </div>

      {/* Controls */}
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

        {/* Entity highlight */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
          <span className="text-xs text-[var(--navy-medium)]">Markeer:</span>
          <input
            type="text"
            value={highlightQuery}
            onChange={e => setHighlightQuery(e.target.value)}
            placeholder="Zoek organisatie..."
            className="px-2 py-1 text-xs border border-[var(--border)] rounded w-40 focus:outline-none focus:border-[var(--navy-medium)]"
          />
        </div>
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
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] text-[var(--navy-medium)] uppercase tracking-wide">Ontvangers</div>
              <div className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">
                {data.summary.total_recipients.toLocaleString('nl-NL')}
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] text-[var(--navy-medium)] uppercase tracking-wide">Mediaan</div>
              <div className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">
                {formatEuro(data.summary.median)}
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] text-[var(--navy-medium)] uppercase tracking-wide">Gemiddeld</div>
              <div className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">
                {formatEuro(data.summary.mean)}
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="text-[10px] text-[var(--navy-medium)] uppercase tracking-wide">Totaal</div>
              <div className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">
                {formatEuro(data.summary.total_amount)}
              </div>
            </div>
          </div>

          {/* Highlight card */}
          {data.highlight && (
            <div className="bg-[var(--pink)] bg-opacity-5 border border-[var(--pink)] border-opacity-30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--navy-dark)]">{data.highlight.name}</span>
                  <span className="text-xs text-[var(--navy-medium)] ml-2">
                    {formatEuroFull(data.highlight.amount)} · Bracket: {data.highlight.bracket}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--navy-medium)]">
                    Rang #{data.highlight.rank} van {data.highlight.total_in_module.toLocaleString('nl-NL')}
                  </span>
                  <span className="text-xs text-[var(--pink)] ml-2 font-semibold">
                    Top {(100 - data.highlight.percentile).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Histogram */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-1">
              Verdeling naar bedragschaal — {year === 'totaal' ? 'Alle jaren' : year}{year === '2024' ? '*' : ''}
            </h3>
            <p className="text-[10px] text-[var(--navy-medium)] mb-3">
              Logaritmische schaal. Elke balk = aantal ontvangers in die bedragklasse.
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    width={50}
                    label={{ value: 'Aantal ontvangers', angle: -90, position: 'insideLeft', fontSize: 10, fill: NAVY_MEDIUM }}
                  />
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const bucket = props.payload
                      return [
                        `${Number(value).toLocaleString('nl-NL')} ontvangers · Totaal: ${formatEuro(bucket.total_amount)}`,
                        bucket.label,
                      ]
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {histogramData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.isHighlight ? PINK : NAVY_DARK}
                        fillOpacity={entry.isHighlight ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box plot trends (median + IQR over time) */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold text-[var(--navy-dark)] mb-1">
              Mediaan & spreiding door de jaren (2016–2024)
            </h3>
            <p className="text-[10px] text-[var(--navy-medium)] mb-3">
              Mediaan bedrag per ontvanger. Band toont P25–P75 (middelste 50%).
            </p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={boxPlotData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: NAVY_MEDIUM }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) => formatEuro(v)}
                    width={60}
                    scale="log"
                    domain={['auto', 'auto']}
                    allowDataOverflow
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const v = Number(value || 0)
                      const labels: Record<string, string> = {
                        p95: 'P95',
                        p75: 'P75',
                        median: 'Mediaan',
                        p25: 'P25',
                      }
                      return [formatEuroFull(v), labels[String(name)] || String(name)]
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="p95" stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" dot={false} name="p95" />
                  <Line type="monotone" dataKey="p75" stroke={NAVY_MEDIUM} strokeWidth={1} dot={false} name="p75" />
                  <Line type="monotone" dataKey="median" stroke={PINK} strokeWidth={2.5} dot={{ r: 3, fill: PINK }} name="median" />
                  <Line type="monotone" dataKey="p25" stroke={NAVY_MEDIUM} strokeWidth={1} dot={false} name="p25" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Negative amounts note */}
          {data.summary.negative_count > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
              {data.summary.negative_count} ontvangers met negatieve bedragen zijn uitgesloten van deze verdeling.
            </p>
          )}

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
