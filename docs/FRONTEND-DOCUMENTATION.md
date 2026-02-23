# Frontend Documentation

**Last Updated:** 2026-02-18
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
│   ├── login/page.tsx            # Login page (Magic Link form)
│   ├── auth/
│   │   └── callback/page.tsx     # Auth callback (client-side PKCE exchange)
│   ├── profiel/page.tsx          # Profile page (user info + subscription status)
│   ├── team/
│   │   ├── page.tsx              # Admin dashboard (subscription overview)
│   │   ├── leden/page.tsx        # Member management (admin only)
│   │   ├── feedback/page.tsx     # Feedback inbox (admin only)
│   │   ├── contacten/page.tsx    # Contacts management (admin only) — UX-028
│   │   ├── statistieken/page.tsx # Usage statistics dashboard (admin only) — UX-032
│   │   └── fouten/page.tsx      # Error monitoring (admin only) — UX-033
│   ├── verlopen/page.tsx         # Expired subscription page
│   ├── voorwaarden/page.tsx     # Terms of service (16 articles, B2B SaaS)
│   ├── over/page.tsx            # About page (mission, audiences, sources)
│   ├── support/page.tsx         # Post-login support (5 accordion sections)
│   ├── dataoverzicht/page.tsx   # Data availability matrix (UX-035)
│   ├── instrumenten/page.tsx     # Module page
│   ├── apparaat/page.tsx         # Module page
│   ├── inkoop/page.tsx           # Module page
│   ├── provincie/page.tsx        # Module page
│   ├── gemeente/page.tsx         # Module page
│   ├── publiek/page.tsx          # Module page
│   ├── integraal/page.tsx        # Cross-module search page
│   ├── not-found.tsx             # Custom 404 page (UX-029, branded)
│   ├── h1/ through h5/          # Brief 2 prototype pages (design exploration)
│   └── error.tsx                 # Error page
├── components/
│   ├── app-shell/                # Page wrapper for non-app pages
│   │   └── app-shell.tsx         # Header/footer wrapper
│   ├── homepage/                 # Public homepage (pre-login)
│   │   ├── public-homepage.tsx   # Full homepage (~960 lines, 7 sections)
│   │   └── index.ts
│   ├── ui/                       # shadcn/ui primitives (Radix-based)
│   │   ├── accordion.tsx, badge.tsx, button.tsx, card.tsx, checkbox.tsx
│   │   ├── command.tsx, dialog.tsx, dropdown-menu.tsx, input.tsx
│   │   ├── label.tsx, popover.tsx, scroll-area.tsx, select.tsx
│   │   ├── separator.tsx, sheet.tsx, sonner.tsx, switch.tsx
│   │   ├── tabs.tsx, textarea.tsx, tooltip.tsx
│   ├── auth/                     # Authentication components
│   │   ├── auth-button.tsx       # Profile dropdown (UX-026)
│   │   └── subscription-banner.tsx # Grace period warning banner
│   ├── column-selector/          # Column customization (UX-005)
│   │   ├── column-selector.tsx
│   │   └── index.ts
│   ├── cookie-banner/            # GDPR cookie disclosure
│   │   ├── cookie-banner.tsx
│   │   └── index.ts
│   ├── error-boundary/           # React error boundary wrapper
│   │   ├── error-boundary.tsx
│   │   ├── error-report.tsx        # Shared error display (UX overhaul)
│   │   └── index.ts
│   ├── mobile-banner/            # Mobile message banner (UX-003)
│   │   ├── mobile-banner.tsx
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
│   ├── footer/                   # Site-wide footer (auth-aware)
│   │   ├── footer.tsx
│   │   └── index.ts
│   ├── header/                   # Global navigation header
│   │   ├── header.tsx
│   │   └── index.ts
│   ├── module-page/              # Reusable module page template
│   │   ├── module-page.tsx
│   │   └── index.ts
│   ├── search-bar/               # Typesense autocomplete search
│   │   ├── search-bar.tsx
│   │   └── index.ts
│   └── staffel-popover/          # Staffelbedrag explanation (shared)
│       └── staffel-popover.tsx
├── lib/
│   ├── api.ts                    # API client for backend
│   ├── api-config.ts             # Centralized API base URL
│   ├── constants.ts              # Shared MODULE_LABELS, FIELD_LABELS, ALL_MODULES
│   ├── format.ts                 # Number formatting utilities
│   ├── utils.ts                  # CN utility for Tailwind
│   └── supabase/                 # Supabase client initialization
│       ├── client.ts             # Browser client (use in components)
│       ├── server.ts             # Server client (use in Server Components, API routes)
│       └── middleware.ts         # Middleware client (use in middleware.ts)
├── hooks/
│   ├── use-auth.ts               # useAuth() - client-side session hook
│   ├── use-subscription.ts       # useSubscription() - client-side subscription status hook
│   ├── use-scroll-reveal.ts      # IntersectionObserver hook for scroll animations
│   └── use-analytics.ts          # useAnalytics() - client-side event batching hook (UX-032)
├── middleware.ts                 # Route protection + subscription check
└── types/
    └── api.ts                    # TypeScript interfaces
