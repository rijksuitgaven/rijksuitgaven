'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/* ------------------------------------------------------------------ */
/*  Province data — mock but realistic amounts                         */
/* ------------------------------------------------------------------ */

interface ProvinceData {
  id: string
  name: string
  amount: number          // in euros
  amountLabel: string     // display string
  ontvangers: number
  color: string           // computed from scale
}

const PROVINCES_RAW: Omit<ProvinceData, 'color'>[] = [
  { id: 'zuid-holland',   name: 'Zuid-Holland',   amount: 4_200_000_000, amountLabel: '\u20AC4,2 mld',  ontvangers: 1842 },
  { id: 'noord-holland',  name: 'Noord-Holland',  amount: 3_800_000_000, amountLabel: '\u20AC3,8 mld',  ontvangers: 1563 },
  { id: 'noord-brabant',  name: 'Noord-Brabant',  amount: 2_900_000_000, amountLabel: '\u20AC2,9 mld',  ontvangers: 1204 },
  { id: 'gelderland',     name: 'Gelderland',     amount: 2_400_000_000, amountLabel: '\u20AC2,4 mld',  ontvangers: 987  },
  { id: 'utrecht',        name: 'Utrecht',        amount: 2_100_000_000, amountLabel: '\u20AC2,1 mld',  ontvangers: 834  },
  { id: 'overijssel',     name: 'Overijssel',     amount: 1_600_000_000, amountLabel: '\u20AC1,6 mld',  ontvangers: 672  },
  { id: 'limburg',        name: 'Limburg',        amount: 1_400_000_000, amountLabel: '\u20AC1,4 mld',  ontvangers: 589  },
  { id: 'friesland',      name: 'Friesland',      amount: 980_000_000,   amountLabel: '\u20AC980 mln',  ontvangers: 412  },
  { id: 'groningen',      name: 'Groningen',      amount: 920_000_000,   amountLabel: '\u20AC920 mln',  ontvangers: 387  },
  { id: 'drenthe',        name: 'Drenthe',        amount: 640_000_000,   amountLabel: '\u20AC640 mln',  ontvangers: 268  },
  { id: 'zeeland',        name: 'Zeeland',        amount: 520_000_000,   amountLabel: '\u20AC520 mln',  ontvangers: 214  },
  { id: 'flevoland',      name: 'Flevoland',      amount: 380_000_000,   amountLabel: '\u20AC380 mln',  ontvangers: 156  },
]

/* Color scale: navy-dark (#0E3261) -> blue-light (#8DBADC) -> pink (#E62D75) */
function interpolateColor(t: number): string {
  // t: 0 = lowest, 1 = highest
  // 0..0.5 => navy-dark to blue-light
  // 0.5..1 => blue-light to pink
  const navyDark = { r: 14,  g: 50,  b: 97  }
  const blueLight = { r: 141, g: 186, b: 220 }
  const pink = { r: 230, g: 45,  b: 117 }

  let from, to, localT: number
  if (t <= 0.5) {
    from = navyDark
    to = blueLight
    localT = t / 0.5
  } else {
    from = blueLight
    to = pink
    localT = (t - 0.5) / 0.5
  }

  const r = Math.round(from.r + (to.r - from.r) * localT)
  const g = Math.round(from.g + (to.g - from.g) * localT)
  const b = Math.round(from.b + (to.b - from.b) * localT)
  return `rgb(${r}, ${g}, ${b})`
}

const minAmount = Math.min(...PROVINCES_RAW.map(p => p.amount))
const maxAmount = Math.max(...PROVINCES_RAW.map(p => p.amount))

const PROVINCES: ProvinceData[] = PROVINCES_RAW.map(p => ({
  ...p,
  color: interpolateColor((p.amount - minAmount) / (maxAmount - minAmount)),
}))

/* ------------------------------------------------------------------ */
/*  SVG Province paths — simplified but recognizable Netherlands       */
/*  ViewBox: 0 0 500 620                                               */
/*  Coordinate system: x=west-east, y=north-south                     */
/* ------------------------------------------------------------------ */

