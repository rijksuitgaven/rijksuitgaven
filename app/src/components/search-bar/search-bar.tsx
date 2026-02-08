'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS } from '@/lib/constants'

interface RecipientResult {
  type: 'recipient'
  name: string
  sources: string[]
  source_count: number
  totaal: number
}

interface KeywordResult {
  type: 'keyword'
  keyword: string
  field: string
  fieldLabel: string
  module: string
  moduleLabel: string
}

type SearchResultItem = RecipientResult | KeywordResult

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

// Fetch search results from backend proxy (Typesense API key stays server-side)
async function fetchSearchResults(q: string, signal?: AbortSignal): Promise<{ recipients: RecipientResult[], keywords: KeywordResult[] }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/search/autocomplete?` +
      new URLSearchParams({ q }),
      { signal }
    )

    if (!response.ok) {
      return { recipients: [], keywords: [] }
    }

    const data = await response.json()
    return {
      recipients: (data.recipients || []).map((r: RecipientResult) => ({
        ...r,
        type: 'recipient' as const,
      })),
      keywords: (data.keywords || []).map((k: KeywordResult) => ({
        ...k,
        type: 'keyword' as const,
      })),
    }
  } catch {
    // Silently handle errors - return empty results
    return { recipients: [], keywords: [] }
  }
}

// Fetch fuzzy suggestions when exact search returns no results (typo tolerance)
async function fetchFuzzySuggestions(q: string, signal?: AbortSignal): Promise<RecipientResult[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/search/autocomplete?` +
      new URLSearchParams({ q, fuzzy: 'true' }),
      { signal }
    )

    if (!response.ok) return []

    const data = await response.json()
    return (data.recipients || []).map((r: RecipientResult) => ({
      ...r,
      type: 'recipient' as const,
    }))
  } catch {
    // Silently handle errors - return empty suggestions
    return []
  }
}

