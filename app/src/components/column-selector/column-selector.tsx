'use client'

import { useState, useCallback } from 'react'
import { X, Check, Columns3, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Maximum number of columns that can be selected (UX-005)
export const MAX_SELECTED_COLUMNS = 2

// Available columns per module (UX-005)
// Note: Max 2 columns can be selected at a time (enforced by MAX_SELECTED_COLUMNS)
// Default: NO columns selected (for speed - uses fast materialized views)
// When user selects columns, query falls back to slower source table aggregation
export const MODULE_COLUMNS: Record<string, { value: string; label: string; default: boolean }[]> = {
  instrumenten: [
    { value: 'artikel', label: 'Artikel', default: true },
    { value: 'regeling', label: 'Regeling', default: true },
    { value: 'instrument', label: 'Instrument', default: false },
    { value: 'artikelonderdeel', label: 'Artikelonderdeel', default: false },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', default: false },
    { value: 'detail', label: 'Detail', default: false },
  ],
  apparaat: [
    { value: 'artikel', label: 'Artikel', default: true },
    { value: 'detail', label: 'Detail', default: true },
    { value: 'begrotingsnaam', label: 'Begrotingsnaam', default: false },
  ],
  inkoop: [
    { value: 'categorie', label: 'Categorie', default: true },
    { value: 'staffel', label: 'Staffel', default: true },
    { value: 'ministerie', label: 'Ministerie', default: false },
  ],
  provincie: [
    { value: 'provincie', label: 'Provincie', default: true },
    { value: 'omschrijving', label: 'Omschrijving', default: true },
  ],
  gemeente: [
    { value: 'gemeente', label: 'Gemeente', default: true },
    { value: 'omschrijving', label: 'Omschrijving', default: true },
    { value: 'beleidsterrein', label: 'Beleidsterrein', default: false },
    { value: 'regeling', label: 'Regeling', default: false },
  ],
  publiek: [
    { value: 'source', label: 'Organisatie', default: true },
    { value: 'regeling', label: 'Regeling (RVO/COA)', default: false },
    { value: 'trefwoorden', label: 'Trefwoorden (RVO)', default: false },
    { value: 'sectoren', label: 'Sectoren (RVO)', default: false },
    { value: 'regio', label: 'Regio (RVO)', default: false },
    { value: 'staffel', label: 'Staffel (COA)', default: false },
    { value: 'onderdeel', label: 'Onderdeel (NWO)', default: false },
  ],
  integraal: [
    // Integraal doesn't have extra columns - modules are shown inline
  ],
}

// Get stored preferences from localStorage (max 2 columns)
export function getStoredColumns(moduleId: string): string[] {
  if (typeof window === 'undefined') return getDefaultColumns(moduleId)

  try {
    const stored = localStorage.getItem(`columns-${moduleId}`)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      // Enforce max columns limit even for stored preferences
      return parsed.slice(0, MAX_SELECTED_COLUMNS)
    }
  } catch {
    // Ignore parse errors
  }
  return getDefaultColumns(moduleId)
}

// Get default columns for a module (max 2)
export function getDefaultColumns(moduleId: string): string[] {
  const columns = MODULE_COLUMNS[moduleId] || []
  return columns.filter(c => c.default).map(c => c.value).slice(0, MAX_SELECTED_COLUMNS)
}

// Store preferences in localStorage
function storeColumns(moduleId: string, columns: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`columns-${moduleId}`, JSON.stringify(columns))
  } catch {
    // Ignore storage errors
  }
}

interface ColumnSelectorProps {
  moduleId: string
  selectedColumns: string[]
  onColumnsChange: (columns: string[]) => void
}

export function ColumnSelector({ moduleId, selectedColumns, onColumnsChange }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const availableColumns = MODULE_COLUMNS[moduleId] || []
  const isAtMaxColumns = selectedColumns.length >= MAX_SELECTED_COLUMNS

  const handleToggle = useCallback((columnValue: string) => {
    const isCurrentlySelected = selectedColumns.includes(columnValue)

    // If trying to add and already at max, don't allow
    if (!isCurrentlySelected && selectedColumns.length >= MAX_SELECTED_COLUMNS) {
      return
    }

    const newColumns = isCurrentlySelected
      ? selectedColumns.filter(c => c !== columnValue)
      : [...selectedColumns, columnValue]

    onColumnsChange(newColumns)
    storeColumns(moduleId, newColumns)
  }, [selectedColumns, onColumnsChange, moduleId])

  const handleReset = useCallback(() => {
    const defaults = getDefaultColumns(moduleId)
    onColumnsChange(defaults)
    storeColumns(moduleId, defaults)
  }, [moduleId, onColumnsChange])

  if (availableColumns.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded transition-colors',
          isOpen
            ? 'bg-[var(--navy-dark)] text-white border-[var(--navy-dark)]'
            : 'border-[var(--border)] hover:border-[var(--navy-medium)] text-[var(--navy-dark)]'
        )}
      >
        <Columns3 className="h-3.5 w-3.5" />
        Kolommen
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-[var(--border)] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--navy-dark)]">Kolommen selecteren</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[var(--gray-light)] rounded"
              >
                <X className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto">
              {/* Max columns warning */}
              {isAtMaxColumns && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[#FFC857]/20 text-[var(--navy-dark)] rounded text-xs font-medium">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-[#B5891D]" />
                  <span>Max {MAX_SELECTED_COLUMNS} kolommen</span>
                </div>
              )}
              {availableColumns.map((column) => {
                const isSelected = selectedColumns.includes(column.value)
                const isDisabled = !isSelected && isAtMaxColumns
                return (
                  <button
                    key={column.value}
                    onClick={() => handleToggle(column.value)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded transition-colors text-left",
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[var(--gray-light)]'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      isSelected
                        ? 'bg-[var(--navy-dark)] border-[var(--navy-dark)]'
                        : 'border-[var(--border)]'
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-[var(--navy-dark)]">{column.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--gray-light)]">
              <button
                onClick={handleReset}
                className="text-xs text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
              >
                Herstel standaard
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
