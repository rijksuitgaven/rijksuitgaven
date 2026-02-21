# V1.0 UX Enhancements

**Created:** 2026-01-21
**Status:** Decided
**Source:** UX Brainstorm Session

---

## Executive Summary

This document captures UX decisions from a brainstorm session focused on understanding users and improving their experience in V1.0.

### Key Decisions

| Decision | Description | Effort |
|----------|-------------|--------|
| Enhanced autocomplete | Index more fields, show keyword matches | 4-8 hours |
| Cross-module indicator | "Ook in:" badge on recipient rows | 3-5 hours |
| Prominent expanded context | Regeling as headline in expanded rows | Design only |
| URL sharing | Search + key filters preserved in URL | Already planned |
| Trend anomaly indicator | Red highlight for 10%+ year-over-year changes | 3-4 hours |
| Cross-module search results | Always show "Ook in:" with counts above table | 4-6 hours |
| Integraal as landing page | Move Integraal tab to first position | Design only |

### User Research Summary

- **50% Political staff** - Preparing debates, policy proposals
- **25% Journalists** - Investigative research
- **25% Researchers** - Academic analysis

**Core need:** *"Where does the money go, and does it actually work?"*

---

## Context

### User Research Findings

**User breakdown (50 paying customers):**
- 50% Political staff (parties, parliament, ministries)
- 25% Journalists (investigative, newsrooms)
- 25% Researchers (academics, think tanks)

**Core user need:** *"Where does the money go, and does it actually work?"*

Users are trying to:
1. Trace money flows (Government → Recipient)
2. Cross-reference sources (national + local)
3. Evaluate policy impact (investment vs. outcome)

### The Problem Discovered

**Current system:** Recipient-first ("Who got money?")
**User mental model:** Theme-first ("What's being spent on wolves/climate/infrastructure?")

**Example:** User wants to find "wolf protection spending"
- Current: Must know to search "wolfwerend" in extended search, scan Omschrijving column
- Desired: Type "wolf" and see relevant results immediately

### User Struggles Identified

| Struggle | Status |
|----------|--------|
| A) Finding the right recipient | ❌ Hard |
| B) Connecting the dots across modules | ❌ Hard |
| C) Understanding context | ❌ Hard |
| D) Sharing findings | ❌ Hard |
| E) Tracking over time | ✅ Solved (year columns) |

---

## Decision

### Option Selected: B (Index More Fields, Design for A)

**What we're building:**
- Index Omschrijving, Regeling, Beleidsterrein (not just Ontvanger) in Typesense
- Show keyword matches in autocomplete with field context
- Design component structure to support future aggregation (Option A)

**What we're NOT building in V1.0:**
- Aggregated counts/totals in autocomplete (deferred)
- Topic tiles/categories (V2.0)
- AI-assisted search (V2.0)

### Effort Estimate

| Task | Hours |
|------|-------|
| Add fields to Typesense index | 2-4 |
| Update autocomplete UI | 2-4 |
| **Total** | **4-8 hours** |

---

## UX Specification

### Current Autocomplete (Baseline)

```
User types: "wolf"
┌─────────────────────────────────┐
│ 🔍 wolf                         │
├─────────────────────────────────┤
│ Wolfskuil B.V.                  │  ← Recipient name only
│ Van der Wolf Holding            │
│ Wolfgang Puck Catering          │
└─────────────────────────────────┘
```

**Problem:** User searching "wolf protection" finds nothing useful.

### V1.0 Enhanced Autocomplete

```
User types: "wolf"
┌──────────────────────────────────────────────────────────┐
│ 🔍 wolf                                                  │
├──────────────────────────────────────────────────────────┤
│ ZOEKTERMEN                                               │
│ 📋 "Wolfwerende afrastering" (in Omschrijving)          │
│ 📋 "Preventie Faunaschade" (in Regeling)                │
├──────────────────────────────────────────────────────────┤
│ ONTVANGERS                                               │
│ 👤 Stichting Into Nature Drenthe                         │
│ 👤 Wolfskuil B.V.                                        │
└──────────────────────────────────────────────────────────┘
```

**Improvements:**
- Keywords from Omschrijving, Regeling, Beleidsterrein appear
- Grouped by type (keywords vs recipients)
- Shows which field matched
- Click keyword → filtered results for that term

