'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// Mock Data — realistic amounts based on actual rijksuitgaven data
// ============================================================================

interface ModuleBreakdown {
  module: string
  amount: string
}

interface SearchResult {
  name: string
  total: string
  period: string
  modules: ModuleBreakdown[]
}

const MOCK_DATA: Record<string, SearchResult[]> = {
  prorail: [
    {
      name: 'ProRail B.V.',
      total: '€12,7 mld',
      period: '2016–2024',
      modules: [
        { module: 'Financiele Instrumenten', amount: '€12,2 mld' },
        { module: 'Inkoopuitgaven', amount: '€412 mln' },
        { module: 'Publiek', amount: '€49 mln' },
      ],
    },
    {
      name: 'ProRail Personeel B.V.',
      total: '€1,2 mld',
      period: '2018–2024',
      modules: [
        { module: 'Inkoopuitgaven', amount: '€1,1 mld' },
        { module: 'Publiek', amount: '€84 mln' },
      ],
    },
  ],
  amsterdam: [
    {
      name: 'Gemeente Amsterdam',
      total: '€4,8 mld',
      period: '2016–2024',
      modules: [
        { module: 'Gemeentelijke Subsidies', amount: '€2,1 mld' },
        { module: 'Financiele Instrumenten', amount: '€1,9 mld' },
        { module: 'Inkoopuitgaven', amount: '€612 mln' },
        { module: 'Publiek', amount: '€188 mln' },
      ],
    },
    {
      name: 'GGD Amsterdam',
      total: '€387 mln',
      period: '2016–2024',
      modules: [
        { module: 'Financiele Instrumenten', amount: '€298 mln' },
        { module: 'Inkoopuitgaven', amount: '€89 mln' },
      ],
    },
  ],
  politie: [
    {
      name: 'Nationale Politie',
      total: '€52,3 mld',
      period: '2016–2024',
      modules: [
        { module: 'Apparaatsuitgaven', amount: '€48,1 mld' },
        { module: 'Inkoopuitgaven', amount: '€3,8 mld' },
        { module: 'Financiele Instrumenten', amount: '€412 mln' },
      ],
    },
  ],
  defensie: [
    {
      name: 'Ministerie van Defensie',
      total: '€89,4 mld',
      period: '2016–2024',
      modules: [
        { module: 'Apparaatsuitgaven', amount: '€61,2 mld' },
        { module: 'Inkoopuitgaven', amount: '€22,8 mld' },
        { module: 'Financiele Instrumenten', amount: '€5,4 mld' },
      ],
    },
    {
      name: 'Defensie Materieel Organisatie',
      total: '€8,7 mld',
      period: '2016–2024',
      modules: [
        { module: 'Inkoopuitgaven', amount: '€7,9 mld' },
        { module: 'Apparaatsuitgaven', amount: '€812 mln' },
      ],
    },
  ],
  rijkswaterstaat: [
    {
      name: 'Rijkswaterstaat',
      total: '€31,6 mld',
      period: '2016–2024',
      modules: [
        { module: 'Apparaatsuitgaven', amount: '€14,8 mld' },
        { module: 'Inkoopuitgaven', amount: '€16,2 mld' },
        { module: 'Publiek', amount: '€612 mln' },
      ],
    },
  ],
}

// Placeholder suggestions that cycle in the search input
const PLACEHOLDER_SUGGESTIONS = [
  'ProRail',
  'Gemeente Amsterdam',
  'Nationale Politie',
  'Defensie',
  'Rijkswaterstaat',
]

// ============================================================================
// Module color mapping — each data source gets a subtle brand accent
// ============================================================================

function getModuleColor(module: string): string {
  if (module.includes('Instrument')) return 'var(--pink)'
  if (module.includes('Apparaat')) return 'var(--navy-dark)'
  if (module.includes('Inkoop')) return 'var(--navy-medium, #436FA3)'
  if (module.includes('Gemeente')) return '#2C7A3D'
  if (module.includes('Publiek')) return 'var(--blue-light)'
  if (module.includes('Provinc')) return '#B5891D'
  return 'var(--navy-medium, #436FA3)'
}

// ============================================================================
// Search Icon SVG
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
      // Erase
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
// Main Page Component
// ============================================================================

