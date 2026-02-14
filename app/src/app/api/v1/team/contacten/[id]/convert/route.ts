/**
 * Admin API: Convert contact to member
 *
 * POST /api/v1/team/contacten/[id]/convert — Create subscription for existing person
 *
 * "Maak lid" flow: takes a person (prospect or churned) and creates a new
 * subscription + auth user for them. The person record is preserved and linked.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id: personId } = await params

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 10_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { plan, start_date, end_date: end_date_override, role } = body as {
    plan?: string
    start_date?: string
    end_date?: string
    role?: string
  }

  if (!plan || !start_date) {
    return NextResponse.json({ error: 'Verplichte velden: plan, start_date' }, { status: 400 })
  }
  if (!['monthly', 'yearly', 'trial'].includes(plan)) {
    return NextResponse.json({ error: 'Plan moet "monthly", "yearly" of "trial" zijn' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return NextResponse.json({ error: 'start_date moet YYYY-MM-DD formaat zijn' }, { status: 400 })
  }
  if (role && !['member', 'trial', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Role moet "member", "trial" of "admin" zijn' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get the person
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('id, email, first_name, last_name, organization')
    .eq('id', personId)
    .single()

  if (personError || !person) {
    return NextResponse.json({ error: 'Contact niet gevonden' }, { status: 404 })
  }

  // Check no active subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('person_id', personId)
    .is('cancelled_at', null)
    .single()

  if (existingSub) {
    return NextResponse.json({ error: 'Deze persoon heeft al een actief abonnement' }, { status: 409 })
  }

  // Calculate dates
  const start = new Date(start_date + 'T00:00:00Z')
  let endDate: Date
  if (end_date_override && /^\d{4}-\d{2}-\d{2}$/.test(end_date_override)) {
    endDate = new Date(end_date_override + 'T00:00:00Z')
  } else if (plan === 'trial') {
    endDate = new Date(start)
    endDate.setUTCDate(endDate.getUTCDate() + 14)
  } else if (plan === 'monthly') {
    endDate = new Date(start)
    endDate.setUTCMonth(endDate.getUTCMonth() + 1)
  } else {
    endDate = new Date(start)
    endDate.setUTCFullYear(endDate.getUTCFullYear() + 1)
  }

  const graceDays = plan === 'trial' ? 0 : plan === 'monthly' ? 3 : 14
  const graceEndsAt = new Date(endDate)
  graceEndsAt.setUTCDate(graceEndsAt.getUTCDate() + graceDays)

  const endDateStr = endDate.toISOString().split('T')[0]
  const graceEndsAtStr = graceEndsAt.toISOString().split('T')[0]

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: person.email,
    email_confirm: true,
  })

  let authUserId: string

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users?.find(u => u.email === person.email)
      if (!existingUser) {
        return NextResponse.json({ error: 'Gebruiker bestaat al maar kon niet gevonden worden' }, { status: 409 })
      }
      authUserId = existingUser.id
    } else {
      console.error('[Admin] Create user error:', authError)
      return NextResponse.json({ error: 'Fout bij aanmaken account' }, { status: 500 })
    }
  } else {
    authUserId = authUser.user.id
  }

  // Create subscription
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: authUserId,
      person_id: personId,
      email: person.email,
      first_name: person.first_name,
      last_name: person.last_name,
      organization: person.organization,
      plan,
      role: role || 'member',
      start_date,
      end_date: endDateStr,
      grace_ends_at: graceEndsAtStr,
    })
    .select()
    .single()

  if (subError) {
    console.error('[Admin] Create subscription error:', subError)
    return NextResponse.json({ error: 'Fout bij aanmaken abonnement' }, { status: 500 })
  }

  return NextResponse.json({
    member: {
      ...sub,
      email: person.email,
      first_name: person.first_name,
      last_name: person.last_name,
      organization: person.organization,
    }
  }, { status: 201 })
}
