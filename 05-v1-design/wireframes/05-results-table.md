# Wireframe: Results Table

**Date:** 2026-01-23
**Status:** Approved
**Related:** [Main Search Page](./01-main-search-page.md), [UX-005 Column Customization](../../02-requirements/search-requirements.md)

---

## Purpose

The results table displays search results with:
- Expandable summary rows (recipients) with line items underneath
- Multi-year comparison columns
- User-customizable detail columns
- Sorting by any column

---

## Layout

### Desktop Table (Collapsed Rows)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ontvanger            │ Regeling    │ Artikel │ 2020  │ 2021  │ 2022  │ 2023  │ 2024  │ Totaal ▾ │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▶ ProRail B.V.       │             │         │   345 │   356 │   390 │   412 │   461 │ 3.245.000│
│ ▶ Rijkswaterstaat    │             │         │   234 │   240 │   245 │   255 │   234 │ 2.123.000│
│ ▶ NS Reizigers B.V.  │             │         │   123 │   128 │   134 │   145 │   156 │ 1.234.000│
│ ▶ Schiphol N.V.      │             │         │    89 │    92 │    95 │    98 │   102 │   890.000│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                                 │
│ Alle bedragen x €1.000                                                                          │
│                                                                                                 │
│ [◀ Vorige]  Pagina 1 van 25  [Volgende ▶]         [25 ▾] per pagina         [CSV] [📷]         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop Table (Expanded Row)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ontvanger            │ Regeling                  │ Artikel │ 2022  │ 2023  │ 2024  │ Totaal ▾ │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▶ ProRail B.V.       │                           │         │   390 │   412 │   461 │ 3.245.000│
│ ▼ Rijkswaterstaat    │                           │         │   245 │   255 │   234 │ 2.123.000│
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ │   Rijkswaterstaat  │ Beheer en Onderhoud       │ 12.01   │   100 │   105 │    95 │   890.000│
│ │   Rijkswaterstaat  │ Infrastructuur Uitbreiding│ 12.02   │    80 │    85 │    70 │   650.000│
│ │   Rijkswaterstaat  │ Watermanagement           │ 12.03   │    65 │    65 │    69 │   583.000│
│ └──────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▶ NS Reizigers B.V.  │                           │         │   134 │   145 │   156 │ 1.234.000│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Table (Horizontal Scroll)

```
┌───────────────────────────────────────────────┐
│ Ontvanger (fixed)  │ Totaal   │ 2024 → scroll │
├────────────────────┼──────────┼───────────────┤
│ ▶ ProRail B.V.     │ 3.245.000│   461  │  412 │→
│ ▼ Rijkswaterstaat  │ 2.123.000│   234  │  255 │→
│  └ Beheer en Ond.. │   890.000│    95  │  105 │→
│  └ Infrastructuur  │   650.000│    70  │   85 │→
│ ▶ NS Reizigers     │ 1.234.000│   156  │  145 │→
└────────────────────┴──────────┴───────────────┘
        ← swipe for more years →
```

---

## Row Types

### 1. Summary Row (Recipient Level)

```
│ ▶ ProRail B.V.       │             │         │   461 │ 3.245.000│
```

| Element | Description |
|---------|-------------|
| ▶ icon | Expand indicator (collapsed) |
| Recipient name | Bold, clickable (opens detail page) |
| Detail columns | Empty at summary level |
| Year amounts | Sum of all line items for this recipient |
| Totaal | Grand total across all years |

### 2. Expanded Summary Row

```
│ ▼ Rijkswaterstaat    │             │         │   234 │ 2.123.000│
```

| Element | Description |
|---------|-------------|
| ▼ icon | Collapse indicator (expanded) |
| Rest | Same as summary row |

### 3. Line Item Row

```
│    Rijkswaterstaat  │ Beheer en Onderhoud       │ 12.01   │    95 │   890.000│
```

