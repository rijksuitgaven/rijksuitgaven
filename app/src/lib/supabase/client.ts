/**
 * Browser Supabase client (singleton).
 *
 * Used in Client Components (login form, logout button).
 * Cookies are browser-readable (not httpOnly) — required by @supabase/ssr.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
