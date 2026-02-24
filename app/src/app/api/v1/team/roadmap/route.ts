/**
 * Admin API: Roadmap data parsed from VERSIONING.md + backlog.md
 *
 * GET /api/v1/team/roadmap — Returns structured roadmap data for all 4 tracks
 *
 * Parses markdown files at request time (always fresh, no cache).
 * Files are small (<1000 lines each), parsing takes <10ms.
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { VERSIONING_MD, BACKLOG_MD } from '@/generated/roadmap-data'

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

function parseStatusEmoji(text: string): VersionStatus {
  if (/✅\s*Live/i.test(text)) return 'live'
  if (/🔨/i.test(text) || /in development/i.test(text)) return 'building'
  if (/on staging/i.test(text) || /⏳.*staging/i.test(text)) return 'staging'
  if (/⏳/i.test(text) || /in progress/i.test(text)) return 'in_progress'
  return 'planned'
}

function parseFeatureStatus(text: string): FeatureStatus {
  if (/✅/i.test(text)) return 'done'
  if (/staging/i.test(text)) return 'staging'
  if (/⏳/i.test(text) || /in progress/i.test(text)) return 'in_progress'
  if (/backlog/i.test(text)) return 'backlogged'
  return 'planned'
}

function parseVersioning(content: string): Map<TrackKey, TrackData> {
  const tracks = new Map<TrackKey, TrackData>([
    ['v', { key: 'v', name: 'End-user', versions: [], features: [] }],
    ['a', { key: 'a', name: 'Admin', versions: [], features: [] }],
    ['m', { key: 'm', name: 'Launch', versions: [], features: [] }],
    ['d', { key: 'd', name: 'Data', versions: [], features: [] }],
  ])

  const lines = content.split('\n')
  let currentTrack: TrackKey | null = null
  let currentVersionId: string | null = null
  let inFeatureTable = false
  let featureTableHeaderPassed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect track sections
    if (/^## V2 - Search Platform/i.test(line) || /^## V3 - /i.test(line) ||
        /^## V4 - /i.test(line) || /^## V5 - /i.test(line) ||
        /^## V6 - /i.test(line) || /^## V7 - /i.test(line) ||
        /^## V8 - /i.test(line) || /^## V9 - /i.test(line) ||
        /^## V10 - /i.test(line)) {
      currentTrack = 'v'
      inFeatureTable = false
      featureTableHeaderPassed = false
    } else if (/^## Admin Track/i.test(line)) {
      currentTrack = 'a'
      inFeatureTable = false
      featureTableHeaderPassed = false
    } else if (/^## Marketing Track/i.test(line)) {
      currentTrack = 'm'
      inFeatureTable = false
      featureTableHeaderPassed = false
    } else if (/^## Data Track/i.test(line)) {
      currentTrack = 'd'
      inFeatureTable = false
      featureTableHeaderPassed = false
    } else if (/^## (Product Tiers|Version Dependencies|Current Roadmap|Quick Reference|Versioning Scheme|Major Versions)/i.test(line)) {
      currentTrack = null
      inFeatureTable = false
      featureTableHeaderPassed = false
    }

    if (!currentTrack) continue

    const track = tracks.get(currentTrack)!

    // Detect version headers: ### V2.0 - Name or ### A1.0 - Name
    const versionMatch = line.match(/^### ([VAMD][\d.]+) - (.+?)(?:\s*\(.*\))?\s*$/)
    if (versionMatch) {
      currentVersionId = versionMatch[1]
      const versionName = versionMatch[2].trim()
      inFeatureTable = false
      featureTableHeaderPassed = false

      // Look ahead for status line
      let status: VersionStatus = 'planned'
      let timeline: string | undefined
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const statusMatch = lines[j].match(/\*\*Status:\*\*\s*(.+)/)
        if (statusMatch) {
          status = parseStatusEmoji(statusMatch[1])
          // Extract timeline info if present
          const timelineMatch = statusMatch[1].match(/\(([^)]*(?:Week|Q\d|post|before|~)[^)]*)\)/i)
          if (timelineMatch) timeline = timelineMatch[1].trim()
          break
        }
      }

      track.versions.push({
        id: currentVersionId,
        name: versionName,
        status,
        features_total: 0,
        features_done: 0,
        timeline,
      })
      continue
    }

    if (!currentVersionId) continue

    // Detect feature table start
    if (/^\| Feature\s*\|/i.test(line) || /^\| Dataset\s*\|/i.test(line)) {
      inFeatureTable = true
      featureTableHeaderPassed = false
      continue
    }

    // Skip table separator (|---|---|)
    if (inFeatureTable && /^\|[\s-|]+\|$/.test(line)) {
      featureTableHeaderPassed = true
      continue
    }

    // Parse feature table rows
    if (inFeatureTable && featureTableHeaderPassed && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 2) {
        const title = cells[0].replace(/[`*]/g, '').trim()
        const statusCell = cells[cells.length - 1]
        const status = parseFeatureStatus(statusCell)

        // Extract UX-XXX id if present
        const uxMatch = title.match(/(UX-\d+)/)
        const id = uxMatch ? uxMatch[1] : null

        track.features.push({
          id,
          title: title.replace(/UX-\d+:\s*/, ''),
          version: currentVersionId,
          status,
          source: 'versioning',
        })

        // Update version counts
        const version = track.versions.find(v => v.id === currentVersionId)
        if (version) {
          version.features_total++
          if (status === 'done') version.features_done++
        }
      }
      continue
    }

    // End feature table on empty line or non-table line
    if (inFeatureTable && !line.startsWith('|') && line.trim() !== '') {
      inFeatureTable = false
      featureTableHeaderPassed = false
    }

    // Detect bullet-point features (V-track versions like V2.1-V2.5)
    const bulletMatch = line.match(/^- (?:(UX-\d+): )?(.+?)(?:\s*\(.*\))?\s*$/)
    if (bulletMatch && currentTrack === 'v' && !inFeatureTable) {
      const id = bulletMatch[1] || null
      const title = bulletMatch[2].replace(/\*\*/g, '').trim()

      // Skip non-feature bullets (like "Two profession templates:")
      if (title.length < 100 && !title.includes('**') && !title.startsWith('Light ') && !title.startsWith('Platform ')) {
        const status: FeatureStatus = 'planned'

        track.features.push({
          id,
          title,
          version: currentVersionId,
          status,
          source: 'versioning',
        })

        const version = track.versions.find(v => v.id === currentVersionId)
        if (version) {
          version.features_total++
        }
      }
    }
  }

  return tracks
}