const PROVINCE_PATHS: Record<string, string> = {
  // Groningen — northeast corner
  'groningen': 'M 295,28 L 370,22 L 420,30 L 435,55 L 440,95 L 410,105 L 365,110 L 330,115 L 295,108 L 280,85 L 275,55 Z',

  // Friesland — northwest, above IJsselmeer
  'friesland': 'M 130,30 L 190,18 L 250,22 L 275,28 L 280,55 L 280,85 L 295,108 L 270,118 L 230,120 L 185,115 L 155,105 L 130,90 L 118,65 Z',

  // Drenthe — below Groningen
  'drenthe': 'M 295,108 L 330,115 L 365,110 L 410,105 L 420,130 L 425,170 L 418,205 L 390,210 L 340,215 L 300,210 L 280,195 L 275,160 L 278,130 Z',

  // Overijssel — south of Drenthe, east
  'overijssel': 'M 280,195 L 300,210 L 340,215 L 390,210 L 418,205 L 430,235 L 438,270 L 430,300 L 405,310 L 370,305 L 330,295 L 295,285 L 268,265 L 255,235 L 262,210 Z',

  // Flevoland — center, reclaimed land (distinctive shape)
  'flevoland': 'M 195,145 L 230,135 L 260,140 L 270,160 L 265,195 L 255,220 L 235,235 L 215,230 L 198,210 L 190,185 L 188,160 Z',

  // Gelderland — large central-east province
  'gelderland': 'M 255,235 L 268,265 L 295,285 L 330,295 L 370,305 L 405,310 L 415,340 L 408,370 L 385,390 L 350,395 L 310,388 L 270,375 L 240,355 L 222,330 L 215,300 L 220,270 L 235,248 Z',

  // Utrecht — small central province
  'utrecht': 'M 195,230 L 215,230 L 235,248 L 240,270 L 235,300 L 222,318 L 205,325 L 185,315 L 172,295 L 170,265 L 178,245 Z',

  // Noord-Holland — western peninsula above Amsterdam
  'noord-holland': 'M 80,42 L 110,35 L 118,65 L 130,90 L 155,105 L 175,118 L 185,140 L 188,165 L 175,195 L 165,220 L 155,245 L 140,255 L 120,248 L 100,230 L 90,200 L 82,165 L 72,130 L 68,95 L 72,60 Z',

  // Zuid-Holland — western coast, south of Noord-Holland
  'zuid-holland': 'M 100,255 L 120,248 L 140,255 L 155,265 L 170,275 L 175,295 L 180,318 L 175,345 L 160,365 L 140,375 L 118,380 L 95,370 L 78,348 L 70,320 L 72,290 L 82,270 Z',

  // Noord-Brabant — large southern province
  'noord-brabant': 'M 140,390 L 175,378 L 210,370 L 250,370 L 285,380 L 320,390 L 355,400 L 385,395 L 400,410 L 405,440 L 395,470 L 370,485 L 330,490 L 280,488 L 230,485 L 185,478 L 155,465 L 135,440 L 128,415 Z',

  // Zeeland — southwestern islands/delta
  'zeeland': 'M 42,365 L 70,355 L 90,370 L 105,385 L 118,395 L 128,415 L 125,445 L 115,465 L 95,478 L 70,480 L 48,468 L 32,445 L 25,418 L 28,390 Z',

  // Limburg — southeastern narrow province
  'limburg': 'M 370,485 L 395,470 L 410,455 L 420,440 L 430,460 L 435,490 L 432,530 L 425,560 L 412,585 L 395,600 L 375,605 L 358,590 L 350,560 L 348,530 L 355,505 Z',
}

/* ------------------------------------------------------------------ */
/*  The Page Component                                                 */
/* ------------------------------------------------------------------ */

