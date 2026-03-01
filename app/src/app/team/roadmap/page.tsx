'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'

/* ── Types ────────────────────────────────────────────── */

type TrackKey = 'v' | 'a' | 'm' | 'd'
type VersionStatus = 'live' | 'building' | 'staging' | 'planned' | 'in_progress'
type FeatureStatus = 'done' | 'staging' | 'in_progress' | 'planned' | 'backlogged'

interface Feature {
  id: string | null
  title: string
  version: string
  status: FeatureStatus
  source: 'versioning' | 'backlog'
}

interface Version {
  id: string
  name: string
  status: VersionStatus
  features_total: number
  features_done: number
  features: Feature[]
  timeline?: string
  objective?: string
  objectiveClear: boolean
  children: Version[]
}

interface TrackData {
  key: TrackKey
  name: string
  releases: Version[]
  backlog: Feature[]
}

/* ── Constants ────────────────────────────────────────── */

const TRACK_TABS: { key: TrackKey; label: string; description: string }[] = [
  { key: 'v', label: 'End-user', description: 'Zoekplatform en gebruikersfuncties' },
  { key: 'a', label: 'Admin', description: 'Beheer, CRM en interne tooling' },
  { key: 'm', label: 'Launch', description: 'Marketing, SEO en lanceringsinfrastructuur' },
  { key: 'd', label: 'Data', description: 'Datasets, jaarupdates en datacorrecties' },
]

const STATUS_COLOR: Record<VersionStatus, string> = {
  live: '#16a34a',
  building: '#2563eb',
  staging: '#d97706',
  in_progress: '#2563eb',
  planned: '#9ca3af',
}

