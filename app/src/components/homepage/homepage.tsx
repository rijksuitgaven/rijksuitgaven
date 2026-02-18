'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  ScrollReveal,
} from '@/components/homepage/public-homepage'
import { useAnalytics } from '@/hooks/use-analytics'

// ============================================================================
// Types
// ============================================================================

interface Recipient {
  ontvanger: string
  y2024: number
  totaal: number
  barSeed: number
}

interface ApiResult {
  ontvanger: string
  y2024: number
  totaal: number
}

interface Discovery {
  target: number
  prefix: string
  suffix: string
  insight: string
  source: string
  module: string
}

// ============================================================================
// Curated Data — 26 selected recipients for default display
// ============================================================================

const CURATED_RECIPIENTS: Recipient[] = [
  { ontvanger: 'Sociale Verzekeringsbank', y2024: 36597470000, totaal: 114262130000, barSeed: 1 },
  { ontvanger: 'Zorginstituut Nederland', y2024: 24286070000, totaal: 71007222000, barSeed: 2 },
  { ontvanger: 'Belastingdienst/Toeslagen', y2024: 10645558000, totaal: 27039761000, barSeed: 3 },
  { ontvanger: 'TenneT Holding B.V.', y2024: 13100000000, totaal: 15946400000, barSeed: 4 },
  { ontvanger: 'ProRail B.V.', y2024: 9962000, totaal: 12272597000, barSeed: 5 },
  { ontvanger: 'Uitvoeringsinstituut werknemersverzekeringen', y2024: 7093067000, totaal: 18047313000, barSeed: 6 },
  { ontvanger: 'Gemeente Amsterdam', y2024: 4005827000, totaal: 11146597000, barSeed: 11 },
  { ontvanger: 'Gemeente Rotterdam', y2024: 3049142000, totaal: 11911180000, barSeed: 12 },
  { ontvanger: 'Universiteit van Amsterdam', y2024: 821924000, totaal: 5206678000, barSeed: 17 },
  { ontvanger: 'Rijksuniversiteit Groningen', y2024: 749495000, totaal: 4751545000, barSeed: 18 },
  { ontvanger: 'TNO', y2024: 382610000, totaal: 1811532000, barSeed: 28 },
  { ontvanger: 'Stichting het Rijksmuseum', y2024: 47470000, totaal: 373077000, barSeed: 35 },
  { ontvanger: 'Koninklijke Bibliotheek', y2024: 146434000, totaal: 911742000, barSeed: 37 },
  { ontvanger: 'Het Nederlandse Rode Kruis', y2024: 91547000, totaal: 311338000, barSeed: 49 },
  { ontvanger: 'Staatsbosbeheer', y2024: 38468000, totaal: 282360000, barSeed: 51 },
  { ontvanger: 'NATO', y2024: 21924000, totaal: 149285000, barSeed: 48 },
]

// ============================================================================
// Discoveries — 17 selected (from H3)
// ============================================================================

