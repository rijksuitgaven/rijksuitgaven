/**
 * GET /api/v1/modules/{module}
 *
 * Fetches data for a specific module with pagination and filtering.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, validateModule } from '../../../_lib/proxy'
import { getAuthenticatedUser, unauthorizedResponse } from '../../../_lib/auth'

interface RouteParams {
  params: Promise<{ module: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  const { module } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  return proxyToBackend(request, `/api/v1/modules/${module}`, { sanitize: true })
}
