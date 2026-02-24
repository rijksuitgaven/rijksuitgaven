'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

// ============================================================================
// Curated Data — 56 real instrumenten recipients from production Supabase
// Values are absolute euros. 2018–2023 columns show redacted bars (no data).
// Used as default display before any search query is entered.
// ============================================================================

interface Recipient {
  ontvanger: string
  y2024: number
  totaal: number
  /** Seed for redacted bar widths (deterministic per row) */
  barSeed: number
}

const CURATED_RECIPIENTS: Recipient[] = [
  // — Major government bodies —
  { ontvanger: 'Sociale Verzekeringsbank', y2024: 36597470000, totaal: 114262130000, barSeed: 1 },
  { ontvanger: 'Zorginstituut Nederland', y2024: 24286070000, totaal: 71007222000, barSeed: 2 },
  { ontvanger: 'Belastingdienst/Toeslagen', y2024: 10645558000, totaal: 27039761000, barSeed: 3 },
  { ontvanger: 'TenneT Holding B.V.', y2024: 13100000000, totaal: 15946400000, barSeed: 4 },
  { ontvanger: 'ProRail B.V.', y2024: 9962000, totaal: 12272597000, barSeed: 5 },
  { ontvanger: 'Uitvoeringsinstituut werknemersverzekeringen', y2024: 7093067000, totaal: 18047313000, barSeed: 6 },
  { ontvanger: 'Immigratie- en Naturalisatiedienst', y2024: 805163000, totaal: 2959047000, barSeed: 7 },
  { ontvanger: 'Dienst Uitvoering Onderwijs', y2024: 468329000, totaal: 1741437000, barSeed: 8 },
  { ontvanger: 'Centraal Bureau voor de Statistiek', y2024: 203232000, totaal: 1214025000, barSeed: 9 },
  { ontvanger: 'Rijksinstituut voor Volksgezondheid en Milieu (RIVM)', y2024: 5328000, totaal: 949809000, barSeed: 10 },

  // — Municipalities —
  { ontvanger: 'Gemeente Amsterdam', y2024: 4005827000, totaal: 11146597000, barSeed: 11 },
  { ontvanger: 'Gemeente Rotterdam', y2024: 3049142000, totaal: 11911180000, barSeed: 12 },
  { ontvanger: 'Gemeente Utrecht', y2024: 1303123000, totaal: 5049944000, barSeed: 13 },
  { ontvanger: 'Gemeente Eindhoven', y2024: 863916000, totaal: 3324318000, barSeed: 14 },
  { ontvanger: 'Gemeente Groningen', y2024: 1108680000, totaal: 4023396000, barSeed: 15 },
  { ontvanger: 'Gemeente Den Haag', y2024: 59704000, totaal: 769861000, barSeed: 16 },

  // — Universities —
  { ontvanger: 'Universiteit van Amsterdam', y2024: 821924000, totaal: 5206678000, barSeed: 17 },
  { ontvanger: 'Rijksuniversiteit Groningen', y2024: 749495000, totaal: 4751545000, barSeed: 18 },
  { ontvanger: 'Universiteit Leiden', y2024: 675478000, totaal: 4280836000, barSeed: 19 },
  { ontvanger: 'Erasmus Universiteit Rotterdam', y2024: 597053000, totaal: 3759318000, barSeed: 20 },
  { ontvanger: 'Universiteit Twente', y2024: 359426000, totaal: 2175906000, barSeed: 21 },
  { ontvanger: 'Technische Universiteit Eindhoven', y2024: 370583000, totaal: 2015021000, barSeed: 22 },
  { ontvanger: 'Wageningen University', y2024: 338500000, totaal: 1677305000, barSeed: 23 },
  { ontvanger: 'Vrije Universiteit Amsterdam', y2024: 637227000, totaal: 1716800000, barSeed: 24 },
  { ontvanger: 'Radboud Universiteit Nijmegen', y2024: 564139000, totaal: 1076080000, barSeed: 25 },

  // — Hogescholen —
  { ontvanger: 'Stichting Fontys', y2024: 412999000, totaal: 2866918000, barSeed: 26 },
  { ontvanger: 'Hogeschool van Amsterdam', y2024: 412885000, totaal: 2467281000, barSeed: 27 },

  // — Research & Science —
  { ontvanger: 'TNO', y2024: 382610000, totaal: 1811532000, barSeed: 28 },
  { ontvanger: 'Wageningen Research', y2024: 267839000, totaal: 893773000, barSeed: 29 },
  { ontvanger: 'Nederlands Forensisch Instituut', y2024: 1604000, totaal: 318446000, barSeed: 30 },
  { ontvanger: 'European Molecular Biology Laboratory', y2024: 7106000, totaal: 50118000, barSeed: 31 },
  { ontvanger: 'European Southern Observatory', y2024: 10860000, totaal: 91930000, barSeed: 32 },

  // — Transport —
  { ontvanger: 'NS Reizigers B.V.', y2024: 249000, totaal: 2221909000, barSeed: 33 },
  { ontvanger: 'KLM N.V.', y2024: 1529000, totaal: 3255000, barSeed: 34 },

  // — Culture —
  { ontvanger: 'Stichting het Rijksmuseum', y2024: 47470000, totaal: 373077000, barSeed: 35 },
  { ontvanger: 'Van Gogh Museum', y2024: 10015000, totaal: 106017000, barSeed: 36 },
  { ontvanger: 'Koninklijke Bibliotheek', y2024: 146434000, totaal: 911742000, barSeed: 37 },
  { ontvanger: 'Nationale Opera & Ballet', y2024: 41404000, totaal: 266448000, barSeed: 38 },
  { ontvanger: 'Koninklijk Concertgebouworkest', y2024: 9174000, totaal: 75828000, barSeed: 39 },
  { ontvanger: 'Mauritshuis', y2024: 5555000, totaal: 38760000, barSeed: 40 },
  { ontvanger: 'Naturalis Biodiversity Center', y2024: 42808000, totaal: 43177000, barSeed: 41 },
  { ontvanger: 'Nederlands Openluchtmuseum', y2024: 18042000, totaal: 112387000, barSeed: 42 },
  { ontvanger: 'EYE Filmmuseum', y2024: 14376000, totaal: 92123000, barSeed: 43 },
  { ontvanger: 'Nationaal Archief', y2024: 94153000, totaal: 393237000, barSeed: 44 },

  // — Security & Defence —
  { ontvanger: 'Politieacademie', y2024: 3000, totaal: 130714000, barSeed: 45 },
  { ontvanger: 'Veiligheidsregio Haaglanden', y2024: 11815000, totaal: 90109000, barSeed: 46 },
  { ontvanger: 'Veiligheidsregio Rotterdam-Rijnmond', y2024: 18200000, totaal: 96387000, barSeed: 47 },
  { ontvanger: 'NATO', y2024: 21924000, totaal: 149285000, barSeed: 48 },

  // — Social —
  { ontvanger: 'Het Nederlandse Rode Kruis', y2024: 91547000, totaal: 311338000, barSeed: 49 },
  { ontvanger: 'Stichting Nidos', y2024: 335638000, totaal: 924779000, barSeed: 50 },
  { ontvanger: 'Staatsbosbeheer', y2024: 38468000, totaal: 282360000, barSeed: 51 },
  { ontvanger: 'Stichting Nationaal Restauratiefonds', y2024: 164911000, totaal: 1065182000, barSeed: 52 },
  { ontvanger: 'VluchtelingenWerk Nederland', y2024: 40408000, totaal: 103034000, barSeed: 53 },
  { ontvanger: 'Leger des Heils', y2024: 1199000, totaal: 189619000, barSeed: 54 },
  { ontvanger: 'Anne Frank Stichting', y2024: 585000, totaal: 3844000, barSeed: 55 },
  { ontvanger: 'Stichting Cambium', y2024: 10640000, totaal: 74313000, barSeed: 56 },
]

