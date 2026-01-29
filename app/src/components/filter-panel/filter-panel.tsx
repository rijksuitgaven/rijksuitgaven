'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, SlidersHorizontal, Check, ChevronDown, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS } from '@/lib/constants'

// =============================================================================
// Types
// =============================================================================

type FilterType = 'text' | 'multiselect' | 'select'

interface FilterConfig {
  value: string
  label: string
  type: FilterType
  options?: { value: string; label: string }[]
}

// Current module result (with amount)
interface CurrentModuleResult {
  name: string
  totaal: number
}

// Other modules result (with module badges)
interface OtherModulesResult {
  name: string
  modules: string[]
}

// =============================================================================
// Module filter configuration
// =============================================================================

const MODULE_FILTERS: Record<string, FilterConfig[]> = {
  instrumenten: [
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'text' },
    { value: 'artikel', label: 'Artikel', type: 'text' },
    { value: 'artikelonderdeel', label: 'Artikelonderdeel', type: 'text' },
    { value: 'instrument', label: 'Instrument', type: 'text' },
    { value: 'regeling', label: 'Regeling', type: 'text' },
  ],
  apparaat: [
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'text' },
    { value: 'artikel', label: 'Artikel', type: 'text' },
    { value: 'detail', label: 'Detail', type: 'text' },
  ],
  inkoop: [
    { value: 'ministerie', label: 'Ministerie', type: 'text' },
    { value: 'categorie', label: 'Categorie', type: 'text' },
    { value: 'staffel', label: 'Staffel', type: 'text' },
  ],
  provincie: [
    { value: 'provincie', label: 'Provincie', type: 'multiselect' },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente', type: 'multiselect' },
    { value: 'beleidsterrein', label: 'Beleidsterrein', type: 'text' },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie', type: 'multiselect' },
    { value: 'regeling', label: 'Regeling', type: 'text' },
  ],
  integraal: [
    { value: 'modules', label: 'Modules per ontvanger', type: 'multiselect' },
    {
      value: 'min_instanties',
      label: 'Instanties per ontvanger',
      type: 'select',
      options: [
        { value: '', label: 'Alle' },
        { value: '2', label: '2+' },
        { value: '3', label: '3+' },
        { value: '5', label: '5+' },
        { value: '10', label: '10+' },
      ]
    },
  ],
}

export interface FilterValues {
  search: string
  jaar: number | null
  minBedrag: number | null
  maxBedrag: number | null
  [key: string]: string | string[] | number | null
}

// =============================================================================
// Multi-select dropdown component
// =============================================================================

interface MultiSelectProps {
  module: string
  field: string
  label: string
  value: string[]
  onChange: (values: string[]) => void
}

