'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'
const GREEN = '#16a34a'
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
const METRICS = ['total', 'recipients', 'average', 'concentration', 'regelingen'] as const
type MetricKey = typeof METRICS[number]

interface MinistryRow {
  ministry: string
  grand_total: number
  metrics: Record<MetricKey, Record<string, number>>
}

interface DnaData {
  ministries: MinistryRow[]
  years: number[]
  metric_labels: Record<MetricKey, string>
  data_notes: { last_updated: string; scope: string; amount_unit: string }
}

function formatEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)} mld`
  if (Math.abs(value) >= 1_000_000) return `€${Math.round(value / 1_000_000)} mln`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function formatMetricValue(value: number, metric: MetricKey): string {
  switch (metric) {
    case 'total': return formatEuro(value)
    case 'average': return formatEuro(value)
    case 'recipients': return value.toLocaleString('nl-NL')
    case 'concentration': return `${value}%`
    case 'regelingen': return String(value)
  }
}

function getSlope(values: Record<string, number>): 'up' | 'down' | 'flat' {
  const nums = YEARS.map(y => values[String(y)] || 0).filter(v => v > 0)
  if (nums.length < 2) return 'flat'
  const first = nums[0]
  const last = nums[nums.length - 1]
  const change = first > 0 ? ((last - first) / first) * 100 : 0
  if (change > 10) return 'up'
  if (change < -10) return 'down'
  return 'flat'
}

function getSlopeColor(slope: 'up' | 'down' | 'flat'): string {
  switch (slope) {
    case 'up': return NAVY_DARK
    case 'down': return PINK
    case 'flat': return '#9ca3af'
  }
}

function Sparkline({ values, metric }: { values: Record<string, number>; metric: MetricKey }) {
  const data = YEARS.map(y => ({ year: y, value: values[String(y)] || 0 }))
  const slope = getSlope(values)
  const color = getSlopeColor(slope)

  return (
    <div className="h-7 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ExpandedChart({ ministry, metric, metricLabel, values }: {
  ministry: string
  metric: MetricKey
  metricLabel: string
  values: Record<string, number>
}) {
  const data = YEARS.map(y => ({ year: String(y), value: values[String(y)] || 0 }))

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 shadow-lg">
      <h4 className="text-xs font-semibold text-[var(--navy-dark)] mb-1">{ministry}</h4>
      <p className="text-[10px] text-[var(--navy-medium)] mb-2">{metricLabel}</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: NAVY_MEDIUM }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 9, fill: NAVY_MEDIUM }}
              tickLine={false}
              tickFormatter={(v: number) => formatMetricValue(v, metric)}
              width={55}
            />
            <Tooltip
              formatter={(v) => [formatMetricValue(Number(v) || 0, metric), metricLabel]}
              contentStyle={{ fontSize: 10, borderRadius: 6 }}
            />
            <Line type="monotone" dataKey="value" stroke={NAVY_DARK} strokeWidth={2} dot={{ r: 2, fill: NAVY_DARK }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function MinistryDNA() {
  const [data, setData] = useState<DnaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<{ ministry: string; metric: MetricKey } | null>(null)

  useEffect(() => {
    fetch('/api/v1/inzichten/ministry-dna')
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-[var(--navy-medium)]">Laden...</p></div>
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-500">Fout bij laden</p></div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Ministry DNA</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Structurele uitgavenpatronen per ministerie: 5 metrics als 9-jaar sparklines.
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="inline-block w-3 h-0.5" style={{ background: NAVY_DARK }} /> stijgend
            <span className="inline-block w-3 h-0.5" style={{ background: PINK }} /> dalend
            <span className="inline-block w-3 h-0.5" style={{ background: '#9ca3af' }} /> stabiel
          </span>
        </p>
      </div>

      {/* Grid */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-3 py-2 font-medium text-[var(--navy-medium)] w-48">Ministerie</th>
              <th className="text-left px-3 py-2 font-medium text-[var(--navy-medium)] w-20">Totaal</th>
              {METRICS.map(m => (
                <th key={m} className="text-center px-2 py-2 font-medium text-[var(--navy-medium)]" title={data.metric_labels[m]}>
                  {data.metric_labels[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.ministries.map(row => (
              <tr key={row.ministry} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-[var(--navy-dark)] truncate max-w-[200px]" title={row.ministry}>
                  {row.ministry}
                </td>
                <td className="px-3 py-2 tabular-nums text-[var(--navy-dark)]">
                  {formatEuro(row.grand_total)}
                </td>
                {METRICS.map(m => (
                  <td
                    key={m}
                    className="px-2 py-1.5 text-center cursor-pointer hover:bg-blue-50 transition-colors rounded"
                    onClick={() => setExpanded(
                      expanded?.ministry === row.ministry && expanded.metric === m
                        ? null
                        : { ministry: row.ministry, metric: m }
                    )}
                  >
                    <Sparkline values={row.metrics[m]} metric={m} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded chart */}
      {expanded && (
        <ExpandedChart
          ministry={expanded.ministry}
          metric={expanded.metric}
          metricLabel={data.metric_labels[expanded.metric]}
          values={data.ministries.find(m => m.ministry === expanded.ministry)?.metrics[expanded.metric] || {}}
        />
      )}

      <p className="text-xs text-[var(--navy-medium)]">
        Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} ·
        Sparklines tonen vorm (trend), niet schaal. Klik voor details.
      </p>
    </div>
  )
}
