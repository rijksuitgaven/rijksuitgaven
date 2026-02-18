'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  )
}

export function AuthButton() {
  const { userEmail, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (isLoading) return null

  if (!userEmail) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Inloggen
      </Link>
    )
  }

  async function handleLogout() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 p-2.5 rounded-lg text-[var(--navy-medium)] hover:bg-[var(--gray-light)] transition-colors min-h-[44px] min-w-[44px]"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Accountmenu"
      >
        <UserIcon className="w-5 h-5" />
        <ChevronIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-50">
          <div className="px-3 py-2 border-b border-[var(--border)]">
            <p className="text-xs text-[var(--navy-medium)]">Ingelogd als</p>
            <p className="text-sm font-medium text-[var(--navy-dark)] truncate">{userEmail}</p>
          </div>

          <Link
            href="/profiel"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-3 text-sm text-[var(--navy-dark)] hover:bg-[var(--gray-light)] transition-colors min-h-[44px]"
          >
            Mijn profiel
          </Link>

          <div className="border-t border-[var(--border)] my-1" />

          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  )
}
