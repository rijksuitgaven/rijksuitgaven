/**
 * Format a number as Dutch currency (with thousand separators)
 * No currency symbol - just the number with periods as thousand separators
 */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '-'
  }

  // Use Dutch locale formatting (period as thousand separator)
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate year-over-year percentage change
 * Returns null if previous year is 0, missing, or if result would be invalid
 */
export function calculateYoYChange(
  currentAmount: number,
  previousAmount: number | null | undefined
): number | null {
  // Validate inputs - must be finite numbers
  if (!Number.isFinite(currentAmount)) {
    return null
  }
  if (!previousAmount || previousAmount === 0 || !Number.isFinite(previousAmount)) {
    return null
  }

  const result = ((currentAmount - previousAmount) / Math.abs(previousAmount)) * 100

  // Validate result is a finite number
  if (!Number.isFinite(result)) {
    return null
  }

  return result
}

/**
 * Check if a YoY change is an anomaly (10%+ change)
 */
export function isAnomaly(percentChange: number | null): boolean {
  if (percentChange === null) return false
  return Math.abs(percentChange) >= 10
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Get font size class based on amount string length
 * Large numbers (>10 chars) get smaller font
 */
export function getAmountFontClass(formattedAmount: string): string {
  return formattedAmount.length > 10 ? 'text-xs' : 'text-sm'
}
