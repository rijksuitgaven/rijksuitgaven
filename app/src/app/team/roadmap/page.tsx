'use client'

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'

type TrackKey = 'v' | 'a' | 'm' | 'd'
type VersionStatus = 'live' | 'building' | 'staging' | 'planned' | 'in_progress'
type FeatureStatus = 'done' | 'staging' | 'in_progress' | 'planned' | 'backlogged'

interface Version {
  id: string
  name: string
  status: VersionStatus
  features_total: number
  features_done: number
  timeline?: string
}

interface Feature {
  id: string | null
  title: string
  version: string
  status: FeatureStatus
  source: 'versioning' | 'backlog'
}

interface TrackData {
  key: TrackKey
  name: string
  versions: Version[]
  features: Feature[]
}

const TRACK_TABS: { key: TrackKey; label: string; description: string }[] = [
  { key: 'v', label: 'V End-user', description: 'Zoekplatform en gebruikersfuncties' },
  { key: 'a', label: 'A Admin', description: 'Beheer, CRM en interne tooling' },
  { key: 'm', label: 'M Launch', description: 'Marketing, SEO en lanceringsinfrastructuur' },
  { key: 'd', label: 'D Data', description: 'Datasets, jaarupdates en datacorrecties' },
]

const STATUS_EMOJI: Record<VersionStatus, string> = {
  live: '✅',
  building: '🔨',
  staging: '⏳',
  in_progress: '⏳',
  planned: '📋',
}

const STATUS_LABEL: Record<VersionStatus, string> = {
  live: 'Live',
  building: 'Building',
  staging: 'Staging',
  in_progress: 'In progress',
  planned: 'Planned',
}

const FEATURE_STATUS_LABEL: Record<FeatureStatus, string> = {
  done: '✅ Done',
  staging: '⏳ Staging',
  in_progress: '⏳ In progress',
  planned: '📋 Planned',
  backlogged: '📋 Backlog',
}

const FEATURE_STATUS_COLOR: Record<FeatureStatus, string> = {
  done: 'text-green-700 bg-green-50',
  staging: 'text-amber-700 bg-amber-50',
  in_progress: 'text-blue-700 bg-blue-50',
  planned: 'text-[var(--navy-medium)] bg-gray-50',
  backlogged: 'text-[var(--navy-medium)] bg-gray-50',
}

/** Sort version strings by semantic version: V2.0 before V10.0, Backlog last */
function semverSort(a: string, b: string): number {
  if (a === 'Backlog') return 1
  if (b === 'Backlog') return -1
  const parseVersion = (s: string) => {
    const match = s.match(/^([A-Z]?)(\d+)\.(\d+)/)
    if (!match) return { prefix: s, major: 999, minor: 0 }
    return { prefix: match[1] || '', major: parseInt(match[2]), minor: parseInt(match[3]) }
  }
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix)
  if (pa.major !== pb.major) return pa.major - pb.major
  return pa.minor - pb.minor
}

function MultiSelect<T extends string>({
  options,
  selected,
  onChange,
  allLabel,
  renderOption,
}: {
  options: T[]
  selected: Set<T>
  onChange: (next: Set<T>) => void
  allLabel: string
  renderOption: (value: T) => string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
  }, [])

  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  const toggle = (value: T) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(next)
  }

  const isAll = selected.size === 0
  const label = isAll
    ? allLabel
    : selected.size === 1
      ? renderOption(Array.from(selected)[0])
      : `${selected.size} geselecteerd`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs border border-[var(--border)] rounded px-2 py-1.5 text-[var(--navy-dark)] bg-white flex items-center gap-1 min-w-[120px] justify-between"
      >
        <span className="truncate">{label}</span>
        <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[180px] py-1">
          <button
            onClick={() => { onChange(new Set()); }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${isAll ? 'font-semibold text-[var(--navy-dark)]' : 'text-[var(--navy-medium)]'}`}
          >
            {isAll && <span>✓</span>}
            <span className={isAll ? '' : 'ml-4'}>{allLabel}</span>
          </button>
          <div className="border-t border-[var(--border)] my-1" />
          {options.map(opt => {
            const checked = selected.has(opt)
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${checked ? 'font-semibold text-[var(--navy-dark)]' : 'text-[var(--navy-medium)]'}`}
              >
                {checked && <span>✓</span>}
                <span className={checked ? '' : 'ml-4'}>{renderOption(opt)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? '#16a34a' : 'var(--pink)',
          }}
        />
      </div>
      <span className="text-xs text-[var(--navy-medium)] tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

