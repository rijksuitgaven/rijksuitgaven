'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'

interface Contact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  organization: string | null
  phone: string | null
  type: 'prospect' | 'churned' | 'gearchiveerd'
  source: string | null
  notes: string | null
  archived_at: string | null
  resend_contact_id: string | null
  created_at: string
  updated_at: string
}

type SortField = 'name' | 'organization' | 'email' | 'type' | 'source' | 'created_at'
type SortDirection = 'asc' | 'desc'

const typeConfig: Record<Contact['type'], { label: string; className: string }> = {
  prospect: { label: 'Prospect', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  churned: { label: 'Churned', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  gearchiveerd: { label: 'Gearchiveerd', className: 'bg-stone-50 text-stone-500 border-stone-200' },
}

function TypeBadge({ type }: { type: Contact['type'] }) {
  const { label, className } = typeConfig[type]
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}>
      {label}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SortableHeader({ label, field, sortField, sortDir, onSort }: {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = sortField === field
  return (
    <th
      onClick={() => onSort(field)}
      className="text-left px-4 py-3 font-medium text-[var(--navy-medium)] cursor-pointer hover:text-[var(--navy-dark)] select-none"
    >
      {label}
      {isActive && (
        <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  )
}

function AddContactForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      email: form.get('email'),
      first_name: form.get('first_name') || null,
      last_name: form.get('last_name') || null,
      organization: form.get('organization') || null,
      phone: form.get('phone') || null,
      source: form.get('source') || null,
      notes: form.get('notes') || null,
    }

    try {
      const res = await fetch('/api/v1/team/contacten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onbekende fout')
        return
      }
      onSuccess()
    } catch (err) {
      console.error('[AddContact] Error:', err)
      setError('Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Nieuw contact toevoegen</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">E-mailadres *</label>
          <input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Organisatie</label>
          <input id="organization" name="organization" type="text" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Voornaam</label>
          <input id="first_name" name="first_name" type="text" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Achternaam</label>
          <input id="last_name" name="last_name" type="text" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Telefoon</label>
          <input id="phone" name="phone" type="tel" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Bron</label>
          <select id="source" name="source" defaultValue="" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent">
            <option value="">—</option>
            <option value="admin">Admin</option>
            <option value="website">Website</option>
            <option value="demo_aanvraag">Demo aanvraag</option>
            <option value="event">Event</option>
            <option value="referral">Referral</option>
            <option value="import">Import</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Notities</label>
        <textarea id="notes" name="notes" rows={2} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Bezig...' : 'Contact toevoegen'}
      </button>
    </form>
  )
}

function ConvertToMemberModal({ contact, onClose, onConverted }: {
  contact: Contact
  onClose: () => void
  onConverted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly')

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      plan: form.get('plan'),
      start_date: form.get('start_date'),
      role: form.get('role') || 'member',
    }

    try {
      const res = await fetch(`/api/v1/team/contacten/${contact.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onbekende fout')
        return
      }
      onConverted()
    } catch {
      setError('Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Maak lid</h2>
          <button onClick={onClose} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]" aria-label="Sluiten">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        <p className="text-sm text-[var(--navy-medium)]">
          {getContactName(contact)} ({contact.email}) omzetten naar lid
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="convert_plan" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Plan *</label>
              <select id="convert_plan" name="plan" required value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
                <option value="yearly">Jaarlijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="trial">Trial (14 dagen)</option>
              </select>
            </div>
            <div>
              <label htmlFor="convert_role" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Rol</label>
              <select id="convert_role" name="role" defaultValue="member" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
                <option value="member">Member</option>
                <option value="trial">Trial</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="convert_start_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Startdatum *</label>
            <input id="convert_start_date" name="start_date" type="date" required defaultValue={today} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50">
              Annuleren
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Bezig...' : 'Omzetten naar lid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditContactModal({ contact, onClose, onSaved }: {
  contact: Contact
  onClose: () => void
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      first_name: form.get('first_name') || null,
      last_name: form.get('last_name') || null,
      organization: form.get('organization') || null,
      phone: form.get('phone') || null,
      source: form.get('source') || null,
      notes: form.get('notes') || null,
    }

    try {
      const res = await fetch(`/api/v1/team/contacten/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onbekende fout')
        return
      }
      onSaved()
    } catch {
      setError('Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleArchive() {
    if (!confirm('Weet u zeker dat u dit contact wilt archiveren?')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/team/contacten/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: new Date().toISOString() }),
      })
      if (res.ok) onSaved()
      else {
        const data = await res.json()
        setError(data.error || 'Fout bij archiveren')
      }
    } catch {
      setError('Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Contact bewerken</h2>
          <button onClick={onClose} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]" aria-label="Sluiten">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--navy-medium)]">{contact.email}</p>
          <TypeBadge type={contact.type} />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--navy-medium)]">
          <span>Aangemaakt: <span className="font-medium">{formatDate(contact.created_at)}</span></span>
          {contact.resend_contact_id && (
            <span className="text-green-600">✓ Resend gesynchroniseerd</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_first_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Voornaam</label>
              <input id="edit_first_name" name="first_name" defaultValue={contact.first_name ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
            <div>
              <label htmlFor="edit_last_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Achternaam</label>
              <input id="edit_last_name" name="last_name" defaultValue={contact.last_name ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_organization" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Organisatie</label>
              <input id="edit_organization" name="organization" defaultValue={contact.organization ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
            <div>
              <label htmlFor="edit_phone" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Telefoon</label>
              <input id="edit_phone" name="phone" type="tel" defaultValue={contact.phone ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
          </div>
          <div>
            <label htmlFor="edit_source" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Bron</label>
            <select id="edit_source" name="source" defaultValue={contact.source ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
              <option value="">—</option>
              <option value="website">Website</option>
              <option value="demo_aanvraag">Demo aanvraag</option>
              <option value="event">Event</option>
              <option value="referral">Referral</option>
              <option value="import">Import</option>
              <option value="admin">Admin</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit_notes" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Notities</label>
            <textarea id="edit_notes" name="notes" rows={2} defaultValue={contact.notes ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {contact.type === 'prospect' ? (
              <button type="button" onClick={handleArchive} disabled={submitting} className="text-sm text-stone-500 hover:text-stone-700">
                Archiveren
              </button>
            ) : contact.type === 'gearchiveerd' ? (
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    const res = await fetch(`/api/v1/team/contacten/${contact.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ archived_at: null }),
                    })
                    if (res.ok) onSaved()
                    else { const d = await res.json(); setError(d.error || 'Fout') }
                  } catch { setError('Netwerkfout') }
                  finally { setSubmitting(false) }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Dearchiveren
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50">
                Annuleren
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {submitting ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function getContactName(c: Contact): string {
  const parts = [c.first_name, c.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '—'
}

export default function TeamContactenPage() {
  const { role, loading: subLoading } = useSubscription()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/team/contacten')
      const data = await res.json()
      if (res.ok) {
        setContacts(data.contacts)
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
      fetchContacts()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchContacts])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedContacts = [...contacts].sort((a, b) => {
    let aVal: string
    let bVal: string

    switch (sortField) {
      case 'name':
        aVal = getContactName(a).toLowerCase()
        bVal = getContactName(b).toLowerCase()
        break
      case 'organization':
        aVal = (a.organization || '').toLowerCase()
        bVal = (b.organization || '').toLowerCase()
        break
      case 'email':
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
        break
      case 'type':
        aVal = a.type
        bVal = b.type
        break
      case 'source':
        aVal = (a.source || '').toLowerCase()
        bVal = (b.source || '').toLowerCase()
        break
      case 'created_at':
        aVal = a.created_at
        bVal = b.created_at
        break
      default:
        return 0
    }

    const cmp = aVal.localeCompare(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

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

  const counts = {
    prospect: contacts.filter(c => c.type === 'prospect').length,
    churned: contacts.filter(c => c.type === 'churned').length,
    gearchiveerd: contacts.filter(c => c.type === 'gearchiveerd').length,
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-4">
        Team
      </h1>
      <TeamNav />

      {/* Inline stats + Nieuw contact button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[var(--navy-dark)]"><span className="font-semibold">{contacts.length}</span> totaal</span>
          <span className="text-blue-700"><span className="font-semibold">{counts.prospect}</span> prospects</span>
          {counts.churned > 0 && (
            <span className="text-gray-600"><span className="font-semibold">{counts.churned}</span> churned</span>
          )}
          {counts.gearchiveerd > 0 && (
            <span className="text-stone-500"><span className="font-semibold">{counts.gearchiveerd}</span> gearchiveerd</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          {showForm ? 'Verbergen' : '+ Nieuw contact'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AddContactForm onSuccess={() => { setShowForm(false); fetchContacts() }} />
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Contacts table */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <SortableHeader label="Naam" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Organisatie" field="organization" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="E-mail" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Type" field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Bron" field="source" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Aangemaakt" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {sortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--navy-medium)]">
                    Nog geen contacten. Voeg het eerste contact toe.
                  </td>
                </tr>
              ) : (
                sortedContacts.map(contact => (
                  <tr
                    key={contact.id}
                    onClick={() => setEditingContact(contact)}
                    className="border-b border-[var(--border)] hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--navy-dark)] font-medium">
                      {getContactName(contact)}
                      {contact.resend_contact_id && (
                        <span className="ml-1.5 text-xs text-green-600" title="Resend gesynchroniseerd">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--navy-medium)]">{contact.organization || '—'}</td>
                    <td className="px-4 py-3 text-[var(--navy-medium)]">{contact.email}</td>
                    <td className="px-4 py-3"><TypeBadge type={contact.type} /></td>
                    <td className="px-4 py-3 text-[var(--navy-medium)]">{contact.source || '—'}</td>
                    <td className="px-4 py-3 text-[var(--navy-medium)]">{formatDate(contact.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setConvertingContact(contact)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="Omzetten naar lid"
                        >
                          Maak lid
                        </button>
                        {contact.type === 'prospect' && (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation()
                              if (!confirm('Weet u zeker dat u dit contact wilt archiveren?')) return
                              fetch(`/api/v1/team/contacten/${contact.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ archived_at: new Date().toISOString() }),
                              }).then(res => { if (res.ok) fetchContacts() })
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-stone-600 hover:bg-stone-50 rounded transition-colors"
                            title="Archiveren"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" /><path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() => { setEditingContact(null); fetchContacts() }}
        />
      )}

      {convertingContact && (
        <ConvertToMemberModal
          contact={convertingContact}
          onClose={() => setConvertingContact(null)}
          onConverted={() => { setConvertingContact(null); fetchContacts() }}
        />
      )}
    </main>
  )
}
