'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  Users, RefreshCw, ExternalLink, CheckCircle, AlertTriangle,
  Mail,
} from 'lucide-react'

interface MailData {
  counts: {
    leden: number
    churned: number
    prospects: number
  }
  resend_contacts: number
  total: number
}

interface SyncResult {
  success: boolean
  synced: number
  created: number
  updated: number
  removed: number
  errors: number
}

const LIST_CONFIG = [
  { key: 'leden', label: 'Leden', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'prospects', label: 'Prospects', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'churned', label: 'Churned', color: 'bg-gray-50 border-gray-200 text-gray-600' },
] as const

export default function MailPage() {
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<MailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/team/mail')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetchData()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchData])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setSyncResult(null)
    setSyncError(null)

    try {
      const res = await fetch('/api/v1/team/mail', { method: 'POST' })
      const result = await res.json()

      if (!res.ok) {
        setSyncError(result.error || 'Synchronisatie mislukt')
      } else {
        setSyncResult(result)
        // Refresh counts after sync
        fetchData()
      }
    } catch {
      setSyncError('Netwerkfout bij synchronisatie')
    } finally {
      setSyncing(false)
    }
  }, [fetchData])

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
        <TeamNav />

        <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-6">E-mail</h2>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-lg border border-[var(--border)]" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* List count cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {LIST_CONFIG.map(({ key, label, color }) => (
                <div
                  key={key}
                  className={`rounded-lg border p-4 ${color}`}
                >
                  <div className="text-2xl font-bold tabular-nums">
                    {data.counts[key as keyof typeof data.counts]}
                  </div>
                  <div className="text-sm font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href="https://resend.com/broadcasts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Nieuw bericht
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Synchroniseren...' : 'Synchroniseren'}
                </button>
              </div>

              {/* Sync result */}
              {syncResult && (
                <div className="mt-4 flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Synchronisatie voltooid.</span>{' '}
                    {syncResult.created > 0 && `${syncResult.created} nieuw, `}
                    {syncResult.updated > 0 && `${syncResult.updated} bijgewerkt, `}
                    {syncResult.removed > 0 && `${syncResult.removed} verwijderd, `}
                    {syncResult.errors > 0 && `${syncResult.errors} fouten, `}
                    {syncResult.synced} totaal gesynchroniseerd.
                  </div>
                </div>
              )}

              {/* Sync error */}
              {syncError && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}
            </div>

            {/* Resend status */}
            <div className="bg-white rounded-lg border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 text-sm text-[var(--navy-medium)] mb-3">
                <Users className="w-4 h-4" />
                <span>
                  <span className="font-semibold text-[var(--navy-dark)]">{data.resend_contacts}</span> van {data.total} contacten gesynchroniseerd met Resend
                </span>
              </div>

              <a
                href="https://resend.com/broadcasts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--link-color)] hover:underline"
              >
                Open Resend Dashboard
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <p className="text-sm text-[var(--error)]">Fout bij laden van e-mail gegevens</p>
          </div>
        )}
      </main>
    </div>
  )
}
