'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const { userEmail } = useAuth()

  if (!userEmail) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
      >
        Inloggen
      </Link>
    )
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-[var(--navy-medium)] hidden sm:inline truncate max-w-[200px]">
        {userEmail}
      </span>
      <button
        onClick={handleLogout}
        className="font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
      >
        Uitloggen
      </button>
    </div>
  )
}
