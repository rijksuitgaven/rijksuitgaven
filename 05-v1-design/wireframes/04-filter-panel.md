# Wireframe: Filter Panel

**Date:** 2026-01-23
**Status:** Approved
**Related:** [Search Requirements SR-009, SR-010](../../02-requirements/search-requirements.md), [Main Search Page](./01-main-search-page.md)

---

## Purpose

The filter panel allows users to narrow search results using:
- Common filters (year range, amount range)
- Module-specific filters (varies per module)
- Real-time filtering (no Apply button)

---

## Layout

### Collapsed State (Default)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                [Filters ▾ (0)]    [⚙ Kolommen] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Collapsed with Active Filters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                [Filters ▾ (3)]    [⚙ Kolommen] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Actieve filters: [Jaar: 2020-2024 ✕] [Bedrag: >€1M ✕] [Instrument: Subsidies ✕]│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Expanded State - Financiële Instrumenten

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                [Filters ▲ (3)]    [⚙ Kolommen] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ FILTERS                                                        [Wissen] │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  PERIODE                                                                │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│  │  │  2016  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●  2024 │ │   │
│  │  │        ▲ 2020                                      2024 ▲        │ │   │
│  │  └───────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                         │   │
│  │  BEDRAG (x €1.000)                                                      │   │
│  │  ┌─────────────────────┐      ┌─────────────────────┐                  │   │
│  │  │ Min:          1.000 │  tot │ Max:                │                  │   │
│  │  └─────────────────────┘      └─────────────────────┘                  │   │
│  │                                                                         │   │
│  │  ───────────────────────────────────────────────────────────────────── │   │
│  │                                                                         │   │
│  │  MODULE FILTERS                                                         │   │
│  │                                                                         │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                    │   │
│  │  │ Begrotingsnaam     ▾ │  │ Artikel            ▾ │                    │   │
│  │  │ Infrastructuurfonds  │  │ Selecteer...         │                    │   │
│  │  └──────────────────────┘  └──────────────────────┘                    │   │
│  │                                                                         │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                    │   │
│  │  │ Artikelonderdeel   ▾ │  │ Instrument         ▾ │                    │   │
│  │  │ Selecteer...         │  │ Subsidies            │                    │   │
│  │  └──────────────────────┘  └──────────────────────┘                    │   │
│  │                                                                         │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                    │   │
│  │  │ Detail             ▾ │  │ Regeling           ▾ │                    │   │
│  │  │ Selecteer...         │  │ Selecteer...         │                    │   │
│  │  └──────────────────────┘  └──────────────────────┘                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Actieve filters: [Jaar: 2020-2024 ✕] [Bedrag: >€1M ✕] [Instrument: Subsidies ✕]│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Filter Panel (Bottom Sheet)

```
┌─────────────────────────────┐
│ FILTERS              [Sluit]│
├─────────────────────────────┤
│                             │
│ PERIODE                     │
│ [2020]  ───●●───  [2024]    │
│                             │
│ BEDRAG (x €1.000)           │
│ Min: [________]             │
│ Max: [________]             │
│                             │
│ ─────────────────────────── │
│                             │
│ Begrotingsnaam              │
│ [Selecteer...            ▾] │
│                             │
│ Artikel                     │
│ [Selecteer...            ▾] │
│                             │
│ Instrument                  │
│ [Subsidies               ▾] │
│                             │
│ [Wissen]                    │
│                             │
└─────────────────────────────┘
```

---

## Module-Specific Filters

### Financiële Instrumenten

| Filter | Type | Options |
|--------|------|---------|
| Begrotingsnaam | Dropdown | List from database |
| Artikel | Dropdown | List from database |
| Artikelonderdeel | Dropdown | List from database |
| Instrument | Dropdown | Subsidies, Garanties, Leningen, etc. |
| Detail | Dropdown | List from database |
| Regeling | Dropdown | List from database |

### Apparaatsuitgaven

| Filter | Type | Options |
|--------|------|---------|
| Kostensoort | Dropdown | Salaris, Belastingen, Eigen personeel, etc. |
| Begrotingsnaam | Dropdown | List from database |
| Artikel | Dropdown | List from database |
| Detail | Dropdown | List from database |

### Inkoopuitgaven

| Filter | Type | Options |
|--------|------|---------|
| Ministerie | Dropdown | List of ministries |
| Categorie | Dropdown | List from database |
| Staffel | Dropdown | Amount brackets |

### Provinciale Subsidieregisters

| Filter | Type | Options |
|--------|------|---------|
| Provincie | Dropdown | 12 provinces |
| Omschrijving | Text search | Free text |

### Gemeentelijke Subsidieregisters

| Filter | Type | Options |
|--------|------|---------|
| Gemeente | Dropdown/Search | 342+ municipalities |
| Beleidsterrein | Dropdown | Policy areas |
| Regeling | Dropdown | List from database |
| Omschrijving | Text search | Free text |

### Publiek

| Filter | Type | Options |
|--------|------|---------|
| Organisatie | Dropdown | RVO, COA, NWO, etc. |
| Regeling | Dropdown | Depends on Organisatie |
| Trefwoorden | Multi-select | Keywords (RVO) |
| Sectoren | Multi-select | Sectors (RVO) |
| Regio | Dropdown | Regions |
| Staffel | Dropdown | Amount brackets (COA) |
| Onderdeel | Dropdown | Parts (NWO) |

**Note (2026-01-23):** Renamed "Bron" to "Organisatie" for clarity. These are public implementation organizations (RVO, COA, NWO), not data sources.

### Integraal