| Element | Description |
|---------|-------------|
| Indent | Visual indent (no icon) |
| Recipient name | Repeated (lighter color) |
| Detail columns | Filled with Regeling, Artikel, etc. |
| Year amounts | Individual line item amounts |
| Totaal | Line item total |

### 4. Last Line Item Row (Visual Connector)

```
│  └ Watermanagement           │ 12.03   │    69 │   583.000│
```

| Element | Description |
|---------|-------------|
| └ connector | Shows this is the last item in group |

---

## Column Specifications

### Fixed Columns (Always Visible)

| Column | Width | Alignment | Sortable |
|--------|-------|-----------|----------|
| Expand icon | 40px | Center | No |
| Ontvanger | 200px min, flex | Left | Yes (A-Z) |

### Customizable Detail Columns

| Column | Width | Alignment | Sortable |
|--------|-------|-----------|----------|
| Regeling | 180px | Left | Yes |
| Artikel | 80px | Left | Yes |
| Artikelonderdeel | 120px | Left | Yes |
| Instrument | 100px | Left | Yes |
| Begrotingsnaam | 150px | Left | Yes |
| (varies by module) | varies | Left | Yes |

### Year Columns

| Column | Width | Alignment | Sortable |
|--------|-------|-----------|----------|
| 2016 | 80px | Right | Yes |
| 2017 | 80px | Right | Yes |
| ... | ... | ... | ... |
| 2024 | 80px | Right | Yes |

### Total Column

| Column | Width | Alignment | Sortable |
|--------|-------|-----------|----------|
| Totaal | 100px | Right | Yes (default desc) |

---

## Sorting Behavior

### Sort Indicators

```
│ Ontvanger ▲ │  ← Ascending (A-Z)
│ Totaal ▾    │  ← Descending (default for amounts)
```

| Click | Result |
|-------|--------|
| Unsorted column | Sort ascending |
| Ascending column | Sort descending |
| Descending column | Remove sort (return to default) |

### Default Sort

- **Before search:** Random order (per UX-002 requirement)
- **After search:** Relevance score (best match first)
- **After column click:** User-selected sort

### Sorting with Expanded Rows

- Summary rows sorted according to column
- Line items stay grouped under their summary row
- Line items sorted by amount within their group

---

## Row Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Expand | Click ▶ icon | Show line items below |
| Collapse | Click ▼ icon | Hide line items |
| View detail | Click recipient name | Open detail in side panel |
| Hover | Mouse over row | Highlight row background |
| Select (future) | Checkbox | Add to selection for export |

### Expand/Collapse Behavior

```
Click ▶ on ProRail:
├── API request to fetch line items for ProRail
├── Show loading skeleton in expanded area
├── Display line items when loaded
└── Icon changes to ▼

Click ▼ on ProRail:
└── Collapse instantly (data cached)
```

---

## Pagination

### Controls

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [◀ Vorige]  Pagina 1 van 25  [Volgende ▶]         [25 ▾] per pagina            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| Vorige | Go to previous page (disabled on page 1) |
| Page indicator | Current page / total pages |
| Volgende | Go to next page (disabled on last page) |
| Per page dropdown | 25, 50, 100 options |

### Pagination Rules

- Pagination applies to summary rows only
- Expanded line items don't count toward page limit
- Changing per-page resets to page 1

---

## Export Controls

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                   [CSV] [📷]    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### CSV Export

| Property | Value |
|----------|-------|
| Max rows | 500 (hard limit) |
| Content | Current filtered results |
| Columns | All visible columns |
| Line items | Included (expanded format) |

**Export confirmation dialog (if >500 rows):**
```
┌─────────────────────────────────────────────────┐
│ Export beperkt tot 500 rijen                    │
│                                                 │
│ Er zijn 1.234 resultaten. Alleen de eerste     │
│ 500 rijen worden geëxporteerd.                 │
│                                                 │
│ Tip: Gebruik filters om resultaten te          │
│ verfijnen.                                      │
│                                                 │
│              [Annuleren]  [Exporteren]          │
└─────────────────────────────────────────────────┘
```

