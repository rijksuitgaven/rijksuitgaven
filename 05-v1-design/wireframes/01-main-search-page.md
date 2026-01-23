# Wireframe: Main Search Page

**Date:** 2026-01-23
**Status:** Approved
**Related:** [Search Requirements](../../02-requirements/search-requirements.md), [Current UI Overview](../../03-wordpress-baseline/current-ui-overview.md)

---

## Purpose

The main search page is the primary interface for users to search government financial data. Users can:
- Search across all 7 modules or filter to specific modules
- Apply advanced filters
- View results in a multi-year comparison table
- Access detail pages for individual recipients

---

## Layout

### Desktop (1200px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ [Logo] Rijksuitgaven    [Zoeken ▾] [Inzichten BETA] [Support] [Over ons]    │
│                                                     [Contact] [Profiel ▾]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ MODULE TABS                                                                  │
│ [Integraal] [Financiële Instrumenten] [Apparaatsuitgaven] [Provinciale]     │
│ [Gemeentelijke] [Inkoopuitgaven] [Publiek]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Zoek op ontvanger, regeling, of bedrag...                      [⌘/] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                               [Filters ▾ (0)]    [⚙ Kolommen]│
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESULTS SUMMARY                                                              │
│ 1.234 resultaten gevonden  •  Financiële Instrumenten (890) │ Apparaat (234)│
│                               Publiek (110)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESULTS TABLE                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Ontvanger          │ 2016 │ 2017 │ ... │ 2023 │ 2024 │ Totaal      │ ▾ │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ▶ ProRail B.V.     │  345 │  367 │ ... │  412 │  461 │ 3.245.000 K │   │ │
│ │ ▶ Rijkswaterstaat  │  234 │  245 │ ... │  255 │  234 │ 2.123.000 K │   │ │
│ │ ▶ NS Reizigers     │  123 │  134 │ ... │  145 │  156 │ 1.234.000 K │   │ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ [◀ Vorige]  Pagina 1 van 25  [Volgende ▶]     [25 ▾] per pagina   [CSV] [📷] │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                       │
│ [Logo] Rijksuitgaven     Ontdek Rijksuitgaven     Volg ons op: [X] [Li] [BS]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Desktop with Filters Expanded

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Header + Module Tabs - same as above]                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Zoek op ontvanger, regeling, of bedrag...                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                               [Filters ▲ (3)]    [⚙ Kolommen]│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ FILTER PANEL                                                   [Wissen] ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  Jaar                                                                   ││
│  │  [●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●]  ││
│  │   2016                                                           2024   ││
│  │                                                                         ││
│  │  Bedrag (x €1.000)                                                      ││
│  │  [Min: ___________]  tot  [Max: ___________]                            ││
│  │                                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         ││
│  │  │ Begrotingsnaam  │  │ Artikel         │  │ Artikelonderdeel│         ││
│  │  │ [Selecteer... ▾]│  │ [Selecteer... ▾]│  │ [Selecteer... ▾]│         ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         ││
│  │                                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         ││
│  │  │ Instrument      │  │ Detail          │  │ Regeling        │         ││
│  │  │ [Selecteer... ▾]│  │ [Selecteer... ▾]│  │ [Selecteer... ▾]│         ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Results table - same as above]                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1199px)

```
┌─────────────────────────────────────────────────┐
│ [Logo]                    [☰ Menu] [Profiel]    │
├─────────────────────────────────────────────────┤
│ [Module dropdown: Financiële Instrumenten ▾]    │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔍 Zoek...                                  │ │
│ └─────────────────────────────────────────────┘ │
│ [○ Geconsolideerd]            [Filters ▾ (0)]   │
├─────────────────────────────────────────────────┤
│ 1.234 resultaten                                │
├─────────────────────────────────────────────────┤
│ [Results table - horizontal scroll enabled]     │
│ ← Ontvanger │ 2022 │ 2023 │ 2024 │ Totaal │ →  │
├─────────────────────────────────────────────────┤
│ [Pagination + Export]                           │
└─────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌─────────────────────────────┐
│ [Logo]        [☰] [👤]      │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 Zoek...              │ │
│ └─────────────────────────┘ │
│ [Module ▾] [Filters ▾ (0)]  │
├─────────────────────────────┤
│ 1.234 resultaten            │
├─────────────────────────────┤
│ Horizontal scroll table:    │
│ ┌───────────┬───────┬─────→ │
│ │ Ontvanger │ Totaal│ 2024  │
│ │ (fixed)   │       │  →    │
│ ├───────────┼───────┼─────→ │
│ │ ProRail   │ 3.245 │  461  │
│ │ Rijksw... │ 2.123 │  234  │
│ │ NS Reiz.. │ 1.234 │  156  │
│ └───────────┴───────┴─────→ │
│        ← swipe for years →  │
│                             │
│ [Meer laden...]             │
├─────────────────────────────┤
│ [Footer]                    │
└─────────────────────────────┘
```

