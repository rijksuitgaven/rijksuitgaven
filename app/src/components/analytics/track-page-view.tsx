'use client'

import { useEffect, useRef } from 'react'
import { useAnalytics } from '@/hooks/use-analytics'

/**
 * Shared client component for tracking public page views (UX-036).
 * Drop into any server-rendered public page to fire a public_page_view event.
 * Follows the Track404 pattern from not-found.tsx.
 */
export function TrackPageView({ page }: { page: string }) {
  const { track, publicSessionId } = useAnalytics()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Extract referrer hostname only (privacy: no full URL)
    let referrer: string | null = null
    try {
      if (document.referrer) {
        const refHost = new URL(document.referrer).hostname
        // Exclude self-referrals
        if (refHost !== window.location.hostname) {
          referrer = refHost
        }
      }
    } catch {
      // Invalid referrer URL — ignore
    }

    // Extract UTM params
    const params = new URLSearchParams(window.location.search)
    const utm_source = params.get('utm_source') || null
    const utm_medium = params.get('utm_medium') || null
    const utm_campaign = params.get('utm_campaign') || null

    track('public_page_view', undefined, {
      page,
      session_id: publicSessionId,
      referrer,
      ...(utm_source && { utm_source }),
      ...(utm_medium && { utm_medium }),
      ...(utm_campaign && { utm_campaign }),
    })
  }, [track, page, publicSessionId])

  return null
}
