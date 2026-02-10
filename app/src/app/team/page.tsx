'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'

interface Member {
  id: string
  email: string
  first_name: string
  last_name: string
  organization: string | null
  plan: 'monthly' | 'yearly'
  end_date: string
  grace_ends_at: string
  cancelled_at: string | null
}

function computeStatus(member: Member): 'active' | 'grace' | 'expired' {
  if (member.cancelled_at) return 'expired'
  const today = new Date().toISOString().split('T')[0]
  if (today <= member.end_date) return 'active'
  if (today <= member.grace_ends_at) return 'grace'
  return 'expired'
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TeamDashboardPage() {
  const { role, loading: subLoading } = useSubscription()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetch('/api/v1/team/leden')
        .then(res => res.json())
        .then(data => { if (data.members) setMembers(data.members) })
        .finally(() => setLoading(false))
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role])

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

  const activeMembers = members.filter(m => computeStatus(m) === 'active')
  const graceMembers = members.filter(m => computeStatus(m) === 'grace')
  const expiredMembers = members.filter(m => computeStatus(m) === 'expired')

  // Expiring within 30 days
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const expiringMembers = activeMembers.filter(m => m.end_date >= today && m.end_date <= thirtyDaysStr)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), serif' }}>
          Dashboard
        </h1>
        <Link
          href="/team/leden"
          className="px-4 py-2 bg-[var(--pink)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Leden beheren
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[var(--border)] rounded-lg px-4 py-4">
          <p className="text-3xl font-bold text-[var(--navy-dark)]">{members.length}</p>
          <p className="text-sm text-[var(--navy-medium)]">Totaal leden</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4">
          <p className="text-3xl font-bold text-green-700">{activeMembers.length}</p>
          <p className="text-sm text-green-600">Actief</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4">
          <p className="text-3xl font-bold text-amber-700">{graceMembers.length}</p>
          <p className="text-sm text-amber-600">Verlengingsperiode</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4">
          <p className="text-3xl font-bold text-red-700">{expiredMembers.length}</p>
          <p className="text-sm text-red-600">Verlopen</p>
        </div>
      </div>

      {/* Grace period - needs attention */}
      {graceMembers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)] mb-3">Actie vereist</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200">
                  <th className="text-left px-4 py-2 font-medium text-amber-800">Naam</th>
                  <th className="text-left px-4 py-2 font-medium text-amber-800">Organisatie</th>
                  <th className="text-left px-4 py-2 font-medium text-amber-800">Verlopen op</th>
                  <th className="text-left px-4 py-2 font-medium text-amber-800">Verlenging tot</th>
                </tr>
              </thead>
              <tbody>
                {graceMembers.map(m => (
                  <tr key={m.id} className="border-b border-amber-100 last:border-0">
                    <td className="px-4 py-2 text-amber-900 font-medium">{m.first_name} {m.last_name}</td>
                    <td className="px-4 py-2 text-amber-800">{m.organization || '—'}</td>
                    <td className="px-4 py-2 text-amber-800">{formatDate(m.end_date)}</td>
                    <td className="px-4 py-2 text-amber-800">{formatDate(m.grace_ends_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring within 30 days */}
      {expiringMembers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--navy-dark)] mb-3">Verloopt binnen 30 dagen</h2>
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2 font-medium text-[var(--navy-medium)]">Naam</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--navy-medium)]">Organisatie</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--navy-medium)]">E-mail</th>
                  <th className="text-left px-4 py-2 font-medium text-[var(--navy-medium)]">Einddatum</th>
                </tr>
              </thead>
              <tbody>
                {expiringMembers.map(m => (
                  <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 text-[var(--navy-dark)] font-medium">{m.first_name} {m.last_name}</td>
                    <td className="px-4 py-2 text-[var(--navy-medium)]">{m.organization || '—'}</td>
                    <td className="px-4 py-2 text-[var(--navy-medium)]">{m.email}</td>
                    <td className="px-4 py-2 text-[var(--navy-medium)]">{formatDate(m.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {graceMembers.length === 0 && expiringMembers.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-8 text-center">
          <p className="text-green-700 font-medium">Alles op orde</p>
          <p className="text-sm text-green-600 mt-1">Geen leden in verlengingsperiode of die binnenkort verlopen.</p>
        </div>
      )}
    </main>
  )
}
