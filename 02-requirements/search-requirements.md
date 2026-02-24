# Search Requirements (V2)

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** V2 - Search Platform
**Date:** 2026-01-23 (Updated: 2026-02-08)
**Status:** In Development

> **Scope:** This document covers V2 Search Platform requirements (UX-XXX specs).
> **Release status:** See `docs/VERSIONING.md` for which version each feature shipped in.
> **Backlog:** See `02-requirements/backlog.md` for planned/future items.
>
> This file is the **requirement spec** (what to build, behavior details).
> VERSIONING.md is the **release record** (when it shipped, which version).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Goals](#vision--goals)
3. [Search Bar Requirements](#search-bar-requirements)
4. [Filter Requirements by Module](#filter-requirements-by-module)
5. [Performance Requirements](#performance-requirements)
6. [User Experience Requirements](#user-experience-requirements)
7. [Technical Constraints](#technical-constraints)
8. [User Stories](#user-stories)
9. [Acceptance Criteria](#acceptance-criteria)

---

## Executive Summary

### Current State (WordPress)
- **Search Speed:** 5 seconds (unacceptable)
- **Search Engine:** MySQL FULLTEXT (limited capabilities)
- **Interface:** Basic keyword search + advanced filters per module

### Target State (V2.0)

**Fast, Intelligent Search Bar:**
- **Speed:** <100ms (instant, Google-like)
- **Interface:** Global search bar with intelligent autocomplete
- **Capabilities:**
  - Simple keyword search
  - Fuzzy/typo-tolerant matching
  - Instant suggestions as you type
  - Advanced filters (collapsible)
  - Cross-module search with module filtering
- **User Experience:** Intuitive, no syntax required

> **Future Version Context:** This search bar architecture is designed to support future Research Mode (AI conversational interface). The Typesense engine and API layer will integrate with AI in V3.0. See: `research-mode-vision.md`

### Key Principle
Search should be as intuitive as Google - requiring zero technical knowledge from users.

---

## Vision & Goals

### Product Vision
*"Alle overheidsbestedingen snel doorzoekbaar en vergelijkbaar maken"*

Enable professionals (journalists, researchers, policymakers, financial analysts) to:
- Quickly search and understand complex government financial data
- Compare spending across years, recipients, and modules
- Discover insights through powerful filtering
- Export data for further analysis

### Success Metrics (V2.0)

| Metric | Current | Target V2.0 |
|--------|---------|-------------|
| Search response time | 5s | <100ms |
| User searches/day | Unknown | 1000+ |
| Search success rate | Unknown | 95%+ |
| Advanced filter usage | Low | 40%+ |

---

## Search Bar Requirements

### SR-001: Global Search Bar Presence

**Requirement:** Search bar appears on every page (except support, account, admin sections)

**Details:**
- Fixed position in header/navigation
- Always visible (no scroll-away)
- Single unified search interface (no separate search pages)
- Consistent across all modules

**Priority:** P0 (Critical)

---

### SR-002: Search Input Behavior - Progressive Disclosure

**Requirement:** Search provides intelligent assistance as user types

**Flow:**
1. **After 3 characters typed:** Show autocomplete suggestions (recipient names)
2. **While typing (debounced 300ms):** Show instant results preview (top 3-5 matches)
3. **If no results:** Show "Did you mean..." suggestions

**Example:**
```
User types: "pro"
→ Shows autocomplete: "ProRail B.V.", "Provincie Noord-Holland", "Prorail Holding"

User types: "prorail 202"
→ Shows instant preview:
   1. ProRail B.V. - €461M (2024)
   2. Prorail Holding - €23M (2024)
   3. ProRail Stations - €12M (2024)

User types: "prorai" (typo)
→ Shows: "Did you mean: ProRail?"
```

**Priority:** P0 (Critical)

---

### SR-003: Debouncing Strategy

**Requirement:** Optimize API calls while maintaining responsiveness

**Details:**
- Wait 300ms after user stops typing before triggering search
- Cancel in-flight requests if user continues typing
- Show loading indicator if request takes >200ms

**Priority:** P1 (High)

---

### SR-004: Autocomplete Suggestions

**Requirement:** Suggest relevant content based on partial input

**What to suggest:**
1. **Recipient names** (highest priority)
   - Exact matches first
   - Partial matches
   - Fuzzy matches (typos)
2. **Common search terms** (medium priority)
   - Module names
   - Budget categories
   - Regulation names
3. **Past user searches** (if logged in)
   - User's recent searches
   - Popular searches across platform

**Display:**
- Maximum 8 suggestions
- Grouped by type (Recipients | Terms | Recent)
- Keyboard navigable (arrow keys, Enter)

**Priority:** P1 (High)

---

### SR-005: Query Types Support

**Requirement:** Support diverse query patterns without requiring syntax knowledge

**Supported Query Types:**

| Type | Example | Behavior |
|------|---------|----------|
| Simple keyword | `prorail` | Search all fields |
| Multi-word phrases | `prorail infrastructure 2024` | Implicit AND |
| Exact phrase | `"Financieel Instrument"` | Exact match |
| Boolean (power users) | `prorail AND infrastructure` | Logical operations |
| Wildcards (power users) | `prorail*` | Prefix matching |
| Fuzzy/typo-tolerant | `prorai` | Auto-correct (2 char edits) |
| Filters in query | `prorail year:2024` | Parse and apply filters |
| Numeric ranges | `amount:1000000-5000000` | Filter by range |

**Priority:** P0 (Critical for keyword/phrase), P1 (High for boolean/wildcards)

**V2.0 Implementation Scope (2026-02-12):**

| Type | V2.0 | Syntax | Behavior |
|------|------|--------|----------|
| Multi-word AND | ✅ | `rode kruis` | All words must be present (default) |
| Exact phrase | ✅ | `"rode kruis"` | Consecutive words in order |
| Prefix/wildcard | ✅ | `prorail*` | Word starts with prefix |
| Single keyword | ✅ | `prorail` | Word boundary match (existing) |
| Fuzzy/typo-tolerant | V2.1 | — | Typesense `num_typos` |
| Field-specific | V3+ | `leverancier:prorail` | Search within specific field |
| Boolean operators | V3+ | `prorail AND NOT ns` | Explicit boolean logic |
| Filters in query | V3+ | `prorail year:2024` | Query-embedded filters |
| Numeric ranges | V3+ | `amount:1000000-5000000` | Query-embedded ranges |

**Edge Case Handling (parser sanitization):**

| Input | Behavior |
|-------|----------|
| `"rode kruis` (unmatched quote) | Strip stray quotes → AND search: `rode kruis` |
| `rode kruis"` (trailing quote) | Strip stray quotes → AND search: `rode kruis` |
| `""` or `"  "` (empty quotes) | Treat as empty search |
| `*` (bare asterisk) | Treat as empty search |
| `pro rail*` (asterisk with spaces) | AND search: `pro rail` (prefix only for single words) |
| `*prorail` (leading asterisk) | AND search: `prorail` (strip leading `*`) |

**"Gevonden in" Column Behavior (V2.0 known limitation):**

The "Gevonden in" column identifies which non-primary field matched the search. With multi-word AND, this uses a heuristic: the first word's pattern determines the matched field. This is acceptable because:
- "Gevonden in" is a UI hint, not a data filter — no results are lost
- Most multi-word searches target the same entity (both words in same field)
- Cross-field multi-word matches (word 1 in primary, word 2 in regeling) are rare

The same heuristic applies to relevance scoring (3-tier ranking). Results still appear correctly, ordering may be slightly suboptimal for cross-field matches.

**Deferred to V2.1:** Accurate multi-field match reporting (check all words, report all matched fields). See backlog: "Search: Accurate Multi-Field Match Reporting".

---

### SR-006: No Syntax Required

**Requirement:** Users should NEVER need to learn query syntax

**Design Principles:**
- Natural language input works by default
- Boolean operators optional (not required)
- Filters accessible via UI (not just syntax)
- Search help available but not necessary
- "Just works" like Google search

**Documentation:**
- Provide "Search Tips" page (optional reference)
- Include examples in placeholder text
- Tooltip hints on hover

**Priority:** P0 (Critical)

---

### SR-007: Search Scope - Universal by Default

**Requirement:** Search across all modules by default, with easy filtering

**Default Behavior:**
- Search all 7 modules simultaneously
- Display results grouped by module
- Show count per module (e.g., "23 in Financiële Instrumenten, 12 in Apparaatsuitgaven")

**Module Filtering:**
- Module tabs (current design) remain available
- If user is on specific module page, search prioritizes that module but still shows others
- Filter panel allows checking/unchecking modules

**Example:**
```
User on "Financiële Instrumenten" page searches "prorail"
→ Shows Financiële Instrumenten results first
→ Also shows "Found in other modules: Apparaatsuitgaven (3), Publiek (1)"
→ User can click to see those results
```

**Priority:** P0 (Critical)

---

### SR-008: Searchable Fields (All Modules)

**Requirement:** All key fields must be searchable with intelligent field weighting

**Searchable Fields by Priority:**

**Priority 1 (Highest weight):**
- Ontvanger (Recipient name) - **exact match = 100 points**
- KvK nummer (if available)

**Priority 2 (High weight):**
- Begrotingsnaam (Budget name)
- Instrument
- Regeling (Regulation)
- Kostensoort (Apparaatsuitgaven only)
- Leverancier (Inkoopuitgaven only)
- Gemeente/Provincie (location-specific modules)

**Priority 3 (Medium weight):**
- Artikel, Artikelonderdeel
- Beleidsterrein, Beleidsnota (Gemeentelijke only)
- Organisatie, Regio, Staffel, Onderdeel (Publiek only)
- Categorie, Staffel (Inkoopuitgaven)
- Omschrijving, Detail fields

**Priority 4 (Low weight, filterable but not primary search):**
- Year (2016-2024)
- Bedrag/Amount (filterable, not text searchable)
- Projectnummer (Publiek only)

**Priority:** P0 (Critical)

---

### SR-009: Advanced Filters - Collapsible Panel

**Requirement:** Provide advanced filters without overwhelming the interface

**Proposed Design:**
- **Always visible:** Search bar + basic module tabs
- **Collapsible:** "Filters" button that expands filter panel
- **Expanded State:** Shows module-specific filters (see SR-010)
- **Visual:** Badge count showing active filters (e.g., "Filters (3)")

**Behavior:**
- Filters persist during session
- "Clear All" button to reset
- Filters update results in real-time (no Apply button - decided 2026-01-23)

**Priority:** P1 (High)

---

### SR-010: Filter Requirements by Module

**Requirement:** Each module has specific filters based on available data fields

(See detailed breakdown in [Filter Requirements by Module](#filter-requirements-by-module) section)

**Priority:** P1 (High)

---

## Filter Requirements by Module

### Module 1: Financiële Instrumenten

**Filters:**
1. **Begrotingsnaam** (Budget name) - Dropdown
2. **Artikel** - Dropdown
3. **Artikelonderdeel** - Dropdown
4. **Instrument** - Dropdown
5. **Detail** (nieuw in 2024 data) - Dropdown
6. **Regeling** - Dropdown
7. **Year Range** - Slider (2016-2024)
8. **Amount Range** - Min/Max input

**Default Columns:** Artikel, Regeling

*Note: Max 2 extra columns displayed (MAX_SELECTED_COLUMNS = 2)*

---

### Module 2: Apparaatsuitgaven

**Filters:**
1. **Begrotingsnaam** - Dropdown (cascading)
2. **Artikel** - Dropdown (cascading)
3. **Detail** - Dropdown (cascading)
4. **Kostensoort** (Cost type) - Dropdown (cascading, added 2026-02-08)
5. **Amount Range** - Min/Max input

**Default Columns:** Artikel, Detail

---

### Module 3: Inkoopuitgaven

**Filters:**
1. **Ministerie** (Ministry) - Dropdown (unique to this module)
2. **Categorie** (Category) - Dropdown (unique to this module)
3. **Staffel** (Amount bracket) - Dropdown (unique to this module)
4. **Year Range** - Slider (2017-2024) *Note: starts 2017*

**Default Columns:** Categorie, Staffel

---

### Module 4: Provinciale Subsidieregisters

**Filters:**
1. **Provincie** (Province) - Dropdown (cascading)
2. **Omschrijving** - Dropdown (cascading, added 2026-02-08)
3. **Amount Range** - Min/Max input

**Default Columns:** Provincie, Omschrijving

---

### Module 5: Gemeentelijke Subsidieregisters

**Filters:**
1. **Gemeente** (Municipality) - Dropdown (cascading)
2. **Beleidsterrein** (Policy area) - Dropdown (cascading)
3. **Regeling** - Dropdown (cascading, added 2026-02-08)
4. **Omschrijving** - Dropdown (cascading, added 2026-02-08)
5. **Amount Range** - Min/Max input

**Default Columns:** Gemeente, Omschrijving

---

### Module 6: Publiek (Public Implementation Organizations)

**Filters:**
1. **Organisatie** (Organization: RVO, COA, NWO, etc.) - Dropdown (cascading)
2. **Regeling (RVO/COA)** - Dropdown (cascading)
3. **Trefwoorden (RVO)** (Keywords) - Dropdown (cascading, added 2026-02-08)
4. **Sectoren (RVO)** (Sectors) - Dropdown (cascading, added 2026-02-08)
5. **Provincie (RVO)** (Province/Region) - Dropdown (cascading, added 2026-02-08)
6. **Staffel (COA)** - Dropdown (cascading, added 2026-02-08)
7. **Onderdeel (NWO)** - Dropdown (cascading, added 2026-02-08)
8. **Amount Range** - Min/Max input

**Default Columns:** Organisatie

> **Note (2026-02-08):** The publiek source table has a `provincie` column, not `regio`. UI label shows "Provincie (RVO)" to match the actual data column.

> **Future Version Context:** This module has GIS/location data (POINT geometry field). Geographic search will be enabled in V3.0. See: `research-mode-vision.md`

---

### Module 7: Integraal (Cross-Module Search)

**Filters:**
1. **Modules per ontvanger** (Modules per recipient) - Multi-select (unique)
2. **Betalingen per ontvanger** (Payments per recipient) - Bracket select: 1, 2-10, 11-50, 50+ (UX-022)
3. **Total Amount Range** - Min/Max input

**Default Columns:** Betalingen

---

### Common Filters (All Modules)

**Should be available on every module:**
1. **Year Range** (adjustable per module's data availability)
2. **Amount Range** (Bedrag min/max)
3. **Sort by:**
   - Ontvanger (A-Z, Z-A)
   - Amount (Highest-Lowest, Lowest-Highest)
   - Year count (Most years-Least years)
   - Relevance (search score)

---

### Filter UI Design

**Desktop:**
```
[Filters (3 active)]  ← Collapsible button with badge

When expanded:
┌─────────────────────────────────────────────────┐
│ Filters                                [Clear]  │
├─────────────────────────────────────────────────┤
│ Year Range: [========●●====] 2020 - 2024       │
│                                                 │
│ Amount (€):  [Min: 1,000,000] [Max: 10,000,000]│
│                                                 │
│ Begrotingsnaam:  [Select...             ▾]     │
│ Instrument:      [Select...             ▾]     │
│ Regeling:        [Select...             ▾]     │
└─────────────────────────────────────────────────┘
```

**Mobile:**
- Bottom sheet that slides up
- Simplified filters (most important only)
- Real-time updates (same as desktop)

---

## Performance Requirements

### PERF-001: Search Response Time Targets

**Requirement:** Fast, responsive search experience

| Query Type | Current | Target V2.0 |
|------------|---------|-------------|
| **Simple keyword** | 5s | <100ms |
| **Multi-word phrase** | 5s | <150ms |
| **With 3+ filters** | 7s | <300ms |
| **Complex boolean** | 8s | <500ms |
| **Autocomplete** | N/A | <50ms |

**Measurement:**
- P50 (median): Target times
- P95 (95th percentile): Target × 2
- P99 (99th percentile): Target × 3

**Priority:** P0 (Critical)

---

### PERF-002: Real-Time Search (As You Type)

**Requirement:** Autocomplete and instant results while user types

**Behavior:**
- Trigger after 3 characters
- Debounce 300ms (wait for user to stop typing)
- Cancel in-flight requests if user continues typing
- Show loading indicator if >200ms

**Performance:**
- Autocomplete: <50ms response
- Instant results: <100ms response
- Max concurrent requests: 1 (cancel previous)

**Priority:** P1 (High)

---

### PERF-003: Concurrent User Capacity (V2.0)

**Requirement:** Support multiple users simultaneously

**V2.0 Targets:**
- 100 concurrent users (search bar)
- 1,000 searches/minute
- 10,000 searches/hour

**Scaling:**
- Typesense handles horizontal scaling
- Railway auto-scales backend

**Priority:** P1 (High)

---

## User Experience Requirements

### UX-001: Zero Learning Curve

**Requirement:** Users should be able to search immediately without training

**Design Principles:**
- Prominent search bar on every page
- Placeholder text with example query
- Instant feedback (autocomplete, suggestions)
- Clear error messages with suggestions
- Contextual help (tooltips, hints)

**Examples:**
- Placeholder: "Zoek op ontvanger, regeling, of bedrag..."
- Error: "Geen resultaten voor 'prorai'. Bedoelde u: ProRail?"
- Tooltip: "Tip: Gebruik cijfers voor jaar (2024) of bedrag (>1000000)"

**Priority:** P0 (Critical)

---

### UX-002: Default View (Before Search)

**Requirement:** Show meaningful data immediately when user lands on search page

**Behavior:**
- Display a random selection of recipients
- Only include recipients with amounts in at least 4 different years
- Truly random order (not sorted by amount or name)
- **Randomize on:**
  - Initial page load
  - Browser refresh
  - **Switching between modules** (each module shows fresh random selection)

**Rationale:**
- Users immediately see the type of data available
- Demonstrates multi-year coverage
- Encourages exploration
- No empty state on first visit
- Module switching = fresh discovery opportunity

**Priority:** P0 (Critical)

**Status:** ✅ Implemented 2026-01-29

---

### UX-002a: Search Relevance Ranking

**Requirement:** When searching, show most relevant results first (Google-like behavior)

**Behavior:**
- Ranking priority (1 = highest):
  1. **Exact match:** Search term equals Ontvanger (e.g., "politie" → "Politie")
  2. **Starts with:** Ontvanger starts with search term (e.g., "Politieacademie")
  3. **Word boundary:** Search term as separate word (e.g., "VTS POLITIE NEDERLAND")
  4. **Contains:** Search term anywhere in Ontvanger (e.g., "Het Oude Politiebureau")
- **Tiebreaker within each tier:** Amount (descending) - users typically care about biggest money flows first

**Rationale:**
- Users expect best matches at top (Google-like behavior)
- Without ranking, "Politiehonddresseervereniging" (€6K) appeared before "Politie" (€6.5B)
- Industry standard UX pattern

**Implementation:**
- PostgreSQL CASE expression for relevance scoring
- Applied to all three data functions: aggregated view, source table, integraal

**Priority:** P0 (Critical)

**Status:** ✅ Implemented 2026-01-29

**Design Doc:** `docs/plans/2026-01-29-search-relevance-ranking.md`

---

### UX-002b: Dutch False Cognate Filtering (V2.1)

**Requirement:** Exclude semantically unrelated results that share a prefix with the search term

**Problem:**
- "politie" (police) matches "Politieke" (political) via substring match
- These are different domains - users searching for police don't want political parties

**Behavior:**
- For searches ending in "-ie", exclude matches continuing with "k" (which forms "-iek")
- Pattern: `search_term([^k]|$|\s)` using PostgreSQL regex
- Example: "politie" → Matches: Politie, Politieacademie, Nationale Politie
- Example: "politie" → Excludes: Politieke beweging DENK

**Implementation:**
- `build_search_condition()` helper function in `modules.py`
- Applied to all 6 search locations (aggregated views, source tables, integraal, autocomplete)
- Standard ILIKE for non "-ie" searches (unchanged behavior)

**Priority:** P1 (V2.1)

**Status:** ✅ Implemented 2026-01-29

**V2.1 Complete:**
- Dutch word rules (-ie/-iek exclusion)
- Option C ranking (exact match first, then by totaal)

**V2.1 Roadmap:**
- Embeddings with Cohere embed-multilingual-v3 (~€1/month)

**Design Doc:** `docs/plans/2026-01-29-semantic-search-design.md`

---

### UX-002c: Word-Boundary Search

**Requirement:** Search matches only at word boundaries, not arbitrary substrings

**Behavior:**
- "politie" matches "Politie", "Nationale Politie", "VTS POLITIE NEDERLAND"
- "politie" does NOT match "Designpolitie", "Politieacademie" (substring matches)
- Uses PostgreSQL regex `~* '\ypolitie\y'` for word boundaries

**Rationale:**
- Prevents inflated cross-module counts ("Ook in: Inkoop (28)" showed substring matches)
- More intuitive search results

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-01-31

**Design Doc:** `docs/plans/2026-01-31-word-boundary-search.md`

---

### UX-002d: "Ook in" Column (formerly "Gevonden in")

**Requirement:** Show which secondary field also contains the search term

**Behavior:**
- Column header: "Ook in" (renamed from "Gevonden in" — old name implied broken promise when showing "-")
- When search matches a secondary field (Regeling, Artikel, etc.): Shows matched value + field label
- When search matches ONLY the primary field (name): Empty cell (no dash)
- SQL enrichment: rows that matched on primary field are checked for secondary field matches too (UX-038)

**Example:**
Search "covid" shows:
- Ontvanger: "Geanonimiseerde ontvanger(s) van Subsidies voor ... COVID-19"
- Ook in: "Regeling subsidie financiering vaste lasten MKB COVID-19" / Regeling

**Implementation:** Typesense highlight data + `_enrich_matched_info()` SQL query (~20-50ms)

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-01-31, updated 2026-02-20 (UX-038)

---

### UX-002e: "+X meer" Indicator for Extra Columns

**Requirement:** Show when multiple distinct values exist for aggregated recipients

**Behavior:**
- Extra columns show most frequent value (MODE aggregation)
- If recipient has multiple distinct values: Shows "+X meer" below the value
- Example: "Regeling ABC" with "+5 meer" indicates 6 total regelingen
- Click "+X meer" opens detail panel

**Styling:**
- Font: 12px
- Color: Navy Medium (#436FA3)
- Cursor: pointer
- No underline or hover effect

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-01-31

---

### UX-002f: Totals Row for Search Results

**Requirement:** Show aggregated totals at bottom of table when searching or filtering

**Behavior:**
- Appears only when searching or filtering (not on default random view)
- Shows accurate totals across ALL matching results, not just current page
- Backend aggregates SUM per year column and grand total
- Displayed in `<tfoot>` with navy dark styling matching header

**Display:**
- Row styling: Navy dark background, white text, matches header
- Column 1: Empty (expand button placeholder)
- Column 2: "Totaal" + count (e.g., "289 ontvangers")
- Extra columns: Empty cells (placeholder)
- Year columns: Sum of all matching results per year
- Grand total: Sum across all years

**Plural handling:**
- 1 result: "1 ontvanger"
- 2+ results: "289 ontvangers" (adds 's')

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-03

---

### UX-006: Advanced Filter Features

**Requirement:** Enhance filter dropdowns with selection visibility and automatic column display

**Behavior:**

**Feature 1: "GESELECTEERD" section in dropdown**
- Selected items appear at top of dropdown with "GESELECTEERD" header
- Unselected items below with "ALLE OPTIES" header
- Matches old WordPress system UX pattern

**Feature 2: Column selector independent of filters (revised 2026-02-23)**
- Column selector (Kolommen) is always visible, regardless of active filters
- User controls column selection via Kolommen button (max 2 columns, UX-005)
- Filters do NOT auto-override user column selection
- ~~Previous behavior: active filter fields auto-replaced columns, Kolommen hidden~~

**Rationale:**
- Users need visibility of their active filter selections
- Users also need the ability to choose columns independently of filters
- Original auto-override confused users — selections had no effect when filters active

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-02, revised 2026-02-23

---

### UX-007: Clickable Hyperlinks for Drill-Down

**Requirement:** Extra column values and expanded row grouped values are clickable to filter the data

**Behavior:**
- Click extra column value (Artikel, Regeling, etc.) → filters table by that value
- Click expanded row grouped value → filters table by that value
- **Clear start:** Click clears ALL existing filters and applies only the clicked filter
- All rows collapse when new filtered data loads

**Visual:**
- Hover: Text turns pink (#E62D75) + underline
- Cursor: pointer
- No underline when not hovering

**Clickable columns per module:**

| Module | Clickable Extra Columns |
|--------|------------------------|
| Instrumenten | Artikel, Regeling |
| Apparaat | Artikel, Detail |
| Inkoop | Categorie, Staffel |
| Provincie | Provincie, Omschrijving |
| Gemeente | Gemeente, Omschrijving |
| Publiek | Organisatie |

**Implementation:**
- `onFilterLinkClick` callback prop on DataTable and ExpandedRow
- Direct state update via `setFilters()` (not URL navigation to avoid render loops)
- `useEffect` resets expanded state when data changes

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-04

---

### UX-009: Search Tips Popover

**Requirement:** Help users understand the power of the new search system

**Behavior:**
- Info icon button next to search bar (matches Filters button style)
- First-visit pulse animation (pink glow, localStorage persisted)
- Navy popover with pink accent (brand-aligned)
- Dynamic content per module showing searchable fields

**Content (Dutch):**
- "SLIM ZOEKEN" header
- Module-specific searchable fields list
- 3 examples: single term, multiple words, prefix
- Tip directing to filters for more precision

**Rationale:**
- Exception to "don't explain" rule
- Users burned by poor WordPress search need confidence in new system
- One-time attention grab via pulse animation

**Priority:** P2 (Medium)

**Status:** ✅ Implemented 2026-02-02

---

### UX-010: Google Search Link for Recipients

**Requirement:** Provide quick access to Google search for any recipient name

**Behavior:**
- Small external link icon (↗) appears next to every recipient name in main table
- Always visible (not hover-only) - this is important functionality
- Click opens Google search for recipient name in new tab
- Tooltip "Zoek op Google" appears instantly on hover (centered above icon)

**Rationale:**
- Matches WordPress detail page feature ("Zoek op Google" link)
- Enables quick research/verification of recipient identity
- High value, low effort feature

**Visual:**
- Icon: Lucide ExternalLink (14px)
- Color: Navy medium (`--navy-medium`) → pink on hover
- Tooltip: CSS-only instant tooltip, single-line, centered

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-06

---

### UX-011: Module-Specific Amount Explanations

**Requirement:** Table footer explains the type of amounts shown, varying by module

**Behavior:**
- Footer text below table explains what the amounts represent
- Text varies based on module:
  - **Default** (Instrumenten, Apparaat, Provincie, Gemeente): "Absolute bedragen in €"
  - **Inkoop**: "Gemiddelde staffelbedragen in €, incl. BTW"
  - **Publiek**: "RVO, ZonMW en NWO: absolute bedragen. COA: gemiddeld staffelbedrag incl. BTW"

**Rationale:**
- Inkoop and COA (Publiek) use staffelbedragen (bracketed amount ranges), not precise figures
- Users need to understand they're seeing estimated midpoints, not exact amounts
- Prevents misinterpretation of data precision

**Related:** Staffelbedrag Explanation (backlog item) - user education on what staffelbedragen mean

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-06

---

### UX-012: Data Availability Indicators

**Requirement:** Distinguish "no data" from "real zero" in year cells

**Behavior:**
- Years outside an entity's data availability range show em-dash `—` instead of `0`
- Tooltip: "Geen data beschikbaar voor deze periode"
- Years within range show actual amount (including `0` for confirmed zero)
- Collapsed years column (2016-20) only sums years within availability range
- Expanded rows inherit availability from parent row
- **Totals row:** Shows em-dash for years where ALL visible rows have no data; sums normally otherwise

**Granularity:**
| Module | Level |
|--------|-------|
| instrumenten, inkoop, apparaat | Module-level (same range for all rows) |
| gemeente | Per gemeente |
| provincie | Per provincie |
| publiek | Per source (RVO, COA, NWO, ZonMW) |

**API Response:**
- Each row includes `data_available_from` and `data_available_to` fields
- When filtered to single entity: uses entity-specific range
- When unfiltered: uses full range (2016-2024)

**Data Management:**
- Year ranges maintained in `data_availability` table via Supabase Studio
- Backend restart required after changes (clears in-memory cache)
- See `scripts/data/DATA-UPDATE-RUNBOOK.md` Step 4

**Design Doc:** `docs/plans/2026-02-06-data-availability-indicators-design.md`

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-07

---

### UX-013: Staffelbedrag Explanation Popover

**Requirement:** Help users understand what staffelbedragen mean in Inkoop and Publiek modules

**Behavior:**
- "Staffel" filter label in filter panel is clickable (dotted underline, pink hover) → opens popover below
- Word "staffelbedrag(en)" in footer text is also clickable (dotted underline) → opens popover above
- Shared `StaffelPopover` component with `position` prop ("above"/"below")
- Popover matches search tips pattern (navy dark bg + pink accent bar)
- Click outside closes popover

**Content (Dutch):**
- "STAFFELBEDRAGEN" header
- Explanation: amounts published as ranges, shown as midpoints
- Staffel 1-13 range table
- Source reference: data.overheid.nl

**Rationale:**
- Inkoop and COA (Publiek) show averaged staffel amounts, not precise figures
- Users unfamiliar with government data methodology need explanation
- Builds on UX-011 module-specific footer text

**Related:** UX-011 (Module-Specific Amount Explanations)

**Priority:** P2 (Medium)

**Status:** ✅ Implemented 2026-02-07

---

### UX-014: Cookie Banner (GDPR Disclosure)

**Requirement:** Display essential cookie disclosure banner on first visit

**Behavior:**
- Simple bottom bar, non-blocking (does NOT require consent mechanism)
- Shows on first visit, checks localStorage for dismissal
- Dismisses permanently on "OK" click
- Links to `/privacybeleid` (privacy policy)
- Fixed bottom position, z-index 50, fade-in animation

**Content (Dutch):**
"Deze website gebruikt alleen noodzakelijke cookies voor het functioneren van de site."

**Rationale:**
- Essential cookies only = simple disclosure (no consent mechanism needed under GDPR)
- Self-hosted fonts (no external Google Fonts requests)
- No analytics in V2.0

**Related:** Privacy policy page (`/privacybeleid`)

**Priority:** P0 (Legal requirement for launch)

**Status:** ✅ Implemented 2026-01-27

> **Note:** When analytics is added (V2.1+), replace simple banner with proper consent mechanism.

---

### UX-015: Error Boundary

**Requirement:** Catch JavaScript errors in components and show user-friendly error message

**Behavior:**
- Wraps module page components
- On error: shows "Er is iets misgegaan" with "Probeer opnieuw" button
- Prevents blank white screen on JavaScript errors
- Logs errors to console (production: would send to error tracking when added)

**Priority:** P2 (Medium)

**Status:** ✅ Implemented 2026-01-29

---

### UX-016: XLS Export

**Requirement:** Export data to Excel (.xlsx) format in addition to CSV

**Behavior:**
- "XLS" button alongside CSV in table toolbar
- Max 500 rows (same as CSV)
- Uses xlsx library for generation
- Filename: `rijksuitgaven-{moduleId}-{YYYY-MM-DD}.xlsx`
- Includes: Primary value, year columns, Totaal

**Rationale:**
- Many users prefer Excel format directly (avoids CSV import step)
- Dutch organizations commonly use Excel for data analysis

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-01-31

---

### UX-017: Visual Design System (Header + Table + Brand)

**Requirement:** Comprehensive visual polish applying brand identity consistently across all pages

**Changes implemented:**
- **Header:** Compact 2-row layout (~100px height), grouped module tabs with gaps
- **Module names:** Full Dutch names (Financiële instrumenten, Provinciale subsidieregisters, etc.)
- **Page background:** White → #E1EAF2 (Gray Light) with gradient + white content card
- **Table header:** Navy #0E3261, rounded corners, 14px semibold, right-aligned year columns
- **Totaal column:** Bold + #D0DEEA background tint
- **Logo:** Full logo on desktop, icon only on mobile
- **Amount formatting:** Consistent text-xs for all amounts
- **Anomaly highlighting:** Subtle red background + px-2 padding
- **Column widths:** Primary 160px, extra 140px, years 95px, totaal 110px
- **Collapse button:** Visible "< 2016-20" header for collapsible years
- **Table layout:** `table-fixed` for predictable widths

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-01-29 through 2026-02-02

---

### UX-018: Mobile Message Banner

**Requirement:** Friendly message for users on mobile devices that the app works best on larger screens

**Behavior:**
- Detects viewport < 768px
- Bottom sheet with slide-up animation (300ms ease-out)
- Navy dark background, Monitor icon, pink CTA
- Dutch copy: "Beter op een groter scherm"
- "Toch doorgaan" button (non-blocking)
- One-time dismiss via localStorage (never shows again on that device)
- Does NOT block access to the app

**Rationale:**
- V2.0 is desktop-first for data work
- Mobile banner is lighter than full responsive audit
- Users can still continue if they choose

**Related:** UX-003 (Mobile Responsiveness - broader scope, deferred)

**Priority:** P0 (V2.0 launch requirement)

**Status:** ✅ Implemented 2026-02-05

---

### UX-019: Table Info Popover

**Requirement:** Expand the existing (I) search tips popover into a comprehensive "Hoe werkt deze tabel?" guide covering search, row expansion, anomaly marking, and filters.

**Behavior:**
- Replaces existing "Slim zoeken" popover content with 4 sections:
  1. **Zoeken** — explains cross-field search and "Gevonden in" column
  2. **Rijen uitklappen** — explains clickable ontvangers and grouping menu
  3. **Rode markering** — explains 50%+ YoY anomaly highlighting
  4. **Filters** — explains filter panel AND clickable table values for quick filtering
- Same popover style (navy dark bg, pink accent bar)
- Same (I) icon position and pulse behavior

**Priority:** P1

**Status:** ✅ Implemented 2026-02-08

---

### UX-020: Filter Menu Auto-Open on Column Click

**Requirement:** When clicking a value in the extra columns (or expanded row detail), the filter panel should automatically open in addition to applying the filter.

**Behavior:**
- Clicking a clickable value in extra columns applies the filter AND expands the filter panel
- User immediately sees which filter was applied
- No other visual changes — just the panel opens automatically

**Priority:** P1

**Status:** ✅ Implemented 2026-02-08

---

### UX-021: Cascading Bidirectional Filters

**Requirement:** Filter dropdowns show context-aware options with counts. Selecting a value in one filter constrains options in all other filters (bidirectional), with counts showing how many aggregated rows match each option.

**Behavior:**
- Each filter dropdown shows `(count)` next to every option value (Dutch locale formatting)
- Selecting a value in one filter updates all OTHER filters' options and counts
- Pattern: when computing options for field X, apply WHERE clauses from all fields EXCEPT X
- Invalid selections (selected value no longer has matching rows) show `(0 resultaten)` in red
- Invalid selections are NOT auto-cleared (user decides)
- Initial load with no filters shows full unfiltered counts
- Debounced 200ms before fetching new options (prevents excessive API calls)
- Graceful degradation: on error, keeps previous options

**Scope:**
- All 6 modules (instrumenten, apparaat, inkoop, provincie, gemeente, publiek)
- Integraal module excluded (no cascading filters)
- Counts use `COUNT(DISTINCT primary_field)` to match aggregated table row counts

**Filter fields per module:**

| Module | Cascading Filter Fields |
|--------|------------------------|
| Instrumenten | Begrotingsnaam, Artikel, Artikelonderdeel, Instrument, Regeling |
| Apparaat | Begrotingsnaam, Artikel, Detail, Kostensoort |
| Inkoop | Ministerie, Categorie, Staffel |
| Provincie | Provincie, Omschrijving |
| Gemeente | Gemeente, Beleidsterrein, Regeling, Omschrijving |
| Publiek | Organisatie, Regeling, Trefwoorden, Sectoren, Provincie, Onderdeel, Staffel |

**Technical Implementation:**
- Backend: `get_cascading_filter_options()` in `modules.py` — 5 parallel queries via `asyncio.gather()`
- API: `POST /{module}/filter-options` endpoint with `active_filters` body
- BFF: `app/src/app/api/v1/modules/[module]/filters/route.ts` (POST proxy)
- Frontend: `fetchCascadingFilterOptions()` in `api.ts`, controlled MultiSelect mode in `filter-panel.tsx`

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-08

---

### UX-022: Betalingen Column + Filter for Integraal

**Requirement:** Show total payment record count per recipient in the integraal module, with bracket-based filtering. Replaces the old "Instanties per ontvanger" filter (source_count, max 5) with actual payment counts.

**Behavior:**
- New `record_count` column in `universal_search` materialized view counts total source rows per recipient
- "Betalingen per ontvanger" filter with bracket options: 1, 2-10, 11-50, 50+
- "Betalingen" column visible by default in integraal via Kolommen selector
- Column is sortable (sort_by=extra-betalingen → ORDER BY record_count)
- Kolommen button now enabled for integraal module

**Data Distribution (production, 463,731 recipients):**

| Bracket | Recipients | % |
|---------|-----------|---|
| 1       | 247,208   | 53.3% |
| 2-10    | 197,797   | 42.7% |
| 11-50   | 16,580    | 3.6% |
| 50+     | 2,146     | 0.5% |

**Technical Implementation:**
- SQL: `029-universal-search-record-count.sql` — DROP + recreate with `COUNT(*) AS record_count` + index
- Backend: `BETALINGEN_BRACKETS` dict maps bracket strings to safe SQL conditions (no parameterization needed)
- API: `betalingen` query param (string), `columns=betalingen` for extra column
- Frontend: Bracket select in filter-panel, column-selector entry, SortableHeader on extra columns

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-08

---

### UX-023: Custom GroupingSelect Dropdown with Counts

**Requirement:** Replace the native `<select>` dropdown in the expanded row with a custom single-select dropdown matching the filter panel design, showing distinct value counts per grouping field.

**Behavior:**
- Custom dropdown trigger button with selected label, count in parentheses, and chevron
- Dropdown menu with checkmark on selected item, counts per option in Dutch locale format (1.234)
- Counts fetched once on row expand via new API endpoint (not re-fetched on grouping change)
- Single-select: clicking an option selects it and closes the dropdown
- Click-outside and Escape key close the dropdown
- Border color matches tree connectors (`├` `└`) using `--muted-foreground` for visual cohesion
- Integraal module excluded (only has 1 grouping option "Module")

**Technical Implementation:**
- Backend: `GROUPABLE_FIELDS` dict + `get_grouping_counts()` — single SQL query with `COUNT(DISTINCT field)` per groupable field
- API: `GET /{module}/{primary_value}/grouping-counts` → `dict[str, int]`
- BFF: `app/src/app/api/v1/modules/[module]/[value]/grouping-counts/route.ts`
- Frontend: `GroupingSelect` component in `expanded-row.tsx`

**Priority:** P2 (Medium — visual polish)

**Status:** ✅ Implemented 2026-02-09

---

### UX-024: Type-Ahead with Recent Searches (V2.1)

**Requirement:** Show recent search history instantly when the search bar receives focus, and reduce perceived latency through client-side response caching and reduced debounce.

**Behavior:**

**On Focus (before typing):**
- Search bar focus → immediately show dropdown with "Recente zoekopdrachten" section
- Shows last 5-10 searches from localStorage (per device, no auth required)
- Each entry shows the search term; clicking applies it as a search
- "Wis geschiedenis" link at bottom to clear history
- If no recent searches: dropdown stays hidden until user types (same as current behavior)

**Search history storage:**
- Stored in localStorage key `rijksuitgaven-recent-searches`
- Array of `{query: string, module: string, timestamp: number}`
- Max 10 entries, FIFO (oldest removed when full)
- Saved on search execution (Enter press or result click), NOT on every keystroke
- Module name shown as subtle label: `"prorail" — Integraal`

**Reduced debounce:**
- 2 characters → 0ms debounce (fire immediately)
- 3+ characters → 30ms debounce (reduced from current 50ms)
- Rationale: Typesense responds in ~25ms, so aggressive debounce is safe

**Response caching (client-side):**
- Cache autocomplete API responses in-memory (`Map<string, {results, timestamp}>`)
- TTL: 5 minutes (data is static within a session)
- Cache key: `${module}:${query}` (module-specific results)
- Common pattern "type → delete → retype" becomes instant from cache
- Cache cleared on module navigation (hard navigation already resets state)

**What this does NOT include:**
- No "popular searches" or "trending" section
- No server-side search history (localStorage only)
- No changes to Typesense or PostgreSQL
- No new backend endpoints

**Technical Implementation:**
- Frontend only — no backend/BFF changes
- `filter-panel.tsx`: Add on-focus handler, render recent searches section
- `filter-panel.tsx`: Add response cache Map, adjust debounce timing
- localStorage: Read/write recent searches on search execution
- React context not needed (component-local state sufficient)

**Estimated effort:** 2-3 hours

**Priority:** P2 (V2.1 — improvement to existing search UX)

**Status:** ⏳ Planned for V2.1

---

### UX-025: Feedback Button with Element Marking

**Requirement:** Persistent feedback button on all logged-in pages that lets users send structured feedback with optional element marking (Feedbucket-style), delivered via email.

**Behavior:**

**Feedback button (always visible):**
- Floating button bottom-right corner, visible on all authenticated pages
- Label: "Feedback" with speech bubble icon (navy #0E3261 pill)
- Click opens a compact feedback form panel
- Only visible to logged-in users

**Feedback form:**
- Header: "Feedback" (text-base font-semibold)
- Category pills: **Suggestie** / **Bug** / **Vraag** (navy active, gray inactive)
- Main textarea with dynamic placeholder per category:
  - Suggestie: "Ik wil graag... zodat ik..."
  - Bug: "Wat gaat er mis..."
  - Vraag: "Hoe kan ik..."
- "Markeer op de pagina" button (dashed border, Crosshair icon) — opens marking mode
- "Verstuur" button (pink #E62D75, disabled until text entered)
- User email shown bottom-left
- Success state: "Bedankt voor uw feedback!" — auto-closes after 2 seconds
- Escape key closes form

**Element marking (Feedbucket-style):**
- User clicks "Markeer op de pagina" → form hides, crosshair cursor on body
- Elements highlight on hover with pink #E62D75 border (2px)
- Click captures the element via `html2canvas` (single element, not full page)
- Toolbar at top: "Klik op het element dat u wilt melden" + "Annuleren" button
- After capture: form reopens with compact attachment chip (small thumbnail + "Gemarkeerd" label)
- Refresh/remove buttons on chip for re-marking or removing
- Element metadata captured: CSS selector, tag label, text, position (sent in email, hidden from user)
- Graceful degradation: if screenshot capture fails, metadata still sent

**Email delivery (Phase 1 — Beta):**
- Sends email via Resend to `contact@rijksuitgaven.nl`
- Email subject: `[Suggestie/Bug/Vraag] [first 50 chars of message]`
- Email body contains:
  - Category badge (color-coded: green=Suggestie, red=Bug, blue=Vraag)
  - User message (full text)
  - Marked element section (if provided): tag, CSS selector, text excerpt, position
  - Screenshot attachment (PNG, if captured)
  - Page URL, browser/OS, timestamp
  - User email (from auth session)
- BFF endpoint: `POST /api/v1/feedback` — validates auth, CSRF, body size (10MB), sends via Resend

**Upgrade path (Phase 2 — Post-beta):**
- Swap Resend email for GitHub Issue creation via API
- Issue label: `user-feedback`
- Screenshot attached as image
- Integrates with GitHub Projects board (V2.2 backlog item)

**Technical Implementation:**
- Frontend: `components/feedback/feedback-button.tsx` — client component with marking overlay
- BFF: `app/api/v1/feedback/route.ts` — auth + CSRF + Resend email
- Dependencies: `html2canvas` (element capture), `resend` (email delivery)
- Element highlighting via `document.elementFromPoint()` + capture-phase event listeners

**Priority:** P1 (V2.0 — required before beta launch)

**Status:** ✅ Implemented 2026-02-11

---

### UX-026: Profile Dropdown Menu

**Requirement:** Replace exposed logout button in header with an industry-standard profile dropdown menu, reducing accidental logouts.

**Behavior:**

**Trigger (header, logged-in users):**
- Generic user icon (person silhouette) + chevron, right side of header
- Chevron rotates 180° when open
- Subtle hover state (light gray background)

**Dropdown menu (click to toggle):**
- "Ingelogd als" label + truncated email address (top section, separated by border)
- "Mijn profiel" link → `/profiel`
- Divider
- "Uitloggen" button in red text with red hover background

**Dismissal:**
- Click outside closes menu
- Escape key closes menu
- Clicking a menu item closes menu

**Not logged in:**
- Shows "Inloggen" text link (no icon) → `/login`

**Footer change:**
- Removed email + Uitloggen from footer bottom bar (now redundant)

**Priority:** P1

**Status:** ✅ Implemented 2026-02-11

---

### UX-027: Post-Login Landing Page (Module Hub)

**Requirement:** Replace the generic landing page with an Enhanced Module Hub that gives users a clear overview of all available data modules with descriptions and stats.

**Behavior:**

**Welcome bar (top):**
- Single line: "Doorzoek en vergelijk rijksoverheidsuitgaven vanaf 2016."
- Light gray background, subtle bottom border

**Two sections: Ontvangers and Kosten:**
- Uppercase section labels (tracking-wider, text-xs, font-semibold)
- Ontvangers: 6 cards (Integraal, Instrumenten, Inkoop, Provincie, Gemeente, Publiek)
- Kosten: 1 card (Apparaat) in half-width grid

**Module cards (2-column grid):**
- Each card: Title (text-xl semibold) → Stat line (text-base semibold navy) → Description (text-base muted)
- Stat line shows euro total + year range (e.g., "€1.474 mld · 2016–2024")
- Cards are fully clickable → navigate to module page
- Hover: border color change + shadow lift
- User-specified titles (e.g., "Zoeken in alle modules", "Financiële Instrumenten", etc.)

**No search bar** on landing page (search lives on module pages).

**Priority:** P1

**Status:** ✅ Implemented 2026-02-12

---

### UX-028: Contacts Management (`/team/contacten`)

**Requirement:** Admin page for managing all contacts (prospects, subscribers, churned) with Resend Audience sync for email campaigns.

**Behavior:**

**Database: `contacts` table**
- Fields: email (unique), first_name, last_name, organization, type, source, notes, resend_contact_id, subscription_id
- Type: `prospect` | `subscriber` | `churned` (semi-automatic transitions)
- Source: `website` | `event` | `referral` | `import` (free text)
- RLS enabled, admin-only access

**Admin page (`/team/contacten`):**
- New tab in TeamNav between "Leden" and "Feedback"
- Inline stats bar: Total, Prospects, Subscribers, Churned counts
- Add Contact form (email, first_name, last_name, organization, type, source, notes)
- Sortable table: Name | Organization | Email | Type | Source | Created
- Row click → Edit modal (same pattern as `/team/leden`)
- Type badges: green=subscriber, blue=prospect, gray=churned
- Resend sync indicator on synced contacts
- Delete contact with confirmation

**Semi-automatic type transitions:**
- Linking a subscription → type auto-changes to `subscriber`
- Subscription expires → type auto-changes to `churned`
- Manual override always available

**Resend Audience sync:**
- On create: add contact to Resend Audience
- On update: update Resend contact
- On delete: remove from Resend Audience
- Graceful degradation: sync failure logged, not user-facing

**Priority:** P1 (V2.0 — required for email campaigns, replaces WordPress/Mailster)

**Status:** ⏳ In Development

---

### UX-030: De Geldstroom — Dynamic Sankey Hero

**Requirement:** Replace static `/h1` prototype with dynamic Sankey flow visualization powered by real government spending data, generated at build time.

**Behavior:**

**6 Selectable Stories:**
- Integraal ("Alle bronnen") — default, shows cross-module recipients
- Publiek ("Publieke organisaties") — COA/RVO/ZonMW/NWO flows
- Instrumenten ("Rijksbegroting") — budget chapters → recipients
- Inkoop ("Inkoopdata") — ministries → suppliers
- Gemeente ("Gemeenten") — top municipalities → recipients
- Provincie ("Provincies") — provinces → recipients

**Year Selector:**
- Horizontal pills: 2016-2024 (per-story year range)
- Active year: pink background, white text
- Clicking year updates amounts, flow thicknesses, and headline

**Dynamic Headline:**
- "Waar ging €X mld naartoe in [year]?" — amount updates per year/story

**Build-Time Data:**
- No public API — data baked into JSON at `next build`
- Script queries Supabase for all stories × all years
- Output: `app/src/data/geldstroom.json` (~18KB)
- Fallback: use previously committed JSON if DB unreachable

**Visual Design:**
- Left nodes: source categories (5-7 per story) with amounts
- Right nodes: top 5 recipients + "Overige ontvangers" with amounts
- Flow thickness proportional to amount
- Particle density proportional to flow amount
- Per-story visual scale normalization
- Node order fixed by most recent year (2024) ranking

**Data Notes:**
- Inkoop/Publiek (COA) amounts are average staffelbedragen (midpoint estimates)
- Inkoop ministry names normalized (I&W/I & W/I & M → canonical)

**Priority:** P1 (V2.0 — homepage hero)

**Status:** ⏳ In Development

---

### UX-031: Ontdekking van de Week — Data Stories Carousel

**Requirement:** Rotating carousel of editorially curated, fact-checked data discoveries for the homepage. Each card shows a verified spending fact with source attribution and social share buttons.

**Behavior:**
- 23 verified discoveries, shuffled on each page load
- Auto-rotation every 5 seconds, pauses on hover
- Count-up animation on each card entrance (ease-out cubic, 1.4s)
- Social sharing: LinkedIn, X, Bluesky — pre-filled with discovery text
- "Ontdek meer →" CTA links to relevant module page
- Source attribution on every card (module + year range)
- Counter "X / 23" replaces individual dot indicators

**Data Sources:**
- All 23 discoveries verified against production Supabase (2026-02-14)
- Covers all 6 modules: instrumenten, publiek, inkoop, gemeente, provincie, integraal
- No fabricated numbers — every amount traceable to a single SQL query
- Inkoop amounts are staffelbedragen (midpoint estimates)

**Visual Design:**
- Navy card, large pink hero number (€X miljard/miljoen), one-sentence insight
- Financial Times data annotation aesthetic
- Three social share icons (top-right): LinkedIn, X, Bluesky
- Noise texture + grid overlay on card background

**Priority:** P1 (V2.0 — homepage section)

**Status:** ⏳ In Development

---

### UX-032: Usage Statistics — Internal Product Analytics

**Requirement:** Server-side usage analytics with pseudonymized user tracking. All events captured in the BFF layer, displayed on an admin dashboard at `/team/statistieken`.

**Events Tracked (12):**
- Core (module-page): `module_view`, `search`, `row_expand`, `filter_apply`, `export`, `column_change`, `sort_change`, `page_change`, `cross_module_nav`, `error`
- Search bar: `autocomplete_search`, `autocomplete_click`

**Privacy:**
- Pseudonymized `actor_hash` (SHA256 of user_id + secret, first 16 chars)
- No PII stored in events table (no email, name, IP, user agent)
- Server-side BFF logging = legitimate interest, no consent needed
- 90-day auto-retention, weekly cleanup

**Dashboard (3-act structure):**
1. **Pulse** — KPI cards (active users, searches, exports, row expands, errors)
2. **Inzichten** — Module popularity, combined search table (results + zero-results), filter/column usage, exports
3. **Gebruikers** — Per-user expandable rows with activity dots, event timeline (50 latest per actor)
4. **Fouten** — Error cards with context pills (zoekterm, sortering, filters), clear button

**Architecture:**
- Client-side batching (30s or 10 events, sendBeacon on unload; errors flush immediately)
- Single BFF endpoint: `POST /api/v1/analytics`
- Async write to `usage_events` Supabase table (fire-and-forget)
- Admin-only dashboard via service_role client
- `DELETE /api/v1/team/statistieken` — clear error events

**Design Document:** `docs/plans/2026-02-14-usage-statistics-design.md`

**Priority:** P1 (V2.0 — pre-launch)

**Status:** ✅ Implemented 2026-02-14

---

### UX-033: Fouten als eigen sectie

**Requirement:** Move error tracking out of Statistieken into its own dedicated `/team/fouten` page with a tab in TeamNav.

**Behavior:**
- New "Fouten" tab at the end of TeamNav (after Statistieken)
- Red badge with error count, only visible when count > 0
- Page shows error cards with context pills, date range picker, clear individual/all buttons
- Dashboard error alert links to `/team/fouten` instead of `/team/statistieken`
- ErrorsSection and error PulseCard removed from Statistieken page

**Rationale:**
- Errors are operational items needing attention, not usage statistics
- Separate tab makes error monitoring more visible and accessible
- Consistent with Feedback having its own tab and badge

**Priority:** P1 (V2.0 — pre-launch)

**Status:** ✅ Implemented 2026-02-15

---

### UX-034: Committed Search Tracking + Dashboard Redesign

**Requirement:** Replace debounce-based search tracking with committed action tracking. Only Enter press and autocomplete clicks generate search events. New dashboard section shows three layers: Resultaat, Engagement, Geen resultaat.

**Behavior:**
- **Tracking changes:**
  - Search events fire only on explicit user actions: Enter press (commit_type='enter') or autocomplete click (commit_type='autocomplete')
  - Each search gets a unique search_id; all engagement events carry this ID
  - New `search_end` event tracks duration (with visibility pause handling, 5min cap) and exit action
  - Retry chains: `prev_search_id` links a new search to a previous zero-result search within 60 seconds
  - Deferred result counting: search commit is signaled from filter-panel, tracking fires after data loads (when result_count is known)
  - No more debounce timer — typing noise completely eliminated
- **Dashboard changes:**
  - SearchSection component with 4 mini KPIs (searches, success rate, avg duration, engagement rate)
  - Enriched search table: Zoekterm, Resultaten, Via (Enter/Auto pills), Duur, Engagement %, Aantal, Module
  - Zero results section with retry count badges ("2 herpogingen")
  - Engagement breakdown chart (what users do after finding results)

**Rationale:**
- Old debounce-based tracking produced false data (typos, partial words, browsing pauses appearing as real searches)
- Committed actions reflect actual user intent
- Three-layer model (Resultaat → Engagement → Geen resultaat) gives actionable insights

**Priority:** P1 (V2.0 — pre-launch data quality)

**Status:** ✅ Implemented 2026-02-16

---

### UX-035: Datasets Page — Dynamic Data Availability Matrix

**Requirement:** Create a `/datasets` page that dynamically renders data availability per module, entity, and year. Replaces the static WordPress datasets page (which was manually maintained and had stale/incorrect year ranges).

**Behavior:**
- **Page:** `/datasets` (post-login, behind auth middleware)
- **Data source:** `data_availability` table (migration 022) — already tracks `module`, `entity_type`, `entity_name`, `year_from`, `year_to`
- **Sections:**
  1. **Financiële Instrumenten** — single row (module-level, data.overheid.nl)
  2. **Apparaatsuitgaven** — single row (module-level, data.overheid.nl)
  3. **Inkoopuitgaven** — single row (module-level, data.overheid.nl)
  4. **Provinciale subsidieregisters** — matrix: 12 provinces × years, with source links
  5. **Gemeentelijke subsidieregisters** — matrix: municipalities × years
  6. **Publieke uitvoeringsorganisaties** — matrix: RVO, ZonMW, NWO, COA × years
- **Rendering:** Checkmarks (✔) for years within `year_from`–`year_to` range, empty cells outside range
- **Source links:** Hardcoded in frontend config (official government URLs, rarely change)
- **Dynamic:** When `data_availability` rows are updated (new year added, entity added), the page reflects it automatically
- **Architecture:** BFF route (`GET /api/v1/datasets`) queries Supabase `data_availability`, groups by module/entity_type, returns JSON. Frontend renders tables.

**Pre-requisite: Data Availability Fixes**
The current `data_availability` table has incorrect year ranges inherited from initial bulk insert (migration 022 used broad defaults). Must be corrected before building the page:

| Entity | DB has | WordPress shows | Fix needed |
|--------|--------|-----------------|------------|
| Utrecht (gemeente) | 2016-2024 | 2023-2024 | year_from → 2023 (zeros for 2016-2022) |
| Amersfoort (gemeente) | 2020-2024 | 2018-2024 | Verify actual data |
| Friesland (provincie) | 2016-2024 | 2020-2024 | Verify actual data |
| Gelderland (provincie) | 2019-2024 | 2018-2024 | Verify actual data |
| Utrecht (provincie) | 2017-2024 | 2022-2024 | Verify actual data |
| Zuid-Holland (provincie) | 2016-2024 | 2021-2024 | Verify actual data |
| Flevoland (provincie) | missing | missing | Not in platform (no data) |
| Groningen (provincie) | missing | missing | Not in platform (no data) |
| Inkoop (module) | 2016-2024 | not shown | Verify — actual range may be 2017-2023 |

**Action:** Run verification queries against actual source tables to determine correct year_from/year_to per entity, then UPDATE the `data_availability` table before building the page.

**Rationale:**
- WordPress page was manually maintained → always out of date
- Dynamic page auto-reflects new data loads (e.g., adding 2025 data)
- Transparency: users see exactly which entities have which years
- Source links provide attribution to original government sources

**Priority:** P2 (V2.0 — nice to have for launch, not blocking)

**Status:** ✅ Implemented 2026-02-18

---

### UX-036: Public Page Analytics

**Requirement:** Track visitor behavior on all public pages (homepage, login, privacy, terms, verlopen, afmelden) using server-side event ingestion. Provide a "Website" dashboard tab in `/team/statistieken` showing conversion funnel, scroll depth, CTA performance, referrer attribution, and demo search engagement.

**Behavior:**
- **2 new event types:** `public_page_view` (page load) + `public_interaction` (user actions with `action` property)
- **Session-scoped ID:** `crypto.randomUUID()` in memory (not persisted — no cookies, no localStorage, GDPR-safe). Enables `COUNT(DISTINCT session_id)` for unique session counting
- **12 interaction actions:** `cta_click`, `section_view`, `audience_tab`, `contact_form_start`, `contact_form_submit`, `demo_search`, `demo_result_click`, `phone_click`, `login_attempt`, `login_magic_link_sent`, `feature_card_click`, `pricing_plan_click`
- **Referrer tracking:** Domain-only (`new URL(referrer).hostname`), not full URL
- **UTM capture:** `utm_source`, `utm_medium`, `utm_campaign` on page_view events
- **Dashboard:** "Website" tab in statistieken with 4 KPIs (unique sessions, conversion rate, demo searches, scroll-to-pricing %), scroll funnel, CTA ranking, referrer/campaign table, contact form funnel, demo search queries, audience interest breakdown, login funnel
- **Privacy:** No PII, no cookies, no localStorage. Anonymous visitors tracked as `anon_000000000000` with per-session `session_id` for uniqueness. Compliant with existing privacy policy Article 5

**Components:**
- `components/analytics/track-page-view.tsx` — Shared client component for server-rendered pages
- `components/homepage/scroll-reveal.tsx` — `onVisible` callback prop added
- `components/team/website-section.tsx` — Dashboard UI component
- SQL migration `062-public-analytics.sql` — 8 RPC functions

**Rationale:**
- At 500+ users, homepage is primary acquisition channel — must measure conversion effectiveness
- Existing analytics only covers authenticated app usage (14 event types, all module-scoped)
- Server-side tracking avoids third-party dependencies and consent requirements
- Separated dashboard tab prevents anonymous event pollution of product usage metrics

**Priority:** P1 (V2.0 — pre-launch conversion visibility)

**Status:** ✅ Implemented 2026-02-19

---

### UX-037: Concept E-mails (Drafts)

**Requirement:** Allow saving email compositions as drafts in `/team/mail` before sending, with the ability to edit and delete drafts.

**Behavior:**
- **Save draft:** "Opslaan als concept" button in compose actions bar saves all fields (subject, heading, preheader, body, CTA, segments) to the campaigns table with `status = 'draft'`
- **Edit draft:** Loading a draft populates the compose form; button changes to "Concept bijwerken"
- **Send draft:** Sending a loaded draft converts it to `status = 'sent'` (no duplicate row)
- **Delete draft:** Same delete flow as sent campaigns (confirm → delete)
- **Campaigns tab:** Split into "Concepten" (pinned at top) and "Verzonden" sections
- **Segment display:** Pipeline stage badges shown on all campaigns and drafts in the list
- **Draft badge:** Amber "CONCEPT" badge distinguishes drafts from sent campaigns
- **Drafts show:** "Bewerken" button (loads into editor) instead of "Sjabloon" (copy as new)
- **Timestamp:** Drafts show "Laatst bewerkt" instead of sent timestamp

**Database:**
- `campaigns.status` column: `'draft'` | `'sent'` (default: `'sent'`)
- `campaigns.sent_at` made nullable (NULL for drafts)
- `campaigns.updated_at` added for edit tracking
- SQL migration: `063-campaign-drafts.sql`

**API:**
- `POST /api/v1/team/mail/drafts` — save new draft
- `PUT /api/v1/team/mail/drafts/[id]` — update existing draft
- Send route accepts optional `draft_id` to convert draft on send
- Campaigns list returns both drafts and sent with `status` field

**Priority:** P2 (Admin tooling improvement)

**Status:** ✅ Implemented 2026-02-20

---

### UX-038: "Ook in" Column Enrichment

**Requirement:** Show secondary field context for rows that matched on primary field (name), replacing the confusing "-" dash in the old "Gevonden in" column.

**Problem:** When searching "covid" in Instrumenten, 216 ontvangers contain "COVID" in their name. The "Gevonden in" column showed "-" for all of them, even though many also have "COVID" in their Regeling. Users interpreted "-" as "not found" — a broken UX promise.

**Solution:**
1. **Rename:** "Gevonden in" → "Ook in" — sets correct expectation ("also found in")
2. **SQL enrichment:** After Typesense search, one additional SQL query checks if primary-only matches also have the search term in secondary fields (regeling, omschrijving, etc.)
3. **Empty cell:** When no secondary match exists, show empty cell instead of "-"

**Implementation:**
- `_enrich_matched_info()` in `modules.py` — LATERAL JOIN on source table, checks all secondary fields via CASE WHEN chain
- Runs once per search page load (~20-50ms), only for rows without existing matched_info
- Non-critical: if enrichment fails, rows show empty "Ook in" (graceful degradation)

**Priority:** P1 (UX clarity)

**Status:** ✅ Implemented 2026-02-20

---

### UX-040: Default Sort Direction — High to Low

**Requirement:** When a user clicks a column header for the first time, sort descending (highest values first) instead of ascending.

**Behavior:**
- First click → descending (high to low)
- Second click → ascending (low to high)
- Third click → remove sort
- Applies to all sortable columns (totaal, year columns) across all 7 modules

**Rationale:**
- Financial data users naturally want to see the biggest amounts first
- "Who received the most?" is the default mental model
- Ascending sort is rarely the first intent for monetary values

**Implementation:**
- TanStack Table `sortDescFirst: true` on table options
- Single property change, affects all columns globally

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-24

---

### UX-039: Vergelijk (Row Pinning)

**Requirement:** Allow users to pin up to 4 rows to the top of the data table for side-by-side comparison while scrolling, sorting, and filtering.

**Problem:** When comparing recipients (e.g., ProRail vs NS), scrolling to find one loses sight of the other. Users can't keep specific rows visible while browsing the full result set.

**Interaction:**
- Pin icon (📌) appears on hover/focus, left of the expand chevron
- Click to pin → row moves to top of table, stays visible during scroll/sort/filter
- Click again to unpin → row returns to normal flow
- Maximum 4 pinned rows
- "Wis selectie" link appears when any rows are pinned

**Visual treatment:**
- Pinned rows: light accent background + left border accent (2px, brand color)
- Separator line between pinned rows and scrollable rows
- Pinned rows are visually distinct from filtered results

**Behavior:**
- Pinned rows ignore sort order and active filters (always visible at top)
- Expand disabled on pinned rows (tooltip: "Ontkoppel om details te bekijken")
- Cleared on module switch (per-module scope)
- React state only (not persisted across sessions)

**Export integration:**
- When pins exist, export offers "Exporteer selectie (N rijen)" in addition to "Exporteer alles"

**Technical approach:**
- TanStack Table `enableRowPinning` + `row.pin('top')` (native API)
- `getTopRows()` for pinned section, `getCenterRows()` for scrollable section
- Sticky positioning below header row

**Not building (YAGNI):**
- Cross-module pinning (Integraal already serves this use case)
- Comparison chart/visualization
- Pin persistence (sessionStorage/URL)
- Side-by-side modal view

**Priority:** P2 (Enhancement)

**Status:** ⏳ In Development

---

### UX-008: Hard Navigation on Module Menu

**Requirement:** Clicking a module in the navigation menu forces a full page reload

**Behavior:**
- Click any module tab → full page reload (not client-side navigation)
- Resets all filters to defaults
- Shows fresh random data (per UX-002 randomization)

**Rationale:**
- Users expect clicking a module to show a "fresh" view
- Client-side navigation preserved filter state unexpectedly
- Consistent behavior whether clicking current or different module

**Priority:** P1 (High)

**Status:** ✅ Implemented 2026-02-04

---

### UX-003: Mobile Responsiveness

**Requirement:** Optimize for mobile, but desktop-first for data work

**Strategy:**
- **Desktop:** Full experience (primary focus)
- **Tablet:** Full experience with scrollable tabs (responsive layout)
- **Mobile:** Simplified experience (search + basic views, module dropdown)

**Mobile Optimizations:**
- Large touch targets (minimum 44×44px)
- Simplified filters (bottom sheet)
- Horizontal scroll for data tables
- Fixed first column (Ontvanger) on horizontal scroll

**V2.0 Mobile Message (NEW):**
- Detect mobile viewport (< 768px)
- Show friendly message: "Rijksuitgaven werkt het beste op een groter scherm"
- Include option to continue anyway
- One-time dismiss (localStorage)
- Does NOT block access, just informs

**Priority:** P1 (High) - Core mobile optimizations
**Mobile Message:** P0 (V2.0 launch requirement)

**Status:** ✅ Mobile Message Implemented 2026-02-05

**Implementation Details:**
- Bottom sheet with slide-up animation
- Navy background, Monitor icon, pink CTA
- Dutch copy: "Beter op een groter scherm"
- "Toch doorgaan" button (non-blocking)
- localStorage persistence (one-time per device)

---

### UX-004: Multi-Language Support

**Requirement:** Dutch-first, with internationalization framework

**V2.0:**
- Dutch only (all UI, all content)
- Code structured for i18n (but not translated)

> **Future Version Context:** English UI will be added in V3.0 for international users and franchising potential. Framework prepared in V2.0.

**Priority:** P2 (Medium - framework only)

---

### UX-005: Column Customization

**Requirement:** Users can customize which columns appear in expanded line item rows

**Behavior:**
- Click "Kolommen" button to open column selector modal
- Choose which detail columns to display (module-specific options)
- Preferences saved per user (persist across sessions)
- Each module shows only its available columns

**Always visible (not customizable):**
- Ontvanger
- Year columns (2016-2024)
- Totaal

**Customizable columns by module:**

| Module | Available Columns |
|--------|-------------------|
| Financiële Instrumenten | Regeling, Artikel, Artikelonderdeel, Instrument, Begrotingsnaam, Detail |
| Apparaatsuitgaven | Kostensoort, Artikel, Begrotingsnaam, Detail |
| Inkoopuitgaven | Ministerie, Categorie, Staffel |
| Provinciale subsidieregisters | Provincie, Omschrijving |
| Gemeentelijke subsidieregisters | Gemeente, Beleidsterrein, Regeling, Omschrijving |
| Publiek | Organisatie, Regeling, Trefwoorden, Sectoren, Regio |
| Integraal | Modules (which modules recipient appears in) |

**Default columns per module (updated 2026-01-31):**

*Note: Max 2 columns displayed due to table width constraints (MAX_SELECTED_COLUMNS = 2)*

| Module | Default Detail Columns |
|--------|------------------------|
| Financiële Instrumenten | Artikel, Regeling |
| Apparaatsuitgaven | Artikel, Detail |
| Inkoopuitgaven | Categorie, Staffel |
| Provinciale subsidieregisters | Provincie, Omschrijving |
| Gemeentelijke subsidieregisters | Gemeente, Omschrijving |
| Publiek | Organisatie |
| Integraal | (none - modules shown inline) |

**Priority:** P1 (High)

---

## Technical Constraints

### TECH-001: Data Update Frequency

**Constraint:** Government data updates monthly/yearly (not real-time)

**Implications:**
- No need for real-time data pipeline
- Nightly search index rebuild sufficient
- Cache aggressively (data doesn't change during day)

**Refresh Strategy:**
- **Source data:** Manual import when government releases
- **Search index:** Automated rebuild after data import (Railway cron)
- **Cache:** Clear all caches on data import

---

### TECH-002: Database Architecture

**V2.0 Architecture:**
- Source data in Supabase (PostgreSQL)
- Search index in Typesense
- API layer (FastAPI) between frontend and data stores

**Read-only financial data:**
- Original financial data never modified by application
- User preferences stored separately (Supabase auth tables)

---

## User Stories

### Epic 1: Search Bar

#### US-001: Find Recipients by Name

**As a journalist, I want to quickly find recipients by name**

**Acceptance Criteria:**
- I type "prorail" in search bar
- Within 100ms, I see autocomplete suggestions
- I select "ProRail B.V." from suggestions
- I see all ProRail entries across all modules
- Results are sorted alphabetically by default
- I can change sort to "Amount (Highest)"

**Priority:** P0 | **Story Points:** 8

---

#### US-002: Filter by Year Range

**As a researcher, I want to filter by year range**

**Acceptance Criteria:**
- I open advanced filters
- I see a year range slider (2016-2024)
- I drag slider to select 2020-2024
- Results update in real-time
- I can see filter is active (badge: "Filters (1)")
- I can clear filter with one click

**Priority:** P0 | **Story Points:** 5

---

#### US-003: Search with Typos

**As a policy analyst, I want to search with typos**

**Acceptance Criteria:**
- I type "rijkswatersaat" (missing 't')
- Search auto-corrects to "rijkswaterstaat"
- I see results for correct spelling
- I see hint: "Showing results for: rijkswaterstaat"

**Priority:** P1 | **Story Points:** 3

---

#### US-004: Search Suggestions While Typing

**As a user, I want search suggestions as I type**

**Acceptance Criteria:**
- I type "pr" - no suggestions yet (less than 3 chars)
- I type "pro" - see dropdown with top 5 recipients starting with "pro"
- I continue typing "prorail 2024"
- See instant preview: Top 3 results with amounts
- I can click preview to see full results
- I can press Enter to see full results page

**Priority:** P1 | **Story Points:** 8

---

### Epic 2: Advanced Filtering

#### US-005: Filter by Multiple Criteria

**As a journalist, I want to filter by multiple criteria simultaneously**

**Acceptance Criteria:**
- I'm on "Financiële Instrumenten" module
- I open advanced filters
- I select:
  - Year: 2024
  - Begrotingsnaam: "Infrastructuurfonds"
  - Amount: >1,000,000
- Results update in real-time
- Filter badge shows: "Filters (3)"
- I can export filtered results

**Priority:** P1 | **Story Points:** 13

---

#### US-006: See Module Result Counts

**As a researcher, I want to see which modules have results**

**Acceptance Criteria:**
- I search "prorail" in universal search
- I see results grouped by module:
  - Financiële Instrumenten (23 results)
  - Apparaatsuitgaven (5 results)
  - Publiek (2 results)
- I can click module name to see only those results
- Total count shown: "30 results across 3 modules"

**Priority:** P1 | **Story Points:** 8

---

## Acceptance Criteria

### Search Bar (V2.0) - Must Have

- [x] Search bar visible on all pages (except account/support) ✅ 2026-01-26
- [x] Autocomplete after 3 characters (<50ms) ✅ 2026-01-26 (<25ms achieved)
- [x] Instant results preview (<100ms) ✅ 2026-01-26
- [x] Typo tolerance (up to 2 character edits) ✅ 2026-01-26 (Typesense fuzzy)
- [x] Support all query types (keyword, phrase, boolean, filters) ✅ 2026-01-26
- [x] Advanced filters per module (collapsible) ✅ 2026-01-26
- [x] Results in <1000ms (P50) ✅ 2026-01-31 (~750ms achieved via hybrid Typesense→PostgreSQL)
- [x] Cross-module search with module filtering ✅ 2026-01-26
- [x] Export to CSV (500 rows limit) ✅ 2026-01-26

**Performance Note (2026-02-09):** Target was <100ms. Initially achieved ~750ms via hybrid search (Typesense for discovery, PostgreSQL for data). Optimized to ~130-280ms via parallel query execution (`asyncio.gather`). Further optimized to ~100-150ms via Typesense data enrichment: integraal now uses Typesense hybrid search (key lookup → WHERE IN) instead of regex. All modules 20-40x faster than original 5-10s WordPress search.

### Search Bar (V2.0) - Should Have

- [x] "Did you mean" suggestions for no results ✅ 2026-01-26 (fuzzy matches)
- [ ] Recent search history (logged-in users) - Requires auth (Week 6)
- [x] Keyboard shortcuts (/ to focus search) ✅ 2026-01-26
- [x] Loading indicators (>200ms) ✅ 2026-01-26

### Search Bar (V2.0) - Could Have

- [ ] Advanced search syntax builder (UI-based) - Deferred
- [ ] Search analytics (track popular queries) - Deferred to backlog

---

## V2.0 Scope Summary

**Building:**
- Global search bar with autocomplete
- Typo-tolerant, instant search (<100ms)
- Advanced filters per module
- Cross-module search
- CSV export (500 row limit)
- Column customization per module

**Not Building (V3.0):**
- Research Mode (AI conversational interface)
- Natural language queries
- Data visualizations (charts)
- wetten.overheid.nl integration
- Save/share queries

> **Future Version Context:** Research Mode will add AI-powered conversational analysis. This V2.0 search bar provides the foundation for V3.0. See: `research-mode-vision.md`

---

**Document Status:** V2.0 Scope - Implementation In Progress
**Last Updated:** 2026-02-09
**Author:** Technical Project Manager (AI Assistant)
