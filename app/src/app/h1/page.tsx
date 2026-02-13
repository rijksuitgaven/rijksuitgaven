'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BudgetNode {
  id: string
  label: string
  amount: number          // in billions
  displayAmount: string   // formatted
}

interface RecipientNode {
  id: string
  label: string
}

interface FlowLink {
  sourceId: string
  targetId: string
  weight: number  // 0-1 relative thickness
}

interface Particle {
  id: number
  linkIndex: number
  t: number           // 0-1 progress along path
  speed: number       // units per frame
  radius: number
  opacity: number
}

interface Tooltip {
  x: number
  y: number
  text: string
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BUDGET_NODES: BudgetNode[] = [
  { id: 'sz',    label: 'Sociale Zekerheid',  amount: 108, displayAmount: '€108 mld' },
  { id: 'zorg',  label: 'Zorg',               amount: 99,  displayAmount: '€99 mld' },
  { id: 'ond',   label: 'Onderwijs',          amount: 46,  displayAmount: '€46 mld' },
  { id: 'def',   label: 'Defensie',           amount: 21,  displayAmount: '€21 mld' },
  { id: 'infra', label: 'Infrastructuur',     amount: 14,  displayAmount: '€14 mld' },
]

const RECIPIENT_NODES: RecipientNode[] = [
  { id: 'gem',   label: 'Gemeenten' },
  { id: 'prov',  label: 'Provincies' },
  { id: 'bedr',  label: 'Bedrijven' },
  { id: 'zbo',   label: "ZBO's" },
  { id: 'burg',  label: 'Burgers' },
]

// Flow links: each budget category sends to multiple recipients.
// Weights are visual only (approximate proportions).
const FLOW_LINKS: FlowLink[] = [
  // Sociale Zekerheid → primarily Burgers & Gemeenten
  { sourceId: 'sz', targetId: 'burg', weight: 0.50 },
  { sourceId: 'sz', targetId: 'gem',  weight: 0.25 },
  { sourceId: 'sz', targetId: 'zbo',  weight: 0.15 },
  { sourceId: 'sz', targetId: 'bedr', weight: 0.10 },
  // Zorg → ZBO's, Burgers, Bedrijven
  { sourceId: 'zorg', targetId: 'zbo',  weight: 0.35 },
  { sourceId: 'zorg', targetId: 'burg', weight: 0.30 },
  { sourceId: 'zorg', targetId: 'bedr', weight: 0.20 },
  { sourceId: 'zorg', targetId: 'gem',  weight: 0.15 },
  // Onderwijs → Gemeenten, ZBO's, Provincies
  { sourceId: 'ond', targetId: 'gem',  weight: 0.35 },
  { sourceId: 'ond', targetId: 'zbo',  weight: 0.30 },
  { sourceId: 'ond', targetId: 'prov', weight: 0.20 },
  { sourceId: 'ond', targetId: 'bedr', weight: 0.15 },
  // Defensie → Bedrijven, ZBO's
  { sourceId: 'def', targetId: 'bedr', weight: 0.50 },
  { sourceId: 'def', targetId: 'zbo',  weight: 0.30 },
  { sourceId: 'def', targetId: 'gem',  weight: 0.20 },
  // Infrastructuur → Gemeenten, Provincies, Bedrijven
  { sourceId: 'infra', targetId: 'gem',  weight: 0.35 },
  { sourceId: 'infra', targetId: 'prov', weight: 0.30 },
  { sourceId: 'infra', targetId: 'bedr', weight: 0.25 },
  { sourceId: 'infra', targetId: 'zbo',  weight: 0.10 },
]

// ---------------------------------------------------------------------------
// Color constants (matching CSS vars)
// ---------------------------------------------------------------------------

const NAVY_DARK   = '#0E3261'
const PINK        = '#E62D75'
const PINK_HOVER  = '#cc2968'
const BLUE_LIGHT  = '#8DBADC'
const GRAY_LIGHT  = '#E1EAF2'
const NAVY_MID    = '#1a4a8a'

// ---------------------------------------------------------------------------
// Layout computation
// ---------------------------------------------------------------------------

const SVG_WIDTH  = 1200
const SVG_HEIGHT = 600
const NODE_WIDTH = 160
const NODE_HEIGHT = 52
const LEFT_X = 40
const RIGHT_X = SVG_WIDTH - NODE_WIDTH - 40
const VERTICAL_PAD = 30

function computeNodePositions() {
  const leftNodes: Record<string, { x: number; y: number }> = {}
  const rightNodes: Record<string, { x: number; y: number }> = {}

  const totalLeftHeight = BUDGET_NODES.length * NODE_HEIGHT + (BUDGET_NODES.length - 1) * VERTICAL_PAD
  const leftStartY = (SVG_HEIGHT - totalLeftHeight) / 2

  BUDGET_NODES.forEach((node, i) => {
    leftNodes[node.id] = {
      x: LEFT_X,
      y: leftStartY + i * (NODE_HEIGHT + VERTICAL_PAD),
    }
  })

  const totalRightHeight = RECIPIENT_NODES.length * NODE_HEIGHT + (RECIPIENT_NODES.length - 1) * VERTICAL_PAD
  const rightStartY = (SVG_HEIGHT - totalRightHeight) / 2

  RECIPIENT_NODES.forEach((node, i) => {
    rightNodes[node.id] = {
      x: RIGHT_X,
      y: rightStartY + i * (NODE_HEIGHT + VERTICAL_PAD),
    }
  })

  return { leftNodes, rightNodes }
}

// Generate a cubic bezier path from source node right-edge to target node left-edge
function computeFlowPath(
  sx: number, sy: number,
  tx: number, ty: number,
): string {
  const startX = sx + NODE_WIDTH
  const startY = sy + NODE_HEIGHT / 2
  const endX = tx
  const endY = ty + NODE_HEIGHT / 2
  const cx = (startX + endX) / 2
  return `M ${startX} ${startY} C ${cx} ${startY}, ${cx} ${endY}, ${endX} ${endY}`
}

// Evaluate a point on a cubic bezier at parameter t
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