const STATUS_BG: Record<VersionStatus, string> = {
  live: 'bg-green-50 text-green-700 border-green-200',
  building: 'bg-blue-50 text-blue-700 border-blue-200',
  staging: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  planned: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABEL: Record<VersionStatus, string> = {
  live: 'Live',
  building: 'Building',
  staging: 'Staging',
  in_progress: 'In progress',
  planned: 'Planned',
}

const FEATURE_STATUS_DOT: Record<FeatureStatus, { color: string; icon: string }> = {
  done: { color: '#16a34a', icon: '●' },
  staging: { color: '#d97706', icon: '◐' },
  in_progress: { color: '#2563eb', icon: '◐' },
  planned: { color: '#d1d5db', icon: '○' },
  backlogged: { color: '#d1d5db', icon: '○' },
}

/* ── Sub-components ───────────────────────────────────── */

function ProgressBar({ done, total, height = 6 }: { done: number; total: number; height?: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? '#16a34a' : 'var(--pink)',
          }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--navy-medium)] w-[32px] text-right">
        {pct}%
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: VersionStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BG[status]}`}>
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}

function FeatureRow({ feature }: { feature: Feature }) {
  const dot = FEATURE_STATUS_DOT[feature.status]
  return (
    <div className="flex items-center gap-3 py-1.5 px-3 text-[13px] group hover:bg-gray-50/80 rounded">
      <span style={{ color: dot.color }} className="text-xs w-3 text-center shrink-0">
        {dot.icon}
      </span>
      <span className="text-[var(--navy-medium)] font-mono text-[11px] w-[52px] shrink-0">
        {feature.id || '—'}
      </span>
      <span className="text-[var(--navy-dark)] flex-1 truncate">
        {feature.title}
      </span>
    </div>
  )
}

function SubReleaseRow({ version }: { version: Version }) {
  const [expanded, setExpanded] = useState(false)
  const pct = version.features_total > 0
    ? Math.round((version.features_done / version.features_total) * 100)
    : 0

  // Status dot
  let dotIcon = '○'
  let dotColor = '#d1d5db'
  if (version.status === 'live') { dotIcon = '●'; dotColor = '#16a34a' }
  else if (version.status === 'building' || version.status === 'in_progress') { dotIcon = '◐'; dotColor = '#2563eb' }
  else if (version.status === 'staging') { dotIcon = '◐'; dotColor = '#d97706' }

  const hasFeatures = version.features.length > 0

  return (
    <div>
      <button
        onClick={() => hasFeatures && setExpanded(e => !e)}
        className={`w-full flex items-center gap-3 py-2 px-3 text-left rounded-md transition-colors ${
          hasFeatures ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
        } ${expanded ? 'bg-gray-50/60' : ''}`}
      >
        {/* Expand chevron */}
        <span className={`w-3 text-[10px] text-[var(--navy-medium)] shrink-0 transition-transform ${expanded ? 'rotate-90' : ''} ${!hasFeatures ? 'opacity-0' : ''}`}>
          ▶
        </span>

        {/* Status dot */}
        <span style={{ color: dotColor }} className="text-xs shrink-0">
          {dotIcon}
        </span>

        {/* Version ID */}
        <span className="text-[13px] font-mono font-semibold text-[var(--navy-dark)] w-[48px] shrink-0">
          {version.id}
        </span>

        {/* Name */}
        <span className="text-[13px] text-[var(--navy-dark)] flex-1 truncate">
          {version.name}
        </span>

        {/* Status badge */}
        <StatusBadge status={version.status} />

        {/* Progress */}
        <span className="text-[11px] tabular-nums text-[var(--navy-medium)] w-[36px] text-right shrink-0">
          {version.features_done}/{version.features_total}
        </span>

        {/* Mini bar */}
        <div className="w-[60px] shrink-0">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundColor: pct === 100 ? '#16a34a' : 'var(--pink)',
              }}
            />
          </div>
        </div>
      </button>

      {/* Expanded features */}
      {expanded && hasFeatures && (
        <div className="ml-[22px] pl-3 border-l-2 border-gray-100 mb-1">
          {version.features.map((f, i) => (
            <FeatureRow key={`${f.version}-${i}`} feature={f} />
          ))}
        </div>
      )}
    </div>
  )
}

function InitiativeCard({ release }: { release: Version }) {
  const [expanded, setExpanded] = useState(
    release.status === 'live' || release.status === 'building' || release.status === 'in_progress'
  )

  const borderColor = STATUS_COLOR[release.status]
  const hasChildren = release.children.length > 0 || release.features.length > 0

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-white transition-shadow hover:shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 cursor-pointer"
      >
        {/* Expand chevron */}
        <span className={`mt-0.5 text-xs text-[var(--navy-medium)] transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-[15px] font-semibold text-[var(--navy-dark)]">
              {release.id}
              <span className="ml-2 font-medium">{release.name}</span>
            </h3>
            <StatusBadge status={release.status} />
            {release.timeline && (
              <span className="text-[11px] text-[var(--navy-medium)]">{release.timeline}</span>
            )}
          </div>

          {/* Objective */}
          {release.objective && (
            <p className="text-[13px] text-[var(--navy-medium)] mt-1.5 leading-relaxed">
              {release.objective}
            </p>
          )}

          {/* Objective warning */}
          {!release.objectiveClear && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <span className="text-amber-600 text-sm mt-px">⚠</span>
              <div>
                <p className="text-[13px] font-medium text-amber-800">Doel nog niet helder</p>
                <p className="text-[12px] text-amber-700 mt-0.5">
                  Definieer het doel voordat u aan deze release begint.
                </p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {release.features_total > 0 && (
            <div className="mt-3">
              <ProgressBar done={release.features_done} total={release.features_total} />
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] text-[var(--navy-medium)]">
                  <span className="font-semibold">{release.features_total}</span> features
                </span>
                {release.features_done > 0 && (
                  <span className="text-[11px] text-green-700">
                    <span className="font-semibold">{release.features_done}</span> done
                  </span>
                )}
                {release.features_total - release.features_done > 0 && (
                  <span className="text-[11px] text-[var(--navy-medium)]">
                    <span className="font-semibold">{release.features_total - release.features_done}</span> remaining
                  </span>
                )}
                {hasChildren && !expanded && (
                  <span className="text-[11px] text-[var(--navy-medium)]">
                    · {release.children.length} sub-release{release.children.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          {/* Sub-releases */}
          {release.children.length > 0 && (
            <div className="px-3 py-2">
              {release.children.map(child => (
                <SubReleaseRow key={child.id} version={child} />
              ))}
            </div>
          )}

          {/* Direct features (for versions without sub-releases) */}
          {release.children.length === 0 && release.features.length > 0 && (
            <div className="px-3 py-2">
              {release.features.map((f, i) => (
                <FeatureRow key={`${f.version}-${i}`} feature={f} />
              ))}
            </div>
          )}

          {/* No features */}
          {release.children.length === 0 && release.features.length === 0 && (
            <div className="px-5 py-4">
              <p className="text-[13px] text-[var(--navy-medium)] italic">
                Nog geen features gedefinieerd.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BacklogSection({ items }: { items: Feature[] }) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  return (
    <div className="mt-6">
      {/* Separator */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] font-medium text-[var(--navy-medium)] uppercase tracking-wider">
          Backlog
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/40">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-left px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50/80 rounded-lg"
        >
          <span className={`text-xs text-[var(--navy-medium)] transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span className="text-[13px] font-medium text-[var(--navy-medium)]">
            Niet toegewezen aan een release
          </span>
          <span className="text-[11px] text-[var(--navy-medium)] bg-gray-200/60 px-2 py-0.5 rounded-full tabular-nums">
            {items.length}
          </span>
        </button>

        {expanded && (
          <div className="px-3 pb-3 border-t border-gray-200/60">
            {items.map((f, i) => (
              <FeatureRow key={`backlog-${i}`} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main content ─────────────────────────────────────── */

function RoadmapContent() {
  const { role, loading: subLoading } = useSubscription()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tracks, setTracks] = useState<Record<TrackKey, TrackData> | null>(null)
  const [loading, setLoading] = useState(true)

  const activeTrack = (searchParams.get('track') as TrackKey) || 'v'

  useEffect(() => {
    if (!subLoading && role === 'admin') {
      fetch('/api/v1/team/roadmap')
        .then(res => res.json())
        .then(data => {
          if (data.tracks) setTracks(data.tracks)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else if (!subLoading) {
      setLoading(false)
    }
  }, [subLoading, role])

  const currentTrack = tracks?.[activeTrack]

  // Aggregate stats for the track
  const trackStats = useMemo(() => {
    if (!currentTrack) return { total: 0, done: 0, releases: 0, live: 0 }
    let total = 0
    let done = 0
    let live = 0
    for (const r of currentTrack.releases) {
      total += r.features_total
      done += r.features_done
      if (r.status === 'live') live++
    }
    return { total, done, releases: currentTrack.releases.length, live }
  }, [currentTrack])

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

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <TeamNav />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--navy-dark)] mb-0.5">Roadmap</h1>
        <p className="text-[13px] text-[var(--navy-medium)]">
          Releases, voortgang en doelen per track.
        </p>
      </div>

      {/* Track tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {TRACK_TABS.map(tab => {
          const isActive = activeTrack === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/team/roadmap?track=${tab.key}`)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[var(--navy-dark)] text-[var(--navy-dark)]'
                  : 'border-transparent text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:border-gray-300'
              }`}
            >
              <span className="font-semibold mr-1">{tab.key.toUpperCase()}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {currentTrack && (
        <>
          {/* Track summary bar */}
          <div className="flex items-center gap-6 mb-5 text-[12px] text-[var(--navy-medium)]">
            <span>
              <span className="font-semibold text-[var(--navy-dark)]">{trackStats.releases}</span> releases
            </span>
            <span>
              <span className="font-semibold text-[var(--navy-dark)]">{trackStats.total}</span> features
            </span>
            <span>
              <span className="font-semibold text-green-700">{trackStats.done}</span> done
            </span>
            <span>
              <span className="font-semibold text-[var(--navy-dark)]">{trackStats.live}</span> live
            </span>
            {trackStats.total > 0 && (
              <div className="flex-1 max-w-[200px]">
                <ProgressBar done={trackStats.done} total={trackStats.total} height={4} />
              </div>
            )}
          </div>

          {/* Initiative cards */}
          <div className="space-y-3">
            {currentTrack.releases.map(release => (
              <InitiativeCard key={release.id} release={release} />
            ))}
          </div>

          {/* Backlog section */}
          <BacklogSection items={currentTrack.backlog} />
        </>
      )}
    </main>
  )
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<main className="min-h-[60vh] flex items-center justify-center"><p className="text-[var(--navy-medium)]">Laden...</p></main>}>
      <RoadmapContent />
    </Suspense>
  )
}
