'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

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

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-[var(--navy-medium)] hidden sm:inline truncate max-w-[200px]">
        {userEmail}
      </span>
      <Link
        href="/auth/logout"
        className="font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
      >
        Uitloggen
      </Link>
    </div>
  )
}
