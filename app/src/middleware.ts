/**
 * Next.js Middleware — Session Refresh + Route Protection
 *
 * Runs on every matched request (pages AND API routes):
 * 1. Refreshes expired access tokens via Supabase
 * 2. Page routes: redirects unauthenticated users to /login
 * 3. API routes: returns 401 JSON for unauthenticated requests
 *
 * IMPORTANT: API routes MUST go through middleware so that cookies()
 * in Route Handlers can read the session (Next.js 16 requirement).
 *
 * EXCLUDES: /auth/* (callback, logout), /login (public), static assets.
 *
 * Rollback: Delete this file to disable all auth enforcement.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (browser icons)
     * - auth/ (callback, logout)
     * - login (public)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     *
     * NOTE: /api/ routes ARE included — middleware refreshes the session
     * so Route Handlers can read cookies via cookies(). Without this,
     * getSession() in BFF auth guards returns null in Next.js 16.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|auth/|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
