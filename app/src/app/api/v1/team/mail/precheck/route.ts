/**
 * Admin API: Pre-Send Checklist
 *
 * POST /api/v1/team/mail/precheck — Validate campaign content before sending
 *
 * Checks 5 areas: Inhoud, Links, Afbeeldingen, Authenticatie, Ontvangers.
 * Returns pass/fail per area with items and fix suggestions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { renderCampaignEmail } from '@/app/api/_lib/campaign-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const VALID_SEGMENTS = new Set(['nieuw', 'in_gesprek', 'leden_maandelijks', 'leden_jaarlijks', 'verloren', 'ex_klant'])

// Dutch + English spam trigger words (common, not exhaustive)
const SPAM_TRIGGERS = [
  'gratis', 'free', 'klik hier', 'click here', 'act now', 'limited time',
  'congratulations', 'gefeliciteerd', 'winner', 'winnaar', 'urgent',
  'buy now', 'koop nu', '100% gratis', 'no cost', 'geen kosten',
  'earn money', 'geld verdienen', 'bitcoin', 'crypto',
]

interface PrecheckRequest {
  subject: string
  heading: string
  preheader?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  segments: string[]
}

interface CheckItem {
  label: string
  pass: boolean
  fix?: string
}

interface CheckArea {
  area: string
  pass: boolean
  items: CheckItem[]
}

function extractHrefs(html: string): string[] {
  const hrefs: string[] = []
  const regex = /href=["']([^"']+)["']/g
  let match
  while ((match = regex.exec(html)) !== null) {
    const url = match[1]
    // Skip mailto, tel, fragment-only links
    if (url.startsWith('http://') || url.startsWith('https://')) {
      hrefs.push(url)
    }
  }
  return [...new Set(hrefs)]
}

function extractImgSrcs(html: string): { src: string; hasAlt: boolean; altText: string }[] {
  const imgs: { src: string; hasAlt: boolean; altText: string }[] = []
  const regex = /<img\s[^>]*?src=["']([^"']+)["'][^>]*?>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const src = match[1]
    if (!src.startsWith('http')) continue
    const altMatch = tag.match(/alt=["']([^"']*)["']/)
    const altText = altMatch ? altMatch[1] : ''
    imgs.push({ src, hasAlt: !!altMatch, altText })
  }
  return imgs
}

async function checkUrl(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status?: number; sizeBytes?: number }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    const contentLength = res.headers.get('content-length')
    return {
      ok: res.ok,
      status: res.status,
      sizeBytes: contentLength ? parseInt(contentLength, 10) : undefined,
    }
  } catch {
    clearTimeout(timer)
    return { ok: false }
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Ongeldige origin' }, { status: 403 })
  }

  let params: PrecheckRequest
  try {
    const text = await request.text()
    if (text.length > 100_000) {
      return NextResponse.json({ error: 'Request te groot' }, { status: 413 })
    }
    params = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 })
  }

  const { subject, heading, preheader, body, ctaText, ctaUrl, segments } = params

  // Render full HTML for link/image extraction
  const fullHtml = renderCampaignEmail({
    subject: subject || '',
    heading: heading || '',
    preheader: preheader || undefined,
    body: body || '',
    ctaText: ctaText || undefined,
    ctaUrl: ctaUrl || undefined,
    firstName: 'Test',
    unsubscribeUrl: '#afmelden',
  })

  const areas: CheckArea[] = []

  // --- Area 1: Inhoud ---
  const inhoudItems: CheckItem[] = []

  // Subject length
  const subjectLen = (subject || '').trim().length
  if (subjectLen === 0) {
    inhoudItems.push({ label: 'Onderwerp is leeg', pass: false, fix: 'Voeg een onderwerp toe' })
  } else if (subjectLen < 30) {
    inhoudItems.push({ label: `Onderwerp is kort (${subjectLen} tekens)`, pass: true, fix: 'Optimaal: 30-60 tekens voor maximale zichtbaarheid' })
  } else if (subjectLen > 60) {
    inhoudItems.push({ label: `Onderwerp is lang (${subjectLen} tekens)`, pass: true, fix: 'Overweeg in te korten — wordt mogelijk afgekapt in inbox' })
  } else {
    inhoudItems.push({ label: `Onderwerp lengte OK (${subjectLen} tekens)`, pass: true })
  }

  // Spam trigger words
  const lowerSubject = (subject || '').toLowerCase()
  const lowerBody = (body || '').toLowerCase()
  const foundSpam = SPAM_TRIGGERS.filter(t => lowerSubject.includes(t) || lowerBody.includes(t))
  if (foundSpam.length > 0) {
    inhoudItems.push({
      label: `Mogelijke spam-woorden gevonden: ${foundSpam.slice(0, 3).join(', ')}`,
      pass: false,
      fix: 'Deze woorden kunnen spamfilters activeren — overweeg alternatieven',
    })
  } else {
    inhoudItems.push({ label: 'Geen spam-trigger woorden gevonden', pass: true })
  }

  // Preheader
  if (preheader?.trim()) {
    inhoudItems.push({ label: 'Preheader aanwezig', pass: true })
  } else {
    inhoudItems.push({ label: 'Geen preheader ingesteld', pass: false, fix: 'Voeg een preheader toe — dit is de voorbeeldtekst naast het onderwerp in de inbox' })
  }

  // Body not empty
  const bodyText = (body || '').replace(/<[^>]*>/g, '').trim()
  if (bodyText.length === 0) {
    inhoudItems.push({ label: 'Berichttekst is leeg', pass: false, fix: 'Voeg inhoud toe aan het bericht' })
  } else {
    inhoudItems.push({ label: 'Berichttekst aanwezig', pass: true })
  }

  areas.push({
    area: 'Inhoud',
    pass: inhoudItems.every(i => i.pass),
    items: inhoudItems,
  })

  // --- Area 2: Links ---
  const linkItems: CheckItem[] = []
  const hrefs = extractHrefs(fullHtml)
  const nonUnsubLinks = hrefs.filter(h => !h.includes('afmelden') && h !== '#afmelden')

  // Check unsubscribe link present
  const hasUnsub = hrefs.some(h => h.includes('afmelden') || h === '#afmelden')
  linkItems.push({
    label: hasUnsub ? 'Afmeldlink aanwezig' : 'Geen afmeldlink gevonden',
    pass: hasUnsub,
    fix: hasUnsub ? undefined : 'De afmeldlink wordt automatisch toegevoegd aan de footer',
  })

  // Check for localhost/test URLs
  const testUrls = nonUnsubLinks.filter(h => h.includes('localhost') || h.includes('127.0.0.1') || h.includes('test.'))
  if (testUrls.length > 0) {
    linkItems.push({
      label: `Test-URL's gevonden: ${testUrls[0]}`,
      pass: false,
      fix: 'Vervang test-URL\'s met productie-URL\'s',
    })
  }

  // Validate links (parallel HEAD requests)
  if (nonUnsubLinks.length > 0) {
    const results = await Promise.allSettled(
      nonUnsubLinks.slice(0, 10).map(async url => {
        const result = await checkUrl(url)
        return { url, ...result }
      })
    )

    let brokenCount = 0
    for (const r of results) {
      if (r.status === 'fulfilled' && !r.value.ok) {
        brokenCount++
        linkItems.push({
          label: `Broken link: ${r.value.url} (${r.value.status || 'timeout'})`,
          pass: false,
          fix: 'Controleer of deze URL correct is en bereikbaar',
        })
      }
    }

    if (brokenCount === 0) {
      linkItems.push({ label: `${nonUnsubLinks.length} link(s) gecontroleerd — alles bereikbaar`, pass: true })
    }
  } else {
    linkItems.push({ label: 'Geen externe links in het bericht', pass: true })
  }

  areas.push({
    area: 'Links',
    pass: linkItems.every(i => i.pass),
    items: linkItems,
  })

  // --- Area 3: Afbeeldingen ---
  const imgItems: CheckItem[] = []
  const imgs = extractImgSrcs(fullHtml)
  // Filter out the logo (always present)
  const contentImgs = imgs.filter(i => !i.src.includes('logo.png'))

  if (contentImgs.length === 0) {
    imgItems.push({ label: 'Geen afbeeldingen in het bericht', pass: true })
  } else {
    // Check alt text
    const missingAlt = contentImgs.filter(i => !i.hasAlt || !i.altText.trim())
    if (missingAlt.length > 0) {
      imgItems.push({
        label: `${missingAlt.length} afbeelding(en) zonder alt-tekst`,
        pass: false,
        fix: 'Voeg beschrijvende alt-tekst toe voor toegankelijkheid en als afbeeldingen niet laden',
      })
    } else {
      imgItems.push({ label: 'Alle afbeeldingen hebben alt-tekst', pass: true })
    }

    // Check image URLs reachable + size
    const imgResults = await Promise.allSettled(
      contentImgs.slice(0, 5).map(async img => {
        const result = await checkUrl(img.src)
        return { ...img, ...result }
      })
    )

    for (const r of imgResults) {
      if (r.status === 'fulfilled') {
        if (!r.value.ok) {
          imgItems.push({
            label: `Afbeelding niet bereikbaar: ${r.value.src.split('/').pop()}`,
            pass: false,
            fix: 'Controleer of de afbeelding is geüpload en de URL correct is',
          })
        } else if (r.value.sizeBytes && r.value.sizeBytes > 500_000) {
          imgItems.push({
            label: `Grote afbeelding: ${r.value.src.split('/').pop()} (${(r.value.sizeBytes / 1024).toFixed(0)} KB)`,
            pass: false,
            fix: 'Afbeeldingen groter dan 500 KB laden traag — overweeg te comprimeren',
          })
        }
      }
    }

    const allImgsOk = imgItems.every(i => i.pass)
    if (allImgsOk && contentImgs.length > 0) {
      imgItems.push({ label: `${contentImgs.length} afbeelding(en) gecontroleerd — alles OK`, pass: true })
    }
  }

  areas.push({
    area: 'Afbeeldingen',
    pass: imgItems.every(i => i.pass),
    items: imgItems,
  })

  // --- Area 4: Authenticatie ---
  const authItems: CheckItem[] = []

  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY)
      const { data: domains } = await resend.domains.list()

      const sendingDomain = 'rijksuitgaven.nl'
      const domainRecord = domains?.data?.find(
        (d: { name: string }) => d.name === sendingDomain
      )

      if (domainRecord) {
        const status = (domainRecord as { status: string }).status
        if (status === 'verified') {
          authItems.push({ label: 'Domein geverifieerd (SPF/DKIM)', pass: true })
        } else {
          authItems.push({
            label: `Domein status: ${status}`,
            pass: false,
            fix: 'Controleer DNS-instellingen in het Resend dashboard',
          })
        }
      } else {
        authItems.push({
          label: 'Verzenddomein niet gevonden in Resend',
          pass: false,
          fix: 'Voeg rijksuitgaven.nl toe in het Resend dashboard',
        })
      }
    } catch {
      authItems.push({ label: 'Kon domein-status niet ophalen', pass: true })
    }
  } else {
    authItems.push({ label: 'Resend API key niet geconfigureerd', pass: false, fix: 'Stel RESEND_API_KEY in als omgevingsvariabele' })
  }

  areas.push({
    area: 'Authenticatie',
    pass: authItems.every(i => i.pass),
    items: authItems,
  })

  // --- Area 5: Ontvangers ---
  const recipientItems: CheckItem[] = []

  if (!segments || segments.length === 0) {
    recipientItems.push({ label: 'Geen segmenten geselecteerd', pass: false, fix: 'Selecteer minimaal één ontvangersgroep' })
  } else {
    const invalidSegs = segments.filter(s => !VALID_SEGMENTS.has(s))
    if (invalidSegs.length > 0) {
      recipientItems.push({ label: `Ongeldig segment: ${invalidSegs[0]}`, pass: false })
    }

    // Count recipients (reuse segment count logic)
    const supabase = createAdminClient()
    const { data: people } = await supabase
      .from('people')
      .select('id, pipeline_stage, archived_at, unsubscribed_at, bounced_at, unsubscribe_token')

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('person_id, plan, cancelled_at, deleted_at, end_date, grace_ends_at')

    const activeSubMap = new Map<string, string>()
    if (subscriptions) {
      const now = new Date().toISOString().split('T')[0]
      for (const sub of subscriptions) {
        if (sub.cancelled_at || sub.deleted_at) continue
        const graceEnd = sub.grace_ends_at || sub.end_date
        if (graceEnd && graceEnd >= now) {
          activeSubMap.set(sub.person_id, sub.plan)
        }
      }
    }

    const segSet = new Set(segments)
    let totalCount = 0
    let bouncedCount = 0
    let unsubCount = 0

    if (people) {
      for (const person of people) {
        if (!person.unsubscribe_token || person.archived_at) continue

        // Count suppressed separately
        if (person.bounced_at) { bouncedCount++; continue }
        if (person.unsubscribed_at) { unsubCount++; continue }

        const stage = person.pipeline_stage
        if (stage === 'gewonnen') {
          const plan = activeSubMap.get(person.id)
          if (plan === 'monthly' && segSet.has('leden_maandelijks')) totalCount++
          else if (plan === 'yearly' && segSet.has('leden_jaarlijks')) totalCount++
        } else if (segSet.has(stage)) {
          totalCount++
        }
      }
    }

    if (totalCount === 0) {
      recipientItems.push({ label: 'Geen ontvangers in geselecteerde segmenten', pass: false, fix: 'Controleer of de segmenten ontvangers bevatten' })
    } else {
      recipientItems.push({ label: `${totalCount} ontvanger${totalCount !== 1 ? 's' : ''} in selectie`, pass: true })
    }

    if (bouncedCount > 0) {
      recipientItems.push({ label: `${bouncedCount} gebounced (automatisch uitgesloten)`, pass: true })
    }
    if (unsubCount > 0) {
      recipientItems.push({ label: `${unsubCount} afgemeld (automatisch uitgesloten)`, pass: true })
    }
  }

  areas.push({
    area: 'Ontvangers',
    pass: recipientItems.every(i => i.pass),
    items: recipientItems,
  })

  return NextResponse.json({
    areas,
    allPass: areas.every(a => a.pass),
  })
}
