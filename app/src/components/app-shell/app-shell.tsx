'use client'

import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/header'
import { PublicHeader } from '@/components/homepage'
import { SubscriptionBanner } from '@/components/subscription-banner'
import { FeedbackButton } from '@/components/feedback'
import { MobileBanner } from '@/components/mobile-banner'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth()

  // While auth state is loading, render nothing for the header area
  // to prevent flash between PublicHeader and Header
  if (isLoading) {
    return <>{children}</>
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <Header />
          <SubscriptionBanner />
        </>
      ) : (
        <PublicHeader />
      )}
      {children}
      {isLoggedIn && (
        <>
          <FeedbackButton />
          <MobileBanner />
        </>
      )}
    </>
  )
}
