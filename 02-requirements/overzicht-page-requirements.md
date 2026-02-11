# Overzicht Page Requirements

**Created:** 2026-01-20
**Updated:** 2026-02-11 (status verification)
**Version:** Deferred to V5
**Source:** Brainstorm session

**Status:** ⏳ DEFERRED TO V5 (AI Research Mode)
**Rationale:** See backlog.md "Overzichtspagina / Recipient Profile Panel" — V1 expanded row covers the functional need. A comprehensive recipient profile panel is not needed until V5 when AI Research requires full recipient context.

---

## Overview

Dedicated overview page showing total government spending per module and year. Provides a high-level entry point for users to understand spending distribution before drilling into specific modules.

---

## Page Purpose

- Show total spending across ALL modules
- Display year-over-year trends at module level
- Allow drill-down into sub-sources (where applicable)
- Serve as navigation hub to module pages

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Overzicht                                                                   │
│  Totaal overheidsuitgaven per module en jaar                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Module                    │ 2020    │ 2021    │ 2022    │ 2023    │ Totaal   │
├───────────────────────────┼─────────┼─────────┼─────────┼─────────┼──────────┤
│ ▶ Financiële Instrumenten │ €12.5B  │ €13.2B  │ €14.1B  │ €15.0B  │ €85.2B   │
│ ▶ Apparaatsuitgaven       │ €8.2B   │ €8.5B   │ €8.9B   │ €9.1B   │ €52.3B   │
│ ▼ Publiek                 │ €2.1B   │ €2.4B   │ €2.5B   │ €2.6B   │ €16.3B   │
│   ├─ RVO                  │ €1.2B   │ €1.4B   │ €1.5B   │ €1.6B   │ €9.8B    │
│   ├─ NWO                  │ €890M   │ €920M   │ €950M   │ €980M   │ €6.2B    │
│   └─ COA                  │ €45M    │ €52M    │ €48M    │ €55M    │ €320M    │
│ ▼ Provinciale subsidies   │ €1.8B   │ €1.9B   │ €2.0B   │ €2.1B   │ €12.4B   │
│   ├─ Noord-Holland        │ €450M   │ €480M   │ €490M   │ €510M   │ €3.1B    │
│   ├─ Zuid-Holland         │ €420M   │ €440M   │ €460M   │ €480M   │ €2.9B    │
│   └─ ... (10 more provinces)                                                 │
│ ▼ Gemeentelijke subsidies │ €3.2B   │ €3.4B   │ €3.6B   │ €3.8B   │ €22.1B   │
│   ├─ Amsterdam            │ €850M   │ €900M   │ €950M   │ €980M   │ €5.8B    │
│   ├─ Rotterdam            │ €620M   │ €650M   │ €680M   │ €710M   │ €4.2B    │
│   └─ [Toon alle 342 gemeentes]                                               │
│ ▶ Inkoopuitgaven          │ €5.1B   │ €5.3B   │ €5.6B   │ €5.9B   │ €35.8B   │
├───────────────────────────┼─────────┼─────────┼─────────┼─────────┼──────────┤
│ TOTAAL                    │ €32.9B  │ €34.7B  │ €36.7B  │ €38.5B  │ €224.1B  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Modules and Sub-Sources

| Module | Has Sub-Sources | Expands To | Group By Field |
|--------|-----------------|------------|----------------|
| Financiële Instrumenten | No | - | - |
| Apparaatsuitgaven | No | - | - |
| Publiek | Yes | RVO, COA, NWO | `Source` / `Bron` |
| Provinciale subsidies | Yes | 12 provinces | `Provincie` |
| Gemeentelijke subsidies | Yes | 300+ municipalities | `Gemeente` |
| Inkoopuitgaven | No | - | - |

---

## Sub-Source Display Rules

### Publiek
- Show all 3 sub-sources (RVO, COA, NWO)
- Sorted by total descending

### Provinciale subsidies
- Show all 12 provinces
- Sorted by total descending

