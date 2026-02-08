/**
 * POST /api/v1/modules/{module}/filters
 *
 * Cascading filter options with counts (UX-021).
 * Forwards POST body to backend and returns filter options per field.
 *
 * GET requests for specific fields are handled by [field]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateModule } from '../../../../_lib/proxy'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'
const TIMEOUT_MS = 15000

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
    const body = await request.json()

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

    console.error('[BFF Proxy] filter-options error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
