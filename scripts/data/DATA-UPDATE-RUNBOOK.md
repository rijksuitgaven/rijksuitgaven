# Data Update Runbook

**Purpose:** Step-by-step guide for updating data in Rijksuitgaven.nl
**Last Updated:** 2026-02-18
**Frequency:** Monthly (government data updates)

---

## Quick Reference

| Step | Action | Time |
|------|--------|------|
| 1 | Export new data from source | ~10 min |
| 2 | Transform CSV files | ~5 min |
| 3 | Import to Supabase | ~10-30 min |
| 4 | Update data_availability table | ~5 min |
| 5 | Refresh materialized views | ~2 min |
| 6 | Re-sync Typesense | ~5 min |
| 7 | Restart backend (clear cache) | ~2 min |
| 8 | Verify | ~5 min |

**Total time:** ~30-60 minutes depending on data volume

---

## Post-Import Commands (Copy-Paste Ready)

After importing new data (Steps 1-3), run these commands from terminal:

### Option A: With psql installed

```bash
# Step 5: Refresh all materialized views
/usr/local/Cellar/libpq/18.1/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:$SUPABASE_DB_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" -f scripts/sql/refresh-all-views.sql
```

### Option B: Without psql (Python fallback)

```bash
python3 -c "
import psycopg2
import os
conn = psycopg2.connect(f\"postgresql://postgres.kmdelrgtgglcrupprkqf:{os.environ['SUPABASE_DB_PASSWORD']}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres\")
conn.autocommit = True
cur = conn.cursor()
cur.execute('SET statement_timeout = 300000')
views = [
    'instrumenten_aggregated', 'apparaat_aggregated', 'inkoop_aggregated',
    'provincie_aggregated', 'gemeente_aggregated', 'publiek_aggregated',
]
for v in views:
    print(f'Refreshing {v}...')
    cur.execute(f'REFRESH MATERIALIZED VIEW {v}')
    print(f'  Done.')
print('Refreshing universal_search (CONCURRENTLY)...')
cur.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search')
print('  Done.')
cur.close()
conn.close()
print('All views refreshed.')
"
```

### Step 6: Re-sync Typesense

**Setup:** Export both environment variables before running:
```bash
export SUPABASE_DB_PASSWORD="<from-password-manager>"
export TYPESENSE_API_KEY="<admin-key-from-railway-dashboard>"
```

Then sync:
```bash
# Re-sync Typesense (includes mandatory audit)
SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:$SUPABASE_DB_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" \
TYPESENSE_API_KEY="$TYPESENSE_API_KEY" \
python3 scripts/typesense/sync_to_typesense.py --recreate
# Must see: ✅ AUDIT PASSED
```

**Typesense API keys:**
- **Admin key** (write access, for sync): Get from Railway dashboard → Typesense service → Variables

**To sync only one collection** (faster, when only one module changed):
```bash
python3 scripts/typesense/sync_to_typesense.py --collection gemeente --recreate
```

**Expected results:**
- Views: Row counts printed for verification
- Typesense: `✅ AUDIT PASSED` with matching document counts

---

## Prerequisites

- Access to Supabase dashboard (SQL Editor)
- Access to data sources (varies per module)
- Terminal with Python 3 + psycopg2 installed
- Typesense admin API key (from Railway dashboard)

---

## Step 1: Export New Data from Source

### Data Sources Per Module

| Module | Source | Format | Update Frequency |
|--------|--------|--------|------------------|
| instrumenten | Rijksbegroting Open Data | CSV | Yearly |
| apparaat | Rijksbegroting Open Data | CSV | Yearly |
| inkoop | Inkoop data | CSV | Yearly |
| provincie | Provincial registers | CSV | Varies |
| gemeente | Municipal registers | CSV | Varies |
| publiek | RVO/COA/NWO/ZonMW | CSV | Varies |

### Export Instructions

[TODO: Add specific export instructions per source when needed]

---

## Step 2: Transform CSV Files

Use the transformation script to ensure correct format:

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven

# Transform CSV headers and handle NULL values
python3 scripts/data/transform-csv-headers.py input.csv output.csv
```

**The script handles:**
- Column header mapping
- NULL value conversion
- UTF-8 encoding
- Empty string → NULL conversion

---

## Step 3: Import to Supabase

### Option A: Small updates (< 10,000 rows)

Use Supabase Dashboard → Table Editor → Import CSV

### Option B: Large imports (> 10,000 rows)

Use psql command line:

```bash
# Set your password
export SUPABASE_DB_PASSWORD="your-password-here"

# Import CSV to specific table
/usr/local/Cellar/libpq/18.1/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:${SUPABASE_DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" \
  -c "\COPY tablename FROM 'path/to/file.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')"
