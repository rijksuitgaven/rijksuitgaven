/**
 * Admin Auth Guard
 *
 * Checks if the current user has role='admin' in subscriptions table.
 * Uses the anon key client (RLS enforced — user can only read their own row).
 */

import { createClient } from '@/lib/supabase/server'

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false

  const { data } = await supabase
    .from('subscriptions')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  return data?.role === 'admin'
}
