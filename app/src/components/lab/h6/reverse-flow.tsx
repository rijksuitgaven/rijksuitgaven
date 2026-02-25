'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

const MODULE_COLORS: Record<string, string> = {
  Instrumenten: '#1a2332',
  Apparaat: '#37474f',
  Inkoop: '#e91e63',
  Provincie: '#5c6bc0',
  Gemeente: '#26a69a',
  Publiek: '#8d6e63',
}

interface FlowModule {
  module: string
  total: number
  year_amount: number
  sparkline: { year: number; value: number }[]
  details: { ministry?: string; regeling?: string; amount: number }[]
}

interface FlowData {
  recipient: string
  year: string
  modules: FlowModule[]
  grand_total: number
  module_count: number
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

const SUGGESTIONS = [
  'ProRail B.V.',
  'Politie',
  'Rijkswaterstaat',
  'NS Groep N.V.',
  'Belastingdienst',
  'Defensie',
  'Stichting DUO',
]

export default function ReverseFlow() {
  const [recipient, setRecipient] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [year, setYear] = useState('totaal')
  const [data, setData] = useState<FlowData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState<FlowModule | null>(null)

  useEffect(() => {
    if (!recipient) return
    setLoading(true)
    const params = new URLSearchParams({ recipient, year })
    fetch(`/api/v1/inzichten/reverse-flow?${params}`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d)
        else setData(null)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [recipient, year])

  const handleSearch = () => {
    if (searchInput.trim()) {
      setRecipient(searchInput.trim())
      setSelectedModule(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Reverse Flow</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Volg het geld terug naar de bron — voor elke ontvanger, alle databronnen en regelingen.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Zoek ontvanger (bijv. ProRail B.V.)..."
          className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--navy-medium)]"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm bg-[var(--navy-dark)] text-white rounded-lg hover:bg-[var(--navy-dark)]/90 transition-colors"
        >
          Zoeken
        </button>
      </div>

      {/* Suggestions */}
      {!recipient && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-[var(--navy-medium)]">Suggesties:</span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setSearchInput(s); setRecipient(s) }}
              className="text-xs px-2 py-0.5 bg-gray-100 text-[var(--navy-medium)] rounded hover:bg-gray-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Year selector */}
      {recipient && (
        <div className="flex gap-1 overflow-x-auto">
          {['totaal', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016'].map(y => (
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
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
        </div>
      ) : data ? (
        <>
          {/* Header */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)]">{data.recipient}</h3>
            <p className="text-xs text-[var(--navy-medium)] mt-0.5">
              Gevonden in {data.module_count} databron{data.module_count !== 1 ? 'nen' : ''} ·
              Totaal: {formatEuroFull(data.grand_total)} ({year === 'totaal' ? 'cumulatief 2016–2024' : year})
            </p>
          </div>

          {/* Module breakdown as horizontal bars */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">Bedrag per databron</h3>
            <div style={{ height: Math.max(200, data.modules.length * 50) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.modules.map(m => ({
                    name: m.module.charAt(0).toUpperCase() + m.module.slice(1),
                    amount: m.year_amount,
                    total: m.total,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 60, bottom: 5, left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} tickFormatter={(v: number) => formatEuro(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: NAVY_DARK }} width={95} />
                  <Tooltip
                    formatter={(value) => [formatEuroFull(Number(value || 0)), 'Bedrag']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {data.modules.map((m, idx) => (
                      <Cell
                        key={idx}
                        fill={MODULE_COLORS[m.module.charAt(0).toUpperCase() + m.module.slice(1)] || NAVY_DARK}
                        cursor="pointer"
                        onClick={() => setSelectedModule(m)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module detail panel */}
          {selectedModule && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
                    {selectedModule.module.charAt(0).toUpperCase() + selectedModule.module.slice(1)}
                  </h3>
                  <p className="text-xs text-[var(--navy-medium)]">
                    {year === 'totaal' ? 'Cumulatief' : year}: {formatEuroFull(selectedModule.year_amount)}
                    · Totaal alle jaren: {formatEuroFull(selectedModule.total)}
                  </p>
                </div>
                <button onClick={() => setSelectedModule(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                  Sluiten
                </button>
              </div>

              {/* Sparkline */}
              <div className="h-[100px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedModule.sparkline} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} />
                    <YAxis tick={{ fontSize: 10, fill: NAVY_MEDIUM }} tickFormatter={(v: number) => formatEuro(v)} width={60} />
                    <Line type="monotone" dataKey="value" stroke={PINK} strokeWidth={2} dot={{ r: 3, fill: PINK }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Details (ministries/regelingen) */}
              {selectedModule.details.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--navy-dark)] mb-2">Detail (ministerie / regeling)</h4>
                  <div className="space-y-1">
                    {selectedModule.details.slice(0, 10).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                        <span className="text-[var(--navy-dark)] truncate mr-2">
                          {d.ministry || d.regeling || '—'}
                        </span>
                        <span className="tabular-nums text-[var(--navy-medium)] whitespace-nowrap">
                          {formatEuroFull(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Provenance */}
          <p className="text-xs text-[var(--navy-medium)]">
            Laatst bijgewerkt: {data.data_notes.last_updated} · Bron: {data.data_notes.scope} · {data.data_notes.note}
          </p>
        </>
      ) : recipient ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--navy-medium)]">Geen resultaten gevonden voor &quot;{recipient}&quot;</p>
          <p className="text-xs text-[var(--navy-medium)] mt-1">Probeer een exacte naam (bijv. &quot;ProRail B.V.&quot;)</p>
        </div>
      ) : null}
    </div>
  )
}
