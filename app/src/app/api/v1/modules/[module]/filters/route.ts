/**
 * POST /api/v1/modules/{module}/filters
 *
 * Cascading filter options with counts (UX-021).
 * Forwards POST body to backend and returns filter options per field.
 *
 * GET requests for specific fields are handled by [field]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateModule, BACKEND_API_URL, TIMEOUT_MS } from '../../../../_lib/proxy'

interface RouteParams {
  params: Promise<{ module: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { module } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  try {
    // Body size check — read actual body bytes, not trust Content-Length header
    const rawBody = await request.text()
    if (rawBody.length > 10240) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Parse from already-read text
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Schema validation
    if (!body || typeof body !== 'object' || !('active_filters' in body) || typeof (body as Record<string, unknown>).active_filters !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Limit number of values per filter key to prevent expensive IN clauses
    const filters = (body as Record<string, unknown>).active_filters as Record<string, unknown>
    for (const values of Object.values(filters)) {
      if (Array.isArray(values) && values.length > 100) {
        return NextResponse.json({ error: 'Too many filter values per key (max 100)' }, { status: 400 })
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/v1/modules/${module}/filter-options`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[BFF] Backend ${response.status}: ${errorText}`)
        return NextResponse.json(
          { error: 'Request failed' },
          { status: response.status >= 500 ? 502 : response.status }
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

    console.error('[BFF Proxy] filter-options error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
