/**
 * Admin API: Update/Delete Email Draft
 *
 * PUT    /api/v1/team/mail/drafts/[id] — Update existing draft
 * DELETE /api/v1/team/mail/drafts/[id] — Delete draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_SEGMENTS = new Set(['nieuw', 'in_gesprek', 'leden_maandelijks', 'leden_jaarlijks', 'verloren', 'ex_klant'])

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

interface DraftRequest {
  subject: string
  heading: string
  preheader?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  segments: string[]
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let body: DraftRequest
  try {
    const text = await request.text()
    if (text.length > 50_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, preheader, body: bodyHtml, ctaText, ctaUrl, segments } = body

  if (!subject?.trim() || !heading?.trim() || !bodyHtml?.trim()) {
    return NextResponse.json({ error: 'Verplichte velden: subject, heading, body' }, { status: 400 })
  }

  if (!Array.isArray(segments) || segments.length > 6 || segments.some(s => !VALID_SEGMENTS.has(s))) {
    return NextResponse.json({ error: 'Ongeldige segmenten' }, { status: 400 })
  }

  if (ctaUrl && !/^https?:\/\/.+/.test(ctaUrl)) {
    return NextResponse.json({ error: 'CTA URL moet beginnen met http(s)://' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Only allow updating drafts, not sent campaigns
  const { data: existing } = await supabase
    .from('campaigns')
    .select('status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Concept niet gevonden' }, { status: 404 })
  }

  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Alleen concepten kunnen worden bijgewerkt' }, { status: 400 })
  }

  const { error } = await supabase
    .from('campaigns')
    .update({
      subject: subject.trim(),
      heading: heading.trim(),
      preheader: preheader?.trim() || null,
      body: bodyHtml.trim(),
      cta_text: ctaText?.trim() || null,
      cta_url: ctaUrl?.trim() || null,
      segment: segments.join(','),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Drafts] Update error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken concept' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return forbiddenResponse()

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')

  if (error) {
    console.error('[Drafts] Delete error:', error)
    return NextResponse.json({ error: 'Fout bij verwijderen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
