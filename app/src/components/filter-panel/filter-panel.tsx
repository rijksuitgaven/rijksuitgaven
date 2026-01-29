'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format'

// Filter configuration per module
const MODULE_FILTERS: Record<string, { value: string; label: string; type: 'select' | 'text' }[]> = {
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
    { value: 'provincie', label: 'Provincie', type: 'text' },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente', type: 'text' },
    { value: 'beleidsterrein', label: 'Beleidsterrein', type: 'text' },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie', type: 'text' },
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
  [key: string]: string | number | null
}

interface FilterPanelProps {
  module: string
  availableYears: number[]
  filters: FilterValues
  onFilterChange: (filters: FilterValues) => void
  isLoading?: boolean
}

export function FilterPanel({
  module,
  availableYears,
  filters,
  onFilterChange,
  isLoading = false,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters)
  const [isExpanded, setIsExpanded] = useState(false)

  const moduleFilters = MODULE_FILTERS[module] ?? []

  // Debounced filter update
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange(localFilters)
    }, 300)
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

  const handleModuleFilterChange = useCallback((field: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value || null }))
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
    ...moduleFilters.map((f) => localFilters[f.value]),
  ].filter(Boolean).length

  const hasActiveFilters =
    localFilters.search ||
    localFilters.jaar ||
    localFilters.minBedrag ||
    localFilters.maxBedrag ||
    moduleFilters.some((f) => localFilters[f.value])

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

          {/* Module-specific filters */}
          {moduleFilters.map((filter) => (
            <div key={filter.value} className="space-y-2">
              <label className="text-sm font-medium text-[var(--navy-dark)]">
                {filter.label}
              </label>
              <input
                type="text"
                value={(localFilters[filter.value] as string) ?? ''}
                onChange={(e) => handleModuleFilterChange(filter.value, e.target.value)}
                placeholder={`Filter op ${filter.label.toLowerCase()}...`}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-medium)]"
              />
            </div>
          ))}
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
