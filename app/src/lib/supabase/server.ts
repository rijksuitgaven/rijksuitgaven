/**
 * Server-side Supabase client (per-request).
 *
 * Used in Server Components, Route Handlers, and Server Actions.
 * Requires `await cookies()` (Next.js 15+/16 async requirement).
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Intentionally a no-op. In Next.js 16 dynamic rendering,
          // cookieStore.set() succeeds silently (no error thrown) and adds
          // Set-Cookie headers that can clear auth cookies. Middleware
          // handles all cookie updates via its own Supabase client.
        },
      },
    }
  )
}