### Gemeentelijke subsidies
- Show top 10 municipalities by total
- Display "[Toon alle X gemeentes]" link at bottom
- Click link: expand to show all (paginated if needed)
- Sorted by total descending

---

## Columns

| Column | Description |
|--------|-------------|
| Module | Module name with expand/collapse icon |
| 2016-2024 | Year columns (configurable range) |
| Totaal | Sum across all years |

---

## Click Behavior

| Element | Click Action |
|---------|--------------|
| Module name | Navigate to module page (unfiltered) |
| Sub-source name | Navigate to module page with filter applied |
| ▶/▼ icon | Expand/collapse sub-sources (no navigation) |
| "[Toon alle X gemeentes]" | Expand to show all municipalities |

### Navigation Examples

| Click | Navigates To |
|-------|--------------|
| "Financiële Instrumenten" | `/instrumenten` |
| "RVO" (under Publiek) | `/publiek?bron=RVO` |
| "Amsterdam" (under Gemeentes) | `/gemeente?gemeente=Amsterdam` |
| "Noord-Holland" (under Provincies) | `/provincie?provincie=Noord-Holland` |

---

## Data Architecture

### Pre-computed Totals Table

Since this data changes only with monthly data updates, pre-compute totals:

```sql
CREATE TABLE module_totals (
  id SERIAL PRIMARY KEY,
  module VARCHAR NOT NULL,           -- 'instrumenten', 'publiek', etc.
  sub_source VARCHAR,                -- NULL for module total, or 'RVO', 'Amsterdam', etc.
  sub_source_field VARCHAR,          -- 'Bron', 'Gemeente', 'Provincie'
  year INT NOT NULL,
  total BIGINT NOT NULL,             -- Normalized EUR amount
  row_count INT,                     -- Number of underlying records
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_module_totals_module ON module_totals(module);
CREATE INDEX idx_module_totals_year ON module_totals(year);
```

### Data Sync

During monthly data update:
1. Truncate `module_totals`
2. Aggregate from source tables
3. Insert module-level totals
4. Insert sub-source totals (Publiek, Provincie, Gemeente)

### Example Aggregation Query

```sql
-- Module totals
INSERT INTO module_totals (module, sub_source, year, total, row_count)
SELECT
  'instrumenten',
  NULL,
  Begrotingsjaar,
  SUM(Bedrag_normalized),
  COUNT(*)
FROM instrumenten
GROUP BY Begrotingsjaar;

-- Publiek sub-source totals
INSERT INTO module_totals (module, sub_source, sub_source_field, year, total, row_count)
SELECT
  'publiek',
  Source,
  'Bron',
  Jaar,
  SUM(Bedrag),
  COUNT(*)
FROM publiek
GROUP BY Source, Jaar;

-- Similar for Provincie, Gemeente...
```

---

## Sorting

Default sort: By total descending (largest modules first)

User can sort by:
- Any year column (asc/desc)
- Totaal column (asc/desc)
- Module name (alphabetical)

Sub-sources always sorted by total descending within their module.

---

## Totals Row

Footer row shows grand totals across ALL modules:
- Sum per year column
- Grand total (all modules, all years)

---

## Responsive Behavior

### Desktop
- Full table with all year columns visible

### Tablet/Mobile
- Horizontal scroll for year columns
- Module column fixed/sticky
- Expand/collapse still works

---

## Navigation Placement

Add "Overzicht" to main navigation:

```
┌─────────────────────────────────────────────────────────────────┐
│ Logo    Overzicht | Integraal | Modules ▼ | Support | Account  │
└─────────────────────────────────────────────────────────────────┘
```

Position: First item after logo (entry point to platform).

---

## Performance

- Pre-computed totals = fast page load
- No on-the-fly aggregation needed
- Single query to `module_totals` table
- Sub-source expansion: filtered query on same table

Expected load time: <200ms

---

## Related Documents

- [ADR-014: Single-View Architecture](../08-decisions/ADR-014-single-view-architecture.md)
- [Cross-Module Requirements](./cross-module-requirements.md)
