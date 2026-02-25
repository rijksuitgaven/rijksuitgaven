'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie,
} from 'recharts'

const NAVY_DARK = '#1a2332'
const NAVY_MEDIUM = '#5a6577'
const PINK = '#e91e63'

interface RegelingListItem {
  name: string
  count: number
  total: number
}

interface RegelingProfile {
  total_amount: number
  recipient_count: number
  average: number
  gini: number | null
  top_5_share: number
  top_5: { name: string; amount: number }[]
  ministries: string[]
}

interface RegelingRecipient {
  name: string
  amount: number
  total: number
  sparkline: { year: number; value: number }[]
}

interface ProfileData {
  regeling: string
  year: string
  profile: RegelingProfile
  histogram: { label: string; count: number }[]
  recipients: RegelingRecipient[]
  total_recipients: number
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

const YEARS = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', 'totaal']
const HISTOGRAM_COLORS = ['#c8e6c9', '#81c784', '#5c6bc0', '#e91e63']

export default function RegelingProfileView() {
  const [regelingList, setRegelingList] = useState<RegelingListItem[]>([])
  const [selectedRegeling, setSelectedRegeling] = useState('')
  const [year, setYear] = useState('2024')
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<RegelingRecipient | null>(null)

  // Fetch regeling list
  useEffect(() => {
    fetch('/api/v1/inzichten/regeling-profile?mode=list')
      .then(res => res.json())
      .then(d => {
        if (d.regelingen) setRegelingList(d.regelingen)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch profile when regeling selected
  useEffect(() => {
    if (!selectedRegeling) return
    setLoading(true)
    const params = new URLSearchParams({ regeling: selectedRegeling, year })
    fetch(`/api/v1/inzichten/regeling-profile?${params}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setProfileData(d); else setProfileData(null) })
      .catch(() => setProfileData(null))
      .finally(() => setLoading(false))
  }, [selectedRegeling, year])

  const filteredList = useMemo(() => {
    if (!searchFilter) return regelingList.slice(0, 30)
    const q = searchFilter.toLowerCase()
    return regelingList.filter(r => r.name.toLowerCase().includes(q)).slice(0, 30)
  }, [regelingList, searchFilter])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--navy-dark)]">Regeling Profiel</h2>
        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
          Analyseer hoe geld binnen één regeling verdeeld wordt: concentratie, top ontvangers, en verdeling.
        </p>
      </div>

      {/* Regeling picker */}
      {!selectedRegeling ? (
        <div className="space-y-3">
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Zoek regeling..."
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--navy-medium)]"
          />
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredList.map(r => (
                <button
                  key={r.name}
                  onClick={() => { setSelectedRegeling(r.name); setSelectedRecipient(null) }}
                  className="w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-[var(--navy-dark)] font-medium block truncate">{r.name}</span>
                  <span className="text-xs text-[var(--navy-medium)]">
                    {r.count} ontvangers · {formatEuro(r.total)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {regelingList.length > 30 && !searchFilter && (
            <p className="text-xs text-[var(--navy-medium)]">Top 30 van {regelingList.length} regelingen — gebruik zoek om te filteren</p>
          )}
        </div>
      ) : (
        <>
          {/* Back + Year selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedRegeling(''); setProfileData(null); setSelectedRecipient(null) }}
              className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] flex items-center gap-1"
            >
              ← Terug naar lijst
            </button>
            <div className="flex gap-1 border-l border-[var(--border)] pl-3">
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
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-[var(--navy-medium)]">Laden...</p>
            </div>
          ) : profileData ? (
            <>
              {/* Title */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[var(--navy-dark)]">{profileData.regeling}</h3>
                <p className="text-xs text-[var(--navy-medium)] mt-0.5">
                  Ministerie(s): {profileData.profile.ministries.join(', ') || '—'}
                </p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--navy-medium)]">Totaalbedrag</p>
                  <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{formatEuro(profileData.profile.total_amount)}</p>
                </div>
                <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--navy-medium)]">Ontvangers</p>
                  <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{profileData.profile.recipient_count}</p>
                </div>
                <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--navy-medium)]">Gemiddeld</p>
                  <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{formatEuro(profileData.profile.average)}</p>
                </div>
                <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--navy-medium)]">Gini</p>
                  <p className="text-lg font-bold text-[var(--pink)] tabular-nums">
                    {profileData.profile.gini !== null ? profileData.profile.gini.toFixed(3) : '—'}
                  </p>
                  <p className="text-xs text-[var(--navy-medium)]">{profileData.profile.gini !== null ? (profileData.profile.gini > 0.7 ? 'Hoge concentratie' : profileData.profile.gini > 0.4 ? 'Matige concentratie' : 'Lage concentratie') : '<10 ontvangers'}</p>
                </div>
                <div className="bg-white border border-[var(--border)] rounded-lg p-3 text-center">
                  <p className="text-xs text-[var(--navy-medium)]">Top 5 aandeel</p>
                  <p className="text-lg font-bold text-[var(--navy-dark)] tabular-nums">{profileData.profile.top_5_share}%</p>
                </div>
              </div>

              {/* Distribution histogram */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">Verdeling ontvangers</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profileData.histogram} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} />
                      <YAxis tick={{ fontSize: 10, fill: NAVY_MEDIUM }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {profileData.histogram.map((_, idx) => (
                          <Cell key={idx} fill={HISTOGRAM_COLORS[idx % HISTOGRAM_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top recipients */}
              <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">
                  Top ontvangers ({profileData.total_recipients} totaal, top {profileData.recipients.length} getoond)
                </h3>
                <div className="space-y-1">
                  {profileData.recipients.map((r, idx) => (
                    <button
                      key={r.name}
                      onClick={() => setSelectedRecipient(r)}
                      className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 transition-colors ${
                        selectedRecipient?.name === r.name ? 'bg-pink-50 border border-pink-200' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[var(--navy-medium)] tabular-nums w-6 text-right">{idx + 1}.</span>
                        <span className="text-xs text-[var(--navy-dark)] truncate">{r.name}</span>
                      </span>
                      <span className="text-xs tabular-nums text-[var(--navy-medium)] whitespace-nowrap ml-2">{formatEuro(r.amount)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient sparkline detail */}
              {selectedRecipient && (
                <div className="bg-white border border-[var(--border)] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--navy-dark)]">{selectedRecipient.name}</h3>
                      <p className="text-xs text-[var(--navy-medium)]">
                        {year === 'totaal' ? 'Cumulatief' : year}: {formatEuroFull(selectedRecipient.amount)} · Totaal: {formatEuroFull(selectedRecipient.total)}
                      </p>
                    </div>
                    <button onClick={() => setSelectedRecipient(null)} className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">Sluiten</button>
                  </div>
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedRecipient.sparkline} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: NAVY_MEDIUM }} />
                        <YAxis tick={{ fontSize: 10, fill: NAVY_MEDIUM }} tickFormatter={(v: number) => formatEuro(v)} width={60} />
                        <Line type="monotone" dataKey="value" stroke={PINK} strokeWidth={2} dot={{ r: 3, fill: PINK }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Provenance */}
              <p className="text-xs text-[var(--navy-medium)]">
                Laatst bijgewerkt: {profileData.data_notes.last_updated} · {profileData.data_notes.note}
              </p>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--navy-medium)]">Geen data gevonden voor deze regeling</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