### Click Behavior

| User clicks | Result |
|-------------|--------|
| Keyword (e.g., "Wolfwerende afrastering") | Navigate to module with search filter applied |
| Recipient (e.g., "Stichting Into Nature") | Navigate to recipient detail/filtered results |

### Indexed Fields Per Module

| Module | Fields to Index |
|--------|-----------------|
| Financiële Instrumenten | Ontvanger, Regeling, Begrotingsnaam, Artikel |
| Apparaatsuitgaven | Kostensoort, Begrotingsnaam, Artikel |
| Provinciale subsidies | Ontvanger, Omschrijving, Provincie |
| Gemeentelijke subsidies | Ontvanger, Omschrijving, Gemeente, Beleidsterrein, Regeling |
| Inkoopuitgaven | Leverancier, Ministerie, Categorie |
| Publiek | Ontvanger, Regeling, Trefwoorden, Sectoren |
| Integraal | Ontvanger (cross-module) |

---

## V2.0 Alignment

This design prepares for V2.0 without conflict:

| V1.0 (Now) | V2.0 (Future) |
|------------|---------------|
| Grouped autocomplete (keywords + recipients) | Add "Categories" section with IBOS domains |
| Field-based matching | Add AI-interpreted topic matching |
| Click → filtered results | Click → Research Mode overview |
| No aggregation | Add counts + totals per suggestion |

### Future Autocomplete (V2.0)

```
┌────────────────────────────────────────────────────────────┐
│ 🔍 wolf                                                    │
├────────────────────────────────────────────────────────────┤
│ CATEGORIE                                                  │
│ 🌍 Natuur & Landbouw (€47M totaal, 89 ontvangers)         │  ← V2.0
├────────────────────────────────────────────────────────────┤
│ ZOEKTERMEN                                                 │
│ 📋 "Wolfwerende afrastering" (6 ontvangers, €287K)        │  ← V1.0 + aggregation
│ 📋 "Preventie Faunaschade" (12 ontvangers, €1.2M)         │
├────────────────────────────────────────────────────────────┤
│ ONTVANGERS                                                 │
│ 👤 BIJ12 (€32M)                                            │  ← V1.0 + amounts
│ 👤 Stichting Into Nature Drenthe (€125K)                   │
└────────────────────────────────────────────────────────────┘
```

**Design principle:** V1.0 component structure supports adding sections and data.

---

## Implementation Notes

### Typesense Configuration

```javascript
// Collection schema addition
{
  "name": "rijksuitgaven",
  "fields": [
    // Existing
    { "name": "ontvanger", "type": "string", "facet": true },
    // New fields to index
    { "name": "omschrijving", "type": "string", "optional": true },
    { "name": "regeling", "type": "string", "facet": true, "optional": true },
    { "name": "beleidsterrein", "type": "string", "facet": true, "optional": true },
    { "name": "module", "type": "string", "facet": true }
  ]
}
```

### Autocomplete Component Structure

```
<SearchAutocomplete>
  <SearchInput />
  <SuggestionDropdown>
    <SuggestionGroup title="ZOEKTERMEN" type="keyword">
      <SuggestionItem />
    </SuggestionGroup>
    <SuggestionGroup title="ONTVANGERS" type="recipient">
      <SuggestionItem />
    </SuggestionGroup>
    <!-- V2.0: Add <SuggestionGroup title="CATEGORIE" type="domain" /> -->
  </SuggestionDropdown>
</SearchAutocomplete>
```

### Deduplication Logic

Keywords may appear in many rows. Autocomplete should deduplicate:
- Group by exact keyword match
- Show most relevant/frequent first
- Limit to top 5 keywords + top 5 recipients

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Users who click keyword suggestions | >30% of searches |
| Time to find theme-based results | Reduced (qualitative) |
| Support requests for "how to find X" | Reduced |

---

## Related Documents

- [V3.0 Vision & Roadmap](../../02-requirements/v3-vision-roadmap.md)
- [Search Requirements](../../02-requirements/search-requirements.md)
- [Sprint Plan - Week 5](../../09-timelines/v2-sprint-plan.md)

---

---

## Enhancement 2: Cross-Module Indicator

### Problem

