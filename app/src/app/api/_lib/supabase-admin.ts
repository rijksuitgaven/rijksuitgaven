/**
 * Supabase Admin Client (service role)
 *
 * Bypasses RLS — use ONLY in admin API routes after isAdmin() check.
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable.
 */

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
