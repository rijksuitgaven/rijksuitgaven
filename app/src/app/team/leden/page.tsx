'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'

interface Member {
  id: string
  email: string
  first_name: string
  last_name: string
  organization: string | null
  plan: 'monthly' | 'yearly'
  role: 'member' | 'admin'
  start_date: string
  end_date: string
  grace_ends_at: string
  cancelled_at: string | null
  notes: string | null
  created_at: string
}

type SubscriptionStatus = 'active' | 'grace' | 'expired'

function computeStatus(member: Member): SubscriptionStatus {
  if (member.cancelled_at) return 'expired'
  const today = new Date().toISOString().split('T')[0]
  if (today <= member.end_date) return 'active'
  if (today <= member.grace_ends_at) return 'grace'
  return 'expired'
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const styles = {
    active: 'bg-green-50 text-green-700 border-green-200',
    grace: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
  }
  const labels = { active: 'Actief', grace: 'Verlengingsperiode', expired: 'Verlopen' }
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function AddMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      email: form.get('email'),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      organization: form.get('organization') || null,
      plan: form.get('plan'),
      start_date: form.get('start_date'),
    }

    try {
      const res = await fetch('/api/v1/team/leden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onbekende fout')
        return
      }
      e.currentTarget.reset()
      onSuccess()
    } catch {
      setError('Netwerkfout')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Nieuw lid toevoegen</h2>

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
          <label htmlFor="first_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Voornaam *</label>
          <input id="first_name" name="first_name" type="text" required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Achternaam *</label>
          <input id="last_name" name="last_name" type="text" required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Plan *</label>
          <select id="plan" name="plan" required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent">
            <option value="yearly">Jaarlijks</option>
            <option value="monthly">Maandelijks</option>
          </select>
        </div>
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Startdatum *</label>
          <input id="start_date" name="start_date" type="date" required defaultValue={today} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Bezig...' : 'Lid toevoegen'}
      </button>
    </form>
  )
}

function EditMemberModal({ member, onClose, onSaved }: { member: Member; onClose: () => void; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const plan = form.get('plan') as string

    // Recalculate grace_ends_at based on plan
    const endDate = form.get('end_date') as string
    const graceDays = plan === 'monthly' ? 3 : 14
    const graceDate = new Date(endDate + 'T00:00:00Z')
    graceDate.setUTCDate(graceDate.getUTCDate() + graceDays)

    const body = {
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      organization: form.get('organization') || null,
      plan,
      end_date: endDate,
      grace_ends_at: graceDate.toISOString().split('T')[0],
      notes: form.get('notes') || null,
    }

    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}`, {
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

  async function handleCancel() {
    if (!confirm('Weet u zeker dat u dit abonnement wilt deactiveren?')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_at: new Date().toISOString() }),
      })
      if (res.ok) onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReactivate() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_at: null }),
      })
      if (res.ok) onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)]">Lid bewerken</h2>
          <button onClick={onClose} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]" aria-label="Sluiten">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        <p className="text-sm text-[var(--navy-medium)]">{member.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_first_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Voornaam</label>
              <input id="edit_first_name" name="first_name" defaultValue={member.first_name} required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
            <div>
              <label htmlFor="edit_last_name" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Achternaam</label>
              <input id="edit_last_name" name="last_name" defaultValue={member.last_name} required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
          </div>
          <div>
            <label htmlFor="edit_organization" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Organisatie</label>
            <input id="edit_organization" name="organization" defaultValue={member.organization ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_plan" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Plan</label>
              <select id="edit_plan" name="plan" defaultValue={member.plan} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
                <option value="yearly">Jaarlijks</option>
                <option value="monthly">Maandelijks</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit_end_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Einddatum</label>
              <input id="edit_end_date" name="end_date" type="date" defaultValue={member.end_date} required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
            </div>
          </div>
          <div>
            <label htmlFor="edit_notes" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Notities</label>
            <textarea id="edit_notes" name="notes" rows={2} defaultValue={member.notes ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <div>
              {member.cancelled_at ? (
                <button type="button" onClick={handleReactivate} disabled={submitting} className="text-sm text-green-600 hover:text-green-800">
                  Heractiveren
                </button>
              ) : (
                <button type="button" onClick={handleCancel} disabled={submitting} className="text-sm text-red-600 hover:text-red-800">
                  Deactiveren
                </button>
              )}
            </div>
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

export default function TeamLedenPage() {
  const { role, loading: subLoading } = useSubscription()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/team/leden')
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members)
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
      fetchMembers()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchMembers])

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

  const activeCount = members.filter(m => computeStatus(m) === 'active').length
  const graceCount = members.filter(m => computeStatus(m) === 'grace').length
  const expiredCount = members.filter(m => computeStatus(m) === 'expired').length

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/team" className="text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">&larr; Dashboard</Link>
          </div>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), serif' }}>
            Leden
          </h1>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Verbergen' : 'Nieuw lid'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AddMemberForm onSuccess={() => { setShowForm(false); fetchMembers() }} />
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-green-700">{activeCount}</p>
          <p className="text-sm text-green-600">Actief</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-amber-700">{graceCount}</p>
          <p className="text-sm text-amber-600">Verlengingsperiode</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
          <p className="text-sm text-red-600">Verlopen</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Members table */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">Naam</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">Organisatie</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--navy-medium)]">Einddatum</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--navy-medium)]">
                    Nog geen leden. Voeg het eerste lid toe.
                  </td>
                </tr>
              ) : (
                members.map(member => {
                  const status = computeStatus(member)
                  return (
                    <tr
                      key={member.id}
                      onClick={() => setEditingMember(member)}
                      className="border-b border-[var(--border)] hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--navy-dark)] font-medium">
                        {member.first_name} {member.last_name}
                        {member.role === 'admin' && <span className="ml-1.5 text-xs text-[var(--pink)]">admin</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.organization || '—'}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.email}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.plan === 'yearly' ? 'Jaar' : 'Maand'}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{formatDate(member.end_date)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => { setEditingMember(null); fetchMembers() }}
        />
      )}
    </main>
  )
}
