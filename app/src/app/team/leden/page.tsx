'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'
import { ChevronUp, ChevronDown, ChevronsUpDown, Zap, Clock, Snowflake, User } from 'lucide-react'

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
  // Admins never expire
  if (member.role === 'admin') return 'active'
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

interface EngagementInfo {
  level: string
  last_engagement_at: string | null
  campaigns_sent: number
  campaigns_opened: number
  campaigns_clicked: number
}

const ENGAGEMENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  active: { label: 'Actief', color: 'bg-green-100 text-green-800 border-green-200', icon: Zap },
  at_risk: { label: 'Risico', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  cold: { label: 'Koud', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Snowflake },
  new: { label: 'Nieuw', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: User },
}

function EngagementBadge({ level }: { level: string }) {
  const config = ENGAGEMENT_CONFIG[level] || ENGAGEMENT_CONFIG.new
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMin < 5) return 'Nu'
  if (diffMin < 60) return `${diffMin} min geleden`
  if (diffHr < 24) return `${diffHr} uur geleden`
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
  return formatDate(dateStr.split('T')[0])
}

function MemberActions({ member, isSelf, onChanged }: { member: Member; isSelf: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const status = computeStatus(member)

  if (isSelf) return null

  async function handleInvite(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Fout bij versturen uitnodiging')
        return
      }
      onChanged()
    } catch {
      alert('Netwerkfout')
    } finally {
      setBusy(false)
    }
  }

  async function handleActivate(e: React.MouseEvent) {
    e.stopPropagation()
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled_at: null }),
      })
      if (res.ok) onChanged()
      else alert('Fout bij activeren')
    } catch {
      alert('Netwerkfout')
    } finally {
      setBusy(false)
    }
  }

  async function handleChurn(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Weet u zeker dat u het lidmaatschap van ${member.first_name} ${member.last_name} wilt opzeggen? Deze persoon wordt verplaatst naar Contacten. U kunt het lidmaatschap later opnieuw activeren.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/team/leden/${member.id}`, { method: 'DELETE' })
      if (res.ok) onChanged()
      else {
        const data = await res.json()
        alert(data.error || 'Fout bij opzeggen')
      }
    } catch {
      alert('Netwerkfout')
    } finally {
      setBusy(false)
    }
  }

  const btnBase = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border transition-colors disabled:opacity-50'
  const btnInvite = `${btnBase} border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100`
  const btnActivate = `${btnBase} border-green-200 text-green-700 bg-green-50 hover:bg-green-100`
  const btnChurn = `${btnBase} border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100`

  const spinner = (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" /></svg>
  )
  const mailIcon = (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
  )

  return (
    <div className="flex items-center gap-1.5">
      {/* Invite / Resend */}
      {(status === 'aangemaakt' || status === 'uitgenodigd') && (
        <button onClick={handleInvite} disabled={busy} title={status === 'uitgenodigd' ? 'Uitnodiging opnieuw versturen' : 'Uitnodiging versturen'} className={btnInvite}>
          {busy ? spinner : mailIcon}
          {status === 'uitgenodigd' ? 'Opnieuw' : 'Uitnodigen'}
        </button>
      )}

      {/* Activate (for expired) */}
      {status === 'expired' && (
        <button onClick={handleActivate} disabled={busy} title="Abonnement heractiveren" className={btnActivate}>
          Activeren
        </button>
      )}

      {/* Churn (for all non-admin members) */}
      {member.role !== 'admin' && (
        <button onClick={handleChurn} disabled={busy} title="Lidmaatschap opzeggen en verplaatsen naar Contacten" className={btnChurn}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z" /></svg>
          Opzeggen
        </button>
      )}
    </div>
  )
}

function AddMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('member')
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly')

  function computeDefaultEndDate(startDate: string, plan: string): string {
    const d = new Date(startDate + 'T00:00:00Z')
    if (plan === 'trial') d.setUTCDate(d.getUTCDate() + 14)
    else if (plan === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1)
    else d.setUTCFullYear(d.getUTCFullYear() + 1)
    return d.toISOString().split('T')[0]
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const role = form.get('role') as string
    const plan = role === 'trial' ? 'trial' : (form.get('plan') as string)
    const body: Record<string, unknown> = {
      email: form.get('email'),
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      organization: form.get('organization') || null,
      plan,
      role,
      start_date: form.get('start_date'),
    }
    const endDate = form.get('end_date') as string
    if (endDate) body.end_date = endDate

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
      onSuccess()
    } catch (err) {
      console.error('[AddMember] Error:', err)
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
            <select id="plan" name="plan" required value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent">
              <option value="yearly">Jaarlijks</option>
              <option value="monthly">Maandelijks</option>
            </select>
          </div>
        )}
        {selectedRole !== 'admin' && (
          <>
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Startdatum *</label>
              <input id="start_date" name="start_date" type="date" required defaultValue={today} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Einddatum</label>
              <input id="end_date" name="end_date" type="date" defaultValue={computeDefaultEndDate(today, selectedRole === 'trial' ? 'trial' : selectedPlan)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
            </div>
          </>
        )}
        {selectedRole === 'admin' && (
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Startdatum *</label>
            <input id="start_date" name="start_date" type="date" required defaultValue={today} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent" />
          </div>
        )}
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
          <div className={`grid ${member.role === 'admin' ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
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
            {member.role !== 'admin' && (
              <div>
                <label htmlFor="edit_end_date" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Einddatum</label>
                <input id="edit_end_date" name="end_date" type="date" defaultValue={member.end_date} required className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="edit_notes" className="block text-sm font-medium text-[var(--navy-medium)] mb-1">Notities</label>
            <textarea id="edit_notes" name="notes" rows={2} defaultValue={member.notes ?? ''} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pink)]" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end pt-2">
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [engagement, setEngagement] = useState<Record<string, EngagementInfo>>({})
  type SortField = 'name' | 'organization' | 'email' | 'plan' | 'status' | 'last_active_at' | 'end_date' | 'engagement'
  const [sortBy, setSortBy] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id)
    })
  }, [])

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

  const fetchEngagement = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/team/leden/engagement')
      const data = await res.json()
      if (res.ok) setEngagement(data.engagement || {})
    } catch {
      // Non-fatal
    }
  }, [])

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetchMembers()
      fetchEngagement()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchMembers, fetchEngagement])

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

  function toggleSort(col: SortField) {
    if (sortBy === col) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ChevronsUpDown className="h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const sortedMembers = [...members].sort((a, b) => {
    if (!sortBy) return 0
    let aVal: string
    let bVal: string
    switch (sortBy) {
      case 'name':
        aVal = `${a.first_name} ${a.last_name}`.toLowerCase()
        bVal = `${b.first_name} ${b.last_name}`.toLowerCase()
        break
      case 'organization':
        aVal = (a.organization || '').toLowerCase()
        bVal = (b.organization || '').toLowerCase()
        break
      case 'email':
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
        break
      case 'plan':
        aVal = a.plan
        bVal = b.plan
        break
      case 'status':
        aVal = computeStatus(a)
        bVal = computeStatus(b)
        break
      case 'last_active_at':
        aVal = a.last_active_at ?? ''
        bVal = b.last_active_at ?? ''
        break
      case 'end_date':
        aVal = a.end_date
        bVal = b.end_date
        break
      case 'engagement': {
        // Sort order: active > at_risk > new > cold
        const order: Record<string, number> = { active: 0, at_risk: 1, new: 2, cold: 3 }
        const aEng = engagement[a.id]?.level || 'new'
        const bEng = engagement[b.id]?.level || 'new'
        const cmpVal = (order[aEng] ?? 4) - (order[bEng] ?? 4)
        return sortDir === 'asc' ? cmpVal : -cmpVal
      }
      default:
        return 0
    }
    const cmp = aVal.localeCompare(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const counts = {
    active: members.filter(m => computeStatus(m) === 'active').length,
    uitgenodigd: members.filter(m => computeStatus(m) === 'uitgenodigd').length,
    aangemaakt: members.filter(m => computeStatus(m) === 'aangemaakt').length,
    grace: members.filter(m => computeStatus(m) === 'grace').length,
    expired: members.filter(m => computeStatus(m) === 'expired').length,
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
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
                {([['name', 'Naam'], ['organization', 'Organisatie'], ['email', 'E-mail'], ['plan', 'Plan'], ['status', 'Status'], ['engagement', 'Engagement'], ['last_active_at', 'Laatst actief'], ['end_date', 'Einddatum']] as [SortField, string][]).map(([field, label]) => (
                  <th key={field} onClick={() => toggleSort(field)} className="text-left px-4 py-3 font-medium text-[var(--navy-medium)] cursor-pointer select-none hover:text-[var(--navy-dark)]">
                    <span className="inline-flex items-center gap-1">{label} <SortIcon field={field} /></span>
                  </th>
                ))}
                <th className="px-4 py-3"><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--navy-medium)]">
                    Nog geen leden. Voeg het eerste lid toe.
                  </td>
                </tr>
              ) : (
                sortedMembers.map(member => {
                  const status = computeStatus(member)
                  return (
                    <tr
                      key={member.id}
                      onClick={() => setEditingMember(member)}
                      className="border-b border-[var(--border)] hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-[var(--navy-dark)] font-medium">
                        <Link
                          href={`/team/leden/${member.id}`}
                          onClick={e => e.stopPropagation()}
                          className="hover:text-[var(--pink)] transition-colors"
                        >
                          {member.first_name} {member.last_name}
                        </Link>
                        {member.role === 'admin' && <span className="ml-1.5 text-xs text-[var(--pink)]">admin</span>}
                        {member.role === 'trial' && <span className="ml-1.5 text-xs text-blue-600">trial</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.organization || '—'}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.email}</td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.plan === 'yearly' ? 'Jaar' : member.plan === 'trial' ? 'Proef' : 'Maand'}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3">
                        {engagement[member.id] ? (
                          <EngagementBadge level={engagement[member.id].level} />
                        ) : (
                          <span className="text-xs text-[var(--navy-medium)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]" title={member.last_active_at ? formatDateTime(member.last_active_at) : undefined}>
                        {formatRelativeTime(member.last_active_at)}
                      </td>
                      <td className="px-4 py-3 text-[var(--navy-medium)]">{member.role === 'admin' ? '—' : formatDate(member.end_date)}</td>
                      <td className="px-4 py-3">
                        <MemberActions member={member} isSelf={currentUserId === member.user_id} onChanged={fetchMembers} />
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
