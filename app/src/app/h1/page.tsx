'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import geldstroomData from '@/data/geldstroom.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NodeData {
  id: string
  label: string
  amounts: Record<string, number>
}

interface FlowData {
  source: string
  target: string
  amounts: Record<string, number>
}

interface StoryData {
  label: string
  years: number[]
  leftNodes: NodeData[]
  rightNodes: NodeData[]
  flows: FlowData[]
  yearTotals: Record<string, number>
}

interface Particle {
  id: number
  linkIndex: number
  t: number
  speed: number
  radius: number
  opacity: number
}

interface TooltipData {
  x: number
  y: number
  text: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORY_KEYS: [string, string][] = [
  ['integraal', 'Alle bronnen'],
  ['publiek', 'Publieke organisaties'],
  ['instrumenten', 'Rijksbegroting'],
  ['inkoop', 'Inkoopdata'],
  ['gemeente', 'Gemeenten'],
  ['provincie', 'Provincies'],
]

const NAVY_DARK = '#0E3261'
const PINK = '#E62D75'
const BLUE_LIGHT = '#8DBADC'
const GRAY_LIGHT = '#E1EAF2'

const SVG_WIDTH = 1200
const SVG_HEIGHT = 600
const NODE_WIDTH = 180
const NODE_HEIGHT = 52
const LEFT_X = 40
const RIGHT_X = SVG_WIDTH - NODE_WIDTH - 40
const VERTICAL_PAD = 20
const MAX_STROKE = 24
const MIN_STROKE = 1.5

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(euros: number): string {
  if (Math.abs(euros) >= 1_000_000_000) {
    return `€${(euros / 1_000_000_000).toFixed(1)} mld`
  }
  if (Math.abs(euros) >= 1_000_000) {
    return `€${Math.round(euros / 1_000_000)} mln`
  }
  if (Math.abs(euros) >= 1_000) {
    return `€${Math.round(euros / 1_000)}K`
  }
  return `€${Math.round(euros)}`
}

function formatHeadline(euros: number): string {
  if (euros >= 1_000_000_000) {
    return `€${(euros / 1_000_000_000).toFixed(0)} miljard`
  }
  return `€${Math.round(euros / 1_000_000)} miljoen`
}

function evalCubic(
  sx: number, sy: number,
  tx: number, ty: number,
  t: number,
): { x: number; y: number } {
  const startX = sx + NODE_WIDTH
  const startY = sy + NODE_HEIGHT / 2
  const endX = tx
  const endY = ty + NODE_HEIGHT / 2
  const cx = (startX + endX) / 2
  const u = 1 - t
  return {
    x: u * u * u * startX + 3 * u * u * t * cx + 3 * u * t * t * cx + t * t * t * endX,
    y: u * u * u * startY + 3 * u * u * t * startY + 3 * u * t * t * endY + t * t * t * endY,
  }
}

function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label
  return label.slice(0, maxLen - 1) + '…'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeGeldstroom() {
  const [activeStoryKey, setActiveStoryKey] = useState('integraal')
  const [activeYear, setActiveYear] = useState(2024)
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const nextIdRef = useRef(0)

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Mount animation
  useEffect(() => { setMounted(true) }, [])

  // Current story data
  const story = useMemo((): StoryData => {
    const s = (geldstroomData.stories as Record<string, StoryData>)[activeStoryKey]
    return s || (geldstroomData.stories as Record<string, StoryData>).integraal
  }, [activeStoryKey])

  // Clamp activeYear to story's year range
  useEffect(() => {
    if (!story.years.includes(activeYear)) {
      setActiveYear(story.years[story.years.length - 1])
    }
  }, [story, activeYear])

  // Year total for headline
  const yearTotal = story.yearTotals[String(activeYear)] || 0

  // Compute node positions
  const { leftPositions, rightPositions } = useMemo(() => {
    const left = story.leftNodes
    const right = story.rightNodes

    const totalLeftH = left.length * NODE_HEIGHT + (left.length - 1) * VERTICAL_PAD
    const leftStartY = Math.max(10, (SVG_HEIGHT - totalLeftH) / 2)
    const leftPos: Record<string, { x: number; y: number }> = {}
    left.forEach((n, i) => {
      leftPos[n.id] = { x: LEFT_X, y: leftStartY + i * (NODE_HEIGHT + VERTICAL_PAD) }
    })

    const totalRightH = right.length * NODE_HEIGHT + (right.length - 1) * VERTICAL_PAD
    const rightStartY = Math.max(10, (SVG_HEIGHT - totalRightH) / 2)
    const rightPos: Record<string, { x: number; y: number }> = {}
    right.forEach((n, i) => {
      rightPos[n.id] = { x: RIGHT_X, y: rightStartY + i * (NODE_HEIGHT + VERTICAL_PAD) }
    })

    return { leftPositions: leftPos, rightPositions: rightPos }
  }, [story])

  // Compute flow paths for current year
  const flowPathsData = useMemo(() => {
    return story.flows
      .map((f) => {
        const sPos = leftPositions[f.source]
        const tPos = rightPositions[f.target]
        if (!sPos || !tPos) return null

        const startX = sPos.x + NODE_WIDTH
        const startY = sPos.y + NODE_HEIGHT / 2
        const endX = tPos.x
        const endY = tPos.y + NODE_HEIGHT / 2
        const cx = (startX + endX) / 2
        const d = `M ${startX} ${startY} C ${cx} ${startY}, ${cx} ${endY}, ${endX} ${endY}`
        const amount = f.amounts[String(activeYear)] || 0

        return { flow: f, sPos, tPos, d, amount }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null && f.amount > 0)
  }, [story, activeYear, leftPositions, rightPositions])

  // Max flow for thickness scaling
  const maxFlow = useMemo(() => {
    return Math.max(1, ...flowPathsData.map((f) => f.amount))
  }, [flowPathsData])

  // Spawn particles
  const spawnParticle = useCallback((linkIndex: number) => {
    const id = nextIdRef.current++
    const speed = 0.0008 + Math.random() * 0.0012
    const radius = 2 + Math.random() * 3
    const opacity = 0.6 + Math.random() * 0.4
    particlesRef.current.push({ id, linkIndex, t: 0, speed, radius, opacity })
  }, [])

  // Reset particles on story/year change
  useEffect(() => {
    particlesRef.current = []
  }, [activeStoryKey, activeYear])

  // Animation loop
  useEffect(() => {
    if (!mounted || prefersReducedMotion) return

    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let spawnTimer = 0
    const totalWeight = flowPathsData.reduce((s, f) => s + f.amount, 0)

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn particles weighted by flow amount
      spawnTimer++
      if (spawnTimer % 3 === 0 && totalWeight > 0) {
        let r = Math.random() * totalWeight
        for (let i = 0; i < flowPathsData.length; i++) {
          r -= flowPathsData[i].amount
          if (r <= 0) {
            spawnParticle(i)
            break
          }
        }
      }

      // Cap particles
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200)
      }

      // Update & draw
      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.t += p.speed
        if (p.t > 1) continue

        const fpd = flowPathsData[p.linkIndex]
        if (!fpd) continue
        const pos = evalCubic(fpd.sPos.x, fpd.sPos.y, fpd.tPos.x, fpd.tPos.y, p.t)

        let alpha = p.opacity
        if (p.t < 0.05) alpha *= p.t / 0.05
        if (p.t > 0.90) alpha *= (1 - p.t) / 0.10

        // Glow
        const glowRadius = p.radius * 3
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius)
        gradient.addColorStop(0, `rgba(230, 45, 117, ${alpha * 0.4})`)
        gradient.addColorStop(0.5, `rgba(230, 45, 117, ${alpha * 0.1})`)
        gradient.addColorStop(1, 'rgba(230, 45, 117, 0)')
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(230, 45, 117, ${alpha})`
        ctx.fill()

        alive.push(p)
      }
      particlesRef.current = alive
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [mounted, prefersReducedMotion, flowPathsData, spawnParticle])

  // Tooltip handlers
  const handlePathMouseEnter = useCallback(
    (e: React.MouseEvent, idx: number) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const fpd = flowPathsData[idx]
      if (!fpd) return
      const leftNode = story.leftNodes.find((n) => n.id === fpd.flow.source)
      const rightNode = story.rightNodes.find((n) => n.id === fpd.flow.target)
      const text = `${leftNode?.label || ''} → ${rightNode?.label || ''}: ${formatAmount(fpd.amount)}`
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text })
    },
    [flowPathsData, story]
  )

  const handlePathMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!tooltip) return
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      setTooltip((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null))
    },
    [tooltip]
  )

  const handlePathMouseLeave = useCallback(() => setTooltip(null), [])

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveNode((prev) => (prev === nodeId ? null : nodeId))
    setTimeout(() => setActiveNode(null), 2000)
  }, [])

  // Year change
  const handleYearClick = useCallback((year: number) => {
    setActiveYear(year)
    setActiveNode(null)
    setTooltip(null)
  }, [])

  // Story change
  const handleStoryClick = useCallback((key: string) => {
    setActiveStoryKey(key)
    setActiveNode(null)
    setTooltip(null)
  }, [])

  // Keyboard navigation for years
  const handleYearKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = story.years.indexOf(activeYear)
      if (e.key === 'ArrowRight' && idx < story.years.length - 1) {
        handleYearClick(story.years[idx + 1])
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        handleYearClick(story.years[idx - 1])
      }
    },
    [story, activeYear, handleYearClick]
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: `linear-gradient(165deg, ${NAVY_DARK} 0%, #0a2548 50%, ${NAVY_DARK} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(141, 186, 220, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(141, 186, 220, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '900px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(ellipse, rgba(230, 45, 117, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Headline */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 24,
          position: 'relative',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Waar ging{' '}
          <span style={{ color: PINK }}>{formatHeadline(yearTotal)}</span>{' '}
          naartoe in {activeYear}?
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
            color: BLUE_LIGHT,
            margin: 0,
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          Volg elke euro van begroting tot ontvanger
        </p>
      </div>

      {/* Year selector */}
      <div
        role="tablist"
        aria-label="Selecteer jaar"
        onKeyDown={handleYearKeyDown}
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 24,
          position: 'relative',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.8s ease-out 0.2s',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {story.years.map((year) => (
          <button
            key={year}
            role="tab"
            aria-selected={year === activeYear}
            tabIndex={year === activeYear ? 0 : -1}
            onClick={() => handleYearClick(year)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: year === activeYear ? 700 : 400,
              fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
              background: year === activeYear ? PINK : 'transparent',
              color: year === activeYear ? '#fff' : BLUE_LIGHT,
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              if (year !== activeYear) e.currentTarget.style.background = 'rgba(141,186,220,0.1)'
            }}
            onBlur={(e) => {
              if (year !== activeYear) e.currentTarget.style.background = 'transparent'
            }}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Diagram container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: SVG_WIDTH,
          aspectRatio: `${SVG_WIDTH} / ${SVG_HEIGHT}`,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1s ease-out 0.3s, transform 1s ease-out 0.3s',
        }}
      >
        {/* SVG layer */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          aria-label={`De Geldstroom: ${story.label} in ${activeYear}`}
        >
          <defs>
            <filter id="glow-pink" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flow paths */}
          {flowPathsData.map((fpd, i) => {
            const strokeWidth = Math.max(MIN_STROKE, (fpd.amount / maxFlow) * MAX_STROKE)
            const isHighlighted = activeNode === fpd.flow.source || activeNode === fpd.flow.target

            return (
              <g key={`flow-${fpd.flow.source}-${fpd.flow.target}`}>
                {/* Hitbox */}
                <path
                  d={fpd.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(20, strokeWidth + 16)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handlePathMouseEnter(e, i)}
                  onMouseMove={handlePathMouseMove}
                  onMouseLeave={handlePathMouseLeave}
                />
                {/* Visible path */}
                <path
                  d={fpd.d}
                  fill="none"
                  stroke={isHighlighted ? 'rgba(230, 45, 117, 0.25)' : 'rgba(141, 186, 220, 0.08)'}
                  strokeWidth={strokeWidth}
                  style={{
                    transition: 'stroke 0.4s ease-out, stroke-width 0.6s ease-out',
                    pointerEvents: 'none',
                  }}
                />
              </g>
            )
          })}

          {/* Left nodes */}
          {story.leftNodes.map((node) => {
            const pos = leftPositions[node.id]
            if (!pos) return null
            const isActive = activeNode === node.id
            const amount = node.amounts[String(activeYear)] || 0

            return (
              <g
                key={`left-${node.id}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node.id)}
                role="button"
                aria-label={`${node.label}: ${formatAmount(amount)}`}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  ry={6}
                  fill={isActive ? 'rgba(230, 45, 117, 0.15)' : 'rgba(26, 74, 138, 0.5)'}
                  stroke={isActive ? PINK : 'rgba(141, 186, 220, 0.2)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  filter={isActive ? 'url(#glow-pink)' : undefined}
                  style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                />
                <text
                  x={pos.x + 12}
                  y={pos.y + 20}
                  fill={GRAY_LIGHT}
                  fontSize={13}
                  fontWeight={500}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                >
                  {truncateLabel(node.label, 22)}
                </text>
                <text
                  x={pos.x + 12}
                  y={pos.y + 38}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  fontSize={14}
                  fontWeight={700}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                  style={{ transition: 'fill 0.3s ease' }}
                >
                  {formatAmount(amount)}
                </text>
                <circle
                  cx={pos.x + NODE_WIDTH}
                  cy={pos.y + NODE_HEIGHT / 2}
                  r={3}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  opacity={0.6}
                  style={{ transition: 'fill 0.3s ease' }}
                />
                {isActive && (
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y - 10}
                    fill={PINK}
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                    textAnchor="middle"
                  >
                    Bekijk bestedingen →
                  </text>
                )}
              </g>
            )
          })}

          {/* Right nodes */}
          {story.rightNodes.map((node) => {
            const pos = rightPositions[node.id]
            if (!pos) return null
            const isActive = activeNode === node.id
            const amount = node.amounts[String(activeYear)] || 0

            return (
              <g
                key={`right-${node.id}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node.id)}
                role="button"
                aria-label={`${node.label}: ${formatAmount(amount)}`}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  ry={6}
                  fill={isActive ? 'rgba(230, 45, 117, 0.15)' : 'rgba(26, 74, 138, 0.5)'}
                  stroke={isActive ? PINK : 'rgba(141, 186, 220, 0.2)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  filter={isActive ? 'url(#glow-pink)' : undefined}
                  style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                />
                <text
                  x={pos.x + 12}
                  y={pos.y + 20}
                  fill={GRAY_LIGHT}
                  fontSize={13}
                  fontWeight={500}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                >
                  {truncateLabel(node.label, 22)}
                </text>
                <text
                  x={pos.x + 12}
                  y={pos.y + 38}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  fontSize={14}
                  fontWeight={700}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                  style={{ transition: 'fill 0.3s ease' }}
                >
                  {formatAmount(amount)}
                </text>
                <circle
                  cx={pos.x}
                  cy={pos.y + NODE_HEIGHT / 2}
                  r={3}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  opacity={0.6}
                  style={{ transition: 'fill 0.3s ease' }}
                />
                {isActive && (
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y - 10}
                    fill={PINK}
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                    textAnchor="middle"
                  >
                    Bekijk ontvangers →
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Canvas layer: particles */}
        <canvas
          id="particle-canvas"
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y - 44,
              transform: 'translateX(-50%)',
              background: 'rgba(14, 50, 97, 0.95)',
              border: '1px solid rgba(141, 186, 220, 0.3)',
              borderRadius: 6,
              padding: '6px 12px',
              color: GRAY_LIGHT,
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 20,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Story tabs */}
      <div
        role="tablist"
        aria-label="Selecteer databron"
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 24,
          position: 'relative',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease-out 0.5s',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {STORY_KEYS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={key === activeStoryKey}
            onClick={() => handleStoryClick(key)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: key === activeStoryKey ? `1px solid ${PINK}` : '1px solid rgba(141, 186, 220, 0.15)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: key === activeStoryKey ? 600 : 400,
              fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
              background: key === activeStoryKey ? 'rgba(230, 45, 117, 0.1)' : 'transparent',
              color: key === activeStoryKey ? PINK : 'rgba(141, 186, 220, 0.6)',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Attribution */}
      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1.2s ease-out 0.6s',
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: 'rgba(141, 186, 220, 0.5)',
            margin: 0,
            fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
            letterSpacing: '0.03em',
          }}
        >
          Rijksbegroting {story.years[0]} &ndash; {story.years[story.years.length - 1]} &middot; Bron: rijksfinancien.nl
        </p>
      </div>

      {/* Bottom border */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${PINK} 30%, ${BLUE_LIGHT} 70%, transparent 100%)`,
          opacity: 0.4,
        }}
      />
    </div>
  )
}