Users work in their "home module" (e.g., Provinciale subsidies) and don't realize the same recipient appears in other modules. They miss the bigger picture of money flows.

**User insight:** "Users often come in with a view of just the gemeente, or provincie - that's their area. BUT they must learn the value of Integraal zoeken."

### Decision

Show a subtle "Ook in:" indicator on recipient rows when that recipient appears in other modules.

### UX Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│    │ Ontvanger                      │ 2022   │ 2023    │ 2024   │ Totaal │
├────┼────────────────────────────────┼────────┼─────────┼────────┼────────┤
│ ▶  │ Stichting Into Nature Drenthe  │ €0     │ €125K   │ €0     │ €125K  │
│    │ 🔗 Ook in: Instrumenten, Publiek                                    │
├────┼────────────────────────────────┼────────┼─────────┼────────┼────────┤
│ ▶  │ Natuurmonumenten               │ €0     │ €22K    │ €0     │ €22K   │
│    │ 🔗 Ook in: Instrumenten, Gemeente, Publiek                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Behavior

| Element | Behavior |
|---------|----------|
| "Ook in:" text | Subtle gray, smaller font |
| Module names | Clickable links |
| Click module name | Navigate to that module with recipient filter applied |
| No other modules | Don't show indicator (clean row) |

### Implementation

- Query `universal_search` table for recipient's `Sources` field
- If recipient appears in >1 module, show indicator
- Cache results (doesn't change often)

### Effort Estimate

| Task | Hours |
|------|-------|
| Backend: lookup other modules | 1-2 |
| Frontend: indicator component | 2-3 |
| **Total** | **3-5 hours** |

### V2.0 Alignment

This directly supports V2.0 Research Mode where users explore recipients across all spending sources. Builds the mental model early.

---

## Enhancement 3: Prominent Expanded Context

### Problem

When users expand a recipient row, they need to quickly understand "what is this spending for?" (Regeling, Artikel, etc.). Context should be scannable, not buried.

### Decision

Design expanded row content to surface context prominently:
- **Regeling as headline** (most important context)
- **Breadcrumb hierarchy** (Artikel › Begrotingsnaam)
- **Cross-module indicator** (from Enhancement 2)
- **Then** grouping/detail options

### UX Specification

**Before (typical expand pattern):**
```
▼ Stichting Into Nature Drenthe    €0   €125K   €0   €125K
   └─ Regeling: Wolfwerende afrastering
   └─ Artikel: 2.5 Preventie Faunaschade
   └─ Begrotingsnaam: Cultuur, Maatschappij en Vrijetijdseconomie
```
*Problem: List format, hard to scan, context buried.*

**After (prominent context):**
```
▼ Stichting Into Nature Drenthe                €0   €125K   €0   €125K
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 📋 Wolfwerende afrastering                                          │
  │ Preventie Faunaschade › Cultuur, Maatschappij en Vrijetijdseconomie │
  │ 🔗 Ook in: Instrumenten, Publiek                                    │
  └─────────────────────────────────────────────────────────────────────┘

  Group by: [Regeling ▼]
  ┌────────────────────────────────────┬────────┬────────┬────────┬────────┐
  │ Regeling                           │ 2022   │ 2023   │ 2024   │ Totaal │
  ├────────────────────────────────────┼────────┼────────┼────────┼────────┤
  │ Wolfwerende afrastering            │ €0     │ €125K  │ €0     │ €125K  │
  └────────────────────────────────────┴────────┴────────┴────────┴────────┘
```

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Regeling is the headline** | Large, prominent, first thing user sees |
| **Hierarchy as breadcrumb** | Artikel › Begrotingsnaam in one line |
| **Cross-module visible** | "Ook in:" shows bigger picture |
| **Grouping below context** | User understands context before diving into details |
| **Consistent across modules** | Same pattern, different fields per module |

### Context Fields Per Module

| Module | Headline | Breadcrumb |
|--------|----------|------------|
| Financiële Instrumenten | Regeling | Artikel › Begrotingsnaam |
| Apparaatsuitgaven | Kostensoort | Artikel › Begrotingsnaam |
| Provinciale subsidies | Omschrijving | Provincie |
| Gemeentelijke subsidies | Regeling | Beleidsterrein › Gemeente |
| Inkoopuitgaven | Categorie | Ministerie |
| Publiek | Regeling | Bron (RVO/COA/NWO) |

### Effort Estimate

Design decision only - implementation is part of table component build (Week 3).

---

## Enhancement 4: URL Sharing (Confirmed)

### Decision (from earlier session)

URLs preserve search + key filters for sharing.

### Format

```
/[module]?q=[search]&[filter1]=[value]&[filter2]=[value]
```

### Examples

| Scenario | URL |
|----------|-----|
| Wolf spending in Provinciale | `/provincie?q=wolfwerend` |
| ProRail in 2024 | `/instrumenten?q=prorail&jaar=2024` |
| Amsterdam subsidies | `/gemeente?q=&gemeente=Amsterdam` |

### What's Preserved

| Parameter | In URL | Shareable |
|-----------|--------|-----------|
| Search term (`q`) | ✅ | ✅ |
| Year filter | ✅ | ✅ |
| Module-specific filters (top 2-3) | ✅ | ✅ |
| Expanded rows | ❌ | ❌ |
| Pagination position | ❌ | ❌ |
| Column preferences | ❌ | ❌ |
| Grouping selection | ❌ | ❌ |

### V2.0 Expansion

Full URL state restoration (all of the above) deferred to V2.0.

---

## User Struggles Addressed

| Struggle | Solution | Status |
|----------|----------|--------|
| A) Finding the right recipient | Enhanced autocomplete with keywords | ✅ Decided |
| B) Connecting dots across modules | "Ook in:" cross-module indicator | ✅ Decided |
| C) Understanding context | Prominent expanded context design | ✅ Decided |
| D) Sharing findings | URL sharing with filters | ✅ Decided |
| E) Tracking over time | Year columns (already exists) | ✅ Already solved |