function parseBacklog(content: string, tracks: Map<TrackKey, TrackData>): void {
  const sections = content.split(/^### /m).slice(1) // Split by ### headers, skip preamble

  for (const section of sections) {
    const titleLine = section.split('\n')[0].trim()

    // Skip completed items
    if (/\(COMPLETED\)/i.test(titleLine)) continue
    if (/✅\s*COMPLETED?/i.test(section.substring(0, 300))) continue

    // Extract status
    const statusMatch = section.match(/\*\*Status:\*\*\s*(.+)/)
    if (!statusMatch) continue
    const statusText = statusMatch[1]

    // Skip completed
    if (/✅\s*COMPLETED?/i.test(statusText)) continue

    const status = parseFeatureStatus(statusText)

    // Extract version assignment from priority line
    const priorityMatch = section.match(/\*\*Priority:\*\*\s*(?:High|Medium|Low)\s*\(([^)]+)\)/i)
    let version = 'Backlog'
    let trackKey: TrackKey = 'v'

    if (priorityMatch) {
      const versionHint = priorityMatch[1].trim()
      if (/^V/i.test(versionHint)) {
        version = versionHint
        trackKey = 'v'
      } else if (/^A/i.test(versionHint)) {
        version = versionHint
        trackKey = 'a'
      } else if (/^M/i.test(versionHint)) {
        version = versionHint
        trackKey = 'm'
      } else if (/^D/i.test(versionHint)) {
        version = versionHint
        trackKey = 'd'
      } else if (/Pre-Launch/i.test(versionHint)) {
        version = 'M1.0'
        trackKey = 'm'
      }
    }

    // Extract UX id
    const uxMatch = titleLine.match(/(UX-\d+)/)
    const title = titleLine
      .replace(/\(COMPLETED\)/i, '')
      .replace(/\(V[\d.]+\)/i, '')
      .replace(/\(Pre-Launch\)/i, '')
      .trim()

    const track = tracks.get(trackKey)
    if (!track) continue

    // Avoid duplicates — check if feature with same title already exists
    const exists = track.features.some(f =>
      f.title.toLowerCase().includes(title.toLowerCase().substring(0, 20))
    )
    if (exists) continue

    track.features.push({
      id: uxMatch ? uxMatch[1] : null,
      title,
      version,
      status,
      source: 'backlog',
    })
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  try {
    if (!VERSIONING_MD) {
      return NextResponse.json({ error: 'VERSIONING.md niet gevonden (build-time embed leeg)' }, { status: 500 })
    }

    const tracks = parseVersioning(VERSIONING_MD)

    if (BACKLOG_MD) {
      parseBacklog(BACKLOG_MD, tracks)
    }

    return NextResponse.json({
      tracks: Object.fromEntries(tracks),
    })
  } catch (err) {
    console.error('[Roadmap] Parse error:', err)
    return NextResponse.json({ error: 'Fout bij laden roadmap' }, { status: 500 })
  }
}
