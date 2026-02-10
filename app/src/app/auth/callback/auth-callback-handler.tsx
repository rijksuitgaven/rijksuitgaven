'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    // Prevent double-execution in React Strict Mode
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get('code')

    if (!code) {
      console.error('[AUTH CALLBACK] No code parameter')
      router.replace('/login?error=no_code')
      return
    }

    async function exchangeCode(authCode: string) {
      const supabase = createClient()

      // DIAGNOSTIC — remove after auth is confirmed working
      const hasVerifier = document.cookie.includes('code-verifier')
      console.error(`[AUTH CALLBACK] Code verifier present: ${hasVerifier}`)

      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

      if (error) {
        console.error('[AUTH CALLBACK] Exchange failed:', error.message)

        // Cross-device: code verifier cookie is missing
        if (error.message.includes('code verifier') || error.message.includes('both auth code and code verifier')) {
          router.replace('/login?error=cross_device')
          return
        }

        router.replace('/login?error=exchange_failed')
        return
      }

      console.error('[AUTH CALLBACK] Success, user:', data.session?.user?.email)

      // Small delay to ensure cookies are persisted before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      router.replace('/')
    }

    exchangeCode(code)
  }, [searchParams, router])

  return null
}
