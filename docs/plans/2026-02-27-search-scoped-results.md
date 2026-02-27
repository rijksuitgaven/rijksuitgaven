# Search-Scoped Results: Accurate Amounts for All Active Context

**Date:** 2026-02-27
**Status:** Approved
**Author:** Expert team (DB Architect, Backend Engineer, Frontend Engineer, QA Lead, Adversarial Strategist)

---

## Problem

When searching "deltares" in instrumenten, RVO appears because it has a regeling "Bijdrage aan Deltares". But the amounts shown are RVO's FULL total (€1.829.173.000 across ALL regelingen), not just the Deltares-related portion (~€122M). This misleads users into thinking RVO received €1.8B related to Deltares.

**Root cause:** The aggregated view (`instrumenten_aggregated`) is `GROUP BY ontvanger` — it has no regeling-level granularity. When Typesense finds RVO via a secondary field match, the backend fetches RVO's full aggregated row.

**Second problem:** When filters are active (e.g., regeling="Bijdrage aan Deltares"), the parent row correctly shows filtered amounts, but expanding the row shows ALL detail rows — ignoring the active filter. Same trust violation.

**Principle:** Every number the user sees must be 100% relevant to their active context (search term + filters). No leaked data. This applies to parent rows AND expanded rows.

---

## Design Decision: Hybrid Query Routing (Option B)

- **Primary matches** (ontvanger name contains search term): use aggregated view (fast, full totals ARE correct)
- **Secondary matches** (regeling/artikel/etc. contains search term): use source table with search filter (slower but accurate)

This preserves performance for the 80% case (searching by name) while ensuring accuracy for secondary matches.

---

## Architecture

### Current Flow

```
Search "deltares"
  → Typesense: finds [Stichting Deltares Delft, Stichting Deltares, ..., RVO]
  → PostgreSQL: SELECT * FROM instrumenten_aggregated WHERE ontvanger = ANY(keys)
  → Result: ALL rows show full aggregated totals (WRONG for RVO)
```

### New Flow

```
Search "deltares"
  → Typesense: finds primary_keys + matched_info
  → Split:
    ├── primary_only_keys: [Stichting Deltares Delft, Stichting Deltares, ...]
    │   → Aggregated view WHERE IN (fast, totals correct)
    │
    └── secondary_only_keys: [RVO]  (matched_info has regeling="Bijdrage aan Deltares")
        → Source table WHERE ontvanger = ANY(keys) AND (regeling ~* 'deltares' OR ...)
          GROUP BY ontvanger (accurate filtered totals)
  → Merge → Sort by relevance → Paginate → Return
```

### Key Invariant

A primary key is EITHER a primary match OR a secondary match, never both. This is guaranteed by `_typesense_get_primary_keys_with_highlights`: the primary field is always first in `TYPESENSE_SEARCHABLE_FIELDS`, and once a key enters `seen`, it's skipped for later fields.

---

## Four Changes Required

### Change 1: Backend — Split query paths in `_get_from_aggregated_view`

**File:** `backend/app/services/modules.py`, inside `_get_from_aggregated_view()`, after line ~1006

**Logic:**

```python
if typesense_primary_keys:
    primary_only_keys = [k for k in typesense_primary_keys if k not in typesense_matched_info]
    secondary_only_keys = [k for k in typesense_primary_keys if k in typesense_matched_info]
```

**For primary_only_keys:** Query aggregated view as today (unchanged).

**For secondary_only_keys:** Query source table with search filter:

```sql
SELECT ontvanger AS primary_value,
  COALESCE(SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag END), 0) * 1000 AS y2024,
  -- ... all years ...
  COALESCE(SUM(CASE WHEN begrotingsjaar BETWEEN 2016 AND 2024 THEN bedrag END), 0) * 1000 AS totaal,
  COUNT(*) AS row_count
FROM instrumenten
WHERE ontvanger = ANY($1)
  AND (regeling ~* $2 OR begrotingsnaam ~* $2 OR artikel ~* $2 OR ...)
GROUP BY ontvanger
```

