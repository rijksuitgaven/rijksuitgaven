/**
 * GET /api/v1/modules/{module}/{value}/details
 *
 * Fetches detail rows for a specific value in a module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, validateModule } from '../../../../../_lib/proxy'
import { getAuthenticatedUser, unauthorizedResponse } from '../../../../../_lib/auth'

interface RouteParams {
  params: Promise<{ module: string; value: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  const { module, value } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  // Value is URL-encoded by the router, pass it through
  // The backend expects the decoded value
  const decodedValue = decodeURIComponent(value)
  if (!decodedValue || decodedValue.length > 500) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  return proxyToBackend(
    request,
    `/api/v1/modules/${module}/${encodeURIComponent(decodedValue)}/details`,
    { sanitize: true }
  )
}
