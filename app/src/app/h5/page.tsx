'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// Het Verschil — Before/After scroll-driven narrative
// Scroll from "Voorheen" (chaotic manual research) to "Nu" (Rijksuitgaven)
// ============================================================================

// ---------------------------------------------------------------------------
// Animated Counter — counts from 0 to target when triggered
// ---------------------------------------------------------------------------
function AnimatedCounter({
  target,
  suffix = '',
  duration = 2000,
  triggered,
}: {
  target: number
  suffix?: string
  duration?: number
  triggered: boolean
}) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!triggered) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [triggered, target, duration])

  const formatted = count.toLocaleString('nl-NL')
  return (
    <span>
      {formatted}
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Before-state visual elements (chaos)
// ---------------------------------------------------------------------------

function FakeSpreadsheet({ style }: { style: React.CSSProperties }) {
  const rows = [
    ['Ministerie', 'Bedrag', 'Jaar', 'Type'],
    ['BZK', '€ 234.112', '2021', 'Sub...'],
    ['VWS', '€ 1.023...', '2020', 'Inc...'],
    ['Def', '€ 87.234', '2022', '???'],
    ['EZK', '€ ...', '2019', 'Sub'],
    ['OCW', '#REF!', '2021', '...'],
  ]
  return (
    <div
      style={{
        position: 'absolute',
        background: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: 4,
        padding: 0,
        fontSize: 10,
        fontFamily: 'monospace',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: '#1a1a1a',
          padding: '4px 8px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
        <span style={{ color: '#666', marginLeft: 8, fontSize: 9 }}>budget_2021_v3_FINAL.xlsx</span>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '3px 6px',
                    borderBottom: '1px solid #333',
                    borderRight: '1px solid #333',
                    color: i === 0 ? '#888' : cell === '#REF!' ? '#ff4444' : '#aaa',
                    fontWeight: i === 0 ? 600 : 400,
                    background: i === 0 ? '#222' : 'transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PdfIcon({ style, label }: { style: React.CSSProperties; label: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 72,
        height: 90,
        background: '#2e2e2e',
        border: '1px solid #444',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      {/* Folded corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 16,
          height: 16,
          background: '#444',
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
        }}
      />
      <div
        style={{
          background: '#c0392b',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 2,
          marginBottom: 6,
        }}
      >
        PDF
      </div>
      <div
        style={{
          color: '#777',
          fontSize: 8,
          textAlign: 'center',
          padding: '0 4px',
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function BrowserTabBar({ style }: { style: React.CSSProperties }) {
  const tabs = [
    'rijksbegroting.nl',
    'jaarverslag...',
    'openspending',
    'cbs.nl/over...',
    'wmebv.nl',
  ]
  return (
    <div
      style={{
        position: 'absolute',
        background: '#1a1a1a',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', background: '#111', padding: '0 4px' }}>
        {tabs.map((tab, i) => (
          <div
            key={i}
            style={{
              padding: '6px 10px',
              fontSize: 9,
              color: i === 0 ? '#ccc' : '#666',
              background: i === 0 ? '#1a1a1a' : 'transparent',
              borderRadius: i === 0 ? '6px 6px 0 0' : 0,
              whiteSpace: 'nowrap',
              maxWidth: 90,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderRight: '1px solid #222',
            }}
          >
            {tab}
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ background: '#333', borderRadius: 4, padding: '3px 8px', flex: 1, fontSize: 9, color: '#666' }}>
          https://www.rijksbegroting.nl/2023/voorstel_van_wet/begroting/...
        </div>
      </div>
      {/* Fake page content */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ width: '80%', height: 6, background: '#333', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ width: '60%', height: 6, background: '#2a2a2a', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ width: '90%', height: 6, background: '#2a2a2a', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ width: '40%', height: 6, background: '#2a2a2a', borderRadius: 2 }} />
      </div>
    </div>
  )
}

function FloatingText({
  text,
  style,
}: {
  text: string
  style: React.CSSProperties
}) {
  return (
    <div
      style={{
        position: 'absolute',
        color: '#888',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {text}
    </div>
  )
}

// ---------------------------------------------------------------------------
// After-state visual elements (clean Rijksuitgaven mockup)
// ---------------------------------------------------------------------------

function MockProductInterface() {
  const modules = ['Instrumenten', 'Apparaat', 'Inkoop', 'Provincie', 'Gemeente', 'Publiek']
  const years = ['2020', '2021', '2022', '2023', '2024']
  const data = [
    { name: 'ProRail B.V.', values: ['€ 2,1 mrd', '€ 2,3 mrd', '€ 2,4 mrd', '€ 2,6 mrd', '€ 2,8 mrd'] },
    { name: 'Rijkswaterstaat', values: ['€ 1,8 mrd', '€ 1,9 mrd', '€ 2,0 mrd', '€ 2,1 mrd', '€ 2,2 mrd'] },
    { name: 'Politie Nederland', values: ['€ 6,2 mrd', '€ 6,4 mrd', '€ 6,6 mrd', '€ 6,8 mrd', '€ 7,1 mrd'] },
    { name: 'Gem. Amsterdam', values: ['€ 1,4 mrd', '€ 1,5 mrd', '€ 1,5 mrd', '€ 1,6 mrd', '€ 1,7 mrd'] },
    { name: 'UWV', values: ['€ 890 mln', '€ 920 mln', '€ 960 mln', '€ 1,0 mrd', '€ 1,1 mrd'] },
  ]

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 48px rgba(14,50,97,0.12), 0 2px 8px rgba(14,50,97,0.06)',
        overflow: 'hidden',
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Module tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid var(--gray-light)',
          background: '#fafcfe',
          overflowX: 'auto',
        }}
      >
        {modules.map((mod, i) => (
          <div
            key={mod}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? 'var(--navy-dark)' : 'var(--navy-medium, #436FA3)',
              borderBottom: i === 0 ? '2px solid var(--pink)' : '2px solid transparent',
              marginBottom: -2,
              whiteSpace: 'nowrap',
              cursor: 'default',
              transition: 'color 0.2s',
            }}
          >
            {mod}
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ padding: '16px 20px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--gray-light)',
            borderRadius: 8,
            padding: '10px 14px',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-medium, #436FA3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span style={{ color: 'var(--navy-medium, #436FA3)', fontSize: 14 }}>
            Zoek op ontvanger, regeling of instrument...
          </span>
        </div>
      </div>

      {/* Data table */}
      <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  color: 'var(--navy-dark)',
                  fontWeight: 600,
                  borderBottom: '2px solid var(--gray-light)',
                  fontSize: 12,
                }}
              >
                Ontvanger
              </th>
              {years.map((y) => (
                <th
                  key={y}
                  style={{
                    textAlign: 'right',
                    padding: '8px 10px',
                    color: 'var(--navy-dark)',
                    fontWeight: 600,
                    borderBottom: '2px solid var(--gray-light)',
                    fontSize: 12,
                  }}
                >
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.name}
                style={{
                  background: i % 2 === 0 ? '#fff' : '#fafcfe',
                }}
              >
                <td
                  style={{
                    padding: '8px 10px',
                    fontWeight: 500,
                    color: 'var(--navy-dark)',
                    borderBottom: '1px solid #f0f4f8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.name}
                </td>
                {row.values.map((val, j) => (
                  <td
                    key={j}
                    style={{
                      textAlign: 'right',
                      padding: '8px 10px',
                      color: 'var(--navy-medium, #436FA3)',
                      borderBottom: '1px solid #f0f4f8',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function HetVerschilPage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [sectionProgress, setSectionProgress] = useState(0) // 0 = before, 0.5 = transition, 1 = after
  const [countersTriggered, setCountersTriggered] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.max(0, Math.min(1, scrollTop / docHeight))
    setScrollProgress(progress)

    // Calculate section progress based on scroll position relative to total height
    // Before: 0-33%, Transition: 33-66%, After: 66-100%
    const rawSection = progress * 3
    setSectionProgress(Math.max(0, Math.min(1, rawSection - 0.5)))

    // Trigger counters at midpoint
    if (progress > 0.35 && !countersTriggered) {
      setCountersTriggered(true)
    }
  }, [countersTriggered])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Derived animation values
  const beforeOpacity = Math.max(0, 1 - sectionProgress * 2.5)
  const beforeBlur = sectionProgress * 20
  const beforeScale = 1 - sectionProgress * 0.1
  const afterOpacity = Math.max(0, (sectionProgress - 0.3) / 0.7)
  const afterScale = 0.9 + afterOpacity * 0.1
  const transitionBg = sectionProgress < 0.5
    ? '#1a1a1a'
    : `color-mix(in srgb, #1a1a1a ${Math.max(0, (1 - (sectionProgress - 0.5) * 2)) * 100}%, var(--gray-light) ${Math.min(100, (sectionProgress - 0.5) * 2 * 100)}%)`

  // Counter section opacity — visible during transition zone
  const counterOpacity = sectionProgress > 0.25 && sectionProgress < 0.75
    ? Math.min(1, (sectionProgress - 0.25) * 4) * Math.min(1, (0.75 - sectionProgress) * 4)
    : 0

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: 'var(--font-body), sans-serif',
        minHeight: '400vh',
        position: 'relative',
      }}
    >
      {/* ================================================================ */}
      {/* Scroll Progress Bar                                              */}
      {/* ================================================================ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress * 100}%`,
          height: 3,
          background: 'var(--pink)',
          zIndex: 100,
          transition: 'width 0.05s linear',
        }}
      />

      {/* ================================================================ */}
      {/* Sticky viewport — locked in place, content transforms            */}
      {/* ================================================================ */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: transitionBg,
          transition: 'background 0.1s linear',
        }}
      >
        {/* -------------------------------------------------------------- */}
        {/* Grain/noise texture overlay (Before state)                      */}
        {/* -------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: beforeOpacity * 0.15,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* -------------------------------------------------------------- */}
        {/* BEFORE STATE — "Voorheen"                                       */}
        {/* -------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: beforeOpacity,
            filter: `blur(${beforeBlur}px)`,
            transform: `scale(${beforeScale})`,
            transition: 'filter 0.1s linear, transform 0.1s linear, opacity 0.1s linear',
            zIndex: 2,
          }}
        >
          {/* Large heading */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 64px)',
                fontWeight: 700,
                color: '#666',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Hoe het was...
            </h1>
            <p
              style={{
                fontSize: 'clamp(14px, 1.8vw, 20px)',
                color: '#555',
                marginTop: 12,
                fontWeight: 400,
              }}
            >
              Onderzoek naar rijksuitgaven voor Rijksuitgaven.nl
            </p>
          </div>

          {/* Chaos elements — scattered, rotated, overlapping */}

          {/* Spreadsheet 1 — top left area */}
          <FakeSpreadsheet
            style={{
              top: '25%',
              left: '5%',
              transform: 'rotate(-3deg)',
              width: 260,
            }}
          />

          {/* Spreadsheet 2 — center right, overlapping */}
          <FakeSpreadsheet
            style={{
              top: '38%',
              right: '8%',
              transform: 'rotate(2deg)',
              width: 240,
            }}
          />

          {/* Browser tab bar — center top area */}
          <BrowserTabBar
            style={{
              top: '28%',
              left: '50%',
              transform: 'translateX(-50%) rotate(1deg)',
              width: 440,
            }}
          />

          {/* PDF documents */}
          <PdfIcon
            style={{ top: '55%', left: '12%', transform: 'rotate(-5deg)' }}
            label="Jaarverslag IenW 2022"
          />
          <PdfIcon
            style={{ top: '50%', left: '28%', transform: 'rotate(3deg)' }}
            label="Begroting IX 2023"
          />
          <PdfIcon
            style={{ top: '62%', right: '20%', transform: 'rotate(-2deg)' }}
            label="Slotwet BZK 2021"
          />
          <PdfIcon
            style={{ top: '45%', right: '32%', transform: 'rotate(4deg)' }}
            label="Subsidieovz. OCW"
          />

          {/* Floating frustration text */}
          <FloatingText
            text="6 verschillende websites"
            style={{ bottom: '28%', left: '8%', fontSize: 'clamp(12px, 1.6vw, 18px)', transform: 'rotate(-2deg)', color: '#777' }}
          />
          <FloatingText
            text="Handmatig CSV downloaden"
            style={{ bottom: '22%', right: '10%', fontSize: 'clamp(11px, 1.4vw, 16px)', transform: 'rotate(1deg)', color: '#666' }}
          />
          <FloatingText
            text="Weken onderzoek"
            style={{ bottom: '15%', left: '25%', fontSize: 'clamp(13px, 1.8vw, 20px)', transform: 'rotate(2deg)', color: '#888' }}
          />
          <FloatingText
            text="Geen overzicht"
            style={{ bottom: '10%', right: '25%', fontSize: 'clamp(14px, 2vw, 22px)', transform: 'rotate(-1deg)', color: '#999', fontWeight: 700 }}
          />

          {/* Scroll hint */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              animation: 'float 2s ease-in-out infinite',
            }}
          >
            <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>Scroll naar beneden</div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" style={{ margin: '0 auto' }}>
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* COUNTER SECTION — appears during transition                     */}
        {/* -------------------------------------------------------------- */}
        <div
          ref={transitionRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: counterOpacity,
            transition: 'opacity 0.15s linear',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'clamp(24px, 4vw, 60px)',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '0 24px',
            }}
          >
            {[
              { target: 463731, label: 'ontvangers', suffix: '' },
              { target: 6, label: 'modules', suffix: '' },
              { target: 9, label: 'jaar data', suffix: '' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'clamp(28px, 5vw, 56px)',
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <AnimatedCounter
                    target={item.target}
                    suffix={item.suffix}
                    triggered={countersTriggered}
                    duration={item.target > 100 ? 2400 : 1200}
                  />
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 1.4vw, 16px)',
                    color: 'var(--blue-light)',
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Decorative dot separator */}
          <div
            style={{
              width: 48,
              height: 2,
              background: 'var(--pink)',
              borderRadius: 1,
              marginTop: 32,
              opacity: 0.8,
            }}
          />
        </div>

        {/* -------------------------------------------------------------- */}
        {/* AFTER STATE — "Nu" — Rijksuitgaven                              */}
        {/* -------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: afterOpacity,
            transform: `scale(${afterScale})`,
            transition: 'transform 0.1s linear, opacity 0.1s linear',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '5vh',
            background: 'var(--gray-light)',
          }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 3vh, 48px)', padding: '0 24px' }}>
            <h2
              style={{
                fontSize: 'clamp(32px, 5vw, 64px)',
                fontWeight: 700,
                color: 'var(--navy-dark)',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Hoe het is.
            </h2>
            <p
              style={{
                fontSize: 'clamp(14px, 1.8vw, 20px)',
                color: 'var(--navy-medium, #436FA3)',
                marginTop: 12,
                fontWeight: 400,
              }}
            >
              Eén platform. Alle rijksuitgaven. Direct doorzoekbaar.
            </p>
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: 'clamp(20px, 3vh, 40px)',
              padding: '0 24px',
            }}
          >
            {['1 platform', 'Direct zoeken', 'Alle modules', 'Export in 3 klikken'].map((text) => (
              <div
                key={text}
                style={{
                  background: '#fff',
                  color: 'var(--navy-dark)',
                  padding: '8px 20px',
                  borderRadius: 100,
                  fontSize: 'clamp(12px, 1.4vw, 15px)',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(14,50,97,0.08)',
                  border: '1px solid rgba(14,50,97,0.06)',
                }}
              >
                {text}
              </div>
            ))}
          </div>

          {/* Mock product interface */}
          <div style={{ width: '100%', maxWidth: 780, padding: '0 24px' }}>
            <MockProductInterface />
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'clamp(24px, 3vh, 48px)', textAlign: 'center' }}>
            <a
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--pink)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(230,45,117,0.3)',
                transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = 'var(--pink-hover)'
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = '0 6px 24px rgba(230,45,117,0.4)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = 'var(--pink)'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 4px 16px rgba(230,45,117,0.3)'
              }}
            >
              Start met zoeken
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Transition overlay — radial wipe from center                    */}
        {/* -------------------------------------------------------------- */}
        {sectionProgress > 0.15 && sectionProgress < 0.85 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, (sectionProgress - 0.15) * 200)}%, rgba(14,50,97,0.05) ${Math.max(0, (sectionProgress - 0.15) * 200 + 20)}%)`,
              zIndex: 4,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* ================================================================ */}
      {/* Spacer sections — provide scroll height                          */}
      {/* ================================================================ */}

      {/* Section labels — floating alongside the scroll */}
      <div style={{ position: 'absolute', top: '10vh', left: 24, zIndex: 10, pointerEvents: 'none' }}>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#555',
            opacity: beforeOpacity,
            transition: 'opacity 0.2s',
          }}
        >
          Voorheen
        </div>
      </div>

      <div style={{ position: 'fixed', top: '10vh', right: 24, zIndex: 10, pointerEvents: 'none' }}>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--navy-dark)',
            opacity: afterOpacity,
            transition: 'opacity 0.2s',
          }}
        >
          Rijksuitgaven.nl
        </div>
      </div>

      {/* Float animation keyframe */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }

        /* Hide AppShell header/footer for immersive experience */
        /* Uncomment if needed:
        header, footer { display: none !important; }
        */

        /* Responsive adjustments for before-state chaos elements */
        @media (max-width: 768px) {
          .chaos-spreadsheet-1 { display: none; }
        }
      `}</style>
    </div>
  )
}
