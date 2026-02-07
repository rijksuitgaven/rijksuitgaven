# Data Availability Indicators Design

**Date:** 2026-02-06
**Status:** Approved
**Effort:** 3-5 hours

---

## Problem Statement

Users need to distinguish between:
- **Real zero** - Entity received €0 (confirmed data)
- **No data** - Data doesn't exist for this entity/year combination

Examples:
- Gemeente Amersfoort has data for 2020-2024, but not 2016-2019
- When 2025 data arrives, some modules will have it before others
- Different provincies/gemeentes/organisaties publish data for different year ranges

Current state: All empty cells show `-` which is ambiguous.

---

## Solution Overview

**Two-state display:**
| Cell shows | Meaning |
|------------|---------|
| `12.345.000` | Real amount |
| `0` | Real zero (confirmed €0) |
| `—` (em-dash) | No data exists for this entity/year |

**Tooltip on `—`:** "Geen data beschikbaar voor deze periode"

---

## Data Availability Granularity

| Module | Granularity | Entity Column |
|--------|-------------|---------------|
| instrumenten | Module-level | N/A |
| inkoop | Module-level | N/A |
| apparaat | Module-level | N/A |
| gemeente | Per gemeente | `gemeente` |
| provincie | Per provincie | `provincie` |
| publiek | Per organisatie | `source` |

---

## Database Schema

### Table: `data_availability`

```sql
CREATE TABLE data_availability (
  id SERIAL PRIMARY KEY,
  module TEXT NOT NULL,           -- 'instrumenten', 'gemeente', etc.
  entity_type TEXT,               -- NULL for module-level, 'gemeente'/'provincie'/'source' for entity-level
  entity_name TEXT,               -- NULL for module-level, 'Amersfoort'/'Gelderland'/'RVO' for entity-level
  year_from INT NOT NULL,         -- First year with data (e.g., 2020)
  year_to INT NOT NULL,           -- Last year with data (e.g., 2024)
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(module, entity_type, entity_name)
);

-- RLS: Public read access
ALTER TABLE data_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON data_availability FOR SELECT USING (true);
```

### Example Data

| module | entity_type | entity_name | year_from | year_to |
|--------|-------------|-------------|-----------|---------|
| instrumenten | NULL | NULL | 2016 | 2024 |
| inkoop | NULL | NULL | 2016 | 2024 |
| apparaat | NULL | NULL | 2016 | 2024 |
| gemeente | gemeente | Amersfoort | 2020 | 2024 |
| gemeente | gemeente | Amsterdam | 2016 | 2024 |
| provincie | provincie | Gelderland | 2019 | 2024 |
| provincie | provincie | Utrecht | 2017 | 2024 |
| publiek | source | RVO | 2016 | 2024 |
| publiek | source | COA | 2018 | 2024 |
| publiek | source | NWO | 2016 | 2024 |
| publiek | source | ZonMW | 2016 | 2024 |

### Maintenance

- Update `year_to` when new year data arrives
- Add rows when new entities (gemeentes) join
- Edit directly via Supabase Studio dashboard
- Expected update frequency: A few times per month

---

## API Changes

### Module Response

Add availability fields to each row:

```json
{
  "data": [
    {
      "primary_value": "Amersfoort",
      "years": [
        {"year": 2021, "amount": 5000},
        {"year": 2022, "amount": 12000}
      ],
      "total": 25000,
      "data_available_from": 2020,
      "data_available_to": 2024
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 50
  }
}
```

### Backend Logic

```python
# For module-level (instrumenten, inkoop, apparaat):
# Single lookup, apply to all rows
availability = await fetch_one(
    "SELECT year_from, year_to FROM data_availability WHERE module = $1 AND entity_type IS NULL",
    module
)

# For entity-level (gemeente, provincie, publiek):
# Join on entity column
# entity_type = 'gemeente' for gemeente module, 'provincie' for provincie, 'source' for publiek
```

**Fallback:** If no specific entry exists for an entity, use module-level default (or assume full range).

---

## Frontend Changes

