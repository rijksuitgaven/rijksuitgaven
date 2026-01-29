// API response types matching the FastAPI backend

export interface ModuleInfo {
  name: string
  display_name: string
  primary_column: string
  available_years: number[]
  groupable_fields: string[]
}

// API response row format - years as object
export interface ApiRecipientRow {
  primary_value: string
  years: Record<string, number>  // { "2016": 0, "2017": 1000, ... }
  totaal: number
  row_count: number
  modules: string[] | null  // For cross-module indicator
}

// Internal row format - years as array (easier for iteration)
export interface RecipientRow {
  primary_value: string
  years: YearAmount[]
  total: number
  row_count: number
  sources: string[] | null  // Renamed from modules for clarity
}

export interface YearAmount {
  year: number
  amount: number
}

export interface ApiMeta {
  total: number
  limit: number
  offset: number
  query: string | null
  elapsed_ms: number
  years: number[]
}

export interface ApiModuleResponse {
  success: boolean
  module: string
  primary_field: string
  data: ApiRecipientRow[]
  meta: ApiMeta
}

// Transformed response for component use
export interface ModuleDataResponse {
  module: string
  displayName: string
  primaryColumn: string
  rows: RecipientRow[]
  pagination: {
    page: number
    perPage: number
    totalRows: number
    totalPages: number
  }
  availableYears: number[]
}

export interface DetailRow {
  [key: string]: string | number
}

export interface DetailResponse {
  module: string
  primary_value: string
  grouping_field: string
  rows: DetailRow[]
  available_groupings: string[]
}

// API parameters
export interface ModuleQueryParams {
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string  // Maps to 'q' in backend API
  jaar?: number
  min_bedrag?: number
  max_bedrag?: number
  min_years?: number  // Filter recipients with data in X+ years (UX-002)
  [key: string]: string | number | undefined
}
