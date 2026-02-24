'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

/* ------------------------------------------------------------------ */
/*  Data — 23 verified discoveries (production Supabase, 2026-02-14)  */
/* ------------------------------------------------------------------ */

interface Discovery {
  /** Numeric target for count-up animation */
  target: number
  /** Unit prefix, e.g. "€" */
  prefix: string
  /** Unit suffix, e.g. "miljard" */
  suffix: string
  /** One bold editorial sentence */
  insight: string
  /** Small attribution line */
  source: string
  /** Module slug for CTA link */
  module: string
}

const discoveries: Discovery[] = [
  // — Energy & Infrastructure —
  {
    target: 13.1,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'TenneT Holding ontving \u20AC13,1 miljard in 2024 voor het stroomnet \u2014 8\u00D7 meer dan een jaar eerder.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2024',
    module: 'instrumenten',
  },
  {
    target: 17,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'TenneT ontving in totaal \u20AC17 miljard via financi\u00EBle instrumenten \u2014 waarvan \u20AC13 miljard alleen in 2024.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 8.7,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'ProRail ontving \u20AC8,7 miljard via financi\u00EBle instrumenten \u2014 voor het beheer van het Nederlandse spoornetwerk.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 2.2,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'NS Reizigers ontving \u20AC2,2 miljard via financi\u00EBle instrumenten \u2014 los van wat ProRail ontving voor het spoor.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },

  // — Asylum & Migration —
  {
    target: 6.7,
    prefix: '',
    suffix: '\u00D7',
    insight:
      'De uitgaven via het COA stegen van \u20AC556 miljoen naar \u20AC3,7 miljard in zes jaar \u2014 een stijging van bijna 7\u00D7.',
    source: 'Bron: Publiek (COA), 2018\u20132024',
    module: 'publiek',
  },
  {
    target: 10.6,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Via het COA stroomde \u20AC10,6 miljard naar 11.101 ontvangers \u2014 van zorgverleners tot beveiligingsbedrijven.',
    source: 'Bron: Publiek (COA), 2018\u20132024',
    module: 'publiek',
  },
  {
    target: 3.7,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Het COA besteedde \u20AC3,7 miljard in 2024 \u2014 meer dan in 2018, 2019 en 2020 samen.',
    source: 'Bron: Publiek (COA), 2018\u20132024',
    module: 'publiek',
  },
  {
    target: 1.1,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'E\u00E9n bedrijf \u2014 RMA Healthcare \u2014 ontving meer dan \u20AC1 miljard van het COA.',
    source: 'Bron: Publiek (COA), 2018\u20132024',
    module: 'publiek',
  },
  {
    target: 730,
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'Beveiligingsbedrijf Trigion ontving \u20AC730 miljoen van het COA \u2014 de op \u00E9\u00E9n na grootste COA-ontvanger.',
    source: 'Bron: Publiek (COA), 2018\u20132024',
    module: 'publiek',
  },

  // — Government IT & Procurement —
  {
    target: 6.5,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Het Rijk besteedde \u20AC6,5 miljard aan ICT-leveranciers \u2014 van Protinus tot Capgemini.',
    source: 'Bron: Inkoopdata, 2018\u20132024',
    module: 'inkoop',
  },
  {
    target: 2.1,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Bouwbedrijf Heijmans ontving \u20AC2,1 miljard aan rijksinkoop \u2014 de grootste overheidsleverancier.',
    source: 'Bron: Inkoopdata, 2018\u20132024',
    module: 'inkoop',
  },
  {
    target: 637,
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'De landsadvocaat Pels Rijcken ontving \u20AC637 miljoen aan rijksinkoop \u2014 verdeeld over 213 contracten.',
    source: 'Bron: Inkoopdata, 2018\u20132024',
    module: 'inkoop',
  },
  {
    target: 91.5,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'De Rijksoverheid gaf \u20AC91,5 miljard uit via inkoopcontracten \u2014 aan 191.000 leveranciers.',
    source: 'Bron: Inkoopdata, 2018\u20132024',
    module: 'inkoop',
  },

  // — Regional —
  {
    target: 3.4,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Noord-Brabant ontving \u20AC3,4 miljard aan provinciale subsidies \u2014 meer dan Zeeland, Drenthe, Friesland en Utrecht samen.',
    source: 'Bron: Provinciale Subsidies, 2018\u20132024',
    module: 'provincie',
  },
  {
    target: 4.0,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'Amsterdam ontving \u20AC4,0 miljard aan gemeente-uitkeringen \u2014 bijna tweemaal zoveel als Den Haag.',
    source: 'Bron: Gemeente-uitkeringen, 2018\u20132024',
    module: 'gemeente',
  },

  // — Culture & Education —
  {
    target: 813,
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'De Koninklijke Bibliotheek ontving \u20AC813 miljoen \u2014 2,4\u00D7 meer dan het Rijksmuseum.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 50,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      '283 universiteiten en hogescholen ontvingen samen \u20AC50 miljard via financi\u00EBle instrumenten.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 336,
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'Het Rijksmuseum ontving \u20AC336 miljoen via financi\u00EBle instrumenten \u2014 het Van Gogh Museum \u20AC98 miljoen.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },

  // — System-wide —
  {
    target: 114,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'De Sociale Verzekeringsbank ontving \u20AC114 miljard \u2014 het meest van alle 210.000 ontvangers van financi\u00EBle instrumenten.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 34,
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'De Politie komt voor in 4 van de 6 databronnen \u2014 en ontving in totaal \u20AC34,3 miljard.',
    source: 'Bron: Alle bronnen, 2018\u20132024',
    module: 'integraal',
  },
  {
    target: 179,
    prefix: '',
    suffix: 'ontvangers',
    insight:
      'Slechts 179 van de 210.000 ontvangers kregen elk meer dan \u20AC1 miljard via financi\u00EBle instrumenten.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 26,
    prefix: '',
    suffix: '%',
    insight:
      'De 10 grootste ontvangers ontvingen 26% van alle financi\u00EBle instrumenten \u2014 \u20AC334 van \u20AC1.289 miljard.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2018\u20132024',
    module: 'instrumenten',
  },
  {
    target: 463,
    prefix: '',
    suffix: 'duizend',
    insight:
      'In onze database staan 463.000 unieke ontvangers van overheidsgeld \u2014 doorzoekbaar in zes databronnen.',
    source: 'Bron: Alle bronnen, 2018\u20132024',
    module: 'integraal',
  },
]

/* ------------------------------------------------------------------ */
/*  Fisher-Yates shuffle                                               */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */

function useCountUp(
  target: number,
  duration: number,
  trigger: boolean,
): string {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!trigger) {
      setValue(0)
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, trigger])

  if (target % 1 !== 0) {
    return value.toFixed(1).replace('.', ',')
  }
  return Math.round(value).toString()
}

