/**
 * GET /api/v1/modules
 *
 * Lists all available modules.
 */

import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_lib/proxy'
import { getAuthenticatedUser, unauthorizedResponse } from '../../_lib/auth'

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  return proxyToBackend(request, '/api/v1/modules', { sanitize: false })
}