### Type Update

```typescript
interface RecipientRow {
  primary_value: string
  years: YearAmount[]
  total: number
  // ... existing fields
  data_available_from?: number  // NEW
  data_available_to?: number    // NEW
}
```

### Cell Rendering Logic

```typescript
function renderYearCell(year: number, amount: number, row: RecipientRow) {
  const from = row.data_available_from ?? 2016
  const to = row.data_available_to ?? 2024

  // Year outside availability range
  if (year < from || year > to) {
    return (
      <span
        className="text-[var(--muted-foreground)] bg-[var(--gray-light)]/50"
        title="Geen data beschikbaar voor deze periode"
      >
        —
      </span>
    )
  }

  // Normal rendering (amount or 0)
  return formatAmount(amount)
}
```

### Collapsed Years Column (2016-2020)

```typescript
function renderCollapsedYears(row: RecipientRow, collapsedYears: number[]) {
  const from = row.data_available_from ?? 2016
  const to = row.data_available_to ?? 2024

  // Filter to years within availability range
  const availableYears = collapsedYears.filter(y => y >= from && y <= to)

  // All years outside range
  if (availableYears.length === 0) {
    return <span title="Geen data beschikbaar voor deze periode">—</span>
  }

  // Sum available years only
  const sum = availableYears.reduce((acc, year) => {
    return acc + (row.years.find(y => y.year === year)?.amount ?? 0)
  }, 0)

  return formatAmount(sum)
}
```

### Footer Text

Remove: `* Data nog niet compleet`

The em-dash with tooltip is self-explanatory.

---

## Edge Cases

### Totals Row
- Shows em-dash `—` for years where ALL visible rows have no data for that year
- Shows sum of available data when at least one row has data for the year
- Collapsed years (2016-2020): shows em-dash if all collapsed years are unavailable for all rows

### Expanded Row
- Inherits `data_available_from/to` from parent row
- Same rendering logic applies to detail rows

### Integraal Module
- Cross-module aggregation
- Each row shows combined range across all modules the entity appears in
- If entity only appears in Gemeente/Amersfoort (2020-2024), range is 2020-2024

---

## Implementation Steps

### Step 1: Database (30 min)
- [ ] Create `data_availability` table in Supabase
- [ ] Import initial data from spreadsheet
- [ ] Add RLS policy (public read)

### Step 2: Backend API (1-2 hours)
- [ ] Add `data_available_from` and `data_available_to` to `AggregatedRow` model
- [ ] Module-level lookup for instrumenten/inkoop/apparaat
- [ ] Entity-level JOIN for gemeente/provincie/publiek
- [ ] Include fields in API response

### Step 3: Frontend (1-2 hours)
- [ ] Update `RecipientRow` TypeScript interface
- [ ] Update cell rendering logic in `data-table.tsx`
- [ ] Add em-dash with tooltip for unavailable years
- [ ] Update collapsed years column logic
- [ ] Remove `* Data nog niet compleet` footer text

### Step 4: Expanded Row (30 min)
- [ ] Pass availability fields to `expanded-row.tsx`
- [ ] Apply same rendering logic

---

## Visual Example

**Gemeente Amersfoort (data available 2020-2024):**

| Ontvanger | 2016-20 | 2021 | 2022 | 2023 | 2024 | Totaal |
|-----------|---------|------|------|------|------|--------|
| Amersfoort | — | 5.000 | 12.000 | 8.000 | 0 | 25.000 |

**Gemeente Amsterdam (data available 2016-2024):**

| Ontvanger | 2016-20 | 2021 | 2022 | 2023 | 2024 | Totaal |
|-----------|---------|------|------|------|------|--------|
| Amsterdam | 450.000 | 120.000 | 135.000 | 142.000 | 98.000 | 945.000 |

---

## Future Considerations

- **Admin UI:** If updates become more frequent, consider a simple admin interface
- **Automated detection:** Script to detect new entities and prompt for availability entry
- **Historical tracking:** Track when availability changed (audit trail)

These are NOT in scope for V1.0.
