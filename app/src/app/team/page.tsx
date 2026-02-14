'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'
import { AlertTriangle } from 'lucide-react'

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
  invited_at: string | null
  activated_at: string | null
  last_active_at: string | null
}

type MemberStatus = 'aangemaakt' | 'uitgenodigd' | 'active' | 'grace' | 'expired'

function computeStatus(member: Member): MemberStatus {
  if (!member.invited_at) return 'aangemaakt'
  if (!member.last_active_at) return 'uitgenodigd'
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
  const [feedbackStats, setFeedbackStats] = useState<{ nieuw: number; bug: number; suggestie: number; vraag: number }>({ nieuw: 0, bug: 0, suggestie: 0, vraag: 0 })
  const [errors, setErrors] = useState<{ module: string; message: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      Promise.all([
        fetch('/api/v1/team/leden').then(res => res.json()),
        fetch('/api/v1/team/feedback').then(res => res.json()),
        fetch('/api/v1/team/statistieken?days=7').then(res => res.json()).catch(() => null),
      ]).then(([ledenData, feedbackData, statsData]) => {
        if (ledenData.members) setMembers(ledenData.members)
        if (feedbackData.items) {
          const items = feedbackData.items as { status: string; category: string }[]
          const open = items.filter(i => i.status !== 'afgewezen' && i.status !== 'afgerond')
          setFeedbackStats({
            nieuw: items.filter(i => i.status === 'nieuw').length,
            bug: open.filter(i => i.category === 'bug').length,
            suggestie: open.filter(i => i.category === 'suggestie').length,
            vraag: open.filter(i => i.category === 'vraag').length,
          })
        }
        if (statsData?.errors) setErrors(statsData.errors)
      }).finally(() => setLoading(false))
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

  const hasOpenFeedback = feedbackStats.nieuw > 0 || feedbackStats.bug > 0 || feedbackStats.suggestie > 0 || feedbackStats.vraag > 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-4">
        Team
      </h1>
      <TeamNav />

      <div className="space-y-6">
        {/* Errors alert */}
        {errors.length > 0 && (
          <Link href="/team/statistieken" className="block">
            <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 hover:bg-red-100/60 transition-colors">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    {errors.length} {errors.length === 1 ? 'fout' : 'fouten'} in de afgelopen 7 dagen
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {[...new Set(errors.map(e => e.module))].filter(Boolean).join(', ') || 'Diverse modules'}
                    {' — '}bekijk in Statistieken
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Leden section */}
        <div className="bg-white border border-[var(--border)] rounded-lg">
          {/* Section header */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--navy-dark)]">Leden</h2>
          </div>

          <div className="px-5 py-4">
            {/* Inline stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-4">
              <span className="text-[var(--navy-dark)]"><span className="font-semibold">{members.length}</span> totaal</span>
              <span className="text-green-700"><span className="font-semibold">{activeMembers.length}</span> actief</span>
              {graceMembers.length > 0 && (
                <span className="text-amber-700"><span className="font-semibold">{graceMembers.length}</span> verlengingsperiode</span>
              )}
              {expiredMembers.length > 0 && (
                <span className="text-red-700"><span className="font-semibold">{expiredMembers.length}</span> verlopen</span>
              )}
            </div>

            {/* Grace period table */}
            {graceMembers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Actie vereist</p>
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
              <div className="mb-4">
                <p className="text-sm font-medium text-[var(--navy-medium)] mb-2">Verloopt binnen 30 dagen</p>
                <div className="bg-gray-50 border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
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

            {/* All good message */}
            {graceMembers.length === 0 && expiringMembers.length === 0 && (
              <p className="text-sm text-green-700">Alles op orde — geen actie vereist</p>
            )}
          </div>
        </div>

        {/* Feedback section */}
        <div className="bg-white border border-[var(--border)] rounded-lg">
          {/* Section header */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-base font-semibold text-[var(--navy-dark)]">Feedback</h2>
          </div>

          <div className="px-5 py-4">
            {hasOpenFeedback ? (
              <>
                {/* Category counts */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-3">
                  <span className="text-red-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                    <span className="font-semibold">{feedbackStats.bug}</span> bugs
                  </span>
                  <span className="text-green-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                    <span className="font-semibold">{feedbackStats.suggestie}</span> suggesties
                  </span>
                  <span className="text-blue-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                    <span className="font-semibold">{feedbackStats.vraag}</span> vragen
                  </span>
                </div>

                {/* New count with link */}
                {feedbackStats.nieuw > 0 && (
                  <Link
                    href="/team/feedback"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
                  >
                    <span className="font-semibold">{feedbackStats.nieuw} nieuw</span> — bekijk feedback
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-green-700">Geen openstaande feedback</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