// Placeholder suggestions that cycle in the search input
const PLACEHOLDER_SUGGESTIONS = [
  'ProRail',
  'Gemeente Amsterdam',
  'Rijksmuseum',
  'Universiteit',
  'Rode Kruis',
]

// Year columns
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023] as const
const VISIBLE_YEAR = 2024
const MAX_ROWS = 10

// Redacted bar widths (small, medium, large) — seeded per cell for consistency
const BAR_WIDTHS = [32, 48, 64]
function getBarWidth(seed: number, colIndex: number): number {
  return BAR_WIDTHS[(seed * 7 + colIndex * 13) % BAR_WIDTHS.length]
}

// Hash-based bar seed for API results (deterministic from ontvanger string)
function hashBarSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// ============================================================================
// Number formatting — absolute euros
// ============================================================================

function formatEuro(value: number): string {
  if (value === 0) return '—'
  if (value >= 1_000_000_000) {
    const mld = value / 1_000_000_000
    return `€${mld.toFixed(1).replace('.', ',')} mld`
  }
  if (value >= 1_000_000) {
    const mln = value / 1_000_000
    if (mln >= 100) return `€${Math.round(mln)} mln`
    return `€${mln.toFixed(1).replace('.', ',')} mln`
  }
  if (value >= 1_000) {
    return `€${Math.round(value / 1_000)}k`
  }
  return `€${value}`
}

