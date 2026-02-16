/**
 * BFF Proxy Helper
 *
 * Routes all frontend API calls through Next.js to hide the backend URL.
 * Applies security limits to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server'

export const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'
export const TIMEOUT_MS = 30000
export const BFF_SECRET = process.env.BFF_SECRET || ''

// Security limits
const MAX_OFFSET = 10000
const MAX_LIMIT = 500  // Matches dropdown options (25/100/150/250/500)
const MAX_RESPONSE_BYTES = 5_000_000  // 5MB response size cap

interface ProxyOptions {
  /** Apply security sanitization (offset/limit caps) */
  sanitize?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * Sanitize query parameters for security
 */
function sanitizeParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams(params)

  // Validate and cap offset
  const offsetStr = sanitized.get('offset')
  if (offsetStr) {
    const offset = parseInt(offsetStr, 10)
    if (isNaN(offset) || offset < 0) {
      sanitized.set('offset', '0')
    } else if (offset > MAX_OFFSET) {
      sanitized.set('offset', String(MAX_OFFSET))
    }
  }

  // Validate and cap limit
  const limitStr = sanitized.get('limit')
  if (limitStr) {
    const limit = parseInt(limitStr, 10)
    if (isNaN(limit) || limit < 1) {
      sanitized.set('limit', '50')
    } else if (limit > MAX_LIMIT) {
      sanitized.set('limit', String(MAX_LIMIT))
    }
  }

  return sanitized
}

/**
 * Validate module name (alphabetic only, prevents path traversal)
 */
const VALID_MODULES = new Set(['instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek', 'integraal'])

export function validateModule(module: string): boolean {
  return VALID_MODULES.has(module)
}

/**
 * Proxy a request to the backend API
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const { sanitize = true, timeout = TIMEOUT_MS } = options

  try {
    // Get query params from request
    let params = new URLSearchParams(request.nextUrl.search)

    // Apply security limits if enabled
    if (sanitize) {
      params = sanitizeParams(params)
    }

    // Build backend URL
    const queryString = params.toString()
    const url = `${BACKEND_API_URL}${backendPath}${queryString ? `?${queryString}` : ''}`

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    request.signal.addEventListener('abort', () => controller.abort(), { once: true })

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(BFF_SECRET && { 'X-BFF-Secret': BFF_SECRET }),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BFF] Backend ${response.status}: ${errorText}`)
        return NextResponse.json(
          { error: 'Request failed' },
          { status: response.status >= 500 ? 502 : response.status }
        )
      }

      // Guard against oversized responses (5MB cap) — read actual bytes, not Content-Length
      const text = await response.text()
      if (text.length > MAX_RESPONSE_BYTES) {
        console.error(`[BFF] Response too large: ${text.length} bytes`)
        return NextResponse.json({ error: 'Response too large' }, { status: 502 })
      }

      const data = JSON.parse(text)
      const nextResponse = NextResponse.json(data)
      nextResponse.headers.set('Cache-Control', 'private, no-cache')
      return nextResponse

    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      )
    }

    console.error('[BFF Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