const discoveries: Discovery[] = [
  { target: 13.1, prefix: '\u20AC', suffix: 'miljard', insight: 'TenneT Holding ontving \u20AC13,1 miljard in 2024 voor het stroomnet \u2014 8\u00D7 meer dan een jaar eerder.', source: 'Bron: Financi\u00EBle Instrumenten, 2024', module: 'instrumenten' },
  { target: 8.7, prefix: '\u20AC', suffix: 'miljard', insight: 'ProRail ontving \u20AC8,7 miljard via financi\u00EBle instrumenten \u2014 voor het beheer van het Nederlandse spoornetwerk.', source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024', module: 'instrumenten' },
  { target: 6.7, prefix: '', suffix: '\u00D7', insight: 'De uitgaven via het COA stegen van \u20AC556 miljoen naar \u20AC3,7 miljard in zes jaar \u2014 een stijging van bijna 7\u00D7.', source: 'Bron: Publiek (COA), 2018\u20132024', module: 'publiek' },
  { target: 10.6, prefix: '\u20AC', suffix: 'miljard', insight: 'Via het COA stroomde \u20AC10,6 miljard naar 11.101 ontvangers \u2014 van zorgverleners tot beveiligingsbedrijven.', source: 'Bron: Publiek (COA), 2018\u20132024', module: 'publiek' },
  { target: 1.1, prefix: '\u20AC', suffix: 'miljard', insight: 'E\u00E9n bedrijf \u2014 RMA Healthcare \u2014 ontving meer dan \u20AC1 miljard van het COA.', source: 'Bron: Publiek (COA), 2018\u20132024', module: 'publiek' },
  { target: 6.5, prefix: '\u20AC', suffix: 'miljard', insight: 'Het Rijk besteedde \u20AC6,5 miljard aan ICT-leveranciers \u2014 van Protinus tot Capgemini.', source: 'Bron: Inkoopdata, 2018\u20132024', module: 'inkoop' },
  { target: 91.5, prefix: '\u20AC', suffix: 'miljard', insight: 'De Rijksoverheid gaf \u20AC91,5 miljard uit via inkoopcontracten \u2014 aan 191.000 leveranciers.', source: 'Bron: Inkoopdata, 2018\u20132024', module: 'inkoop' },
  { target: 3.4, prefix: '\u20AC', suffix: 'miljard', insight: 'Noord-Brabant ontving \u20AC3,4 miljard aan provinciale subsidies \u2014 meer dan Zeeland, Drenthe, Friesland en Utrecht samen.', source: 'Bron: Provinciale Subsidies, 2018\u20132024', module: 'provincie' },
  { target: 4.0, prefix: '\u20AC', suffix: 'miljard', insight: 'Amsterdam ontving \u20AC4,0 miljard aan gemeente-uitkeringen \u2014 bijna tweemaal zoveel als Den Haag.', source: 'Bron: Gemeente-uitkeringen, 2018\u20132024', module: 'gemeente' },
  { target: 50, prefix: '\u20AC', suffix: 'miljard', insight: '283 universiteiten en hogescholen ontvingen samen \u20AC50 miljard via financi\u00EBle instrumenten.', source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024', module: 'instrumenten' },
  { target: 114, prefix: '\u20AC', suffix: 'miljard', insight: 'De Sociale Verzekeringsbank ontving \u20AC114 miljard \u2014 het meest van alle 210.000 ontvangers van financi\u00EBle instrumenten.', source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024', module: 'instrumenten' },
  { target: 34, prefix: '\u20AC', suffix: 'miljard', insight: 'De Politie komt voor in 4 van de 6 databronnen \u2014 en ontving in totaal \u20AC34,3 miljard.', source: 'Bron: Alle bronnen, 2018\u20132024', module: 'integraal' },
  { target: 463, prefix: '', suffix: 'duizend', insight: 'In onze database staan 463.000 unieke ontvangers van overheidsgeld \u2014 doorzoekbaar in zes databronnen.', source: 'Bron: Alle bronnen, 2018\u20132024', module: 'integraal' },
]

// ============================================================================
// Constants
// ============================================================================

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023] as const
const VISIBLE_YEAR = 2024
const MAX_ROWS = 10
const BAR_WIDTHS = [32, 48, 64]
const PLACEHOLDER_SUGGESTIONS = ['ProRail', 'Gemeente Amsterdam', 'Rijksmuseum', 'Universiteit', 'Rode Kruis']
const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="200" height="200" filter="url(#n)" opacity="0.035"/></svg>`
const noiseDataUri = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

// ============================================================================
// Utilities
// ============================================================================

function formatEuro(value: number): string {
  if (value === 0) return '\u2014'
  if (value >= 1_000_000_000) { const mld = value / 1_000_000_000; return `\u20AC${mld.toFixed(1).replace('.', ',')} mld` }
  if (value >= 1_000_000) { const mln = value / 1_000_000; return mln >= 100 ? `\u20AC${Math.round(mln)} mln` : `\u20AC${mln.toFixed(1).replace('.', ',')} mln` }
  if (value >= 1_000) return `\u20AC${Math.round(value / 1_000)}k`
  return `\u20AC${value}`
}

function getBarWidth(seed: number, colIndex: number): number {
  return BAR_WIDTHS[(seed * 7 + colIndex * 13) % BAR_WIDTHS.length]
}

function hashBarSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

function useAnimatedPlaceholder(suggestions: string[], intervalMs = 3000) {
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  useEffect(() => {
    const target = suggestions[index]
    let charIndex = 0
    let timeout: ReturnType<typeof setTimeout>
    if (isTyping) {
      const typeChar = () => {
        if (charIndex <= target.length) { setDisplayed(target.slice(0, charIndex)); charIndex++; timeout = setTimeout(typeChar, 45 + Math.random() * 35) }
        else timeout = setTimeout(() => setIsTyping(false), intervalMs)
      }
      typeChar()
    } else {
      let eraseIndex = target.length
      const eraseChar = () => {
        if (eraseIndex >= 0) { setDisplayed(target.slice(0, eraseIndex)); eraseIndex--; timeout = setTimeout(eraseChar, 25) }
        else { setIndex(prev => (prev + 1) % suggestions.length); setIsTyping(true) }
      }
      eraseChar()
    }
    return () => clearTimeout(timeout)
  }, [index, isTyping, suggestions, intervalMs])
  return displayed
}

function useCountUp(target: number, duration: number, trigger: boolean): string {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    if (!trigger) { setValue(0); return }
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setValue((1 - Math.pow(1 - progress, 3)) * target)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, trigger])
  return target % 1 !== 0 ? value.toFixed(1).replace('.', ',') : Math.round(value).toString()
}

// ============================================================================
// Icons
// ============================================================================

function SearchIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
}

function SortChevron() {
  return <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ marginLeft: 4, verticalAlign: 'middle', opacity: 0.3 }}><path d="M2 3l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
}

function XIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
}

function BlueskyIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.135-4.406.718-5.858 3.165-3.296 5.618C5.862 21.186 9.394 22.296 12 17.678c2.606 4.618 6.138 3.508 8.514 1.322 2.562-2.453 1.11-4.9-3.296-5.618 2.558.341 5.373-.508 6.158-3.135.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" /></svg>
}

function ShareButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button aria-label={label} onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s, background 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
    >{icon}</button>
  )
}

// ============================================================================
// Navy Overlays (shared visual treatment)
// ============================================================================

function NavyOverlays() {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(141,186,220,0.08) 0%, transparent 70%), linear-gradient(165deg, rgba(255,255,255,0.03) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: noiseDataUri, backgroundRepeat: 'repeat', opacity: 1, pointerEvents: 'none', zIndex: 1, mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 3, background: 'linear-gradient(to bottom, transparent, var(--pink, #E62D75), transparent)', opacity: 0.4, borderRadius: 2, zIndex: 2 }} />
    </>
  )
}

// ============================================================================
// Discovery Card (H3)
// ============================================================================

function DiscoveryCard({ discovery, active, direction }: { discovery: Discovery; active: boolean; direction: 'enter' | 'exit' | 'idle' }) {
  const animatedValue = useCountUp(discovery.target, 1400, active)
  const shareText = `${discovery.insight}\n\nOntdek meer op rijksuitgaven.nl`

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: active ? 1 : 0, transform: active ? 'translateY(0)' : direction === 'exit' ? 'translateY(-12px)' : 'translateY(12px)', transition: 'opacity 0.7s cubic-bezier(0.2,1,0.2,1), transform 0.7s cubic-bezier(0.2,1,0.2,1)', pointerEvents: active ? 'auto' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 2.5rem' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: 6 }}>
        <ShareButton label="Deel op LinkedIn" icon={<LinkedInIcon />} onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://rijksuitgaven.nl')}`, '_blank', 'noopener')} />
        <ShareButton label="Deel op X" icon={<XIcon />} onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')} />
        <ShareButton label="Deel op Bluesky" icon={<BlueskyIcon />} onClick={() => window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')} />
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1, color: 'var(--pink)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
        {discovery.prefix && <span style={{ opacity: 0.9 }}>{discovery.prefix}</span>}
        {animatedValue}
        <span style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: 500, marginLeft: '0.4em', opacity: 0.85, letterSpacing: '0' }}>{discovery.suffix}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', fontWeight: 400, lineHeight: 1.55, color: '#ffffff', maxWidth: 580, marginBottom: '1.25rem' }}>{discovery.insight}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
        <a href={`/${discovery.module}`} style={{ fontFamily: 'var(--font-body)', fontSize: '0.925rem', fontWeight: 600, color: '#fff', background: 'var(--pink)', padding: '0.65rem 1.5rem', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4em', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--pink-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--pink)')}>
          Ontdek meer <span aria-hidden="true" style={{ transition: 'transform 0.2s', display: 'inline-block' }}>&rarr;</span>
        </a>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{discovery.source}</span>
      </div>
    </div>
  )
}

