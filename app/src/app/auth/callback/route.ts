/**
 * Auth Callback Route Handler
 *
 * Exchanges the authorization code from the Magic Link for a session.
 * PKCE flow: the code_verifier cookie must be present (same device/browser).
 *
 * Handles cross-device failure: if code_verifier is missing, shows Dutch error.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/integraal'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful login — redirect to the app
      return NextResponse.redirect(`${origin}${next}`)
    }

    // PKCE cross-device error or expired link
    const errorMessage = error.message?.includes('code_verifier')
      ? 'Deze inloglink moet geopend worden in dezelfde browser waar je de link hebt aangevraagd.'
      : 'Deze inloglink is verlopen of ongeldig. Vraag een nieuwe aan.'

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(loginUrl.toString())
  }

  // No code in URL — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
