/**
 * GET /api/v1/search/autocomplete
 *
 * Provides global autocomplete suggestions across all modules.
 */

import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../../_lib/proxy'

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/search/autocomplete', { sanitize: true })
}
