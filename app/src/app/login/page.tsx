/**
 * Login Page (Server Component shell).
 *
 * Redirects to / if user is already logged in.
 * Otherwise renders the LoginForm client component.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Inloggen',
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <main className="min-h-[calc(100vh-theme(spacing.24)-theme(spacing.16))] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Inloggen
          </h1>
          <p className="mt-2 text-sm text-[var(--navy-medium)]">
            Voer uw e-mailadres in om een inloglink te ontvangen.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
