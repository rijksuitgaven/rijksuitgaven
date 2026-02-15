'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import Link from 'next/link'
import {
  AlertTriangle, CheckCircle, Trash2, Copy, Check,
} from 'lucide-react'

// --- Constants ---

const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  publiek: 'Publiek',
  integraal: 'Integraal',
}

const FIELD_LABELS: Record<string, string> = {
  begrotingsnaam: 'Begrotingsnaam',
  artikel: 'Artikel',
  artikelonderdeel: 'Artikelonderdeel',
  instrument: 'Instrument',
  regeling: 'Regeling',
  kostensoort: 'Kostensoort',
  detail: 'Detail',
  ministerie: 'Ministerie',
  categorie: 'Categorie',
  staffel: 'Staffel',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  omschrijving: 'Omschrijving',
  beleidsterrein: 'Beleidsterrein',
  organisatie: 'Organisatie',
  trefwoorden: 'Trefwoorden',
  sectoren: 'Sectoren',
  onderdeel: 'Onderdeel',
  source: 'Bron',
}

const DATE_RANGES = [
  { label: '7 dagen', value: 7 },
  { label: '30 dagen', value: 30 },
  { label: '90 dagen', value: 90 },
  { label: 'Alles', value: 365 },
]

// --- Types ---

interface ErrorItem {
  module: string
  message: string
  properties: Record<string, unknown>
  actor_hash: string
  created_at: string
}

// --- Main Page ---

