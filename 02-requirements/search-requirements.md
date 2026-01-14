# Search Requirements

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** 1.0
**Date:** 2026-01-14
**Status:** Draft (Requirements Gathering)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Vision & Goals](#vision--goals)
3. [Search Bar Requirements](#search-bar-requirements)
4. [Research Mode Requirements](#research-mode-requirements)
5. [Filter Requirements by Module](#filter-requirements-by-module)
6. [Performance Requirements](#performance-requirements)
7. [User Experience Requirements](#user-experience-requirements)
8. [Technical Constraints](#technical-constraints)
9. [User Stories](#user-stories)
10. [Acceptance Criteria](#acceptance-criteria)

---

## Executive Summary

### Current State
- **Search Speed:** 5 seconds (unacceptable)
- **Search Engine:** MySQL FULLTEXT (limited capabilities)
- **Interface:** Basic keyword search + advanced filters per module
- **No AI:** No natural language understanding or conversational interface

### Target State - Two Search Modes

#### **Mode 1: Search Bar** (All Users - V1.0)
- **Speed:** <100ms (instant, Google-like)
- **Interface:** Global search bar with intelligent autocomplete
- **Capabilities:**
  - Simple keyword search
  - Fuzzy/typo-tolerant matching
  - Instant suggestions as you type
  - Advanced filters (collapsible)
  - Cross-module search with module filtering
- **User Experience:** "Claude of Rijksfinanciën" - intuitive, no syntax required

#### **Mode 2: Research Mode** (Premium Tier - V2.0)
- **Speed:** <3s for AI responses
- **Interface:** Conversational AI interface (like Claude)
- **Capabilities:**
  - Natural language queries
  - Multi-step analysis
  - Data visualization (charts, graphs)
  - Custom reports and exports
  - Comparison tools (recipients, years, modules)
  - External source integration (wetten.overheid.nl)
  - Save queries, annotate results, share findings
- **Target Users:** Journalists, researchers, policy analysts, political parties

### Key Principle
**"The Claude of Rijksfinanciën"** - Search should be as intuitive and powerful as conversing with an AI assistant, requiring zero technical knowledge.

---

## Vision & Goals

### Product Vision
*"Alle overheidsbestedingen snel doorzoekbaar en vergelijkbaar maken"*

Enable professionals (journalists, researchers, policymakers, financial analysts) to:
- Quickly search and understand complex government financial data
- Compare spending across years, recipients, and modules
- Discover insights through AI-powered analysis
- Make data-driven decisions with confidence

### Success Metrics

| Metric | Current | Target V1 | Target V2 |
|--------|---------|-----------|-----------|
| Search response time | 5s | <100ms | <100ms |
| AI query response | N/A | N/A | <3s |
| User searches/day | Unknown | 1000+ | 5000+ |
| Search success rate | Unknown | 95%+ | 98%+ |
| Advanced filter usage | Low | 40%+ | 60%+ |
| Research mode adoption | N/A | N/A | 30% of premium users |

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
**Version:** V1.0

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
**Version:** V1.0

---

### SR-003: Debouncing Strategy

**Requirement:** Optimize API calls while maintaining responsiveness

**Details:**
- Wait 300ms after user stops typing before triggering search
- Cancel in-flight requests if user continues typing
- Show loading indicator if request takes >200ms

**Priority:** P1 (High)
**Version:** V1.0

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
**Version:** V1.0

---

### SR-005: Query Types Support

**Requirement:** Support diverse query patterns without requiring syntax knowledge

**Supported Query Types:**

✅ **Simple keyword**
- Example: `prorail`
- Behavior: Search all fields for "prorail"

✅ **Multi-word phrases**
- Example: `prorail infrastructure 2024`
- Behavior: Search for all terms (implicit AND)

✅ **Exact phrase matching**
- Example: `"Financieel Instrument"`
- Behavior: Exact match (quotes optional for common phrases)

✅ **Boolean operators** (optional, for power users)
- Example: `prorail AND infrastructure`
- Example: `prorail OR rijkswaterstaat`
- Example: `prorail NOT amsterdam`
- Behavior: Logical operations

✅ **Wildcards** (optional, for power users)
- Example: `prorail*`
- Behavior: Matches "prorail bv", "prorail holding", etc.

✅ **Fuzzy/typo-tolerant** (automatic)
- Example: `prorai` finds `prorail`
- Example: `rijkswatersaat` finds `rijkswaterstaat`
- Behavior: Auto-correct up to 2 character edits

✅ **Filters in query** (natural language)
- Example: `prorail year:2024`
- Example: `prorail module:instrumenten`
- Example: `prorail amount:>1000000`
- Behavior: Parse and apply filters

✅ **Natural language** (delegated to Research Mode in V2)
- Example: `which organizations received the most money in 2024?`
- Behavior: V1 = Best-effort keyword extraction, V2 = Full AI processing

✅ **Numeric ranges**
- Example: `amount:1000000-5000000`
- Example: `year:2020-2024`
- Behavior: Filter by range

**Priority:** P0 (Critical for keyword/phrase), P1 (High for boolean/wildcards), P2 (Medium for natural language in V1)
**Version:** V1.0 (basic), V2.0 (natural language)

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
**Version:** V1.0

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
**Version:** V1.0

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
- Bron, Regio, Staffel, Onderdeel (Publiek only)
- Categorie, Staffel (Inkoopuitgaven)
- Omschrijving, Detail fields

**Priority 4 (Low weight, filterable but not primary search):**
- Year (2016-2024)
- Bedrag/Amount (filterable, not text searchable)
- Projectnummer (Publiek only)

**Location Data (Publiek module):**
- Geospatial search (within X km of location) - V2.0

**Priority:** P0 (Critical)
**Version:** V1.0

---

### SR-009: Advanced Filters - Collapsible Panel

**Requirement:** Provide advanced filters without overwhelming the interface

**Current Design Analysis:**
- **Current:** Toggle between "Geconsolideerd op ontvanger" and "Uitgebreid zoeken met filters"
- **Current Filters:** Module-specific (different per module)

**Proposed Design:**
- **Always visible:** Search bar + basic module tabs
- **Collapsible:** "Filters ▾" button that expands filter panel
- **Expanded State:** Shows module-specific filters (see SR-010)
- **Visual:** Badge count showing active filters (e.g., "Filters (3)")

**Behavior:**
- Filters persist during session
- "Clear All" button to reset
- Filters update results in real-time (or "Apply" button - TBD in UI design)

**Priority:** P1 (High)
**Version:** V1.0

---

### SR-010: Filter Requirements by Module

**Requirement:** Each module has specific filters based on available data fields

(See detailed breakdown in [Filter Requirements by Module](#filter-requirements-by-module) section)

**Priority:** P1 (High)
**Version:** V1.0

---

## Research Mode Requirements

### RM-001: Research Mode Vision

**Requirement:** Create a conversational AI interface for deep financial data analysis

**Vision Statement:**
"Research Mode is the Claude of Rijksfinanciën - an AI assistant that understands government financial data and helps users discover insights through natural conversation."

**Core Concept:**
- AI-first interface (conversational, not traditional search)
- Multi-step analysis capability
- Data visualization on demand
- Integration with external sources (wetten.overheid.nl)
- Professional workspace (save, annotate, share, export)

**Target Users:**
- Journalists (investigative reporting)
- Academic researchers (policy analysis)
- Political parties (oversight, policy development)
- Financial analysts (trend analysis)

**Priority:** P0 (Critical for V2.0)
**Version:** V2.0 (MVP), V2.1+ (enhancements)

---

### RM-002: Research Mode Access Control

**Requirement:** Two-tier subscription model

**Tiers:**
1. **Pro Account** (Basic platform access)
   - Full search bar functionality
   - All modules accessible
   - Advanced filters
   - Standard exports (CSV, up to 10K rows)
   - Price: TBD

2. **Research Account** (Pro + Research Mode)
   - Everything in Pro
   - Research Mode (AI conversational interface)
   - Unlimited exports (with rate limits)
   - Save queries indefinitely
   - Custom visualizations
   - Priority support
   - Price: TBD (premium over Pro)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-003: Research Mode Interface

**Requirement:** Design a distinct but integrated interface for Research Mode

**Option A: Separate Page** (/research) ⭐ **RECOMMENDED**
- Dedicated workspace
- Full-screen chat interface (like Claude)
- Side panel for saved queries, data tables
- Clear distinction from regular search

**Option B: Modal/Overlay**
- Opens on top of current page
- Quick access from any page
- Could feel cramped for extended sessions

**Option C: Integrated (Same interface as search)**
- Search bar transforms into chat interface
- Harder to distinguish modes
- May confuse users

**Recommendation Rationale:**
- Research sessions are typically 10-30 minutes (not quick lookups)
- Users need space for data tables, charts, and conversation
- Separate page allows for more complex UI (split panes, saved queries sidebar)
- Matches mental model: "Search" = quick lookup, "Research" = deep analysis

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-004: Conversational AI Interface

**Requirement:** AI IS Research Mode - conversational interface like Claude

**Interface Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Research Mode]                    [New Session] [History] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI: Hallo! Ik ben je assistent voor Rijksfinanciën.       │
│      Waar kan ik je mee helpen?                            │
│                                                             │
│  User: Welke organisaties ontvingen het meeste            │
│        infrastructuurgeld in 2024?                         │
│                                                             │
│  AI: Ik heb de top 10 infrastructuur-ontvangers in 2024   │
│      voor je gevonden:                                     │
│      [Data table embedded]                                 │
│      1. ProRail B.V. - €461M                               │
│      2. Rijkswaterstaat - €234M                           │
│      ...                                                   │
│                                                             │
│      Wil je meer details over een van deze ontvangers?     │
│      [Suggested: "Vergelijk met 2023" "Toon trend"]        │
│                                                             │
│  User: Vergelijk met 2023                                  │
│                                                             │
│  AI: Hier is de vergelijking 2023 vs 2024:                │
│      [Chart: Bar chart showing year-over-year]             │
│      • ProRail: +12% (€412M → €461M)                       │
│      • Rijkswaterstaat: -8% (€255M → €234M)               │
│      ...                                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Type your question...]                            [Send] │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Chat-based interaction (like Claude)
- AI responses include:
  - Natural language explanations
  - Embedded data tables
  - Visualizations (charts, graphs)
  - Follow-up suggestions
- Streaming responses (show as AI "types")
- Markdown support (bold, lists, links)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-005: AI Capabilities in Research Mode

**Requirement:** AI should function exactly like Claude, but specialized for Rijksfinanciën

**AI Behaviors:**

**1. Query Understanding**
- Natural language intent parsing
- Extract entities (recipients, years, modules, amounts)
- Disambiguate ambiguous queries ("ProRail" vs "ProRail Holding")

**2. Data Analysis**
- Execute complex queries (multi-table joins, aggregations)
- Trend analysis (year-over-year changes)
- Comparative analysis (recipient A vs recipient B)
- Statistical insights (averages, outliers, growth rates)

**3. Follow-up Suggestions** ⭐
- Example: "You searched for ProRail 2024, did you want to compare with 2023?"
- Example: "Shall I show you the breakdown by Instrument type?"
- Contextual, based on current conversation

**4. Pattern Explanation** ⭐
- Example: "Funding increased 23% year-over-year, primarily due to infrastructure investments"
- Example: "This recipient appears in 3 different modules, indicating diverse funding sources"

**5. Related Recommendations** ⭐
- Example: "Related recipients: Rijkswaterstaat, VolkerWessels (similar funding patterns)"
- Example: "This Regeling is also used by 15 other recipients"

**6. Report Generation**
- Summarize findings in natural language
- Generate executive summaries
- Create formatted reports (Markdown, PDF in V2.1)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-006: Multi-Step Analysis Capabilities

**Requirement:** Users can perform complex, multi-step research workflows

**Workflow Example:**
```
Step 1: User: "Toon me de top 10 infrastructuur ontvangers in 2024"
        AI: [Shows data table]

Step 2: User: "Vergelijk deze met 2020"
        AI: [Shows comparison table + chart]

Step 3: User: "Welke hadden de grootste groei?"
        AI: "ProRail had de grootste groei: +34% (€345M → €461M)"

Step 4: User: "Toon me de detail voor ProRail"
        AI: [Shows ProRail breakdown by Instrument, Regeling, Budget]

Step 5: User: "Waar kan ik de wet voor deze regelingen vinden?"
        AI: [Links to wetten.overheid.nl, explains regulation]

Step 6: User: "Maak een samenvatting van deze analyse"
        AI: [Generates report summary]

Step 7: User: "Exporteer dit als CSV"
        AI: [Provides download link]
```

**AI Context Retention:**
- Remember entire conversation history
- Understand pronouns ("deze", "die organisatie", "het")
- Track entities across multiple queries
- Maintain filters across conversation

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-007: Data Visualization

**Requirement:** AI can generate visualizations on demand

**Supported Chart Types:**

**V2.0 (MVP):**
- **Bar charts** (comparisons, top N)
- **Line charts** (trends over time)
- **Pie charts** (distribution, composition)
- **Tables** (detailed data, sortable)

**V2.1 (Enhanced):**
- **Stacked bar charts** (multi-series comparison)
- **Area charts** (cumulative trends)
- **Scatter plots** (correlations)
- **Heatmaps** (multi-dimensional data)
- **Geographic maps** (location-based data from Publiek module)

**Visualization Features:**
- Interactive (hover for details, click to drill down)
- Downloadable (PNG, SVG)
- Embeddable (copy link to share)
- Customizable (colors, labels, legends)

**Trigger Phrases:**
- "Maak een grafiek van..."
- "Toon visueel..."
- "Vergelijk grafisch..."
- "Visualiseer..."

**Priority:** P0 (V2.0 charts), P1 (V2.1 advanced)
**Version:** V2.0 (MVP), V2.1 (enhanced)

---

### RM-008: External Source Integration - wetten.overheid.nl

**Requirement:** AI can reference and link to legislation sources

**Capability:**
- Identify Regeling names in conversation
- Auto-link to wetten.overheid.nl when mentioned
- Fetch and summarize regulation text (via web scraping or API)
- Answer questions about legal context

**Example:**
```
User: "Waar kan ik de wet voor 'Bijdrage aan medeoverheden' vinden?"

AI: "De regeling 'Bijdrage aan medeoverheden' valt onder:
     • Infrastructuurfonds (artikel 8, lid 2)
     • Zie volledige tekst: [wetten.overheid.nl/link]

     Samenvatting: Deze regeling regelt bijdragen aan provincies,
     gemeenten en waterschappen voor infrastructuurprojecten..."
```

**Technical Implementation:**
- MCP tool: `fetch_regulation(regeling_name)`
- Web scraping: wetten.overheid.nl
- Caching: Store frequently accessed regulations
- Fallback: If not found, provide search link

**Priority:** P1 (High)
**Version:** V2.0 (basic linking), V2.1 (summarization)

---

### RM-009: Workspace Features - Save, Annotate, Share

**Requirement:** Professional research workspace capabilities

#### **Save Queries**
- Bookmark searches with custom names
- Organize into folders/collections
- Quick re-run saved queries
- View query history (last 30 days)

#### **Annotate Results**
- Add notes to specific recipients, data points
- Highlight important findings
- Tag entries (e.g., "investigate further", "for report")
- Private notes (not shared)

#### **Share Research**
- Generate shareable link to conversation
- Link includes:
  - Full conversation transcript
  - All data tables and charts
  - Annotations (if marked as shareable)
- Expiration options (7 days, 30 days, never)
- Password protection (optional)

**Priority:** P1 (High - Save/Share), P2 (Medium - Annotate)
**Version:** V2.0 (Save/Share), V2.1 (Annotate)

---

### RM-010: Export Capabilities

**Requirement:** Export data and reports in multiple formats

**Export Formats:**

**V2.0:**
- **CSV** (data tables)
- **Excel** (data tables with formatting)
- **PDF** (conversation transcript + visualizations)
- **Markdown** (conversation transcript)

**V2.1:**
- **JSON** (structured data, for developers)
- **PowerPoint** (auto-generated presentation)

**Export Limits:**
- **Pro Account:** Up to 10,000 rows per export
- **Research Account:** Up to 100,000 rows per export
- Rate limit: 10 exports per day (Research), 3 per day (Pro)

**Trigger Phrases:**
- "Exporteer dit als CSV"
- "Download deze data"
- "Geef me een Excel bestand"

**Priority:** P0 (CSV/Excel), P2 (PDF/Markdown)
**Version:** V2.0 (data exports), V2.1 (document exports)

---

### RM-011: Comparison Tools

**Requirement:** Side-by-side comparison capabilities

**Compare Recipients:**
```
User: "Vergelijk ProRail met Rijkswaterstaat over 2020-2024"

AI: [Shows side-by-side comparison table]

    | Metric           | ProRail    | Rijkswaterstaat |
    |------------------|------------|-----------------|
    | Total (2020-24)  | €1,834M    | €1,123M         |
    | Avg per year     | €367M      | €225M           |
    | Growth rate      | +34%       | -12%            |
    | Modules present  | 3          | 2               |
    | Top Instrument   | Bijdrage.. | Apparaat..      |

    [Chart showing year-over-year trends for both]
```

**Compare Years:**
```
User: "Vergelijk 2020 met 2024 voor alle infrastructuur ontvangers"

AI: [Shows comparison with % changes]
    • Total spending: +23% (€4.2B → €5.2B)
    • New recipients: 12
    • Discontinued: 3
    • Top gainers: [list]
    • Top decliners: [list]
```

**Compare Modules:**
```
User: "In welke modules ontvangt ProRail geld?"

AI: ProRail ontvangt in 3 modules:
    1. Financiële Instrumenten: €461M (2024)
    2. Apparaatsuitgaven: €12M (2024)
    3. Publiek: €8M (2024)

    [Chart showing distribution]
```

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-012: Mobile Experience - Limited Research Mode

**Requirement:** Research Mode available on mobile with limitations

**Desktop (Full Experience):**
- Full conversational interface
- All visualizations
- Split-screen views
- Saved queries sidebar

**Mobile (Limited Experience):**
- Quick questions only
- Example: "Hoeveel kreeg COA in 2023?"
- AI responds with brief answer + key number
- Data tables shown in mobile-optimized format
- Charts simplified (no complex interactivity)
- No annotations or complex workflows
- Redirect to desktop for full features

**Mobile Optimization:**
- Responsive chat interface
- Voice input (future V2.1)
- Swipe gestures for navigation
- Simplified export (email link to desktop)

**Priority:** P2 (Medium)
**Version:** V2.0 (basic), V2.1 (enhanced)

---

## Filter Requirements by Module

### Module 1: Financiële Instrumenten

**Current Filters (from screenshot):**
1. **Begrotingsnaam** (Budget name) - Dropdown
2. **Artikel** - Dropdown
3. **Artikelonderdeel** - Dropdown
4. **Instrument** - Dropdown
5. **Detail** (nieuw in 2024 data) - Dropdown
6. **Regeling** - Dropdown

**Additional Filters (Recommended):**
7. **Year Range** - Slider (2016-2024)
8. **Amount Range** - Min/Max input
9. **Ontvanger Type** - Checkbox (Overheid, Bedrijf, Particulier)

**Priority Ranking:**
1. Year Range (most important)
2. Begrotingsnaam
3. Instrument
4. Amount Range
5. Regeling
6. Artikel
7. Artikelonderdeel
8. Detail
9. Ontvanger Type

---

### Module 2: Apparaatsuitgaven

**Current Filters (from screenshot):**
1. **Kostensoort** (Cost type) - Dropdown ⭐ **Unique to this module**
2. **Begrotingsnaam** - Dropdown
3. **Artikel** - Dropdown
4. **Detail** - Dropdown

**Additional Filters (Recommended):**
5. **Year Range** - Slider (2016-2024)
6. **Amount Range** - Min/Max input

**Priority Ranking:**
1. Year Range
2. Kostensoort (critical filter for this module)
3. Begrotingsnaam
4. Amount Range
5. Artikel
6. Detail

---

### Module 3: Inkoopuitgaven

**Current Filters (from screenshot):**
1. **Ministerie** (Ministry) - Dropdown ⭐ **Unique to this module**
2. **Categorie** (Category) - Dropdown ⭐ **Unique to this module**
3. **Staffel** (Amount bracket) - Dropdown ⭐ **Unique to this module**

**Additional Filters (Recommended):**
4. **Year Range** - Slider (2017-2024) *Note: starts 2017*
5. **Leverancier** (Supplier name) - Text search

**Priority Ranking:**
1. Year Range
2. Ministerie (very important)
3. Categorie
4. Staffel
5. Leverancier

**Note:** This module has unique data structure (inkoop_source_pivot with 80+ category columns)

---

### Module 4: Provinciale Subsidieregisters

**Current Filters (from screenshot):**
1. **Provincie** (Province) - Dropdown ⭐ **Unique to this module**

**Additional Filters (Recommended):**
2. **Year Range** - Slider (2018-2024)
3. **Amount Range** - Min/Max input
4. **Omschrijving** - Text search

**Priority Ranking:**
1. Provincie (critical filter)
2. Year Range
3. Amount Range
4. Omschrijving

---

### Module 5: Gemeentelijke Subsidieregisters

**Current Filters (from screenshot):**
1. **Gemeente** (Municipality) - Dropdown ⭐ **Unique to this module**
2. **Beleidsterrein** (Policy area) - Dropdown ⭐ **Unique to this module**
3. **Regeling** - Dropdown
4. **Omschrijving** - Dropdown

**Additional Filters (Recommended):**
5. **Year Range** - Slider (2018-2024)
6. **Amount Range** - Min/Max input
7. **Beleidsnota** (Policy document) - Dropdown

**Priority Ranking:**
1. Year Range
2. Gemeente (very important)
3. Beleidsterrein
4. Amount Range
5. Regeling
6. Omschrijving
7. Beleidsnota

---

### Module 6: Publiek (Public Implementation Organizations)

**Current Filters (from screenshot):**
1. **Bron** (Source) - Dropdown ⭐ **Unique to this module**
2. **Regeling (RVO/COA)** - Dropdown
3. **Trefwoorden (RVO)** (Keywords) - Dropdown ⭐ **Unique to this module**
4. **Sectoren (RVO)** (Sectors) - Dropdown ⭐ **Unique to this module**
5. **Regio (RVO)** (Region) - Dropdown
6. **Staffel (COA)** - Dropdown
7. **Onderdeel (NWO)** - Dropdown

**Additional Filters (Recommended):**
8. **Year Range** - Slider (2018-2024)
9. **Amount Range** - Min/Max input
10. **Location** (geographic search) - Map picker ⭐ **Uses POINT geometry field**

**Priority Ranking:**
1. Year Range
2. Bron (Source - critical filter)
3. Regeling
4. Amount Range
5. Regio/Location
6. Sectoren
7. Trefwoorden
8. Staffel
9. Onderdeel

**Special Note:** This module has GIS/location data - enable geographic search in V2.0

---

### Module 7: Integraal (Cross-Module Search)

**Current Filters (from screenshot):**
1. **Modules per ontvanger** (Modules per recipient) - Multi-select ⭐ **Unique filter**
2. **Instanties per ontvanger** (Instances per recipient) - Slider (31 min, default)
3. **Totaal aantal betalingen** (Total payments) - Slider (1-500 range)

**Additional Filters (Recommended):**
4. **Year Range** - Slider (2016-2024)
5. **Total Amount Range** - Min/Max input

**Priority Ranking:**
1. Modules per ontvanger (critical for cross-module analysis)
2. Year Range
3. Total Amount Range
4. Instanties per ontvanger
5. Totaal aantal betalingen

**Special Note:** This is the "universal search" view - aggregates across all modules

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

### Filter UI Recommendations

**Desktop:**
```
[Filters ▾ (3 active)]  ← Collapsible button with badge

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
│                                                 │
│                              [Apply Filters]    │
└─────────────────────────────────────────────────┘
```

**Mobile:**
- Bottom sheet that slides up
- Simplified filters (most important only)
- "Apply" button required (not real-time)

---

## Performance Requirements

### PERF-001: Search Response Time Targets

**Requirement:** Fast, responsive search experience

| Query Type | Current | Target V1 | Target V2 |
|------------|---------|-----------|-----------|
| **Simple keyword** | 5s | <100ms | <50ms |
| **Multi-word phrase** | 5s | <150ms | <100ms |
| **With 3+ filters** | 7s | <300ms | <200ms |
| **Complex boolean** | 8s | <500ms | <300ms |
| **Autocomplete** | N/A | <50ms | <50ms |
| **AI natural language** | N/A | N/A | <3s |
| **AI with visualization** | N/A | N/A | <5s |

**Measurement:**
- P50 (median): Target times
- P95 (95th percentile): Target × 2
- P99 (99th percentile): Target × 3

**Priority:** P0 (Critical)
**Version:** V1.0

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
**Version:** V1.0

---

### PERF-003: Research Mode Response Time

**Requirement:** AI responses feel responsive despite complexity

**Behavior:**
- Show "thinking" indicator immediately
- Stream response (show tokens as they arrive)
- Prioritize text response (charts load after)
- Cache frequent queries

**Performance:**
- Time to first token: <500ms
- Full response (text only): <3s
- Full response (with chart): <5s
- Subsequent queries (cached): <500ms

**Priority:** P0 (Critical)
**Version:** V2.0

---

### PERF-004: Concurrent User Capacity

**Requirement:** Support multiple users simultaneously

**Capacity Targets:**

**V1.0:**
- 100 concurrent users (search bar)
- 1,000 searches/minute
- 10,000 searches/hour

**V2.0:**
- 100 concurrent users (search bar)
- 20 concurrent users (Research Mode)
- 500 AI queries/hour
- 10,000 searches/hour (total)

**Scaling:**
- Auto-scale backend (Railway)
- Horizontal scaling for API layer
- Queue for AI requests (prevent overload)

**Priority:** P1 (High)
**Version:** V1.0

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
- Placeholder: "Zoek op ontvanger, regeling, of stel een vraag..."
- Error: "Geen resultaten voor 'prorai'. Bedoelde u: ProRail?"
- Tooltip: "Tip: Gebruik cijfers voor jaar (2024) of bedrag (>1000000)"

**Priority:** P0 (Critical)
**Version:** V1.0

---

### UX-002: Mobile Responsiveness

**Requirement:** Optimize for mobile, but desktop-first for data work

**Strategy:**
- **Desktop:** Full experience (primary focus)
- **Tablet:** Full experience (responsive layout)
- **Mobile:** Simplified experience (search + basic views)

**Mobile Optimizations:**
- Large touch targets (minimum 44×44px)
- Simplified filters (bottom sheet)
- Horizontal scroll for data tables
- Mobile-optimized charts
- Voice input (future V2.1)

**Mobile Limitations:**
- No complex multi-column layouts
- Simplified Research Mode (quick Q&A only)
- Reduced export options

**Priority:** P1 (High for search bar), P2 (Medium for Research Mode)
**Version:** V1.0 (responsive), V2.0 (Research Mode mobile)

---

### UX-003: Multi-Language Support

**Requirement:** Dutch-first, with internationalization framework for future expansion

**V1.0:**
- Dutch only (all UI, all content)
- Code structured for i18n (but not translated)

**V2.0:**
- English UI option (for international users/franchising)
- Dutch content remains Dutch (recipient names, budget names)

**Future (Franchising):**
- Framework supports any language
- Easy to add new locales

**Priority:** P2 (Medium - framework), P3 (Low - actual translation)
**Version:** V1.0 (Dutch only), V2.0 (English UI option)

---

## Technical Constraints

### TECH-001: Data Update Frequency

**Constraint:** Government data updates monthly/yearly (not real-time)

**Implications:**
- No need for real-time data pipeline
- Nightly search index rebuild sufficient
- Cache aggressively (data doesn't change during day)

**Refresh Strategy:**
- **Source data:** Manual import (PhpMyAdmin) when government releases
- **Search index:** Automated rebuild after data import (Railway cron)
- **Cache:** Clear all caches on data import

**Priority:** N/A (constraint)
**Version:** V1.0

---

### TECH-002: AI Cost Management

**Constraint:** AI API costs must be controlled

**Cost Controls:**
1. **Caching:** Cache all AI responses (Redis, 7-day TTL)
2. **Rate Limiting:**
   - Pro: N/A (no Research Mode)
   - Research: 100 queries/day
3. **Query Optimization:** Use cheaper models for simple queries
4. **Fallback:** If AI fails, fall back to keyword search

**Monitoring:**
- Track AI API spend daily
- Alert if >€100/day
- Circuit breaker if >€500/day

**Priority:** P0 (Critical)
**Version:** V2.0

---

### TECH-003: Database Read-Only Access (Phase 1)

**Constraint:** New platform reads existing MySQL (no writes initially)

**Implications:**
- User annotations stored separately (new database)
- Saved queries stored separately
- Export logs stored separately
- Original financial data never modified

**Migration Path:**
- Phase 1: Read-only connection to production MySQL
- Phase 2: Migrate to PostgreSQL with full control

**Priority:** N/A (constraint)
**Version:** V1.0

---

## User Stories

### Epic 1: Search Bar (V1.0)

#### US-001: As a journalist, I want to quickly find recipients by name
**Acceptance Criteria:**
- I type "prorail" in search bar
- Within 100ms, I see autocomplete suggestions
- I select "ProRail B.V." from suggestions
- I see all ProRail entries across all modules
- Results are sorted alphabetically by default
- I can change sort to "Amount (Highest)"

**Priority:** P0 | **Story Points:** 8

---

#### US-002: As a researcher, I want to filter by year range
**Acceptance Criteria:**
- I open advanced filters
- I see a year range slider (2016-2024)
- I drag slider to select 2020-2024
- Results update to show only those years
- I can see filter is active (badge: "Filters (1)")
- I can clear filter with one click

**Priority:** P0 | **Story Points:** 5

---

#### US-003: As a policy analyst, I want to search with typos
**Acceptance Criteria:**
- I type "rijkswatersaat" (missing 't')
- Search auto-corrects to "rijkswaterstaat"
- I see results for correct spelling
- I see hint: "Showing results for: rijkswaterstaat"

**Priority:** P1 | **Story Points:** 3

---

#### US-004: As a user, I want search suggestions as I type
**Acceptance Criteria:**
- I type "pr" - no suggestions yet (less than 3 chars)
- I type "pro" - see dropdown with top 5 recipients starting with "pro"
- I continue typing "prorail 2024"
- See instant preview: Top 3 results with amounts
- I can click preview to see full results
- I can press Enter to see full results page

**Priority:** P1 | **Story Points:** 8

---

### Epic 2: Advanced Filtering (V1.0)

#### US-005: As a journalist, I want to filter by multiple criteria simultaneously
**Acceptance Criteria:**
- I'm on "Financiële Instrumenten" module
- I open advanced filters
- I select:
  - Year: 2024
  - Begrotingsnaam: "Infrastructuurfonds"
  - Amount: >1,000,000
- I click "Apply Filters" (or filters apply real-time)
- Results show only matching entries
- Filter badge shows: "Filters (3)"
- I can export filtered results

**Priority:** P1 | **Story Points:** 13

---

#### US-006: As a researcher, I want to see which modules have results
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

### Epic 3: Research Mode (V2.0)

#### US-007: As a journalist, I want to ask questions in natural language
**Acceptance Criteria:**
- I navigate to /research
- I type: "Welke organisaties ontvingen het meeste infrastructuurgeld in 2024?"
- Within 3 seconds, AI responds with:
  - Natural language answer
  - Data table (top 10)
  - Suggested follow-ups
- I can click "Vergelijk met 2023" suggestion
- AI shows comparison chart

**Priority:** P0 (V2.0) | **Story Points:** 21

---

#### US-008: As a researcher, I want to save my analysis
**Acceptance Criteria:**
- I've had a 10-minute Research Mode conversation
- I click "Save Session"
- I enter name: "ProRail Infrastructure Analysis 2024"
- Session is saved to "My Research" section
- I can re-open it later and continue conversation
- I can share link to read-only version

**Priority:** P1 (V2.0) | **Story Points:** 13

---

#### US-009: As a policy analyst, I want to generate visualizations
**Acceptance Criteria:**
- In Research Mode, I ask: "Maak een grafiek van infrastructuuruitgaven 2020-2024"
- AI generates line chart showing yearly totals
- Chart is interactive (hover for values)
- I can download chart as PNG
- I can ask: "Toon dit als staafdiagram"
- AI regenerates as bar chart

**Priority:** P0 (V2.0) | **Story Points:** 13

---

#### US-010: As a journalist, I want to find legislation sources
**Acceptance Criteria:**
- In Research Mode, I ask: "Waar kan ik de wet voor 'Bijdrage aan medeoverheden' vinden?"
- AI responds with:
  - Regulation name
  - Link to wetten.overheid.nl
  - Brief summary of what regulation covers
  - Which articles apply
- I can click link to open legislation in new tab

**Priority:** P1 (V2.0) | **Story Points:** 8

---

#### US-011: As a user, I want to export research findings
**Acceptance Criteria:**
- In Research Mode, I've analyzed ProRail data
- I ask: "Exporteer dit als Excel"
- AI generates Excel file with:
  - All data tables from conversation
  - Charts as images
  - Summary on first sheet
- Download link appears
- File downloads successfully (<100K rows for Research tier)

**Priority:** P1 (V2.0) | **Story Points:** 8

---

### Epic 4: Cross-Module Analysis (V2.0)

#### US-012: As a researcher, I want to compare recipients across modules
**Acceptance Criteria:**
- In Research Mode: "In welke modules ontvangt ProRail geld?"
- AI shows:
  - List of modules (3)
  - Amount per module
  - Pie chart of distribution
  - Breakdown by year for each module
- I can ask: "Vergelijk dit met Rijkswaterstaat"
- AI shows side-by-side comparison

**Priority:** P0 (V2.0) | **Story Points:** 13

---

## Acceptance Criteria

### Search Bar (V1.0)

**Must Have:**
- ✅ Search bar visible on all pages (except account/support)
- ✅ Autocomplete after 3 characters (<50ms)
- ✅ Instant results preview (<100ms)
- ✅ Typo tolerance (up to 2 character edits)
- ✅ Support all query types (keyword, phrase, boolean, filters)
- ✅ Advanced filters per module (collapsible)
- ✅ Results in <100ms (P50)
- ✅ Cross-module search with module filtering
- ✅ Export to CSV (up to 10K rows)

**Should Have:**
- ✅ "Did you mean" suggestions for no results
- ✅ Recent search history (logged-in users)
- ✅ Keyboard shortcuts (/ to focus search)
- ✅ Loading indicators (>200ms)

**Could Have:**
- Voice input (future)
- Advanced search syntax builder (UI-based)
- Search analytics (track popular queries)

---

### Research Mode (V2.0)

**Must Have:**
- ✅ Separate /research page with chat interface
- ✅ AI understands natural language queries
- ✅ Multi-step conversational analysis
- ✅ Generate bar, line, pie charts
- ✅ Save sessions
- ✅ Share read-only session links
- ✅ Export to CSV, Excel
- ✅ Compare recipients, years, modules
- ✅ Link to wetten.overheid.nl
- ✅ AI response <3s (P50)

**Should Have:**
- ✅ Fetch and summarize legislation
- ✅ Annotate results
- ✅ Custom visualizations
- ✅ Report generation
- ✅ Mobile limited mode

**Could Have:**
- PDF export with branding
- PowerPoint export
- Email reports
- Scheduled alerts (V2.1)
- Voice input (V2.1)
- Geographic search (V2.1)

---

## Version Roadmap

### V1.0 - Core Search (Weeks 1-8)
**Goal:** Fast, intelligent search bar replacing current slow search

**Features:**
- Global search bar
- Autocomplete + instant preview
- All query types (keyword, phrase, boolean, filters)
- Advanced filters per module
- Cross-module search
- Results <100ms
- Export CSV (10K row limit)

**Scope:** 30 paying users, search only, no AI

---

### V2.0 - Research Mode (Weeks 9-16)
**Goal:** AI-powered analysis tool for professionals

**Features:**
- Conversational AI interface (/research page)
- Natural language queries
- Multi-step analysis
- Data visualizations (bar, line, pie)
- Compare recipients/years/modules
- Save sessions, share links
- Export Excel
- wetten.overheid.nl linking

**Scope:** Research tier (premium), 5-10 pilot users

---

### V2.1 - Enhanced Research (Weeks 17-24)
**Goal:** Polish and expand Research Mode

**Features:**
- Advanced visualizations (heatmaps, scatter, maps)
- Legislation summarization (fetch and parse)
- Annotations and notes
- PDF/PowerPoint exports
- Mobile improvements
- Voice input
- Geographic search (Publiek module)

**Scope:** Full rollout, marketing push

---

## Open Questions for Review

### Architecture Implications

**Q1: Search Engine Choice**
- Current recommendation: Typesense
- Given Research Mode requirements (AI-heavy), do we need:
  - Vector search for semantic similarity?
  - Hybrid search (keyword + semantic)?
  - RAG (Retrieval-Augmented Generation) architecture?
- **Action:** Re-evaluate in architecture review

**Q2: AI Model Selection**
- Current recommendation: OpenAI + Claude
- Research Mode is conversation-heavy (like Claude)
- Should we prioritize Claude for Research Mode?
- Cost implications of conversation length?
- **Action:** Cost analysis for typical research sessions

**Q3: Data Pipeline for Research Mode**
- Research Mode needs richer data than search bar
- Should we pre-compute common analyses?
- How to structure data for AI queries?
- **Action:** Design data layer for MCP tools

**Q4: Caching Strategy**
- 80% of queries repeat (assumption)
- How to cache AI conversations (complex)?
- When to invalidate cache (data updates)?
- **Action:** Define caching architecture

---

**Document Status:** Draft - Awaiting Technical Review
**Next Steps:**
1. Review this requirements document
2. Confirm priorities and scope
3. Re-evaluate architecture (Typesense, AI strategy, data layer)
4. Create UI/UX wireframes
5. Estimate development effort
6. Define MVP vs V1.1 features

---

**Last Updated:** 2026-01-14
**Author:** Technical Project Manager (AI Assistant)
**Approvers:** TBD