export default function ProbeerHetZelfPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animatedPlaceholder = useAnimatedPlaceholder(PLACEHOLDER_SUGGESTIONS)

  // Simulated search with debounce
  const performSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!searchQuery.trim()) {
      setResults([])
      setIsSearching(false)
      setHasSearched(false)
      return
    }

    setIsSearching(true)

    debounceRef.current = setTimeout(() => {
      const normalizedQuery = searchQuery.toLowerCase().trim()
      const matchedResults: SearchResult[] = []

      for (const [key, data] of Object.entries(MOCK_DATA)) {
        if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
          matchedResults.push(...data)
        } else {
          // Also search within result names
          for (const result of data) {
            if (result.name.toLowerCase().includes(normalizedQuery)) {
              matchedResults.push(result)
            }
          }
        }
      }

      setResults(matchedResults)
      setIsSearching(false)
      setHasSearched(true)
    }, 200)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    performSearch(value)
  }

  // Quick-search chip handler
  const handleChipClick = (term: string) => {
    setQuery(term)
    performSearch(term)
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
      <section
        style={{
          paddingTop: '80px',
          paddingBottom: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          {/* Eyebrow */}
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

          {/* Headline */}
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
            <span style={{ color: 'var(--pink, #E62D75)' }}>
              &euro;1.700 miljard
            </span>{' '}
            naartoe gaat
          </h1>

          {/* Subtext */}
          <p
            style={{
              fontSize: 'clamp(17px, 2.2vw, 21px)',
              lineHeight: 1.55,
              color: 'var(--navy-dark, #0E3261)',
              opacity: 0.75,
              marginTop: 20,
              maxWidth: 580,
              marginLeft: 'auto',
              marginRight: 'auto',
              animation: 'h2FadeUp 0.7s ease-out 0.35s forwards',
              animationFillMode: 'backwards',
            }}
          >
            Zoek direct in de grootste database van rijksuitgaven
          </p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Search Card */}
      {/* ================================================================== */}
      <section style={{ padding: '0 24px', maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: isFocused
              ? '0 25px 80px rgba(14, 50, 97, 0.12), 0 8px 32px rgba(14, 50, 97, 0.06), 0 0 0 2px var(--pink, #E62D75)'
              : '0 20px 60px rgba(14, 50, 97, 0.08), 0 4px 20px rgba(14, 50, 97, 0.04)',
            padding: '32px 32px 28px',
            transition: 'box-shadow 0.3s ease',
            opacity: 0,
            animation: 'h2FadeUp 0.7s ease-out 0.45s forwards',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                color: isFocused
                  ? 'var(--pink, #E62D75)'
                  : 'var(--navy-medium, #436FA3)',
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
              placeholder={
                query
                  ? undefined
                  : `Zoek bijv. "${animatedPlaceholder}"...`
              }
              style={{
                width: '100%',
                padding: '18px 20px 18px 52px',
                fontSize: 18,
                fontFamily: 'inherit',
                fontWeight: 400,
                color: 'var(--navy-dark, #0E3261)',
                background: 'var(--gray-light, #E1EAF2)',
                border: '2px solid transparent',
                borderColor: isFocused
                  ? 'var(--pink, #E62D75)'
                  : 'transparent',
                borderRadius: 14,
                outline: 'none',
                transition: 'border-color 0.25s ease, background 0.25s ease',
              }}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setHasSearched(false)
                  inputRef.current?.focus()
                }}
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
                  (e.currentTarget.style.color =
                    'var(--navy-dark, #0E3261)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    'var(--navy-medium, #436FA3)')
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                marginTop: 16,
                opacity: 0,
                animation: 'h2FadeUp 0.5s ease-out 0.65s forwards',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--navy-medium, #436FA3)',
                  lineHeight: '32px',
                  marginRight: 4,
                }}
              >
                Probeer:
              </span>
              {['ProRail', 'Amsterdam', 'Politie', 'Defensie', 'Rijkswaterstaat'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => handleChipClick(term)}
                    style={{
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      color: 'var(--navy-dark, #0E3261)',
                      background: 'var(--gray-light, #E1EAF2)',
                      border: '1px solid transparent',
                      borderRadius: 20,
                      cursor: 'pointer',
                      transition:
                        'background 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#d4e2f0'
                      e.currentTarget.style.borderColor =
                        'var(--blue-light, #8DBADC)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'var(--gray-light, #E1EAF2)'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* Search Results */}
          {/* ================================================================ */}
          {isSearching && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '32px 0 16px',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: '3px solid var(--gray-light, #E1EAF2)',
                  borderTopColor: 'var(--pink, #E62D75)',
                  borderRadius: '50%',
                  animation: 'h2Spin 0.7s linear infinite',
                }}
              />
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div style={{ marginTop: 24 }}>
              {/* Results divider */}
              <div
                style={{
                  height: 1,
                  background:
                    'linear-gradient(90deg, transparent, var(--gray-light, #E1EAF2), transparent)',
                  marginBottom: 20,
                }}
              />

              {/* Result count */}
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--navy-medium, #436FA3)',
                  marginBottom: 16,
                  letterSpacing: '0.02em',
                }}
              >
                {results.length} resultaat{results.length !== 1 ? 'en' : ''}{' '}
                gevonden
              </p>

              {/* Result cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.map((result, i) => (
                  <ResultCard key={`${result.name}-${i}`} result={result} index={i} />
                ))}
              </div>

              {/* Login CTA */}
              <div
                style={{
                  marginTop: 24,
                  textAlign: 'center',
                  opacity: 0,
                  animation: `h2FadeUp 0.5s ease-out ${results.length * 0.08 + 0.3}s forwards`,
                }}
              >
                <a
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    color: 'var(--pink, #E62D75)',
                    textDecoration: 'none',
                    padding: '10px 20px',
                    borderRadius: 10,
                    transition: 'background 0.2s ease, transform 0.15s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(230, 45, 117, 0.06)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span>&rarr;</span>
                  <span>Bekijk alle details (inloggen vereist)</span>
                </a>
              </div>
            </div>
          )}

          {/* No results state */}
          {!isSearching && hasSearched && results.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0 16px',
                opacity: 0,
                animation: 'h2FadeUp 0.4s ease-out 0.1s forwards',
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--navy-medium, #436FA3)',
                  marginBottom: 8,
                }}
              >
                Geen resultaten voor &ldquo;{query}&rdquo;
              </p>
              <p style={{ fontSize: 13, color: 'var(--navy-medium, #436FA3)', opacity: 0.7 }}>
                Probeer &ldquo;ProRail&rdquo;, &ldquo;Amsterdam&rdquo; of &ldquo;Politie&rdquo;
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* Trust Indicators */}
      {/* ================================================================== */}
      <section
        style={{
          maxWidth: 720,
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
          <TrustItem value="463.731" label="ontvangers" />
          <TrustSeparator />
          <TrustItem value="6" label="modules" />
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
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
              e.currentTarget.style.boxShadow =
                '0 8px 24px rgba(230, 45, 117, 0.35)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--pink, #E62D75)'
              e.currentTarget.style.boxShadow =
                '0 4px 16px rgba(230, 45, 117, 0.25)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Gratis proberen
          </a>
          <a
            href="#aanmelden"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'inherit',
              color: 'var(--navy-dark, #0E3261)',
              background: '#ffffff',
              border: '2px solid var(--gray-light, #E1EAF2)',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--blue-light, #8DBADC)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 4px 16px rgba(14, 50, 97, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-light, #E1EAF2)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Boek een demo
          </a>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Keyframe Animations (scoped via style tag) */}
      {/* ================================================================== */}
      <style>{`
        @keyframes h2FadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes h2Spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes h2ResultSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes h2ModuleSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes h2Shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Focus visible for keyboard nav */
        input:focus-visible {
          outline: 2px solid var(--pink, #E62D75);
          outline-offset: 2px;
        }

        /* Custom placeholder styling */
        input::placeholder {
          color: var(--navy-medium, #436FA3);
          opacity: 0.55;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .h2-result-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Result Card Component
// ============================================================================

function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#f8fafd' : '#fafbfd',
        borderRadius: 14,
        padding: '20px 24px',
        border: '1px solid',
        borderColor: isHovered
          ? 'var(--blue-light, #8DBADC)'
          : 'var(--gray-light, #E1EAF2)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 4px 20px rgba(14, 50, 97, 0.06)'
          : '0 1px 4px rgba(14, 50, 97, 0.02)',
        opacity: 0,
        animation: `h2ResultSlideIn 0.4s ease-out ${index * 0.08 + 0.1}s forwards`,
      }}
    >
      {/* Header: name + total */}
      <div
        className="h2-result-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--navy-dark, #0E3261)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {result.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--pink, #E62D75)',
              whiteSpace: 'nowrap',
            }}
          >
            {result.total}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--navy-medium, #436FA3)',
              whiteSpace: 'nowrap',
              opacity: 0.7,
            }}
          >
            {result.period}
          </span>
        </div>
      </div>

      {/* Module breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {result.modules.map((mod, j) => (
          <div
            key={mod.module}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: 0,
              animation: `h2ModuleSlideIn 0.35s ease-out ${index * 0.08 + j * 0.06 + 0.25}s forwards`,
            }}
          >
            {/* Color dot */}
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: getModuleColor(mod.module),
                flexShrink: 0,
                opacity: 0.8,
              }}
            />
            <span
              style={{
                fontSize: 14,
                color: 'var(--navy-dark, #0E3261)',
                opacity: 0.7,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {mod.module}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--navy-dark, #0E3261)',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {mod.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Trust Indicator Components
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
      <span
        style={{
          fontSize: 14,
          color: 'var(--navy-medium, #436FA3)',
          opacity: 0.8,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function TrustSeparator() {
  return (
    <span
      style={{
        color: 'var(--gray-light, #E1EAF2)',
        fontSize: 18,
        lineHeight: '24px',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      |
    </span>
  )
}