| Filter | Type | Options |
|--------|------|---------|
| Modules | Multi-select | All 6 other modules |
| Instanties per ontvanger | Range slider | 1-31 |
| Totaal aantal betalingen | Range slider | 1-500 |

---

## Component Specifications

### Filter Button

```
┌─────────────────────┐
│ Filters ▾ (3)       │
└─────────────────────┘
```

| State | Style |
|-------|-------|
| Default (0 filters) | Gray text, no badge |
| Active (n filters) | Pink badge with count |
| Expanded | Arrow up ▲ |

### Year Range Slider

```
┌───────────────────────────────────────────────────────────────────┐
│  2016  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●  2024 │
│        ▲ Selected start                    Selected end ▲        │
└───────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Track color | #E0E0E0 |
| Selected range | #E62D75 |
| Handle | Circle, #E62D75 |
| Labels | Years at each end |

### Amount Range Inputs

```
┌─────────────────────┐      ┌─────────────────────┐
│ Min:          1.000 │  tot │ Max:                │
└─────────────────────┘      └─────────────────────┘
```

| Property | Value |
|----------|-------|
| Format | Dutch number format (1.000.000) |
| Validation | Numbers only |
| Unit | Displayed as "x €1.000" in header |

### Dropdown Filter

```
┌──────────────────────────┐
│ Begrotingsnaam         ▾ │
│ Infrastructuurfonds      │
└──────────────────────────┘
```

**Expanded dropdown:**
```
┌──────────────────────────┐
│ Begrotingsnaam         ▲ │
├──────────────────────────┤
│ 🔍 Zoeken...             │
├──────────────────────────┤
│ ☑ Infrastructuurfonds    │
│ ☐ Defensie               │
│ ☐ Economische Zaken      │
│ ☐ Financiën              │
│ ☐ Justitie en Veiligheid │
│ ...                      │
└──────────────────────────┘
```

| Feature | Behavior |
|---------|----------|
| Search | Filter options as you type |
| Multi-select | Checkboxes for multiple values |
| Single-select | Radio buttons (some filters) |
| Scroll | Scrollable list if >8 options |

### Active Filter Chips

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Actieve filters: [Jaar: 2020-2024 ✕] [Bedrag: >€1M ✕] [Instrument: Subsidies ✕]│
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | Light pink (#F3A3C1) |
| Text | Dark gray (#333333) |
| Close icon | ✕, clickable |
| Max width | 200px (truncate with ...) |

---

## Behavior

### Real-Time Filtering

| Event | Action |
|-------|--------|
| Change filter | Update results immediately |
| Debounce | 300ms for text inputs |
| Loading | Show skeleton in results table |

### Filter Dependencies

Some filters depend on others:

| When | Then |
|------|------|
| Select Begrotingsnaam | Artikel options filter to that budget |
| Select Artikel | Artikelonderdeel options filter |
| Select Bron (Publiek) | Regeling options change per source |

### Clear Filters

| Action | Result |
|--------|--------|
| Click "Wissen" | Reset all filters to default |
| Click chip ✕ | Remove that specific filter |
| Change module tab | Preserve common filters, clear module-specific |

### Persistence

| Scope | Behavior |
|-------|----------|
| Session | Filters persist during session |
| Page reload | Filters reset (or save to URL params?) |
| Module switch | Common filters persist, module-specific reset |

---

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Open panel | Click "Filters ▾" | Expand filter panel |
| Close panel | Click "Filters ▲" | Collapse panel |
| Change year | Drag slider handles | Update results |
| Enter amount | Type in min/max | Update results (debounced) |
| Select dropdown | Click option | Update results, close dropdown |
| Clear all | Click "Wissen" | Reset all filters |
| Remove filter | Click chip ✕ | Remove that filter |

---

## States

| State | Visual |
|-------|--------|
| No filters | "Filters ▾ (0)", no chips |
| Has filters | "Filters ▾ (3)", chips shown |
| Expanded | Panel visible, arrow up |
| Collapsed | Panel hidden, arrow down |
| Loading | Results table shows skeleton |

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard | Tab through filters, Enter/Space to select |
| ARIA | aria-expanded on panel, aria-selected on options |
| Labels | All inputs have associated labels |
| Focus | Visible focus indicators |

---

## Design Tokens

**Reference:** `02-requirements/brand-identity.md` (authoritative source)

### Colors (Brand Identity)
| Token | Value | Usage |
|-------|-------|-------|
| Panel background | #E1EAF2 | Filter panel bg (Gray Light) |
| Slider track | #E0E0E0 | Unselected range |
| Slider selected | #E62D75 | Selected range (Pink) |
| Slider handle | #E62D75 | Handle (Pink) |
| Chip background | #F3A3C1 | Active filter chip (Chart pink 1) |
| Chip text | #0E3261 | Chip label (Navy Dark) |

### Typography (Brand Identity)
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Section header | IBM Plex Sans Condensed | 11px | Bold, uppercase |
| Filter label | IBM Plex Sans Condensed | 14px | Medium |
| Filter value | IBM Plex Sans Condensed | 14px | Regular |
| Chip text | IBM Plex Sans Condensed | 12px | Medium |

### Spacing
| Element | Value |
|---------|-------|
| Panel padding | 16px |
| Filter gap | 16px |
| Chip gap | 8px |

---

## Open Questions

1. **URL parameters:** Should active filters be saved in URL for sharing/bookmarking?
   - Recommendation: Yes, enables sharing filtered views

---

## Next Steps

1. Review and approve
2. Proceed to Results Table wireframe

---

**Document Status:** Draft - Awaiting Review