// ============================================================================
// Contact Form
// ============================================================================

function ContactForm() {
  const { track } = useAnalytics()
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('sending')
    const form = e.currentTarget
    const fd = new FormData(form)
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), phone: fd.get('phone') }),
      })
      if (res.ok) { setFormState('sent'); form.reset() }
      else { setFormState('error'); track('error', undefined, { message: `Contact form HTTP ${res.status}`, trigger: 'contact_form' }) }
    } catch (err) {
      setFormState('error')
      track('error', undefined, { message: err instanceof Error ? err.message : 'Contact form network error', trigger: 'contact_form' })
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', fontSize: 15, fontFamily: 'inherit',
    color: 'var(--navy-dark)', background: '#ffffff', border: '1px solid #D4DAE3',
    borderRadius: 8, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <section id="aanmelden" style={{ background: '#f8f9fb', padding: '56px 24px 64px', borderTop: '1px solid #E8ECF1' }}>
      <ScrollReveal>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="h6-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'start' }}>
            {/* Left: copy */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 12 }}>
                Contact
              </p>
              <h2 style={{
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'var(--navy-dark)',
                fontFamily: 'var(--font-heading)',
                margin: 0,
              }}>
                Neem contact op
              </h2>
              <p style={{
                marginTop: 16,
                fontSize: 'clamp(16px, 1.8vw, 18px)',
                lineHeight: 1.6,
                color: 'var(--navy-dark)',
                opacity: 0.7,
              }}>
                Benieuwd wat Rijksuitgaven voor u kan betekenen? Laat uw gegevens achter en wij nemen binnen &eacute;&eacute;n werkdag contact met u op.
              </p>
              <p style={{ marginTop: 14, fontSize: 'clamp(16px, 1.8vw, 18px)', lineHeight: 1.6, color: 'var(--navy-dark)', opacity: 0.7 }}>
                Direct bellen?{' '}
                <a href="tel:0850806960" style={{ color: 'var(--navy-dark)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>
                  085-0806960
                </a>
              </p>
            </div>

            {/* Right: form */}
            <div>
              {formState === 'sent' ? (
                <div style={{ background: '#ffffff', borderRadius: 12, padding: 32, textAlign: 'center', border: '1px solid #E8ECF1' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-dark)' }}>Bedankt voor uw aanvraag!</p>
                  <p style={{ marginTop: 8, fontSize: 16, color: 'var(--navy-medium)' }}>Wij nemen zo snel mogelijk contact met u op.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label htmlFor="h6-firstName" className="sr-only">Voornaam</label>
                  <input id="h6-firstName" name="firstName" type="text" required placeholder="Voornaam *" className="h6-contact-input" style={inputStyle} />

                  <label htmlFor="h6-lastName" className="sr-only">Achternaam</label>
                  <input id="h6-lastName" name="lastName" type="text" required placeholder="Achternaam *" className="h6-contact-input" style={inputStyle} />

                  <label htmlFor="h6-email" className="sr-only">Zakelijk e-mail</label>
                  <input id="h6-email" name="email" type="email" required placeholder="Uw zakelijke e-mail *" className="h6-contact-input" style={inputStyle} />

                  <label htmlFor="h6-phone" className="sr-only">Telefoonnummer</label>
                  <input id="h6-phone" name="phone" type="tel" placeholder="Telefoonnummer (optioneel)" className="h6-contact-input" style={inputStyle} />

                  <label htmlFor="h6-gdpr" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 4, cursor: 'pointer' }}>
                    <input id="h6-gdpr" name="gdpr" type="checkbox" required style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--pink)' }} />
                    <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--navy-medium)' }}>
                      Ik ga akkoord met het{' '}
                      <a href="/privacybeleid" style={{ color: 'var(--navy-dark)', textDecoration: 'underline', textUnderlineOffset: 2 }}>privacy beleid</a>{' '}
                      en de <a href="/voorwaarden" style={{ color: 'var(--navy-dark)', textDecoration: 'underline', textUnderlineOffset: 2 }}>voorwaarden</a>.
                    </span>
                  </label>

                  <button type="submit" disabled={formState === 'sending'} className="h6-contact-submit" style={{
                    width: '100%', padding: '13px 20px', marginTop: 4,
                    fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                    color: '#ffffff', background: 'var(--pink)', border: 'none', borderRadius: 8,
                    cursor: 'pointer', transition: 'background 0.2s, transform 0.15s',
                    opacity: formState === 'sending' ? 0.5 : 1,
                  }}>
                    {formState === 'sending' ? 'Verzenden...' : 'Verstuur'}
                  </button>


                  {formState === 'error' && (
                    <p style={{ fontSize: 15, color: 'var(--pink)', fontWeight: 500 }}>
                      Er ging iets mis. Probeer het later opnieuw of bel ons op 085-0806960.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ============================================================================
// H6 Page — "De Geintegreerde Homepage"
// ============================================================================

export default function Homepage() {
  // === H2 Search State ===
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [apiResults, setApiResults] = useState<ApiResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const animatedPlaceholder = useAnimatedPlaceholder(PLACEHOLDER_SUGGESTIONS)

  const defaultRows = useMemo(() => CURATED_RECIPIENTS.slice(0, MAX_ROWS), [])
  const isSearching = query.trim().length >= 2
  const displayRows: Recipient[] = useMemo(() => {
    if (!isSearching) return defaultRows
    if (apiResults) return apiResults.map(r => ({ ontvanger: r.ontvanger, y2024: r.y2024, totaal: r.totaal, barSeed: hashBarSeed(r.ontvanger) }))
    return []
  }, [isSearching, apiResults, defaultRows])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) { setApiResults(null); setIsLoading(false); setRateLimited(false); return }
    setIsLoading(true); setRateLimited(false)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/public/search?${new URLSearchParams({ q: trimmed, limit: '10' })}`)
        if (res.status === 429) { setRateLimited(true); setApiResults(null); setIsLoading(false); return }
        if (!res.ok) { setApiResults([]); setIsLoading(false); return }
        setApiResults(await res.json())
      } catch { setApiResults([]) } finally { setIsLoading(false) }
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleChipClick = (term: string) => { setQuery(term); inputRef.current?.focus() }
  const handleClear = () => { setQuery(''); setApiResults(null); setRateLimited(false); inputRef.current?.focus() }

  // === H3 Discovery State ===
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shuffled = useMemo(() => shuffle(discoveries), [])

  const goTo = useCallback((index: number) => { if (index === current) return; setPrevious(current); setCurrent(index) }, [current])
  const next = useCallback(() => goTo((current + 1) % shuffled.length), [current, goTo, shuffled.length])

  useEffect(() => {
    if (paused) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(next, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused, next])

  useEffect(() => {
    if (previous === null) return
    const t = setTimeout(() => setPrevious(null), 800)
    return () => clearTimeout(t)
  }, [previous])

  return (
    <main style={{ fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)' }}>
      {/* ================================================================ */}
      {/* SECTION 1 — HERO: Headline + Value Props                        */}
      {/* ================================================================ */}
      <section style={{ background: '#ffffff', padding: '64px 0 56px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
          {/* Headline */}
          <ScrollReveal>
            <h1 style={{
              fontSize: 'clamp(32px, 5.5vw, 54px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--pink)',
              fontFamily: 'var(--font-heading)',
              margin: 0,
            }}>
              Waar gaat &euro;1.700 miljard naartoe?
            </h1>
          </ScrollReveal>

          {/* Subheadline */}
          <ScrollReveal>
            <p style={{
              marginTop: 28,
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'var(--navy-dark)',
              opacity: 0.75,
              maxWidth: 800,
            }}>
              Rijksuitgaven is h&eacute;t onafhankelijke platform om overheidsuitgaven snel tot in detail te doorzoeken en vergelijken.
            </p>
          </ScrollReveal>

          {/* Value Props — Editorial Data Markers */}
          <ScrollReveal>
            <div className="h6-value-props" style={{
              marginTop: 48,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
            }}>
              {[
                { title: 'Snel inzicht en overzicht', desc: 'Doorzoek uitgaven van Rijksoverheid en medeoverheden in seconden.' },
                { title: 'Zoek en filter op elk detail', desc: 'Duik de diepte in en signaleer eenvoudig opvallende uitgaven en heldere patronen.' },
                { title: 'Bespaar tijd en geld', desc: 'Vind direct de data die u nodig heeft en vergelijk met voorgaande jaren voor krachtige analyses.' },
              ].map((prop) => (
                <div key={prop.title} style={{
                  borderLeft: '3px solid var(--pink)',
                  paddingLeft: 20,
                }}>
                  <p style={{
                    fontSize: 'clamp(17px, 2vw, 20px)',
                    fontWeight: 700,
                    color: 'var(--navy-dark)',
                    lineHeight: 1.3,
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                  }}>
                    {prop.title}
                  </p>
                  <p style={{
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: 'var(--navy-dark)',
                    opacity: 0.7,
                    margin: '8px 0 0',
                  }}>
                    {prop.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2 — H2 WIDGET: Probeer het zelf                         */}
      {/* ================================================================ */}
      <section style={{ background: '#ffffff', padding: '0 24px 56px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 12 }}>Probeer het zelf</p>
          </ScrollReveal>
        </div>

        {/* Dark navy card */}
        <ScrollReveal>
          <div style={{ maxWidth: 1100, margin: '32px auto 0', position: 'relative', background: 'var(--navy-dark)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)' }}>
            <NavyOverlays />
            <div style={{ position: 'relative', zIndex: 3, padding: '32px 32px 28px' }}>
              {/* Search */}
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: isFocused ? 'var(--pink)' : 'rgba(255,255,255,0.4)', transition: 'color 0.25s', display: 'flex', alignItems: 'center' }}><SearchIcon /></div>
                  <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                    placeholder={query ? undefined : `Zoek bijv. "${animatedPlaceholder}"...`}
                    style={{ width: '100%', padding: '16px 20px 16px 52px', fontSize: 16, fontFamily: 'inherit', fontWeight: 400, color: 'var(--navy-dark)', background: 'rgba(255,255,255,0.95)', border: '2px solid transparent', borderColor: isFocused ? 'var(--pink)' : 'transparent', borderRadius: 12, outline: 'none', transition: 'border-color 0.25s' }}
                    autoComplete="off" spellCheck={false}
                  />
                  {query && (
                    <button onClick={handleClear} aria-label="Zoekveld wissen" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-medium)', padding: 6, borderRadius: 8, display: 'flex' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                {!query && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: '32px', marginRight: 4 }}>Probeer:</span>
                    {['ProRail', 'Amsterdam', 'Universiteit', 'Rijksmuseum', 'Rode Kruis'].map(term => (
                      <button key={term} onClick={() => handleChipClick(term)}
                        style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.transform = 'translateY(0)' }}
                      >{term}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Table */}
              <div style={{ marginTop: 24, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="h6-table-scroll" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-condensed)', fontSize: 14, minWidth: 880 }}>
                    <thead>
                      <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #E8ECF1' }}>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--navy-dark)', fontSize: 13, position: 'sticky', left: 0, background: '#F7F8FA', zIndex: 1, minWidth: 200 }}>Ontvanger<SortChevron /></th>
                        {YEARS.map(y => <th key={y} className="h6-year-col" style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: 'var(--navy-medium)', fontSize: 13, width: 64, opacity: 0.5 }}>{y}</th>)}
                        <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: 'var(--navy-dark)', fontSize: 13, width: 100 }}>{VISIBLE_YEAR}<SortChevron /></th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--navy-dark)', fontSize: 13, width: 110 }}>Totaal<SortChevron /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateLimited ? (
                        <tr><td colSpan={YEARS.length + 3} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--navy-medium)', fontSize: 14 }}>U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw.</td></tr>
                      ) : isLoading && isSearching ? (
                        Array.from({ length: MAX_ROWS }).map((_, i) => (
                          <tr key={`sk-${i}`} style={{ borderBottom: '1px solid #F0F2F5' }}>
                            <td style={{ padding: '10px 16px', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}><div className="h6-skeleton" style={{ width: 120 + (i % 3) * 40, height: 14, borderRadius: 4 }} /></td>
                            {YEARS.map((_, ci) => <td key={ci} className="h6-year-col" style={{ padding: '10px 8px', textAlign: 'center' }}><div className="h6-skeleton" style={{ width: BAR_WIDTHS[ci % 3], height: 14, borderRadius: 4, margin: '0 auto' }} /></td>)}
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}><div className="h6-skeleton" style={{ width: 60, height: 14, borderRadius: 4, marginLeft: 'auto' }} /></td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}><div className="h6-skeleton" style={{ width: 72, height: 14, borderRadius: 4, marginLeft: 'auto' }} /></td>
                          </tr>
                        ))
                      ) : displayRows.length > 0 ? (
                        displayRows.map((r, i) => (
                          <tr key={r.ontvanger} className="h6-table-row" style={{ borderBottom: '1px solid #F0F2F5', transition: 'background 0.15s', opacity: 0, animation: `h6RowFadeIn 0.3s ease-out ${i * 0.03}s forwards` }}>
                            <td style={{ padding: '10px 16px', color: 'var(--navy-dark)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>{r.ontvanger}</td>
                            {YEARS.map((_, ci) => <td key={ci} className="h6-year-col" style={{ padding: '10px 8px', textAlign: 'center' }}><div style={{ width: getBarWidth(r.barSeed, ci), height: 14, borderRadius: 4, background: 'var(--navy-dark)', opacity: 0.1, margin: '0 auto' }} /></td>)}
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--navy-dark)', whiteSpace: 'nowrap' }}>{formatEuro(r.y2024)}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--navy-dark)', whiteSpace: 'nowrap' }}>{formatEuro(r.totaal)}</td>
                          </tr>
                        ))
                      ) : isSearching ? (
                        <tr><td colSpan={YEARS.length + 3} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--navy-medium)', fontSize: 14 }}>Geen resultaten voor &ldquo;{query}&rdquo; &mdash; probeer een andere zoekterm</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-condensed)' }}>Bronnen: Rijksoverheid &amp; medeoverheden</span>
                <a href="/login" className="h6-cta-link" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
                  <span>Bekijk alle jaren en data</span>
                  <span className="h6-cta-arrow" style={{ transition: 'transform 0.2s' }}>&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3 — TRUST BAR (3 items)                                 */}
      {/* ================================================================ */}
      <section style={{ background: '#ffffff', padding: '0 0 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
          <ScrollReveal className="scroll-reveal-scale">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 56px', padding: '24px 0 28px', borderTop: '1px solid var(--gray-light, #E1EAF2)', borderBottom: '1px solid var(--gray-light, #E1EAF2)' }}>
              {[
                { value: '450.000+', label: 'ontvangers' },
                { value: '9 jaar', label: 'data' },
                { value: '\u20AC1.700+ mld', label: 'aan uitgaven' },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: 'var(--navy-dark)', fontFamily: 'var(--font-heading)' }}>{m.value}</p>
                  <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--navy-medium)', marginTop: 4 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4 — AUDIENCE: Gebouwd voor                               */}
      {/* ================================================================ */}
      <section style={{ background: '#f8f9fb', padding: '56px 24px 64px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 24 }}>
              Gebouwd voor
            </p>
          </ScrollReveal>

          <div className="h6-scenarios" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { audience: 'Gemeenteraadslid', query: 'jeugdzorg', result: 'Vergelijkt 3 gemeenten in 30 seconden' },
              { audience: 'Onderzoeksjournalist', query: 'COA', result: 'Ontdekt \u20AC10,6 mld naar 11.101 ontvangers' },
              { audience: 'Ondernemer', query: 'ICT inkoop', result: 'Vindt \u20AC6,5 mld aan overheidscontracten' },
              { audience: 'Kamerlid', query: 'defensie', result: 'Ziet \u20AC34 mld over 9 begrotingsjaren' },
              { audience: 'Onderzoeker', query: 'universiteiten', result: 'Vergelijkt \u20AC50 mld aan bekostiging' },
              { audience: 'Beleidsmaker', query: 'klimaat', result: 'Vergelijkt uitgaven over 5 departementen' },
            ].map((s) => (
              <ScrollReveal key={s.audience}>
                <div className="h6-split-card" style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(14,50,97,0.08), 0 1px 3px rgba(14,50,97,0.06)',
                  transition: 'transform 0.25s cubic-bezier(0.2,1,0.2,1), box-shadow 0.25s',
                }}>
                  {/* Top: Navy Medium — audience + search query */}
                  <div style={{
                    position: 'relative',
                    background: 'var(--navy-medium, #436FA3)',
                    padding: '20px 20px 20px',
                    overflow: 'hidden',
                  }}>
                    {/* Pink top accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--pink, #E62D75)', zIndex: 3 }} />
                    {/* Subtle noise overlay */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: noiseDataUri, backgroundRepeat: 'repeat', opacity: 1, pointerEvents: 'none', mixBlendMode: 'overlay' }} />

                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, lineHeight: 1.2 }}>
                        {s.audience}
                      </p>

                      <div style={{
                        marginTop: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                        padding: '8px 14px',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy-medium, #436FA3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy-dark)', fontFamily: 'var(--font-condensed, "IBM Plex Sans Condensed", sans-serif)' }}>
                          {s.query}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: White — result */}
                  <div style={{
                    background: '#ffffff',
                    padding: '18px 20px 20px',
                  }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', lineHeight: 1.45, margin: 0 }}>
                      <span style={{ color: 'var(--pink)', marginRight: 6 }}>&rarr;</span>{s.result}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5 — PRICING: Three columns                               */}
      {/* ================================================================ */}
      <section style={{ background: '#ffffff', padding: '56px 24px 64px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 12 }}>
              Onze abonnementen
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, lineHeight: 1.15, color: 'var(--navy-dark)', margin: '0 0 40px', fontFamily: 'var(--font-heading)' }}>
              Kies het plan dat bij u past
            </h2>
          </ScrollReveal>

          <div className="h6-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
            {/* Professioneel */}
            <ScrollReveal>
              <div className="h6-pricing-card" style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(14,50,97,0.08), 0 1px 3px rgba(14,50,97,0.06)',
                transition: 'transform 0.25s cubic-bezier(0.2,1,0.2,1), box-shadow 0.25s',
              }}>
                <div style={{
                  position: 'relative',
                  background: 'var(--navy-medium, #436FA3)',
                  padding: '24px 24px 20px',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: noiseDataUri, backgroundRepeat: 'repeat', opacity: 1, pointerEvents: 'none', mixBlendMode: 'overlay' }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>Professioneel</h3>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)', background: 'rgba(255,255,255,0.95)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Populair</span>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5 }}>
                      Alle data, alle inzichten.
                    </p>
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '24px 24px 28px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { title: 'Zoek en filter op elk detail', desc: 'Ontvangers, regelingen, artikelen en instrumenten' },
                      { title: '9 begrotingsjaren naast elkaar', desc: 'Vergelijk trends van 2016 tot 2024' },
                      { title: 'Alle overheidsuitgaven, \u00e9\u00e9n platform', desc: 'Van rijkssubsidies tot gemeentelijke uitkeringen' },
                      { title: 'Alle details per ontvanger', desc: 'Uitklapbaar, met alle regelingen en bedragen' },
                      { title: 'Exporteer naar Excel en CSV', desc: 'Download resultaten met \u00e9\u00e9n klik' },
                      { title: 'Onbeperkt zoeken en ontdekken', desc: 'Geen limiet op zoekopdrachten' },
                    ].map((f) => (
                      <li key={f.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--pink)', fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>&#x2713;</span>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy-dark)', margin: 0, lineHeight: 1.4 }}>{f.title}</p>
                          <p style={{ fontSize: 14, color: 'var(--navy-medium)', margin: '2px 0 0', lineHeight: 1.45 }}>{f.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <a href="#aanmelden" className="h6-pricing-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)',
                    textDecoration: 'none', paddingTop: 8,
                    transition: 'color 0.2s',
                  }}>
                    Neem contact op <span className="h6-pricing-arrow" style={{ transition: 'transform 0.2s' }}>&rarr;</span>
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Op maat */}
            <ScrollReveal>
              <div className="h6-pricing-card" style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(14,50,97,0.08), 0 1px 3px rgba(14,50,97,0.06)',
                transition: 'transform 0.25s cubic-bezier(0.2,1,0.2,1), box-shadow 0.25s',
              }}>
                <div style={{
                  position: 'relative',
                  background: 'var(--navy-medium, #436FA3)',
                  padding: '24px 24px 20px',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: noiseDataUri, backgroundRepeat: 'repeat', opacity: 1, pointerEvents: 'none', mixBlendMode: 'overlay' }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>Op maat</h3>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5 }}>
                      Uw wensen, onze expertise.
                    </p>
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '24px 24px 28px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      'Geselecteerde datasets',
                      'Maatwerkrapportages en geavanceerde analyses',
                      'Persoonlijk advies',
                      'Trainingen en exclusieve sessies voor uw team',
                    ].map((item) => (
                      <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--pink)', fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>&#x2713;</span>
                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy-dark)', margin: 0, lineHeight: 1.4 }}>{item}</p>
                      </li>
                    ))}
                  </ul>
                  <a href="#aanmelden" className="h6-pricing-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)',
                    textDecoration: 'none', paddingTop: 8,
                    transition: 'color 0.2s',
                  }}>
                    Neem contact op <span className="h6-pricing-arrow" style={{ transition: 'transform 0.2s' }}>&rarr;</span>
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Voor Overheden */}
            <ScrollReveal>
              <div className="h6-pricing-card" style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(14,50,97,0.08), 0 1px 3px rgba(14,50,97,0.06)',
                transition: 'transform 0.25s cubic-bezier(0.2,1,0.2,1), box-shadow 0.25s',
              }}>
                <div style={{
                  position: 'relative',
                  background: 'var(--navy-dark, #0E3261)',
                  padding: '24px 24px 20px',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: noiseDataUri, backgroundRepeat: 'repeat', opacity: 1, pointerEvents: 'none', mixBlendMode: 'overlay' }} />
                  <div style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: 3, background: 'linear-gradient(to bottom, transparent, var(--pink, #E62D75), transparent)', opacity: 0.5, borderRadius: 2, zIndex: 2 }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>Voor Overheden</h3>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5 }}>
                      Transparantie voor uw hele gemeente.
                    </p>
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '24px 24px 28px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { title: 'Gecertificeerde data-onboarding', desc: 'Uw financi\u00eble data, vergelijkbaar met alle andere overheden' },
                      { title: 'Onbeperkt toegang voor iedereen', desc: 'Ambtenaren, raadsleden en wethouders in uw gemeente' },
                      { title: 'Volledige platformtoegang', desc: 'Alle functies van het Professioneel-abonnement' },
                      { title: 'Persoonlijke begeleiding', desc: 'Onboarding, training en doorlopende ondersteuning' },
                    ].map((f) => (
                      <li key={f.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--pink)', fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>&#x2713;</span>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy-dark)', margin: 0, lineHeight: 1.4 }}>{f.title}</p>
                          <p style={{ fontSize: 14, color: 'var(--navy-medium)', margin: '2px 0 0', lineHeight: 1.45 }}>{f.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <a href="#aanmelden" className="h6-pricing-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)',
                    textDecoration: 'none', paddingTop: 8,
                    transition: 'color 0.2s',
                  }}>
                    Neem contact op <span className="h6-pricing-arrow" style={{ transition: 'transform 0.2s' }}>&rarr;</span>
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 6 — ONTDEKKING: Re-engagement before contact             */}
      {/* ================================================================ */}
      <section style={{ background: '#ffffff', padding: '40px 24px 64px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal>
            <div
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              style={{ position: 'relative', background: 'var(--navy-dark)', borderRadius: 16, minHeight: 280, overflow: 'hidden', boxShadow: '0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)' }}
            >
              <NavyOverlays />
              <div style={{ position: 'relative', zIndex: 3, minHeight: 280 }}>
                {shuffled.map((d, i) => (
                  <DiscoveryCard key={i} discovery={d} active={i === current} direction={i === previous ? 'exit' : i === current ? 'enter' : 'idle'} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 7 — CONTACT                                              */}
      {/* ================================================================ */}
      <ContactForm />

      {/* Keyframe Animations */}
      <style>{`
        @keyframes h6RowFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes h6Shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        .h6-skeleton {
          background: linear-gradient(90deg, #F0F2F5 0%, #E8ECF1 50%, #F0F2F5 100%);
          background-size: 200px 100%;
          animation: h6Shimmer 1.2s ease-in-out infinite;
        }
        .h6-table-row:hover td { background: #F8FAFD !important; }
        .h6-cta-link:hover { color: var(--pink, #E62D75) !important; }
        .h6-cta-link:hover .h6-cta-arrow { transform: translateX(4px); }
        input::placeholder { color: var(--navy-medium, #436FA3); opacity: 0.6; }
        .h6-table-scroll { scrollbar-width: thin; scrollbar-color: #C4CDD8 #F0F2F5; }
        .h6-table-scroll::-webkit-scrollbar { height: 6px; }
        .h6-table-scroll::-webkit-scrollbar-track { background: #F0F2F5; border-radius: 3px; }
        .h6-table-scroll::-webkit-scrollbar-thumb { background: #C4CDD8; border-radius: 3px; }
        @media (max-width: 768px) {
          .h6-year-col { display: none; }
          table { min-width: 0 !important; }
          .h6-value-props { grid-template-columns: 1fr !important; gap: 24px !important; }
          .h6-scenarios { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .h6-scenarios { grid-template-columns: repeat(2, 1fr) !important; }
          .h6-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .h6-split-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(14,50,97,0.16), 0 2px 8px rgba(14,50,97,0.1);
        }
        .h6-pricing-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(14,50,97,0.16), 0 2px 8px rgba(14,50,97,0.1);
        }
        .h6-pricing-cta:hover {
          color: var(--pink) !important;
        }
        .h6-pricing-cta:hover .h6-pricing-arrow {
          transform: translateX(4px);
        }
        .h6-contact-submit:hover {
          background: #c8245f !important;
          transform: translateY(-1px);
        }
        .h6-contact-input:focus {
          border-color: var(--pink) !important;
          box-shadow: 0 0 0 3px rgba(230,45,117,0.1);
        }
        .h6-contact-input::placeholder {
          color: var(--navy-dark) !important;
          opacity: 0.45 !important;
        }
        @media (max-width: 768px) {
          .h6-pricing-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .h6-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
