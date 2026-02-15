'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  userEmail?: string
  isLoggedIn: boolean
  isLoading: boolean
}

export function useAuth(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, isLoading: true })

  useEffect(() => {
    const supabase = createClient()

    // Initial check — getSession() reads from cookies locally, no network call
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuth({ userEmail: session.user.email ?? undefined, isLoggedIn: true, isLoading: false })
      } else {
        setAuth({ isLoggedIn: false, isLoading: false })
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuth({ userEmail: session.user.email ?? undefined, isLoggedIn: true, isLoading: false })
      } else {
        setAuth({ userEmail: undefined, isLoggedIn: false, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return auth
}