// ============================================================================
// Animated Placeholder — cycles through suggestions
// ============================================================================

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
        if (charIndex <= target.length) {
          setDisplayed(target.slice(0, charIndex))
          charIndex++
          timeout = setTimeout(typeChar, 45 + Math.random() * 35)
        } else {
          timeout = setTimeout(() => setIsTyping(false), intervalMs)
        }
      }
      typeChar()
    } else {
      let eraseIndex = target.length
      const eraseChar = () => {
        if (eraseIndex >= 0) {
          setDisplayed(target.slice(0, eraseIndex))
          eraseIndex--
          timeout = setTimeout(eraseChar, 25)
        } else {
          setIndex((prev) => (prev + 1) % suggestions.length)
          setIsTyping(true)
        }
      }
      eraseChar()
    }

    return () => clearTimeout(timeout)
  }, [index, isTyping, suggestions, intervalMs])

  return displayed
}

// ============================================================================
// Search Icon
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

// ============================================================================
// Noise texture (from H3)
// ============================================================================

const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/></filter><rect width="200" height="200" filter="url(#n)" opacity="0.035"/></svg>`
const noiseDataUri = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

// ============================================================================
// Main Page Component
// ============================================================================

interface ApiResult {
  ontvanger: string
  y2024: number
  totaal: number
}

export default function ProbeerHetZelfPage() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [apiResults, setApiResults] = useState<ApiResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const animatedPlaceholder = useAnimatedPlaceholder(PLACEHOLDER_SUGGESTIONS)

  // Default curated rows (no query)
  const defaultRows = useMemo(() => CURATED_RECIPIENTS.slice(0, MAX_ROWS), [])

  // Determine what to display
  const isSearching = query.trim().length >= 2
  const displayRows: Recipient[] = useMemo(() => {
    if (!isSearching) return defaultRows

    // If we have API results, convert to Recipient format
    if (apiResults) {
      return apiResults.map((r) => ({
        ontvanger: r.ontvanger,
        y2024: r.y2024,
        totaal: r.totaal,
        barSeed: hashBarSeed(r.ontvanger),
      }))
    }

    // While loading, show nothing (skeleton will render instead)
    return []
  }, [isSearching, apiResults, defaultRows])

  // API search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setApiResults(null)
      setIsLoading(false)
      setRateLimited(false)
      return
    }

    setIsLoading(true)
    setRateLimited(false)

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, limit: '10' })
        const res = await fetch(`/api/v1/public/search?${params}`)

        if (res.status === 429) {
          setRateLimited(true)
          setApiResults(null)
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          setApiResults([])
          setIsLoading(false)
          return
        }

        const data: ApiResult[] = await res.json()
        setApiResults(data)
      } catch {
        setApiResults([])
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleChipClick = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setQuery('')
    setApiResults(null)
    setRateLimited(false)
    inputRef.current?.focus()
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-body, "IBM Plex Sans", sans-serif)',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f7f9fc 0%, #ffffff 40%, #f7f9fc 100%)',
      }}
    >
      {/* ================================================================== */}
      {/* Hero Section */}
      {/* ================================================================== */}
      <section style={{ paddingTop: '80px', paddingBottom: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--pink, #E62D75)',
              marginBottom: 16,
              opacity: 0,
              animation: 'h2FadeUp 0.6s ease-out 0.1s forwards',
            }}
          >
            Probeer het zelf
          </p>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--navy-dark, #0E3261)',
              margin: 0,
              opacity: 0,
              animation: 'h2FadeUp 0.7s ease-out 0.2s forwards',
            }}
          >
            Ontdek waar{' '}
            <span style={{ color: 'var(--pink, #E62D75)' }}>&euro;1.700 miljard</span>{' '}
            naartoe gaat
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.55,
              color: 'var(--navy-dark, #0E3261)',
              marginTop: 16,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
              opacity: 0,
              animation: 'h2FadeUp 0.7s ease-out 0.35s forwards',
            }}
          >
            Overheidsuitgaven op één plek — doorzoekbaar in seconden
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Dark Navy Container */}
      {/* ================================================================== */}
      <section
        style={{
          padding: '0 24px',
          maxWidth: 1100,
          margin: '0 auto',
          opacity: 0,
          animation: 'h2FadeUp 0.7s ease-out 0.45s forwards',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'var(--navy-dark, #0E3261)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)',
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

          {/* Grid pattern */}
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

          {/* Pink left accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '10%',
              bottom: '10%',
              width: 3,
              background: 'linear-gradient(to bottom, transparent, var(--pink, #E62D75), transparent)',
              opacity: 0.4,
              borderRadius: 2,
              zIndex: 2,
            }}
          />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 3, padding: '32px 32px 28px' }}>
            {/* Search Input */}
            <div style={{ maxWidth: 600, margin: '0 auto 0' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isFocused ? 'var(--pink, #E62D75)' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <SearchIcon />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={query ? undefined : `Zoek bijv. "${animatedPlaceholder}"...`}
                  style={{
                    width: '100%',
                    padding: '16px 20px 16px 52px',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    fontWeight: 400,
                    color: 'var(--navy-dark, #0E3261)',
                    background: 'rgba(255,255,255,0.95)',
                    border: '2px solid transparent',
                    borderColor: isFocused ? 'var(--pink, #E62D75)' : 'transparent',
                    borderRadius: 12,
                    outline: 'none',
                    transition: 'border-color 0.25s ease',
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    onClick={handleClear}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--navy-medium, #436FA3)',
                      padding: 6,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                    aria-label="Zoekveld wissen"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--navy-dark, #0E3261)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--navy-medium, #436FA3)')
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Quick-search chips */}
              {!query && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 14,
                    justifyContent: 'center',
                    opacity: 0,
                    animation: 'h2FadeUp 0.5s ease-out 0.65s forwards',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.45)',
                      lineHeight: '32px',
                      marginRight: 4,
                    }}
                  >
                    Probeer:
                  </span>
                  {['ProRail', 'Amsterdam', 'Universiteit', 'Rijksmuseum', 'Rode Kruis'].map(
                    (term) => (
                      <button
                        key={term}
                        onClick={() => handleChipClick(term)}
                        style={{
                          padding: '6px 14px',
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: 'inherit',
                          color: 'rgba(255,255,255,0.75)',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.14)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                          e.currentTarget.style.color = '#ffffff'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                          e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* White Inset Table Panel */}
            {/* ============================================================ */}
            <div
              style={{
                marginTop: 24,
                background: '#ffffff',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {/* Desktop table */}
              <div className="h2-table-scroll" style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: 'var(--font-condensed, "IBM Plex Sans Condensed", sans-serif)',
                    fontSize: 14,
                    minWidth: 880,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#F7F8FA',
                        borderBottom: '1px solid #E8ECF1',
                      }}
                    >
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 16px',
                          fontWeight: 600,
                          color: 'var(--navy-dark, #0E3261)',
                          fontSize: 13,
                          position: 'sticky',
                          left: 0,
                          background: '#F7F8FA',
                          zIndex: 1,
                          minWidth: 200,
                        }}
                      >
                        Ontvanger
                        <SortChevron />
                      </th>
                      {YEARS.map((year) => (
                        <th
                          key={year}
                          className="h2-year-col"
                          style={{
                            textAlign: 'center',
                            padding: '10px 8px',
                            fontWeight: 600,
                            color: 'var(--navy-medium, #436FA3)',
                            fontSize: 13,
                            width: 64,
                            opacity: 0.5,
                          }}
                        >
                          {year}
                        </th>
                      ))}
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '10px 12px',
                          fontWeight: 600,
                          color: 'var(--navy-dark, #0E3261)',
                          fontSize: 13,
                          width: 100,
                        }}
                      >
                        {VISIBLE_YEAR}
                        <SortChevron />
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '10px 16px',
                          fontWeight: 700,
                          color: 'var(--navy-dark, #0E3261)',
                          fontSize: 13,
                          width: 110,
                        }}
                      >
                        Totaal
                        <SortChevron />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Rate limit message */}
                    {rateLimited ? (
                      <tr>
                        <td
                          colSpan={YEARS.length + 3}
                          style={{
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: 'var(--navy-medium, #436FA3)',
                            fontSize: 14,
                          }}
                        >
                          U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw.
                        </td>
                      </tr>
                    ) : isLoading && isSearching ? (
                      /* Loading skeleton */
                      Array.from({ length: MAX_ROWS }).map((_, i) => (
                        <tr
                          key={`skeleton-${i}`}
                          style={{
                            borderBottom: '1px solid #F0F2F5',
                          }}
                        >
                          <td
                            style={{
                              padding: '10px 16px',
                              position: 'sticky',
                              left: 0,
                              background: '#ffffff',
                              zIndex: 1,
                            }}
                          >
                            <div className="h2-skeleton" style={{ width: 120 + (i % 3) * 40, height: 14, borderRadius: 4 }} />
                          </td>
                          {YEARS.map((_, colIdx) => (
                            <td key={colIdx} className="h2-year-col" style={{ padding: '10px 8px', textAlign: 'center' }}>
                              <div className="h2-skeleton" style={{ width: BAR_WIDTHS[colIdx % 3], height: 14, borderRadius: 4, margin: '0 auto' }} />
                            </td>
                          ))}
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div className="h2-skeleton" style={{ width: 60, height: 14, borderRadius: 4, marginLeft: 'auto' }} />
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <div className="h2-skeleton" style={{ width: 72, height: 14, borderRadius: 4, marginLeft: 'auto' }} />
                          </td>
                        </tr>
                      ))
                    ) : displayRows.length > 0 ? (
                      displayRows.map((r, i) => (
                        <tr
                          key={r.ontvanger}
                          className="h2-table-row"
                          style={{
                            borderBottom: '1px solid #F0F2F5',
                            transition: 'background 0.15s ease',
                            opacity: 0,
                            animation: `h2RowFadeIn 0.3s ease-out ${i * 0.03}s forwards`,
                          }}
                        >
                          <td
                            style={{
                              padding: '10px 16px',
                              color: 'var(--navy-dark, #0E3261)',
                              fontWeight: 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 240,
                              position: 'sticky',
                              left: 0,
                              background: '#ffffff',
                              zIndex: 1,
                            }}
                          >
                            {r.ontvanger}
                          </td>
                          {YEARS.map((_, colIdx) => (
                            <td
                              key={colIdx}
                              className="h2-year-col"
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: getBarWidth(r.barSeed, colIdx),
                                  height: 14,
                                  borderRadius: 4,
                                  background: 'var(--navy-dark, #0E3261)',
                                  opacity: 0.1,
                                  margin: '0 auto',
                                }}
                              />
                            </td>
                          ))}
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                              color: 'var(--navy-dark, #0E3261)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatEuro(r.y2024)}
                          </td>
                          <td
                            style={{
                              padding: '10px 16px',
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 600,
                              color: 'var(--navy-dark, #0E3261)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatEuro(r.totaal)}
                          </td>
                        </tr>
                      ))
                    ) : isSearching ? (
                      <tr>
                        <td
                          colSpan={YEARS.length + 3}
                          style={{
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: 'var(--navy-medium, #436FA3)',
                            fontSize: 14,
                          }}
                        >
                          Geen resultaten voor &ldquo;{query}&rdquo; — probeer een andere zoekterm
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
                padding: '0 4px',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: 'var(--font-condensed, "IBM Plex Sans Condensed", sans-serif)',
                }}
              >
                Bronnen: Rijksoverheid & medeoverheden
              </span>
              <a
                href="/login"
                className="h2-cta-link"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.2s ease',
                }}
              >
                <span>Bekijk alle jaren en data</span>
                <span className="h2-cta-arrow" style={{ transition: 'transform 0.2s ease' }}>
                  &rarr;
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Trust Indicators */}
      {/* ================================================================== */}
      <section
        style={{
          maxWidth: 900,
          margin: '48px auto 0',
          padding: '0 24px',
          opacity: 0,
          animation: 'h2FadeUp 0.7s ease-out 0.7s forwards',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px 32px',
          }}
        >
          <TrustItem value="450.000+" label="ontvangers" />
          <TrustSeparator />
          <TrustItem value="9 jaar" label="data" />
          <TrustSeparator />
          <TrustItem value="€1.700+ mld" label="aan uitgaven" />
        </div>
      </section>

      {/* ================================================================== */}
      {/* Bottom CTA */}
      {/* ================================================================== */}
      <section
        style={{
          textAlign: 'center',
          padding: '56px 24px 80px',
          opacity: 0,
          animation: 'h2FadeUp 0.7s ease-out 0.9s forwards',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            fontWeight: 600,
            color: 'var(--navy-dark, #0E3261)',
            marginBottom: 24,
          }}
        >
          Klaar om dieper te graven?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'inherit',
              color: '#ffffff',
              background: 'var(--pink, #E62D75)',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 16px rgba(230, 45, 117, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--pink-hover, #cc2968)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 45, 117, 0.35)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--pink, #E62D75)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(230, 45, 117, 0.25)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Gratis proberen
          </a>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Keyframe Animations */}
      {/* ================================================================== */}
      <style>{`
        @keyframes h2FadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes h2RowFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes h2Shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }

        .h2-skeleton {
          background: linear-gradient(90deg, #F0F2F5 0%, #E8ECF1 50%, #F0F2F5 100%);
          background-size: 200px 100%;
          animation: h2Shimmer 1.2s ease-in-out infinite;
        }

        .h2-table-row:hover td {
          background: #F8FAFD !important;
        }

        .h2-cta-link:hover {
          color: var(--pink, #E62D75) !important;
        }

        .h2-cta-link:hover .h2-cta-arrow {
          transform: translateX(4px);
        }

        input::placeholder {
          color: var(--navy-medium, #436FA3);
          opacity: 0.55;
        }

        /* Scrollbar styling for table */
        .h2-table-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .h2-table-scroll::-webkit-scrollbar-track {
          background: #F0F2F5;
          border-radius: 3px;
        }
        .h2-table-scroll::-webkit-scrollbar-thumb {
          background: #C4CDD8;
          border-radius: 3px;
        }

        /* Mobile: hide year columns, show compact table */
        @media (max-width: 768px) {
          .h2-year-col {
            display: none;
          }
          table {
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Sort Chevron (visual only)
// ============================================================================

function SortChevron() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      style={{ marginLeft: 4, verticalAlign: 'middle', opacity: 0.3 }}
    >
      <path d="M2 3l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ============================================================================
// Trust Indicators
// ============================================================================

function TrustItem({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--navy-dark, #0E3261)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 14, color: 'var(--navy-medium, #436FA3)', opacity: 0.8 }}>
        {label}
      </span>
    </div>
  )
}

function TrustSeparator() {
  return (
    <span
      style={{ color: 'var(--gray-light, #E1EAF2)', fontSize: 18, lineHeight: '24px', userSelect: 'none' }}
      aria-hidden="true"
    >
      |
    </span>
  )
}
