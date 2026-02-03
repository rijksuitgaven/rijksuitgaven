import type {
  ModuleInfo,
  ModuleDataResponse,
  DetailResponse,
  ModuleQueryParams,
  ApiModuleResponse,
  ApiRecipientRow,
  RecipientRow,
  TotalsData,
} from '@/types/api'
import { API_BASE_URL } from './api-config'

// Module display names
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  instrumenten: 'Financiële Instrumenten',
  apparaat: 'Apparaatsuitgaven',
  inkoop: 'Inkoopuitgaven',
  provincie: 'Provinciale Subsidies',
  gemeente: 'Gemeentelijke Subsidies',
  publiek: 'Publiek',
  integraal: 'Integraal',
}

// Primary column names per module
const PRIMARY_COLUMN_NAMES: Record<string, string> = {
  instrumenten: 'Ontvanger',
  apparaat: 'Kostensoort',
  inkoop: 'Leverancier',
  provincie: 'Ontvanger',
  gemeente: 'Ontvanger',
  publiek: 'Ontvanger',
  integraal: 'Ontvanger',
}

/**
 * Transform API row format to internal format
 */
function transformRow(apiRow: ApiRecipientRow, years: number[]): RecipientRow {
  const yearData = apiRow.years ?? {}
  return {
    primary_value: apiRow.primary_value,
    years: years.map((year) => ({
      year,
      amount: yearData[String(year)] ?? 0,
    })),
    total: apiRow.totaal ?? 0,
    row_count: apiRow.row_count ?? 0,
    sources: apiRow.modules ?? null,
    extraColumns: apiRow.extra_columns ?? undefined,
    extraColumnCounts: apiRow.extra_column_counts ?? undefined,
    matchedField: apiRow.matched_field ?? undefined,
    matchedValue: apiRow.matched_value ?? undefined,
  }
}

/**
 * Fetch all available modules from the API
 * @returns Array of module metadata (id, display name, description)
 */
export async function fetchModules(): Promise<ModuleInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/modules`)
  if (!response.ok) {
    throw new Error(`Failed to fetch modules: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch data for a specific module with filters and pagination
 * @param module - Module ID (e.g., 'instrumenten', 'apparaat')
 * @param params - Query parameters including filters, sorting, and pagination
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Module data with rows, pagination info, and available years
 */
export async function fetchModuleData(
  module: string,
  params: ModuleQueryParams & { page?: number; per_page?: number } = {},
  signal?: AbortSignal
): Promise<ModuleDataResponse> {
  const searchParams = new URLSearchParams()

  // Convert page/per_page to limit/offset
  const page = params.page ?? 1
  const perPage = params.per_page ?? params.limit ?? 25
  const offset = (page - 1) * perPage

  searchParams.append('limit', String(perPage))
  searchParams.append('offset', String(offset))

  // Add other params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' &&
        !['page', 'per_page', 'limit', 'offset'].includes(key)) {
      // Map 'search' to 'q' (backend expects 'q' for search query)
      const paramKey = key === 'search' ? 'q' : key

      // Handle array values (for multi-select filters like provincie, gemeente)
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(paramKey, String(v)))
      } else {
        searchParams.append(paramKey, String(value))
      }
    }
  })

  const url = `${API_BASE_URL}/api/v1/modules/${module}?${searchParams.toString()}`
  const response = await fetch(url, signal ? { signal } : undefined)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${module} data: ${response.statusText}`)
  }

  const apiResponse: ApiModuleResponse = await response.json()

  // Transform to internal format
  const availableYears = apiResponse.meta.years.sort((a, b) => a - b)
  const totalRows = apiResponse.meta.total
  const totalPages = Math.ceil(totalRows / perPage)

  return {
    module: apiResponse.module,
    displayName: MODULE_DISPLAY_NAMES[module] || module,
    primaryColumn: PRIMARY_COLUMN_NAMES[module] || apiResponse.primary_field,
    rows: apiResponse.data.map((row) => transformRow(row, availableYears)),
    pagination: {
      page,
      perPage,
      totalRows,
      totalPages,
    },
    availableYears,
    totals: apiResponse.meta.totals as TotalsData | null | undefined,
  }
}

/**
 * Fetch detail rows for an expanded recipient
 * @param module - Module ID
 * @param primaryValue - Primary field value (e.g., recipient name)
 * @param groupingField - Optional field to group results by
 * @returns Detailed breakdown data for the recipient
 */
export async function fetchDetailData(
  module: string,
  primaryValue: string,
  groupingField?: string
): Promise<DetailResponse> {
  const encodedValue = encodeURIComponent(primaryValue)
  let url = `${API_BASE_URL}/api/v1/modules/${module}/${encodedValue}/details`

  if (groupingField) {
    url += `?grouping=${encodeURIComponent(groupingField)}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch details: ${response.statusText}`)
  }

  return response.json()
}
