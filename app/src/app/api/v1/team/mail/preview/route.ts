/**
 * Admin API: Campaign Email Preview
 *
 * POST /api/v1/team/mail/preview — Render campaign HTML with sample data
 *
 * Returns the exact HTML that recipients will see (with sample name/unsubscribe).
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { renderCampaignEmail } from '@/app/api/_lib/campaign-template'

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 100_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, preheader, bodyHtml, ctaText, ctaUrl } = body as {
    subject?: string
    heading?: string
    preheader?: string
    bodyHtml?: string
    ctaText?: string
    ctaUrl?: string
  }

  if (!subject || !heading || !bodyHtml) {
    return NextResponse.json({ error: 'Verplichte velden: subject, heading, bodyHtml' }, { status: 400 })
  }

  const html = renderCampaignEmail({
    subject,
    heading,
    preheader: preheader || undefined,
    body: bodyHtml,
    ctaText: ctaText || undefined,
    ctaUrl: ctaUrl || undefined,
    firstName: 'Michiel',
    unsubscribeUrl: '#afmelden',
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
