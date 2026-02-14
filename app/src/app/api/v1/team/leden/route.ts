/**
 * Admin API: Member Management
 *
 * GET  /api/v1/team/leden — List all subscriptions
 * POST /api/v1/team/leden — Create new member (auth user + subscription)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

export async function GET() {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, email, first_name, last_name, organization, plan, role, start_date, end_date, grace_ends_at, cancelled_at, invited_at, activated_at, last_active_at, notes, created_at')
    .order('end_date', { ascending: true })

  if (error) {
    console.error('[Admin] List members error:', error)
    return NextResponse.json({ error: 'Fout bij ophalen leden' }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  // Verify origin matches expected domain (basic CSRF protection)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
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
  // Validate role if provided (defaults to 'member' in DB)
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

  // Create Supabase Auth user (sends magic link invite email)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) {
    // User might already exist
    if (authError.message?.includes('already been registered')) {
      // Get existing user
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users?.find(u => u.email === email)
      if (!existingUser) {
        return NextResponse.json({ error: 'Gebruiker bestaat al maar kon niet gevonden worden' }, { status: 409 })
      }

      // Check if subscription already exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (existingSub) {
        return NextResponse.json({ error: 'Dit e-mailadres heeft al een abonnement' }, { status: 409 })
      }

      // Create subscription for existing auth user
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: existingUser.id,
          email,
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
        console.error('[Admin] Create subscription error:', subError)
        return NextResponse.json({ error: 'Fout bij aanmaken abonnement' }, { status: 500 })
      }

      return NextResponse.json({ member: sub }, { status: 201 })
    }

    console.error('[Admin] Create user error:', authError)
    return NextResponse.json({ error: `Fout bij aanmaken gebruiker: ${authError.message}` }, { status: 500 })
  }

  // Create subscription row
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: authUser.user.id,
      email,
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
    console.error('[Admin] Create subscription error:', subError)
    // Rollback: delete the auth user we just created
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: 'Fout bij aanmaken abonnement' }, { status: 500 })
  }

  return NextResponse.json({ member: sub }, { status: 201 })
}