export function SearchBar({ className, placeholder = 'Zoek op ontvanger, regeling...', onSearch }: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [keywords, setKeywords] = useState<KeywordResult[]>([])
  const [recipients, setRecipients] = useState<RecipientResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [noResultsQuery, setNoResultsQuery] = useState<string | null>(null)

  // Combined results for keyboard navigation (recipients first, then keywords)
  const allResults = useMemo<SearchResultItem[]>(
    () => [...recipients, ...keywords],
    [recipients, keywords]
  )
  const totalResults = allResults.length

  // Debounced search with AbortController to prevent race conditions
  useEffect(() => {
    if (query.length < 2) {
      setKeywords([])
      setRecipients([])
      setNoResultsQuery(null)
      setIsOpen(false)
      return
    }

    const abortController = new AbortController()

    const timeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Fetch search results from backend proxy
        const { recipients: recipientsData, keywords: keywordsData } = await fetchSearchResults(query, abortController.signal)

        // Don't update state if aborted (new search started)
        if (abortController.signal.aborted) return

        setRecipients(recipientsData)
        setKeywords(keywordsData)

        // Track if no results found (for "did you mean" suggestions)
        if (recipientsData.length === 0 && keywordsData.length === 0 && query.length >= 3) {
          setNoResultsQuery(query)
          // Try fuzzy search for suggestions
          const fuzzySuggestions = await fetchFuzzySuggestions(query, abortController.signal)
          if (abortController.signal.aborted) return
          if (fuzzySuggestions.length > 0) {
            setRecipients(fuzzySuggestions)
            setIsOpen(true)
          } else {
            setIsOpen(true) // Show "no results" state
          }
        } else {
          setNoResultsQuery(null)
          setIsOpen(recipientsData.length > 0 || keywordsData.length > 0)
        }
        setSelectedIndex(-1)
      } catch (error) {
        // AbortError is expected when search changes rapidly
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        // Log error for debugging, but show "no results" to user (graceful degradation)
        if (!abortController.signal.aborted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Search error:', error)
          }
          setRecipients([])
          setKeywords([])
          setNoResultsQuery(null)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 150)

    return () => {
      clearTimeout(timeout)
      abortController.abort()
    }
  }, [query])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut: "/" to focus search (SR-004)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Only trigger if not already in an input/textarea
      const target = event.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (event.key === '/' && !isInputFocused) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelectRecipient = useCallback((result: RecipientResult) => {
    setQuery(result.name)
    setIsOpen(false)
    router.push(`/integraal?q=${encodeURIComponent(result.name)}`)
  }, [router])

  const handleSelectKeyword = useCallback((result: KeywordResult) => {
    setQuery(result.keyword)
    setIsOpen(false)
    // Navigate to the specific module with the keyword search
    router.push(`/${result.module}?q=${encodeURIComponent(result.keyword)}`)
  }, [router])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        const selected = allResults[selectedIndex]
        if (selected.type === 'recipient') {
          handleSelectRecipient(selected)
        } else {
          handleSelectKeyword(selected)
        }
      } else {
        router.push(`/integraal?q=${encodeURIComponent(query.trim())}`)
      }
      onSearch?.(query.trim())
    }
  }, [query, selectedIndex, allResults, router, onSearch, handleSelectRecipient, handleSelectKeyword])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, totalResults])

  const handleClear = useCallback(() => {
    setQuery('')
    setKeywords([])
    setRecipients([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => (keywords.length > 0 || recipients.length > 0) && setIsOpen(true)}
            placeholder={placeholder}
            aria-label="Zoeken"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-results-listbox"
            aria-activedescendant={selectedIndex >= 0 ? `searchbar-option-${selectedIndex}` : undefined}
            autoComplete="off"
            className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
          />
          {isLoading && (
            <span role="status" aria-live="polite" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-white/60 animate-spin" aria-hidden="true" />
              <span className="sr-only">Laden...</span>
            </span>
          )}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              aria-label="Zoekveld wissen"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="search-results-listbox"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50 overflow-hidden"
        >
          <div className="max-h-96 overflow-y-auto">
            {/* "Did you mean" suggestion when no exact results */}
            {noResultsQuery && recipients.length > 0 && (
              <div className="px-4 py-2 bg-[var(--warning)]/10 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--navy-dark)]">
                  Geen exacte resultaten voor &ldquo;<strong>{noResultsQuery}</strong>&rdquo;. Bedoelde u:
                </span>
              </div>
            )}

            {/* No results at all */}
            {noResultsQuery && recipients.length === 0 && keywords.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[var(--navy-dark)]">
                  Geen resultaten voor &ldquo;<strong>{noResultsQuery}</strong>&rdquo;
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Controleer de spelling of probeer een andere zoekterm
                </p>
              </div>
            )}

            {/* Recipients section (shown first) */}
            {recipients.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)]">
                  <User className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                  Ontvangers
                </div>
                {recipients.map((result, index) => (
                  <button
                    key={result.name}
                    id={`searchbar-option-${index}`}
                    type="button"
                    onClick={() => handleSelectRecipient(result)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)] last:border-b-0',
                      selectedIndex === index && 'bg-[var(--gray-light)]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--navy-dark)] truncate">
                          {result.name}
                        </div>
                        {result.sources && result.sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.sources.slice(0, 4).map((source) => (
                              <span
                                key={source}
                                className="text-xs px-1.5 py-0.5 bg-[var(--blue-light)]/20 text-[var(--navy-medium)] rounded"
                              >
                                {MODULE_LABELS[source] || source}
                              </span>
                            ))}
                            {result.sources.length > 4 && (
                              <span className="text-xs text-[var(--muted-foreground)]">
                                +{result.sources.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[var(--navy-dark)]">
                          {formatAmount(result.totaal)}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          totaal
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Keywords section */}
            {keywords.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)]">
                  <FileText className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                  Zoektermen
                </div>
                {keywords.map((result, index) => {
                  const adjustedIndex = recipients.length + index
                  return (
                    <button
                      key={`${result.keyword}-${result.field}`}
                      id={`searchbar-option-${adjustedIndex}`}
                      type="button"
                      onClick={() => handleSelectKeyword(result)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                        selectedIndex === adjustedIndex && 'bg-[var(--gray-light)]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-[var(--navy-dark)] truncate">
                          {result.keyword}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span className="px-1.5 py-0.5 bg-[var(--blue-light)]/20 text-[var(--navy-medium)] rounded">
                            {result.moduleLabel}
                          </span>
                          <span>in {result.fieldLabel}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-[var(--gray-light)] text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] flex items-center justify-between">
            <span>Druk op Enter om te zoeken in alle modules</span>
            <span className="text-[var(--navy-medium)]">Tip: druk <kbd className="px-1.5 py-0.5 bg-white rounded border border-[var(--border)] font-mono text-[10px]">/</kbd> om te zoeken</span>
          </div>
        </div>
      )}
    </div>
  )
}
