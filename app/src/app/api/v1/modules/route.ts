/**
 * GET /api/v1/modules
 *
 * Lists all available modules.
 */

import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_lib/proxy'

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/modules', { sanitize: false })
}
