'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'

interface Member {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  organization: string | null
  plan: 'monthly' | 'yearly' | 'trial'
  role: 'member' | 'trial' | 'admin'
  start_date: string
  end_date: string
  grace_ends_at: string
  cancelled_at: string | null
  invited_at: string | null
  activated_at: string | null
  last_active_at: string | null
  notes: string | null
  created_at: string
}

type MemberStatus = 'aangemaakt' | 'uitgenodigd' | 'active' | 'grace' | 'expired'

function computeStatus(member: Member): MemberStatus {
  // If never invited → Aangemaakt
  if (!member.invited_at) return 'aangemaakt'
  // If invited but never logged in → Uitgenodigd
  if (!member.last_active_at) return 'uitgenodigd'
  // Normal date-based status
  if (member.cancelled_at) return 'expired'
  const today = new Date().toISOString().split('T')[0]
  if (today <= member.end_date) return 'active'
  if (today <= member.grace_ends_at) return 'grace'
  return 'expired'
}

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  aangemaakt: { label: 'Aangemaakt', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  uitgenodigd: { label: 'Uitgenodigd', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  active: { label: 'Actief', className: 'bg-green-50 text-green-700 border-green-200' },
  grace: { label: 'Verlengingsperiode', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  expired: { label: 'Verlopen', className: 'bg-red-50 text-red-700 border-red-200' },
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, className } = statusConfig[status]
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}>
      {label}
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InviteButton({ member, onInvited }: { member: Member; onInvited: () => void }) {
  const [sending, setSending] = useState(false)
  const status = computeStatus(member)

  if (status !== 'aangemaakt' && status !== 'uitgenodigd') return null

  const isResend = status === 'uitgenodigd'

  async function handleInvite(e: React.MouseEvent) {
    e.stopPropagation()
    setSending(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Fout bij versturen uitnodiging')
        return
      }
      onInvited()
    } catch {
      alert('Netwerkfout')
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleInvite}
      disabled={sending}
      title={isResend ? 'Uitnodiging opnieuw versturen' : 'Uitnodiging versturen'}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      {sending ? (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" /></svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
      )}
      {isResend ? 'Opnieuw' : 'Uitnodigen'}
    </button>
  )
}

function AddMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('member')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const role = form.get('role') as string
    const body = {
      email: form.get('email'),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      organization: form.get('organization') || null,
      plan: role === 'trial' ? 'trial' : form.get('plan'),
      role,
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
          <label htmlFor="role" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Rol *</label>
          <select id="role" name="role" required value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent">
            <option value="member">Member</option>
            <option value="trial">Trial</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {selectedRole !== 'trial' && (
          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Plan *</label>
            <select id="plan" name="plan" required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent">
              <option value="yearly">Jaarlijks</option>
              <option value="monthly">Maandelijks</option>
            </select>
          </div>
        )}
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
      role: form.get('role'),
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

        {/* Activity dates */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--navy-medium)]">
          {member.activated_at && (
            <span>Eerste login: <span className="font-medium">{formatDateTime(member.activated_at)}</span></span>
          )}
          {member.last_active_at && (
            <span>Laatst actief: <span className="font-medium">{formatDateTime(member.last_active_at)}</span></span>
          )}
          {!member.activated_at && !member.last_active_at && (
            <span>Nog niet ingelogd</span>
          )}
        </div>

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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="edit_role" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Rol</label>
              <select id="edit_role" name="role" defaultValue={member.role} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
                <option value="member">Member</option>
                <option value="trial">Trial</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit_plan" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Plan</label>
              <select id="edit_plan" name="plan" defaultValue={member.plan} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]">
                <option value="yearly">Jaarlijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="trial">Trial</option>
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

  const counts = {
    active: members.filter(m => computeStatus(m) === 'active').length,
    uitgenodigd: members.filter(m => computeStatus(m) === 'uitgenodigd').length,
    aangemaakt: members.filter(m => computeStatus(m) === 'aangemaakt').length,
    grace: members.filter(m => computeStatus(m) === 'grace').length,
    expired: members.filter(m => computeStatus(m) === 'expired').length,
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-4">
        Team
      </h1>
      <TeamNav />

      {/* Inline stats + Nieuw lid button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[var(--navy-dark)]"><span className="font-semibold">{members.length}</span> totaal</span>
          <span className="text-green-700"><span className="font-semibold">{counts.active}</span> actief</span>
          {counts.uitgenodigd > 0 && (
            <span className="text-blue-700"><span className="font-semibold">{counts.uitgenodigd}</span> uitgenodigd</span>
          )}
          {counts.aangemaakt > 0 && (
            <span className="text-gray-600"><span className="font-semibold">{counts.aangemaakt}</span> aangemaakt</span>
          )}
          {counts.grace > 0 && (
            <span className="text-amber-700"><span className="font-semibold">{counts.grace}</span> verlengingsperiode</span>
          )}
          {counts.expired > 0 && (
            <span className="text-red-700"><span className="font-semibold">{counts.expired}</span> verlopen</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          {showForm ? 'Verbergen' : '+ Nieuw lid'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AddMemberForm onSuccess={() => { setShowForm(false); fetchMembers() }} />
        </div>
      )}

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
                <th className="px-4 py-3"><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--navy-medium)]">
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
                        {member.role === 'trial' && <span className="ml-1.5 text-xs text-blue-600">trial</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.organization || '—'}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.email}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.plan === 'yearly' ? 'Jaar' : member.plan === 'trial' ? 'Proef' : 'Maand'}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{formatDate(member.end_date)}</td>
                      <td className="px-4 py-3">
                        <InviteButton member={member} onInvited={fetchMembers} />
                      </td>
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
