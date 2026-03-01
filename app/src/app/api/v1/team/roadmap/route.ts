/**
 * Admin API: Roadmap data parsed from VERSIONING.md + backlog.md
 *
 * GET /api/v1/team/roadmap — Returns structured roadmap data for all 4 tracks
 *
 * Returns hierarchical data: major releases → sub-releases → features
 * with objectives, progress aggregation, and backlog items.
 */

import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { VERSIONING_MD, BACKLOG_MD } from '@/generated/roadmap-data'

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

function parseStatusEmoji(text: string): VersionStatus {
  if (/✅\s*Live/i.test(text)) return 'live'
  if (/🔨/i.test(text) || /in development/i.test(text) || /testing/i.test(text)) return 'building'
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

/** Get the major version key: V2.3 → V2, V10.1 → V10, A1.1 → A1 */
function getMajorKey(versionId: string): string {
  const match = versionId.match(/^([A-Z])(\d+)/)
  if (!match) return versionId
  return `${match[1]}${match[2]}`
}

/** Check if a version is a .0 (major) release */
function isMajorVersion(versionId: string): boolean {
  return /^[A-Z]\d+\.0$/.test(versionId)
}

function parseVersioning(content: string): Map<TrackKey, TrackData> {
  const tracks = new Map<TrackKey, TrackData>([
    ['v', { key: 'v', name: 'End-user', releases: [], backlog: [] }],
    ['a', { key: 'a', name: 'Admin', releases: [], backlog: [] }],
    ['m', { key: 'm', name: 'Launch', releases: [], backlog: [] }],
    ['d', { key: 'd', name: 'Data', releases: [], backlog: [] }],
  ])

  // First pass: extract initiatives from ## sections (V-track major version headers)
  // These become the parent cards. Example: ## V3 - Rijksuitgaven Reporter → parent "V3"
  const initiatives = new Map<string, { name: string; objective: string; useCase: string }>()
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const majorMatch = line.match(/^## V(\d+) - (.+?)(?:\s*\(.*\))?\s*$/i)
    if (majorMatch) {
      const key = `V${majorMatch[1]}`
      const name = majorMatch[2].trim()
      let objective = ''
      let useCase = ''
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const promiseMatch = lines[j].match(/\*\*Core promise:\*\*\s*(.+)/i)
        if (promiseMatch) objective = promiseMatch[1].trim()
        const useCaseMatch = lines[j].match(/\*\*New use case:\*\*\s*"?(.+?)"?\s*$/i)
        if (useCaseMatch) useCase = useCaseMatch[1].replace(/"/g, '').trim()
        if (j > i + 1 && /^##\s/.test(lines[j])) break
      }
      initiatives.set(key, { name, objective, useCase })
    }
  }

  // Second pass: parse versions and features
  let currentTrack: TrackKey | null = null
  let currentVersionId: string | null = null
  let inFeatureTable = false
  let featureTableHeaderPassed = false

  // Flat list of all versions per track, to be organized into hierarchy later
  const flatVersions = new Map<TrackKey, Version[]>()
  flatVersions.set('v', [])
  flatVersions.set('a', [])
  flatVersions.set('m', [])
  flatVersions.set('d', [])

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect track sections
    if (/^## V[2-9] - /i.test(line) || /^## V1[0-9] - /i.test(line)) {
      currentTrack = 'v'
      inFeatureTable = false
      featureTableHeaderPassed = false
    } else if (/^## V1 - WordPress/i.test(line)) {
      // Skip V1 legacy
      currentTrack = null
      continue
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

    const trackVersions = flatVersions.get(currentTrack)!

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
          const timelineMatch = statusMatch[1].match(/\(([^)]*(?:Week|Q\d|post|before|~)[^)]*)\)/i)
            || statusMatch[1].match(/,\s*(.*(?:Week|Q\d|post|before|~|launch).*)/i)
          if (timelineMatch) timeline = timelineMatch[1].trim()
          break
        }
      }

      trackVersions.push({
        id: currentVersionId,
        name: versionName,
        status,
        features_total: 0,
        features_done: 0,
        features: [],
        timeline,
        objectiveClear: true,
        children: [],
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

    // Skip table separator
    if (inFeatureTable && /^\|[\s-|]+\|$/.test(line)) {
      featureTableHeaderPassed = true
      continue
    }

    // Parse feature table rows
    if (inFeatureTable && featureTableHeaderPassed && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 2) {
        const title = cells[0].replace(/[`*]/g, '').trim()
        const statusCell = cells.find(c => /[✅⏳📋🔨]/.test(c)) || cells[cells.length - 1]
        const status = parseFeatureStatus(statusCell)

        const uxMatch = title.match(/(UX-\d+)/)
        const id = uxMatch ? uxMatch[1] : null

        const feature: Feature = {
          id,
          title: title.replace(/UX-\d+:\s*/, ''),
          version: currentVersionId,
          status,
          source: 'versioning',
        }

        // Add feature to the version
        const version = trackVersions.find(v => v.id === currentVersionId)
        if (version) {
          version.features.push(feature)
          version.features_total++
          if (status === 'done') version.features_done++
        }
      }
      continue
    }

    // End feature table
    if (inFeatureTable && !line.startsWith('|') && line.trim() !== '') {
      inFeatureTable = false
      featureTableHeaderPassed = false
    }

    // Detect bullet-point features
    const bulletMatch = line.match(/^- (?:(UX-\d+): )?(.+?)(?:\s*\(.*\))?\s*$/)
    if (bulletMatch && !inFeatureTable) {
      const id = bulletMatch[1] || null
      const title = bulletMatch[2].replace(/\*\*/g, '').trim()

      if (title.length < 120 && !title.includes('**')) {
        const versionObj = trackVersions.find(v => v.id === currentVersionId)
        let status: FeatureStatus = 'planned'
        if (versionObj) {
          if (versionObj.status === 'live' || versionObj.status === 'building') status = 'done'
          else if (versionObj.status === 'staging') status = 'staging'
          else if (versionObj.status === 'in_progress') status = 'in_progress'
        }

        const feature: Feature = {
          id,
          title,
          version: currentVersionId,
          status,
          source: 'versioning',
        }

        if (versionObj) {
          versionObj.features.push(feature)
          versionObj.features_total++
          if (status === 'done') versionObj.features_done++
        }
      }
    }
  }

  // Third pass: organize into hierarchy
  //
  // V-track: Parent comes from ## VX - Name (initiative). ALL ### VX.Y are children.
  //   Example: ## V3 - Reporter → parent "V3 Reporter"
  //            ### V3.0, ### V3.1 → both children of V3
  //
  // A/M/D tracks: .0 is the parent, .1+ are children.
  //   Example: ### A1.0 Beheer MVP → parent
  //            ### A1.1 Bulk & CRM → child of A1.0

  for (const [trackKey, versions] of flatVersions) {
    const track = tracks.get(trackKey)!

    if (trackKey === 'v') {
      // V-track: group ALL versions under initiative parents
      const parentMap = new Map<string, Version>()

      // Create parent versions from initiatives (## VX - Name)
      for (const v of versions) {
        const majorKey = getMajorKey(v.id) // e.g. "V2", "V3"
        if (!parentMap.has(majorKey)) {
          const init = initiatives.get(majorKey)
          let objective: string | undefined
          if (init?.objective) {
            objective = init.objective
            if (init.useCase) objective += ` — "${init.useCase}"`
          }

          // Derive parent status from children: live if any live, building if any building, etc.
          const parent: Version = {
            id: majorKey,
            name: init?.name || v.name,
            status: 'planned',
            features_total: 0,
            features_done: 0,
            features: [],
            objective,
            objectiveClear: !!init?.objective,
            children: [],
          }
          parentMap.set(majorKey, parent)
          track.releases.push(parent)
        }
        // Add version as child
        parentMap.get(majorKey)!.children.push(v)
      }

      // Derive parent status from children
      for (const parent of track.releases) {
        if (parent.children.length > 0) {
          const statuses = parent.children.map(c => c.status)
          if (statuses.every(s => s === 'live')) parent.status = 'live'
          else if (statuses.some(s => s === 'building' || s === 'in_progress')) parent.status = 'building'
          else if (statuses.some(s => s === 'live')) parent.status = 'building' // partially live
          else parent.status = 'planned'
        }
      }
    } else {
      // A/M/D tracks: .0 is parent, .1+ are children
      const majorMap = new Map<string, Version>()

      for (const v of versions) {
        if (isMajorVersion(v.id)) {
          majorMap.set(getMajorKey(v.id), v)
          track.releases.push(v)
        }
      }

      for (const v of versions) {
        if (!isMajorVersion(v.id)) {
          const parentKey = getMajorKey(v.id)
          const parent = majorMap.get(parentKey)
          if (parent) {
            parent.children.push(v)
          } else {
            const syntheticParent: Version = {
              id: `${parentKey}.0`,
              name: v.name,
              status: v.status,
              features_total: 0,
              features_done: 0,
              features: [],
              objectiveClear: false,
              children: [v],
            }
            majorMap.set(parentKey, syntheticParent)
            track.releases.push(syntheticParent)
          }
        }
      }
    }

    // Aggregate parent progress from children (all tracks)
    for (const release of track.releases) {
      if (release.children.length > 0) {
        let childFeaturesTotal = 0
        let childFeaturesDone = 0
        for (const child of release.children) {
          childFeaturesTotal += child.features_total
          childFeaturesDone += child.features_done
        }
        release.features_total += childFeaturesTotal
        release.features_done += childFeaturesDone
      }
    }
  }

  return tracks
}

function parseBacklog(content: string, tracks: Map<TrackKey, TrackData>): void {
  const sections = content.split(/^### /m).slice(1)

  for (const section of sections) {
    const titleLine = section.split('\n')[0].trim()

    if (/\(COMPLETED\)/i.test(titleLine)) continue
    if (/✅\s*COMPLETED?/i.test(section.substring(0, 300))) continue

    const statusMatch = section.match(/\*\*Status:\*\*\s*(.+)/)
    const statusText = statusMatch ? statusMatch[1] : 'BACKLOGGED'

    if (/✅\s*COMPLETED?/i.test(statusText)) continue

    const status = parseFeatureStatus(statusText)

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

    const uxMatch = titleLine.match(/(UX-\d+)/)
    const title = titleLine
      .replace(/\(COMPLETED\)/i, '')
      .replace(/\(V[\d.]+\)/i, '')
      .replace(/\(Pre-Launch\)/i, '')
      .trim()

    const track = tracks.get(trackKey)
    if (!track) continue

    // Check duplicates against all features in all releases
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    const keywords = normalizedTitle.split(' ').filter(w => w.length > 3).slice(0, 3)

    const allFeatures: Feature[] = []
    for (const release of track.releases) {
      allFeatures.push(...release.features)
      for (const child of release.children) {
        allFeatures.push(...child.features)
      }
    }

    const exists = allFeatures.some(f => {
      const fNorm = f.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      return keywords.length > 0 && keywords.every(k => fNorm.includes(k))
    })
    if (exists) continue

    const feature: Feature = {
      id: uxMatch ? uxMatch[1] : null,
      title,
      version,
      status,
      source: 'backlog',
    }

    // Try to slot into an existing version's features
    if (version !== 'Backlog') {
      let slotted = false
      for (const release of track.releases) {
        if (release.id === version) {
          release.features.push(feature)
          release.features_total++
          if (status === 'done') release.features_done++
          slotted = true
          break
        }
        for (const child of release.children) {
          if (child.id === version) {
            child.features.push(feature)
            child.features_total++
            if (status === 'done') child.features_done++
            slotted = true
            break
          }
        }
        if (slotted) break
      }
      if (!slotted) {
        track.backlog.push(feature)
      }
    } else {
      track.backlog.push(feature)
    }
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
