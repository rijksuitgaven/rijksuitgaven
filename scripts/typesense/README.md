# Typesense Sync Scripts

## When to Sync (Manual Process)

Run the sync script **after these events**:

| Event | Action |
|-------|--------|
| Bulk data import (new year's data) | Full sync: `--recreate` |
| New module added | Full sync: `--recreate` |
| Data corrections in Supabase | Sync affected collection |
| Schema changes | Full sync: `--recreate` |

**No sync needed for:** User actions, exports, read-only operations.

---

## How to Sync

### 1. Set environment variables

```bash
export TYPESENSE_HOST="typesense-production-35ae.up.railway.app"
export TYPESENSE_API_KEY="<admin-api-key-from-railway>"
export SUPABASE_DB_URL="<database-url-from-railway>"
```

### 2. Run sync (includes mandatory audit)

```bash
cd scripts/typesense
python3 sync_to_typesense.py --recreate
```

### 3. Verify audit passes

```
✅ AUDIT PASSED: All collections verified
Sync complete! ✅
```

**If audit fails:** Re-run with `--recreate`. Do NOT use data until audit passes.

---

## Commands Reference

```bash
# Full sync all collections (recommended)
python3 sync_to_typesense.py --recreate

# Sync single collection
python3 sync_to_typesense.py --collection instrumenten --recreate

# Audit only (recommended for verification)
python3 sync_to_typesense.py --audit-only

# Test search performance only
python3 sync_to_typesense.py --test-only
```

**Audit-only mode:** Verifies document counts match between database and Typesense without modifying data. Use this to check sync status before/after manual changes.

**Available collections:** `recipients`, `instrumenten`, `inkoop`, `publiek`, `gemeente`, `provincie`, `apparaat`

---

## Expected Document Counts

| Collection | Documents | Source | Enriched Fields |
|------------|-----------|--------|----------------|
| recipients | 463,731 | universal_search | y2016-y2024, years_with_data, record_count |
| instrumenten | ~675K | instrumenten | - |
| inkoop | ~636K | inkoop | - |
| publiek | ~115K | publiek | - |
| gemeente | ~126K | gemeente | - |
| provincie | ~67K | provincie | - |
| apparaat | ~10K | apparaat (grouped) | - |

Last verified: 2026-02-09

**Enriched Fields Explanation:**
- **y2016-y2024**: Yearly amounts for each recipient (integer fields)
- **years_with_data**: Array of years with non-zero amounts
- **record_count**: Total number of payment rows across all modules

---

## Prerequisites

```bash
pip3 install typesense psycopg2-binary
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Forbidden" API key error | Use admin API key from Railway Typesense service |
| Audit fails with count mismatch | Re-run with `--recreate` |
| "command not found: python" | Use `python3` |
| "could not translate host name" | Use pooler URL, not direct Supabase URL |

---

## Files

| File | Purpose |
|------|---------|
| `collections.json` | Typesense collection schemas |
| `sync_to_typesense.py` | Sync script with mandatory audit |
| `README.md` | This documentation |
