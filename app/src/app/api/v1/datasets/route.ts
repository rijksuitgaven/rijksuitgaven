/**
 * GET /api/v1/datasets
 *
 * Returns data availability per module/entity/year range.
 * Used by the /datasets page to render availability matrices.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '../../_lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getAuthenticatedUser()
  if (!session) return unauthorizedResponse()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('data_availability')
    .select('module, entity_type, entity_name, year_from, year_to')
    .order('module')
    .order('entity_name')

  if (error) {
    console.error('[Datasets] Fetch error:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen databeschikbaarheid' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
