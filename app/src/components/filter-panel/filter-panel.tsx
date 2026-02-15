'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, SlidersHorizontal, Check, ChevronDown, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'
import { API_BASE_URL } from '@/lib/api-config'
import { MODULE_LABELS, FIELD_LABELS } from '@/lib/constants'
import { fetchCascadingFilterOptions, type FilterOption } from '@/lib/api'
import { StaffelPopover } from '@/components/staffel-popover/staffel-popover'
import { useAnalytics } from '@/hooks/use-analytics'

// =============================================================================
// Types
// =============================================================================

interface ModuleStats {
  count: number
  total: number
  total_formatted: string
}

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
  match_type?: "exact" | "prefix"  // exact = word-boundary match, prefix = starts with
}

// Other modules result (with module badges)
interface OtherModulesResult {
  name: string
  modules: string[]
}

// Field match result (OOK GEVONDEN IN)
interface FieldMatchResult {
  value: string
  field: string
}

// Field labels imported from @/lib/constants

// =============================================================================
// Module filter configuration
// =============================================================================

// Search placeholder text per module
// Shows key searchable fields to communicate search power
// Format: "Zoek in [fields] (€X miljard)" or with count for integraal
const MODULE_SEARCH_TEXT: Record<string, { fields: string; showCount: boolean }> = {
  instrumenten: { fields: 'ontvangers, regelingen, artikelen en meer', showCount: false },
  apparaat: { fields: 'kostensoorten, begrotingen, artikelen en meer', showCount: false },
  inkoop: { fields: 'leveranciers, ministeries, categorieën', showCount: false },
  provincie: { fields: 'ontvangers en omschrijvingen', showCount: false },
  gemeente: { fields: 'ontvangers, regelingen, beleidsterreinen en meer', showCount: false },
  publiek: { fields: 'ontvangers, regelingen, trefwoorden en meer', showCount: false },
  integraal: { fields: 'ontvangers', showCount: true }, // Show count for cross-module discovery
}

const MODULE_FILTERS: Record<string, FilterConfig[]> = {
  instrumenten: [
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'multiselect' },
    { value: 'artikel', label: 'Artikel', type: 'multiselect' },
    { value: 'artikelonderdeel', label: 'Artikelonderdeel', type: 'multiselect' },
    { value: 'instrument', label: 'Instrument', type: 'multiselect' },
    { value: 'regeling', label: 'Regeling', type: 'multiselect' },
  ],
  apparaat: [
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'multiselect' },
    { value: 'artikel', label: 'Artikel', type: 'multiselect' },
    { value: 'detail', label: 'Detail', type: 'multiselect' },
    { value: 'kostensoort', label: 'Kostensoort', type: 'multiselect' },
  ],
  inkoop: [
    { value: 'ministerie', label: 'Ministerie', type: 'multiselect' },
    { value: 'categorie', label: 'Categorie', type: 'multiselect' },
    { value: 'staffel', label: 'Staffel', type: 'multiselect' },
  ],
  provincie: [
    { value: 'provincie', label: 'Provincie', type: 'multiselect' },
    { value: 'omschrijving', label: 'Omschrijving', type: 'multiselect' },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente', type: 'multiselect' },
    { value: 'beleidsterrein', label: 'Beleidsterrein', type: 'multiselect' },
    { value: 'regeling', label: 'Regeling', type: 'multiselect' },
    { value: 'omschrijving', label: 'Omschrijving', type: 'multiselect' },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie', type: 'multiselect' },
    { value: 'regeling', label: 'Regeling (RVO/COA)', type: 'multiselect' },
    { value: 'trefwoorden', label: 'Trefwoorden (RVO)', type: 'multiselect' },
    { value: 'sectoren', label: 'Sectoren (RVO)', type: 'multiselect' },
    { value: 'provincie', label: 'Provincie (RVO)', type: 'multiselect' },
    { value: 'onderdeel', label: 'Onderdeel (NWO)', type: 'multiselect' },
    { value: 'staffel', label: 'Staffel (COA)', type: 'multiselect' },
  ],
  integraal: [
    { value: 'modules', label: 'Modules per ontvanger', type: 'multiselect' },
    {
      value: 'betalingen',
      label: 'Betalingen per ontvanger',
      type: 'select',
      options: [
        { value: '', label: 'Alle' },
        { value: '1', label: '1' },
        { value: '2-10', label: '2-10' },
        { value: '11-50', label: '11-50' },
        { value: '50+', label: '50+' },
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
// Custom select dropdown (matches MultiSelect styling)
// =============================================================================

function CustomSelect({ value, onChange, options, label }: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedLabel = options.find(o => o.value === value)?.label ?? label

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-colors',
          'border-[var(--border)] bg-white hover:border-[var(--navy-medium)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]',
          value && 'border-[var(--navy-medium)]'
        )}
      >
        <span className={cn('truncate', !value && 'text-[var(--muted-foreground)]')}>
          {selectedLabel}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-[var(--muted-foreground)] transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left hover:bg-[var(--gray-light)] transition-colors flex items-center gap-2',
                value === opt.value && 'text-[var(--navy-dark)] font-medium'
              )}
            >
              {value === opt.value && <Check className="h-3.5 w-3.5 text-[var(--navy-dark)]" />}
              <span className={value !== opt.value ? 'ml-5.5' : ''}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Multi-select dropdown component
