'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  RefreshCw, CheckCircle, AlertTriangle,
  Mail, Send, Eye, EyeOff, Copy,
  ChevronRight, MousePointerClick, MailOpen, Ban, X,
  BarChart3, Trash2, Save, Pencil,
} from 'lucide-react'
import { EmailEditor, type UploadedImage } from '@/components/email-editor/email-editor'

interface MailData {
  counts: Record<string, number>
}

interface SendResult {
  success: boolean
  sent: number
  failed: number
  total: number
  segment: string
}

interface Campaign {
  id: string
  subject: string
  heading: string
  preheader: string | null
  body: string
  cta_text: string | null
  cta_url: string | null
  segment: string
  sent_count: number
  failed_count: number
  sent_at: string | null
  status: 'draft' | 'sent'
  updated_at: string
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
}

interface CampaignRecipient {
  person_id: string | null
  email: string
  first_name: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  clicked_url: string | null
  bounced_at: string | null
  complained_at: string | null
  unsubscribed_at: string | null
}

const SEGMENT_OPTIONS = [
  { value: 'nieuw', label: 'Nieuw' },
  { value: 'in_gesprek', label: 'In gesprek' },
  { value: 'leden_maandelijks', label: 'Leden (maandelijks)' },
  { value: 'leden_jaarlijks', label: 'Leden (jaarlijks)' },
  { value: 'verloren', label: 'Verloren' },
  { value: 'ex_klant', label: 'Ex-klant' },
] as const

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SEGMENT_LABELS: Record<string, string> = {
  nieuw: 'Nieuw',
  in_gesprek: 'In gesprek',
  leden_maandelijks: 'Leden (maandelijks)',
  leden_jaarlijks: 'Leden (jaarlijks)',
  verloren: 'Verloren',
  ex_klant: 'Ex-klant',
}

const VALID_SEGMENTS_SET = new Set<string>(SEGMENT_OPTIONS.map(o => o.value))

type Tab = 'compose' | 'campaigns'

