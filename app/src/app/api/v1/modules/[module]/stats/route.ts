/**
 * GET /api/v1/modules/{module}/stats
 *
 * Fetches statistics for a specific module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, validateModule } from '../../../../_lib/proxy'

interface RouteParams {
  params: Promise<{ module: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { module } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  return proxyToBackend(request, `/api/v1/modules/${module}/stats`, { sanitize: false })
}
