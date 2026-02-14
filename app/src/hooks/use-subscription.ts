'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SubscriptionStatus = 'active' | 'grace' | 'expired' | 'none'

export interface SubscriptionState {
  status: SubscriptionStatus
  plan?: 'monthly' | 'yearly'
  endDate?: string
  graceEndsAt?: string
  firstName?: string
  lastName?: string
  organization?: string
  role?: 'member' | 'admin'
  loading: boolean
}

function computeStatus(endDate: string, graceEndsAt: string, cancelledAt: string | null): SubscriptionStatus {
  if (cancelledAt) return 'expired'
  const today = new Date().toISOString().split('T')[0]
  if (today <= endDate) return 'active'
  if (today <= graceEndsAt) return 'grace'
  return 'expired'
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({ status: 'none', loading: true })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setState({ status: 'none', loading: false })
        return
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, end_date, grace_ends_at, cancelled_at, role, people!inner(first_name, last_name, organization)')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        setState({ status: 'none', loading: false })
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const person = (data as any).people as { first_name: string | null; last_name: string | null; organization: string | null }

      setState({
        status: computeStatus(data.end_date, data.grace_ends_at, data.cancelled_at),
        plan: data.plan as 'monthly' | 'yearly',
        endDate: data.end_date,
        graceEndsAt: data.grace_ends_at,
        firstName: person.first_name ?? undefined,
        lastName: person.last_name ?? undefined,
        organization: person.organization ?? undefined,
        role: data.role as 'member' | 'admin',
        loading: false,
      })
    })
  }, [])

  return state
}
