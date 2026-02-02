/**
 * BFF Proxy Helper
 *
 * Routes all frontend API calls through Next.js to hide the backend URL.
 * Applies security limits to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'
const TIMEOUT_MS = 30000

// Security limits
const MAX_OFFSET = 10000
const MAX_LIMIT = 100

interface ProxyOptions {
  /** Apply security sanitization (offset/limit caps, block random sort) */
  sanitize?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * Sanitize query parameters for security
 */
function sanitizeParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams(params)

  // Cap offset
  const offset = parseInt(sanitized.get('offset') || '0', 10)
  if (offset > MAX_OFFSET) {
    sanitized.set('offset', String(MAX_OFFSET))
  }

  // Cap limit
  const limit = parseInt(sanitized.get('limit') || '25', 10)
  if (limit > MAX_LIMIT) {
    sanitized.set('limit', String(MAX_LIMIT))
  }

  // Block random sort (replace with totaal)
  const sortBy = sanitized.get('sort_by')
  if (sortBy === 'random') {
    sanitized.set('sort_by', 'totaal')
  }

  return sanitized
}

/**
 * Validate module name (alphabetic only, prevents path traversal)
 */
export function validateModule(module: string): boolean {
  return /^[a-z]+$/.test(module)
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

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Pass through error status from backend
        const errorText = await response.text()
        return NextResponse.json(
          { error: 'Backend error', details: errorText },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)

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
