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
  extra_columns?: Record<string, string | null>  // Dynamic columns (max 2, when NOT searching)
  extra_column_counts?: Record<string, number>  // Distinct value counts per column (for "+X meer" indicator)
  matched_field?: string | null  // Which field matched the search (when searching)
  matched_value?: string | null  // The value that matched (when searching)
  data_available_from?: number | null  // First year with data for this entity
  data_available_to?: number | null  // Last year with data for this entity
}

// Internal row format - years as array (easier for iteration)
export interface RecipientRow {
  primary_value: string
  years: YearAmount[]
  total: number
  row_count: number
  sources: string[] | null  // Renamed from modules for clarity
  extraColumns?: Record<string, string | null>  // Dynamic columns (max 2, when NOT searching)
  extraColumnCounts?: Record<string, number>  // Distinct value counts per column (for "+X meer" indicator)
  matchedField?: string | null  // Which field matched the search (when searching)
  matchedValue?: string | null  // The value that matched (when searching)
  dataAvailableFrom?: number | null  // First year with data for this entity
  dataAvailableTo?: number | null  // Last year with data for this entity
}

export interface YearAmount {
  year: number
  amount: number
}

// Totals data structure (year sums + grand total)
export interface TotalsData {
  years: Record<number, number>  // { 2016: 0, 2017: 1000, ... }
  totaal: number
}

export interface ApiMeta {
  total: number
  limit: number
  offset: number
  query: string | null
  elapsed_ms: number
  years: number[]
  totals?: TotalsData | null  // Aggregated totals when searching/filtering
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
  totals?: TotalsData | null  // Aggregated totals when searching/filtering
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
  columns?: string[]  // Dynamic extra columns (max 2, UX-005)
  // Multi-select filters (arrays)
  provincie?: string[]  // For provincie module
  gemeente?: string[]   // For gemeente module
  [key: string]: string | string[] | number | undefined
}
