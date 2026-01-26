'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'

const TYPESENSE_HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'typesense-production-35ae.up.railway.app'
const TYPESENSE_API_KEY = process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || '0vh4mxafjeuvd676gw92kpjflg6fuv57'

interface SearchResult {
  name: string
  sources: string[]
  source_count: number
  totaal: number
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

export function SearchBar({ className, placeholder = 'Zoek op ontvanger, regeling...', onSearch }: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://${TYPESENSE_HOST}/collections/recipients/documents/search?` +
          new URLSearchParams({
            q: query,
            query_by: 'name,name_lower',
            prefix: 'true',
            per_page: '8',
            sort_by: 'totaal:desc',
          }),
          {
            headers: {
              'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        const hits = data.hits?.map((hit: any) => hit.document as SearchResult) || []
        setResults(hits)
        setIsOpen(hits.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 150)

    return () => clearTimeout(timeout)
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

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery(result.name)
    setIsOpen(false)
    // Navigate to integraal with search query
    router.push(`/integraal?q=${encodeURIComponent(result.name)}`)
  }, [router])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      } else {
        router.push(`/integraal?q=${encodeURIComponent(query.trim())}`)
      }
      onSearch?.(query.trim())
    }
  }, [query, selectedIndex, results, router, onSearch, handleSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
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
  }, [isOpen, results.length])

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  // Module name mapping
  const moduleNames: Record<string, string> = {
    instrumenten: 'Instrumenten',
    inkoop: 'Inkoop',
    publiek: 'Publiek',
    gemeente: 'Gemeente',
    provincie: 'Provincie',
  }

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 animate-spin" />
          )}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={result.name}
                type="button"
                onClick={() => handleSelect(result)}
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
                            {moduleNames[source] || source}
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
          <div className="px-4 py-2 bg-[var(--gray-light)] text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
            Druk op Enter om te zoeken in alle modules
          </div>
        </div>
      )}
    </div>
  )
}