export default function GeldkaartPage() {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [pulsingProvince, setPulsingProvince] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleProvinceClick = useCallback((id: string) => {
    setSelectedProvince(prev => prev === id ? null : id)
    setPulsingProvince(id)
  }, [])

  // Clear pulse animation after it plays
  useEffect(() => {
    if (!pulsingProvince) return
    const timer = setTimeout(() => setPulsingProvince(null), 800)
    return () => clearTimeout(timer)
  }, [pulsingProvince])

  const hoveredData = hoveredProvince
    ? PROVINCES.find(p => p.id === hoveredProvince)
    : null

  const selectedData = selectedProvince
    ? PROVINCES.find(p => p.id === selectedProvince)
    : null

  return (
    <main
      style={{
        fontFamily: 'var(--font-body), sans-serif',
        background: 'var(--gray-light)',
        minHeight: '100vh',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '64px 24px 80px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--pink)',
              marginBottom: 12,
            }}
          >
            Geldkaart
          </p>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 700,
              color: 'var(--navy-dark)',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Waar besteedt Nederland het meest?
          </h1>
          <p
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'var(--navy-dark)',
              opacity: 0.7,
              maxWidth: 500,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Ontdek rijksuitgaven per provincie
          </p>
        </div>

        {/* Map + Detail Panel Container */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* SVG Map Container */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              flexShrink: 0,
            }}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 500 630"
              style={{
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 24px rgba(14, 50, 97, 0.12))',
              }}
            >
              <defs>
                {/* Glow filter for hover */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Pulse animation for click */}
                <filter id="pulse-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Water pattern for IJsselmeer */}
                <pattern id="water" patternUnits="userSpaceOnUse" width="8" height="8">
                  <rect width="8" height="8" fill="#C8DFF0" />
                  <path d="M 0,4 Q 2,2 4,4 Q 6,6 8,4" stroke="#B0D0E8" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>

              {/* Water / IJsselmeer background shape */}
              <path
                d="M 130,90 L 185,115 L 230,120 L 270,118 L 278,130 L 275,160 L 260,140 L 230,135 L 195,145 L 188,160 L 175,195 L 165,220 L 155,245 L 155,265 L 170,275 L 172,295 L 178,245 L 195,230 L 198,210 L 215,230 L 235,235 L 255,220 L 265,195 L 270,160 L 280,195 L 262,210 L 255,235 L 235,248 L 220,270 L 215,300 L 222,318 L 222,330 L 210,370 L 175,378 L 140,390 L 128,415 L 118,395 L 105,385 L 90,370 L 95,370 L 118,380 L 140,375 L 160,365 L 175,345 L 180,318 L 185,315 L 205,325 L 222,318 L 235,300 L 240,270 L 240,355 L 270,375 L 310,388 L 350,395 L 355,400 L 320,390 L 285,380 L 250,370"
                fill="none"
                opacity="0"
              />

              {/* IJsselmeer water body */}
              <path
                d="M 155,105 L 185,115 L 230,120 L 270,118 L 278,130 L 270,160 L 260,140 L 230,135 L 195,145 L 188,160 L 185,140 L 175,118 Z"
                fill="url(#water)"
                stroke="#B0D0E8"
                strokeWidth="0.5"
                opacity="0.6"
              />

              {/* Province paths */}
              {PROVINCES.map(province => {
                const path = PROVINCE_PATHS[province.id]
                if (!path) return null

                const isHovered = hoveredProvince === province.id
                const isSelected = selectedProvince === province.id
                const isPulsing = pulsingProvince === province.id

                return (
                  <path
                    key={province.id}
                    d={path}
                    fill={province.color}
                    stroke="white"
                    strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                    strokeLinejoin="round"
                    style={{
                      cursor: 'pointer',
                      opacity: isHovered ? 0.88 : 1,
                      filter: isPulsing
                        ? 'url(#pulse-glow)'
                        : isHovered
                          ? 'url(#glow)'
                          : 'none',
                      transition: 'opacity 0.2s ease, stroke-width 0.2s ease, filter 0.3s ease',
                      transformOrigin: 'center',
                      animation: isPulsing ? 'provincePulse 0.8s ease-out' : 'none',
                    }}
                    onMouseEnter={() => setHoveredProvince(province.id)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => handleProvinceClick(province.id)}
                  />
                )
              })}

              {/* Province labels (for larger provinces) */}
              {[
                { id: 'groningen', x: 360, y: 68 },
                { id: 'friesland', x: 200, y: 72 },
                { id: 'drenthe', x: 348, y: 160 },
                { id: 'overijssel', x: 345, y: 260 },
                { id: 'flevoland', x: 225, y: 185 },
                { id: 'gelderland', x: 318, y: 350 },
                { id: 'utrecht', x: 200, y: 280 },
                { id: 'noord-holland', x: 108, y: 155 },
                { id: 'zuid-holland', x: 125, y: 320 },
                { id: 'noord-brabant', x: 275, y: 440 },
                { id: 'zeeland', x: 75, y: 425 },
                { id: 'limburg', x: 395, y: 540 },
              ].map(label => {
                const province = PROVINCES.find(p => p.id === label.id)
                if (!province) return null
                // Determine text color based on background luminance
                const t = (province.amount - minAmount) / (maxAmount - minAmount)
                const textColor = t > 0.3 && t < 0.7 ? 'var(--navy-dark)' : 'white'
                const fontSize = ['flevoland', 'utrecht', 'zeeland'].includes(label.id) ? 9 : 10

                return (
                  <text
                    key={`label-${label.id}`}
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={fontSize}
                    fontWeight={600}
                    fontFamily="var(--font-body), sans-serif"
                    style={{
                      pointerEvents: 'none',
                      textShadow: textColor === 'white'
                        ? '0 1px 3px rgba(0,0,0,0.4)'
                        : '0 1px 2px rgba(255,255,255,0.5)',
                      userSelect: 'none',
                    }}
                  >
                    {province.name}
                  </text>
                )
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredData && !selectedProvince && (
              <div
                style={{
                  position: 'absolute',
                  left: tooltipPos.x + 16,
                  top: tooltipPos.y - 12,
                  background: 'var(--navy-dark)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.5,
                  pointerEvents: 'none',
                  zIndex: 50,
                  boxShadow: '0 8px 32px rgba(14, 50, 97, 0.25)',
                  whiteSpace: 'nowrap',
                  transform: 'translateY(-50%)',
                  animation: 'tooltipFadeIn 0.15s ease-out',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {hoveredData.name}
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--pink)', letterSpacing: '-0.01em' }}>
                    {hoveredData.amountLabel}
                  </span>
                  <span style={{ opacity: 0.7, fontSize: 13 }}>
                    {hoveredData.ontvangers.toLocaleString('nl-NL')} ontvangers
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Detail Panel (slides in on click) */}
          <div
            style={{
              width: 320,
              minHeight: 200,
              flexShrink: 0,
              transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.2, 1, 0.2, 1)',
              opacity: selectedData ? 1 : 0,
              transform: selectedData ? 'translateX(0)' : 'translateX(24px)',
              pointerEvents: selectedData ? 'auto' : 'none',
            }}
          >
            {selectedData && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '32px 28px',
                  boxShadow: '0 8px 40px rgba(14, 50, 97, 0.1)',
                  border: '1px solid rgba(14, 50, 97, 0.08)',
                }}
              >
                {/* Province color dot + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: selectedData.color,
                      flexShrink: 0,
                      boxShadow: `0 0 0 3px ${selectedData.color}33`,
                    }}
                  />
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy-dark)', margin: 0 }}>
                    {selectedData.name}
                  </h2>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: 'var(--navy-dark)', opacity: 0.5, marginBottom: 4, fontWeight: 500 }}>
                    Totale rijksuitgaven
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--pink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {selectedData.amountLabel}
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 28,
                    padding: '16px 0',
                    borderTop: '1px solid var(--gray-light)',
                    borderBottom: '1px solid var(--gray-light)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--navy-dark)', opacity: 0.5, marginBottom: 2 }}>
                      Ontvangers
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-dark)' }}>
                      {selectedData.ontvangers.toLocaleString('nl-NL')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--navy-dark)', opacity: 0.5, marginBottom: 2 }}>
                      Positie
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-dark)' }}>
                      #{PROVINCES.sort((a, b) => b.amount - a.amount).findIndex(p => p.id === selectedData.id) + 1} van 12
                    </div>
                  </div>
                </div>

                {/* Spending bar relative to max */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 12, color: 'var(--navy-dark)', opacity: 0.5, marginBottom: 8 }}>
                    Aandeel van totaal
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--gray-light)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(selectedData.amount / maxAmount) * 100}%`,
                        background: `linear-gradient(90deg, var(--navy-dark), ${selectedData.color})`,
                        borderRadius: 4,
                        transition: 'width 0.6s cubic-bezier(0.2, 1, 0.2, 1)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--navy-dark)', opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                    {((selectedData.amount / PROVINCES.reduce((sum, p) => sum + p.amount, 0)) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    // In production this would navigate to /provincie?q=...
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '14px 20px',
                    background: 'var(--pink)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body), sans-serif',
                    transition: 'background 0.2s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--pink-hover)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--pink)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Bekijk {selectedData.ontvangers.toLocaleString('nl-NL')} ontvangers in {selectedData.name}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Close */}
                <button
                  onClick={() => setSelectedProvince(null)}
                  style={{
                    display: 'block',
                    margin: '16px auto 0',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--navy-dark)',
                    opacity: 0.5,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body), sans-serif',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                >
                  Sluiten
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            maxWidth: 520,
            margin: '48px auto 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-dark)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Uitgaven per provincie
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 400 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-dark)', whiteSpace: 'nowrap' }}>
              {'\u20AC'}380 mln
            </span>
            <div
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                background: `linear-gradient(90deg, #0E3261 0%, #2B5A8C 25%, #8DBADC 50%, #C25A8A 75%, #E62D75 100%)`,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pink)', whiteSpace: 'nowrap' }}>
              {'\u20AC'}4,2 mld
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 400, padding: '0 60px' }}>
            <span style={{ fontSize: 11, color: 'var(--navy-dark)', opacity: 0.4 }}>Laag</span>
            <span style={{ fontSize: 11, color: 'var(--navy-dark)', opacity: 0.4 }}>Hoog</span>
          </div>
        </div>

        {/* Ranking Table */}
        <div
          style={{
            maxWidth: 520,
            margin: '48px auto 0',
            background: 'white',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 4px 24px rgba(14, 50, 97, 0.06)',
            border: '1px solid rgba(14, 50, 97, 0.06)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-dark)', margin: '0 0 16px' }}>
            Ranglijst provincies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...PROVINCES]
              .sort((a, b) => b.amount - a.amount)
              .map((province, i) => {
                const barWidth = (province.amount / maxAmount) * 100
                const isActive = selectedProvince === province.id || hoveredProvince === province.id

                return (
                  <div
                    key={province.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr auto',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 8px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isActive ? 'var(--gray-light)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={() => setHoveredProvince(province.id)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => handleProvinceClick(province.id)}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-dark)', opacity: 0.4, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: province.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy-dark)', minWidth: 110 }}>
                        {province.name}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: 'var(--gray-light)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${barWidth}%`,
                            background: province.color,
                            borderRadius: 3,
                            transition: 'width 0.4s cubic-bezier(0.2, 1, 0.2, 1)',
                          }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-dark)', whiteSpace: 'nowrap', minWidth: 75, textAlign: 'right' }}>
                      {province.amountLabel}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Bottom note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--navy-dark)',
            opacity: 0.4,
            marginTop: 32,
            maxWidth: 400,
            margin: '32px auto 0',
            lineHeight: 1.6,
          }}
        >
          Bedragen zijn indicatief en gebaseerd op de meest recente beschikbare data.
          Klik op een provincie voor meer informatie.
        </p>
      </section>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        @keyframes provincePulse {
          0% { filter: url(#pulse-glow); opacity: 1; }
          30% { filter: url(#pulse-glow); opacity: 0.7; }
          60% { filter: url(#pulse-glow); opacity: 1; }
          100% { filter: none; opacity: 1; }
        }

        /* Responsive: stack on smaller screens */
        @media (max-width: 800px) {
          .map-detail-container {
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>
    </main>
  )
}
