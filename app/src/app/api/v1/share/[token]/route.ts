/**
 * Share API: Get / Delete shared link
 *
 * GET    /api/v1/share/[token] — Public: fetch stored state for shared view
 * DELETE /api/v1/share/[token] — Authenticated: soft-delete own link
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/app/api/_lib/auth'
import { csrfCheck } from '@/app/api/_lib/auth'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token || token.length > 50) {
    return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 })
  }

  // Admin client — public endpoint, no user auth context for RLS
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shared_links')
    .select('module, search, filters, sort_by, sort_order, columns, expanded, expanded_grouping, expanded_columns, created_at')
    .eq('token', token)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Deellink niet gevonden' }, { status: 404 })
  }

  // Increment view_count atomically (fire-and-forget)
  supabase.rpc('increment_shared_link_views', { link_token: token }).then(() => {}, () => {})

  return NextResponse.json({ link: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const csrfError = csrfCheck(request)
  if (csrfError) return csrfError

  const auth = await getAuthenticatedUser()
  if (!auth) return unauthorizedResponse()

  const { token } = await params

  if (!token || token.length > 50) {
    return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('shared_links')
    .update({ deleted_at: new Date().toISOString() })
    .eq('token', token)
    .is('deleted_at', null)

  if (error) {
    console.error('[Share] Delete error:', error)
    return NextResponse.json({ error: 'Fout bij verwijderen deellink' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
