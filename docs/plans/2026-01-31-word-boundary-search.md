# Word-Boundary Search Design

**Date:** 2026-01-31
**Status:** Approved
**Author:** Claude (UX Specialist)

## Problem

When searching "politie", the "Ook in:" cross-module indicator shows inflated counts:
- "Ook in: Inkoop (28)" includes partial matches like "De Designpolitie" (a design company)
- This breaks user expectations - they expect 28 results about police

## Solution

Replace substring matching with word-boundary matching:

| Before | After |
|--------|-------|
| `ILIKE '%politie%'` | `~* '\ypolitie\y'` |
| Matches "Designpolitie" | Does NOT match "Designpolitie" |
| Matches "Politieacademie" | Does NOT match "Politieacademie" |
| Matches "Nationale Politie" | Matches "Nationale Politie" ✓ |

## UX Rationale

1. **User mental model**: Searching "politie" means looking for the police organization
2. **Trust in numbers**: "Ook in: Inkoop (5)" should show ~5 results when clicked
3. **Quality over quantity**: 5 relevant results > 28 noisy results
4. **Professional audience**: Journalists, researchers value precision

## Technical Implementation

### Single Point of Change

**File:** `backend/app/services/modules.py`

**Function:** `build_search_condition()`

```python
def build_search_condition(field: str, param_idx: int, search: str) -> tuple[str, str]:
    """
    Build a search condition with word-boundary matching.

    Uses PostgreSQL regex \y for word boundaries.
    "politie" matches "Politie", "Nationale Politie"
    but NOT "Designpolitie", "Politieacademie"
    """
    search_lower = search.lower().strip()

    # Escape regex special characters in search term
    escaped = re.escape(search_lower)

    # Word boundary matching: \y = word boundary in PostgreSQL
    return (
        f"{field} ~* ${param_idx}",
        f"\\y{escaped}\\y"
    )
```

### Affected Search Locations

All locations already use `build_search_condition()`:

| Location | Purpose |
|----------|---------|
| `get_module_data()` | Main table results |
| `get_module_data_from_source()` | Source table fallback |
| `get_integraal_data()` | Cross-module results |
| `get_autocomplete_suggestions()` | Autocomplete dropdown |

### No Frontend Changes

The `CrossModuleResults` component calls the API - it automatically gets word-boundary counts.

## Test Cases

| Search | Should Match | Should NOT Match |
|--------|--------------|------------------|
| politie | Politie, Nationale Politie, Politie B.V. | Designpolitie, Politieacademie |
| prorail | ProRail, ProRail B.V. | ProRailInfra |
| ns | NS, NS Reizigers | BANS, NSR |
| wolf | Wolf Fencing B.V., Stichting Wolf | Wolfsburg, Rudolph Wolf |

## Migration Note

Users who relied on partial matching (searching "politie" to find "Politieacademie") will need to search the full term. This is the intended behavior - more precise, less noise.

## Alternatives Considered

1. **Exact match only**: Too restrictive - "Nationale Politie" wouldn't match
2. **Different logic for counts vs results**: Creates confusing mismatch
3. **Wildcard syntax (politie*)**: Adds complexity, learning curve

Word-boundary matching is the best balance of precision and usability.