```

**Replace:**
- `tablename` with: instrumenten, apparaat, inkoop, provincie, gemeente, or publiek
- `path/to/file.csv` with actual file path

### Verify Import

```sql
-- Check row counts after import
SELECT 'instrumenten' as table_name, COUNT(*) as rows FROM instrumenten
UNION ALL SELECT 'apparaat', COUNT(*) FROM apparaat
UNION ALL SELECT 'inkoop', COUNT(*) FROM inkoop
UNION ALL SELECT 'provincie', COUNT(*) FROM provincie
UNION ALL SELECT 'gemeente', COUNT(*) FROM gemeente
UNION ALL SELECT 'publiek', COUNT(*) FROM publiek
ORDER BY table_name;
```

---

## Step 4: Update data_availability Table ⚠️ REQUIRED

**This step is MANDATORY when:**
- A new year of data is added (update `year_to`)
- A new entity appears (add new row)
- A module gets new historical data (update `year_from`)

### What is data_availability?

This table tells the frontend which years have real data per module/entity. Without it, the UI cannot distinguish "no data" from "real zero". See `docs/plans/2026-02-06-data-availability-indicators-design.md` for full design.

### Granularity

| Module | Level | What to update |
|--------|-------|----------------|
| instrumenten | Module-level | Single row (entity_type=NULL) |
| inkoop | Module-level | Single row (entity_type=NULL) |
| apparaat | Module-level | Single row (entity_type=NULL) |
| gemeente | Per gemeente | One row per gemeente |
| provincie | Per provincie | One row per provincie |
| publiek | Per source | One row per source (RVO, COA, NWO, ZonMW) |

### Option A: Supabase Studio (Recommended)

1. Go to Supabase Dashboard → Table Editor → `data_availability`
2. Find the relevant row(s)
3. Edit `year_to` (or `year_from`) inline
4. For new entities: click "Insert Row" and fill in module, entity_type, entity_name, year_from, year_to

### Option B: SQL (for bulk updates)

```sql
-- Example: New year 2025 data arrived for all module-level modules
UPDATE data_availability SET year_to = 2025, updated_at = NOW()
WHERE module IN ('instrumenten', 'inkoop', 'apparaat') AND entity_type IS NULL;

-- Example: New year 2025 data for all provincies
UPDATE data_availability SET year_to = 2025, updated_at = NOW()
WHERE module = 'provincie' AND entity_type = 'provincie';

-- Example: New gemeente "Eindhoven" added with data from 2018
INSERT INTO data_availability (module, entity_type, entity_name, year_from, year_to)
VALUES ('gemeente', 'gemeente', 'Eindhoven', 2018, 2025);

-- Example: COA now has data back to 2016
UPDATE data_availability SET year_from = 2016, updated_at = NOW()
WHERE module = 'publiek' AND entity_type = 'source' AND entity_name = 'COA';
```

### ⚠️ Per-Entity year_to Updates (Common Scenario)

**When loading new year data for entity-level modules (provincie, gemeente, publiek), you often load data for SOME entities but not all.** For example, Friesland 2024 data may arrive while other provinces already have 2024.

**CRITICAL:** Only update `year_to` for entities that actually received new data. Do NOT bulk-update all entities.

```sql
-- ✅ CORRECT: Update only the entity that received new data
UPDATE data_availability SET year_to = 2024, updated_at = NOW()
WHERE module = 'provincie' AND entity_name = 'Friesland';

-- ❌ WRONG: Bulk-updating all provincies when only Friesland got new data
UPDATE data_availability SET year_to = 2024, updated_at = NOW()
WHERE module = 'provincie' AND entity_type = 'provincie';
```

**Verification query — run BEFORE updating to confirm which entities actually have data for the new year:**

```sql
-- Check which provincies have data for a specific year
SELECT provincie, COUNT(*) AS rows, ROUND(SUM(bedrag)::numeric, 0) AS total
FROM provincie WHERE jaar = 2024
GROUP BY provincie ORDER BY provincie;

-- Check which gemeentes have data for a specific year
SELECT gemeente, COUNT(*) AS rows, ROUND(SUM(bedrag)::numeric, 0) AS total
FROM gemeente WHERE jaar = 2024
GROUP BY gemeente ORDER BY gemeente;

