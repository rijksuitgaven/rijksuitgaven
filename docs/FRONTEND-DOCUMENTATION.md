# Frontend Documentation

**Last Updated:** 2026-02-03
**Stack:** Next.js 16.1.4 + TypeScript + Tailwind CSS + TanStack Table

---

## Project Structure

```
app/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, header, cookie banner)
│   ├── globals.css               # Global styles (brand colors, animations)
│   ├── page.tsx                  # Home page (hero + module cards)
│   ├── privacybeleid/page.tsx    # Privacy policy page
│   ├── instrumenten/page.tsx     # Module page
│   ├── apparaat/page.tsx         # Module page
│   ├── inkoop/page.tsx           # Module page
│   ├── provincie/page.tsx        # Module page
│   ├── gemeente/page.tsx         # Module page
│   ├── publiek/page.tsx          # Module page
│   └── integraal/page.tsx        # Cross-module search page
├── components/
│   ├── column-selector/          # Column customization (UX-005)
│   │   ├── column-selector.tsx
│   │   └── index.ts
│   ├── cookie-banner/            # GDPR cookie disclosure
│   │   ├── cookie-banner.tsx
│   │   └── index.ts
│   ├── error-boundary/           # React error boundary wrapper
│   │   ├── error-boundary.tsx
│   │   └── index.ts
│   ├── cross-module-results/     # "Ook in:" cross-module counts
│   │   ├── cross-module-results.tsx
│   │   └── index.ts
│   ├── data-table/               # Main data table component
│   │   ├── data-table.tsx        # TanStack Table + CSV export
│   │   ├── expanded-row.tsx      # Expandable row with grouping
│   │   └── index.ts
│   ├── detail-panel/             # Recipient detail side panel
│   │   ├── detail-panel.tsx
│   │   └── index.ts
│   ├── filter-panel/             # Search and filter UI
│   │   ├── filter-panel.tsx
│   │   └── index.ts
│   ├── header/                   # Global navigation header
│   │   ├── header.tsx
│   │   └── index.ts
│   ├── module-page/              # Reusable module page template
│   │   ├── module-page.tsx
│   │   └── index.ts
│   └── search-bar/               # Typesense autocomplete search
│       ├── search-bar.tsx
│       └── index.ts
├── lib/
│   ├── api.ts                    # API client for backend
│   ├── format.ts                 # Number formatting utilities
│   └── utils.ts                  # CN utility for Tailwind
└── types/
    └── api.ts                    # TypeScript interfaces
```

---

## Fonts (Brand Identity)

| Font | Variable | Usage |
|------|----------|-------|
| Brawler | `--font-heading` | Headings, page titles |
| IBM Plex Sans Condensed | `--font-body` | Body text, UI elements |

Both fonts are self-hosted via `next/font/google` - no external requests to Google.

**Usage in CSS:**
```css
.heading {
  font-family: var(--font-heading), serif;
}
.body {
  font-family: var(--font-body), sans-serif;
}
```

---

## Brand Colors (CSS Variables)

Defined in `globals.css`:

| Variable | Hex | Usage |
|----------|-----|-------|
| `--navy-dark` | #0E3261 | Headers, primary text |
| `--navy-medium` | #436FA3 | Links, secondary elements |
| `--blue-light` | #8DBADC | Hover states, backgrounds |
| `--pink` | #E62D75 | CTAs, active states |
| `--gray-light` | #E1EAF2 | Backgrounds, disabled |
| `--success` | #85C97D | Positive indicators |
| `--warning` | #FFC857 | Attention |
| `--error` | #E30101 | Error, negative trends |
| `--trend-anomaly-bg` | rgba(227,1,1,0.1) | 10%+ YoY change highlight |

---

## Components

### DataTable (`components/data-table/data-table.tsx`)

Main data grid component using TanStack Table.

**Features:**
- Dynamic year columns (2016-2025)
- Collapsible 2016-2020 range (click to expand)
- Trend anomaly indicator (red highlight for 10%+ YoY change)
- Cross-module indicator ("Ook in: Instrumenten, Publiek")
- **"Gevonden in" column** (when searching): Shows which field matched if not primary field
- **Extra column enhancements** (all modules):
  - Text wrapping: Max 2 lines with ellipsis overflow (`line-clamp-2`)
  - "+X meer" indicator: Shows when multiple distinct values exist (Gmail-style)
  - Click "+X meer": Opens detail panel for full breakdown
  - Styling: 12px, Navy Medium (`#436FA3`), cursor pointer, no underline/hover
