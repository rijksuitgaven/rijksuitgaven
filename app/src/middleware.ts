/**
 * Next.js Middleware — Session Refresh + Route Protection
 *
 * Runs on every matched PAGE request:
 * 1. Refreshes expired access tokens via Supabase (local JWT check)
 * 2. Redirects unauthenticated users to /login
 *
 * API routes (/api/*) are EXCLUDED — BFF handles its own auth via
 * getAuthenticatedUser() in _lib/auth.ts (returns 401 JSON).
 *
 * EXCLUDES: /api/* (BFF auth), /auth/* (callback, logout), /login (public),
 * static assets.
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
     * - api/ (BFF handles own auth with getSession())
     * - auth/ (callback, logout)
     * - login (public)
     * - h1-h5 (prototype pages)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|auth/|login|h[1-5]|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