function VersionCard({ version }: { version: Version }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--navy-dark)]">
            {version.id} {version.name}
          </h3>
          {version.timeline && (
            <p className="text-xs text-[var(--navy-medium)] mt-0.5">{version.timeline}</p>
          )}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-[var(--navy-medium)]">
          {STATUS_EMOJI[version.status]} {STATUS_LABEL[version.status]}
        </span>
      </div>
      {version.features_total > 0 && (
        <>
          <ProgressBar done={version.features_done} total={version.features_total} />
          <p className="text-xs text-[var(--navy-medium)] mt-1.5">
            <span className="font-semibold">{version.features_total}</span> features
            {version.features_done > 0 && (
              <> · <span className="text-green-700 font-semibold">{version.features_done}</span> done</>
            )}
            {version.features_total - version.features_done > 0 && (
              <> · <span className="font-semibold">{version.features_total - version.features_done}</span> remaining</>
            )}
          </p>
        </>
      )}
    </div>
  )
}

function RoadmapContent() {
  const { role, loading: subLoading } = useSubscription()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tracks, setTracks] = useState<Record<TrackKey, TrackData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilters, setStatusFilters] = useState<Set<FeatureStatus>>(new Set())
  const [versionFilters, setVersionFilters] = useState<Set<string>>(new Set())

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

  // Reset filters when switching tracks
  useEffect(() => {
    setStatusFilters(new Set())
    setVersionFilters(new Set())
  }, [activeTrack])

  const currentTrack = tracks?.[activeTrack]

  const filteredFeatures = useMemo(() => {
    if (!currentTrack) return []
    return currentTrack.features.filter(f => {
      if (statusFilters.size > 0 && !statusFilters.has(f.status)) return false
      if (versionFilters.size > 0 && !versionFilters.has(f.version)) return false
      return true
    })
  }, [currentTrack, statusFilters, versionFilters])

  const availableVersions = useMemo(() => {
    if (!currentTrack) return []
    const versions = new Set(currentTrack.features.map(f => f.version))
    return Array.from(versions).sort(semverSort)
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <TeamNav />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--navy-dark)] mb-1">Roadmap</h1>
        <p className="text-sm text-[var(--navy-medium)]">
          Productplanning en voortgang per releasetrack.
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
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[var(--navy-dark)] text-[var(--navy-dark)]'
                  : 'border-transparent text-[var(--navy-medium)] hover:text-[var(--navy-dark)] hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {currentTrack && (
        <>
          {/* Track description */}
          <p className="text-sm text-[var(--navy-medium)] mb-4">
            {TRACK_TABS.find(t => t.key === activeTrack)?.description}
          </p>

          {/* Version cards */}
          {currentTrack.versions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {currentTrack.versions.map(version => (
                <VersionCard key={version.id} version={version} />
              ))}
            </div>
          )}

          {/* Features section */}
          <div className="bg-white border border-[var(--border)] rounded-lg">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-semibold text-[var(--navy-dark)]">
                Features
                <span className="ml-2 text-sm font-normal text-[var(--navy-medium)]">
                  {filteredFeatures.length} {filteredFeatures.length === 1 ? 'item' : 'items'}
                </span>
              </h2>

              <div className="flex gap-2">
                <MultiSelect
                  options={availableVersions}
                  selected={versionFilters}
                  onChange={setVersionFilters}
                  allLabel="Alle versies"
                  renderOption={v => v}
                />
                <MultiSelect
                  options={['done', 'staging', 'in_progress', 'planned', 'backlogged'] as FeatureStatus[]}
                  selected={statusFilters}
                  onChange={setStatusFilters}
                  allLabel="Alle statussen"
                  renderOption={v => FEATURE_STATUS_LABEL[v]}
                />
              </div>
            </div>

            {filteredFeatures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-5 py-2.5 font-medium text-[var(--navy-medium)] w-20">ID</th>
                      <th className="text-left px-5 py-2.5 font-medium text-[var(--navy-medium)]">Feature</th>
                      <th className="text-left px-5 py-2.5 font-medium text-[var(--navy-medium)] w-24">Versie</th>
                      <th className="text-left px-5 py-2.5 font-medium text-[var(--navy-medium)] w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((feature, i) => (
                      <tr
                        key={`${feature.version}-${feature.title}-${i}`}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-2.5 text-xs font-mono text-[var(--navy-medium)]">
                          {feature.id || '—'}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--navy-dark)]">
                          {feature.title}
                        </td>
                        <td className="px-5 py-2.5 text-xs font-mono text-[var(--navy-medium)]">
                          {feature.version}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${FEATURE_STATUS_COLOR[feature.status]}`}>
                            {FEATURE_STATUS_LABEL[feature.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[var(--navy-medium)]">Geen features gevonden met deze filters.</p>
              </div>
            )}
          </div>
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
