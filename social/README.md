# Social Content — Rijksuitgaven.nl

**Strategy:** `docs/plans/2026-03-02-social-content-strategy.md`
**Platforms:** X, Bluesky, LinkedIn (via Buffer)
**Cadence:** 3 posts/day
**Target:** 810 posts (9 months)

## Architecture: Zero-Error Pipeline

Every number in every post traces back to the database through a verified chain:

```
Database → extract_facts.py → facts/*.csv → posts/*.csv
                                    ↑
                              verify.py (re-checks any time)
```

### Folder Structure

```
social/
├── facts/                    # Machine-extracted, DB-verified facts
│   ├── instrumenten_top.csv
│   ├── instrumenten_yoy_increases.csv
│   ├── instrumenten_yoy_decreases.csv
│   ├── gemeente_top.csv
│   ├── gemeente_totals.csv
│   ├── gemeente_dominant.csv
│   ├── provincie_top.csv
│   ├── provincie_totals.csv
│   ├── inkoop_top.csv
│   ├── inkoop_high_staffel.csv
│   ├── inkoop_categories.csv
│   ├── publiek_top.csv
│   ├── publiek_per_source.csv
│   ├── apparaat_top.csv
│   ├── apparaat_ministry.csv
│   ├── apparaat_kostensoort_ministry.csv
│   ├── universal_top.csv
│   └── universal_multi_source.csv
├── queries/
│   └── fact-queries.sql      # The exact SQL that produced the facts
├── posts/
│   └── batch-*.csv           # Final posts for Buffer import
├── registry.csv              # Dedup index: fact_id + format → one post
├── extract_facts.py          # Runs queries, writes facts CSVs
├── verify.py                 # Re-verifies facts against live DB
├── _archive/                 # Old hand-typed approach (reference only)
└── README.md
```

## Scripts

### Extract facts from database
```bash
python3 social/extract_facts.py
```
Connects to Supabase (reads DATABASE_URL from backend/.env), runs 18 queries, writes facts CSVs with verified_at timestamps.

### Verify facts
```bash
python3 social/verify.py                          # All facts
python3 social/verify.py --module instrumenten    # One module
python3 social/verify.py --fact INSTR-TOP-001     # One fact
```
Re-runs queries against live DB and compares to stored CSV values. Reports PASS/CHANGED/MISSING.

## Facts CSV Schema

Every fact has:

| Column | Description |
|--------|-------------|
| `fact_id` | Unique ID (e.g., INSTR-TOP-001) |
| `module` | Source module |
| `entity` | The subject of the fact |
| `metric` | What's being measured |
| `value` | The verified number |
| `query_ref` | Which SQL query produced this |
| `verified_at` | UTC timestamp of extraction |

Plus module-specific columns (year breakdowns, ratios, etc.)

## Posts CSV Schema

| Column | Description |
|--------|-------------|
| `text` | Full post text including hashtags (≤280 chars) |
| `format` | scale_shock / comparison / concentration / category_reveal / curiosity |
| `module` | Source module |
| `fact_ids` | Semicolon-separated fact IDs this post is based on |
| `staffel` | yes/no — whether amounts use bracket language |
| `chars` | Character count |

## Dedup Rules

1. **One post per fact_id+format combination** — same fact can appear in different formats
2. **Registry tracks fact_ids, not free-text names** — no string collision possible
3. **Same entity, different facts = allowed** — e.g., SVB total and SVB YoY change are different facts
4. **Temporal spacing** — posts about the same entity should be at least 50 posts apart in sequence

## Data Accuracy Rules

- **Exact modules** (instrumenten, apparaat, gemeente, provincie): Full amounts, thousands separator with dots
- **Staffel modules** (inkoop, publiek): Bracket boundaries ONLY. "Contracten boven €50 miljoen" — never midpoints
- **All aggregated views store absolute euros** — no manual multiplication needed
- **instrumenten/apparaat source tables**: ×1000, but views already apply this

## Buffer Import

Buffer accepts CSV with a `text` column. All other columns are for internal tracking.