- Sticky columns on mobile (expand button + primary column)
- Server-side pagination (50/100/150/250/500 rows per page)
- Sortable columns
- Loading skeleton
- Empty state with suggestions
- CSV export (max 500 rows)
- XLS export (max 500 rows) - via xlsx library

**CSV Export:**
- Max 500 rows (constant: `MAX_EXPORT_ROWS`)
- Format: Semicolon-separated (`;`) for Dutch Excel compatibility
- Includes UTF-8 BOM for proper encoding
- Filename: `rijksuitgaven-{moduleId}-{YYYY-MM-DD}.csv`
- Columns: Primary value, year columns, Totaal

**Totals Row (UX-002f):**
- Appears when searching or filtering (not on default view)
- Shows aggregated totals across ALL results (not just current page)
- Navy dark background matching header
- Displays: "Totaal" + recipient count + year sums + grand total
- Handles collapsed years (2016-2020) sum when applicable
- Plural handling: "1 ontvanger" vs "289 ontvangers"

**Props:**
```typescript
interface DataTableProps {
  data: RecipientRow[]
  availableYears: number[]
  primaryColumnName: string
  isLoading?: boolean
  totalRows?: number
  page?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  onRowExpand?: (primaryValue: string) => void
  renderExpandedRow?: (row: RecipientRow) => React.ReactNode
  moduleId?: string  // Used for CSV export filename
  totals?: TotalsData | null  // Aggregated totals when searching/filtering
}

interface TotalsData {
  years: Record<number, number>  // { 2016: 0, 2017: 1000, ... }
  totaal: number
}
```

### ExpandedRow (`components/data-table/expanded-row.tsx`)

Content displayed when a table row is expanded. Returns `<tr>` elements directly (via Fragment) to share parent table's column structure for perfect alignment.

**Features:**
- **Integrated header row**: Grouping dropdown + item count + year headers in single row
- **Collapsible years**: 2016-2020 collapsed by default (matches main table)
- Grouping selector dropdown (per-module fields)
- Detail rows with tree structure (├ └ connectors)
- Lazy loading of detail data
- Year columns align perfectly with parent table

**Architecture:**
- Returns `<Fragment>` with multiple `<tr>` elements (not a nested table)
- Uses `colSpan` for content columns to match parent structure
- Shares parent table's column widths for alignment

**Groupable Fields Per Module:**

| Module | Fields (ordered by usefulness) |
|--------|-------------------------------|
| instrumenten | Regeling, Artikel, Instrument, Begrotingsnaam, Artikelonderdeel, Detail |
| apparaat | Kostensoort, Artikel, Detail, Begrotingsnaam |
| inkoop | Ministerie, Categorie, Staffel |
| provincie | Provincie, Omschrijving |
| gemeente | Gemeente, Beleidsterrein, Regeling, Omschrijving |
| publiek | Organisatie, Regeling, Sectoren, Trefwoorden |
| integraal | Module |

### FilterPanel (`components/filter-panel/filter-panel.tsx`)

Search and filter controls.

**Features:**
- Debounced search input (300ms)
- Year dropdown filter
- Expandable "Filters" section with **badge count** (e.g., "Filters (3)")
- Amount range (min/max)
- Module-specific filters
- Clear all button
- URL state sync (filters in query params)

### ColumnSelector (`components/column-selector/column-selector.tsx`)

Column customization for expanded row detail fields (UX-005).

**Features:**
- "Kolommen" button in DataTable footer
- Badge when non-default columns selected
- Checkbox list of available columns per module
- Preferences stored in localStorage (per module)
- "Herstel standaard" (reset to default) option

**Available Columns Per Module:**

| Module | Columns (* = default) |
|--------|----------------------|
| instrumenten | Artikel*, Regeling*, Instrument, Artikelonderdeel, Begrotingsnaam, Detail |
| apparaat | Artikel*, Detail*, Begrotingsnaam |
| inkoop | Ministerie*, Categorie*, Staffel* |
| provincie | Provincie*, Omschrijving* |
| gemeente | Gemeente*, Omschrijving*, Beleidsterrein, Regeling |
| publiek | Organisatie*, Regeling, Trefwoorden, Sectoren, Regio |
| integraal | Modules* |

