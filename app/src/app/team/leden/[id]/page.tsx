'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  ArrowLeft, Mail, MailOpen, MousePointerClick, Ban,
  AlertTriangle, CheckCircle, Clock, Snowflake, Zap, User,
} from 'lucide-react'
import Link from 'next/link'

interface TimelineEvent {
  event_type: string
  occurred_at: string
  link_url: string | null
  ua_client: string | null
}

interface TimelineEntry {
  campaign_id: string
  campaign_subject: string
  campaign_sent_at: string | null
  events: TimelineEvent[]
}

interface PersonData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  pipeline_stage: string
  bounced_at: string | null
  unsubscribed_at: string | null
}

interface SubscriptionData {
  plan: string
  role: string
  start_date: string | null
  end_date: string | null
  grace_ends_at: string | null
  cancelled_at: string | null
}

interface Engagement {
  level: string
  last_engagement_at: string | null
  campaigns_sent: number
  campaigns_opened: number
  campaigns_clicked: number
}

interface TimelineResponse {
  person: PersonData
  subscription: SubscriptionData
  timeline: TimelineEntry[]
  engagement: Engagement
}

const ENGAGEMENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  active: { label: 'Actief', color: 'bg-green-100 text-green-800', icon: Zap },
  at_risk: { label: 'Risico', color: 'bg-amber-100 text-amber-800', icon: Clock },
  cold: { label: 'Koud', color: 'bg-blue-100 text-blue-800', icon: Snowflake },
  new: { label: 'Nieuw', color: 'bg-gray-100 text-gray-700', icon: User },
}

const STAGE_LABELS: Record<string, string> = {
  nieuw: 'Nieuw',
  in_gesprek: 'In gesprek',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
  ex_klant: 'Ex-klant',
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Maandelijks',
  yearly: 'Jaarlijks',
  trial: 'Proef',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LedenDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<TimelineResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subLoading && role === 'admin' && id) {
      fetch(`/api/v1/team/leden/${id}/timeline`)
        .then(res => {
          if (!res.ok) throw new Error('Niet gevonden')
          return res.json()
        })
        .then(d => {
          setData(d)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, id])

  if (subLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
          <TeamNav />
          <div className="animate-pulse space-y-4 mt-6">
            <div className="h-8 w-48 bg-white rounded" />
            <div className="h-32 bg-white rounded-lg border border-[var(--border)]" />
            <div className="h-64 bg-white rounded-lg border border-[var(--border)]" />
          </div>
        </main>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white flex items-center justify-center">
        <p className="text-[var(--error)]">Geen toegang</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
          <TeamNav />
          <Link href="/team/leden" className="inline-flex items-center gap-1.5 text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] mb-4 mt-4">
            <ArrowLeft className="w-4 h-4" />
            Terug naar leden
          </Link>
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <p className="text-sm text-[var(--error)]">{error || 'Lid niet gevonden'}</p>
          </div>
        </main>
      </div>
    )
  }

  const { person, subscription, timeline, engagement } = data
  const engConfig = ENGAGEMENT_CONFIG[engagement.level] || ENGAGEMENT_CONFIG.new
  const EngIcon = engConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
        <TeamNav />

        <Link href="/team/leden" className="inline-flex items-center gap-1.5 text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] mb-4 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Terug naar leden
        </Link>

        {/* Person header */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-dark)]">
                {person.first_name} {person.last_name || ''}
              </h2>
              <p className="text-sm text-[var(--navy-medium)] mt-0.5">{person.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gray-light)] text-[var(--navy-medium)]">
                  {STAGE_LABELS[person.pipeline_stage] || person.pipeline_stage}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${engConfig.color}`}>
                  <EngIcon className="w-3 h-3" />
                  {engConfig.label}
                </span>
                {person.bounced_at && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    <Ban className="w-3 h-3" />
                    Gebounced
                  </span>
                )}
                {person.unsubscribed_at && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Afgemeld
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-[var(--navy-medium)]">
              <p><span className="font-medium">Plan:</span> {PLAN_LABELS[subscription.plan] || subscription.plan}</p>
              <p><span className="font-medium">Rol:</span> {subscription.role}</p>
              <p><span className="font-medium">Einddatum:</span> {formatDate(subscription.end_date)}</p>
            </div>
          </div>

          {/* Engagement stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--navy-dark)] tabular-nums">{engagement.campaigns_sent}</p>
              <p className="text-xs text-[var(--navy-medium)]">Ontvangen</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600 tabular-nums">{engagement.campaigns_opened}</p>
              <p className="text-xs text-[var(--navy-medium)]">Geopend</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--pink)] tabular-nums">{engagement.campaigns_clicked}</p>
              <p className="text-xs text-[var(--navy-medium)]">Geklikt</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--navy-dark)]">
                {engagement.last_engagement_at ? formatDate(engagement.last_engagement_at) : '—'}
              </p>
              <p className="text-xs text-[var(--navy-medium)]">Laatste activiteit</p>
            </div>
          </div>
        </div>

        {/* Email timeline */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-4">E-mail tijdlijn</h3>

          {timeline.length === 0 ? (
            <p className="text-sm text-[var(--navy-medium)]">Nog geen e-mails ontvangen.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map(entry => {
                const hasDelivered = entry.events.some(e => e.event_type === 'delivered')
                const hasOpened = entry.events.some(e => e.event_type === 'opened')
                const hasClicked = entry.events.some(e => e.event_type === 'clicked')
                const hasBounced = entry.events.some(e => e.event_type === 'bounced')
                const hasComplained = entry.events.some(e => e.event_type === 'complained')

                return (
                  <div key={entry.campaign_id} className="border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--navy-dark)] truncate">
                          {entry.campaign_subject}
                        </p>
                        <p className="text-xs text-[var(--navy-medium)] mt-0.5">
                          {entry.campaign_sent_at ? formatTime(entry.campaign_sent_at) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasDelivered && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3" /> Bezorgd
                          </span>
                        )}
                        {hasOpened && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            <MailOpen className="w-3 h-3" /> Geopend
                          </span>
                        )}
                        {hasClicked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-[var(--pink)]">
                            <MousePointerClick className="w-3 h-3" /> Geklikt
                          </span>
                        )}
                        {hasBounced && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                            <Ban className="w-3 h-3" /> Bounced
                          </span>
                        )}
                        {hasComplained && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Spam
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event details */}
                    {entry.events.length > 0 && (
                      <div className="mt-2 ml-2 border-l-2 border-[var(--border)] pl-3 space-y-1">
                        {entry.events.map((evt, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] text-[var(--navy-medium)]">
                            <span>{formatTime(evt.occurred_at)}</span>
                            <span className="font-medium">
                              {evt.event_type === 'delivered' && 'Bezorgd'}
                              {evt.event_type === 'opened' && 'Geopend'}
                              {evt.event_type === 'clicked' && 'Geklikt'}
                              {evt.event_type === 'bounced' && 'Bounced'}
                              {evt.event_type === 'complained' && 'Spam-melding'}
                            </span>
                            {evt.link_url && (
                              <a
                                href={evt.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--link)] hover:underline truncate max-w-[200px]"
                              >
                                {evt.link_url.replace(/^https?:\/\//, '').slice(0, 40)}
                              </a>
                            )}
                            {evt.ua_client && (
                              <span className="text-[var(--navy-medium)]/60">({evt.ua_client})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