export default function FoutenPage() {
  const { role, loading: subLoading } = useSubscription()
  const [errors, setErrors] = useState<ErrorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      setLoading(true)
      fetch(`/api/v1/team/statistieken?days=${days}`)
        .then(res => res.json())
        .then(d => {
          setErrors(d.errors ?? [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, days])

  const clearOneError = useCallback((createdAt: string) => {
    fetch(`/api/v1/team/statistieken?created_at=${encodeURIComponent(createdAt)}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setErrors(prev => prev.filter(e => e.created_at !== createdAt))
        }
      })
      .catch(() => {})
  }, [])

  const clearAllErrors = useCallback(() => {
    fetch(`/api/v1/team/statistieken`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setErrors([])
        }
      })
      .catch(() => {})
  }, [])

  const copyPrompt = useCallback((err: ErrorItem, index: number) => {
    const prompt = formatErrorPrompt(err)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }, [])

  if (subLoading) return null
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <p className="text-[var(--error)]">Geen toegang</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-4">
          Team
        </h1>
        <TeamNav />

        {/* Header + date range */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--navy-dark)]">Fouten</h2>
          <div className="flex gap-1 bg-white rounded-lg border border-[var(--border)] p-1">
            {DATE_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  days === range.value
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'text-[var(--navy-medium)] hover:bg-[var(--gray-light)]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 animate-pulse">
            <div className="h-5 bg-[var(--gray-light)] rounded w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--gray-light)] rounded" />)}
            </div>
          </div>
        ) : errors.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <div className="flex items-center gap-2">
              <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span>
              <span className="text-sm text-green-700">Geen fouten geregistreerd in de afgelopen {days === 365 ? '' : `${days} `}dagen</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-red-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500"><AlertTriangle className="w-4 h-4" /></span>
                <span className="text-sm font-semibold text-red-700 uppercase tracking-wider">
                  {errors.length} {errors.length === 1 ? 'fout' : 'fouten'}
                </span>
              </div>
              {errors.length > 1 && (
                <button
                  onClick={clearAllErrors}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors border border-[var(--border)] hover:border-red-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Wis alles
                </button>
              )}
            </div>
            <div className="space-y-2">
              {errors.map((err, i) => {
                const time = new Date(err.created_at).toLocaleString('nl-NL', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })
                const contextPills: { label: string; value: string }[] = []
                if (err.properties?.trigger) {
                  const triggerLabels: Record<string, string> = {
                    page_load: 'Pagina laden',
                    sort_change: 'Sorteren',
                    filter_apply: 'Filteren',
                    search: 'Zoeken',
                    page_change: 'Pagineren',
                    row_expand: 'Rij openen',
                    detail_panel: 'Detailpaneel',
                    filter_load: 'Filter laden',
                    autocomplete: 'Autocomplete',
                    feedback_submit: 'Feedback',
                    login: 'Inloggen',
                    contact_form: 'Contactformulier',
                    '404': 'Pagina niet gevonden',
                    react_render: 'React render crash',
                  }
                  contextPills.push({ label: 'Actie', value: triggerLabels[String(err.properties.trigger)] || String(err.properties.trigger) })
                }
                if (err.properties?.search_query) contextPills.push({ label: 'Zoekterm', value: String(err.properties.search_query) })
                if (err.properties?.sort_by) {
                  const sortCol = String(err.properties.sort_by)
                  const sortLabel = sortCol.startsWith('y') && sortCol.length === 5
                    ? sortCol.slice(1)
                    : FIELD_LABELS[sortCol] || sortCol
                  contextPills.push({ label: 'Sortering', value: sortLabel })
                }
                if (err.properties?.has_filters) contextPills.push({ label: 'Filters', value: 'actief' })
                if (err.properties?.path) contextPills.push({ label: 'Pad', value: String(err.properties.path) })

                const isCopied = copiedIndex === i

                return (
                  <div key={i} className="bg-red-50/60 border border-red-100 rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-sm font-semibold text-red-700">
                        {err.message || 'Onbekende fout'}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copyPrompt(err, i)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all border ${
                            isCopied
                              ? 'text-green-700 bg-green-50 border-green-200'
                              : 'text-[var(--navy-medium)] bg-white/80 border-red-200 hover:bg-white hover:border-[var(--navy-medium)]'
                          }`}
                          title="Kopieer als prompt"
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Gekopieerd' : 'Kopieer prompt'}
                        </button>
                        <button
                          onClick={() => clearOneError(err.created_at)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-500 bg-white/80 border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Verwijder deze fout"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
                      <span className="text-xs text-[var(--muted-foreground)]">{time}</span>
                      <ModuleBadge module={err.module} />
                      {contextPills.map((cp, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 text-xs bg-white/80 border border-red-200 rounded px-2 py-0.5"
                        >
                          <span className="font-semibold text-[var(--navy-dark)]">{cp.label}</span>
                          <span className="text-[var(--navy-medium)]">{cp.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// --- Helpers ---

function ModuleBadge({ module }: { module: string }) {
  const label = MODULE_LABELS[module] || module
  return (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700">
      {label}
    </span>
  )
}

function formatErrorPrompt(err: ErrorItem): string {
  const mod = MODULE_LABELS[err.module] || err.module || 'onbekend'
  const props = err.properties || {}
  const lines: string[] = [
    `Fix this frontend error in rijksuitgaven:`,
    ``,
    `Error: "${err.message || 'Onbekende fout'}"`,
    `Module: ${mod}`,
  ]
  if (props.trigger) lines.push(`Trigger: ${props.trigger}`)
  if (props.search_query) lines.push(`Search query: "${props.search_query}"`)
  if (props.sort_by) lines.push(`Sort column: ${props.sort_by}`)
  if (props.has_filters) lines.push(`Active filters: yes`)
  if (props.path) lines.push(`Path: ${props.path}`)
  if (props.direction) lines.push(`Sort direction: ${props.direction}`)

  const knownKeys = ['trigger', 'search_query', 'sort_by', 'has_filters', 'path', 'direction', 'message']
  const extra = Object.fromEntries(Object.entries(props).filter(([k]) => !knownKeys.includes(k)))
  if (Object.keys(extra).length > 0) {
    lines.push(`Extra context: ${JSON.stringify(extra)}`)
  }

  lines.push(``, `Trace the root cause in the relevant component and fix it.`)
  return lines.join('\n')
}
