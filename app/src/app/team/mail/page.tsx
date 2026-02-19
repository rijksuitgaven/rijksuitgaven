'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  Users, RefreshCw, CheckCircle, AlertTriangle,
  Mail, Send, Eye, ChevronDown,
} from 'lucide-react'
import { EmailEditor } from '@/components/email-editor/email-editor'

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
  error_messages?: string[]
}

interface SendResult {
  success: boolean
  sent: number
  failed: number
  total: number
  segment: string
}

const LIST_CONFIG = [
  { key: 'leden', label: 'Leden', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'prospects', label: 'Prospects', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'churned', label: 'Churned', color: 'bg-gray-50 border-gray-200 text-gray-600' },
] as const

const SEGMENT_OPTIONS = [
  { value: 'leden', label: 'Leden' },
  { value: 'prospects', label: 'Prospects' },
  { value: 'churned', label: 'Churned' },
  { value: 'iedereen', label: 'Iedereen' },
] as const

export default function MailPage() {
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<MailData | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Compose state
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [segment, setSegment] = useState<string>('leden')
  const [showPreview, setShowPreview] = useState(false)

  // Send state
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

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
        fetchData()
      }
    } catch {
      setSyncError('Netwerkfout bij synchronisatie')
    } finally {
      setSyncing(false)
    }
  }, [fetchData])

  const handleSend = useCallback(async () => {
    setConfirmSend(false)
    setSending(true)
    setSendResult(null)
    setSendError(null)

    try {
      const res = await fetch('/api/v1/team/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          heading: heading.trim(),
          body: body.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
          segment,
        }),
      })
      const result = await res.json()

      if (!res.ok) {
        setSendError(result.error || 'Verzenden mislukt')
      } else {
        setSendResult(result)
      }
    } catch {
      setSendError('Netwerkfout bij verzenden')
    } finally {
      setSending(false)
    }
  }, [subject, heading, body, ctaText, ctaUrl, segment])

  const recipientCount = data
    ? segment === 'iedereen'
      ? data.total
      : data.counts[segment as keyof typeof data.counts] ?? 0
    : 0

  // Body from Tiptap is HTML — check it's not just empty tags
  const bodyHasContent = body.replace(/<[^>]*>/g, '').trim().length > 0
  const canSend = subject.trim() && heading.trim() && bodyHasContent && !sending

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
            {/* Segment count cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {LIST_CONFIG.map(({ key, label, color }) => (
                <div key={key} className={`rounded-lg border p-4 ${color}`}>
                  <div className="text-2xl font-bold tabular-nums">
                    {data.counts[key as keyof typeof data.counts]}
                  </div>
                  <div className="text-sm font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Compose form */}
            <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-[var(--navy-dark)]" />
                <h3 className="text-base font-semibold text-[var(--navy-dark)]">Nieuw bericht</h3>
              </div>

              <div className="space-y-4">
                {/* Segment selector */}
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Ontvangers</label>
                  <div className="relative">
                    <select
                      value={segment}
                      onChange={e => setSegment(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                    >
                      {SEGMENT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--navy-medium)] pointer-events-none" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--navy-medium)]">
                    {recipientCount} ontvanger{recipientCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Onderwerp</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Onderwerp van het e-mailbericht"
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                  />
                </div>

                {/* Heading */}
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Koptekst</label>
                  <input
                    type="text"
                    value={heading}
                    onChange={e => setHeading(e.target.value)}
                    placeholder="Titel in het e-mailbericht"
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Bericht</label>
                  <EmailEditor value={body} onChange={setBody} />
                  <p className="mt-1 text-xs text-[var(--navy-medium)]">
                    Gebruik de werkbalk voor opmaak. Klik &ldquo;Voornaam&rdquo; om de naam van de ontvanger in te voegen.
                  </p>
                </div>

                {/* CTA (optional) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                      Knoptekst <span className="font-normal text-[var(--navy-medium)]">(optioneel)</span>
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={e => setCtaText(e.target.value)}
                      placeholder="Bijv. Bekijk op Rijksuitgaven"
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                      Knop URL <span className="font-normal text-[var(--navy-medium)]">(optioneel)</span>
                    </label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={e => setCtaUrl(e.target.value)}
                      placeholder="https://beta.rijksuitgaven.nl"
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!canSend}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Verberg voorbeeld' : 'Voorbeeld'}
                  </button>

                  {!confirmSend ? (
                    <button
                      onClick={() => setConfirmSend(true)}
                      disabled={!canSend}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Verzenden naar {recipientCount} ontvanger{recipientCount !== 1 ? 's' : ''}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--error)]">
                        Weet u het zeker?
                      </span>
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {sending ? 'Verzenden...' : `Ja, verzend ${recipientCount} e-mails`}
                      </button>
                      <button
                        onClick={() => setConfirmSend(false)}
                        className="px-3 py-2.5 text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                      >
                        Annuleren
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Send result */}
              {sendResult && (
                <div className="mt-4 flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium">Verzonden!</span>{' '}
                    {sendResult.sent} van {sendResult.total} e-mails verstuurd
                    {sendResult.failed > 0 && ` (${sendResult.failed} mislukt)`}.
                  </span>
                </div>
              )}

              {sendError && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
            </div>

            {/* Email preview */}
            {showPreview && canSend && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
                <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">Voorbeeld</h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--gray-light)] px-4 py-2 text-xs text-[var(--navy-medium)] border-b border-[var(--border)]">
                    <span className="font-medium">Onderwerp:</span> {subject}
                  </div>
                  <div
                    className="bg-[#E1EAF2] p-6"
                    style={{ minHeight: 200 }}
                  >
                    <div
                      className="mx-auto bg-white rounded-lg p-8"
                      style={{ maxWidth: 480, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                    >
                      <h2 className="text-center font-bold text-lg mb-3" style={{ color: '#0E3261' }}>
                        {heading}
                      </h2>
                      <div className="text-sm" style={{ color: '#4a4a4a', lineHeight: '24px' }}>
                        <p className="mb-3">Beste Michiel,</p>
                        <div
                          className="[&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_a]:text-[#436FA3] [&_img]:max-w-full [&_img]:rounded"
                          dangerouslySetInnerHTML={{
                            __html: body.replace(/\{\{voornaam\}\}/g, 'Michiel')
                          }}
                        />
                      </div>
                      {ctaText && ctaUrl && (
                        <div className="text-center mt-4">
                          <span
                            className="inline-block px-8 py-3 text-white text-sm font-semibold rounded-md"
                            style={{ backgroundColor: '#D4286B' }}
                          >
                            {ctaText}
                          </span>
                        </div>
                      )}
                      <hr className="my-4 border-gray-200" />
                      <p className="text-xs text-center text-gray-400">
                        Vragen? Neem contact op met ons team.
                      </p>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-4">
                      Rijksuitgaven.nl &middot; Het Maven Collectief &middot; <span className="underline">Afmelden</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sync section */}
            <div className="bg-white rounded-lg border border-[var(--border)] p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-[var(--navy-medium)]">
                  <Users className="w-4 h-4" />
                  <span>
                    <span className="font-semibold text-[var(--navy-dark)]">{data.resend_contacts}</span> van {data.total} contacten gesynchroniseerd met Resend
                  </span>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Synchroniseren...' : 'Sync Resend'}
                </button>
              </div>

              {/* Sync result */}
              {syncResult && (
                <div className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${
                  syncResult.errors > 0
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-green-700 bg-green-50 border border-green-200'
                }`}>
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Synchronisatie voltooid.</span>{' '}
                    {syncResult.created > 0 && `${syncResult.created} nieuw, `}
                    {syncResult.updated > 0 && `${syncResult.updated} bijgewerkt, `}
                    {syncResult.removed > 0 && `${syncResult.removed} verwijderd, `}
                    {syncResult.errors > 0 && `${syncResult.errors} fouten, `}
                    {syncResult.synced} totaal gesynchroniseerd.
                    {syncResult.error_messages && syncResult.error_messages.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs font-mono">
                        {syncResult.error_messages.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {syncError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}
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
