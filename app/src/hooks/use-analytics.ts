'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Analytics event types tracked by the system (UX-032)
 */
export type AnalyticsEventType =
  | 'module_view'
  | 'search'
  | 'row_expand'
  | 'filter_apply'
  | 'export'
  | 'column_change'
  | 'autocomplete_search'
  | 'autocomplete_click'
  | 'cross_module_nav'
  | 'sort_change'
  | 'page_change'

interface AnalyticsEvent {
  event_type: AnalyticsEventType
  module?: string
  properties?: Record<string, unknown>
  timestamp: string
}

const FLUSH_INTERVAL_MS = 30_000 // 30 seconds
const MAX_BATCH_SIZE = 10
const MAX_EVENTS_PER_FLUSH = 20
const ENDPOINT = '/api/v1/analytics'

// Module-level queue shared across all hook instances
let eventQueue: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let hookCount = 0

function flushQueue() {
  if (eventQueue.length === 0) return

  const batch = eventQueue.splice(0, MAX_EVENTS_PER_FLUSH)

  // Use sendBeacon if available (works during page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ events: batch })], {
      type: 'application/json',
    })
    navigator.sendBeacon(ENDPOINT, blob)
  } else {
    // Fallback to fetch (fire-and-forget)
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    }).catch(() => {
      // Silently ignore — analytics should never interrupt user experience
    })
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    flushQueue()
  }
}

/**
 * Hook for tracking usage analytics events (UX-032)
 *
 * Events are batched client-side and flushed:
 * - Every 30 seconds
 * - When batch reaches 10 events
 * - When user navigates away (visibilitychange)
 *
 * Zero performance impact — events queue in memory, never block interaction.
 */
export function useAnalytics() {
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    hookCount++

    // Start flush timer on first hook mount
    if (hookCount === 1) {
      flushTimer = setInterval(flushQueue, FLUSH_INTERVAL_MS)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      mounted.current = false
      hookCount--

      // Cleanup on last hook unmount
      if (hookCount === 0) {
        flushQueue() // Flush remaining events
        if (flushTimer) {
          clearInterval(flushTimer)
          flushTimer = null
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  const track = useCallback(
    (eventType: AnalyticsEventType, module?: string, properties?: Record<string, unknown>) => {
      const event: AnalyticsEvent = {
        event_type: eventType,
        module,
        properties,
        timestamp: new Date().toISOString(),
      }

      eventQueue.push(event)

      // Auto-flush when batch reaches threshold
      if (eventQueue.length >= MAX_BATCH_SIZE) {
        flushQueue()
      }
    },
    []
  )

  return { track }
}
