/**
 * TEMPORARY diagnostic endpoint — tests if Set-Cookie headers
 * actually reach the browser through Railway's proxy.
 *
 * Visit /api/cookie-test on production, then check DevTools > Application > Cookies.
 * If test-small appears but test-large doesn't → size issue.
 * If neither appears → Railway strips Set-Cookie headers.
 * If both appear → the auth callback has a code bug, not an infra issue.
 *
 * Remove after diagnosis.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({
    message: 'Cookie test — check DevTools > Application > Cookies',
    timestamp: new Date().toISOString(),
  })

  // Small cookie (~30 bytes) — should always work
  response.cookies.set('test-small', 'hello-world', {
    path: '/',
    maxAge: 300,
    sameSite: 'lax',
    httpOnly: false,
    secure: true,
  })

  // Medium cookie (~500 bytes) — tests moderate size
  response.cookies.set('test-medium', 'x'.repeat(460), {
    path: '/',
    maxAge: 300,
    sameSite: 'lax',
    httpOnly: false,
    secure: true,
  })

  // Large cookie (~2700 bytes) — same size as the auth session cookie
  response.cookies.set('test-large', 'x'.repeat(2600), {
    path: '/',
    maxAge: 300,
    sameSite: 'lax',
    httpOnly: false,
    secure: true,
  })

  return response
}
