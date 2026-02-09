/**
 * GET /api/v1/modules/{module}/filters/{field}
 *
 * Fetches filter options for a specific field in a module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, validateModule } from '../../../../../_lib/proxy'
import { getAuthenticatedUser, unauthorizedResponse } from '../../../../../_lib/auth'

interface RouteParams {
  params: Promise<{ module: string; field: string }>
}

// Validate field name (alphanumeric and underscores only)
function validateField(field: string): boolean {
  return /^[a-z_]+$/.test(field)
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  const { module, field } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  if (!validateField(field)) {
    return NextResponse.json(
      { error: 'Invalid field name' },
      { status: 400 }
    )
  }

  return proxyToBackend(request, `/api/v1/modules/${module}/filters/${field}`, { sanitize: true })
}