### ModulePage (`components/module-page/module-page.tsx`)

Reusable template for all module pages.

**Features:**
- Suspense boundary for useSearchParams
- URL state sync (search, jaar, min_bedrag, max_bedrag)
- Pagination state management
- Sort state management
- Error state with retry button
- Loading skeleton

**Module Configurations:**

| Module | Primary Column | Description |
|--------|---------------|-------------|
| instrumenten | Ontvanger | Subsidies, regelingen en bijdragen |
| apparaat | Kostensoort | Operationele kosten |
| inkoop | Leverancier | Inkoop bij leveranciers |
| provincie | Ontvanger | Provinciale subsidies |
| gemeente | Ontvanger | Gemeentelijke subsidies |
| publiek | Ontvanger | RVO, COA, NWO uitbetalingen |
| integraal | Ontvanger | Cross-module search |

### Header (`components/header/header.tsx`)

Global navigation header (rendered in layout.tsx).

**Features:**
- Logo with link to home
- Modules dropdown (desktop)
- Mobile hamburger menu
- Integrated search bar
- Privacy policy link
- Login button (placeholder for Week 6)
- Sticky positioning (z-index 40)

**Responsive Behavior:**
| Screen Size | Navigation | Search | Menu |
|-------------|------------|--------|------|
| < 768px | Hidden | Bottom of header | Hamburger |
| 768px+ | Hidden | Inline | Hamburger |
| 1024px+ | Dropdown | Inline | Hidden |

**Module List:**
```typescript
const MODULES = [
  { id: 'integraal', name: 'Integraal', description: 'Zoek over alle modules' },
  { id: 'instrumenten', name: 'Instrumenten', description: 'Subsidies en regelingen' },
  { id: 'apparaat', name: 'Apparaat', description: 'Operationele kosten' },
  { id: 'inkoop', name: 'Inkoop', description: 'Inkoop bij leveranciers' },
  { id: 'provincie', name: 'Provincie', description: 'Provinciale subsidies' },
  { id: 'gemeente', name: 'Gemeente', description: 'Gemeentelijke subsidies' },
  { id: 'publiek', name: 'Publiek', description: 'RVO, COA, NWO' },
]
```

### SearchBar (`components/search-bar/search-bar.tsx`)

Global search with Typesense autocomplete (enhanced with keyword search).

**Features:**
- Real-time autocomplete (<50ms target)
- Debounced input (150ms)
- **Grouped results:** "ZOEKTERMEN" + "ONTVANGERS" sections
- **Keyword search:** Searches Regeling, Omschrijving, Beleidsterrein
- Shows field context (e.g., "in Regeling")
- Keyboard navigation (Arrow Up/Down, Escape, Enter)
- **Keyboard shortcut:** Press `/` to focus search (SR-004)
- Module badges for recipients
- Click keyword → navigate to module with filter
- Click recipient → navigate to `/integraal?q=QUERY`
- **"Did you mean" suggestions:** Shows fuzzy matches when no exact results
- Loading spinner during search
- Clear button in input
- Footer hint showing keyboard shortcut

**Props:**
```typescript
interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}
```

**Typesense Queries:**
1. **Recipients:** `recipients` collection, `name,name_lower` fields
2. **Keywords:** `instrumenten`, `publiek`, `gemeente`, `provincie` collections
   - Fields: `regeling`, `omschrijving`, `beleidsterrein`
   - Grouped by field value (deduped)

**Results:** 4 keywords + 5 recipients max
**Minimum query:** 2 characters

