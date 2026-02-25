'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', 'totaal']

interface PerCapitaEntity {
  name: string
  amount: number
  population: number | null
  per_capita: number | null
  sparkline: { year: number; value: number; per_capita: number | null }[]
}

interface PerCapitaData {
  module: string
  year: string
  entities: PerCapitaEntity[]
  summary: { total_amount: number; total_population: number; average_per_capita: number; entities_with_population: number }
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

export default function SpendingPerCapita() {
  const [year, setYear] = useState('2024')
  const [data, setData] = useState<PerCapitaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<PerCapitaEntity | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/inzichten/per-capita?year=${year}&module=provincie`)
      .then(res => res.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.entities
      .filter(e => e.per_capita !== null)
      .map(e => ({
        name: e.name,
        per_capita: e.per_capita!,
        amount: e.amount,
        population: e.population!,
      }))
      .sort((a, b) => b.per_capita - a.per_capita)
  }, [data])

  const avgPerCapita = data?.summary.average_per_capita || 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Spending per Capita</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Hoeveel overheidsuitgaven per inwoner, per provincie? Op basis van CBS bevolkingsdata 2024.
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
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Totale uitgaven</p>
              <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{formatEuro(data.summary.total_amount)}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Gemiddeld per inwoner</p>
              <p className="text-lg font-bold text-[var(--pink)] tabular-nums">€{avgPerCapita.toLocaleString('nl-NL')}</p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--navy-medium)]">Provincies</p>
              <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{data.summary.entities_with_population}</p>
            </div>
          </div>

          {/* Bar chart: per capita */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
              Uitgaven per inwoner — {year === 'totaal' ? 'Cumulatief' : year}
            </h3>
            <div style={{ height: Math.max(350, chartData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 80, bottom: 5, left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                    tickLine={false}
                    tickFormatter={(v: number) => `€${v.toLocaleString('nl-NL')}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: NAVY_DARK }}
                    tickLine={false}
                    width={115}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'per_capita') return [`€${Number(value).toLocaleString('nl-NL')} per inwoner`, 'Per capita']
                      return [formatEuroFull(Number(value || 0)), 'Bedrag']
                    }}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="per_capita" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.per_capita > avgPerCapita ? PINK : NAVY_DARK}
                        fillOpacity={0.8}
                        cursor="pointer"
                        onClick={() => {
                          const full = data.entities.find(e => e.name === entry.name)
                          if (full) setSelectedEntity(full)
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-[var(--navy-medium)] mt-2">
              Roze = boven gemiddelde (€{avgPerCapita.toLocaleString('nl-NL')}/inwoner)
            </p>
          </div>

          {/* Detail panel */}
          {selectedEntity && selectedEntity.per_capita !== null && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--navy-dark)]">{selectedEntity.name}</h3>
                  <p className="text-xs text-[var(--navy-medium)]">
                    €{selectedEntity.per_capita.toLocaleString('nl-NL')} per inwoner ·
                    Bevolking: {(selectedEntity.population || 0).toLocaleString('nl-NL')} ·
                    Totaal: {formatEuroFull(selectedEntity.amount)}
                  </p>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                  Sluiten
                </button>
              </div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedEntity.sparkline.filter(s => s.per_capita !== null)}
                    margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: NAVY_MEDIUM }}
                      tickFormatter={(v: number) => `€${v.toLocaleString('nl-NL')}`}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value) => [`€${Number(value).toLocaleString('nl-NL')} per inwoner`, 'Per capita']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Line type="monotone" dataKey="per_capita" stroke={PINK} strokeWidth={2} dot={{ r: 3, fill: PINK }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Note */}
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Bevolkingsdata: CBS 2024 (afgerond). Per capita-bedragen zijn gebaseerd op provinciale uitgaven uit de provincie-module — dit vertegenwoordigt niet alle overheidsuitgaven.
          </p>

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : null}
    </div>
  )
}
