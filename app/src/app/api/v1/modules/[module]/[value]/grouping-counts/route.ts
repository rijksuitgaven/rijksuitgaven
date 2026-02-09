/**
 * GET /api/v1/modules/{module}/{value}/grouping-counts
 *
 * Fetches distinct value counts per groupable field for a recipient.
 * Used by the expanded row dropdown to show item counts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, validateModule } from '../../../../../_lib/proxy'

interface RouteParams {
  params: Promise<{ module: string; value: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { module, value } = await params

  if (!validateModule(module)) {
    return NextResponse.json(
      { error: 'Invalid module name' },
      { status: 400 }
    )
  }

  const decodedValue = decodeURIComponent(value)
  if (!decodedValue || decodedValue.length > 500) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  return proxyToBackend(
    request,
    `/api/v1/modules/${module}/${encodeURIComponent(decodedValue)}/grouping-counts`,
    { sanitize: false }
  )
}
