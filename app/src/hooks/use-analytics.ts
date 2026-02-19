'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Analytics event types tracked by the system (UX-032 + UX-036)
 */
export type AnalyticsEventType =
  | 'module_view'
  | 'search'
  | 'search_end'
  | 'row_expand'
  | 'filter_apply'
  | 'export'
  | 'column_change'
  | 'autocomplete_search'
  | 'autocomplete_click'
  | 'cross_module_nav'
  | 'sort_change'
  | 'page_change'
  | 'error'
  | 'external_link'
  | 'public_page_view'
  | 'public_interaction'

interface AnalyticsEvent {
  event_type: AnalyticsEventType
  module?: string
  properties?: Record<string, unknown>
  timestamp: string
}

const FLUSH_INTERVAL_MS = 30_000 // 30 seconds
const MAX_BATCH_SIZE = 10
const MAX_EVENTS_PER_FLUSH = 20
const ENDPOINT = '/api/v1/events'

// Module-level queue shared across all hook instances
let eventQueue: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let hookCount = 0

// Session-scoped ID for public page analytics (UX-036)
// Lives in memory only — dies when tab closes. No cookies, no localStorage, GDPR-safe.
const publicSessionId = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : Math.random().toString(36).substring(2, 15)

/**
 * Send events via fetch (primary method).
 * Works in all browsers, includes credentials, proper error handling.
 */
function sendViaFetch(batch: AnalyticsEvent[]) {
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Silently ignore — analytics should never interrupt user experience
  })
}

/**
 * Send events via sendBeacon (page unload fallback).
 * Uses text/plain Content-Type to bypass privacy browser blocking
 * (uBlock Origin blocks application/json sendBeacon as tracking).
 */
function sendViaBeacon(batch: AnalyticsEvent[]): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false
  const blob = new Blob([JSON.stringify({ events: batch })], { type: 'text/plain' })
  return navigator.sendBeacon(ENDPOINT, blob)
}

/**
 * Regular flush: use fetch (reliable, includes credentials).
 */
function flushQueue() {
  if (eventQueue.length === 0) return
  const batch = eventQueue.splice(0, MAX_EVENTS_PER_FLUSH)
  sendViaFetch(batch)
}

/**
 * Page unload flush: try sendBeacon first (survives page close),
 * fall back to fetch with keepalive.
 */
function flushOnUnload() {
  if (eventQueue.length === 0) return
  const batch = eventQueue.splice(0, MAX_EVENTS_PER_FLUSH)
  if (!sendViaBeacon(batch)) {
    sendViaFetch(batch)
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    flushOnUnload()
  }
}

/**
 * Hook for tracking usage analytics events (UX-032)
 *
 * Events are batched client-side and flushed:
 * - Every 30 seconds (via fetch)
 * - When batch reaches 10 events (via fetch)
 * - When user navigates away (via sendBeacon, falls back to fetch)
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
        flushOnUnload() // Flush remaining events (page closing)
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

      // Error events flush immediately — high priority, low frequency
      if (eventType === 'error') {
        flushQueue()
        return
      }

      // Auto-flush when batch reaches threshold
      if (eventQueue.length >= MAX_BATCH_SIZE) {
        flushQueue()
      }
    },
    []
  )

  return { track, publicSessionId }
}