  // P0 = (startX, startY), P1 = (cx, startY), P2 = (cx, endY), P3 = (endX, endY)
  const u = 1 - t
  const x = u*u*u*startX + 3*u*u*t*cx + 3*u*t*t*cx + t*t*t*endX
  const y = u*u*u*startY + 3*u*u*t*startY + 3*u*t*t*endY + t*t*t*endY
  return { x, y }
}

// ---------------------------------------------------------------------------
// Tooltip amount generator
// ---------------------------------------------------------------------------

function flowTooltipText(link: FlowLink): string {
  const source = BUDGET_NODES.find(n => n.id === link.sourceId)
  const target = RECIPIENT_NODES.find(n => n.id === link.targetId)
  if (!source || !target) return ''
  const amt = source.amount * link.weight
  return `${source.label} → ${target.label}: €${amt.toFixed(1)} mld`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeGeldstroom() {
  const svgRef = useRef<SVGSVGElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const nextIdRef = useRef(0)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const { leftNodes, rightNodes } = useMemo(() => computeNodePositions(), [])

  // Pre-compute flow paths data
  const flowPathsData = useMemo(() => {
    return FLOW_LINKS.map((link) => {
      const sPos = leftNodes[link.sourceId]
      const tPos = rightNodes[link.targetId]
      const d = computeFlowPath(sPos.x, sPos.y, tPos.x, tPos.y)
      return { link, sPos, tPos, d }
    })
  }, [leftNodes, rightNodes])

  // Mount animation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Spawn particles
  const spawnParticle = useCallback((linkIndex: number) => {
    const id = nextIdRef.current++
    const speed = 0.0008 + Math.random() * 0.0012  // slow, dignified
    const radius = 2 + Math.random() * 3            // 2-5px
    const opacity = 0.6 + Math.random() * 0.4
    particlesRef.current.push({
      id,
      linkIndex,
      t: 0,
      speed,
      radius,
      opacity,
    })
  }, [])

  // Main animation loop
  useEffect(() => {
    if (!mounted) return

    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let spawnTimer = 0

    function animate() {
      if (!ctx || !canvas) return

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn new particles periodically
      spawnTimer++
      if (spawnTimer % 3 === 0) {
        // Spawn on a random link, weighted by link weight
        const totalWeight = FLOW_LINKS.reduce((s, l) => s + l.weight, 0)
        let r = Math.random() * totalWeight
        for (let i = 0; i < FLOW_LINKS.length; i++) {
          r -= FLOW_LINKS[i].weight
          if (r <= 0) {
            spawnParticle(i)
            break
          }
        }
      }

      // Update & draw particles
      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.t += p.speed

        if (p.t > 1) continue // remove

        const fpd = flowPathsData[p.linkIndex]
        const pos = evalCubic(fpd.sPos.x, fpd.sPos.y, fpd.tPos.x, fpd.tPos.y, p.t)

        // Fade in at start, fade out at end
        let alpha = p.opacity
        if (p.t < 0.05) alpha *= p.t / 0.05
        if (p.t > 0.90) alpha *= (1 - p.t) / 0.10

        // Glow effect: draw larger semi-transparent circle behind
        const glowRadius = p.radius * 3
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius)
        gradient.addColorStop(0, `rgba(230, 45, 117, ${alpha * 0.4})`)
        gradient.addColorStop(0.5, `rgba(230, 45, 117, ${alpha * 0.1})`)
        gradient.addColorStop(1, 'rgba(230, 45, 117, 0)')
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core particle
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

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [mounted, flowPathsData, spawnParticle])

  // Handle SVG hover for tooltips
  const handlePathMouseEnter = useCallback((e: React.MouseEvent, linkIndex: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTooltip({ x, y, text: flowTooltipText(FLOW_LINKS[linkIndex]) })
  }, [])

  const handlePathMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tooltip) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
  }, [tooltip])

  const handlePathMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveNode(prev => prev === nodeId ? null : nodeId)
    // Auto-clear after 2 seconds
    setTimeout(() => setActiveNode(null), 2000)
  }, [])

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
      {/* Subtle grid overlay */}
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

      {/* Radial glow behind diagram */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '900px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse, rgba(230, 45, 117, 0.05) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Headline */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 48,
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
          Waar gaat{' '}
          <span style={{ color: PINK }}>
            &euro;1.700 miljard
          </span>
          {' '}naartoe?
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
        {/* SVG layer: paths and nodes */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <defs>
            {/* Glow filter for active nodes */}
            <filter id="glow-pink" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle drop shadow for nodes */}
            <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
            </filter>
          </defs>

          {/* Flow paths (visible strokes) */}
          {flowPathsData.map((fpd, i) => {
            const source = BUDGET_NODES.find(n => n.id === fpd.link.sourceId)
            const strokeWidth = Math.max(1, (fpd.link.weight * (source?.amount ?? 30)) * 0.06)
            const isHighlighted = activeNode === fpd.link.sourceId || activeNode === fpd.link.targetId

            return (
              <g key={`flow-${i}`}>
                {/* Invisible wider hitbox for hover */}
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
                  stroke={isHighlighted ? `rgba(230, 45, 117, 0.25)` : `rgba(141, 186, 220, 0.08)`}
                  strokeWidth={strokeWidth}
                  style={{
                    transition: 'stroke 0.4s ease-out, stroke-width 0.4s ease-out',
                    pointerEvents: 'none',
                  }}
                />
              </g>
            )
          })}

          {/* Left nodes: Budget categories */}
          {BUDGET_NODES.map((node) => {
            const pos = leftNodes[node.id]
            const isActive = activeNode === node.id

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Node background */}
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
                  style={{
                    transition: 'fill 0.3s ease, stroke 0.3s ease',
                  }}
                />
                {/* Label */}
                <text
                  x={pos.x + 12}
                  y={pos.y + 20}
                  fill={GRAY_LIGHT}
                  fontSize={13}
                  fontWeight={500}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                >
                  {node.label}
                </text>
                {/* Amount */}
                <text
                  x={pos.x + 12}
                  y={pos.y + 38}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  fontSize={14}
                  fontWeight={700}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                  style={{ transition: 'fill 0.3s ease' }}
                >
                  {node.displayAmount}
                </text>
                {/* Right-side connector dot */}
                <circle
                  cx={pos.x + NODE_WIDTH}
                  cy={pos.y + NODE_HEIGHT / 2}
                  r={3}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  opacity={0.6}
                  style={{ transition: 'fill 0.3s ease' }}
                />
              </g>
            )
          })}

          {/* Right nodes: Recipient categories */}
          {RECIPIENT_NODES.map((node) => {
            const pos = rightNodes[node.id]
            const isActive = activeNode === node.id

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Node background */}
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
                  style={{
                    transition: 'fill 0.3s ease, stroke 0.3s ease',
                  }}
                />
                {/* Label */}
                <text
                  x={pos.x + NODE_WIDTH / 2}
                  y={pos.y + NODE_HEIGHT / 2 + 5}
                  fill={GRAY_LIGHT}
                  fontSize={14}
                  fontWeight={600}
                  fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                  textAnchor="middle"
                >
                  {node.label}
                </text>
                {/* Left-side connector dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y + NODE_HEIGHT / 2}
                  r={3}
                  fill={isActive ? PINK : BLUE_LIGHT}
                  opacity={0.6}
                  style={{ transition: 'fill 0.3s ease' }}
                />

                {/* CTA text on active */}
                {isActive && (
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y - 10}
                    fill={PINK}
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                    textAnchor="middle"
                    opacity={1}
                  >
                    Bekijk ontvangers &rarr;
                  </text>
                )}
              </g>
            )
          })}

          {/* CTA on active left nodes */}
          {BUDGET_NODES.map((node) => {
            const pos = leftNodes[node.id]
            if (activeNode !== node.id) return null
            return (
              <text
                key={`cta-${node.id}`}
                x={pos.x + NODE_WIDTH / 2}
                y={pos.y - 10}
                fill={PINK}
                fontSize={11}
                fontWeight={600}
                fontFamily="var(--font-body, 'IBM Plex Sans', sans-serif)"
                textAnchor="middle"
              >
                Bekijk bestedingen &rarr;
              </text>
            )
          })}
        </svg>

        {/* Canvas layer: particles (overlays SVG) */}
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
              border: `1px solid rgba(141, 186, 220, 0.3)`,
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

      {/* Bottom caption */}
      <div
        style={{
          marginTop: 40,
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
          Rijksbegroting 2016 &ndash; 2024 &middot; Bron: rijksfinancien.nl
        </p>
      </div>

      {/* Animated bottom border line */}
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