**Mobile table behavior:**
- First column (Ontvanger) stays fixed
- Totaal column visible by default
- Swipe left/right to see year columns
- Tap row to open detail page

---

## Components

### 1. Header

**Current:** Logo, navigation items, profile dropdown
**Improvement:** Add keyboard shortcut hint (⌘/ or Ctrl+/) for search focus

| Element | Behavior |
|---------|----------|
| Logo | Click → Home/Search page |
| Zoeken | Dropdown with module quick links |
| Inzichten BETA | Link to insights page |
| Support | Link to support/help |
| Profiel | Dropdown: Mijn account, Instellingen, Uitloggen |

**Colors:**
- Background: White (#FFFFFF)
- Text: Dark gray (#333333)
- Logo accent: Pink (#E62D75)

---

### 2. Module Tabs

**Current:** 7 horizontal tabs
**Improvement:** Add result count badges when searching across modules

| Tab | Active State | Inactive State |
|-----|--------------|----------------|
| Selected | Navy background, white text | White background, dark text |
| With results | Show count badge (e.g., "890") | No badge |

**Behavior:**
- Click tab → Filter results to that module
- Current module highlighted
- On mobile: Dropdown selector instead of tabs

---

### 3. Search Bar

**Type:** Text input with autocomplete
**Placeholder:** "Zoek op ontvanger, regeling, of bedrag..."
**Keyboard shortcut:** ⌘/ (Mac) or Ctrl+/ (Windows) to focus

**Behavior:**
| Trigger | Action |
|---------|--------|
| Focus | Show recent searches (if any) |
| Type 3+ chars | Show autocomplete dropdown |
| 300ms after typing stops | Show instant preview results |
| Press Enter | Execute full search |
| Press Escape | Close dropdown, clear focus |
| Arrow keys | Navigate autocomplete suggestions |

**Autocomplete Dropdown:**
```
┌─────────────────────────────────────────────────┐
│ ONTVANGERS                                      │
│   ProRail B.V.                    €461M (2024)  │
│   Prorail Holding B.V.            €23M (2024)   │
│   ProRail Stations                €12M (2024)   │
├─────────────────────────────────────────────────┤
│ REGELINGEN                                      │
│   Programma Hoogfrequent Spoorvervoer           │
│   ProRail Beheer en Onderhoud                   │
├─────────────────────────────────────────────────┤
│ RECENTE ZOEKOPDRACHTEN                          │
│   🕐 prorail 2023                               │
│   🕐 rijkswaterstaat infrastructuur             │
└─────────────────────────────────────────────────┘
```

---

### 4. Actions Row

| Element | Type | Behavior |
|---------|------|----------|
| Filters | Button with badge | Click: Expand/collapse filter panel, Badge shows active count |
| Kolommen | Button | Click: Open column selector modal |

**Note:** "Geconsolideerd op ontvanger" toggle removed. All results now show as expandable summary rows by default.

---

### 5. Filter Panel

**Default state:** Collapsed
**Expanded:** Shows module-specific filters

**Common filters (all modules):**

| Filter | Type | Range |
|--------|------|-------|
| Jaar | Range slider | 2016-2024 (module dependent) |
| Bedrag | Min/Max inputs | €0 - no limit |

**Module-specific filters:** See [Filter Requirements by Module](../../02-requirements/search-requirements.md#filter-requirements-by-module)

**Behavior:**
- Filters apply on change (no "Apply" button - real-time)
- "Wissen" button clears all filters
- Active filters shown as removable chips below filter panel

**Active filter chips:**
```
┌────────────────────────────────────────────────────────────┐
│ Actieve filters: [Jaar: 2020-2024 ✕] [Bedrag: >€1M ✕]     │
└────────────────────────────────────────────────────────────┘
```

---

### 6. Results Summary

**Content:**
- Total result count in current module
- Cross-module results ("Ook in:") - always shown when results exist elsewhere

**Example (in Apparaatsuitgaven module):**
```
23 resultaten in Apparaatsuitgaven

📊 Ook in: Provinciale subsidies (12) • Financiële Instrumenten (3)
```

**Behavior:**
- Shows current module result count
- "Ook in:" shows ALL other modules with results (ordered by count)
- Click module name → Navigate to that module with same search applied
- Updates in real-time as filters change
- If no results in other modules, "Ook in:" line is hidden

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md` (Enhancement 6)

---

### 7. Results Table

**Columns:**
| Column | Width | Sortable | Notes |
|--------|-------|----------|-------|
| Ontvanger | 200px min | Yes (A-Z) | Expandable rows |
| [Custom columns] | 120px each | No | User-selected detail columns |
| 2016-2024 | 80px each | Yes | Per year amounts |
| Totaal | 120px | Yes (default: desc) | Sum of all years |

**Row types:**

| Type | Display | Behavior |
|------|---------|----------|
| Summary row | ▶ ProRail B.V. (bold) | Top-level, shows totals, expandable |
| Line item row | └ Regeling ABC (indented) | Shows individual transaction |

**Expandable behavior:**
```
▶ ProRail B.V.              │  390 │  412 │  461 │ 3.245.000  ← Click ▶ to expand
▼ Rijkswaterstaat           │  245 │  255 │  234 │ 2.123.000  ← Expanded
   ├ Regeling A             │  100 │  110 │  120 │   890.000  ← Line item
   ├ Regeling B             │   80 │   85 │   70 │   650.000  ← Line item
   └ Regeling C             │   65 │   60 │   44 │   583.000  ← Line item
▶ NS Reizigers              │  134 │  145 │  156 │ 1.234.000  ← Collapsed
```

**Row interactions:**
- Click ▶/▼ icon → Expand/collapse line items
- Click recipient name → Open detail page
- Hover → Highlight row

**Amounts:**
- Display: "Alle bedragen x €1.000"
- Format: 1.234.567 (Dutch number format)
- Alignment: Right-aligned

**Empty state:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│     Geen resultaten gevonden                    │
│                                                 │
│     Suggesties:                                 │
│     • Controleer de spelling                    │
│     • Probeer minder filters                    │
│     • Zoek op een deel van de naam              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 8. Column Selector Modal

**Trigger:** Click "⚙ Kolommen" button

```
┌─────────────────────────────────────────────────────────────────┐
│ KOLOMMEN BEHEREN                                       [Sluiten]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Altijd zichtbaar:                                               │
│ ☑ Ontvanger (vast)                                             │
│ ☑ Jaren 2016-2024 (vast)                                       │
│ ☑ Totaal (vast)                                                │
│                                                                 │
│ Detail kolommen:                                                │
│ ☑ Regeling                                                     │
│ ☑ Artikel                                                      │
│ ☐ Artikelonderdeel                                             │
│ ☐ Instrument                                                   │
│ ☐ Begrotingsnaam                                               │
│ ☐ Detail                                                       │
│                                                                 │
│ [Standaard herstellen]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows only columns available for current module
- Changes apply immediately (no save button needed)
- Preferences saved per user, persist across sessions
- "Standaard herstellen" resets to default columns

**Default columns per module (updated 2026-01-23):**
| Module | Default Detail Columns |
|--------|------------------------|
| Financiële Instrumenten | Artikel, Instrument, Regeling |
| Apparaatsuitgaven | Artikel, Detail |
| Inkoopuitgaven | Categorie, Staffel |
| Provinciale subsidieregisters | Provincie, Omschrijving |
| Gemeentelijke subsidieregisters | Gemeente, Omschrijving |
| Publiek | Organisatie |
| Integraal | Modules |

---

### 9. Pagination & Export

| Element | Behavior |
|---------|----------|
| Vorige/Volgende | Navigate pages |
| Page indicator | "Pagina X van Y" |
| Per page selector | Dropdown: 25, 50, 100 |
| CSV | Download current results (max 500 rows) |
| Screenshot | Download table as image |

---

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Search | Type 3+ chars | Show autocomplete suggestions |
| Filter | Change any filter | Update results in real-time |
| Sort | Click column header | Sort by that column (toggle asc/desc) |
| Expand row | Click ▶ icon | Show sub-rows for consolidated recipient |
| View detail | Click recipient name | Open detail in side panel (50% width) |
| Export | Click CSV | Download file (500 row limit) |
| Change module | Click tab | Filter results to that module |
| Clear filters | Click "Wissen" | Reset all filters to default |

---

## States

### Loading
- Skeleton loader in table area
- Search bar shows spinner icon
- "Laden..." text

### No results
- Show empty state message
- Suggest spelling check or fewer filters

### Error
- Red banner at top: "Er ging iets mis. Probeer het opnieuw."
- Retry button

### Default view (no search yet)
- Show random selection of recipients
- Only recipients with amounts in at least 4 different years
- Truly random order (not sorted)
- Refreshes on each page load

---

## Improvements from Current UI

| Current | Improved | Rationale |
|---------|----------|-----------|
| No autocomplete | Autocomplete after 3 chars | Faster discovery, from requirements |
| Toggle between consolidated/line items | Single expandable view | Simpler UX, all data accessible |
| No year slider | Year range slider | Faster filtering, from requirements |
| No amount filter | Amount min/max inputs | Key requirement |
| No module result counts | Badge counts on tabs | Shows data distribution |
| No keyboard shortcuts | ⌘/ to focus search | Power user efficiency |
| No active filter chips | Show chips below filters | Clear what's applied |
| Fixed columns | User-customizable columns | Flexibility per user need |
| Column prefs not saved | Preferences persist per user | Better returning user experience |

---

## Design Tokens

**Reference:** `02-requirements/brand-identity.md` (authoritative source)

### Colors (Brand Identity)
| Token | Value | Usage |
|-------|-------|-------|
| Primary (Pink) | #E62D75 | Buttons, toggles, CTAs, active states |
| Navy Dark | #0E3261 | Headers, footer, primary text |
| Navy Medium | #436FA3 | Links, secondary elements |
| Blue Light | #8DBADC | Hover states, highlights |
| Gray Light | #E1EAF2 | Backgrounds, disabled states |
| Background | #FFFFFF | Page background |
| Border | #E0E0E0 | Dividers, table borders |
| Success | #85C97D | Positive trends |
| Warning | #FFC857 | Attention |
| Error | #E30101 | Negative trends, errors |

### Typography (Brand Identity)
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Logo/Headings | Brawler | 24px | Bold |
| H2 (Section) | IBM Plex Sans Condensed | 18px | Bold |
| Body | IBM Plex Sans Condensed | 14px | Regular |
| Table data | IBM Plex Sans Condensed | 14px | Regular |
| Small/Caption | IBM Plex Sans Condensed | 12px | Regular |

### Spacing
| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Filter application | Real-time (no Apply button) |
| Default view | Random recipients with amounts in 4+ years |
| Mobile priority | Secondary for V1.0 |
| Consolidated toggle | Removed - single expandable view instead |
| Row expansion | ▶ expands to show line items inline |
| Column customization | User selects detail columns, saved per user |
| Module columns | Each module shows only its available columns |
| **Landing page** | Integraal (first tab) - users land on cross-module view |
| **Trend indicator** | Red highlight for 10%+ year-over-year changes |
| **Cross-module results** | Always show "Ook in:" with counts above table |

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md`

## Mobile Approach (Recommendation)

**Suggested:** Horizontal scroll table

**Rationale:**
- Matches requirements document (UX-003: "Horizontal scroll for data tables")
- Keeps familiar table format for power users
- Better for year-over-year comparison (core use case)
- Simpler to implement than card view transformation

**Implementation:**
- Fixed first column (Ontvanger) while years scroll
- Sticky header row
- Touch-friendly scroll indicators
- "Totaal" column visible by default (scroll to see individual years)

---

## Next Steps

1. Review and approve this wireframe
2. Create detailed wireframe for Header/Navigation component
3. Create detailed wireframe for Search Bar with autocomplete
4. Create detailed wireframe for Filter Panel per module

---

**Document Status:** Draft - Awaiting Review
