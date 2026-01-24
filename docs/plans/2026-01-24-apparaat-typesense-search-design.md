# Apparaat Typesense Search Design

**Date:** 2026-01-24
**Status:** Approved
**Decision:** Include Apparaat in global Typesense search

---

## Summary

The Apparaat module (government operational costs) will be included in global search alongside other modules. Since Apparaat has no `ontvanger` field, `kostensoort` (cost type) serves as the primary search field.

---

## Key Decisions

| Decision | Outcome |
|----------|---------|
| Include in global search? | Yes - mixed results with other modules |
| Primary search field | `kostensoort` (weight: 100) |
| Secondary search field | `begrotingsnaam` (weight: 50) |
| First table column | Kostensoort (replaces Ontvanger) |
| Expandable row grouping | User chooses: Begrotingsnaam (default), Artikel, Detail |

---

## Search Behavior

### Global Search Results

When a user searches in the global search bar, Apparaat results appear grouped under "Apparaatsuitgaven":

```
Search: "ICT"
─────────────────────────────────────────────────────────────────
Financiële Instrumenten (8)
  ICT Automatisering B.V.              €2.3M   €2.1M   €1.8M

Apparaatsuitgaven (12)
  ICT advies en ondersteuning          €213M   €215M   €220M
  ICT licenties                        €34M    €31M    €28M

Inkoopuitgaven (3)
  ICT Unie B.V.                        €120K   €95K    €88K
─────────────────────────────────────────────────────────────────
```

### Search Examples

| Search term | Matches |
|-------------|---------|
| "ICT" | Kostensoorten containing "ICT" |
| "Defensie" | All kostensoorten for Ministerie van Defensie |
| "abonnementen" | Kostensoort "Abonnementen op vakbladen" etc. |

### Autocomplete

Kostensoort names appear in autocomplete suggestions, either:
- Mixed with recipients (sorted by relevance)
- Or grouped under "Kostensoorten" section (implementation choice)

---

## Table Structure

### Apparaat Module Page

Same structure as other modules, with Kostensoort replacing Ontvanger:

| Column | Type | Notes |
|--------|------|-------|
| Kostensoort | Primary (fixed) | Equivalent to Ontvanger |
| Begrotingsnaam | Default detail | Ministry name |
| Artikel | Optional detail | Budget article |
| Detail | Optional detail | Additional description |
| 2016-20 ▶ | Collapsible | Older years collapsed |
| 2021-2025 | Year columns | Recent years visible |
| Totaal | Sum | Row total |

### Default View

```
Kostensoort                    | Begrotingsnaam         | 2021  | 2022  | 2023  | Totaal
ICT advies en ondersteuning    | —                      | €213M | €215M | €220M | €648M
Abonnementen vakbladen         | —                      | €12M  | €11M  | €10M  | €33M
```

### Expanded Row (grouped by Begrotingsnaam)

```
▼ ICT advies en ondersteuning  | —                      | €213M | €215M | €220M | €648M
    Ministerie van Defensie    | —                      | €89M  | €92M  | €95M  | €276M
    Ministerie van Financiën   | —                      | €34M  | €31M  | €28M  | €93M
    Ministerie van BZK         | —                      | €45M  | €48M  | €51M  | €144M
```

### Grouping Options

Dropdown selector (same as other modules):
- Begrotingsnaam (default)
- Artikel
- Detail

---

## Typesense Collection

### Schema

```json
{
  "name": "apparaat",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "kostensoort", "type": "string", "facet": true},
    {"name": "begrotingsnaam", "type": "string", "facet": true},
    {"name": "artikel", "type": "string", "facet": true, "optional": true},
    {"name": "detail", "type": "string", "optional": true},
    {"name": "totaal", "type": "int64"}
  ],
  "default_sorting_field": "totaal"
}
```

### Search Configuration

```json
{
  "query_by": "kostensoort,begrotingsnaam",
  "query_by_weights": "100,50"
}
```

### Index Strategy

- **Unit indexed:** Kostensoort + Begrotingsnaam combinations
- **Estimated records:** 2,000-5,000 (small index)
- **Aggregation:** Sum of bedrag across all years per combination
- **Sync:** Same nightly rebuild as other collections

---

## Implementation Notes

### Consistency with Other Modules

The Apparaat module follows the same patterns as other modules:
- Same `DataTable` component
- Same expandable row behavior
- Same grouping selector UI
- Same year column collapse behavior
- Same filter panel structure

Only difference: `kostensoort` field instead of `ontvanger`.

### Filter Panel (Apparaat-specific)

Filters available on Apparaat module page:
- Kostensoort (dropdown)
- Begrotingsnaam (dropdown)
- Artikel (dropdown)
- Year range (slider)
- Amount range (min/max)

---

## Tasks for Implementation

1. **Update Typesense sync script** - Add apparaat collection population
2. **Verify collection schema** - Matches existing `scripts/typesense/collections.json`
3. **Test search** - Verify kostensoort and begrotingsnaam searches work
4. **Update search-requirements.md** - Document Apparaat search behavior

---

**Document Status:** Approved
**Created:** 2026-01-24
