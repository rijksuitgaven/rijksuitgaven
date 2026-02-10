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
        .select('plan, end_date, grace_ends_at, cancelled_at, first_name, last_name, organization, role')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        setState({ status: 'none', loading: false })
        return
      }

      setState({
        status: computeStatus(data.end_date, data.grace_ends_at, data.cancelled_at),
        plan: data.plan as 'monthly' | 'yearly',
        endDate: data.end_date,
        graceEndsAt: data.grace_ends_at,
        firstName: data.first_name,
        lastName: data.last_name,
        organization: data.organization,
        role: data.role as 'member' | 'admin',
        loading: false,
      })
    })
  }, [])

  return state
}
