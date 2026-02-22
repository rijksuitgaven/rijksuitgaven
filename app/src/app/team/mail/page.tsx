'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { TeamNav } from '@/components/team-nav'
import {
  RefreshCw, CheckCircle, AlertTriangle,
  Mail, Send, Eye, EyeOff, Copy,
  ChevronRight, MousePointerClick, MailOpen, Ban, X,
  BarChart3, Trash2, Save, Pencil, Images, Upload,
  Monitor, Tablet, Smartphone, ShieldCheck, SendHorizontal, Link2,
  ListOrdered, Plus, Clock, Users, Play, Pause, GripVertical, HelpCircle,
  Filter,
} from 'lucide-react'
import { EmailEditor, type UploadedImage, type MediaItem } from '@/components/email-editor/email-editor'

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

interface LinkStat {
  url: string
  total_clicks: number
  unique_clickers: number
}

interface DeviceStats {
  clients: { name: string; count: number }[]
  devices: { name: string; count: number }[]
  operating_systems: { name: string; count: number }[]
}

interface CampaignDetail {
  recipients: CampaignRecipient[]
  link_stats: LinkStat[]
  device_stats: DeviceStats
}

interface PrecheckItem {
  label: string
  pass: boolean
  fix?: string
}

interface PrecheckArea {
  area: string
  pass: boolean
  items: PrecheckItem[]
}

interface ComparisonCampaign {
  id: string
  subject: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

interface Sequence {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused'
  send_time: string
  created_at: string
  updated_at: string
  step_count: number
  enrollment_active: number
  enrollment_completed: number
  enrollment_total: number
}

interface SequenceStep {
  id: string
  sequence_id: string
  step_order: number
  delay_days: number
  subject: string
  heading: string
  preheader: string | null
  body: string
  cta_text: string | null
  cta_url: string | null
  created_at: string
  updated_at: string
}

interface SequenceEnrollment {
  id: string
  person_id: string
  current_step: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  enrolled_at: string
  completed_at: string | null
  cancelled_at: string | null
  email: string | null
  first_name: string | null
}

interface SequenceDetail {
  sequence: Sequence
  steps: SequenceStep[]
  enrollments: SequenceEnrollment[]
}

// Condition builder types
interface CampaignCondition {
  type: 'campaign_delivered' | 'campaign_opened' | 'campaign_clicked' | 'engagement_level'
  campaign_id?: string
  level?: string
  negated: boolean
}

interface CampaignConditionGroup {
  conditions: CampaignCondition[]
}

const CONDITION_TYPE_OPTIONS = [
  { value: 'campaign_delivered', label: 'Heeft ontvangen', icon: '📬' },
  { value: 'campaign_opened', label: 'Heeft geopend', icon: '📖' },
  { value: 'campaign_clicked', label: 'Heeft geklikt', icon: '🖱️' },
  { value: 'engagement_level', label: 'Engagement niveau', icon: '📊' },
] as const

const ENGAGEMENT_LEVEL_OPTIONS = [
  { value: 'active', label: 'Actief' },
  { value: 'at_risk', label: 'Risico' },
  { value: 'cold', label: 'Koud' },
  { value: 'new', label: 'Nieuw' },
] as const

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

type Tab = 'compose' | 'campaigns' | 'media' | 'sequences'
type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

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
  const [conditionGroups, setConditionGroups] = useState<CampaignConditionGroup[]>([])
  const [conditionCount, setConditionCount] = useState<number | null>(null)
  const [conditionEvaluating, setConditionEvaluating] = useState(false)
  const [showConditions, setShowConditions] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')

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

  // Test email state
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Precheck state
  const [precheckLoading, setPrecheckLoading] = useState(false)
  const [precheckAreas, setPrecheckAreas] = useState<PrecheckArea[] | null>(null)