-- Check which publiek sources have data for a specific year
SELECT source, COUNT(*) AS rows, ROUND(SUM(bedrag)::numeric, 0) AS total
FROM publiek WHERE jaar = 2024
GROUP BY source ORDER BY source;
```

**Only update `year_to` for entities that appear in the query results with rows > 0 and total > 0.**

### Verify data_availability

```sql
SELECT module, entity_type, entity_name, year_from, year_to
FROM data_availability
ORDER BY module, entity_type, entity_name;
```

### Current Entities

**Gemeentes (12):** Almere, Amersfoort, Amsterdam, Arnhem, Barendrecht, Breda, De Ronde Venen, Den Haag, Groningen, Haarlem, Tilburg, Utrecht

**Provincies (10):** Drenthe, Friesland, Gelderland, Limburg, Noord-Brabant, Noord-Holland, Overijssel, Utrecht, Zeeland, Zuid-Holland

**Publiek sources (4):** COA, NWO, RVO, ZonMW

---

## Step 5: Refresh Materialized Views ⚠️ REQUIRED

**This step is MANDATORY after any source data change.**

### Option A: psql (if installed)

```bash
/usr/local/Cellar/libpq/18.1/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:$SUPABASE_DB_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" -f scripts/sql/refresh-all-views.sql
```

### Option B: Python (if psql not installed)

See "Post-Import Commands" section above for copy-paste Python script.

### Option C: Supabase SQL Editor (run each separately to avoid timeout)

```sql
REFRESH MATERIALIZED VIEW instrumenten_aggregated;
REFRESH MATERIALIZED VIEW apparaat_aggregated;
REFRESH MATERIALIZED VIEW inkoop_aggregated;
REFRESH MATERIALIZED VIEW provincie_aggregated;
REFRESH MATERIALIZED VIEW gemeente_aggregated;
REFRESH MATERIALIZED VIEW publiek_aggregated;
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

**Important:** `universal_search` can time out in the SQL Editor. If it does, use the Python approach with `SET statement_timeout = 300000` (5 minutes).

### Verify Refresh

```sql
SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated
UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY view_name;
```

---

## Step 6: Re-sync Typesense ⚠️ REQUIRED

**This step is MANDATORY to update search results and enriched fields (y2016-y2024, years_with_data, record_count).**

After refreshing materialized views (Step 5), re-sync Typesense to update:
- Search indexes with new data
- Enriched yearly amount fields (y2016-y2024) in recipients collection
- years_with_data arrays
- record_count values

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven

SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:$SUPABASE_DB_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" \
TYPESENSE_API_KEY="$TYPESENSE_API_KEY" \
python3 scripts/typesense/sync_to_typesense.py --recreate
```

**Typesense admin key:** Get from Railway dashboard → Typesense service → Variables. Do NOT use the search-only key from `.env` (it will fail with 401 Forbidden on write operations).

**To sync only affected collections** (faster):
```bash
# Only sync gemeente after gemeente data change
python3 scripts/typesense/sync_to_typesense.py --collection gemeente --recreate
```

**Expected output:**
```
✅ AUDIT PASSED: All collections verified
Sync complete! ✅
```

**If audit fails:** Do NOT proceed. Re-run with `--recreate` or investigate the mismatch.

### Expected Document Counts

| Collection | Documents | Enriched Fields |
|------------|-----------|----------------|
| recipients | 463,731 | y2016-y2024, years_with_data, record_count |
| instrumenten | ~675K | - |
| inkoop | ~636K | - |
| publiek | ~115K | - |
| gemeente | ~126K | - |
| provincie | ~67K | - |
| apparaat | ~10K | - |

**Note:** Recipients collection is enriched with yearly amounts (y2016-y2024), years_with_data array, and record_count. These fields are computed during sync and must be re-synced after data updates.

### Audit Only (Optional)

To verify without syncing:
```bash
python3 scripts/typesense/sync_to_typesense.py --audit-only
```

---

## Step 7: Restart Backend (Clear Cache) ⚠️ IF data_availability CHANGED

**Only needed if you changed the `data_availability` table in Step 4.**

The backend caches module-level availability in memory (`_availability_cache`). This cache has no expiry and only clears on server restart.

### Railway (Production)

Go to Railway dashboard → Backend service → click "Restart"

### Local Development

Stop and restart the backend server.

**Note:** If you only changed source data (Steps 1-3) but not `data_availability`, you can skip this step.

---

## Step 8: Update Module Hub Entity Lists (IF new entity added)

If you added a **new gemeente, province, or publiek entity** (not just new year data for existing entities):

1. Update `app/src/app/page.tsx` — the `ontvangers` array has hardcoded entity name lists in `description` fields
2. The `/dataoverzicht` page is dynamic (auto-reflects new entities)
3. The `/support` page uses counts + links to dataoverzicht (auto-correct)

```typescript
// Example: adding Rotterdam to gemeente
// In app/src/app/page.tsx, find the gemeente entry and add to the description:
description: 'Subsidieregisters van Almere, Amersfoort, Amsterdam, Arnhem, Barendrecht, Breda, De Ronde Venen, Den Haag, Groningen, Haarlem, Rotterdam, Tilburg en Utrecht.',
```

---

## Step 9: Verify Everything Works

### 8.1 Test API Endpoints

```bash
# Test instrumenten
curl -s "https://rijksuitgaven-api-production-3448.up.railway.app/api/v1/modules/instrumenten?limit=5" | python3 -m json.tool | grep total