// =============================================================================

// Debounce timeout for autocomplete search (ms) — trailing debounce for rapid typing
// Leading edge fires immediately on first keystroke after idle
const AUTOCOMPLETE_DEBOUNCE_MS = 150

// Maximum number of filter options to load (prevents DoS/memory issues)
const MAX_FILTER_OPTIONS = 5000

interface MultiSelectProps {
  module: string
  field: string
  label: string
  value: string[]
  onChange: (values: string[]) => void
  /** When true, uses cascadingOptions instead of self-fetching */
  isCascading?: boolean
  /** Externally provided options with counts (null = loading) */
  cascadingOptions?: FilterOption[] | null
}

/** Format count with Dutch locale separator: 1234 → "1.234" */
function formatCount(count: number): string {
  return count.toLocaleString('nl-NL')
}

function MultiSelect({ module, field, label, value, onChange, isCascading = false, cascadingOptions }: MultiSelectProps) {
  const { track } = useAnalytics()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Build a count lookup map from cascading options
  const countMap = useMemo(() => {
    if (!isCascading || !cascadingOptions) return null
    const map = new Map<string, number>()
    for (const opt of cascadingOptions) {
      map.set(opt.value, opt.count)
    }
    return map
  }, [isCascading, cascadingOptions])

  // Fetch options when dropdown opens (not on mount) — only for non-cascading mode
  // Also resets state on module/field change (consolidated from separate effect)
  useEffect(() => {
    // Reset on module/field change
    setOptions([])
    setSearchQuery('')
    setError(null)
    setSelectedIndex(-1)

    if (isCascading) return // Skip self-fetch in cascading mode
    if (!isOpen) return

    const abortController = new AbortController()

    async function fetchOptions() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/modules/${module}/filters/${field}`,
          { signal: abortController.signal }
        )
        if (!response.ok) {
          setError('Filteropties niet beschikbaar')
          return
        }
        const data = await response.json()
        // Enforce client-side limit as defense-in-depth
        setOptions(data.slice(0, MAX_FILTER_OPTIONS))
      } catch (err) {
        // Ignore abort errors - expected when component unmounts or module changes
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError('Filteropties niet beschikbaar')
        track('error', module, { message: err instanceof Error ? err.message : 'Filter options load failed', trigger: 'filter_load', field })
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    fetchOptions()

    return () => abortController.abort()
  }, [isOpen, module, field, isCascading])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Determine effective options list based on mode
  const effectiveOptions = useMemo(() => {
    if (isCascading && cascadingOptions) {
      // In cascading mode: use cascading options values
      // Plus any selected values not in the response (count=0, invalid selection)
      const cascadingValues = cascadingOptions.map(o => o.value)
      const missingSelected = value.filter(v => !cascadingValues.includes(v))
      return [...cascadingValues, ...missingSelected]
    }
    return options
  }, [isCascading, cascadingOptions, options, value])

  const cascadingLoading = isCascading && cascadingOptions === null

  const filteredOptions = effectiveOptions.filter(opt =>
    opt && opt.trim() !== '' && opt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Split into selected and unselected for display
  const selectedOptions = filteredOptions.filter(opt => value.includes(opt))
  const unselectedOptions = filteredOptions.filter(opt => !value.includes(opt))

  // Combined list for keyboard navigation (selected first, then unselected)
  const allDisplayedOptions = [...selectedOptions, ...unselectedOptions]

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

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < allDisplayedOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allDisplayedOptions.length) {
          toggleOption(allDisplayedOptions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
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
          {/* Search input */}
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedIndex(-1) // Reset selection on search
                }}
                onKeyDown={handleKeyDown}
                placeholder="Zoek..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--navy-medium)]"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-activedescendant={selectedIndex >= 0 ? `multiselect-option-${selectedIndex}` : undefined}
              />
            </div>
          </div>

          {/* Selection summary bar */}
          {value.length > 0 && (
            <div className="px-3 py-2 bg-[var(--gray-light)] flex items-center justify-between text-xs border-b border-[var(--border)]">
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

          {/* Options list - increased height for better browsing */}
          <div className="max-h-72 overflow-y-auto" role="listbox">
            {(isLoading || cascadingLoading) ? (
              <div className="px-3 py-6 text-sm text-center text-[var(--muted-foreground)]" role="status" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" aria-hidden="true" />
                <span>Opties laden...</span>
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-sm text-center text-[var(--error)]">
                {error}
                <button
                  type="button"
                  onClick={() => {
                    setOptions([])
                    setError(null)
                  }}
                  className="block mx-auto mt-2 text-xs text-[var(--navy-medium)] hover:underline"
                >
                  Opnieuw
                </button>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-[var(--muted-foreground)]">
                {searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Geen opties beschikbaar'}
              </div>
            ) : (
              <>
                {/* Selected items section */}
                {selectedOptions.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)] border-b border-[var(--border)]">
                      Geselecteerd
                    </div>
                    {selectedOptions.map((option, index) => {
                      const count = countMap?.get(option)
                      const isZero = isCascading && count === undefined
                      return (
                        <button
                          key={option}
                          id={`multiselect-option-${index}`}
                          type="button"
                          onClick={() => toggleOption(option)}
                          role="option"
                          aria-selected={value.includes(option)}
                          className={cn(
                            "w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors bg-[var(--blue-light)]/10",
                            selectedIndex === index
                              ? 'bg-[var(--gray-light)]'
                              : 'hover:bg-[var(--gray-light)]'
                          )}
                        >
                          <div className="w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 bg-[var(--navy-dark)] border-[var(--navy-dark)]">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className={cn("truncate", isZero && "text-[var(--error)]")}>
                            {option}
                            {isCascading && (
                              <span className={cn("ml-1.5 text-xs", isZero ? "text-[var(--error)]" : "text-[var(--muted-foreground)]")}>
                                {isZero ? '(0 resultaten)' : `(${formatCount(count!)})`}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Unselected items section */}
                {unselectedOptions.length > 0 && (
                  <>
                    {selectedOptions.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)] border-b border-[var(--border)]">
                        Alle opties
                      </div>
                    )}
                    {unselectedOptions.map((option, index) => {
                      const globalIndex = selectedOptions.length + index
                      const count = countMap?.get(option)
                      return (
                        <button
                          key={option}
                          id={`multiselect-option-${globalIndex}`}
                          type="button"
                          onClick={() => toggleOption(option)}
                          role="option"
                          aria-selected={false}
                          className={cn(
                            "w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors",
                            selectedIndex === globalIndex
                              ? 'bg-[var(--gray-light)]'
                              : 'hover:bg-[var(--gray-light)]'
                          )}
                        >
                          <div className="w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 border-[var(--border)]" />
                          <span className="truncate">
                            {option}
                            {isCascading && count !== undefined && (
                              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                                ({formatCount(count)})
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer with count - shows wealth of options */}
          {!(isLoading || cascadingLoading) && effectiveOptions.length > 0 && (
            <div className="px-3 py-2 bg-[var(--gray-light)] text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
              {searchQuery
                ? `${filteredOptions.length} van ${effectiveOptions.length} opties`
                : `${effectiveOptions.length} opties`}
            </div>
          )}
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
  filters: FilterValues
  onFilterChange: (filters: FilterValues) => void
  isLoading?: boolean
  autoExpandTrigger?: number
}

/**
 * Filter panel component with autocomplete search, amount range, and module-specific filters.
 * The search input includes module-specific autocomplete with relevance ranking.
 */
export function FilterPanel({
  module,
  filters,
  onFilterChange,
  isLoading = false,
  autoExpandTrigger = 0,
}: FilterPanelProps) {
  const router = useRouter()
  const { track } = useAnalytics()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // Track if user has typed in search (vs pre-filled from URL)
  // Don't auto-open dropdown if search came from URL navigation
  const hasUserTypedRef = useRef(false)
  // Track the last search value typed by user (to detect external vs sync-back changes)
  const lastUserSearchRef = useRef('')

  const [localFilters, setLocalFilters] = useState<FilterValues>(filters)
  const [isExpanded, setIsExpanded] = useState(false)
  const [moduleStats, setModuleStats] = useState<ModuleStats | null>(null)

  // =============================================================================
  // Cascading filter state (UX-021) — instrumenten only
  // =============================================================================
  const isCascadingModule = module !== 'integraal'
  const [cascadingOptions, setCascadingOptions] = useState<Record<string, FilterOption[]> | null>(null)

  // Extract active module filter selections as Record<string, string[]>
  // Stabilized with JSON key to avoid unnecessary refetches on unrelated filter changes (e.g. search)
  const activeModuleFilters = useMemo(() => {
    if (!isCascadingModule) return {}
    const moduleFilterDefs = MODULE_FILTERS[module] ?? []
    const result: Record<string, string[]> = {}
    for (const f of moduleFilterDefs) {
      if (f.type !== 'multiselect') continue
      const val = localFilters[f.value]
      if (Array.isArray(val) && val.length > 0) {
        result[f.value] = val
      }
    }
    return result
  }, [isCascadingModule, module, localFilters])

  // Stable key for comparing filter objects (prevents re-fetch on search/amount changes)
  const activeModuleFiltersKey = useMemo(
    () => JSON.stringify(activeModuleFilters),
    [activeModuleFilters]
  )

  // Fetch cascading options on filter change (debounced)
  useEffect(() => {
    if (!isCascadingModule) return

    const abortController = new AbortController()
    const filtersToSend = activeModuleFilters

    const timeout = setTimeout(async () => {
      try {
        const options = await fetchCascadingFilterOptions(
          module,
          filtersToSend,
          abortController.signal
        )
        setCascadingOptions(options)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // On error, keep previous options (graceful degradation)
        console.error('Cascading filter fetch failed:', err)
      }
    }, 200)

    return () => {
      clearTimeout(timeout)
      abortController.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCascadingModule, module, activeModuleFiltersKey])

  // Staffel explanation popover (UX-013 — moved from footer icon to filter label)
  const isStaffelModule = module === 'inkoop' || module === 'publiek'
  const [isStaffelOpen, setIsStaffelOpen] = useState(false)
  const staffelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isStaffelOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (staffelRef.current && !staffelRef.current.contains(e.target as Node)) {
        setIsStaffelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isStaffelOpen])

  // Auto-expand filter panel when triggered by column click (UX-020)
  useEffect(() => {
    if (autoExpandTrigger > 0) {
      setIsExpanded(true)
    }
  }, [autoExpandTrigger])

  // Fetch module stats for dynamic placeholder
  useEffect(() => {
    const controller = new AbortController()
    async function fetchStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/modules/${module}/stats`, { signal: controller.signal })
        if (!response.ok) return
        const data = await response.json()
        setModuleStats({
          count: data.count,
          total: data.total,
          total_formatted: data.total_formatted,
        })
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('Failed to fetch stats:', e)
        }
      }
    }
    fetchStats()
    return () => controller.abort()
  }, [module])

  // Generate dynamic placeholder based on module stats
  // Communicates search power: what fields are searchable + financial scale
  const searchPlaceholder = useMemo(() => {
    if (!moduleStats) return 'Zoek op ontvanger, regeling...'

    const config = MODULE_SEARCH_TEXT[module] || { fields: 'ontvangers', showCount: false }
    const countFormatted = moduleStats.count.toLocaleString('nl-NL')

    if (module === 'integraal') {
      // Integraal: show count + "in alle modules" for cross-module discovery
      return `Zoek in ${countFormatted} ${config.fields} in alle modules (€${moduleStats.total_formatted})`
    }

    // Other modules: emphasize searchable fields + EUR scale
    return `Zoek in ${config.fields} (€${moduleStats.total_formatted})`
  }, [module, moduleStats])

  // Autocomplete state
  const [currentModuleResults, setCurrentModuleResults] = useState<CurrentModuleResult[]>([])
  const [fieldMatches, setFieldMatches] = useState<FieldMatchResult[]>([])
  const [otherModulesResults, setOtherModulesResults] = useState<OtherModulesResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [noResultsQuery, setNoResultsQuery] = useState<string | null>(null)

  const moduleFilters = useMemo(() => MODULE_FILTERS[module] ?? [], [module])

  // Combined results for keyboard navigation
  const totalResults = currentModuleResults.length + fieldMatches.length + otherModulesResults.length

  // =============================================================================
  // Autocomplete search - uses module-specific endpoint with AbortController
  // =============================================================================

  // Track when the last autocomplete request fired (for leading-edge debounce)
  const lastAutocompleteFireRef = useRef(0)

  // Debounced autocomplete search with leading-edge + trailing debounce
  // First keystroke after idle fires immediately (~0ms), subsequent keystrokes debounce (150ms)
  useEffect(() => {
    const searchValue = localFilters.search
    if (searchValue.length < 1) {
      setCurrentModuleResults([])
      setOtherModulesResults([])
      setFieldMatches([])
      setNoResultsQuery(null)
      setIsDropdownOpen(false)
      lastAutocompleteFireRef.current = 0
      return
    }

    // Show loading state immediately when user types (skeleton appears before API returns)
    if (hasUserTypedRef.current) {
      setIsSearching(true)
      setNoResultsQuery(null) // Clear previous no-results so skeleton shows
      setIsDropdownOpen(true)
    }

    const abortController = new AbortController()

    // Leading-edge: fire immediately if idle for >300ms, otherwise debounce
    const now = Date.now()
    const timeSinceLastFire = now - lastAutocompleteFireRef.current
    const delay = timeSinceLastFire > 300 ? 0 : AUTOCOMPLETE_DEBOUNCE_MS

    const doSearch = async () => {
      lastAutocompleteFireRef.current = Date.now()
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/modules/${module}/autocomplete?` +
          new URLSearchParams({ q: searchValue }),
          { signal: abortController.signal }
        )

        if (!response.ok) {
          setCurrentModuleResults([])
          setOtherModulesResults([])
          setNoResultsQuery(searchValue)
          return
        }

        const data = await response.json()
        const currentModule = data.current_module || []
        const fieldMatchesData = data.field_matches || []
        const otherModules = data.other_modules || []

        setCurrentModuleResults(currentModule)
        setFieldMatches(fieldMatchesData)
        setOtherModulesResults(otherModules)

        if (currentModule.length === 0 && fieldMatchesData.length === 0 && otherModules.length === 0) {
          setNoResultsQuery(searchValue)
        } else {
          setNoResultsQuery(null)
        }
        if (hasUserTypedRef.current) {
          setIsDropdownOpen(true)
        }
        setSelectedIndex(-1)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setCurrentModuleResults([])
        setFieldMatches([])
        setOtherModulesResults([])
        setNoResultsQuery(null)
        track('error', module, { message: error instanceof Error ? error.message : 'Autocomplete search failed', trigger: 'autocomplete' })
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false)
        }
      }
    }

    const timeout = setTimeout(doSearch, delay)

    return () => {
      clearTimeout(timeout)
      abortController.abort()
    }
  }, [localFilters.search, module])

  // =============================================================================
  // Filter change handlers
  // =============================================================================

  // Debounced filter update (150ms delay to avoid excessive API calls during typing)
  const FILTER_DEBOUNCE_MS = 150
  const onFilterChangeRef = useRef(onFilterChange)
  onFilterChangeRef.current = onFilterChange
  // Track whether next filter change should skip debounce (explicit user action)
  const skipDebounceRef = useRef(false)

  useEffect(() => {
    if (skipDebounceRef.current) {
      // Explicit action (Enter, click selection) — apply immediately
      skipDebounceRef.current = false
      onFilterChangeRef.current(localFilters)
      return
    }
    const timeout = setTimeout(() => {
      onFilterChangeRef.current(localFilters)
    }, FILTER_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [localFilters])

  // Sync with external filters (e.g., from URL navigation)
  useEffect(() => {
    // Only reset typing flag if this is an EXTERNAL filter change (URL navigation, "Ook in" click)
    // NOT when it's just a sync-back of what the user typed
    // Use ref comparison to avoid stale closure issues
    const isExternalChange = filters.search !== lastUserSearchRef.current

    setLocalFilters(filters)

    if (isExternalChange) {
      // External change - reset typing flag to prevent auto-opening dropdown
      hasUserTypedRef.current = false
      lastUserSearchRef.current = filters.search  // Sync the ref
    }
    // If search matches what user typed, keep hasUserTypedRef as-is (user is still typing)
  }, [filters])

  const handleSearchChange = useCallback((value: string) => {
    hasUserTypedRef.current = true  // User is actively typing
    lastUserSearchRef.current = value  // Track what user typed
    setLocalFilters((prev) => ({ ...prev, search: value }))
  }, [])

  const MAX_AMOUNT = 999_999_999_999 // ~1 trillion euros max

  const handleAmountChange = useCallback((field: 'minBedrag' | 'maxBedrag', value: string) => {
    // Empty value clears the filter
    if (!value) {
      setLocalFilters((prev) => ({ ...prev, [field]: null }))
      return
    }

    const numValue = parseFloat(value)

    // Validate: must be a valid number
    if (Number.isNaN(numValue)) {
      return
    }

    // Validate: must be non-negative
    if (numValue < 0) {
      return
    }

    // Validate: must be within reasonable bounds
    if (numValue > MAX_AMOUNT) {
      return
    }

    setLocalFilters((prev) => {
      // Validate min/max relationship
      if (field === 'minBedrag' && prev.maxBedrag !== null && numValue > prev.maxBedrag) {
        return prev
      }
      if (field === 'maxBedrag' && prev.minBedrag !== null && numValue < prev.minBedrag) {
        return prev
      }
      return { ...prev, [field]: numValue }
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
    track('autocomplete_click', module, { result_type: 'recipient', selected_value: result.name, target_module: module })
    hasUserTypedRef.current = false // Prevent autocomplete effect from reopening dropdown
    skipDebounceRef.current = true // Explicit action — apply filter immediately
    setLocalFilters((prev) => ({ ...prev, search: result.name }))
    setIsDropdownOpen(false)
    inputRef.current?.blur()
  }, [track, module])

  const handleSelectOtherModule = useCallback((name: string, targetModule: string) => {
    // Navigate to different module with search applied
    track('autocomplete_click', module, { result_type: 'recipient', selected_value: name, target_module: targetModule })
    router.push(`/${targetModule}?q=${encodeURIComponent(name)}`)
  }, [router, track, module])

  const handleClearSearch = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, search: '' }))
    setCurrentModuleResults([])
    setFieldMatches([])
    setOtherModulesResults([])
    setIsDropdownOpen(false)
    inputRef.current?.focus()
  }, [])

  const handleSelectFieldMatch = useCallback((result: FieldMatchResult) => {
    // Apply as a filter instead of a text search
    // This shows all recipients with this regeling/artikel/etc.
    track('autocomplete_click', module, { result_type: 'field_match', selected_value: result.value, field: result.field })
    skipDebounceRef.current = true // Explicit action — apply filter immediately
    setLocalFilters((prev) => ({
      ...prev,
      search: '', // Clear search text
      [result.field]: [result.value], // Apply as filter (e.g., regeling: ["value"])
    }))
    setCurrentModuleResults([])
    setFieldMatches([])
    setOtherModulesResults([])
    setIsDropdownOpen(false)
  }, [track, module])

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
          } else if (selectedIndex < currentModuleResults.length + fieldMatches.length) {
            const fieldIndex = selectedIndex - currentModuleResults.length
            handleSelectFieldMatch(fieldMatches[fieldIndex])
          } else {
            const otherIndex = selectedIndex - currentModuleResults.length - fieldMatches.length
            if (otherModulesResults[otherIndex]) {
              const result = otherModulesResults[otherIndex]
              // Navigate to first module in the list
              if (result.modules.length > 0) {
                handleSelectOtherModule(result.name, result.modules[0])
              }
            }
          }
        } else {
          // No item selected - just close dropdown and apply search immediately
          skipDebounceRef.current = true
          setIsDropdownOpen(false)
          inputRef.current?.blur()
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isDropdownOpen, totalResults, selectedIndex, currentModuleResults, fieldMatches, otherModulesResults, handleSelectCurrentModule, handleSelectFieldMatch, handleSelectOtherModule])

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
    <div className="mb-6">
      {/* Hero Search Row */}
      <div className="flex items-stretch gap-3">
        {/* Search input with autocomplete */}
        <div className="flex-1 min-w-[200px] relative">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--navy-dark)] transition-colors group-focus-within:text-[var(--navy-dark)]" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => hasUserTypedRef.current && (currentModuleResults.length > 0 || otherModulesResults.length > 0) && setIsDropdownOpen(true)}
              placeholder={searchPlaceholder}
              aria-label="Zoeken"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-results-listbox"
              aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
              autoComplete="off"
              className="w-full h-[52px] pl-12 pr-12 text-base bg-white rounded-lg shadow-md border border-[var(--border)] focus:outline-none focus:border-[var(--navy-dark)] focus:ring-2 focus:ring-[var(--navy-dark)]/20 focus:shadow-lg transition-all placeholder:text-[var(--navy-dark)]/60"
            />
            {isSearching && (
              <span role="status" aria-live="polite" className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-[var(--navy-medium)] animate-spin" aria-hidden="true" />
                <span className="sr-only">Zoeken...</span>
              </span>
            )}
            {!isSearching && localFilters.search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                aria-label="Zoekveld wissen"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {/* Accessible result count announcement */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {!isSearching && isDropdownOpen && totalResults > 0 && (
              `${totalResults} ${totalResults === 1 ? 'resultaat' : 'resultaten'} gevonden`
            )}
            {!isSearching && isDropdownOpen && totalResults === 0 && noResultsQuery && (
              'Geen resultaten gevonden'
            )}
          </div>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              id="search-results-listbox"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50 overflow-hidden"
            >
              <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
                {/* Loading skeleton — shown while waiting for first results */}
                {isSearching && currentModuleResults.length === 0 && otherModulesResults.length === 0 && fieldMatches.length === 0 && !noResultsQuery && (
                  <div className="animate-pulse">
                    <div className="px-4 py-2 bg-[var(--gray-light)]">
                      <div className="h-3 w-40 bg-[var(--border)] rounded" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="px-4 py-3 border-b border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-[var(--border)] rounded" style={{ width: `${140 + i * 20}px` }} />
                          <div className="h-4 w-20 bg-[var(--border)] rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
                        id={`search-option-${index}`}
                        type="button"
                        onClick={() => handleSelectCurrentModule(result)}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                          selectedIndex === index && 'bg-[var(--gray-light)]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-medium truncate text-[var(--navy-dark)] hover:text-[var(--blue-primary)] hover:underline transition-colors">
                            {result.name}
                          </div>
                          <div className="text-sm font-medium whitespace-nowrap text-[var(--navy-dark)]">
                            {formatAmount(result.totaal)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Field matches section (OOK GEVONDEN IN) */}
                {fieldMatches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--navy-medium)] uppercase tracking-wider bg-[var(--gray-light)]">
                      Ook gevonden in
                    </div>
                    {fieldMatches.map((result, index) => {
                      const adjustedIndex = currentModuleResults.length + index
                      return (
                        <button
                          key={`${result.field}-${result.value}`}
                          id={`search-option-${adjustedIndex}`}
                          type="button"
                          onClick={() => handleSelectFieldMatch(result)}
                          className={cn(
                            'w-full px-4 py-3 text-left hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                            selectedIndex === adjustedIndex && 'bg-[var(--gray-light)]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-medium text-[var(--navy-dark)] truncate hover:text-[var(--blue-primary)] hover:underline transition-colors">
                              {result.value}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-[var(--blue-light)]/20 text-[var(--navy-medium)] rounded whitespace-nowrap">
                              {FIELD_LABELS[result.field] || result.field}
                            </span>
                          </div>
                        </button>
                      )
                    })}
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
                      const adjustedIndex = currentModuleResults.length + fieldMatches.length + index
                      return (
                        <div
                          key={result.name}
                          id={`search-option-${adjustedIndex}`}
                          className={cn(
                            'px-4 py-3 hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]',
                            selectedIndex === adjustedIndex && 'bg-[var(--gray-light)]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => handleSelectOtherModule(result.name, result.modules[0])}
                              className="font-medium text-[var(--navy-dark)] truncate hover:text-[var(--blue-primary)] hover:underline transition-colors text-left"
                            >
                              {result.name}
                            </button>
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

        {/* Filters button - matches search height */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-2 px-5 h-[52px] rounded-lg font-medium transition-all',
            isExpanded
              ? 'bg-[var(--navy-dark)] text-white shadow-md'
              : 'bg-white text-[var(--navy-dark)] shadow-sm hover:shadow-md'
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span>
            Filters
            {activeFilterCount > 0 && (
              <span className={cn(
                'ml-2 px-2 py-0.5 text-xs font-semibold rounded-full',
                isExpanded
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--pink)] text-white'
              )}>
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>

        {/* Clear filters - next to Filters button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 h-[52px] text-sm text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Wissen</span>
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Module-specific filters */}
          {moduleFilters.map((filter) => (
            <div key={filter.value} className="space-y-2">
              {isStaffelModule && filter.value === 'staffel' ? (
                <div className="relative" ref={staffelRef}>
                  <button
                    type="button"
                    onClick={() => setIsStaffelOpen(!isStaffelOpen)}
                    className="text-sm font-medium text-[var(--navy-dark)] underline decoration-dotted underline-offset-2 hover:text-[var(--pink)] transition-colors cursor-pointer"
                  >
                    {filter.label}
                  </button>
                  {isStaffelOpen && <StaffelPopover position="below" />}
                </div>
              ) : (
                <label className="text-sm font-medium text-[var(--navy-dark)]">
                  {filter.label}
                </label>
              )}
              {filter.type === 'multiselect' ? (
                <MultiSelect
                  module={module}
                  field={filter.value}
                  label={filter.label}
                  value={(localFilters[filter.value] as string[]) ?? []}
                  onChange={(values) => handleModuleFilterChange(filter.value, values)}
                  isCascading={isCascadingModule}
                  cascadingOptions={isCascadingModule ? (cascadingOptions?.[filter.value] ?? null) : undefined}
                />
              ) : filter.type === 'select' && filter.options ? (
                <CustomSelect
                  value={(localFilters[filter.value] as string) ?? ''}
                  onChange={(val) => handleModuleFilterChange(filter.value, val)}
                  options={filter.options}
                  label={filter.label}
                />
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
