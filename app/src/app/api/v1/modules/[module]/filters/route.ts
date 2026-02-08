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
    // Body size check
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 10240) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Parse with error handling
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Schema validation
    if (!body || typeof body !== 'object' || !('active_filters' in body) || typeof (body as Record<string, unknown>).active_filters !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
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