export default function MailPage() {
  const { role, loading: subLoading } = useSubscription()
  const [data, setData] = useState<MailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('compose')

  // Compose state
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [preheader, setPreheader] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set(['nieuw']))
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Draft state
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

  // Send state
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  // Campaign history state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [campaignRecipients, setCampaignRecipients] = useState<CampaignRecipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const fetchCampaigns = useCallback(() => {
    setCampaignsLoading(true)
    fetch('/api/v1/team/mail/campaigns')
      .then(res => res.json())
      .then(d => {
        setCampaigns(d.campaigns || [])
        setCampaignsLoading(false)
      })
      .catch(() => setCampaignsLoading(false))
  }, [])

  const handleExpandCampaign = useCallback(async (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null)
      return
    }
    setExpandedCampaignId(campaignId)
    setRecipientsLoading(true)
    try {
      const res = await fetch(`/api/v1/team/mail/campaigns/${campaignId}`)
      const data = await res.json()
      if (res.ok) {
        setCampaignRecipients(data.recipients || [])
      }
    } catch {
      // Silent
    } finally {
      setRecipientsLoading(false)
    }
  }, [expandedCampaignId])

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetchData()
      fetchCampaigns()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchData, fetchCampaigns])

  const handlePreview = useCallback(async () => {
    if (showPreview) {
      setShowPreview(false)
      return
    }

    setPreviewLoading(true)
    try {
      const res = await fetch('/api/v1/team/mail/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          heading: heading.trim(),
          preheader: preheader.trim() || undefined,
          bodyHtml: body.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      })
      if (res.ok) {
        const html = await res.text()
        setPreviewHtml(html)
        setShowPreview(true)
      }
    } catch {
      // Silent — preview is non-critical
    } finally {
      setPreviewLoading(false)
    }
  }, [showPreview, subject, heading, preheader, body, ctaText, ctaUrl])

  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    setSaveSuccess(false)

    const payload = {
      subject: subject.trim(),
      heading: heading.trim(),
      preheader: preheader.trim() || undefined,
      body: body.trim(),
      ctaText: ctaText.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      segments: Array.from(selectedSegments),
    }

    try {
      let res: Response
      if (editingDraftId) {
        res = await fetch(`/api/v1/team/mail/drafts/${editingDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/v1/team/mail/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const data = await res.json()
        if (!editingDraftId && data.id) {
          setEditingDraftId(data.id)
        }
        setSaveSuccess(true)
        fetchCampaigns()
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      // Silent
    } finally {
      setSaving(false)
    }
  }, [subject, heading, preheader, body, ctaText, ctaUrl, selectedSegments, editingDraftId, fetchCampaigns])

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
          preheader: preheader.trim() || undefined,
          body: body.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
          segments: Array.from(selectedSegments),
          draftId: editingDraftId || undefined,
        }),
      })
      const result = await res.json()

      if (!res.ok) {
        setSendError(result.error || 'Verzenden mislukt')
      } else {
        setSendResult(result)
        setEditingDraftId(null) // Clear draft reference after send
        fetchCampaigns() // Refresh campaign list
      }
    } catch {
      setSendError('Netwerkfout bij verzenden')
    } finally {
      setSending(false)
    }
  }, [subject, heading, preheader, body, ctaText, ctaUrl, selectedSegments, editingDraftId, fetchCampaigns])

  const handleUseAsTemplate = useCallback((campaign: Campaign) => {
    setSubject(campaign.subject)
    setHeading(campaign.heading)
    setPreheader(campaign.preheader || '')
    setBody(campaign.body)
    setCtaText(campaign.cta_text || '')
    setCtaUrl(campaign.cta_url || '')
    const segs = campaign.segment.split(',').filter(s => VALID_SEGMENTS_SET.has(s))
    setSelectedSegments(new Set(segs.length > 0 ? segs : ['nieuw']))
    setEditingDraftId(null) // Template = new compose, not editing a draft
    setSendResult(null)
    setSendError(null)
    setSaveSuccess(false)
    setShowPreview(false)
    setActiveTab('compose')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleEditDraft = useCallback((campaign: Campaign) => {
    setSubject(campaign.subject)
    setHeading(campaign.heading)
    setPreheader(campaign.preheader || '')
    setBody(campaign.body)
    setCtaText(campaign.cta_text || '')
    setCtaUrl(campaign.cta_url || '')
    const segs = campaign.segment.split(',').filter(s => VALID_SEGMENTS_SET.has(s))
    setSelectedSegments(new Set(segs.length > 0 ? segs : ['nieuw']))
    setEditingDraftId(campaign.id)
    setSendResult(null)
    setSendError(null)
    setSaveSuccess(false)
    setShowPreview(false)
    setActiveTab('compose')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNewCompose = useCallback(() => {
    setSubject('')
    setHeading('')
    setPreheader('')
    setBody('')
    setCtaText('')
    setCtaUrl('')
    setSelectedSegments(new Set(['nieuw']))
    setEditingDraftId(null)
    setSendResult(null)
    setSendError(null)
    setSaveSuccess(false)
    setShowPreview(false)
  }, [])

  const handleImageUploaded = useCallback((img: UploadedImage) => {
    setUploadedImages(prev => [...prev, img])
  }, [])

  const handleImageDeleted = useCallback((filename: string) => {
    setUploadedImages(prev => prev.filter(img => img.filename !== filename))
  }, [])

  const handleDeleteCampaign = useCallback(async (campaignId: string, isDraft: boolean) => {
    try {
      const url = isDraft
        ? `/api/v1/team/mail/drafts/${campaignId}`
        : `/api/v1/team/mail/campaigns/${campaignId}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId))
        if (expandedCampaignId === campaignId) setExpandedCampaignId(null)
        if (editingDraftId === campaignId) {
          setEditingDraftId(null)
        }
      }
    } catch {
      // Silent
    } finally {
      setConfirmDeleteId(null)
    }
  }, [expandedCampaignId, editingDraftId])

  const recipientCount = data
    ? Array.from(selectedSegments).reduce((sum, seg) => sum + (data.counts[seg] ?? 0), 0)
    : 0

  // Body from Tiptap is HTML — check it's not just empty tags
  const bodyHasContent = body.replace(/<[^>]*>/g, '').trim().length > 0
  const canSend = subject.trim() && heading.trim() && bodyHasContent && !sending && selectedSegments.size > 0
  const canSave = subject.trim() && heading.trim() && bodyHasContent && !saving

  const drafts = campaigns.filter(c => c.status === 'draft')
  const sentCampaigns = campaigns.filter(c => c.status !== 'draft')

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
            {/* Sub-tabs */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setActiveTab('compose')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'compose'
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'bg-white text-[var(--navy-medium)] border border-[var(--border)] hover:bg-[var(--gray-light)] hover:text-[var(--navy-dark)]'
                }`}
              >
                <Mail className="w-4 h-4" />
                {editingDraftId ? 'Concept bewerken' : 'Nieuw bericht'}
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'bg-white text-[var(--navy-medium)] border border-[var(--border)] hover:bg-[var(--gray-light)] hover:text-[var(--navy-dark)]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Campagnes
                {campaigns.length > 0 && (
                  <span className={`ml-1 text-xs tabular-nums ${
                    activeTab === 'campaigns' ? 'text-white/70' : 'text-[var(--navy-medium)]'
                  }`}>
                    ({campaigns.length})
                  </span>
                )}
              </button>
            </div>

            {/* Tab content: Compose */}
            {activeTab === 'compose' && (
              <>
                {/* Draft indicator bar */}
                {editingDraftId && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
                    <span className="text-sm text-amber-800">
                      <span className="font-medium">Concept bewerken</span> — wijzigingen worden pas opgeslagen als u op &ldquo;Concept bijwerken&rdquo; klikt
                    </span>
                    <button
                      onClick={handleNewCompose}
                      className="text-xs text-amber-700 hover:text-amber-900 underline transition-colors"
                    >
                      Nieuw bericht starten
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
                  <div className="space-y-4">
                    {/* Segment multi-select */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--navy-dark)] mb-2">Ontvangers</label>
                      <div className="space-y-1">
                        {SEGMENT_OPTIONS.map(opt => {
                          const count = data?.counts[opt.value] ?? 0
                          const checked = selectedSegments.has(opt.value)
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[var(--navy-dark)]/5 border border-[var(--navy-dark)]/20'
                                  : 'border border-transparent hover:bg-[var(--gray-light)]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedSegments(prev => {
                                      const next = new Set(prev)
                                      if (next.has(opt.value)) next.delete(opt.value)
                                      else next.add(opt.value)
                                      return next
                                    })
                                  }}
                                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--pink)] focus:ring-[var(--pink)]"
                                />
                                <span className="text-sm text-[var(--navy-dark)]">{opt.label}</span>
                              </div>
                              <span className="text-xs tabular-nums text-[var(--navy-medium)]">{count}</span>
                            </label>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs text-[var(--navy-medium)]">
                        {selectedSegments.size > 0
                          ? `${recipientCount} ontvanger${recipientCount !== 1 ? 's' : ''} geselecteerd`
                          : 'Selecteer minimaal één groep'
                        }
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

                    {/* Preheader */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                        Preheader <span className="font-normal text-[var(--navy-medium)]">(optioneel)</span>
                      </label>
                      <input
                        type="text"
                        value={preheader}
                        onChange={e => setPreheader(e.target.value)}
                        placeholder="Voorbeeldtekst naast het onderwerp in de inbox"
                        maxLength={150}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-[var(--navy-medium)]">
                        Wordt getoond naast het onderwerp in de inbox van de ontvanger. Max 150 tekens.
                      </p>
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
                      <EmailEditor
                        value={body}
                        onChange={setBody}
                        uploadedImages={uploadedImages}
                        onImageUploaded={handleImageUploaded}
                        onImageDeleted={handleImageDeleted}
                      />
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
                        onClick={handlePreview}
                        disabled={!canSend || previewLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {previewLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : showPreview ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {showPreview ? 'Verberg voorbeeld' : 'Voorbeeld'}
                      </button>

                      <button
                        onClick={handleSaveDraft}
                        disabled={!canSave}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saveSuccess ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {editingDraftId ? 'Concept bijwerken' : 'Opslaan als concept'}
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

                {/* Email preview — server-rendered iframe */}
                {showPreview && previewHtml && (
                  <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[var(--navy-dark)]">Voorbeeld</h3>
                      <span className="text-xs text-[var(--navy-medium)]">
                        Exact zoals ontvangers het zien
                      </span>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="bg-[var(--gray-light)] px-4 py-2 text-xs text-[var(--navy-medium)] border-b border-[var(--border)]">
                        <span className="font-medium">Onderwerp:</span> {subject}
                        {preheader && (
                          <span className="ml-3 text-[var(--navy-medium)]/60">— {preheader}</span>
                        )}
                      </div>
                      <iframe
                        srcDoc={previewHtml}
                        sandbox=""
                        title="E-mail voorbeeld"
                        className="w-full border-0"
                        style={{ height: 600 }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tab content: Campaigns */}
            {activeTab === 'campaigns' && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                {campaignsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-[var(--gray-light)] rounded" />
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <p className="text-sm text-[var(--navy-medium)]">Nog geen campagnes of concepten.</p>
                ) : (
                  <>
                    {/* Drafts section */}
                    {drafts.length > 0 && (
                      <>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--navy-medium)] mb-3">
                          Concepten
                        </h3>
                        <div className="divide-y divide-[var(--border)] mb-6">
                          {drafts.map(campaign => (
                            <div key={campaign.id} className="py-3 first:pt-0 last:pb-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--navy-dark)] truncate">
                                      {campaign.subject}
                                    </span>
                                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                                      Concept
                                    </span>
                                    {campaign.segment.split(',').map(seg => (
                                      <span key={seg} className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[var(--gray-light)] text-[var(--navy-medium)]">
                                        {SEGMENT_LABELS[seg] || seg}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--navy-medium)]">
                                    <span>
                                      Laatst bewerkt: {new Date(campaign.updated_at).toLocaleDateString('nl-NL', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditDraft(campaign)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors"
                                    title="Bewerk concept"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Bewerken
                                  </button>
                                  {confirmDeleteId === campaign.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteCampaign(campaign.id, true)}
                                        className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                      >
                                        Verwijder
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-1.5 text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                                      >
                                        Annuleer
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(campaign.id)}
                                      className="inline-flex items-center p-1.5 text-[var(--navy-medium)] hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                      title="Verwijder concept"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Sent campaigns section */}
                    {sentCampaigns.length > 0 && (
                      <>
                        {drafts.length > 0 && (
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--navy-medium)] mb-3">
                            Verzonden
                          </h3>
                        )}
                        <div className="divide-y divide-[var(--border)]">
                          {sentCampaigns.map(campaign => {
                            const isExpanded = expandedCampaignId === campaign.id
                            const openRate = campaign.sent_count > 0
                              ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                              : '0.0'
                            const clickRate = campaign.sent_count > 0
                              ? ((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1)
                              : '0.0'

                            return (
                              <div key={campaign.id} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleExpandCampaign(campaign.id)}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--navy-dark)] hover:text-[var(--pink)] transition-colors truncate"
                                      >
                                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        {campaign.subject}
                                      </button>
                                      {campaign.segment.split(',').map(seg => (
                                        <span key={seg} className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[var(--gray-light)] text-[var(--navy-medium)]">
                                          {SEGMENT_LABELS[seg] || seg}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-[var(--navy-medium)]">
                                      <span>
                                        {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('nl-NL', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        }) : '—'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        {campaign.sent_count}
                                      </span>
                                      {campaign.opened_count > 0 && (
                                        <span className="flex items-center gap-1" title="Geopend (indicatief — Apple Mail opent automatisch)">
                                          <MailOpen className="w-3 h-3 text-blue-500" />
                                          {openRate}%
                                        </span>
                                      )}
                                      {campaign.clicked_count > 0 && (
                                        <span className="flex items-center gap-1" title="Geklikt">
                                          <MousePointerClick className="w-3 h-3 text-[var(--pink)]" />
                                          {clickRate}%
                                        </span>
                                      )}
                                      {campaign.bounced_count > 0 && (
                                        <span className="flex items-center gap-1 text-[var(--error)]" title="Bounced">
                                          <Ban className="w-3 h-3" />
                                          {campaign.bounced_count}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleUseAsTemplate(campaign)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors"
                                      title="Gebruik als sjabloon"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      Sjabloon
                                    </button>
                                    {confirmDeleteId === campaign.id ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleDeleteCampaign(campaign.id, false)}
                                          className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                        >
                                          Verwijder
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-2 py-1.5 text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                                        >
                                          Annuleer
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setConfirmDeleteId(campaign.id)}
                                        className="inline-flex items-center p-1.5 text-[var(--navy-medium)] hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                        title="Verwijder campagne"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Expanded: per-recipient detail */}
                                {isExpanded && (
                                  <div className="mt-3 ml-5">
                                    {recipientsLoading ? (
                                      <div className="animate-pulse h-20 bg-[var(--gray-light)] rounded" />
                                    ) : campaignRecipients.length === 0 ? (
                                      <p className="text-xs text-[var(--navy-medium)]">Nog geen events ontvangen van Resend.</p>
                                    ) : (
                                      <>
                                        <div className="overflow-x-auto rounded border border-[var(--border)]">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-[var(--gray-light)] text-left">
                                                <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Ontvanger</th>
                                                <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Bezorgd</th>
                                                <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Geopend</th>
                                                <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Geklikt</th>
                                                <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border)]">
                                              {campaignRecipients.map(r => (
                                                <tr key={r.email} className="hover:bg-[var(--gray-light)]/50">
                                                  <td className="px-3 py-2">
                                                    <div className="text-[var(--navy-dark)]">
                                                      {r.first_name || r.email.split('@')[0]}
                                                    </div>
                                                    <div className="text-[var(--navy-medium)]">{r.email}</div>
                                                  </td>
                                                  <td className="px-3 py-2 text-[var(--navy-medium)]">
                                                    {r.delivered_at ? formatTime(r.delivered_at) : '—'}
                                                  </td>
                                                  <td className="px-3 py-2 text-[var(--navy-medium)]">
                                                    {r.opened_at ? formatTime(r.opened_at) : '—'}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {r.clicked_at ? (
                                                      <span className="text-[var(--pink)]" title={r.clicked_url || undefined}>
                                                        {formatTime(r.clicked_at)}
                                                      </span>
                                                    ) : '—'}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {r.unsubscribed_at ? (
                                                      <span className="inline-flex items-center gap-1 text-amber-600">
                                                        <X className="w-3 h-3" /> Afgemeld
                                                      </span>
                                                    ) : r.bounced_at ? (
                                                      <span className="inline-flex items-center gap-1 text-[var(--error)]">
                                                        <Ban className="w-3 h-3" /> Bounced
                                                      </span>
                                                    ) : r.complained_at ? (
                                                      <span className="inline-flex items-center gap-1 text-[var(--error)]">
                                                        <AlertTriangle className="w-3 h-3" /> Spam
                                                      </span>
                                                    ) : r.delivered_at ? (
                                                      <span className="text-green-600">&#10003;</span>
                                                    ) : (
                                                      <span className="text-[var(--navy-medium)]">Verstuurd</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        <p className="mt-2 text-[10px] text-[var(--navy-medium)]">
                                          * Openpercentage is indicatief — Apple Mail opent alle e-mails automatisch.
                                        </p>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {drafts.length === 0 && sentCampaigns.length === 0 && (
                      <p className="text-sm text-[var(--navy-medium)]">Nog geen campagnes of concepten.</p>
                    )}
                  </>
                )}
              </div>
            )}
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
