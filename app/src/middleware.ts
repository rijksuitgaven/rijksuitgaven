/**
 * Next.js Middleware — Session Refresh + Page Route Protection
 *
 * Runs on every matched page navigation:
 * 1. Refreshes expired access tokens via Supabase
 * 2. Redirects unauthenticated users to /login
 *
 * EXCLUDES: /api/* (BFF handles own auth with 401), /auth/* (callback),
 * /login (public), static assets.
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
     * - api/ (BFF routes — handled by auth.ts guard returning 401)
     * - auth/ (callback, logout)
     * - login (public)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|auth/|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
