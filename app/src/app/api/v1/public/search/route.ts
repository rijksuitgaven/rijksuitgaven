/**
 * Public Search BFF — Homepage "Probeer het zelf" widget
 *
 * GET /api/v1/public/search?q=ProRail&limit=10
 *
 * No auth required. Anti-scraping measures:
 * 1. Progressive rate limits with burst allowance (token bucket)
 * 2. Query length penalty multiplier (short queries cost more)
 * 3. Fingerprint-enhanced rate limiting (IP + UA + Accept-Language)
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

// =============================================================================
// Token Bucket Rate Limiter
// =============================================================================

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()
const MAX_ENTRIES = 10_000
const BURST_TOKENS = 20
const REFILL_RATE = 5 // tokens per minute

/**
 * Get fingerprint from request headers.
 * Hash of IP + User-Agent + Accept-Language for enhanced rate limiting.
 */
function getFingerprint(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const ua = request.headers.get('user-agent') || ''
  const lang = request.headers.get('accept-language') || ''

  // Simple hash — no crypto needed, just collision resistance
  const raw = `${ip}|${ua}|${lang}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return `fp_${Math.abs(hash).toString(36)}`
}

/**
 * Calculate query cost based on length.
 * Short queries (2-3 chars) are the enumeration vector → cost 3x.
 */
function getQueryCost(query: string): number {
  return Math.max(1, Math.ceil(3 / Math.sqrt(query.length)))
}

/**
 * Consume tokens from the bucket. Returns true if allowed, false if rate limited.
 */
function consumeTokens(fingerprint: string, cost: number): boolean {
  const now = Date.now()

  // Evict old entries if map grows too large
  if (buckets.size > MAX_ENTRIES) {
    const cutoff = now - 5 * 60 * 1000 // 5 minutes
    for (const [key, bucket] of buckets) {
      if (bucket.lastRefill < cutoff) {
        buckets.delete(key)
      }
    }
  }

  let bucket = buckets.get(fingerprint)

  if (!bucket) {
    bucket = { tokens: BURST_TOKENS, lastRefill: now }
    buckets.set(fingerprint, bucket)
  }

  // Refill tokens based on elapsed time (sliding window)
  const elapsed = (now - bucket.lastRefill) / 1000 / 60 // minutes
  bucket.tokens = Math.min(BURST_TOKENS, bucket.tokens + elapsed * REFILL_RATE)
  bucket.lastRefill = now

  // Check if enough tokens
  if (bucket.tokens < cost) {
    return false
  }

  bucket.tokens -= cost
  return true
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')

  // Validate query
  if (!q || q.trim().length < 2) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'private, no-cache' },
    })
  }

  const query = q.trim().slice(0, 200)

  // Rate limit check
  const fingerprint = getFingerprint(request)
  const cost = getQueryCost(query)

  if (!consumeTokens(fingerprint, cost)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Cache-Control': 'private, no-cache' } }
    )
  }

  // Proxy to backend
  try {
    const params = new URLSearchParams({ q: query, limit: '10' })
    const url = `${BACKEND_API_URL}/api/v1/public/search?${params}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[Public Search] Backend ${response.status}`)
      return NextResponse.json([], { status: 502 })
    }

    const text = await response.text()

    // Cap response size (100KB is generous for 10 results)
    if (text.length > 100_000) {
      return NextResponse.json([], { status: 502 })
    }

    const data = JSON.parse(text)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-cache' },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json([], { status: 504 })
    }
    console.error('[Public Search] Error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
