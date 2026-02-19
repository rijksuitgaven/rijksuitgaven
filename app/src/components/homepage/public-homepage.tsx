// H7 PROTOTYPE HOMEPAGE — used by app/h7/page.tsx only, NOT the live site
// The live homepage is homepage.tsx (rendered by app/page.tsx)
'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/use-analytics'

// ============================================================================
// Scroll Reveal — Intersection Observer, fires once per element
// Stripe-inspired: opacity 0→1 + translateY(24px→0), 700ms, spring easing
// ============================================================================

export function ScrollReveal({
  children,
  className = '',
  as: Tag = 'div',
  onVisible,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'p' | 'ul'
  onVisible?: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          onVisibleRef.current?.()
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`scroll-reveal ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

// ============================================================================
// Public Header (phone + demo + login)
// ============================================================================

export function PublicHeader({ onCtaClick }: { onCtaClick?: (section: string, element: string) => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[var(--gray-light)]">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2 rounded-lg">
            <Image
              src="/logo-icon.png"
              alt="Rijksuitgaven"
              width={48}
              height={48}
              className="h-12 w-12 sm:hidden transition-transform group-hover:scale-105"
              priority
            />
            <Image
              src="/logo.png"
              alt="Rijksuitgaven - Snel inzicht voor krachtige analyses"
              width={280}
              height={80}
              className="hidden sm:block h-14 w-auto transition-transform group-hover:scale-[1.02]"
              priority
            />
            <h1 className="sr-only">Rijksuitgaven</h1>
          </Link>

          {/* Right: phone + demo + login */}
          <div className="flex items-center gap-3">
            <a
              href="tel:0850806960"
              onClick={() => onCtaClick?.('header', 'phone')}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-2 text-[15px] font-semibold text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              085-0806960
            </a>
            <a
              href="#aanmelden"
              onClick={() => onCtaClick?.('header', 'boek_demo')}
              className="inline-flex items-center px-4 py-2 text-[15px] font-bold text-white bg-[var(--pink)] rounded-lg hover:bg-[var(--pink-hover)] transition-all hover:shadow-lg hover:shadow-pink-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Boek een demo
            </a>
            <Link
              href="/login"
              onClick={() => onCtaClick?.('header', 'login')}
              className="inline-flex items-center px-4 py-2 text-[15px] font-bold text-[var(--pink)] border border-[var(--pink)] rounded-lg bg-white hover:bg-[#fce8f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// Hero Section + Value Props + CTA
// SPACING: pt-20 pb-16 (generous top, tighter to value props)
// ============================================================================

export function HeroSection({ onCtaClick, onSectionView }: { onCtaClick?: (section: string, element: string) => void; onSectionView?: (section: string) => void }) {
  return (
    <section className="bg-white pt-16 md:pt-20 pb-12 md:pb-16">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <ScrollReveal onVisible={() => onSectionView?.('hero')}>
          <h2 className="text-[32px] md:text-[44px] lg:text-[54px] font-bold leading-[1.1] tracking-tight text-[var(--pink)]" style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}>
            Waar gaat €1.700 miljard naartoe?
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="mt-6 md:mt-8 text-[20px] md:text-[24px] font-normal leading-[1.5] text-[var(--navy-dark)]/80 max-w-[640px]">
            Rijksuitgaven is h&eacute;t onafhankelijke platform om overheidsuitgaven snel tot in detail te doorzoeken en vergelijken.
          </p>
        </ScrollReveal>

        {/* Value Props — 3 blurbs with stagger */}
        <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-8 md:gap-10 stagger-children">
          <ScrollReveal>
            <ValueProp
              icon="/icons/snelinzicht.webp"
              title="Snel inzicht en overzicht in overheidsuitgaven"
              description="In seconden overzicht in zes databronnen: Financiële Instrumenten, Apparaats- en Inkoopuitgaven, Provinciale en Gemeentelijke subsidies."
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueProp
              icon="/icons/zoekop.webp"
              title="Zoek en filter op ontvangers, regelingen en artikelen"
              description="Signaleer opvallende patronen en onverwachte uitgaven — zonder uren te zoeken in spreadsheets."
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueProp
              icon="/icons/bespaar.webp"
              title="Bespaar tijd en geld"
              description="Vergelijk ontvangers over 9 begrotingsjaren en onderbouw uw analyses met actuele cijfers."
            />
          </ScrollReveal>
        </div>

        {/* Product preview — browser-framed screenshot */}
        <ScrollReveal>
          <div className="mt-12 md:mt-16 max-w-[840px] mx-auto rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)]">
            <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
            </div>
            <Image
              src="/screenshots/Zoeken.png"
              alt="Zoek direct in meer dan €1.700 miljard aan overheidsuitgaven"
              width={1200}
              height={900}
              className="w-full h-auto"
            />
          </div>
        </ScrollReveal>

        {/* CTA — large primary, escalation step 1 */}
        <ScrollReveal>
          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center gap-4">
            <a
              href="#aanmelden"
              onClick={() => onCtaClick?.('hero', 'probeer_nu')}
              className="inline-flex items-center px-5 py-2.5 text-[16px] font-bold text-white bg-[var(--pink)] rounded-lg leading-[1.5] hover:bg-[var(--pink-hover)] transition-all hover:shadow-lg hover:shadow-pink-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Probeer nu ›
            </a>
            <a
              href="#features"
              onClick={() => onCtaClick?.('hero', 'bekijk_functies')}
              className="inline-flex items-center text-[16px] font-medium text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors underline underline-offset-4 decoration-[var(--navy-medium)]/30 hover:decoration-[var(--navy-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2 rounded"
            >
              Bekijk de functies
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function ValueProp({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-5">
      <Image
        src={icon}
        alt=""
        width={64}
        height={64}
        className="w-14 h-14 flex-shrink-0 mt-1"
      />
      <div>
        <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--navy-dark)]/70">{description}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Trust Bar — data metrics that establish credibility instantly
// ============================================================================

export function TrustBar({ onSectionView }: { onSectionView?: (section: string) => void }) {
  return (
    <section className="bg-white pb-2 md:pb-4">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <ScrollReveal onVisible={() => onSectionView?.('trust')}>
          <div className="flex flex-wrap justify-center gap-8 md:gap-14 py-6 border-y border-[var(--gray-light)]">
            <div className="text-center">
              <p className="text-[26px] md:text-[32px] font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>&euro;1.700+&nbsp;mld</p>
              <p className="text-[13px] uppercase tracking-wider text-[var(--navy-medium)] mt-1">aan uitgaven</p>
            </div>
            <div className="text-center">
              <p className="text-[26px] md:text-[32px] font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>4.900+</p>
              <p className="text-[13px] uppercase tracking-wider text-[var(--navy-medium)] mt-1">regelingen</p>
            </div>
            <div className="text-center">
              <p className="text-[26px] md:text-[32px] font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>9</p>
              <p className="text-[13px] uppercase tracking-wider text-[var(--navy-medium)] mt-1">begrotingsjaren</p>
            </div>
            <div className="text-center">
              <p className="text-[26px] md:text-[32px] font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>6</p>
              <p className="text-[13px] uppercase tracking-wider text-[var(--navy-medium)] mt-1">databronnen</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ============================================================================
// B2G Section ("Rijksuitgaven voor Overheden")
// SPACING: pt-24 pb-20 (major section break from hero)
// TRANSITION: bg switches to #f8f9fb (subtle off-white)
// ============================================================================

export function B2GSection({ onCtaClick, onSectionView }: { onCtaClick?: (section: string, element: string) => void; onSectionView?: (section: string) => void }) {
  return (
    <section id="b2g" className="bg-[#f8f9fb] pt-16 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <ScrollReveal onVisible={() => onSectionView?.('b2g')}>
          <div className="max-w-[680px]">
            <span className="inline-block px-3 py-1 text-[13px] font-bold uppercase tracking-wider text-white bg-[var(--navy-dark)] rounded-md">
              Nieuwe dienst
            </span>
            <h2 className="mt-5 text-[32px] md:text-[44px] lg:text-[54px] font-bold leading-[1.1] tracking-tight text-[var(--pink)]" style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}>
              Rijksuitgaven voor Overheden
            </h2>
            <p className="mt-5 text-[22px] md:text-[24px] leading-[1.4] text-[var(--navy-dark)]">
              Werk aan vertrouwen. Bouw aan transparantie.
            </p>
            <p className="mt-3 text-[18px] md:text-[20px] font-normal leading-[1.6] text-[var(--navy-dark)]/80">
              Rijksuitgaven voor Overheden maakt uw financiële data direct vergelijkbaar met die van andere mede-overheden en geeft uw volksvertegenwoordigers onbeperkt toegang tot rijksuitgaven.nl voor beter beleid en scherpe controle.
            </p>
          </div>
        </ScrollReveal>

        {/* CTA — primary + outlined secondary (escalation: explore) */}
        <ScrollReveal>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#aanmelden"
              onClick={() => onCtaClick?.('b2g', 'maak_afspraak')}
              className="inline-flex items-center px-5 py-2.5 text-[16px] font-bold text-white bg-[var(--pink)] rounded-lg leading-[1.5] hover:bg-[var(--pink-hover)] transition-all hover:shadow-lg hover:shadow-pink-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Maak afspraak ›
            </a>
            <a
              href="#aanmelden"
              onClick={() => onCtaClick?.('b2g', 'vraag_brochure')}
              className="inline-flex items-center px-5 py-2.5 text-[16px] font-semibold text-[var(--pink)] border-2 border-[var(--pink)] rounded-lg leading-[1.5] hover:bg-[var(--pink)] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Vraag brochure aan
            </a>
          </div>
        </ScrollReveal>

        {/* 3 B2G feature cards with stagger */}
        <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-8 md:gap-10 stagger-children">
          <ScrollReveal>
            <B2GBlurb
              icon="/icons/certificaat.png"
              title="Gecertificeerde onboarding van uw financiële data"
              description="Rijksuitgaven voor Overheden helpt u om uw data op gestructureerde wijze aan te leveren en actueel te houden. Uw data is daardoor vergelijkbaar met andere mede-overheden."
            />
          </ScrollReveal>
          <ScrollReveal>
            <B2GBlurb
              icon="/icons/gemeenteraad.png"
              title="Onbeperkte toegang voor ambtenaren en volksvertegenwoordigers"
              description="Uw financiële medewerkers en de leden van uw Provinciale Staten of gemeenteraad krijgen onbeperkt toegang tot meer dan €1.700 miljard aan overheidsuitgaven in ruim 4.900 regelingen."
            />
          </ScrollReveal>
          <ScrollReveal>
            <B2GBlurb
              icon="/icons/filters.png"
              title="Snel inzicht en overzicht in overheidsuitgaven"
              description="Zoek en filter Financiële Instrumenten, Apparaatsuitgaven, Inkoopuitgaven, Provinciale en Gemeentelijke subsidies in seconden voor snel inzicht."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

function B2GBlurb({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-5">
      <Image
        src={icon}
        alt=""
        width={80}
        height={96}
        className="w-16 h-auto flex-shrink-0 mt-1"
      />
      <div>
        <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--navy-dark)]/70">{description}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Audience Section — Horizontal tab bar (Linear/Stripe pattern)
// All 5 audiences visible as pills, animated sliding indicator, crossfade text
// ============================================================================

const audiences = [
  {
    label: 'Raadsleden',
    title: 'Raadsleden en Statenleden',
    description: 'Vergelijk prestaties met de data van andere gemeenten en provincies, formuleer vragen en verbeter beleid.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
      </svg>
    ),
  },
  {
    label: 'Politiek',
    title: 'Politieke partijen',
    description: 'Directe inzage in werkelijke realisatie van begrotingen, wetten en regelingen.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    label: 'Journalisten',
    title: 'Journalisten & onderzoekers',
    description: 'Krijg razendsnel toegang tot data om verhalen te ontdekken en impactvolle analyses te maken.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
      </svg>
    ),
  },
  {
    label: 'Bedrijven',
    title: 'Bedrijven & non-profits',
    description: 'Vind kansen in subsidies en aanbestedingen en maak betere strategische keuzes.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    label: 'Academici',
    title: 'Academici & studenten',
    description: 'Gebruik betrouwbare data voor onderzoek en onderwijs over publieke financiën.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
]

export function AudienceSection({ onSectionView, onTabClick }: { onSectionView?: (section: string) => void; onTabClick?: (tab: string) => void }) {
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Auto-advance every 5s, pause on hover
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % audiences.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section className="bg-white py-12 md:py-16">
      <ScrollReveal onVisible={() => onSectionView?.('audience')}>
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          {/* Section label */}
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.15em] text-[var(--navy-medium)]/60 mb-6">
            Gebouwd voor
          </p>

          {/* Tab bar — all audiences visible */}
          <div
            ref={tabsRef}
            className="relative flex flex-wrap justify-center gap-2 md:gap-1.5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {audiences.map((audience, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); onTabClick?.(audiences[i].label) }}
                className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2 ${
                  i === active
                    ? 'text-white'
                    : 'text-[var(--navy-dark)]/70 hover:text-[var(--navy-dark)] hover:bg-[var(--gray-light)]/50'
                }`}
              >
                {/* Animated pill background — only on active */}
                {i === active && (
                  <span
                    className="absolute inset-0 bg-[var(--navy-dark)] rounded-full shadow-[0_2px_8px_rgba(14,50,97,0.2)]"
                    style={{
                      animation: 'pillFadeIn 250ms ease-out',
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {audience.icon}
                  {audience.label}
                </span>
              </button>
            ))}
          </div>

          {/* Description area — crossfade */}
          <div
            className="mt-8 text-center max-w-[560px] mx-auto min-h-[80px] flex flex-col items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <h3
              key={`title-${active}`}
              className="text-[20px] md:text-[24px] font-bold leading-[1.2] text-[var(--navy-dark)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading), sans-serif', animation: 'audienceFadeIn 350ms ease-out' }}
            >
              {audiences[active].title}
            </h3>
            <p
              key={`desc-${active}`}
              className="mt-3 text-[16px] md:text-[17px] leading-[1.6] text-[var(--navy-dark)]/70"
              style={{ animation: 'audienceFadeIn 350ms ease-out 50ms both' }}
            >
              {audiences[active].description}
            </p>
          </div>

          {/* Progress bar — shows auto-advance timing */}
          <div className="mt-6 flex justify-center gap-1.5">
            {audiences.map((_, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full overflow-hidden bg-[var(--navy-dark)]/10"
                style={{ width: i === active ? 32 : 16, transition: 'width 300ms ease' }}
              >
                {i === active && !isPaused && (
                  <div
                    className="h-full bg-[var(--pink)] rounded-full"
                    style={{ animation: 'progressFill 5s linear' }}
                  />
                )}
                {i === active && isPaused && (
                  <div className="h-full bg-[var(--pink)] rounded-full w-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ============================================================================
// Features Section (6 cards + extra features list + promo box)
// SPACING: pt-20 pb-24 (key selling section, most breathing room)
// TRANSITION: gradient from white to #f0f3f8
// ============================================================================

export function FeaturesSection({ onCtaClick, onSectionView }: { onCtaClick?: (section: string, element: string) => void; onSectionView?: (section: string) => void }) {
  return (
    <section id="features" className="bg-gradient-to-b from-[#f8f9fb] from-[30%] to-[#eef2f7] pt-16 md:pt-20 pb-16 md:pb-24">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <ScrollReveal onVisible={() => onSectionView?.('features')}>
          <p className="text-[28px] md:text-[38px] lg:text-[46px] text-[var(--pink)] font-bold leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}>
            Het meest complete platform voor overheidsuitgaven
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="mt-4 text-[20px] md:text-[24px] font-bold leading-[1.3] text-[var(--navy-dark)] max-w-[680px]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Alles doorzoekbaar en vergelijkbaar.
          </h2>
        </ScrollReveal>

        {/* Feature cards with stagger + framing */}
        <div className="mt-10 md:mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 stagger-children">
          <ScrollReveal>
            <FeatureCard
              title="Slim zoeken"
              description="Zoek op ontvanger of uitgebreid op ontvangers, artikelen en regelingen voor diepgaand inzicht."
              images={['/screenshots/Zoeken.png']}
            />
          </ScrollReveal>
          <ScrollReveal>
            <FeatureCard
              title="Alle uitgaven per ontvanger"
              description="Bekijk per ontvanger uitgaven, regelingen en instrumenten, plus een handige link om snel verder te zoeken."
              images={['/screenshots/Detail01.png', '/screenshots/Detail02.png', '/screenshots/Detail03.png']}
            />
          </ScrollReveal>
          <ScrollReveal>
            <FeatureCard
              title="Ontdek bestedingen"
              description="Bij elke login ziet u willekeurige ontvangers en bedragen. Duik in de cijfers en trek uw eigen conclusies."
              images={['/screenshots/Random03.png', '/screenshots/Random02.png', '/screenshots/Random01.png']}
            />
          </ScrollReveal>
          <ScrollReveal>
            <FeatureCard
              title="Begroting in één oogopslag"
              description="Bekijk het volledige begrotingsoverzicht en zie hoe het geld verdeeld wordt."
              images={['/screenshots/Begroting.png']}
            />
          </ScrollReveal>
          <ScrollReveal>
            <FeatureCard
              title="Wat is er nieuw?"
              description="Ontdek de nieuwste artikelen, regelingen en instrumenten ten opzichte van vorige jaren."
              images={['/screenshots/Nieuwe-vorig-jaar.png']}
            />
          </ScrollReveal>
          <ScrollReveal>
            <FeatureCard
              title="Wie ontvangt het meest?"
              description="Bekijk de top 50 ontvangers, instrumenten en artikelen op basis van uitgaven. Duik in de cijfers!"
              images={['/screenshots/Top50-ontvangers.png']}
            />
          </ScrollReveal>
        </div>

        {/* Extra features list */}
        <ScrollReveal>
          <div className="mt-12 md:mt-16 max-w-[640px]">
            <ul className="space-y-2.5">
              {[
                'Altijd actuele cijfers dankzij regelmatige dataset-updates',
                'Nieuwe databronnen, naast de Financi\u00eble Instrumenten ook apparaatskosten en meer',
                'Slimme exportopties: Excel, CSV en kopi\u00ebren naar klembord',
                'Feedback = impact \u2014 deel idee\u00ebn en be\u00efnvloed nieuwe features',
                'Nog meer inzichten zoals snelste stijgers en dalers',
                'Integraal zoeken door alle data, voor volledige transparantie',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/80">
                  <svg className="w-5 h-5 text-[var(--pink)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        {/* Conversion CTA — peak interest moment after seeing all features */}
        <ScrollReveal>
          <div className="mt-12 bg-white rounded-xl p-8 md:p-10 text-center shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)]">
            <p className="text-[22px] md:text-[26px] font-bold leading-[1.3] text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              463.000+ ontvangers doorzoekbaar in 6 databronnen
            </p>
            <p className="mt-2 text-[16px] leading-[1.6] text-[var(--navy-dark)]/70">
              Van rijkssubsidies tot gemeentelijke uitgaven — alles in &eacute;&eacute;n platform.
            </p>
            <a
              href="#aanmelden"
              onClick={() => onCtaClick?.('features', 'boek_demo')}
              className="inline-flex items-center mt-5 px-5 py-2.5 text-[16px] font-bold text-white bg-[var(--pink)] rounded-lg leading-[1.5] hover:bg-[var(--pink-hover)] transition-all hover:shadow-lg hover:shadow-pink-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2"
            >
              Boek een demo ›
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function FeatureCard({ title, description, images }: { title: string; description: string; images: string[] }) {
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1">
      {/* Browser chrome frame */}
      <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ddd]" />
      </div>
      {/* Screenshot image — dots are NOT here, they go in the card body below */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#f5f7fa]">
        <Image
          src={images[imgIdx]}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      {/* Card body — white background */}
      <div className="px-5 pt-5 pb-6">
        {/* Carousel dots — below image on white background, clearly visible */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mb-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className="p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] rounded-full"
                aria-label={`Afbeelding ${i + 1}`}
              >
                <span className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                  i === imgIdx ? 'bg-[var(--pink)]' : 'bg-[var(--navy-dark)]/20 hover:bg-[var(--navy-dark)]/40'
                }`} />
              </button>
            ))}
          </div>
        )}
        <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--navy-dark)]/70">{description}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Subscription Section ("Onze abonnementen")
// SPACING: pt-16 pb-24 (generous bottom before contact)
// TRANSITION: gradient from #eef2f7 to white
// ============================================================================

export function SubscriptionSection({ onCtaClick, onSectionView }: { onCtaClick?: (section: string, element: string) => void; onSectionView?: (section: string) => void }) {
  return (
    <section className="bg-gradient-to-b from-[#eef2f7] to-white pt-12 md:pt-16 pb-16 md:pb-24">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <ScrollReveal onVisible={() => onSectionView?.('subscriptions')}>
          <h2 className="text-[28px] md:text-[38px] lg:text-[46px] font-bold leading-[1.1] tracking-tight text-[var(--pink)]" style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}>
            Onze abonnementen
          </h2>
        </ScrollReveal>

        {/* Professioneel */}
        <ScrollReveal>
          <div className="mt-8 md:mt-10 overflow-hidden rounded-xl shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)]">
            <div className="bg-[var(--navy-dark)] px-6 py-3.5">
              <h3 className="text-[22px] font-bold leading-[1.5] text-white text-center" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                Professioneel
              </h3>
            </div>
            <div className="bg-[#e7eef5] rounded-b-xl px-5 md:px-6 pt-5 pb-6">
              <p className="text-[18px] md:text-[20px] font-semibold leading-[1.6] text-[var(--navy-dark)]">
                Onbeperkt toegang voor diepgaande inzichten en krachtige analyses
              </p>

              <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-4">
                {/* Column 1: Features */}
                <ul>
                  {[
                    'Slim zoeken op ontvanger',
                    'Uitgebreid zoeken met filters',
                    'Alle details per ontvanger',
                    'Grafieken',
                    'Begroting in \u00e9\u00e9n oogopslag',
                    'Top ontvangers, regelingen en meer',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] leading-[2em] text-[var(--navy-dark)]">
                      <svg className="w-4 h-4 text-[var(--pink)] mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Column 2: Data */}
                <ul>
                  {[
                    'Financi\u00eble Instrumenten (2016\u20132024)',
                    'Apparaatsuitgaven (2016\u20132024)',
                    'Provinciale subsidieregisters (2018\u20132024)',
                    'Gemeentelijke subsidieregisters',
                    'Inkoopuitgaven (2017\u20132023)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] leading-[2em] text-[var(--navy-dark)]">
                      <svg className="w-4 h-4 text-[var(--pink)] mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Column 3: Benefits */}
                <ul>
                  {[
                    'Ontdek verrassende uitgaven',
                    'Snel vergelijken van data',
                    'Onbeperkte zoekopdrachten',
                    'Slimme exportopties naar Excel en CSV',
                    'Deel en be\u00efnvloed nieuwe features',
                    'En nog heel veel meer',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] leading-[2em] text-[var(--navy-dark)]">
                      <svg className="w-4 h-4 text-[var(--pink)] mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </ScrollReveal>

        {/* Op maat */}
        <ScrollReveal>
          <div className="mt-5 bg-[var(--navy-dark)] rounded-xl p-6 md:p-8 overflow-hidden shadow-[0_20px_60px_rgba(14,50,97,0.3)]" style={{ backgroundImage: 'url(/icons/wave-menu.webp)', backgroundSize: '53%', backgroundPosition: 'left bottom', backgroundRepeat: 'no-repeat' }}>
            <h3 className="text-[22px] font-bold leading-[1.4] text-white" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Op maat
            </h3>
            <p className="mt-2 text-[15px] leading-[1.7] text-white/85">
              Heeft u meerdere persoonlijke abonnementen nodig of heeft u voor uw organisatie specifieke wensen? Wij helpen u graag met een offerte op maat.
            </p>

            <ul className="mt-4 space-y-1.5">
              {[
                'Geselecteerde datasets',
                'Maatwerkrapportages en geavanceerde analyses',
                'Persoonlijk advies',
                'Trainingen en exclusieve sessies voor uw team',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px] leading-[2em] text-white/85">
                  <svg className="w-4 h-4 text-[var(--pink)] mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <a
                href="#aanmelden"
                onClick={() => onCtaClick?.('subscriptions', 'neem_contact_op')}
                className="inline-flex items-center px-5 py-2 text-[16px] font-semibold text-white border-2 border-white/40 rounded-lg leading-[1.5] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-dark)]"
              >
                Neem contact op ›
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ============================================================================
// Contact / Demo Form Section (pink background)
// SPACING: py-20 (spacious, final section, inviting)
// ============================================================================

export function ContactSection({ onCtaClick, onSectionView, onFormStart, onFormSubmit }: { onCtaClick?: (section: string, element: string) => void; onSectionView?: (section: string) => void; onFormStart?: () => void; onFormSubmit?: (success: boolean) => void }) {
  const { track } = useAnalytics()
  const [formState, setFormState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const formStarted = useRef(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('sending')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
        }),
      })

      if (res.ok) {
        setFormState('sent')
        onFormSubmit?.(true)
        form.reset()
      } else {
        setFormState('error')
        onFormSubmit?.(false)
        track('error', undefined, { message: `Contact form HTTP ${res.status}`, trigger: 'contact_form' })
      }
    } catch (err) {
      setFormState('error')
      onFormSubmit?.(false)
      track('error', undefined, { message: err instanceof Error ? err.message : 'Contact form network error', trigger: 'contact_form' })
    }
  }

  return (
    <section id="aanmelden" className="bg-[var(--pink)] pt-14 md:pt-20 pb-16 md:pb-20">
      <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: text */}
          <ScrollReveal onVisible={() => onSectionView?.('contact')}>
            <div>
              <h2 className="text-[30px] md:text-[36px] font-bold leading-[1.3] text-white" style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}>
                Interesse? Vraag meteen een demo aan
              </h2>
              <p className="mt-5 text-[18px] md:text-[20px] leading-[1.6] text-white/90">
                Wilt u ook zien wat een schat aan financiële informatie u kunt ontsluiten met Rijksuitgaven? Vul dan het contactformulier in om een demo aan te vragen en wij nemen zo snel mogelijk contact met u op.
              </p>
              <p className="mt-4 text-[18px] md:text-[20px] leading-[1.6] text-white/90">
                Direct persoonlijk contact?
                <br />
                Bel ons op{' '}
                <a href="tel:0850806960" onClick={() => onCtaClick?.('contact', 'phone')} className="text-white underline underline-offset-4 hover:no-underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pink)] rounded">
                  085-0806960
                </a>.
              </p>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal>
            <div>
              {formState === 'sent' ? (
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 text-center">
                  <svg className="w-12 h-12 text-white mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[18px] font-bold text-white">Bedankt voor uw aanvraag!</p>
                  <p className="mt-2 text-[15px] text-white/85">Wij nemen zo snel mogelijk contact met u op.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3" onFocus={() => { if (!formStarted.current) { formStarted.current = true; onFormStart?.() } }}>
                  <div>
                    <label htmlFor="contact-firstName" className="sr-only">Voornaam</label>
                    <input
                      id="contact-firstName"
                      name="firstName"
                      type="text"
                      required
                      placeholder="Voornaam *"
                      className="w-full px-4 py-3.5 rounded-lg bg-white text-[15px] text-[var(--navy-dark)] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-white/50 transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-lastName" className="sr-only">Achternaam</label>
                    <input
                      id="contact-lastName"
                      name="lastName"
                      type="text"
                      required
                      placeholder="Achternaam *"
                      className="w-full px-4 py-3.5 rounded-lg bg-white text-[15px] text-[var(--navy-dark)] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-white/50 transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="sr-only">Zakelijk e-mail</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder="Uw zakelijke e-mail *"
                      className="w-full px-4 py-3.5 rounded-lg bg-white text-[15px] text-[var(--navy-dark)] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-white/50 transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="sr-only">Telefoonnummer</label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      placeholder="Op welk nummer kunnen wij u het beste bereiken?"
                      className="w-full px-4 py-3.5 rounded-lg bg-white text-[15px] text-[var(--navy-dark)] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-white/50 transition-shadow"
                    />
                  </div>
                  <label htmlFor="contact-gdpr" className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      id="contact-gdpr"
                      name="gdpr"
                      type="checkbox"
                      required
                      className="mt-1 w-4 h-4 rounded accent-[var(--navy-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pink)]"
                    />
                    <span className="text-[14px] leading-[1.6] text-white/85">
                      Ik ga akkoord met het{' '}
                      <Link href="/privacybeleid" className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--pink)] rounded">
                        privacy beleid
                      </Link>{' '}
                      en de{' '}
                      <Link href="/voorwaarden" className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--pink)] rounded">
                        voorwaarden
                      </Link>.
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={formState === 'sending'}
                    className="w-full px-5 py-3 text-[16px] font-bold text-[var(--navy-dark)] bg-white rounded-lg leading-[1.5] hover:bg-[#f8f9fb] transition-colors disabled:opacity-50 mt-2 shadow-[0_2px_8px_rgba(14,50,97,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pink)]"
                  >
                    {formState === 'sending' ? 'Verzenden...' : 'Neem contact met mij op'}
                  </button>
                  <p className="text-[13px] text-white/70 text-center mt-2">Wij reageren binnen 1 werkdag.</p>
                  {formState === 'error' && (
                    <p className="text-[14px] text-white font-medium">Er ging iets mis. Probeer het later opnieuw of bel ons op 085-0806960.</p>
                  )}
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Main Public Homepage
// ============================================================================

export function PublicHomepage() {
  const { track, publicSessionId } = useAnalytics()
  const pageViewTracked = useRef(false)

  // Track page view on mount (once)
  useEffect(() => {
    if (pageViewTracked.current) return
    pageViewTracked.current = true

    let referrer: string | null = null
    try {
      if (document.referrer) {
        const refHost = new URL(document.referrer).hostname
        if (refHost !== window.location.hostname) {
          referrer = refHost
        }
      }
    } catch { /* invalid referrer */ }

    const params = new URLSearchParams(window.location.search)
    const utm_source = params.get('utm_source') || null
    const utm_medium = params.get('utm_medium') || null
    const utm_campaign = params.get('utm_campaign') || null

    track('public_page_view', undefined, {
      page: 'homepage',
      session_id: publicSessionId,
      referrer,
      ...(utm_source && { utm_source }),
      ...(utm_medium && { utm_medium }),
      ...(utm_campaign && { utm_campaign }),
    })
  }, [track, publicSessionId])

  const handleCtaClick = useCallback((section: string, element: string) => {
    track('public_interaction', undefined, {
      action: 'cta_click',
      section,
      element,
      session_id: publicSessionId,
    })
  }, [track, publicSessionId])

  const handleSectionView = useCallback((section: string) => {
    track('public_interaction', undefined, {
      action: 'section_view',
      section,
      session_id: publicSessionId,
    })
  }, [track, publicSessionId])

  const handleAudienceTab = useCallback((tab: string) => {
    track('public_interaction', undefined, {
      action: 'audience_tab',
      section: 'audience',
      element: tab,
      session_id: publicSessionId,
    })
  }, [track, publicSessionId])

  const handleFormStart = useCallback(() => {
    track('public_interaction', undefined, {
      action: 'contact_form_start',
      section: 'contact',
      session_id: publicSessionId,
    })
  }, [track, publicSessionId])

  const handleFormSubmit = useCallback((success: boolean) => {
    track('public_interaction', undefined, {
      action: 'contact_form_submit',
      section: 'contact',
      element: success ? 'success' : 'error',
      session_id: publicSessionId,
    })
  }, [track, publicSessionId])

  return (
    <>
      <HeroSection onCtaClick={handleCtaClick} onSectionView={handleSectionView} />
      <TrustBar onSectionView={handleSectionView} />
      <AudienceSection onSectionView={handleSectionView} onTabClick={handleAudienceTab} />
      <FeaturesSection onCtaClick={handleCtaClick} onSectionView={handleSectionView} />
      <SubscriptionSection onCtaClick={handleCtaClick} onSectionView={handleSectionView} />
      <B2GSection onCtaClick={handleCtaClick} onSectionView={handleSectionView} />
      <ContactSection onCtaClick={handleCtaClick} onSectionView={handleSectionView} onFormStart={handleFormStart} onFormSubmit={handleFormSubmit} />
    </>
  )
}