/* ------------------------------------------------------------------ */
/*  Social icons                                                       */
/* ------------------------------------------------------------------ */

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function BlueskyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.135-4.406.718-5.858 3.165-3.296 5.618C5.862 21.186 9.394 22.296 12 17.678c2.606 4.618 6.138 3.508 8.514 1.322 2.562-2.453 1.11-4.9-3.296-5.618 2.558.341 5.373-.508 6.158-3.135.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Calendar icon                                                      */
/* ------------------------------------------------------------------ */

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Share button component                                             */
/* ------------------------------------------------------------------ */

function ShareButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.5)',
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s, background 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.color = '#ffffff'
        el.style.background = 'rgba(255,255,255,0.12)'
        el.style.borderColor = 'rgba(255,255,255,0.2)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.color = 'rgba(255,255,255,0.5)'
        el.style.background = 'rgba(255,255,255,0.08)'
        el.style.borderColor = 'rgba(255,255,255,0.12)'
      }}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Noise texture (inline SVG data URI)                                */
/* ------------------------------------------------------------------ */

const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="200" height="200" filter="url(#n)" opacity="0.035"/></svg>`
const noiseDataUri = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

/* ------------------------------------------------------------------ */
/*  Discovery Card                                                     */
/* ------------------------------------------------------------------ */

function DiscoveryCard({
  discovery,
  active,
  direction,
}: {
  discovery: Discovery
  active: boolean
  direction: 'enter' | 'exit' | 'idle'
}) {
  const animatedValue = useCountUp(discovery.target, 1400, active)

  const shareText = `${discovery.insight}\n\nOntdek meer op rijksuitgaven.nl`

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: active ? 1 : 0,
        transform: active
          ? 'translateY(0)'
          : direction === 'exit'
            ? 'translateY(-12px)'
            : 'translateY(12px)',
        transition:
          'opacity 0.7s cubic-bezier(0.2,1,0.2,1), transform 0.7s cubic-bezier(0.2,1,0.2,1)',
        pointerEvents: active ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 3.5rem',
      }}
    >
      {/* Share buttons — top right */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '6px',
        }}
      >
        <ShareButton
          label="Deel op LinkedIn"
          icon={<LinkedInIcon />}
          onClick={() => {
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://rijksuitgaven.nl')}`,
              '_blank',
              'noopener',
            )
          }}
        />
        <ShareButton
          label="Deel op X"
          icon={<XIcon />}
          onClick={() => {
            window.open(
              `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
              '_blank',
              'noopener',
            )
          }}
        />
        <ShareButton
          label="Deel op Bluesky"
          icon={<BlueskyIcon />}
          onClick={() => {
            window.open(
              `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
              '_blank',
              'noopener',
            )
          }}
        />
      </div>

      {/* The number — hero element */}
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontFeatureSettings: '"tnum"',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 'clamp(3.5rem, 8vw, 6rem)',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--pink)',
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
        }}
      >
        {discovery.prefix && (
          <span style={{ opacity: 0.9 }}>{discovery.prefix}</span>
        )}
        {animatedValue}
        <span
          style={{
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            fontWeight: 500,
            marginLeft: '0.4em',
            opacity: 0.85,
            letterSpacing: '0',
          }}
        >
          {discovery.suffix}
        </span>
      </div>

      {/* Insight */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
          fontWeight: 400,
          lineHeight: 1.55,
          color: '#ffffff',
          maxWidth: '580px',
          marginBottom: '2rem',
          letterSpacing: '0.005em',
        }}
      >
        {discovery.insight}
      </p>

      {/* Source + CTA row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <a
          href={`/${discovery.module}`}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.925rem',
            fontWeight: 600,
            color: '#ffffff',
            background: 'var(--pink)',
            padding: '0.65rem 1.5rem',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4em',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background =
              'var(--pink-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--pink)'
          }}
        >
          Ontdek meer
          <span aria-hidden="true" style={{ fontSize: '1.1em' }}>
            &rarr;
          </span>
        </a>

        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          {discovery.source}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OntdekkingPage() {
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Shuffle discoveries on mount for unique order per visit
  const shuffled = useMemo(() => shuffle(discoveries), [])

  const goTo = useCallback(
    (index: number) => {
      if (index === current) return
      setPrevious(current)
      setCurrent(index)
    },
    [current],
  )

  const next = useCallback(() => {
    goTo((current + 1) % shuffled.length)
  }, [current, goTo, shuffled.length])

  // Auto-rotate
  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(next, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, next])

  // Clear "previous" after transition completes
  useEffect(() => {
    if (previous === null) return
    const t = setTimeout(() => setPrevious(null), 800)
    return () => clearTimeout(t)
  }, [previous])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gray-light)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ---- Simulated surrounding content (above) ---- */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '4rem 1.5rem 0',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2.5rem',
            marginBottom: '3rem',
            border: '1px solid rgba(14,50,97,0.06)',
          }}
        >
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--navy-dark)',
              marginBottom: '0.75rem',
            }}
          >
            Rijksuitgaven.nl
          </h2>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--navy-dark)',
              opacity: 0.65,
              maxWidth: '600px',
            }}
          >
            Snel inzicht in hoe de overheid uw belastinggeld besteedt.
            Doorzoek financi&euml;le instrumenten, apparaatskosten, inkoop en
            gemeente-uitkeringen sinds 2016.
          </p>
        </div>
      </div>

      {/* ---- ONTDEKKING VAN DE WEEK ---- */}
      <section
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 1.5rem 4rem',
        }}
      >
        {/* Card container */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: 'relative',
            background: 'var(--navy-dark)',
            borderRadius: '16px',
            minHeight: '380px',
            overflow: 'hidden',
            boxShadow:
              '0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)',
          }}
        >
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(141,186,220,0.08) 0%, transparent 70%), linear-gradient(165deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Noise texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: noiseDataUri,
              backgroundRepeat: 'repeat',
              opacity: 1,
              pointerEvents: 'none',
              zIndex: 1,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Fine grid pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Subtle left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '10%',
              bottom: '10%',
              width: '3px',
              background:
                'linear-gradient(to bottom, transparent, var(--pink), transparent)',
              opacity: 0.4,
              borderRadius: '2px',
              zIndex: 2,
            }}
          />

          {/* Card stack */}
          <div style={{ position: 'relative', zIndex: 3, minHeight: '380px' }}>
            {shuffled.map((d, i) => (
              <DiscoveryCard
                key={i}
                discovery={d}
                active={i === current}
                direction={
                  i === previous ? 'exit' : i === current ? 'enter' : 'idle'
                }
              />
            ))}
          </div>

        </div>
      </section>

      {/* ---- Simulated surrounding content (below) ---- */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 1.5rem 4rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {[
            {
              title: 'Instrumenten',
              desc: 'Subsidies, leningen en garanties aan ontvangers.',
            },
            {
              title: 'Apparaat',
              desc: 'Personeels- en materiaalkosten van het Rijk.',
            },
            {
              title: 'Gemeente',
              desc: 'Gemeentefonds en decentralisatie-uitkeringen.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1.75rem',
                border: '1px solid rgba(14,50,97,0.06)',
              }}
            >
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--navy-dark)',
                  marginBottom: '0.5rem',
                }}
              >
                {item.title}
              </h4>
              <p
                style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  color: 'var(--navy-dark)',
                  opacity: 0.55,
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
