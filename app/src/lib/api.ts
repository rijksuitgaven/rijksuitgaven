import type {
  ModuleInfo,
  ModuleDataResponse,
  DetailResponse,
  ModuleQueryParams,
  ApiModuleResponse,
  ApiRecipientRow,
  RecipientRow,
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
  return {
    primary_value: apiRow.primary_value,
    years: years.map((year) => ({
      year,
      amount: apiRow.years[String(year)] || 0,
    })),
    total: apiRow.totaal,
    row_count: apiRow.row_count,
    sources: apiRow.modules,
  }
}

/**
 * Fetch all available modules
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
 */
export async function fetchModuleData(
  module: string,
  params: ModuleQueryParams & { page?: number; per_page?: number } = {}
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
      searchParams.append(paramKey, String(value))
    }
  })

  const url = `${API_BASE_URL}/api/v1/modules/${module}?${searchParams.toString()}`
  const response = await fetch(url)

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
  }
}

/**
 * Fetch detail rows for an expanded recipient
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
