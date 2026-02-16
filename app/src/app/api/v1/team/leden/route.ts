/**
 * Admin API: Member Management
 *
 * GET  /api/v1/team/leden — List all members (subscriptions + person data)
 * POST /api/v1/team/leden — Create new member (person + auth user + subscription)
 *
 * Identity fields (name, email, org) live on `people` table.
 * Subscription fields (plan, dates, role) live on `subscriptions` table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { syncPersonToResend } from '@/app/api/_lib/resend-audience'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, person_id, plan, role, start_date, end_date, grace_ends_at, cancelled_at, invited_at, activated_at, last_active_at, notes, created_at, people!inner(email, first_name, last_name, organization)')
    .is('deleted_at', null)
    .order('end_date', { ascending: true })

  if (error) {
    console.error('[Admin] List members error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen leden' }, { status: 500 })
  }

  // Flatten person fields into subscription for backward-compatible response shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (data ?? []).map(({ people, ...sub }: any) => ({
    ...sub,
    email: people.email,
    first_name: people.first_name,
    last_name: people.last_name,
    organization: people.organization,
  }))

  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  // Verify origin matches expected domain (basic CSRF protection)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

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

  const { email, first_name, last_name, organization, plan, start_date, end_date: end_date_override, role } = body as {
    email?: string
    first_name?: string
    last_name?: string
    organization?: string
    plan?: string
    start_date?: string
    end_date?: string
    role?: string
  }

  // Validation
  if (!email || !first_name || !last_name || !plan || !start_date) {
    return NextResponse.json({ error: 'Verplichte velden: email, first_name, last_name, plan, start_date' }, { status: 400 })
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

  // Calculate end_date and grace_ends_at
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

  const supabase = createAdminClient()
  const normalizedEmail = email.toLowerCase()

  // 1. Find or create person
  let personId: string
  const { data: existingPerson } = await supabase
    .from('people')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existingPerson) {
    personId = existingPerson.id
    // Update person fields with latest info
    await supabase.from('people').update({
      first_name,
      last_name,
      organization: organization || null,
    }).eq('id', personId)
  } else {
    const { data: newPerson, error: personError } = await supabase
      .from('people')
      .insert({
        email: normalizedEmail,
        first_name,
        last_name,
        organization: organization || null,
        source: 'admin',
      })
      .select('id')
      .single()

    if (personError || !newPerson) {
      console.error('[Admin] Create person error:', personError)
      return NextResponse.json({ error: 'Fout bij aanmaken persoon' }, { status: 500 })
    }
    personId = newPerson.id
  }

  // 2. Check for existing active subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('person_id', personId)
    .is('cancelled_at', null)
    .single()

  if (existingSub) {
    return NextResponse.json({ error: 'Deze persoon heeft al een actief abonnement' }, { status: 409 })
  }

  // 3. Create Supabase Auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  })

  let authUserId: string

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      // User already exists in auth — find them by iterating pages (no getUserByEmail in Supabase)
      let existingUser = null
      let page = 1
      while (!existingUser) {
        const { data: { users } } = await supabase.auth.admin.listUsers({ page, perPage: 50 })
        if (!users || users.length === 0) break
        existingUser = users.find(u => u.email === normalizedEmail) ?? null
        page++
      }
      if (!existingUser) {
        return NextResponse.json({ error: 'Gebruiker bestaat al maar kon niet gevonden worden' }, { status: 409 })
      }
      authUserId = existingUser.id
    } else {
      console.error('[Admin] Create user error:', authError)
      return NextResponse.json({ error: `Fout bij aanmaken gebruiker: ${authError.message}` }, { status: 500 })
    }
  } else {
    authUserId = authUser.user.id
  }

  // 4. Create subscription with person_id FK
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: authUserId,
      person_id: personId,
      email: normalizedEmail,
      first_name,
      last_name,
      organization: organization || null,
      plan,
      role: role || 'member',
      start_date,
      end_date: endDateStr,
      grace_ends_at: graceEndsAtStr,
    })
    .select()
    .single()

  if (subError) {
    // Unique partial index prevents duplicate active subscriptions (race condition guard)
    if (subError.code === '23505') {
      return NextResponse.json({ error: 'Deze persoon heeft al een actief abonnement' }, { status: 409 })
    }
    console.error('[Admin] Create subscription error:', subError)
    return NextResponse.json({ error: 'Fout bij aanmaken abonnement' }, { status: 500 })
  }

  // 5. Sync person to Resend Audience (fire-and-forget)
  syncPersonToResend('create', {
    id: personId,
    email: normalizedEmail,
    first_name,
    last_name,
  }).catch(err => {
    console.error('[Resend] Sync error on member create:', err)
  })

  return NextResponse.json({
    member: {
      ...sub,
      email: normalizedEmail,
      first_name,
      last_name,
      organization: organization || null,
    }
  }, { status: 201 })
}