function MultiSelect({ module, field, label, value, onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchOptions() {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/modules/${module}/filters/${field}`)
        if (response.ok) {
          const data = await response.json()
          setOptions(data)
        }
      } catch {
        // Silent failure
      } finally {
        setIsLoading(false)
      }
    }
    fetchOptions()
  }, [module, field])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const clearAll = () => {
    onChange([])
    setSearchQuery('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-colors',
          'border-[var(--border)] bg-white hover:border-[var(--navy-medium)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]',
          value.length > 0 && 'border-[var(--navy-medium)]'
        )}
      >
        <span className={cn(
          'truncate',
          value.length === 0 && 'text-[var(--muted-foreground)]'
        )}>
          {value.length === 0
            ? `Selecteer ${label.toLowerCase()}...`
            : value.length === 1
              ? value[0]
              : `${value.length} geselecteerd`
          }
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-[var(--muted-foreground)] transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--navy-medium)]"
              />
            </div>
          </div>

          {value.length > 0 && (
            <div className="px-3 py-2 bg-[var(--gray-light)] flex items-center justify-between text-xs">
              <span className="text-[var(--navy-dark)] font-medium">
                {value.length} geselecteerd
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[var(--error)] hover:underline"
              >
                Wis selectie
              </button>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-sm text-center text-[var(--muted-foreground)]">
                Laden...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-[var(--muted-foreground)]">
                Geen resultaten
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-[var(--gray-light)] transition-colors',
                    value.includes(option) && 'bg-[var(--blue-light)]/10'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 border rounded flex items-center justify-center flex-shrink-0',
                    value.includes(option)
                      ? 'bg-[var(--navy-dark)] border-[var(--navy-dark)]'
                      : 'border-[var(--border)]'
                  )}>
                    {value.includes(option) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="truncate">{option}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Filter Panel Component
// =============================================================================

interface FilterPanelProps {
  module: string
  availableYears: number[]
  filters: FilterValues
  onFilterChange: (filters: FilterValues) => void
  isLoading?: boolean
}

/**
 * Filter panel component with autocomplete search, year filter, amount range, and module-specific filters.
 * The search input includes global autocomplete with Ontvangers and Zoektermen.
 */
export function FilterPanel({
  module,
  availableYears,
  filters,
  onFilterChange,
  isLoading = false,
}: FilterPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [localFilters, setLocalFilters] = useState<FilterValues>(filters)
  const [isExpanded, setIsExpanded] = useState(false)

  // Autocomplete state
  const [currentModuleResults, setCurrentModuleResults] = useState<CurrentModuleResult[]>([])
  const [otherModulesResults, setOtherModulesResults] = useState<OtherModulesResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [noResultsQuery, setNoResultsQuery] = useState<string | null>(null)

  const moduleFilters = useMemo(() => MODULE_FILTERS[module] ?? [], [module])

  // Combined results for keyboard navigation
  const totalResults = currentModuleResults.length + otherModulesResults.length

  // =============================================================================
  // Autocomplete search - uses module-specific endpoint
  // =============================================================================

  async function fetchSearchResults(q: string): Promise<{
    currentModule: CurrentModuleResult[]
    otherModules: OtherModulesResult[]
  }> {
    try {
      // Call the module-specific autocomplete endpoint
      // Returns two sections: current module results and other modules results
      const response = await fetch(
        `${API_BASE_URL}/api/v1/modules/${module}/autocomplete?` +
        new URLSearchParams({ q }),
      )
      if (!response.ok) {
        return { currentModule: [], otherModules: [] }
      }
      const data = await response.json()

      return {
        currentModule: data.current_module || [],
        otherModules: data.other_modules || [],
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[FilterPanel] fetchSearchResults failed:', error.message)
      }
      return { currentModule: [], otherModules: [] }
    }
  }

  // Debounced autocomplete search
  useEffect(() => {
    const searchValue = localFilters.search
    if (searchValue.length < 2) {
      setCurrentModuleResults([])
      setOtherModulesResults([])
      setNoResultsQuery(null)
      setIsDropdownOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { currentModule, otherModules } = await fetchSearchResults(searchValue)

        setCurrentModuleResults(currentModule)
        setOtherModulesResults(otherModules)

        // Show "no results" if nothing found
        if (currentModule.length === 0 && otherModules.length === 0) {
          setNoResultsQuery(searchValue)
        } else {
          setNoResultsQuery(null)
        }
        // Always show dropdown when searching
        setIsDropdownOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('[FilterPanel] Search failed:', error.message)
        }
        setCurrentModuleResults([])
        setOtherModulesResults([])
        setNoResultsQuery(null)
      } finally {
        setIsSearching(false)
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [localFilters.search])

  // =============================================================================
  // Filter change handlers
  // =============================================================================

  // Debounced filter update (300ms delay to avoid excessive API calls)
  const FILTER_DEBOUNCE_MS = 300

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange(localFilters)
    }, FILTER_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [localFilters, onFilterChange])

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleSearchChange = useCallback((value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }))
  }, [])

  const handleYearChange = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      jaar: value ? parseInt(value, 10) : null,
    }))
  }, [])

  const handleAmountChange = useCallback((field: 'minBedrag' | 'maxBedrag', value: string) => {
    const numValue = value ? parseFloat(value) : null
    if (numValue !== null && numValue < 0) return

    setLocalFilters((prev) => {
      const updated = { ...prev, [field]: numValue }
      if (field === 'minBedrag' && numValue !== null && prev.maxBedrag !== null && numValue > prev.maxBedrag) {
        return prev
      }
      if (field === 'maxBedrag' && numValue !== null && prev.minBedrag !== null && numValue < prev.minBedrag) {
        return prev
      }
      return updated
    })
  }, [])

  const handleModuleFilterChange = useCallback((field: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      setLocalFilters((prev) => ({ ...prev, [field]: value.length > 0 ? value : null }))
    } else {
      setLocalFilters((prev) => ({ ...prev, [field]: value || null }))
    }
  }, [])

  const handleClearAll = useCallback(() => {
    const clearedFilters: FilterValues = {
      search: '',
      jaar: null,
      minBedrag: null,
      maxBedrag: null,
    }
    moduleFilters.forEach((f) => {
      clearedFilters[f.value] = null
    })
    setLocalFilters(clearedFilters)
    setIsDropdownOpen(false)
  }, [moduleFilters])

  // =============================================================================
  // Autocomplete selection handlers
  // =============================================================================

  const handleSelectCurrentModule = useCallback((result: CurrentModuleResult) => {
    // Set search to recipient name and close dropdown
    // Stays on current module, filters the table
    setLocalFilters((prev) => ({ ...prev, search: result.name }))
    setIsDropdownOpen(false)
  }, [])

  const handleSelectOtherModule = useCallback((name: string, targetModule: string) => {
    // Navigate to different module with search applied
    router.push(`/${targetModule}?q=${encodeURIComponent(name)}`)
  }, [router])

  const handleClearSearch = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, search: '' }))
    setCurrentModuleResults([])
    setOtherModulesResults([])
    setIsDropdownOpen(false)
    inputRef.current?.focus()
  }, [])

  // =============================================================================
  // Keyboard navigation
  // =============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          // Determine which section and item
          if (selectedIndex < currentModuleResults.length) {
            handleSelectCurrentModule(currentModuleResults[selectedIndex])
          } else {
            const otherIndex = selectedIndex - currentModuleResults.length
            if (otherModulesResults[otherIndex]) {
              const result = otherModulesResults[otherIndex]
              // Navigate to first module in the list
              if (result.modules.length > 0) {
                handleSelectOtherModule(result.name, result.modules[0])
              }
            }
          }
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isDropdownOpen, totalResults, selectedIndex, currentModuleResults, otherModulesResults, handleSelectCurrentModule, handleSelectOtherModule])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (event.key === '/' && !isInputFocused) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // =============================================================================
  // Active filter count
  // =============================================================================

  const activeFilterCount = [
    localFilters.jaar,
    localFilters.minBedrag,
    localFilters.maxBedrag,
    ...moduleFilters.map((f) => {
      const val = localFilters[f.value]
      if (Array.isArray(val)) return val.length > 0 ? val : null
      return val
    }),
  ].filter(Boolean).length

  const hasActiveFilters =
    localFilters.search ||
    localFilters.jaar ||
    localFilters.minBedrag ||
    localFilters.maxBedrag ||
    moduleFilters.some((f) => {
      const val = localFilters[f.value]
      if (Array.isArray(val)) return val.length > 0
      return Boolean(val)
    })

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-6">
      {/* Main search row */}
      <div className="flex flex-wrap gap-4">
        {/* Search input with autocomplete */}
        <div className="flex-1 min-w-[200px] relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => (currentModuleResults.length > 0 || otherModulesResults.length > 0) && setIsDropdownOpen(true)}
              placeholder="Zoek op ontvanger, regeling..."
              aria-label="Zoeken"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-results-listbox"
              autoComplete="off"
              className="w-full pl-10 pr-10 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)] focus:border-transparent transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] animate-spin" aria-label="Laden" />
            )}
            {!isSearching && localFilters.search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--navy-dark)]"
                aria-label="Zoekveld wissen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              id="search-results-listbox"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50 overflow-hidden"
            >
              <div className="max-h-96 overflow-y-auto">
                {/* No results */}
                {noResultsQuery && currentModuleResults.length === 0 && otherModulesResults.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-[var(--navy-dark)]">
                      Geen resultaten voor &ldquo;<strong>{noResultsQuery}</strong>&rdquo;
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Controleer de spelling of probeer een andere zoekterm
                    </p>
                  </div>
                )}

                {/* Current module section */}
                {currentModuleResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)]">
                      <User className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                      Ontvangers in {MODULE_LABELS[module] || module}
                    </div>
                    {currentModuleResults.map((result, index) => (
                      <button
                        key={result.name}
                        type="button"
                        onClick={() => handleSelectCurrentModule(result)}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                          selectedIndex === index && 'bg-[var(--gray-light)]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-medium text-[var(--navy-dark)] truncate">
                            {result.name}
                          </div>
                          <div className="text-sm font-medium text-[var(--navy-dark)] whitespace-nowrap">
                            {formatAmount(result.totaal)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Other modules section */}
                {otherModulesResults.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)]">
                      <User className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                      Ook in andere modules
                    </div>
                    {otherModulesResults.map((result, index) => {
                      const adjustedIndex = currentModuleResults.length + index
                      return (
                        <div
                          key={result.name}
                          className={cn(
                            'px-4 py-3 hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                            selectedIndex === adjustedIndex && 'bg-[var(--gray-light)]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-medium text-[var(--navy-dark)] truncate">
                              {result.name}
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {result.modules.slice(0, 4).map((mod) => (
                                <button
                                  key={mod}
                                  type="button"
                                  onClick={() => handleSelectOtherModule(result.name, mod)}
                                  className="text-xs px-1.5 py-0.5 bg-[var(--blue-light)]/20 text-[var(--navy-medium)] rounded hover:bg-[var(--blue-light)]/40 transition-colors"
                                >
                                  {MODULE_LABELS[mod] || mod}
                                </button>
                              ))}
                              {result.modules.length > 4 && (
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  +{result.modules.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-[var(--gray-light)] text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
                <span>Druk op Enter om te zoeken</span>
              </div>
            </div>
          )}
        </div>

        {/* Year filter */}
        <div className="w-32">
          <select
            value={localFilters.jaar ?? ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)] focus:border-transparent"
          >
            <option value="">Alle jaren</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors',
            isExpanded
              ? 'bg-[var(--navy-dark)] text-white border-[var(--navy-dark)]'
              : 'border-[var(--border)] hover:border-[var(--navy-medium)]'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm">
            Filters
            {activeFilterCount > 0 && (
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 text-xs font-medium rounded-full',
                isExpanded
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--pink)] text-white'
              )}>
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>

        {/* Clear all button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Wis filters
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Module-specific filters */}
          {moduleFilters.map((filter) => (
            <div key={filter.value} className="space-y-2">
              <label className="text-sm font-medium text-[var(--navy-dark)]">
                {filter.label}
              </label>
              {filter.type === 'multiselect' ? (
                <MultiSelect
                  module={module}
                  field={filter.value}
                  label={filter.label}
                  value={(localFilters[filter.value] as string[]) ?? []}
                  onChange={(values) => handleModuleFilterChange(filter.value, values)}
                />
              ) : filter.type === 'select' && filter.options ? (
                <select
                  value={(localFilters[filter.value] as string) ?? ''}
                  onChange={(e) => handleModuleFilterChange(filter.value, e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={(localFilters[filter.value] as string) ?? ''}
                  onChange={(e) => handleModuleFilterChange(filter.value, e.target.value)}
                  placeholder={`Filter op ${filter.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]"
                />
              )}
            </div>
          ))}

          {/* Amount range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--navy-dark)]">
              Bedrag bereik
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={localFilters.minBedrag ?? ''}
                onChange={(e) => handleAmountChange('minBedrag', e.target.value)}
                placeholder="Min"
                aria-label="Minimum bedrag"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]"
              />
              <span className="text-[var(--muted-foreground)]" aria-hidden="true">-</span>
              <input
                type="number"
                min="0"
                value={localFilters.maxBedrag ?? ''}
                onChange={(e) => handleAmountChange('maxBedrag', e.target.value)}
                placeholder="Max"
                aria-label="Maximum bedrag"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          Laden...
        </div>
      )}
    </div>
  )
}