**Environment Variables:**
| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_TYPESENSE_HOST` | `typesense-production-35ae.up.railway.app` |
| `NEXT_PUBLIC_TYPESENSE_API_KEY` | (set in deployment) |

### DetailPanel (`components/detail-panel/detail-panel.tsx`)

Side panel showing comprehensive recipient information.

**Features:**
- 50% width on desktop, full screen on mobile
- Recipient name with Google search link
- Year breakdown (expandable to show all years)
- Module-specific detail fields (Regeling, Artikel, etc.)
- "Ook in:" cross-module badges with navigation
- CSV export for recipient data
- Close via X button or Escape key
- Switch between recipients without closing

**Props:**
```typescript
interface DetailPanelProps {
  recipientName: string
  moduleId: string
  isOpen: boolean
  onClose: () => void
  onNavigateToModule?: (module: string, recipientName: string) => void
}
```

**Usage:** Opens when user clicks recipient name in DataTable.

### CrossModuleResults (`components/cross-module-results/cross-module-results.tsx`)

Shows search results counts from other modules above the table.

**Features:**
- Displays "Ook in: Instrumenten (45) • Publiek (23)"
- Clickable module links preserve search query
- Hidden when no search query or no results in other modules
- Queries all modules in parallel with debouncing
- Sorted by result count (highest first)

**Props:**
```typescript
interface CrossModuleResultsProps {
  searchQuery: string
  currentModule: string
  className?: string
}
```

**Usage:** Automatically appears in module pages when search query is entered.

### CookieBanner (`components/cookie-banner/cookie-banner.tsx`)

GDPR-compliant disclosure banner (essential cookies only).

**Behavior:**
1. Shows on first visit (checks `localStorage`)
2. Dismisses permanently on "OK" click
3. Links to `/privacybeleid`
4. Fixed bottom position, z-index 50
5. Fade-in animation (150ms)

### ErrorBoundary (`components/error-boundary/error-boundary.tsx`)

React error boundary for graceful error handling.

**Features:**
- Catches JavaScript errors in child components
- Displays user-friendly error message
- "Probeer opnieuw" (Try again) button resets error state
- Logs errors to console (production: would send to error tracking)

**Usage:**
```tsx
<ErrorBoundary>
  <ModulePage moduleId="instrumenten" />
</ErrorBoundary>
```

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode  // Optional custom fallback UI
}
```

---

## API Client (`lib/api.ts`)

**Base URL:** Empty string (relative URLs)

All API calls go through `/api/v1/...` which is handled by Next.js BFF (Backend-for-Frontend) proxy routes. The real backend URL (`BACKEND_API_URL`) is server-side only and hidden from browsers.

**BFF Security Features:**
- Backend URL hidden from browser DevTools
- Offset capped at 10,000
- Limit capped at 500
- Module name validation (alphabetic only)

**Functions:**

| Function | Purpose |
|----------|---------|
| `fetchModules()` | Get list of available modules |
| `fetchModuleData(module, params)` | Get paginated, filtered module data |
| `fetchDetailData(module, value, grouping)` | Get expanded row details |

**Response Transformation:**
- API returns years as object: `{ "2016": 0, "2017": 1000 }`
- Client transforms to array: `[{ year: 2016, amount: 0 }, ...]`
- API uses `totaal`, client uses `total`
- API uses `modules`, client uses `sources`

---

## Format Utilities (`lib/format.ts`)

| Function | Purpose |
|----------|---------|
| `formatAmount(amount)` | Dutch number formatting (1.234.567) |
| `calculateYoYChange(current, previous)` | Calculate year-over-year % change |
| `isAnomaly(percentChange)` | Check if change >= 10% |
| `formatPercentage(value)` | Format as "+12.3%" or "-5.0%" |
| `getAmountFontClass(formatted)` | Return smaller font class for large numbers |

---

## TypeScript Types (`types/api.ts`)

**Key Interfaces:**

```typescript
// Row displayed in table
interface RecipientRow {
  primary_value: string
  years: YearAmount[]  // Array for iteration
  total: number
  row_count: number
  sources: string[] | null  // Cross-module indicator
}

// API response (before transformation)
interface ApiRecipientRow {
  primary_value: string
  years: Record<string, number>  // Object from API
  totaal: number
  row_count: number
  modules: string[] | null
}

// Query parameters
interface ModuleQueryParams {
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  jaar?: number
  min_bedrag?: number
  max_bedrag?: number
}
```

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section + module cards |
| `/instrumenten` | Module | Financiële Instrumenten |
| `/apparaat` | Module | Apparaatsuitgaven |
| `/inkoop` | Module | Inkoopuitgaven |
| `/provincie` | Module | Provinciale Subsidies |
| `/gemeente` | Module | Gemeentelijke Subsidies |
| `/publiek` | Module | Publiek (RVO/COA/NWO) |
| `/integraal` | Module | Cross-module search |
| `/privacybeleid` | Static | Privacy policy |
| `/login` | Auth | Login page (Week 6 - placeholder) |

---

## URL State (Shareable Filters)

**Supported Parameters:**

| Parameter | Type | Example |
|-----------|------|---------|
| `q` | string | `?q=prorail` |
| `jaar` | number | `?jaar=2024` |
| `min_bedrag` | number | `?min_bedrag=1000000` |
| `max_bedrag` | number | `?max_bedrag=5000000` |