**Merge:** Combine both result sets in Python, sort by relevance score:
- Score 1: exact match on name (primary)
- Score 2: name contains search term (primary)
- Score 3: secondary field match only

**Pagination:** Apply `LIMIT/OFFSET` in Python after merging (not in SQL). Both queries fetch all matching rows (typically <100 total from Typesense's 1000-key limit).

**Totals:** Compute from merged result set. Each row contributes its own (possibly filtered) amounts.

**Count:** `len(primary_only_keys) + len(secondary_only_keys)` from Typesense (already correct).

### Change 2: Backend — Add `search` and `filter_fields` parameters to `get_row_details`

**File:** `backend/app/services/modules.py`, function `get_row_details()` (line ~1535)

**New parameters:**
- `search: Optional[str] = None` — search term for secondary match scoping
- `filter_fields: Optional[dict[str, list[str]]] = None` — active multiselect filters

**When `search` is provided (secondary match expansion):**

```sql
WHERE normalize_recipient(ontvanger) = normalize_recipient($1)
  AND (regeling ~* $2 OR begrotingsnaam ~* $2 OR ...)  -- search_fields excluding primary
GROUP BY regeling
```

**When `filter_fields` is provided (filter-scoped expansion):**

```sql
WHERE normalize_recipient(ontvanger) = normalize_recipient($1)
  AND regeling IN ('Bijdrage aan Deltares', ...)  -- from filter_fields
GROUP BY regeling
```

**When both provided:** Both conditions apply (AND).

**When neither provided:** Behaves exactly as today (all detail rows).

**API endpoint change:** `backend/app/api/v1/modules.py`, details endpoint:
- Accept optional `q` query parameter (search term)
- Accept optional filter field params (same format as main endpoint: `?regeling=value1&regeling=value2`)
- Pass both to `get_row_details`

### Change 3: Frontend — Pass search term for secondary match expansion

**File:** `app/src/components/data-table/expanded-row.tsx`, line ~252

**Logic:**

```typescript
// If this row matched on a secondary field, scope the detail query to the search term
const isSecondaryMatch = row.matchedField != null
const searchParam = isSecondaryMatch && searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''
const url = `${API_BASE_URL}/api/v1/modules/${module}/${encodedValue}/details?group_by=${grouping}${searchParam}${filterParams}`
```

**Props needed:**
- `searchQuery` — the current search term (from module-page `filters.search`)
- `activeFilters` — the current multiselect filter values (from module-page `filters`)

Both must be available in `expanded-row.tsx`. Currently NOT passed — needs threading from `module-page.tsx` → `data-table.tsx` → `expanded-row.tsx`.

### Change 4: Frontend — Pass active filters for filter-scoped expansion

**File:** `app/src/components/data-table/expanded-row.tsx`

**Logic:**

```typescript
// Build filter params from active multiselect filters
const filterParams = Object.entries(activeFilters)
  .filter(([key, values]) => Array.isArray(values) && values.length > 0)
  .map(([key, values]) => values.map(v => `${key}=${encodeURIComponent(v)}`).join('&'))
  .join('&')
const filterSuffix = filterParams ? `&${filterParams}` : ''
```

**Always applied:** Unlike search scoping (only for secondary matches), filter scoping applies to ALL expanded rows when filters are active. If the user filtered to regeling="Bijdrage aan Deltares", every expanded row should only show that regeling.

**Prop threading path:** `module-page.tsx` (has `filters`) → `renderExpandedRow` callback → `ExpandedRow` component.

**Updated `ExpandedRowProps` interface:**

```typescript
interface ExpandedRowProps {
  row: RecipientRow
  module: string
  availableYears: number[]
  extraColumnsCount?: number
  isSearching?: boolean
  searchQuery?: string           // NEW: for secondary match scoping
  activeFilters?: FilterValues   // NEW: for filter-scoped expansion
  onFilterLinkClick?: (field: string, value: string) => void
  initialGrouping?: string
}
```

---

## Match Type Behavior Matrix

| Context | Parent row amounts | Expanded row | "Komt ook voor in" column |
|---|---|---|---|
| **No search, no filters** (browsing) | Full aggregated total | ALL detail rows | Not shown |
| **Search — primary match** (name matches) | Full aggregated total | ALL detail rows | Shows secondary field if also matches |
| **Search — secondary match** (regeling/other matches) | Filtered to matching rows only | ONLY matching detail rows | Shows which field matched |
| **Filter active, no search** | Already filtered (source table path) | ONLY detail rows matching filter | Not shown |
| **Filter + search — primary match** | Filtered by filter | Detail rows matching filter | Shows secondary field if also matches |
| **Filter + search — secondary match** | Filtered by both filter AND search | Detail rows matching both | Shows which field matched |

**Rule:** Expanded rows always reflect the same scope as the parent row. If the parent shows filtered amounts, the expanded view shows only the filtered detail lines.

---

## Performance Impact

| Query | Current | New (primary) | New (secondary) |
|---|---|---|---|
| Aggregated view | ~50-100ms | ~50-100ms (unchanged) | N/A |
| Source table filtered | N/A | N/A | ~100-200ms |
| Merge + sort | N/A | ~1ms (in-memory) | ~1ms |
| **Total** | **~50-100ms** | **~50-100ms** | **~150-250ms** |

Secondary matches are typically a small subset (5-50 keys). Source table query on a small `WHERE IN` set with search filter is fast.

Both queries run in **parallel** via `asyncio.gather`, so total latency = max(primary_query, secondary_query), not sum.

---

## Verification Scenarios

### Search scoping

| # | Scenario | Expected parent row | Expected expanded row | Verification |
|---|----------|--------------------|-----------------------|-------------|
| 1 | "deltares" → Stichting Deltares Delft (primary) | Full total: €139.284.000 | ALL regelingen for this entity | `SELECT * FROM instrumenten_aggregated WHERE ontvanger = 'Stichting Deltares Delft'` |
| 2 | "deltares" → RVO (secondary, regeling match) | Filtered: only "Bijdrage aan Deltares" amounts | Only "Bijdrage aan Deltares" line | `SELECT SUM(bedrag)*1000 FROM instrumenten WHERE ontvanger = 'RVO' AND regeling ~* 'deltares' GROUP BY ontvanger` |
| 3 | "prorail" → ProRail (primary) | Full total | ALL regelingen | Name IS prorail — full total correct |
| 4 | Totals row | Sum of all visible row amounts | N/A | Primary totals + secondary filtered totals |
| 5 | Pagination (page 2) | Correct ordering, no duplicates | N/A | Request pages 1, 2 — check no gaps |
| 6 | Sort by year column | Merged set sorted correctly | N/A | Click 2024 header — verify order |
| 7 | Result count "5 resultaten" | Correct (primary + secondary) | N/A | Count matches visible rows |
| 8 | Cross-module count "Ook in: Inkoop (5)" | Unchanged (Typesense-based) | N/A | Not affected by amount filtering |
| 9 | Entity with primary AND secondary match | Primary path wins (full total) | ALL detail rows | Guaranteed by Typesense field ordering |
| 10 | No search (browsing/random) | Full aggregated total | ALL detail rows | No change — scoping only when searching/filtering |
| 11 | Exact phrase search `"bijdrage aan deltares"` | Same behavior as plain search | Same scoping rules | Parse quotes, use same split logic |
| 12 | Search clears after expanding | Row collapses on search change | Fresh fetch on re-expand | Table re-renders on search change |

### Filter scoping

| # | Scenario | Expected parent row | Expected expanded row | Verification |
|---|----------|--------------------|-----------------------|-------------|
| 13 | Filter regeling="Bijdrage aan Deltares", expand RVO | Filtered total (Deltares portion) | Only "Bijdrage aan Deltares" line | Parent and expanded consistent |
| 14 | Filter provincie="Drenthe", expand an ontvanger | Amounts for Drenthe only | Only Drenthe detail rows | `WHERE ontvanger=$1 AND provincie='Drenthe'` |
| 15 | Filter begrotingsnaam="IX", expand a kostensoort | Amounts for begroting IX only | Only begroting IX detail rows | |
| 16 | Multiple filters active (regeling + artikel) | Amounts matching both filters | Detail rows matching both | AND logic |
| 17 | Filter active, no search, no matches for a row | Row not shown (parent query already excludes) | N/A | Source table path filters parent too |
| 18 | Filter cleared after expanding | Row collapses on filter change | Fresh fetch on re-expand | Table re-renders on filter change |

### Combined search + filter scoping

| # | Scenario | Expected parent row | Expected expanded row | Verification |
|---|----------|--------------------|-----------------------|-------------|
| 19 | Search "deltares" + filter begrotingsnaam="IX" | Secondary matches: filtered by both search AND begroting IX | Only detail rows matching both | Tightest scope |
| 20 | Search "prorail" (primary) + filter regeling="X" | Filtered by regeling (source table path due to filter) | Only regeling X detail rows | Filter overrides "full total" for primary matches |

---

## Affected Files

| File | Change |
|------|--------|
| `backend/app/services/modules.py` | Change 1: Split query in `_get_from_aggregated_view`. Change 2: Add `search` + `filter_fields` to `get_row_details` |
| `backend/app/api/v1/modules.py` | Change 2: Accept `q` + filter params on details endpoint |
| `app/src/components/data-table/expanded-row.tsx` | Changes 3+4: Accept `searchQuery` + `activeFilters`, build scoped detail URL |
| `app/src/components/data-table/data-table.tsx` | Changes 3+4: Thread `searchQuery` + `activeFilters` to `renderExpandedRow` |
| `app/src/components/module-page/module-page.tsx` | Changes 3+4: Pass `filters.search` + `filters` to `renderExpandedRow` callback |

---

## Modules Affected

All 6 modules use the same code path. The fix applies uniformly:

| Module | Primary field | Secondary fields that can trigger filtered amounts |
|--------|--------------|---------------------------------------------------|
| instrumenten | ontvanger | regeling, begrotingsnaam, artikel, instrument, artikelonderdeel, detail |
| apparaat | kostensoort | begrotingsnaam, artikel, detail |
| inkoop | leverancier | ministerie, categorie |
| publiek | ontvanger | source, regeling, omschrijving, trefwoorden, sectoren |
| gemeente | ontvanger | gemeente, beleidsterrein, regeling, omschrijving |
| provincie | ontvanger | provincie, omschrijving |

**Integraal module:** Uses `universal_search` view with its own query path (`get_integraal_data`). Out of scope for this change — integraal shows cross-module presence, not detailed amounts.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Source table query slow for large secondary key sets | Typesense limits to 1000 keys; secondary matches are typically <50. Parallel execution. |
| Inconsistency between parent and expanded row | Both now use same scope (search + filters) — consistent by design |
| Edge case: Typesense field order changes | TYPESENSE_SEARCHABLE_FIELDS has primary first for all modules — add code comment to enforce |
| Pagination correctness with mixed sources | In-memory pagination after merge — simple and correct |
| Totals row semantic mixing | Each row shows its search-relevant amount; totals sum what user sees. Consistent. |
| Expanded row returns 0 detail rows after scoping | Possible if parent was found via a different field than the group_by. Show "Geen resultaten voor deze groepering" message. User can change grouping. |
| Filter params bloat on detail URL | Max 2 active filter columns (existing limit), max 100 values per filter (existing limit). URL size manageable. |

---

## Out of Scope

- Integraal module (different query path, shows cross-module summary)
- Visual indicator on secondary-matched rows (could add later if users request)
- Caching of secondary match queries (premature optimization)

---

## Implementation Order

1. **Backend Change 1:** Split query paths in `_get_from_aggregated_view` — core fix for parent row accuracy
2. **Backend Change 2:** Add `search` + `filter_fields` to `get_row_details` and API endpoint
3. **Frontend Change 3:** Thread `searchQuery` to expanded-row, pass `?q=` for secondary matches
4. **Frontend Change 4:** Thread `activeFilters` to expanded-row, pass filter params for all filtered expansions
5. **Testing:** Verify all 20 scenarios above (search, filter, combined)
6. **Deploy:** Both environments (Scenario A — bug fix affecting data accuracy)