  // Campaign history state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null)
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Comparison state
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelected, setCompareSelected] = useState<Set<string>>(new Set())
  const [compareResult, setCompareResult] = useState<ComparisonCampaign[] | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Media library state
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaDeleteConfirm, setMediaDeleteConfirm] = useState<string | null>(null)

  // Sequences state
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [sequencesLoading, setSequencesLoading] = useState(false)
  const [expandedSequenceId, setExpandedSequenceId] = useState<string | null>(null)
  const [sequenceDetail, setSequenceDetail] = useState<SequenceDetail | null>(null)
  const [sequenceDetailLoading, setSequenceDetailLoading] = useState(false)
  const [newSequenceName, setNewSequenceName] = useState('')
  const [newSequenceDesc, setNewSequenceDesc] = useState('')
  const [newSequenceTime, setNewSequenceTime] = useState('09:00')
  const [showNewSequence, setShowNewSequence] = useState(false)
  const [creatingSequence, setCreatingSequence] = useState(false)
  const [showHelp, setShowHelp] = useState<'compose' | 'sequences' | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [newStepSubject, setNewStepSubject] = useState('')
  const [newStepHeading, setNewStepHeading] = useState('')
  const [newStepPreheader, setNewStepPreheader] = useState('')
  const [newStepBody, setNewStepBody] = useState('')
  const [newStepDelay, setNewStepDelay] = useState(0)
  const [newStepCtaText, setNewStepCtaText] = useState('')
  const [newStepCtaUrl, setNewStepCtaUrl] = useState('')
  const [showAddStep, setShowAddStep] = useState(false)
  const [addingStep, setAddingStep] = useState(false)
  const [confirmDeleteSeqId, setConfirmDeleteSeqId] = useState<string | null>(null)
  // Step preview/precheck/test state
  const [stepPreviewHtml, setStepPreviewHtml] = useState<string | null>(null)
  const [stepShowPreview, setStepShowPreview] = useState(false)
  const [stepPreviewLoading, setStepPreviewLoading] = useState(false)
  const [stepPreviewDevice, setStepPreviewDevice] = useState<PreviewDevice>('desktop')
  const [stepPrecheckAreas, setStepPrecheckAreas] = useState<PrecheckArea[] | null>(null)
  const [stepPrecheckLoading, setStepPrecheckLoading] = useState(false)
  const [stepTestSending, setStepTestSending] = useState(false)
  const [stepTestResult, setStepTestResult] = useState<string | null>(null)
  const [stepSaving, setStepSaving] = useState(false)

  // Close help popover on outside click
  useEffect(() => {
    if (!showHelp) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-help-popover]')) setShowHelp(null)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [showHelp])

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

  const fetchMedia = useCallback(() => {
    setMediaLoading(true)
    fetch('/api/v1/team/mail/media')
      .then(res => res.json())
      .then(d => {
        setMediaLibrary(d.media || [])
        setMediaLoading(false)
      })
      .catch(() => setMediaLoading(false))
  }, [])

  const fetchSequences = useCallback(() => {
    setSequencesLoading(true)
    fetch('/api/v1/team/mail/sequences')
      .then(res => res.json())
      .then(d => {
        setSequences(d.sequences || [])
        setSequencesLoading(false)
      })
      .catch(() => setSequencesLoading(false))
  }, [])

  const handleExpandCampaign = useCallback(async (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null)
      return
    }
    setExpandedCampaignId(campaignId)
    setRecipientsLoading(true)
    setCampaignDetail(null)
    try {
      const res = await fetch(`/api/v1/team/mail/campaigns/${campaignId}`)
      const data = await res.json()
      if (res.ok) {
        setCampaignDetail({
          recipients: data.recipients || [],
          link_stats: data.link_stats || [],
          device_stats: data.device_stats || { clients: [], devices: [], operating_systems: [] },
        })
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
      fetchMedia()
      fetchSequences()
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role, fetchData, fetchCampaigns, fetchMedia, fetchSequences])

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

  const handleTestEmail = useCallback(async () => {
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/v1/team/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          heading: heading.trim(),
          preheader: preheader.trim() || undefined,
          body: body.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult(`Verstuurd naar ${data.email}`)
        setTimeout(() => setTestResult(null), 5000)
      } else {
        setTestResult(data.error || 'Fout bij versturen')
        setTimeout(() => setTestResult(null), 5000)
      }
    } catch {
      setTestResult('Netwerkfout')
      setTimeout(() => setTestResult(null), 5000)
    } finally {
      setTestSending(false)
    }
  }, [subject, heading, preheader, body, ctaText, ctaUrl])

  const handlePrecheck = useCallback(async () => {
    if (precheckAreas) {
      setPrecheckAreas(null)
      return
    }
    setPrecheckLoading(true)
    try {
      const res = await fetch('/api/v1/team/mail/precheck', {
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
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPrecheckAreas(data.areas || [])
      }
    } catch {
      // Silent
    } finally {
      setPrecheckLoading(false)
    }
  }, [precheckAreas, subject, heading, preheader, body, ctaText, ctaUrl, selectedSegments])

  // Step-specific handlers (use newStep* state)
  const handleStepPreview = useCallback(async () => {
    if (stepShowPreview) { setStepShowPreview(false); return }
    setStepPreviewLoading(true)
    try {
      const res = await fetch('/api/v1/team/mail/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newStepSubject.trim(),
          heading: newStepHeading.trim(),
          preheader: newStepPreheader.trim() || undefined,
          bodyHtml: newStepBody.trim(),
          ctaText: newStepCtaText.trim() || undefined,
          ctaUrl: newStepCtaUrl.trim() || undefined,
        }),
      })
      if (res.ok) {
        setStepPreviewHtml(await res.text())
        setStepShowPreview(true)
      }
    } catch { /* Silent */ } finally { setStepPreviewLoading(false) }
  }, [stepShowPreview, newStepSubject, newStepHeading, newStepPreheader, newStepBody, newStepCtaText, newStepCtaUrl])

  const handleStepTestEmail = useCallback(async () => {
    setStepTestSending(true)
    setStepTestResult(null)
    try {
      const res = await fetch('/api/v1/team/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newStepSubject.trim(),
          heading: newStepHeading.trim(),
          preheader: newStepPreheader.trim() || undefined,
          body: newStepBody.trim(),
          ctaText: newStepCtaText.trim() || undefined,
          ctaUrl: newStepCtaUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStepTestResult(`Verstuurd naar ${data.email}`)
      } else {
        setStepTestResult(data.error || 'Fout bij versturen')
      }
      setTimeout(() => setStepTestResult(null), 5000)
    } catch {
      setStepTestResult('Netwerkfout')
      setTimeout(() => setStepTestResult(null), 5000)
    } finally { setStepTestSending(false) }
  }, [newStepSubject, newStepHeading, newStepPreheader, newStepBody, newStepCtaText, newStepCtaUrl])

  const handleStepPrecheck = useCallback(async () => {
    if (stepPrecheckAreas) { setStepPrecheckAreas(null); return }
    setStepPrecheckLoading(true)
    try {
      const res = await fetch('/api/v1/team/mail/precheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newStepSubject.trim(),
          heading: newStepHeading.trim(),
          preheader: newStepPreheader.trim() || undefined,
          body: newStepBody.trim(),
          ctaText: newStepCtaText.trim() || undefined,
          ctaUrl: newStepCtaUrl.trim() || undefined,
          segments: ['leden_maandelijks', 'leden_jaarlijks'],
        }),
      })
      const data = await res.json()
      if (res.ok) setStepPrecheckAreas(data.areas || [])
    } catch { /* Silent */ } finally { setStepPrecheckLoading(false) }
  }, [stepPrecheckAreas, newStepSubject, newStepHeading, newStepPreheader, newStepBody, newStepCtaText, newStepCtaUrl])

  const resetStepForm = useCallback(() => {
    setNewStepSubject('')
    setNewStepHeading('')
    setNewStepPreheader('')
    setNewStepBody('')
    setNewStepDelay(0)
    setNewStepCtaText('')
    setNewStepCtaUrl('')
    setEditingStepId(null)
    setStepShowPreview(false)
    setStepPreviewHtml(null)
    setStepPrecheckAreas(null)
    setStepTestResult(null)
  }, [])

  const handleEditStep = useCallback((step: SequenceStep) => {
    setEditingStepId(step.id)
    setNewStepSubject(step.subject)
    setNewStepHeading(step.heading)
    setNewStepPreheader(step.preheader || '')
    setNewStepBody(step.body)
    setNewStepDelay(step.delay_days)
    setNewStepCtaText(step.cta_text || '')
    setNewStepCtaUrl(step.cta_url || '')
    setShowAddStep(true)
    setStepShowPreview(false)
    setStepPreviewHtml(null)
    setStepPrecheckAreas(null)
    setStepTestResult(null)
  }, [])

  const handleCompare = useCallback(async () => {
    if (compareSelected.size < 2) return
    setCompareLoading(true)
    try {
      const res = await fetch('/api/v1/team/mail/campaigns/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_ids: Array.from(compareSelected) }),
      })
      const data = await res.json()
      if (res.ok) {
        setCompareResult(data.campaigns || [])
      }
    } catch {
      // Silent
    } finally {
      setCompareLoading(false)
    }
  }, [compareSelected])

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
      conditions: conditionGroups.length > 0 ? { groups: conditionGroups } : undefined,
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
          conditions: conditionGroups.length > 0 ? { groups: conditionGroups } : undefined,
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

    // Restore images from draft body HTML
    const imgRegex = /email-images\/([^"'?\s]+)/g
    const filenames: string[] = []
    let match
    while ((match = imgRegex.exec(campaign.body)) !== null) {
      filenames.push(match[1])
    }
    if (filenames.length > 0) {
      fetch(`/api/v1/team/mail/media?filenames=${filenames.join(',')}`)
        .then(res => res.json())
        .then(d => {
          const restored: UploadedImage[] = (d.media || []).map((m: MediaItem) => ({
            id: m.id,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            filename: m.filename,
            originalName: m.originalName,
            width: m.width ?? undefined,
            height: m.height ?? undefined,
            sizeBytes: m.sizeBytes,
          }))
          setUploadedImages(restored)
        })
        .catch(() => setUploadedImages([]))
    } else {
      setUploadedImages([])
    }

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
    setConditionGroups([])
    setConditionCount(null)
    setShowConditions(false)
    setEditingDraftId(null)
    setSendResult(null)
    setSendError(null)
    setSaveSuccess(false)
    setShowPreview(false)
  }, [])

  // Condition builder handlers
  const evaluateConditionsDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const evaluateConditions = useCallback(async (groups: CampaignConditionGroup[]) => {
    if (groups.length === 0 || groups.every(g => g.conditions.length === 0)) {
      setConditionCount(null)
      return
    }

    setConditionEvaluating(true)
    try {
      const res = await fetch('/api/v1/team/mail/conditions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups }),
      })
      const data = await res.json()
      if (res.ok) {
        setConditionCount(data.count)
      }
    } catch {
      // Silent
    } finally {
      setConditionEvaluating(false)
    }
  }, [])

  const triggerEvaluation = useCallback((groups: CampaignConditionGroup[]) => {
    if (evaluateConditionsDebounceRef.current) {
      clearTimeout(evaluateConditionsDebounceRef.current)
    }
    evaluateConditionsDebounceRef.current = setTimeout(() => {
      evaluateConditions(groups)
    }, 500)
  }, [evaluateConditions])

  const addConditionGroup = useCallback(() => {
    const newGroups = [...conditionGroups, { conditions: [{ type: 'campaign_delivered' as const, negated: false }] }]
    setConditionGroups(newGroups)
    triggerEvaluation(newGroups)
  }, [conditionGroups, triggerEvaluation])

  const removeConditionGroup = useCallback((groupIndex: number) => {
    const newGroups = conditionGroups.filter((_, i) => i !== groupIndex)
    setConditionGroups(newGroups)
    triggerEvaluation(newGroups)
  }, [conditionGroups, triggerEvaluation])

  const addConditionToGroup = useCallback((groupIndex: number) => {
    const newGroups = conditionGroups.map((g, i) =>
      i === groupIndex
        ? { ...g, conditions: [...g.conditions, { type: 'campaign_delivered' as const, negated: false }] }
        : g
    )
    setConditionGroups(newGroups)
    triggerEvaluation(newGroups)
  }, [conditionGroups, triggerEvaluation])

  const removeCondition = useCallback((groupIndex: number, condIndex: number) => {
    const newGroups = conditionGroups.map((g, i) =>
      i === groupIndex
        ? { ...g, conditions: g.conditions.filter((_, ci) => ci !== condIndex) }
        : g
    ).filter(g => g.conditions.length > 0) // Remove empty groups
    setConditionGroups(newGroups)
    triggerEvaluation(newGroups)
  }, [conditionGroups, triggerEvaluation])

  const updateCondition = useCallback((groupIndex: number, condIndex: number, updates: Partial<CampaignCondition>) => {
    const newGroups = conditionGroups.map((g, i) =>
      i === groupIndex
        ? {
            ...g,
            conditions: g.conditions.map((c, ci) =>
              ci === condIndex ? { ...c, ...updates } : c
            ),
          }
        : g
    )
    setConditionGroups(newGroups)
    triggerEvaluation(newGroups)
  }, [conditionGroups, triggerEvaluation])

  const handleImageUploaded = useCallback((img: UploadedImage) => {
    setUploadedImages(prev => [...prev, img])
    fetchMedia() // Refresh media library
  }, [fetchMedia])

  const handleImageDeleted = useCallback((filename: string) => {
    setUploadedImages(prev => prev.filter(img => img.filename !== filename))
    fetchMedia() // Refresh media library
  }, [fetchMedia])

  const handleMediaDelete = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/api/v1/team/mail/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMediaLibrary(prev => prev.filter(m => m.filename !== filename))
        setMediaDeleteConfirm(null)
      }
    } catch {
      // Silent
    }
  }, [])

  const handleInsertFromLibrary = useCallback((item: MediaItem) => {
    // Add to uploaded images strip if not already there
    setUploadedImages(prev => {
      if (prev.some(img => img.filename === item.filename)) return prev
      return [...prev, {
        id: item.id,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        filename: item.filename,
        originalName: item.originalName,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        sizeBytes: item.sizeBytes,
      }]
    })
  }, [])

  const handleExpandSequence = useCallback(async (sequenceId: string) => {
    if (expandedSequenceId === sequenceId) {
      setExpandedSequenceId(null)
      return
    }
    setExpandedSequenceId(sequenceId)
    setSequenceDetailLoading(true)
    setSequenceDetail(null)
    setShowAddStep(false)
    setEditingStepId(null)
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${sequenceId}`)
      const data = await res.json()
      if (res.ok) {
        setSequenceDetail(data)
      }
    } catch {
      // Silent
    } finally {
      setSequenceDetailLoading(false)
    }
  }, [expandedSequenceId])

  const handleCreateSequence = useCallback(async () => {
    if (!newSequenceName.trim()) return
    setCreatingSequence(true)
    try {
      const res = await fetch('/api/v1/team/mail/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSequenceName.trim(),
          description: newSequenceDesc.trim() || undefined,
          send_time: newSequenceTime,
        }),
      })
      if (res.ok) {
        setNewSequenceName('')
        setNewSequenceDesc('')
        setNewSequenceTime('09:00')
        setShowNewSequence(false)
        fetchSequences()
      }
    } catch {
      // Silent
    } finally {
      setCreatingSequence(false)
    }
  }, [newSequenceName, newSequenceDesc, newSequenceTime, fetchSequences])

  const handleToggleSequenceStatus = useCallback(async (seq: Sequence) => {
    const newStatus = seq.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${seq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchSequences()
        if (expandedSequenceId === seq.id) {
          handleExpandSequence(seq.id)
        }
      }
    } catch {
      // Silent
    }
  }, [fetchSequences, expandedSequenceId, handleExpandSequence])

  const handleDeleteSequence = useCallback(async (sequenceId: string) => {
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${sequenceId}`, { method: 'DELETE' })
      if (res.ok) {
        setSequences(prev => prev.filter(s => s.id !== sequenceId))
        if (expandedSequenceId === sequenceId) setExpandedSequenceId(null)
      }
    } catch {
      // Silent
    } finally {
      setConfirmDeleteSeqId(null)
    }
  }, [expandedSequenceId])

  const handleAddStep = useCallback(async () => {
    if (!expandedSequenceId || !newStepSubject.trim() || !newStepHeading.trim() || !newStepBody.trim()) return
    setAddingStep(true)
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${expandedSequenceId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newStepSubject.trim(),
          heading: newStepHeading.trim(),
          preheader: newStepPreheader.trim() || undefined,
          body: newStepBody.trim(),
          delay_days: newStepDelay,
          cta_text: newStepCtaText.trim() || undefined,
          cta_url: newStepCtaUrl.trim() || undefined,
        }),
      })
      if (res.ok) {
        resetStepForm()
        setShowAddStep(false)
        handleExpandSequence(expandedSequenceId)
        fetchSequences()
      }
    } catch {
      // Silent
    } finally {
      setAddingStep(false)
    }
  }, [expandedSequenceId, newStepSubject, newStepHeading, newStepPreheader, newStepBody, newStepDelay, newStepCtaText, newStepCtaUrl, resetStepForm, handleExpandSequence, fetchSequences])

  const handleDeleteStep = useCallback(async (stepId: string) => {
    if (!expandedSequenceId) return
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${expandedSequenceId}/steps/${stepId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        handleExpandSequence(expandedSequenceId)
        fetchSequences()
      }
    } catch {
      // Silent
    }
  }, [expandedSequenceId, handleExpandSequence, fetchSequences])

  const handleSaveStep = useCallback(async () => {
    if (!expandedSequenceId || !editingStepId) return
    setStepSaving(true)
    try {
      const res = await fetch(`/api/v1/team/mail/sequences/${expandedSequenceId}/steps/${editingStepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newStepSubject.trim(),
          heading: newStepHeading.trim(),
          preheader: newStepPreheader.trim() || null,
          body: newStepBody.trim(),
          delay_days: newStepDelay,
          cta_text: newStepCtaText.trim() || null,
          cta_url: newStepCtaUrl.trim() || null,
        }),
      })
      if (res.ok) {
        resetStepForm()
        setShowAddStep(false)
        handleExpandSequence(expandedSequenceId)
        fetchSequences()
      }
    } catch { /* Silent */ } finally { setStepSaving(false) }
  }, [expandedSequenceId, editingStepId, newStepSubject, newStepHeading, newStepPreheader, newStepBody, newStepDelay, newStepCtaText, newStepCtaUrl, resetStepForm, handleExpandSequence, fetchSequences])

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

  const previewWidth = previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : undefined
  const stepPreviewWidth = stepPreviewDevice === 'mobile' ? 375 : stepPreviewDevice === 'tablet' ? 768 : undefined

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

        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-semibold text-[var(--navy-dark)]">E-mail</h2>
          <div className="relative">
            <button
              onClick={() => setShowHelp(showHelp === 'compose' ? null : 'compose')}
              className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
              aria-label="Help over e-mail module"
              data-help-popover
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
            {showHelp === 'compose' && (
              <div data-help-popover className="absolute left-0 top-8 z-50 w-[400px] bg-white rounded-xl border border-[var(--border)] shadow-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[var(--navy-dark)]">Hoe werkt de e-mail module?</h4>
                  <button onClick={() => setShowHelp(null)} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-xs text-[var(--navy-medium)] leading-relaxed">
                  <div>
                    <p className="font-semibold text-[var(--navy-dark)] mb-1">4 tabbladen</p>
                    <ul className="space-y-0.5 ml-3 list-disc">
                      <li><strong>Nieuw bericht</strong> — campagne-e-mails schrijven en versturen</li>
                      <li><strong>Campagnes</strong> — verzonden campagnes met open/klik-statistieken</li>
                      <li><strong>Media</strong> — afbeeldingen uploaden en beheren</li>
                      <li><strong>Sequenties</strong> — automatische e-mailreeksen instellen</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--navy-dark)] mb-1">E-mail opstellen</p>
                    <ol className="space-y-0.5 ml-3 list-decimal">
                      <li>Kies de <strong>segmenten</strong> (ontvangers) via de selectievakjes</li>
                      <li>Vul <strong>onderwerp</strong>, <strong>koptekst</strong> en <strong>bericht</strong> in</li>
                      <li>Optioneel: voeg een <strong>preheader</strong> (voorbeeldtekst in inbox) en <strong>actieknop</strong> toe</li>
                      <li>Gebruik <strong>Voornaam</strong> in de werkbalk om de naam van de ontvanger in te voegen</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--navy-dark)] mb-1">Aanbevolen workflow</p>
                    <ol className="space-y-0.5 ml-3 list-decimal">
                      <li><strong>Voorbeeld</strong> — bekijk hoe de e-mail eruitziet (desktop/tablet/mobiel)</li>
                      <li><strong>Controleer</strong> — automatische controle op links, afbeeldingen en authenticatie</li>
                      <li><strong>Verstuur test</strong> — ontvang de e-mail op uw eigen adres</li>
                      <li><strong>Verzenden</strong> — verstuur naar alle geselecteerde ontvangers</li>
                    </ol>
                  </div>
                  <p className="text-[10px] text-[var(--navy-medium)]/60 pt-1">
                    Elke ontvanger krijgt een gepersonaliseerde e-mail met voornaam en een eigen afmeld-/voorkeurenlink.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

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
              <button
                onClick={() => setActiveTab('media')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'media'
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'bg-white text-[var(--navy-medium)] border border-[var(--border)] hover:bg-[var(--gray-light)] hover:text-[var(--navy-dark)]'
                }`}
              >
                <Images className="w-4 h-4" />
                Media
                {mediaLibrary.length > 0 && (
                  <span className={`ml-1 text-xs tabular-nums ${
                    activeTab === 'media' ? 'text-white/70' : 'text-[var(--navy-medium)]'
                  }`}>
                    ({mediaLibrary.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sequences')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'sequences'
                    ? 'bg-[var(--navy-dark)] text-white'
                    : 'bg-white text-[var(--navy-medium)] border border-[var(--border)] hover:bg-[var(--gray-light)] hover:text-[var(--navy-dark)]'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Sequenties
                {sequences.length > 0 && (
                  <span className={`ml-1 text-xs tabular-nums ${
                    activeTab === 'sequences' ? 'text-white/70' : 'text-[var(--navy-medium)]'
                  }`}>
                    ({sequences.length})
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

                    {/* Condition builder */}
                    <div>
                      <button
                        onClick={() => setShowConditions(!showConditions)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                      >
                        <Filter className="w-4 h-4" />
                        {showConditions ? 'Verberg condities' : 'Condities toevoegen'}
                        {conditionGroups.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] px-1 py-0.5 text-xs font-bold rounded-full bg-[var(--pink)] text-white">
                            {conditionGroups.length}
                          </span>
                        )}
                      </button>

                      {showConditions && (
                        <div className="mt-3 space-y-3">
                          {conditionGroups.length > 0 && (
                            <p className="text-xs text-[var(--navy-medium)]">
                              Groepen worden gecombineerd met EN. Condities binnen een groep met OF.
                            </p>
                          )}

                          {conditionGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="border border-[var(--border)] rounded-lg p-3 bg-[var(--gray-light)]/30">
                              {groupIndex > 0 && (
                                <div className="flex items-center gap-2 mb-2 -mt-1">
                                  <span className="text-xs font-semibold text-[var(--pink)] uppercase tracking-wider">EN</span>
                                  <div className="flex-1 border-t border-[var(--border)]" />
                                </div>
                              )}

                              <div className="space-y-2">
                                {group.conditions.map((condition, condIndex) => (
                                  <div key={condIndex}>
                                    {condIndex > 0 && (
                                      <div className="flex items-center gap-2 my-1.5 ml-2">
                                        <span className="text-xs font-medium text-[var(--navy-medium)]">OF</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      {/* Negation toggle */}
                                      <button
                                        onClick={() => updateCondition(groupIndex, condIndex, { negated: !condition.negated })}
                                        className={`shrink-0 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                                          condition.negated
                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                            : 'bg-green-50 text-green-700 border border-green-200'
                                        }`}
                                        title={condition.negated ? 'Klik om te wisselen naar WEL' : 'Klik om te wisselen naar NIET'}
                                      >
                                        {condition.negated ? 'NIET' : 'WEL'}
                                      </button>

                                      {/* Condition type */}
                                      <select
                                        value={condition.type}
                                        onChange={e => {
                                          const newType = e.target.value as CampaignCondition['type']
                                          const updates: Partial<CampaignCondition> = { type: newType }
                                          if (newType === 'engagement_level') {
                                            updates.campaign_id = undefined
                                            updates.level = 'active'
                                          } else {
                                            updates.level = undefined
                                          }
                                          updateCondition(groupIndex, condIndex, updates)
                                        }}
                                        className="rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--navy-dark)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--pink)]"
                                      >
                                        {CONDITION_TYPE_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>

                                      {/* Campaign selector (for campaign_* types) */}
                                      {condition.type.startsWith('campaign_') && (
                                        <select
                                          value={condition.campaign_id || ''}
                                          onChange={e => updateCondition(groupIndex, condIndex, { campaign_id: e.target.value || undefined })}
                                          className="flex-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--navy-dark)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--pink)] truncate"
                                        >
                                          <option value="">Selecteer campagne...</option>
                                          {sentCampaigns.map(c => (
                                            <option key={c.id} value={c.id}>
                                              {c.subject} ({formatTime(c.sent_at!)})
                                            </option>
                                          ))}
                                        </select>
                                      )}

                                      {/* Engagement level selector */}
                                      {condition.type === 'engagement_level' && (
                                        <select
                                          value={condition.level || ''}
                                          onChange={e => updateCondition(groupIndex, condIndex, { level: e.target.value || undefined })}
                                          className="rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--navy-dark)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--pink)]"
                                        >
                                          {ENGAGEMENT_LEVEL_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      )}

                                      {/* Remove condition */}
                                      <button
                                        onClick={() => removeCondition(groupIndex, condIndex)}
                                        className="shrink-0 p-1 text-[var(--navy-medium)] hover:text-red-500 transition-colors"
                                        title="Verwijder conditie"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => addConditionToGroup(groupIndex)}
                                    className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                                  >
                                    + OF conditie
                                  </button>
                                  <span className="text-[var(--navy-medium)]/30">|</span>
                                  <button
                                    onClick={() => removeConditionGroup(groupIndex)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    Verwijder groep
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={addConditionGroup}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pink)] hover:text-[var(--pink-hover)] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {conditionGroups.length === 0 ? 'Conditiegroep toevoegen' : 'EN groep toevoegen'}
                          </button>

                          {conditionGroups.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              {conditionEvaluating ? (
                                <span className="text-[var(--navy-medium)] flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Evalueren...
                                </span>
                              ) : conditionCount !== null ? (
                                <span className="text-[var(--navy-dark)] font-medium">
                                  {conditionCount} ontvanger{conditionCount !== 1 ? 's' : ''} voldoen aan condities
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
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
                        mediaLibrary={mediaLibrary}
                        onInsertMedia={handleInsertFromLibrary}
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
                    <div className="flex flex-wrap items-center gap-3 pt-2">
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
                        onClick={handlePrecheck}
                        disabled={!bodyHasContent || precheckLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {precheckLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {precheckAreas ? 'Verberg controle' : 'Controleer'}
                      </button>

                      <button
                        onClick={handleTestEmail}
                        disabled={!canSend || testSending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {testSending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : testResult ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <SendHorizontal className="w-4 h-4" />
                        )}
                        {testResult || 'Verstuur test'}
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

                {/* Pre-send checklist */}
                {precheckAreas && (
                  <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
                    <h3 className="text-sm font-semibold text-[var(--navy-dark)] mb-3">Pre-send controle</h3>
                    <div className="space-y-3">
                      {precheckAreas.map(area => (
                        <div key={area.area}>
                          <div className="flex items-center gap-2 mb-1.5">
                            {area.pass ? (
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="text-sm font-medium text-[var(--navy-dark)]">{area.area}</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {area.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className={item.pass ? 'text-green-600' : 'text-red-500'}>
                                  {item.pass ? '\u2713' : '\u2717'}
                                </span>
                                <div>
                                  <span className={item.pass ? 'text-[var(--navy-medium)]' : 'text-[var(--navy-dark)]'}>
                                    {item.label}
                                  </span>
                                  {item.fix && (
                                    <p className="text-[var(--navy-medium)] mt-0.5">{item.fix}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email preview — server-rendered iframe with device toggle */}
                {showPreview && previewHtml && (
                  <div className="bg-white rounded-lg border border-[var(--border)] p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[var(--navy-dark)]">Voorbeeld</h3>
                      <div className="flex items-center gap-1">
                        {([
                          { device: 'desktop' as const, icon: Monitor, label: 'Desktop' },
                          { device: 'tablet' as const, icon: Tablet, label: 'Tablet' },
                          { device: 'mobile' as const, icon: Smartphone, label: 'Mobiel' },
                        ]).map(({ device, icon: Icon, label }) => (
                          <button
                            key={device}
                            onClick={() => setPreviewDevice(device)}
                            className={`p-1.5 rounded transition-colors ${
                              previewDevice === device
                                ? 'bg-[var(--navy-dark)] text-white'
                                : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:bg-[var(--gray-light)]'
                            }`}
                            title={label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="bg-[var(--gray-light)] px-4 py-2 text-xs text-[var(--navy-medium)] border-b border-[var(--border)]">
                        <span className="font-medium">Onderwerp:</span> {subject}
                        {preheader && (
                          <span className="ml-3 text-[var(--navy-medium)]/60">— {preheader}</span>
                        )}
                      </div>
                      <div className="flex justify-center bg-[#f0f0f0]">
                        <iframe
                          srcDoc={previewHtml}
                          sandbox=""
                          title="E-mail voorbeeld"
                          className="border-0 bg-white transition-all duration-300"
                          style={{
                            width: previewWidth || '100%',
                            maxWidth: '100%',
                            height: 600,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tab content: Media Library */}
            {activeTab === 'media' && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                {/* Upload zone */}
                <div className="mb-6">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-lg p-6 cursor-pointer hover:border-[var(--pink)] hover:bg-[var(--gray-light)]/50 transition-colors">
                    <Upload className="w-8 h-8 text-[var(--navy-medium)] mb-2" />
                    <span className="text-sm font-medium text-[var(--navy-dark)]">Afbeelding uploaden</span>
                    <span className="text-xs text-[var(--navy-medium)] mt-1">JPEG, PNG, GIF of WebP — max 2MB — wordt geoptimaliseerd tot max 960px breed</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        e.target.value = ''

                        const formData = new FormData()
                        formData.append('file', file)

                        try {
                          const res = await fetch('/api/v1/team/mail/upload', {
                            method: 'POST',
                            body: formData,
                          })
                          const data = await res.json()
                          if (res.ok) {
                            fetchMedia()
                          } else {
                            alert(data.error || 'Upload mislukt')
                          }
                        } catch {
                          alert('Upload mislukt — controleer uw verbinding')
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Media grid */}
                {mediaLoading ? (
                  <div className="animate-pulse grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="aspect-square bg-[var(--gray-light)] rounded-lg" />
                    ))}
                  </div>
                ) : mediaLibrary.length === 0 ? (
                  <p className="text-sm text-[var(--navy-medium)] text-center py-8">
                    Nog geen afbeeldingen geüpload.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {mediaLibrary.map(item => (
                      <div
                        key={item.id}
                        className="group relative bg-[var(--gray-light)] rounded-lg border border-[var(--border)] overflow-hidden"
                      >
                        <div className="aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnailUrl}
                            alt={item.altText || item.originalName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="text-[11px] font-medium text-[var(--navy-dark)] truncate" title={item.originalName}>
                            {item.originalName}
                          </p>
                          <p className="text-[10px] text-[var(--navy-medium)]">
                            {item.width && item.height ? `${item.width}×${item.height}` : ''}
                            {item.sizeBytes ? ` — ${(item.sizeBytes / 1024).toFixed(0)} KB` : ''}
                          </p>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {mediaDeleteConfirm === item.id ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleMediaDelete(item.filename)}
                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                Verwijder
                              </button>
                              <button
                                onClick={() => setMediaDeleteConfirm(null)}
                                className="px-3 py-1 text-xs text-white/80 hover:text-white transition-colors"
                              >
                                Annuleer
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setMediaDeleteConfirm(item.id)}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab content: Campaigns */}
            {activeTab === 'campaigns' && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                {/* Comparison mode toggle */}
                {sentCampaigns.length >= 2 && (
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        setCompareMode(!compareMode)
                        setCompareSelected(new Set())
                        setCompareResult(null)
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        compareMode
                          ? 'bg-[var(--navy-dark)] text-white'
                          : 'text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)]'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Vergelijken
                    </button>
                    {compareMode && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--navy-medium)]">
                          {compareSelected.size} geselecteerd (2-4)
                        </span>
                        <button
                          onClick={handleCompare}
                          disabled={compareSelected.size < 2 || compareLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors disabled:opacity-50"
                        >
                          {compareLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          Vergelijk
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Comparison result */}
                {compareResult && (
                  <div className="mb-6 overflow-x-auto rounded border border-[var(--border)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--gray-light)] text-left">
                          <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Campagne</th>
                          <th className="px-3 py-2 font-medium text-[var(--navy-dark)] text-right">Verstuurd</th>
                          <th className="px-3 py-2 font-medium text-[var(--navy-dark)] text-right">Open %</th>
                          <th className="px-3 py-2 font-medium text-[var(--navy-dark)] text-right">Klik %</th>
                          <th className="px-3 py-2 font-medium text-[var(--navy-dark)] text-right">Bounce %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {compareResult.map(c => (
                          <tr key={c.id}>
                            <td className="px-3 py-2 text-[var(--navy-dark)] font-medium max-w-[200px] truncate">{c.subject}</td>
                            <td className="px-3 py-2 text-[var(--navy-medium)] text-right tabular-nums">{c.sent_count}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              <span className="text-blue-600">{c.open_rate.toFixed(1)}%</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              <span className="text-[var(--pink)]">{c.click_rate.toFixed(1)}%</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              <span className={c.bounce_rate > 5 ? 'text-[var(--error)]' : 'text-[var(--navy-medium)]'}>
                                {c.bounce_rate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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
                                      {compareMode && (
                                        <input
                                          type="checkbox"
                                          checked={compareSelected.has(campaign.id)}
                                          onChange={() => {
                                            setCompareSelected(prev => {
                                              const next = new Set(prev)
                                              if (next.has(campaign.id)) next.delete(campaign.id)
                                              else if (next.size < 4) next.add(campaign.id)
                                              return next
                                            })
                                          }}
                                          className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--pink)] focus:ring-[var(--pink)]"
                                        />
                                      )}
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

                                {/* Expanded: campaign detail with recipients, links, devices */}
                                {isExpanded && (
                                  <div className="mt-3 ml-5">
                                    {recipientsLoading ? (
                                      <div className="animate-pulse h-20 bg-[var(--gray-light)] rounded" />
                                    ) : !campaignDetail || campaignDetail.recipients.length === 0 ? (
                                      <p className="text-xs text-[var(--navy-medium)]">Nog geen events ontvangen van Resend.</p>
                                    ) : (
                                      <>
                                        {/* Link stats */}
                                        {campaignDetail.link_stats.length > 0 && (
                                          <div className="mb-4">
                                            <h4 className="text-xs font-semibold text-[var(--navy-dark)] mb-2 flex items-center gap-1.5">
                                              <Link2 className="w-3.5 h-3.5" />
                                              Geklikte links
                                            </h4>
                                            <div className="space-y-1.5">
                                              {campaignDetail.link_stats.map((ls, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs">
                                                  <a
                                                    href={ls.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[var(--link)] hover:underline truncate max-w-[70%]"
                                                  >
                                                    {ls.url.replace(/^https?:\/\//, '').slice(0, 60)}
                                                  </a>
                                                  <span className="text-[var(--navy-medium)] tabular-nums">
                                                    {ls.unique_clickers} uniek / {ls.total_clicks} totaal
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Device/Client stats */}
                                        {(campaignDetail.device_stats.clients.length > 0 ||
                                          campaignDetail.device_stats.devices.length > 0 ||
                                          campaignDetail.device_stats.operating_systems.length > 0) && (
                                          <div className="mb-4 grid grid-cols-3 gap-4">
                                            {[
                                              { label: 'E-mailclient', items: campaignDetail.device_stats.clients },
                                              { label: 'Apparaat', items: campaignDetail.device_stats.devices },
                                              { label: 'OS', items: campaignDetail.device_stats.operating_systems },
                                            ].map(({ label, items }) => {
                                              if (items.length === 0) return null
                                              const maxCount = Math.max(...items.map(i => i.count))
                                              return (
                                                <div key={label}>
                                                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--navy-medium)] mb-1.5">{label}</h5>
                                                  <div className="space-y-1">
                                                    {items.slice(0, 5).map((item, idx) => (
                                                      <div key={idx} className="text-xs">
                                                        <div className="flex justify-between mb-0.5">
                                                          <span className="text-[var(--navy-dark)] truncate">{item.name || 'Onbekend'}</span>
                                                          <span className="text-[var(--navy-medium)] tabular-nums ml-2">{item.count}</span>
                                                        </div>
                                                        <div className="h-1 bg-[var(--gray-light)] rounded-full overflow-hidden">
                                                          <div
                                                            className="h-full bg-[var(--navy-dark)]/30 rounded-full"
                                                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                                                          />
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}

                                        {/* Recipients table */}
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
                                              {campaignDetail.recipients.map(r => (
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
            {/* Tab content: Sequences */}
            {activeTab === 'sequences' && (
              <div className="bg-white rounded-lg border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--navy-dark)]">Sequenties</h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowHelp(showHelp === 'sequences' ? null : 'sequences')}
                        className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                        aria-label="Help over sequenties"
                        data-help-popover
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                      {showHelp === 'sequences' && (
                        <div data-help-popover className="absolute left-0 top-7 z-50 w-[380px] bg-white rounded-xl border border-[var(--border)] shadow-lg p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-sm font-semibold text-[var(--navy-dark)]">Hoe werken sequenties?</h4>
                            <button onClick={() => setShowHelp(null)} className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3 text-xs text-[var(--navy-medium)] leading-relaxed">
                            <p>
                              Een sequentie is een reeks e-mails die automatisch worden verstuurd na inschrijving van een lid.
                              Denk aan een welkomserie of onboarding-reeks.
                            </p>
                            <div>
                              <p className="font-semibold text-[var(--navy-dark)] mb-1">Sequentie instellen</p>
                              <ol className="space-y-0.5 ml-3 list-decimal">
                                <li>Klik op <strong>Nieuwe sequentie</strong> en geef een naam op</li>
                                <li>Kies een <strong>verzendtijd</strong> (bijv. 09:00) — dit is het tijdstip waarop e-mails worden verstuurd</li>
                                <li>Voeg <strong>stappen</strong> toe — elke stap is een e-mail met een onderwerp, koptekst en bericht</li>
                                <li>Stel per stap een <strong>vertraging</strong> in (aantal dagen na inschrijving)</li>
                                <li>Zet de status op <strong>Actief</strong> wanneer de sequentie klaar is</li>
                              </ol>
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--navy-dark)] mb-1">Hoe het werkt</p>
                              <ul className="space-y-0.5 ml-3 list-disc">
                                <li>Nieuwe leden worden automatisch ingeschreven bij het uitnodigen</li>
                                <li>Elke werkdag op de ingestelde verzendtijd worden e-mails verstuurd</li>
                                <li>De vertraging per stap bepaalt wanneer de volgende e-mail wordt verstuurd</li>
                                <li>Afgemelde of gebounste personen worden automatisch overgeslagen</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--navy-dark)] mb-1">Voorbeeld</p>
                              <p>
                                Welkomserie met 3 stappen: dag 0 (direct welkomstmail), dag 2 (tips voor gebruik),
                                dag 5 (overzicht van functies). Verzendtijd 09:00 — alle e-mails gaan om 09:00 uit op werkdagen.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewSequence(!showNewSequence)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nieuwe sequentie
                  </button>
                </div>

                {/* Create new sequence form */}
                {showNewSequence && (
                  <div className="mb-4 p-4 bg-[var(--gray-light)] rounded-lg border border-[var(--border)]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--navy-dark)] mb-1">Naam</label>
                        <input
                          type="text"
                          value={newSequenceName}
                          onChange={e => setNewSequenceName(e.target.value)}
                          placeholder="Bijv. Welkom-serie"
                          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--navy-dark)] mb-1">Beschrijving (optioneel)</label>
                        <input
                          type="text"
                          value={newSequenceDesc}
                          onChange={e => setNewSequenceDesc(e.target.value)}
                          placeholder="Korte beschrijving van de sequentie"
                          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--navy-dark)] mb-1">Verzendtijd</label>
                        <select
                          value={newSequenceTime}
                          onChange={e => setNewSequenceTime(e.target.value)}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent bg-white"
                        >
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="12:00">12:00</option>
                          <option value="14:00">14:00</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCreateSequence}
                          disabled={!newSequenceName.trim() || creatingSequence}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors disabled:opacity-50"
                        >
                          {creatingSequence ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Aanmaken
                        </button>
                        <button
                          onClick={() => setShowNewSequence(false)}
                          className="px-3 py-1.5 text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sequences list */}
                {sequencesLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 bg-[var(--gray-light)] rounded" />
                    ))}
                  </div>
                ) : sequences.length === 0 ? (
                  <p className="text-sm text-[var(--navy-medium)] text-center py-8">
                    Nog geen sequenties aangemaakt.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {sequences.map(seq => {
                      const isExpanded = expandedSequenceId === seq.id
                      const statusColors: Record<string, string> = {
                        draft: 'bg-amber-100 text-amber-800',
                        active: 'bg-green-100 text-green-800',
                        paused: 'bg-gray-100 text-gray-600',
                      }
                      const statusLabels: Record<string, string> = {
                        draft: 'Concept',
                        active: 'Actief',
                        paused: 'Gepauzeerd',
                      }

                      return (
                        <div key={seq.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleExpandSequence(seq.id)}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--navy-dark)] hover:text-[var(--pink)] transition-colors"
                                >
                                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  {seq.name}
                                </button>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[seq.status] || ''}`}>
                                  {statusLabels[seq.status] || seq.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-[var(--navy-medium)]">
                                <span className="flex items-center gap-1">
                                  <GripVertical className="w-3 h-3" />
                                  {seq.step_count} stap{seq.step_count !== 1 ? 'pen' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {seq.enrollment_active} actief / {seq.enrollment_total} totaal
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {seq.send_time?.slice(0, 5) || '09:00'}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                              {seq.status !== 'draft' && (
                                <button
                                  onClick={() => handleToggleSequenceStatus(seq)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] hover:bg-[var(--gray-light)] rounded-lg transition-colors"
                                  title={seq.status === 'active' ? 'Pauzeren' : 'Activeren'}
                                >
                                  {seq.status === 'active' ? (
                                    <><Pause className="w-3.5 h-3.5" /> Pauzeer</>
                                  ) : (
                                    <><Play className="w-3.5 h-3.5" /> Activeer</>
                                  )}
                                </button>
                              )}
                              {seq.status === 'draft' && (
                                <button
                                  onClick={() => handleToggleSequenceStatus(seq)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5" /> Activeer
                                </button>
                              )}
                              {confirmDeleteSeqId === seq.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteSequence(seq.id)}
                                    className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                  >
                                    Verwijder
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteSeqId(null)}
                                    className="px-2 py-1.5 text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                                  >
                                    Annuleer
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteSeqId(seq.id)}
                                  className="inline-flex items-center p-1.5 text-[var(--navy-medium)] hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                  title="Verwijder sequentie"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded: sequence detail */}
                          {isExpanded && (
                            <div className="mt-3 ml-5">
                              {sequenceDetailLoading ? (
                                <div className="animate-pulse h-20 bg-[var(--gray-light)] rounded" />
                              ) : !sequenceDetail ? (
                                <p className="text-xs text-[var(--navy-medium)]">Fout bij laden details.</p>
                              ) : (
                                <>
                                  {/* Description */}
                                  {sequenceDetail.sequence.description && (
                                    <p className="text-xs text-[var(--navy-medium)] mb-3 italic">
                                      {sequenceDetail.sequence.description}
                                    </p>
                                  )}

                                  {/* Steps */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--navy-medium)]">
                                        Stappen
                                      </h4>
                                      <button
                                        onClick={() => {
                                          if (showAddStep && !editingStepId) {
                                            setShowAddStep(false)
                                          } else {
                                            resetStepForm()
                                            setShowAddStep(true)
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--pink)] hover:bg-[var(--gray-light)] rounded transition-colors"
                                      >
                                        <Plus className="w-3 h-3" /> Stap toevoegen
                                      </button>
                                    </div>

                                    {sequenceDetail.steps.length === 0 ? (
                                      <p className="text-xs text-[var(--navy-medium)] py-2">
                                        Nog geen stappen. Voeg de eerste e-mail toe.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {sequenceDetail.steps.map((step, idx) => (
                                          <div
                                            key={step.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                              editingStepId === step.id
                                                ? 'bg-[var(--navy-dark)]/5 border-[var(--navy-dark)]/20'
                                                : 'bg-[var(--gray-light)] border-[var(--border)] hover:border-[var(--navy-medium)]/30'
                                            }`}
                                            onClick={() => {
                                              if (editingStepId !== step.id) handleEditStep(step)
                                            }}
                                          >
                                            <div className="w-6 h-6 rounded-full bg-[var(--navy-dark)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[var(--navy-dark)] truncate">
                                                  {step.subject}
                                                </span>
                                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-white text-[var(--navy-medium)] border border-[var(--border)]">
                                                  {step.delay_days === 0 ? 'Direct' : `+${step.delay_days} dag${step.delay_days !== 1 ? 'en' : ''}`}
                                                </span>
                                              </div>
                                              <p className="text-xs text-[var(--navy-medium)] mt-0.5 truncate">
                                                {step.heading}
                                              </p>
                                              {step.cta_text && (
                                                <p className="text-[10px] text-[var(--pink)] mt-0.5">
                                                  CTA: {step.cta_text}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <Pencil className="w-3 h-3 text-[var(--navy-medium)]" />
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id) }}
                                                className="p-1 text-[var(--navy-medium)] hover:text-red-600 transition-colors"
                                                title="Verwijder stap"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Add/Edit step form — full compose experience */}
                                    {showAddStep && (
                                      <div className="mt-3 bg-white rounded-lg border border-[var(--border)] p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-xs font-semibold text-[var(--navy-dark)]">
                                            {editingStepId ? 'Stap bewerken' : 'Nieuwe stap'}
                                          </h5>
                                          <button
                                            onClick={() => { resetStepForm(); setShowAddStep(false) }}
                                            className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)]"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>

                                        {/* Vertraging */}
                                        <div className="flex items-center gap-3">
                                          <label className="text-xs font-medium text-[var(--navy-dark)]">Vertraging:</label>
                                          <input
                                            type="number"
                                            min={0}
                                            max={365}
                                            value={newStepDelay}
                                            onChange={e => setNewStepDelay(parseInt(e.target.value) || 0)}
                                            className="w-20 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--navy-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--pink)]"
                                          />
                                          <span className="text-xs text-[var(--navy-medium)]">
                                            {newStepDelay === 0 ? 'Direct na inschrijving' : `${newStepDelay} dag${newStepDelay !== 1 ? 'en' : ''} na inschrijving`}
                                          </span>
                                        </div>

                                        {/* Onderwerp */}
                                        <div>
                                          <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Onderwerp</label>
                                          <input
                                            type="text"
                                            value={newStepSubject}
                                            onChange={e => setNewStepSubject(e.target.value)}
                                            placeholder="Onderwerp van het e-mailbericht"
                                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                                          />
                                        </div>

                                        {/* Preheader */}
                                        <div>
                                          <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                                            Preheader <span className="text-[var(--navy-medium)] font-normal">(optioneel)</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={newStepPreheader}
                                            onChange={e => setNewStepPreheader(e.target.value)}
                                            placeholder="Voorbeeldtekst naast het onderwerp in de inbox"
                                            maxLength={150}
                                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                                          />
                                          <p className="text-[10px] text-[var(--navy-medium)] mt-1">Wordt getoond naast het onderwerp in de inbox van de ontvanger. Max 150 tekens.</p>
                                        </div>

                                        {/* Koptekst */}
                                        <div>
                                          <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Koptekst</label>
                                          <input
                                            type="text"
                                            value={newStepHeading}
                                            onChange={e => setNewStepHeading(e.target.value)}
                                            placeholder="Titel in het e-mailbericht"
                                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                                          />
                                        </div>

                                        {/* Rich text editor */}
                                        <div>
                                          <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">Bericht</label>
                                          <EmailEditor
                                            value={newStepBody}
                                            onChange={setNewStepBody}
                                            uploadedImages={[]}
                                            onImageUploaded={() => {}}
                                            onImageDeleted={() => {}}
                                            mediaLibrary={mediaLibrary}
                                            onInsertMedia={handleInsertFromLibrary}
                                          />
                                        </div>

                                        {/* CTA */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                                              Knoptekst <span className="text-[var(--navy-medium)] font-normal">(optioneel)</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={newStepCtaText}
                                              onChange={e => setNewStepCtaText(e.target.value)}
                                              placeholder="Bijv. Bekijk op Rijksuitgaven"
                                              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-[var(--navy-dark)] mb-1">
                                              Knop URL <span className="text-[var(--navy-medium)] font-normal">(optioneel)</span>
                                            </label>
                                            <input
                                              type="url"
                                              value={newStepCtaUrl}
                                              onChange={e => setNewStepCtaUrl(e.target.value)}
                                              placeholder="https://beta.rijksuitgaven.nl"
                                              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy-dark)] placeholder:text-[var(--navy-medium)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-transparent"
                                            />
                                          </div>
                                        </div>

                                        {/* Action bar */}
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
                                          <button
                                            onClick={handleStepPreview}
                                            disabled={stepPreviewLoading || !newStepBody.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--gray-light)] transition-colors disabled:opacity-50"
                                          >
                                            {stepPreviewLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                            Voorbeeld
                                          </button>
                                          <button
                                            onClick={handleStepPrecheck}
                                            disabled={stepPrecheckLoading || !newStepBody.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--gray-light)] transition-colors disabled:opacity-50"
                                          >
                                            {stepPrecheckLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                            Controleer
                                          </button>
                                          <button
                                            onClick={handleStepTestEmail}
                                            disabled={stepTestSending || !newStepSubject.trim() || !newStepBody.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--navy-dark)] bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--gray-light)] transition-colors disabled:opacity-50"
                                          >
                                            {stepTestSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
                                            Verstuur test
                                          </button>
                                          {stepTestResult && (
                                            <span className="text-xs text-green-600">{stepTestResult}</span>
                                          )}

                                          <div className="flex-1" />

                                          {editingStepId ? (
                                            <button
                                              onClick={handleSaveStep}
                                              disabled={!newStepSubject.trim() || !newStepHeading.trim() || !newStepBody.trim() || stepSaving}
                                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors disabled:opacity-50"
                                            >
                                              {stepSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                              Opslaan
                                            </button>
                                          ) : (
                                            <button
                                              onClick={handleAddStep}
                                              disabled={!newStepSubject.trim() || !newStepHeading.trim() || !newStepBody.trim() || addingStep}
                                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--pink)] hover:bg-[var(--pink-hover)] rounded-lg transition-colors disabled:opacity-50"
                                            >
                                              {addingStep ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                              Toevoegen
                                            </button>
                                          )}
                                        </div>

                                        {/* Precheck panel */}
                                        {stepPrecheckAreas && (
                                          <div className="rounded-lg border border-[var(--border)] p-4">
                                            <h5 className="text-xs font-semibold text-[var(--navy-dark)] mb-2">Pre-send controle</h5>
                                            <div className="space-y-2">
                                              {stepPrecheckAreas.map(area => (
                                                <div key={area.area}>
                                                  <div className="flex items-center gap-2 mb-1">
                                                    {area.pass ? (
                                                      <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                    ) : (
                                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                    <span className="text-xs font-medium text-[var(--navy-dark)]">{area.area}</span>
                                                  </div>
                                                  <div className="ml-5 space-y-0.5">
                                                    {area.items.map((item, idx) => (
                                                      <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                                                        <span className={item.pass ? 'text-green-600' : 'text-red-500'}>
                                                          {item.pass ? '\u2713' : '\u2717'}
                                                        </span>
                                                        <div>
                                                          <span className={item.pass ? 'text-[var(--navy-medium)]' : 'text-[var(--navy-dark)]'}>
                                                            {item.label}
                                                          </span>
                                                          {item.fix && <p className="text-[var(--navy-medium)]">{item.fix}</p>}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Preview panel */}
                                        {stepShowPreview && stepPreviewHtml && (
                                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2 bg-[var(--gray-light)] border-b border-[var(--border)]">
                                              <h5 className="text-xs font-semibold text-[var(--navy-dark)]">Voorbeeld</h5>
                                              <div className="flex items-center gap-1">
                                                {([
                                                  { device: 'desktop' as const, icon: Monitor, label: 'Desktop' },
                                                  { device: 'tablet' as const, icon: Tablet, label: 'Tablet' },
                                                  { device: 'mobile' as const, icon: Smartphone, label: 'Mobiel' },
                                                ]).map(({ device, icon: Icon, label }) => (
                                                  <button
                                                    key={device}
                                                    onClick={() => setStepPreviewDevice(device)}
                                                    className={`p-1.5 rounded transition-colors ${
                                                      stepPreviewDevice === device
                                                        ? 'bg-[var(--navy-dark)] text-white'
                                                        : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:bg-white'
                                                    }`}
                                                    title={label}
                                                  >
                                                    <Icon className="w-4 h-4" />
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="bg-[var(--gray-light)] px-4 py-2 text-xs text-[var(--navy-medium)] border-b border-[var(--border)]">
                                              <span className="font-medium">Onderwerp:</span> {newStepSubject}
                                              {newStepPreheader && (
                                                <span className="ml-3 text-[var(--navy-medium)]/60">— {newStepPreheader}</span>
                                              )}
                                            </div>
                                            <div className="flex justify-center bg-[#f0f0f0]">
                                              <iframe
                                                srcDoc={stepPreviewHtml}
                                                sandbox=""
                                                title="Stap voorbeeld"
                                                className="border-0 bg-white transition-all duration-300"
                                                style={{
                                                  width: stepPreviewWidth || '100%',
                                                  maxWidth: '100%',
                                                  height: 500,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Enrollments */}
                                  {sequenceDetail.enrollments.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--navy-medium)] mb-2">
                                        Ingeschreven ({sequenceDetail.enrollments.length})
                                      </h4>
                                      <div className="overflow-x-auto rounded border border-[var(--border)]">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-[var(--gray-light)] text-left">
                                              <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Persoon</th>
                                              <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Stap</th>
                                              <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Status</th>
                                              <th className="px-3 py-2 font-medium text-[var(--navy-dark)]">Ingeschreven</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[var(--border)]">
                                            {sequenceDetail.enrollments.map(enr => {
                                              const enrStatusColors: Record<string, string> = {
                                                active: 'text-green-700 bg-green-50',
                                                completed: 'text-blue-700 bg-blue-50',
                                                paused: 'text-gray-600 bg-gray-50',
                                                cancelled: 'text-red-600 bg-red-50',
                                              }
                                              const enrStatusLabels: Record<string, string> = {
                                                active: 'Actief',
                                                completed: 'Voltooid',
                                                paused: 'Gepauzeerd',
                                                cancelled: 'Geannuleerd',
                                              }
                                              return (
                                                <tr key={enr.id} className="hover:bg-[var(--gray-light)]/50">
                                                  <td className="px-3 py-2">
                                                    <div className="text-[var(--navy-dark)]">{enr.first_name || '—'}</div>
                                                    <div className="text-[var(--navy-medium)]">{enr.email || '—'}</div>
                                                  </td>
                                                  <td className="px-3 py-2 text-[var(--navy-medium)] tabular-nums">
                                                    {enr.current_step} / {sequenceDetail.steps.length}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${enrStatusColors[enr.status] || ''}`}>
                                                      {enrStatusLabels[enr.status] || enr.status}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2 text-[var(--navy-medium)]">
                                                    {new Date(enr.enrolled_at).toLocaleDateString('nl-NL', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                    })}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