---

## Total Additional Effort

| Enhancement | Hours |
|-------------|-------|
| Enhanced autocomplete | 4-8 |
| Cross-module indicator | 3-5 |
| Prominent expanded context | 0 (design only) |
| URL sharing | 0 (already planned) |
| **Total** | **7-13 hours** |

This is approximately 1-2 extra days of development, spread across Weeks 3-5.

---

## Enhancement 5: Trend Anomaly Indicator

### Problem

Users LOVE seeing year-over-year trends (year columns), but struggle to spot anomalies when scanning large numbers:

```
│ Stichting XYZ │ €1.245.678 │ €1.312.456 │ €1.298.234 │ €1.456.789 │ €1.523.456 │
```

Users need to mentally calculate percentage changes to identify significant movements.

### Decision

Highlight cells with 10%+ change vs previous year using color (red = anomaly). Magnitude only, direction doesn't matter.

### UX Specification

```
│ 2022          │ 2023          │ 2024          │
│ €1.29M        │ €1.46M        │ €1.52M        │
                  (red)
```

**Color logic:**
- No color = normal change (<10%)
- Red background = anomaly (10%+ change, up OR down)

**Hover behavior:**
- Hover any year cell → tooltip shows exact % change vs previous year
- Example: "+13% vs 2022"

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Highlight by exception** | Only anomalies get color, normal cells stay clean |
| **Magnitude only** | Direction visible from numbers themselves |
| **Details on demand** | Exact % available via hover |
| **First year neutral** | 2016 has no indicator (no previous year to compare) |

### Color Scale

| Change | Color | Meaning |
|--------|-------|---------|
| 0-10% | None | Normal, stable |
| 10%+ | Red (subtle) | Anomaly - look closer |

### Effort Estimate

| Task | Hours |
|------|-------|
| Calculate % change per cell | 1-2 |
| Apply conditional styling | 1-2 |
| Add hover tooltip | 1 |
| **Total** | **3-4 hours** |

### Backlog Item

User-configurable threshold (5%, 10%, 15%, 20%) - deferred to post-V1.0.

---

## Enhancement 6: Cross-Module Search Results

### Problem

Users search within one module and don't realize results exist in other modules. They miss the full picture of where tax money flows.

**User insight:** "Users must learn and see the value of Integraal zoeken."

### Decision

Always show cross-module result counts above the results table, not just on empty state.