### Screenshot Export

| Property | Value |
|----------|-------|
| Format | PNG image |
| Content | Visible table area |
| Filename | rijksuitgaven-export-YYYY-MM-DD.png |

---

## States

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ontvanger            │ Regeling    │ Artikel │ 2022  │ 2023  │ 2024  │ Totaal  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░ │ ░░░░░░░░░░ │ ░░░░░░ │ ░░░░ │ ░░░░ │ ░░░░ │ ░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░ │ ░░░░░░░░░░ │ ░░░░░░ │ ░░░░ │ ░░░░ │ ░░░░ │ ░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░ │ ░░░░░░░░░░ │ ░░░░░░ │ ░░░░ │ ░░░░ │ ░░░░ │ ░░░░░░░ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                 │
│                                 Geen resultaten gevonden                                        │
│                                                                                                 │
│                                      Suggesties:                                               │
│                                 • Controleer de spelling                                       │
│                                 • Probeer minder filters                                       │
│                                 • Zoek op een deel van de naam                                │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                 │
│                            ⚠ Er ging iets mis bij het laden                                    │
│                                                                                                 │
│                                    [Opnieuw proberen]                                          │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Line Items Loading (Expanded)

```
│ ▼ Rijkswaterstaat    │             │         │   234 │ 2.123.000│
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ │   ⟳ Laden...                                                                                │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┤
```

---

## Number Formatting

### Display Format

| Type | Format | Example |
|------|--------|---------|
| Year amounts | Dutch thousands | 1.234 |
| Totaal | Dutch thousands | 3.245.000 |
| Note | Displayed above table | "Alle bedragen x €1.000" |

### Alignment

- All numbers right-aligned
- Decimal points aligned vertically
- Thousands separator: period (Dutch format)

---

## Design Tokens

**Reference:** `02-requirements/brand-identity.md` (authoritative source)

### Colors (Brand Identity)

| Token | Value | Usage |
|-------|-------|-------|
| Row background | #FFFFFF | Default row |
| Row hover | #E1EAF2 | Hover state (Gray Light) |
| Row alternate | #E1EAF2 | Zebra striping (Gray Light) |
| Line item bg | #E1EAF2 | Expanded line items (Gray Light) |
| Header bg | #E1EAF2 | Table header (Gray Light) |
| Border | #E0E0E0 | Cell borders |
| Text primary | #0E3261 | Recipient names, amounts (Navy Dark) |
| Text secondary | #436FA3 | Line item recipients (Navy Medium) |
| Trend positive | #85C97D | Positive year-over-year (Success) |
| Trend negative | #E30101 | Negative year-over-year (Error) |

### Typography (Brand Identity)

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Header | IBM Plex Sans Condensed | 13px | Bold |
| Summary row | IBM Plex Sans Condensed | 14px | Medium |
| Line item | IBM Plex Sans Condensed | 14px | Regular |
| Amounts | IBM Plex Sans Condensed | 14px | Regular, tabular nums |

### Spacing

| Element | Value |
|---------|-------|
| Cell padding | 12px horizontal, 8px vertical |
| Row height (summary) | 48px |
| Row height (line item) | 40px |
| Indent (line items) | 24px |

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Table role | role="table" with proper structure |
| Sort buttons | aria-sort="ascending/descending/none" |
| Expand buttons | aria-expanded="true/false" |
| Row headers | th scope="row" for recipients |
| Focus | Visible focus on interactive elements |

---

## Performance

| Scenario | Approach |
|----------|----------|
| Large result sets | Paginate (25/50/100 per page) |
| Line items | Lazy load on expand |
| Sorting | Server-side for large sets |
| Caching | Cache expanded line items |

---

## Open Questions

None - specifications complete.

---

## Next Steps

1. Review and approve
2. Proceed to Detail Page wireframe

---

**Document Status:** Draft - Awaiting Review