**Example URL:**
```
/instrumenten?q=prorail&jaar=2024&min_bedrag=1000000
```

**Not in URL (V1.0):**
- Expanded row state
- Pagination position
- Grouping selection

---

## Build & Deploy

**Build:**
```bash
cd app
npm run build
```

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_API_URL` | `http://localhost:8000` | Backend API (server-side only, used by BFF proxy) |
| `NEXT_PUBLIC_TYPESENSE_HOST` | `typesense-production-35ae.up.railway.app` | Typesense server |
| `TYPESENSE_API_KEY` | (required) | Typesense search API key (server-side only) |

**Note:** No `NEXT_PUBLIC_` prefix for sensitive URLs/keys - they stay server-side only.

**Deployment:**
- Platform: Railway
- Root directory: `app`
- Production URL: `rijksuitgaven-production.up.railway.app`
- Beta URL: `beta.rijksuitgaven.nl`

---

## Testing Checklist

### DataTable
- [ ] Year columns display correctly
- [ ] Collapsed years (2016-20) expandable
- [ ] Trend anomaly highlight (10%+ change)
- [ ] Cross-module indicator shows ("Ook in:")
- [ ] Sorting works (click headers)
- [ ] Pagination controls work (25/50/100)
- [ ] Row expand/collapse works
- [ ] Sticky columns on mobile scroll
- [ ] CSV export downloads correctly
- [ ] CSV export limited to 500 rows
- [ ] CSV opens correctly in Dutch Excel (semicolon format)

### Header
- [ ] Logo links to home
- [ ] Modules dropdown works (desktop)
- [ ] Current module highlighted
- [ ] Mobile menu toggles
- [ ] Search bar visible
- [ ] Sticky on scroll

### SearchBar
- [ ] Autocomplete appears after 2 chars
- [ ] "ZOEKTERMEN" section shows keyword matches
- [ ] "ONTVANGERS" section shows recipient matches
- [ ] Keywords show field context (e.g., "in Regeling")
- [ ] Click keyword navigates to correct module
- [ ] Click recipient navigates to /integraal
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Clear button works
- [ ] Click outside closes dropdown

### DetailPanel
- [ ] Opens when clicking recipient name in table
- [ ] Shows year breakdown correctly
- [ ] "Alle jaren" expands to show full history
- [ ] Module-specific fields display
- [ ] "Ook in:" badges appear for cross-module recipients
- [ ] Google search link opens in new tab
- [ ] CSV export downloads correctly
- [ ] Close button/Escape key closes panel
- [ ] Switching recipient updates panel content

### CrossModuleResults
- [ ] Appears when search query entered
- [ ] Shows correct counts for each module
- [ ] Module links preserve search query
- [ ] Hidden when no results in other modules
- [ ] Hidden on integraal page

### FilterPanel
- [ ] Search input debounces (300ms)
- [ ] Year filter works
- [ ] Amount range filters work
- [ ] Clear all resets filters
- [ ] URL updates with filters
- [ ] Page refresh preserves filters

### CookieBanner
- [ ] Shows on first visit
- [ ] Dismisses on OK click
- [ ] Stays dismissed on refresh
- [ ] Privacy link navigates correctly
- [ ] Touch target >= 44x44px

### ExpandedRow
- [ ] Detail data loads on expand
- [ ] **Context header shows** (Regeling/headline + breadcrumb)
- [ ] Grouping selector changes data
- [ ] Cross-module indicator shows in context header
- [ ] Navigate to module works
- [ ] Fallback to simple view if no context data

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-26 | Initial documentation (Week 3-4 components) |
| 2026-01-26 | Added Header, SearchBar, CSV export documentation (Week 5) |
| 2026-01-26 | Added DetailPanel, CrossModuleResults, enhanced SearchBar (UX features) |
| 2026-01-31 | Added ErrorBoundary component, XLS export, "Gevonden in" column |
| 2026-01-31 | Updated pagination options (25/100/150/250/500), default columns note |
| 2026-01-31 | Fixed Apparaat columns (Kostensoort is primary, not extra) |
| 2026-02-02 | Added BFF proxy documentation, updated environment variables |
| 2026-02-03 | Updated ExpandedRow (Fragment architecture, full groupable fields), fixed pagination (50 default), removed random sort block from BFF |