### UX Specification

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 wolfwerend                                    [Apparaat ▼]   │
├─────────────────────────────────────────────────────────────────┤
│ 23 resultaten in Apparaatsuitgaven                              │
│                                                                 │
│ 📊 Ook in: Provinciale subsidies (12) • Instrumenten (3)        │
├─────────────────────────────────────────────────────────────────┤
│ │ Ontvanger          │ 2022    │ 2023    │ 2024    │ Totaal   │ │
```

### Behavior

| Element | Behavior |
|---------|----------|
| Result count | Shows current module results |
| "Ook in:" line | Shows all other modules with results (clickable) |
| Click module | Navigate to that module with same search applied |
| Empty state | Same display, but "Ook in:" becomes primary suggestion |
| No other results | Don't show "Ook in:" line |

### Display Rules

- Show ALL modules with results (don't limit to top 3)
- Order by result count (highest first)
- Format: `Module naam (count)`
- Separator: ` • ` (bullet)

### Effort Estimate

| Task | Hours |
|------|-------|
| Backend: cross-module count query | 2-3 |
| Frontend: "Ook in:" component | 2-3 |
| **Total** | **4-6 hours** |

---

## Enhancement 7: Integraal as Landing Page

### Problem

Current tab order puts Financiële Instrumenten first. Users land in a single module and don't discover the cross-module value.

**User insight:** Theme-first mental model. Users want to see "where does money go" across ALL sources.

### Decision

Move Integraal tab to first position. Users land on cross-module view by default.

### Tab Order Change

**Before:**
```
[Financiële Instrumenten] [Apparaatuitgaven] [Provinciale] [Gemeentelijke] [Inkoopuitgaven] [Publiek] [Integraal]
```

**After:**
```
[Integraal] [Financiële Instrumenten] [Apparaatuitgaven] [Provinciale] [Gemeentelijke] [Inkoopuitgaven] [Publiek]
```

### User Flow

```
Login → Integraal (default landing)
           ↓
     Random recipients shown (4+ years of data)
           ↓
     User searches "ProRail"
           ↓
     Results across ALL modules
     "Ook in: Instrumenten (45) • Inkoop (23) • ..."
           ↓
     Click module → deep dive into specific data
```

### Default View (Unchanged)

- Random selection of recipients
- Only recipients with amounts in at least 4 different years
- Truly random order (not sorted)
- Refreshes on each page load

### Effort Estimate

Design/configuration change only - no development effort beyond updating tab order.

---

## User Struggles Addressed (Updated)

| Struggle | Solution | Status |
|----------|----------|--------|
| A) Finding the right recipient | Enhanced autocomplete with keywords | ✅ Decided |
| B) Connecting dots across modules | "Ook in:" indicator + cross-module results + Integraal landing | ✅ Decided |
| C) Understanding context | Prominent expanded context design | ✅ Decided |
| D) Sharing findings | URL sharing with filters | ✅ Decided |
| E) Tracking over time | Year columns + trend anomaly indicator | ✅ Enhanced |

---

## Total Additional Effort (Updated)

| Enhancement | Hours |
|-------------|-------|
| Enhanced autocomplete | 4-8 |
| Cross-module indicator (rows) | 3-5 |
| Prominent expanded context | 0 (design only) |
| URL sharing | 0 (already planned) |
| Trend anomaly indicator | 3-4 |
| Cross-module search results | 4-6 |
| Integraal as landing | 0 (config only) |
| **Total** | **14-23 hours** |

This is approximately 2-3 extra days of development, spread across Weeks 3-5.

---

## Decision History

| Date | Decision |
|------|----------|
| 2026-01-21 | Enhanced autocomplete: Option B (index fields, design for A) |
| 2026-01-21 | Cross-module indicator: Option A (subtle "Ook in:" on rows) |
| 2026-01-21 | Expanded context: Regeling as headline, breadcrumb hierarchy |
| 2026-01-21 | URL sharing: Search + key filters (confirmed) |
| 2026-01-21 | All decisions confirmed aligned with V2.0 roadmap |
| 2026-01-21 | Trend anomaly indicator: Red highlight for 10%+ changes (magnitude only) |
| 2026-01-21 | Cross-module search results: Always show "Ook in:" with counts |
| 2026-01-21 | Integraal as landing page: Move tab to first position |
