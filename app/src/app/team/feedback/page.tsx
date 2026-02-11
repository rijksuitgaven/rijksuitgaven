'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'

// --- Types ---

interface FeedbackItem {
  id: string
  user_id: string
  user_email: string
  category: 'suggestie' | 'bug' | 'vraag'
  message: string
  page_url: string | null
  user_agent: string | null
  element_selector: string | null
  element_tag: string | null
  element_text: string | null
  screenshot_path: string | null
  screenshot_url: string | null
  status: FeedbackStatus
  priority: FeedbackPriority
  admin_notes: string | null
  requirement_ref: string | null
  created_at: string
  updated_at: string
}

type FeedbackStatus = 'nieuw' | 'in_behandeling' | 'requirement' | 'afgewezen' | 'afgerond'
type FeedbackPriority = 'laag' | 'normaal' | 'hoog' | 'kritiek'
type FeedbackCategory = 'suggestie' | 'bug' | 'vraag'

// --- Constants ---

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; style: string; selectStyle: string }> = {
  nieuw: {
    label: 'Nieuw',
    style: 'bg-blue-50 text-blue-700 border-blue-200',
    selectStyle: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  in_behandeling: {
    label: 'In behandeling',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
    selectStyle: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  requirement: {
    label: 'Requirement',
    style: 'bg-purple-50 text-purple-700 border-purple-200',
    selectStyle: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  afgewezen: {
    label: 'Afgewezen',
    style: 'bg-gray-50 text-gray-500 border-gray-200',
    selectStyle: 'bg-gray-50 text-gray-500 border-gray-200',
  },
  afgerond: {
    label: 'Afgerond',
    style: 'bg-green-50 text-green-700 border-green-200',
    selectStyle: 'bg-green-50 text-green-700 border-green-200',
  },
}

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; style: string; dot: string }> = {
  bug: {
    label: 'Bug',
    style: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  vraag: {
    label: 'Vraag',
    style: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  suggestie: {
    label: 'Suggestie',
    style: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
}

const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; style: string }> = {
  kritiek: { label: 'Kritiek', style: 'text-red-700 font-semibold' },
  hoog: { label: 'Hoog', style: 'text-amber-700' },
  normaal: { label: 'Normaal', style: 'text-[var(--navy-medium)]' },
  laag: { label: 'Laag', style: 'text-gray-400' },
}

// --- Helpers ---

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'vandaag'
  if (diffDays === 1) return 'gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`

  const dutchMonths = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${date.getDate()} ${dutchMonths[date.getMonth()]}`
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  const dutchMonths = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${date.getDate()} ${dutchMonths[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatPageName(url: string | null): string {
  if (!url) return '—'
  try {
    const pathname = new URL(url).pathname
    const segment = pathname.split('/').filter(Boolean)[0] || 'Home'
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  } catch {
    return url
  }
}

function parseBrowser(ua: string | null): string {
  if (!ua) return 'onbekend'
  let browser = 'onbekend'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
  let os = ''
  if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'
  return os ? `${browser}, ${os}` : browser
}

function sortFeedback(items: FeedbackItem[]): FeedbackItem[] {
  const statusOrder: Record<string, number> = { nieuw: 0, in_behandeling: 1, requirement: 2, afgewezen: 3, afgerond: 4 }
  const categoryOrder: Record<string, number> = { bug: 0, vraag: 1, suggestie: 2 }

  return [...items].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
    if (statusDiff !== 0) return statusDiff
    const catDiff = (categoryOrder[a.category] ?? 3) - (categoryOrder[b.category] ?? 3)
    if (catDiff !== 0) return catDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

// --- Sub-components ---

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${config.style}`}>
      {config.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: FeedbackCategory }) {
  const config = CATEGORY_CONFIG[category]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${config.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function InlineStatusSelect({
  value,
  onChange,
}: {
  value: FeedbackStatus
  onChange: (v: FeedbackStatus) => void
}) {
  const config = STATUS_CONFIG[value]
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FeedbackStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-medium rounded-md border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--pink)] ${config.selectStyle}`}
    >
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
        <option key={key} value={key}>{cfg.label}</option>
      ))}
    </select>
  )
}

function InlinePrioritySelect({
  value,
  onChange,
}: {
  value: FeedbackPriority
  onChange: (v: FeedbackPriority) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FeedbackPriority)}
      onClick={(e) => e.stopPropagation()}
      className="text-xs font-medium rounded-md border border-[var(--border)] px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--pink)] bg-white"
    >
      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
        <option key={key} value={key}>{cfg.label}</option>
      ))}
    </select>
  )
}

// --- Detail Modal ---

function FeedbackDetailModal({
  item,
  onClose,
  onSaved,
}: {
  item: FeedbackItem
  onClose: () => void
  onSaved: (updated: FeedbackItem) => void
}) {
  const [status, setStatus] = useState(item.status)
  const [priority, setPriority] = useState(item.priority)
  const [requirementRef, setRequirementRef] = useState(item.requirement_ref || '')
  const [adminNotes, setAdminNotes] = useState(item.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/team/feedback/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          requirement_ref: requirementRef || null,
          admin_notes: adminNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onbekende fout')
        return
      }
      onSaved({ ...item, ...data.item })
    } catch {
      setError('Netwerkfout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Feedback</h2>
          <button onClick={onClose} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]" aria-label="Sluiten">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Meta info */}
          <div className="text-sm text-[var(--navy-medium)]">
            <p className="font-medium text-[var(--navy-dark)]">{item.user_email}</p>
            <p>{formatFullDate(item.created_at)} &middot; {parseBrowser(item.user_agent)}</p>
            {item.page_url && (
              <p>Pagina: <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="text-[var(--pink)] hover:underline">{formatPageName(item.page_url)}</a></p>
            )}
          </div>

          {/* Category + message */}
          <div>
            <div className="mb-2"><CategoryBadge category={item.category} /></div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--navy-dark)]">
              {item.message}
            </div>
          </div>

          {/* Screenshot */}
          {item.screenshot_url && (
            <div>
              <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={item.screenshot_url}
                  alt="Screenshot"
                  className="max-w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: 300 }}
                />
              </a>
              {item.element_tag && (
                <p className="mt-1 text-xs text-gray-400">
                  Element: {item.element_tag}
                  {item.element_selector && ` (${item.element_selector})`}
                </p>
              )}
            </div>
          )}

          {/* Admin controls */}
          <div className="border-t border-[var(--border)] pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--navy-medium)] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                  className={`w-full text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] ${STATUS_CONFIG[status].selectStyle}`}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--navy-medium)] mb-1">Prioriteit</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                  className="w-full text-sm rounded-md border border-[var(--border)] px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--navy-medium)] mb-1">Requirement</label>
              <input
                type="text"
                value={requirementRef}
                onChange={(e) => setRequirementRef(e.target.value)}
                placeholder="UX-027"
                className="w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--navy-medium)] mb-1">Notities</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function TeamFeedbackPage() {
  const { role, loading: subLoading } = useSubscription()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/team/feedback')
      const data = await res.json()
      if (res.ok) {
        setItems(data.items)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Netwerkfout')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetchItems()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchItems])

  // Inline status change (optimistic)
  const handleInlineStatusChange = useCallback(async (id: string, newStatus: FeedbackStatus) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))

    const res = await fetch(`/api/v1/team/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      fetchItems() // Revert on failure
    }
  }, [fetchItems])

  // Inline priority change (optimistic)
  const handleInlinePriorityChange = useCallback(async (id: string, newPriority: FeedbackPriority) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, priority: newPriority } : i))

    const res = await fetch(`/api/v1/team/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: newPriority }),
    })

    if (!res.ok) {
      fetchItems()
    }
  }, [fetchItems])

  // Modal save handler
  const handleModalSaved = useCallback((updated: FeedbackItem) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSelectedItem(null)
  }, [])

  if (subLoading || loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--navy-medium)]">Laden...</p>
      </main>
    )
  }

  if (role !== 'admin') {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--navy-dark)]">Geen toegang</h1>
          <p className="text-[var(--navy-medium)]">Deze pagina is alleen beschikbaar voor beheerders.</p>
          <Link href="/" className="text-[var(--pink)] hover:underline">Terug naar home</Link>
        </div>
      </main>
    )
  }

  // Filter items
  let filtered = items
  if (filterStatus === 'open') {
    filtered = filtered.filter(i => i.status === 'in_behandeling' || i.status === 'requirement')
  } else if (filterStatus === 'done') {
    filtered = filtered.filter(i => i.status === 'afgewezen' || i.status === 'afgerond')
  } else if (filterStatus !== 'all') {
    filtered = filtered.filter(i => i.status === filterStatus)
  }
  if (filterCategory !== 'all') filtered = filtered.filter(i => i.category === filterCategory)
  if (filterPriority !== 'all') filtered = filtered.filter(i => i.priority === filterPriority)

  // Sort
  const sorted = sortFeedback(filtered)

  // Stats
  const nieuwCount = items.filter(i => i.status === 'nieuw').length
  const openCount = items.filter(i => i.status === 'in_behandeling' || i.status === 'requirement').length
  const doneCount = items.filter(i => i.status === 'afgewezen' || i.status === 'afgerond').length

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
        Team
      </h1>
      <TeamNav />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilterStatus(filterStatus === 'nieuw' ? 'all' : 'nieuw')}
          className={`text-left rounded-lg px-4 py-3 border transition-colors ${
            filterStatus === 'nieuw' ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' : 'bg-blue-50 border-blue-200 hover:border-blue-300'
          }`}
        >
          <p className="text-2xl font-bold text-blue-700">{nieuwCount}</p>
          <p className="text-sm text-blue-600">Nieuw</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}
          className={`text-left rounded-lg px-4 py-3 border transition-colors ${
            filterStatus === 'open' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' : 'bg-amber-50 border-amber-200 hover:border-amber-300'
          }`}
        >
          <p className="text-2xl font-bold text-amber-700">{openCount}</p>
          <p className="text-sm text-amber-600">Open</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'done' ? 'all' : 'done')}
          className={`text-left rounded-lg px-4 py-3 border transition-colors ${
            filterStatus === 'done' ? 'bg-green-100 border-green-400 ring-2 ring-green-300' : 'bg-green-50 border-green-200 hover:border-green-300'
          }`}
        >
          <p className="text-2xl font-bold text-green-700">{doneCount}</p>
          <p className="text-sm text-green-600">Afgerond</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
        >
          <option value="all">Alle statussen</option>
          <option value="nieuw">Nieuw</option>
          <option value="in_behandeling">In behandeling</option>
          <option value="requirement">Requirement</option>
          <option value="afgewezen">Afgewezen</option>
          <option value="afgerond">Afgerond</option>
          <option value="open">Open (behandeling + req.)</option>
          <option value="done">Gesloten (afg. + klaar)</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
        >
          <option value="all">Alle categorieën</option>
          <option value="bug">Bug</option>
          <option value="suggestie">Suggestie</option>
          <option value="vraag">Vraag</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
        >
          <option value="all">Alle prioriteiten</option>
          <option value="kritiek">Kritiek</option>
          <option value="hoog">Hoog</option>
          <option value="normaal">Normaal</option>
          <option value="laag">Laag</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Feedback list */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-lg px-6 py-12 text-center">
            <p className="text-[var(--navy-medium)]">
              {items.length === 0 ? 'Nog geen feedback ontvangen.' : 'Geen feedback gevonden met deze filters.'}
            </p>
          </div>
        ) : (
          sorted.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`bg-white border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:border-[var(--navy-medium)] ${
                item.status === 'afgewezen' || item.status === 'afgerond' ? 'border-gray-200 opacity-60' : 'border-[var(--border)]'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Left: category + message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={item.category} />
                    {item.requirement_ref && (
                      <span className="text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                        {item.requirement_ref}
                      </span>
                    )}
                    {item.screenshot_path && (
                      <span className="text-xs text-gray-400" title="Heeft schermafbeelding">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline"><path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--navy-dark)] truncate">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.user_email} &middot; {formatPageName(item.page_url)}
                  </p>
                </div>

                {/* Right: controls + date */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <InlineStatusSelect
                    value={item.status}
                    onChange={(v) => handleInlineStatusChange(item.id, v)}
                  />
                  <InlinePrioritySelect
                    value={item.priority}
                    onChange={(v) => handleInlinePriorityChange(item.id, v)}
                  />
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {formatRelativeDate(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedItem && (
        <FeedbackDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSaved={handleModalSaved}
        />
      )}
    </main>
  )
}