# Test search
curl -s "https://rijksuitgaven-api-production-3448.up.railway.app/api/v1/modules/instrumenten?q=prorail&limit=5" | python3 -m json.tool | grep total

# Test data_availability fields are present
curl -s "https://rijksuitgaven-api-production-3448.up.railway.app/api/v1/modules/gemeente?limit=1" | python3 -m json.tool | grep data_available
```

### 8.2 Test Search in UI

1. Go to https://beta.rijksuitgaven.nl
2. Search for a known recipient
3. Verify results appear
4. Check gemeente module: verify em-dash (—) appears for entities with limited year ranges

### 8.3 Update data_freshness Table (Optional)

```sql
-- Record when data was updated
INSERT INTO data_freshness (source, sub_source, year, last_updated, is_complete, record_count)
VALUES ('Financiële instrumenten', NULL, 2024, CURRENT_DATE, true,
  (SELECT COUNT(*) FROM instrumenten WHERE begrotingsjaar = 2024));
```

---

## Troubleshooting

### Import Fails with Encoding Error

```bash
# Convert file to UTF-8 first
iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv
```

### Materialized View Refresh Takes Too Long / Times Out

Supabase SQL Editor has a default statement timeout. Use the Python approach:

```bash
python3 -c "
import psycopg2
import os
conn = psycopg2.connect(f\"postgresql://postgres.kmdelrgtgglcrupprkqf:{os.environ['SUPABASE_DB_PASSWORD']}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres\")
conn.autocommit = True
cur = conn.cursor()
cur.execute('SET statement_timeout = 300000')  # 5 minutes
cur.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search')
print('Done.')
cur.close()
conn.close()
"
```

### refresh_all_views() Function Not Found

This function does not exist on Supabase. Use the individual REFRESH commands or the Python script instead.

### Typesense Sync Fails with 401 Forbidden

You're using the search-only API key. Use the admin key from Railway dashboard → Typesense service → Variables.

### Typesense Sync Fails with Connection Error

1. Check Typesense is running: `curl https://typesense-production-35ae.up.railway.app/health`
2. Check API key is correct (admin key, not search key)
3. Check Supabase connection string

### API Returns Old Data

Make sure you completed ALL steps:
1. ✅ Step 4: Updated data_availability (if applicable)
2. ✅ Step 5: Refreshed materialized views
3. ✅ Step 6: Re-synced Typesense
4. ✅ Step 7: Restarted backend (if data_availability changed)

### Em-dash (—) Not Showing for New Entities

1. Check `data_availability` table has a row for the new entity
2. Check backend was restarted (Step 7) to clear the cache
3. Check the `entity_name` matches exactly (case-sensitive)

---

## Checklist Template

Use this checklist for each data update:

```
## Data Update - [DATE]

### Pre-Update
- [ ] Backup current data (if needed)
- [ ] Download new data from source

### Import
- [ ] Transform CSV files
- [ ] Import to Supabase
- [ ] Verify row counts

### Post-Import (ALL REQUIRED)
- [ ] Update data_availability table (year_to, new entities)
- [ ] Refresh materialized views
- [ ] Re-sync Typesense (with admin key)
- [ ] Restart backend if data_availability changed
- [ ] Test API endpoints
- [ ] Test search in UI
- [ ] Verify em-dash display for limited-range entities

### Documentation
- [ ] Update data_freshness table
- [ ] Note any issues encountered
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `scripts/sql/DATABASE-DOCUMENTATION.md` | Database schema reference |
| `scripts/sql/refresh-all-views.sql` | View refresh script |
| `scripts/sql/022-data-availability.sql` | Data availability table + initial data |
| `scripts/typesense/README.md` | Typesense sync documentation |
| `scripts/data/DATA-MIGRATION-README.md` | Initial migration process |
| `docs/plans/2026-02-06-data-availability-indicators-design.md` | Data availability design |

---

## Version History

| Date | Changes |
|------|---------|
| 2026-02-18 | Added per-entity year_to guidance: verify before bulk-updating, only update entities with actual data, verification queries |
| 2026-02-07 | Added Step 4 (data_availability), Step 7 (cache clear), Python fallback for views, Typesense key guidance, troubleshooting for common issues |
| 2026-02-01 | Updated Typesense sync with mandatory audit, correct document counts |
| 2026-01-26 | Initial version |
