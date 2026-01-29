# Search Requirements (V1.0)

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** 1.0
**Date:** 2026-01-23
**Status:** V1.0 Scope - Ready for Implementation

> **Scope:** This document covers V1.0 Search Bar requirements only.
> For V2.0 Research Mode vision, see: `research-mode-vision.md`

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

### Target State (V1.0)

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

> **V2 Context:** This search bar architecture is designed to support future Research Mode (AI conversational interface). The Typesense engine and API layer will integrate with AI in V2.0. See: `research-mode-vision.md`

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

### Success Metrics (V1.0)

| Metric | Current | Target V1.0 |
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

**Default Columns:** Artikel, Instrument, Regeling

---

### Module 2: Apparaatsuitgaven

**Filters:**
1. **Kostensoort** (Cost type) - Dropdown (unique to this module)
2. **Begrotingsnaam** - Dropdown
3. **Artikel** - Dropdown
4. **Detail** - Dropdown
5. **Year Range** - Slider (2016-2024)
6. **Amount Range** - Min/Max input

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
1. **Provincie** (Province) - Dropdown (unique to this module)
2. **Year Range** - Slider (2018-2024)
3. **Amount Range** - Min/Max input

**Default Columns:** Provincie, Omschrijving

---

### Module 5: Gemeentelijke Subsidieregisters

**Filters:**
1. **Gemeente** (Municipality) - Dropdown (unique to this module)
2. **Beleidsterrein** (Policy area) - Dropdown (unique to this module)
3. **Regeling** - Dropdown
4. **Omschrijving** - Dropdown
5. **Year Range** - Slider (2018-2024)
6. **Amount Range** - Min/Max input

**Default Columns:** Gemeente, Omschrijving

---

### Module 6: Publiek (Public Implementation Organizations)

**Filters:**
1. **Organisatie** (Organization: RVO, COA, NWO, etc.) - Dropdown (unique)
2. **Regeling (RVO/COA)** - Dropdown
3. **Trefwoorden (RVO)** (Keywords) - Dropdown (unique)
4. **Sectoren (RVO)** (Sectors) - Dropdown (unique)
5. **Regio (RVO)** (Region) - Dropdown
6. **Staffel (COA)** - Dropdown
7. **Onderdeel (NWO)** - Dropdown
8. **Year Range** - Slider (2018-2024)
9. **Amount Range** - Min/Max input

**Default Columns:** Organisatie

> **V2 Context:** This module has GIS/location data (POINT geometry field). Geographic search will be enabled in V2.0. See: `research-mode-vision.md`

---

### Module 7: Integraal (Cross-Module Search)

**Filters:**
1. **Modules per ontvanger** (Modules per recipient) - Multi-select (unique)
2. **Instanties per ontvanger** (Instances per recipient) - Slider
3. **Totaal aantal betalingen** (Total payments) - Slider
4. **Year Range** - Slider (2016-2024)
5. **Total Amount Range** - Min/Max input

**Default Columns:** Modules

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

| Query Type | Current | Target V1.0 |
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

### PERF-003: Concurrent User Capacity (V1.0)

**Requirement:** Support multiple users simultaneously

**V1.0 Targets:**
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

### UX-002b: Dutch False Cognate Filtering (V1.1)

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

**Priority:** P1 (V1.1)

**Status:** ✅ Implemented 2026-01-29

**Design Doc:** `docs/plans/2026-01-29-semantic-search-design.md`

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

**Priority:** P1 (High)

---

### UX-004: Multi-Language Support

**Requirement:** Dutch-first, with internationalization framework

**V1.0:**
- Dutch only (all UI, all content)
- Code structured for i18n (but not translated)

> **V2 Context:** English UI will be added in V2.0 for international users and franchising potential. Framework prepared in V1.0.

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

**Default columns per module (decided 2026-01-23):**

| Module | Default Detail Columns |
|--------|------------------------|
| Financiële Instrumenten | Artikel, Instrument, Regeling |
| Apparaatsuitgaven | Artikel, Detail |
| Inkoopuitgaven | Categorie, Staffel |
| Provinciale subsidieregisters | Provincie, Omschrijving |
| Gemeentelijke subsidieregisters | Gemeente, Omschrijving |
| Publiek | Organisatie |
| Integraal | Modules |

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

**V1.0 Architecture:**
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

### Search Bar (V1.0) - Must Have

- [x] Search bar visible on all pages (except account/support) ✅ 2026-01-26
- [x] Autocomplete after 3 characters (<50ms) ✅ 2026-01-26 (<25ms achieved)
- [x] Instant results preview (<100ms) ✅ 2026-01-26
- [x] Typo tolerance (up to 2 character edits) ✅ 2026-01-26 (Typesense fuzzy)
- [x] Support all query types (keyword, phrase, boolean, filters) ✅ 2026-01-26
- [x] Advanced filters per module (collapsible) ✅ 2026-01-26
- [x] Results in <100ms (P50) ✅ 2026-01-26 (114-380ms achieved)
- [x] Cross-module search with module filtering ✅ 2026-01-26
- [x] Export to CSV (500 rows limit) ✅ 2026-01-26

### Search Bar (V1.0) - Should Have

- [x] "Did you mean" suggestions for no results ✅ 2026-01-26 (fuzzy matches)
- [ ] Recent search history (logged-in users) - Requires auth (Week 6)
- [x] Keyboard shortcuts (/ to focus search) ✅ 2026-01-26
- [x] Loading indicators (>200ms) ✅ 2026-01-26

### Search Bar (V1.0) - Could Have

- [ ] Advanced search syntax builder (UI-based) - Deferred
- [ ] Search analytics (track popular queries) - Deferred to backlog

---

## V1.0 Scope Summary

**Building:**
- Global search bar with autocomplete
- Typo-tolerant, instant search (<100ms)
- Advanced filters per module
- Cross-module search
- CSV export (500 row limit)
- Column customization per module

**Not Building (V2.0):**
- Research Mode (AI conversational interface)
- Natural language queries
- Data visualizations (charts)
- wetten.overheid.nl integration
- Save/share queries

> **V2 Context:** Research Mode will add AI-powered conversational analysis. This V1.0 search bar provides the foundation for V2.0. See: `research-mode-vision.md`

---

**Document Status:** V1.0 Scope - Implementation In Progress
**Last Updated:** 2026-01-29
**Author:** Technical Project Manager (AI Assistant)
