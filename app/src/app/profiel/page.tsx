/**
 * Profile Page (minimal V1.0)
 *
 * Shows user email and logout option. Protected by middleware.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Profiel',
}

export default async function ProfielPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-[calc(100vh-theme(spacing.24)-theme(spacing.16))] max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--navy-dark)] mb-8" style={{ fontFamily: 'var(--font-heading), serif' }}>
        Profiel
      </h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--navy-medium)] mb-1">
            E-mailadres
          </label>
          <p className="text-[var(--navy-dark)]">{user.email}</p>
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <Link
            href="/auth/logout"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--navy-medium)] border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
          >
            Uitloggen
          </Link>
        </div>
      </div>
    </main>
  )
}
