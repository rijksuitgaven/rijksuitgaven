'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, X, SlidersHorizontal, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/api-config'

// Filter configuration per module
type FilterType = 'text' | 'multiselect'

interface FilterConfig {
  value: string
  label: string
  type: FilterType
}

const MODULE_FILTERS: Record<string, FilterConfig[]> = {
  instrumenten: [
    { value: 'regeling', label: 'Regeling', type: 'text' },
    { value: 'artikel', label: 'Artikel', type: 'text' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'text' },
  ],
  apparaat: [
    { value: 'artikel', label: 'Artikel', type: 'text' },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', type: 'text' },
  ],
  inkoop: [
    { value: 'ministerie', label: 'Ministerie', type: 'text' },
    { value: 'categorie', label: 'Categorie', type: 'text' },
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
    // Integraal searches across all modules, no module-specific filters
  ],
}

export interface FilterValues {
  search: string
  jaar: number | null
  minBedrag: number | null
  maxBedrag: number | null
  [key: string]: string | string[] | number | null
}

// Multi-select dropdown component
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

  // Fetch options on mount
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

  // Close on click outside
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
          {/* Search input */}
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

          {/* Selected count and clear button */}
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

          {/* Options list */}
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

interface FilterPanelProps {
  module: string
  availableYears: number[]
  filters: FilterValues
  onFilterChange: (filters: FilterValues) => void
  isLoading?: boolean
}

/**
 * Filter panel component with search, year filter, amount range, and module-specific filters
 * Supports debounced input and multi-select dropdowns for certain fields
 */
export function FilterPanel({
  module,
  availableYears,
  filters,
  onFilterChange,
  isLoading = false,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters)
  const [isExpanded, setIsExpanded] = useState(false)

  const moduleFilters = useMemo(() => MODULE_FILTERS[module] ?? [], [module])

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

    // Validate: must be positive
    if (numValue !== null && numValue < 0) return

    setLocalFilters((prev) => {
      const updated = { ...prev, [field]: numValue }

      // Validate: min should not exceed max
      if (field === 'minBedrag' && numValue !== null && prev.maxBedrag !== null && numValue > prev.maxBedrag) {
        return prev // Don't update if min > max
      }
      if (field === 'maxBedrag' && numValue !== null && prev.minBedrag !== null && numValue < prev.minBedrag) {
        return prev // Don't update if max < min
      }

      return updated
    })
  }, [])

  const handleModuleFilterChange = useCallback((field: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      // Multi-select: store empty array as null for cleaner state
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
  }, [moduleFilters])

  // Count active filters (excluding search which is always visible)
  const activeFilterCount = [
    localFilters.jaar,
    localFilters.minBedrag,
    localFilters.maxBedrag,
    ...moduleFilters.map((f) => {
      const val = localFilters[f.value]
      // Arrays: count as active if has items
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

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-6">
      {/* Main search row */}
      <div className="flex flex-wrap gap-4">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Zoek op ontvanger, regeling..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)] focus:border-transparent transition-all"
            />
            {localFilters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--navy-dark)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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

        {/* Expand/collapse button with badge count */}
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
          {/* Module-specific filters (first) */}
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

          {/* Amount range (last) */}
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
