'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Discovery {
  /** Numeric target for count-up animation (in euros, no formatting) */
  target: number
  /** Pre-formatted display string — shown after count-up finishes */
  display: string
  /** Unit prefix, e.g. "\u20AC" */
  prefix: string
  /** Unit suffix, e.g. "miljoen" */
  suffix: string
  /** One bold editorial sentence */
  insight: string
  /** Small attribution line */
  source: string
  /** Module slug for CTA link */
  module: string
}

const discoveries: Discovery[] = [
  {
    target: 342,
    display: '342',
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'De Politieacademie ontving \u20AC342 miljoen \u2014 meer dan 12 provincies samen.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2016\u20132024',
    module: 'instrumenten',
  },
  {
    target: 47,
    display: '47',
    prefix: '\u20AC',
    suffix: 'miljoen',
    insight:
      'Het Rijk besteedde \u20AC47 miljoen aan wolvenbeheer \u2014 meer dan aan sommige nationale musea.',
    source: 'Bron: Financi\u00EBle Instrumenten, 2016\u20132024',
    module: 'instrumenten',
  },
  {
    target: 2.1,
    display: '2,1',
    prefix: '\u20AC',
    suffix: 'miljard',
    insight:
      'De gemeente Rotterdam ontving meer dan 47 andere gemeenten samen.',
    source: 'Bron: Gemeente-uitkeringen, 2016\u20132024',
    module: 'gemeente',
  },
]

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
      // Ease-out cubic
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

  // Format: integers get no decimals; fractional gets one comma-separated decimal
  if (target % 1 !== 0) {
    return value.toFixed(1).replace('.', ',')
  }
  return Math.round(value).toString()
}

/* ------------------------------------------------------------------ */
/*  LinkedIn SVG icon                                                  */
/* ------------------------------------------------------------------ */

function LinkedInIcon({ size = 18 }: { size?: number }) {
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
        transition: 'opacity 0.7s cubic-bezier(0.2,1,0.2,1), transform 0.7s cubic-bezier(0.2,1,0.2,1)',
        pointerEvents: active ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 3.5rem',
      }}
    >
      {/* Share button — top right */}
      <button
        aria-label="Deel op LinkedIn"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
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
        onClick={() => {
          const text = encodeURIComponent(
            `${discovery.insight}\n\nOntdek meer op rijksuitgaven.nl`,
          )
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://rijksuitgaven.nl')}&summary=${text}`,
            '_blank',
            'noopener',
          )
        }}
      >
        <LinkedInIcon size={16} />
      </button>

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
        <span style={{ opacity: 0.9 }}>{discovery.prefix}</span>
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

  const goTo = useCallback(
    (index: number) => {
      if (index === current) return
      setPrevious(current)
      setCurrent(index)
    },
    [current],
  )

  const next = useCallback(() => {
    goTo((current + 1) % discoveries.length)
  }, [current, goTo])

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
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem',
          }}
        >
          <span
            style={{
              color: 'var(--navy-dark)',
              opacity: 0.45,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CalendarIcon size={18} />
          </span>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--navy-dark)',
              opacity: 0.55,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            Ontdekking van de Week
          </h3>
        </div>

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
            {discoveries.map((d, i) => (
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

          {/* Dot indicators */}
          <div
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              gap: '8px',
              zIndex: 4,
            }}
          >
            {discoveries.map((_, i) => (
              <button
                key={i}
                aria-label={`Ga naar ontdekking ${i + 1}`}
                onClick={() => goTo(i)}
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background:
                    i === current
                      ? 'var(--pink)'
                      : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  padding: 0,
                  transition:
                    'width 0.4s cubic-bezier(0.2,1,0.2,1), background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Card count indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '0.75rem',
            paddingRight: '0.25rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--navy-dark)',
              opacity: 0.35,
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {current + 1} / {discoveries.length}
          </span>
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