```

---

## Fonts (Brand Identity) — Dual-Width IBM Plex System

| Font | Variable | Weight | Usage |
|------|----------|--------|-------|
| IBM Plex Sans | `--font-body` | 400-700 | Public pages, module hub, headings |
| IBM Plex Sans | `--font-heading` | 400-700 | Alias for `--font-body` (resolved in globals.css) |
| IBM Plex Sans Condensed | `--font-condensed` | 400-700 | Data-dense logged-in pages (modules, team, profiel) |

All fonts self-hosted via `next/font/google` — no external requests.

**Design rationale:** Same typeface family, two widths. Public pages use the wider Sans for readability. Data pages use Condensed to fit more columns in tables.

**Where each font applies:**
- Public pages (homepage, login, privacybeleid, verlopen): inherit `--font-body` (IBM Plex Sans)
- Module hub (authenticated `/`): inherits `--font-body` (IBM Plex Sans)
- Data pages: `style={{ fontFamily: 'var(--font-condensed)' }}` on `<main>` wrapper
  - `module-page.tsx` wraps ErrorBoundary content (all 7 modules)
  - `team/*`, `profiel`, `detail-panel`: individual `<main>` overrides

**Usage in CSS:**
```css
.heading {
  font-family: var(--font-heading), sans-serif; /* resolves to IBM Plex Sans */
}
.body {
  font-family: var(--font-body), sans-serif; /* IBM Plex Sans */
}
.data-page {
  font-family: var(--font-condensed), sans-serif; /* IBM Plex Sans Condensed */
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
| `--trend-anomaly-bg` | rgba(227,1,1,0.1) | 50%+ YoY change highlight |

---

## Components

### DataTable (`components/data-table/data-table.tsx`)

Main data grid component using TanStack Table.

**Features:**
- Dynamic year columns (2016-2025)
- Collapsible 2016-2020 range (click to expand)
- Trend anomaly indicator (red highlight for 50%+ YoY change)
- Cross-module indicator ("Ook in: Instrumenten, Publiek")
- **"Gevonden in" column** (when searching): Shows which field matched if not primary field
- **Extra column enhancements** (all modules):
  - Text wrapping: Max 2 lines with ellipsis overflow (`line-clamp-2`)
  - "+X meer" indicator: Shows when multiple distinct values exist (Gmail-style)
  - Click "+X meer": Expands the row to show detail breakdown
  - Styling: 12px, Navy Medium (`#436FA3`), cursor pointer, no underline/hover
- Sticky columns on mobile (expand button + primary column)
- Server-side pagination (50/100/150/250/500 rows per page)
- Sortable columns
- Loading skeleton
- Empty state with suggestions
- CSV export (max 500 rows)
- XLS export (max 500 rows) - via xlsx library
- **Google search link** (UX-010): ExternalLink icon (14px) next to recipient names
  - Always visible (not hover-only)
  - Color: Navy medium → pink on hover
  - Opens Google search in new tab
  - CSS-only instant tooltip "Zoek op Google" (centered above icon)
- **Clickable extra columns** (UX-007): Click value to filter by that field
  - Hover: pink text + underline
  - Click: clears all filters, applies only clicked filter
  - All rows collapse after filter applied
- **Data availability indicators** (UX-012): Em-dash for unavailable years
  - `isYearAvailable()` helper checks year against `dataAvailableFrom`/`dataAvailableTo`
  - `NoDataCell` component renders em-dash `—` with tooltip "Geen data beschikbaar voor deze periode"
  - Collapsed years (2016-20) only sum years within availability range
  - Null availability = assume all years available (backwards compat)
- **Staffelbedrag explanation popover** (UX-013): Shared `StaffelPopover` component on Inkoop/Publiek
  - Clickable word "staffelbedrag(en)" in footer opens popover above
  - Uses shared `StaffelPopover` component (`components/staffel-popover/staffel-popover.tsx`)
  - Navy dark popover with pink accent bar (matches search tips pattern)
  - Content: staffel range table (1-13), midpoint explanation, source reference
  - Click-outside handler closes popover
  - Note: Filter panel also uses `StaffelPopover` (see FilterPanel section)

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
  onFilterLinkClick?: (field: string, value: string) => void  // UX-007: Click extra column to filter
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
- **GroupingSelect dropdown** (UX-023): Custom single-select matching filter panel design, with distinct value counts per option
- **Integrated header row**: Grouping dropdown + year headers in single row
- **Collapsible years**: 2016-2020 collapsed by default (matches main table)
- Grouping selector dropdown (per-module fields)
- Detail rows with tree structure (├ └ connectors)
- Lazy loading of detail data
- Year columns align perfectly with parent table
- **Clickable grouped values** (UX-007): Click value to filter by that field
  - Hover: pink text + underline
  - Click: clears all filters, applies only clicked filter
- **Integraal module navigation**: When grouping by Module, click navigates to `/{module}?q={ontvanger}` instead of filtering

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

### StaffelPopover (`components/staffel-popover/staffel-popover.tsx`)

Shared staffelbedrag explanation popover, used in both DataTable footer and FilterPanel.

**Props:**
```typescript
interface StaffelPopoverProps {
  position?: 'above' | 'below'  // 'above' for footer (opens upward), 'below' for filter label (opens downward)
}
```

**Content:** Staffel 1-13 range table, midpoint explanation, source reference (data.overheid.nl).

**Usage:** Used in Inkoop and Publiek modules only.

### FilterPanel (`components/filter-panel/filter-panel.tsx`)

Search and filter controls.

**Features:**
- Debounced search input (300ms)
- Year dropdown filter
- Expandable "Filters" section with **badge count** (e.g., "Filters (3)")
- Amount range (min/max)
- Module-specific filters (MultiSelect dropdowns)
- **Cascading bidirectional filters** (UX-021): All modules except integraal
  - When a value is selected in one filter, all other filter dropdowns update to show only relevant options
  - Each option shows a count of matching rows: `"Subsidie (1.234)"`
  - Invalid selections shown as `(0 resultaten)` in red
  - Debounced 200ms fetch with AbortController
  - Uses `POST /{module}/filter-options` BFF endpoint
- **Staffel filter label popover** (Inkoop/Publiek): "Staffel" label is clickable with dotted underline → opens `StaffelPopover` below
- **CustomSelect component**: Custom dropdown for Integraal "Instanties per ontvanger" (matches MultiSelect styling)
- Clear all button
- URL state sync (filters in query params)
- **Auto-expand on column click** (UX-020): Filter panel auto-expands when clicking column values

### ColumnSelector (`components/column-selector/column-selector.tsx`)

Column customization for expanded row detail fields (UX-005).

**Features:**
- "Kolommen" button in DataTable footer
- Badge when non-default columns selected
- Checkbox list of available columns per module
- Preferences stored in localStorage (per module)
- "Herstel standaard" (reset to default) option

**Available Columns Per Module:**

*Note: Max 2 columns displayed (MAX_SELECTED_COLUMNS = 2). Asterisk (*) indicates default.*

| Module | Columns (* = default) |
|--------|----------------------|
| instrumenten | Artikel*, Regeling*, Instrument, Artikelonderdeel, Begrotingsnaam, Detail |
| apparaat | Artikel*, Detail*, Begrotingsnaam |
| inkoop | Categorie*, Staffel*, Ministerie |
| provincie | Provincie*, Omschrijving* |
| gemeente | Gemeente*, Omschrijving*, Beleidsterrein, Regeling |
| publiek | Organisatie*, Regeling, Trefwoorden, Sectoren, Regio, Staffel, Onderdeel |
| integraal | Betalingen* (total payment record count per recipient, UX-022) |

### ModulePage (`components/module-page/module-page.tsx`)

Reusable template for all module pages.

**Features:**
- Suspense boundary for useSearchParams
- URL state sync (search, jaar, min_bedrag, max_bedrag)
- Pagination state management
- Sort state management
- Error state with retry button
- Loading skeleton
- Committed search tracking (UX-034): `pendingSearchCommit` ref consumed after data loads, `activeSearchId` carried by all engagement events, `endCurrentSearch` fires `search_end` with duration + exit action, visibility pause handling

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
- **AuthButton** (UX-026): Profile dropdown with user icon + chevron (logged in) OR "Inloggen" link (logged out)
- Sticky positioning (z-index 40)
- **Hard navigation** (UX-008): Module clicks force full page reload, resetting all filters

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

### Footer (`components/footer/footer.tsx`)

Site-wide footer (rendered in layout.tsx). Auth-aware with different content for logged in vs not logged in users.

**Features:**
- 3-column layout: Logo | Links | Social + Contact
- White logo on navy dark background
- Social icons: X (Twitter), Bluesky, LinkedIn (inline SVGs)
- Contact: Phone + Email
- Copyright bar only (email + logout removed in UX-026, now in profile dropdown)

**Props:**
```typescript
interface FooterProps {
  isLoggedIn?: boolean  // Controls which links to show
  userEmail?: string    // Shown in bottom bar when logged in
}
```

**Content by Auth State:**

| Section | Not Logged In | Logged In |
|---------|---------------|-----------|
| Column 2 Title | "Ontdek Rijksuitgaven" | "Support" + "Juridisch" |
| Links | Over ons, FAQ, Vacatures, Abonnementen, Privacy, Inloggen | FAQ, Contact, Feedback, Privacy, Cookies |
| Bottom Bar | Copyright only | Copyright + email + Uitloggen |

**Integration:**
Footer is included in `layout.tsx`. When auth is implemented (Week 6), pass auth state:
```tsx
<Footer isLoggedIn={session?.user != null} userEmail={session?.user?.email} />
```

---

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
None required. SearchBar uses the BFF proxy (`/api/v1/search/autocomplete`) which handles Typesense access server-side.

> **Note (2026-02-08):** `NEXT_PUBLIC_TYPESENSE_HOST` and `NEXT_PUBLIC_TYPESENSE_API_KEY` are no longer used. All Typesense access goes through the BFF proxy. These can be removed from Railway environment config.

### DetailPanel (`components/detail-panel/detail-panel.tsx`) — INACTIVE

**Status:** Component exists but is no longer used in module pages. Deferred to V6 (AI Research) where it will become the Recipient Profile Panel.

**Previous usage:** Opened when user clicked recipient name. Now clicking recipient name expands the row instead (2026-02-07).

**V6 plan:** Rebuild as slide-out panel with full recipient context for AI Research Mode. See `02-requirements/backlog.md`.

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

### MobileBanner (`components/mobile-banner/mobile-banner.tsx`)

Friendly message for mobile users that the app works best on larger screens (UX-003).

**Features:**
- Detects viewport < 768px
- Bottom sheet with slide-up animation
- One-time dismiss via localStorage
- Non-blocking (users can continue)
- Navy background, Monitor icon, pink CTA

**Behavior:**
1. Shows on mobile viewport (<768px) if not previously dismissed
2. User clicks "Doorgaan" → saves to localStorage, hides banner
3. Never shows again on that device

**Styling:**
- Position: Fixed bottom, full width
- Background: Navy dark (#0E3261)
- Animation: slideUp 300ms ease-out
- Z-index: 50

**SSR Safety:**
- Initial state is `null` (not rendered during SSR)
- `useEffect` checks viewport and localStorage on client
- Prevents hydration mismatch

---

### AuthButton (`components/auth/auth-button.tsx`) — UX-026

Profile dropdown menu component for header (replaced exposed logout button).

**Features:**
- **Logged in:** User icon + chevron → dropdown menu
- **Logged out:** "Inloggen" text link → `/login`
- Dropdown menu contents:
  - "Ingelogd als" + truncated email (top section, border below)
  - "Mijn profiel" link → `/profiel`
  - Divider
  - "Uitloggen" button (red text, red hover background)
- Click outside or Escape closes menu
- Chevron rotates 180° when open

**Priority:** P1 (High)
**Status:** ✅ Implemented 2026-02-11

**Rationale:** Industry-standard pattern (Stripe, Linear, Notion) reduces accidental logouts

---

### SubscriptionBanner (`components/auth/subscription-banner.tsx`)

Grace period warning banner shown when subscription is in grace period (expired but within grace window).

**Features:**
- Shown only when subscription status is 'grace' (after end_date, before grace_ends_at)
- Yellow/warning styling
- Message: "Je abonnement is verlopen. Je hebt nog X dagen toegang."
- "Verlengen" button → contact page
- Dismissible (localStorage)
- Fixed top position, below header

**Props:**
```typescript
interface SubscriptionBannerProps {
  daysRemaining: number
  graceEndsAt: string  // ISO date string
}
```

---

### ErrorBoundary (`components/error-boundary/error-boundary.tsx`)

React error boundary for graceful error handling. Uses `ErrorReport` component for consistent error UX.

**Features:**
- Catches JavaScript errors in child components
- Displays universal "Er is iets misgegaan" message via ErrorReport
- Dev-only: shows error details in collapsed section

**Usage:**
```tsx
<ErrorBoundary>
  <ModulePage moduleId="instrumenten" />
</ErrorBoundary>
```

### ErrorReport (`components/error-boundary/error-report.tsx`)

Shared error display component — universal "Er is iets misgegaan" message with auto-logged error confirmation.

**Features:**
- Universal message: "Er is iets misgegaan" (no per-component messages)
- "Fout melden" button → "✓ Fout is gemeld" (1s) → "↩ Terug in 3/2/1..." → `router.back()`
- Three-phase state machine: idle → confirmed → countdown
- Two variants: `page` (centered card with AlertTriangle) and `inline` (compact for table rows)
- Errors auto-logged to analytics — no manual feedback needed

**Error tracking across components (8 total):**
| Component | Trigger | What it catches |
|-----------|---------|-----------------|
| module-page | page_load, sort_change, filter_apply, search, page_change | Data fetch failures |
| expanded-row | row_expand | Detail fetch failure |
| detail-panel | detail_panel | Side panel fetch |
| filter-panel | filter_load, autocomplete | Filter dropdown + search |
| search-bar | autocomplete | Hub search failure |
| feedback-button | feedback_submit | Feedback submit |
| login-form | login | Rate limit, OTP, network |
| public-homepage | contact_form | Contact form submit |

**Usage:**
```tsx
// Page-level (centered card):
<ErrorReport />

// Inline (compact, for table rows):
<ErrorReport variant="inline" />
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
| `fetchGroupingCounts(module, value)` | Get distinct value counts per groupable field (UX-023) |
| `fetchCascadingFilterOptions(module, activeFilters, signal?)` | Get cascading filter options with counts (POST) |

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
| `isAnomaly(percentChange)` | Check if change >= 50% |
| `formatPercentage(value)` | Format as "+12.3%" or "-5.0%" |
| `getAmountFontClass(formatted)` | Return smaller font class for large numbers |

---

## TypeScript Types (`types/api.ts`)

**Key Interfaces:**

```typescript
// Row displayed in table (internal format)
interface RecipientRow {
  primary_value: string
  years: YearAmount[]  // Array for iteration
  total: number
  row_count: number
  sources: string[] | null  // Cross-module indicator
  extraColumns?: Record<string, string | null>  // Dynamic columns (max 2)
  extraColumnCounts?: Record<string, number>  // Distinct value counts ("+X meer")
  matchedField?: string | null  // Which field matched search
  matchedValue?: string | null  // The matched value
  dataAvailableFrom?: number | null  // First year with data (UX-012)
  dataAvailableTo?: number | null  // Last year with data (UX-012)
}

// API response (before transformation)
interface ApiRecipientRow {
  primary_value: string
  years: Record<string, number>  // Object from API
  totaal: number
  row_count: number
  modules: string[] | null
  extra_columns?: Record<string, string | null>
  extra_column_counts?: Record<string, number>
  matched_field?: string | null
  matched_value?: string | null
  data_available_from?: number | null  // UX-012
  data_available_to?: number | null  // UX-012
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
  min_years?: number  // Recipients with data in X+ years (UX-002)
  columns?: string[]  // Dynamic extra columns (max 2, UX-005)
}
```

---

## Hooks

### useAuth() (`hooks/use-auth.ts`)

Client-side auth hook using Supabase browser client.

**Returns:**
```typescript
{
  user: User | null
  session: Session | null
  loading: boolean
}
```

**Usage:**
```tsx
const { user, session, loading } = useAuth()

if (loading) return <LoadingSpinner />
if (!user) return <LoginPrompt />
return <UserContent user={user} />
```

**Implementation:** Calls `supabase.auth.getSession()` on mount, no realtime listener (sessions managed by middleware).

---

### useAnalytics() (`hooks/use-analytics.ts`) — UX-032

Client-side analytics event batching hook with pseudonymized tracking.

**Returns:**
```typescript
{
  track: (eventType: AnalyticsEventType, module?: string, properties?: Record<string, unknown>) => void
}
```

**Event Types (14):**
- Core (module-page): `module_view`, `search`, `search_end`, `row_expand`, `filter_apply`, `export`, `column_change`, `sort_change`, `page_change`, `cross_module_nav`, `error`
- Search bar: `autocomplete_search`, `autocomplete_click`
- External: `external_link` (Google search clicks in data-table + detail-panel)

**Committed Search Tracking (UX-034):**

Search events only fire on explicit user actions — never on debounce timers. Two commit types:
- **Enter press** — user presses Enter in search field (commit_type='enter')
- **Autocomplete click** — user clicks a current-module result (commit_type='autocomplete')

Each committed search generates a unique `search_id` (format: `s_{timestamp}_{random}`). This ID is carried by all subsequent engagement events (`row_expand`, `export`, `cross_module_nav`, `external_link`, `filter_apply`, `sort_change`, `page_change`, `column_change`) until the search session ends.

**search_end event** tracks:
- `duration_seconds` — time from search commit to session end (visibility pause aware, capped at 5 minutes)
- `exit_action` — what ended the session: `new_search`, `module_switch`, `page_leave`, `search_clear`

**Retry chains:** When a search follows a zero-result search within 60 seconds, `prev_search_id` links them.

**Deferred result counting:** The search commit is signaled from filter-panel via `onSearchCommit`, but the `search` event is only tracked after data loads (when `result_count` is known). The `pendingSearchCommit` ref in module-page holds the intent until consumption.

**Batching Behavior:**
- Events queue in module-level array (shared across all hook instances)
- Flush triggers: every 30 seconds, at 10 events, or on `visibilitychange`
- Primary: `fetch` with `keepalive` (reliable, includes credentials)
- Page unload: `sendBeacon` with `text/plain` Content-Type (survives page close, avoids privacy browser blocking)
- Falls back to `fetch` if sendBeacon fails

**Usage:**
```tsx
const { track } = useAnalytics()

// Track module view
track('module_view', 'instrumenten', { result_count: 500 })

// Track search (called by module-page after data loads, not manually)
track('search', 'integraal', { search_id: 's_123_ab', query: 'prorail', result_count: 12, commit_type: 'enter' })

// Track search end
track('search_end', 'integraal', { search_id: 's_123_ab', duration_seconds: 45, exit_action: 'new_search' })

// Track engagement with search_id
track('row_expand', 'integraal', { recipient: 'ProRail', search_id: 's_123_ab' })
```

**Privacy:** No PII stored. User ID hashed server-side to `actor_hash` (SHA256, first 16 chars). Anonymous users tracked as `anon_000000000000`.

---

### useSubscription() (`hooks/use-subscription.ts`)

Client-side subscription status hook.

**Returns:**
```typescript
{
  subscription: Subscription | null
  status: 'active' | 'grace' | 'expired' | 'unknown'
  loading: boolean
  daysRemaining?: number  // Days left in grace period (if status='grace')
}
```

**Status calculation:**
- `cancelled_at` set → expired
- `today <= end_date` → active
- `today <= grace_ends_at` → grace
- else → expired

**Grace periods:** 3 days (monthly), 14 days (yearly)

**Usage:**
```tsx
const { subscription, status, loading, daysRemaining } = useSubscription()

if (status === 'grace') return <SubscriptionBanner daysRemaining={daysRemaining} />
if (status === 'expired') redirect('/verlopen')
```

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section + module cards (public) |
| `/login` | Auth | Login page (Magic Link form) |
| `/auth/callback` | Auth | Auth callback handler (client-side PKCE exchange) |
| `/profiel` | Protected | User profile page (subscription info, logout) |
| `/team` | Protected (Admin) | Admin dashboard (subscription overview) |
| `/team/leden` | Protected (Admin) | Member management (CRUD operations) |
| `/team/feedback` | Protected (Admin) | Feedback inbox (status workflow, categories) |
| `/team/statistieken` | Protected (Admin) | Usage statistics dashboard (UX-032, search redesign UX-034) |
| `/team/fouten` | Protected (Admin) | Error tracking dashboard (UX-033, separate from statistieken) |
| `/team/contacten` | Protected (Admin) | CRM contacts management (UX-028) |
| `/verlopen` | Public | Expired subscription page |
| `/instrumenten` | Protected | Financiële Instrumenten module |
| `/apparaat` | Protected | Apparaatsuitgaven module |
| `/inkoop` | Protected | Inkoopuitgaven module |
| `/provincie` | Protected | Provinciale Subsidies module |
| `/gemeente` | Protected | Gemeentelijke Subsidies module |
| `/publiek` | Protected | Publiek (RVO/COA/NWO) module |
| `/integraal` | Protected | Cross-module search |
| `/privacybeleid` | Public | Privacy policy |
| `/h1` - `/h5` | Public | Brief 2 prototype pages (design exploration) |
| `not-found` | Public | Custom branded 404 page (UX-029) |

### BFF API Routes (`app/src/app/api/`)

All frontend API calls are proxied through Next.js BFF routes:

| Route | Method | Backend Target | Auth Required |
|-------|--------|---------------|---------------|
| `/api/v1/modules` | GET | List modules | Yes |
| `/api/v1/modules/[module]` | GET | Module data | Yes |
| `/api/v1/modules/[module]/stats` | GET | Module statistics | Yes |
| `/api/v1/modules/[module]/autocomplete` | GET | Module autocomplete | Yes |
| `/api/v1/modules/[module]/filters/[field]` | GET | Filter options | Yes |
| `/api/v1/modules/[module]/filters` | POST | Cascading filter options with counts (UX-021) | Yes |
| `/api/v1/modules/[module]/[value]/details` | GET | Expanded row details | Yes |
| `/api/v1/modules/[module]/[value]/grouping-counts` | GET | Grouping field counts (UX-023) | Yes |
| `/api/v1/search/autocomplete` | GET | Global Typesense search | Yes |
| `/api/v1/team/leden` | GET | List members (admin only) | Yes (Admin) |
| `/api/v1/team/leden/[id]` | GET/PUT/DELETE | Member CRUD (admin only) | Yes (Admin) |
| `/api/v1/team/leden/[id]/invite` | POST | Send invite email to member (admin only) | Yes (Admin) |
| `/api/v1/team/feedback` | GET | List feedback items (admin only) | Yes (Admin) |
| `/api/v1/team/feedback/[id]` | PATCH | Update feedback status/priority (admin only) | Yes (Admin) |
| `/api/v1/me/activate` | POST | Set activated_at on first login | Yes |
| `/api/v1/feedback` | POST | Submit user feedback (with screenshot) | Yes |
| `/api/v1/contact` | POST | Demo request form (stores in contacts + sends email) | **No** (public) |
| `/api/v1/analytics` | POST | Batched analytics event ingestion (UX-032) | Yes |
| `/api/v1/team/statistieken` | GET | Usage statistics dashboard data (admin only) | Yes (Admin) |
| `/api/v1/team/contacten` | GET/POST | List/create contacts (admin only) | Yes (Admin) |
| `/api/v1/team/contacten/[id]` | PATCH/DELETE | Update/delete contact (admin only) | Yes (Admin) |

**Auth Protection:** All BFF routes check for valid Supabase session via server-side client. Returns 401 if unauthenticated. Admin routes additionally check `subscriptions.role = 'admin'`. Exception: `/api/v1/contact` is public (homepage demo request form).

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

**Not in URL (V2.0):**
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
| `NEXT_PUBLIC_SUPABASE_URL` | (required) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (required) | Supabase anon/public key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | (required) | Supabase service role key (server-side only, for admin operations) |
| `NEXT_PUBLIC_TYPESENSE_HOST` | `typesense-production-35ae.up.railway.app` | Typesense server (unused - all access via BFF) |
| `TYPESENSE_API_KEY` | (required) | Typesense search API key (server-side only) |
| `BFF_SECRET` | (required) | Shared secret for BFF→backend auth (X-BFF-Secret header) |
| `ANALYTICS_HASH_SECRET` | (required) | Secret for pseudonymizing user IDs in analytics (UX-032) |

**Note:** No `NEXT_PUBLIC_` prefix for sensitive URLs/keys - they stay server-side only. Exception: Supabase URL and anon key are designed to be public per Supabase architecture.

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
- [ ] Trend anomaly highlight (50%+ change)
- [ ] Cross-module indicator shows ("Ook in:")
- [ ] Sorting works (click headers)
- [ ] Pagination controls work (50/100/150/250/500)
- [ ] Row expand/collapse works
- [ ] Sticky columns on mobile scroll
- [ ] CSV export downloads correctly
- [ ] CSV export limited to 500 rows
- [ ] CSV opens correctly in Dutch Excel (semicolon format)
- [ ] Em-dash (—) shows for years outside availability range (UX-012)
- [ ] Tooltip "Geen data beschikbaar voor deze periode" on em-dash hover
- [ ] Collapsed years only sums available years
- [ ] Entity-level availability when filtering (e.g., ?gemeente=Amersfoort → 2020-2024)
- [ ] Expanded row inherits availability from parent row

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

### DetailPanel — DEFERRED TO V6
> Component exists but is inactive. Testing checklist will be added when rebuilt for AI Research Mode.

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

## Email Template Standards

**Updated:** 2026-02-23

All email templates share consistent dimensions based on industry standards (Mailchimp, Klaviyo, HubSpot, Litmus).

**Templates using these standards:**
- `app/api/_lib/campaign-template.ts` — Campaign/sequence emails
- `app/api/v1/auth/magic-link/route.ts` — Login magic link
- `app/api/v1/team/leden/[id]/invite/route.ts` — Welcome/invite email

| Property | Value | Industry Standard |
|----------|-------|-------------------|
| Content width | 600px | 600px (all major platforms) |
| Body font size | 16px | 16px (44% of emails, Smashing Magazine) |
| Heading font size | 22px | 22-26px (B2B range) |
| Line height | 24px (1.5x) | 1.5x (WCAG 1.4.12 minimum) |
| Footer/small text | 13px | 12-14px |
| Card padding | 40px 36px | 40-48px |
| CTA button | 14px 48px, 16px font, 6px radius | Standard range |
| Logo width | 220px | 120-220px |
| Outer padding | 40px 20px | 20-40px top, 0-20px sides |
| Max width ceiling | 600px | 640px (Gmail clips above) |

**Auto-link prevention:** `breakAutoLinks()` in campaign-template.ts inserts zero-width space (`&#8203;`) before `.nl` in "Rijksuitgaven.nl" to prevent email clients from auto-linking domain text. Industry standard technique (Mailchimp, Litmus, Campaign Monitor).

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
| 2026-02-04 | Added UX-007 clickable hyperlinks (extra columns + expanded row), UX-008 hard navigation on module menu |
| 2026-02-05 | Added MobileBanner component (UX-003) |
| 2026-02-06 | Added UX-010 Google search link in DataTable |
| 2026-02-07 | Added UX-012 data availability indicators, updated RecipientRow/ApiRecipientRow interfaces, testing checklist |
| 2026-02-07 | DetailPanel marked inactive (deferred to V6), click ontvanger expands row, added constants.ts/api-config.ts to project structure |
| 2026-02-07 | Added UX-013 staffelbedrag explanation popover on Inkoop/Publiek footer |
| 2026-02-07 | Anomaly threshold 10%→50%, instant year tooltips, integraal module navigation |
| 2026-02-08 | Added UX-019 table info popover, UX-020 filter auto-expand, UX-021 cascading bidirectional filters |
| 2026-02-08 | Added StaffelPopover shared component, updated UX-013 (filter label clickable, icon removed from footer) |
| 2026-02-08 | Added CustomSelect component for Integraal, BFF POST route for cascading filters |
| 2026-02-08 | Added fetchCascadingFilterOptions() to API client, FilterOption type |
| 2026-02-09 | UX-023: GroupingSelect dropdown with counts, BFF grouping-counts route, updated ExpandedRow |
| 2026-02-11 | WS-3: Auth pages, hooks, admin routes, subscription components, profile dropdown (UX-026) |
| 2026-02-13 | Typography: IBM Plex Sans dual-width system (replaced Brawler). Added /h1-/h5 prototypes, 404 page (UX-029), AppShell, contacten route |
| 2026-02-14 | UX-032: Usage statistics — analytics hook, BFF endpoint, admin dashboard, env var |
| 2026-02-14 | UX-032 V2: Dashboard redesign (3-act structure, per-user drill-down, combined search table), 5 new event types (autocomplete_search/click, sort_change, page_change, cross_module_nav), debounced search tracking fix, migration 039 |
| 2026-02-14 | UX-032 V2 final: Error event type (12th), immediate error flush, BFF whitelist fix (6→12 types), year sort fix, errors section card redesign, DELETE endpoint for clearing errors, migration 040 |
| 2026-02-14 | Error message UX: universal "Er is iets misgegaan", shared ErrorReport component, "Fout melden" → countdown → router.back(), no English leaks |
| 2026-02-14 | Error trigger tracking: `lastTrigger` ref in module-page, "Actie" pill in dashboard |
| 2026-02-14 | Comprehensive error tracking: 7 components instrumented (expanded-row, detail-panel, filter-panel, search-bar, feedback, login, homepage) |
| 2026-02-14 | Complete UI event tracking: 9 tracking points, `external_link` event type (13th), 404/react_render error tracking, autocomplete selections, detail-panel export/nav |
| 2026-02-14 | Comprehensive error tracking: 7 components instrumented (expanded-row, detail-panel, filter-panel, search-bar, feedback-button, login-form, public-homepage). 7 new trigger labels in dashboard |
| 2026-02-16 | UX-034: Committed search tracking. Killed debounce, track Enter/autocomplete only. `search_end` (14th event type) with duration + exit_action. `search_id` links engagement to originating search. Retry chains via `prev_search_id`. Deferred result counting. Dashboard SearchSection redesign: 4 KPIs, enriched table (Via/Duur/Engagement), zero results with retry badges, engagement breakdown. Migration 052 |
| 2026-02-23 | Email template standards: width 480→600px, body font 15→16px across all 3 templates. Auto-link prevention via zero-width space. Documented in Email Template Standards section. |
