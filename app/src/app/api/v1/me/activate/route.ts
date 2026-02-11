/**
 * POST /api/v1/me/activate
 * Sets activated_at on the current user's subscription (first login only).
 * Called from auth callback after successful PKCE exchange.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Only set activated_at once (first login)
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, activated_at')
    .eq('user_id', user.id)
    .single()

  if (!sub) {
    return NextResponse.json({ ok: true }) // No subscription yet
  }

  if (sub.activated_at) {
    return NextResponse.json({ ok: true }) // Already activated
  }

  await admin
    .from('subscriptions')
    .update({ activated_at: new Date().toISOString() })
    .eq('id', sub.id)

  return NextResponse.json({ ok: true, activated: true })
}
