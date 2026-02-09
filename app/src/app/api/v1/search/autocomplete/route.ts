/**
 * GET /api/v1/search/autocomplete
 *
 * Provides global autocomplete suggestions across all modules.
 */

import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../../_lib/proxy'
import { getAuthenticatedUser, unauthorizedResponse } from '../../../_lib/auth'

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  return proxyToBackend(request, '/api/v1/search/autocomplete', { sanitize: true })
}
