# Data Update Runbook

**Purpose:** Step-by-step guide for updating data in Rijksuitgaven.nl
**Last Updated:** 2026-01-26
**Frequency:** Monthly (government data updates)

---

## Quick Reference

| Step | Action | Time |
|------|--------|------|
| 1 | Export new data from source | ~10 min |
| 2 | Transform CSV files | ~5 min |
| 3 | Import to Supabase | ~10-30 min |
| 4 | Refresh materialized views | ~2 min |
| 5 | Re-sync Typesense | ~5 min |
| 6 | Verify | ~5 min |

**Total time:** ~30-60 minutes depending on data volume

---

## Prerequisites

- Access to Supabase dashboard (SQL Editor)
- Access to data sources (varies per module)
- Terminal with psql and Python installed
- Environment variables set (see `docs/LOCAL-SETUP.md`)

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
/usr/local/opt/libpq/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:${SUPABASE_DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" \
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

## Step 4: Refresh Materialized Views ⚠️ REQUIRED

**This step is MANDATORY after any data change.**

**Recommended: Run via psql (no timeout issues):**

```bash
/usr/local/opt/libpq/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" -f scripts/sql/refresh-all-views.sql
```

**Alternative: Supabase SQL Editor (run each separately to avoid timeout):**

```sql
REFRESH MATERIALIZED VIEW instrumenten_aggregated;
REFRESH MATERIALIZED VIEW apparaat_aggregated;
REFRESH MATERIALIZED VIEW inkoop_aggregated;
REFRESH MATERIALIZED VIEW provincie_aggregated;
REFRESH MATERIALIZED VIEW gemeente_aggregated;
REFRESH MATERIALIZED VIEW publiek_aggregated;
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

### Verify Refresh

```sql
-- Check aggregated view row counts
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

## Step 5: Re-sync Typesense ⚠️ REQUIRED

**This step is MANDATORY to update search results.**

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven

# Set environment variable (replace password if needed)
export SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Full re-sync (recreates collections)
python3 scripts/typesense/sync_to_typesense.py --recreate
```

**Expected output:** ~451,445 recipients + module collections indexed.

### Verify Typesense Sync

```bash
# Check collection counts
curl -s "https://typesense-production-35ae.up.railway.app/collections" \
  -H "X-TYPESENSE-API-KEY: 0vh4mxafjeuvd676gw92kpjflg6fuv57" | jq '.[] | {name, num_documents}'
```

---

## Step 6: Verify Everything Works

### 6.1 Test API Endpoints

```bash
# Test instrumenten
curl -s "https://rijksuitgaven-api-production-3448.up.railway.app/api/v1/modules/instrumenten?limit=5" | jq '.meta.total'

# Test search
curl -s "https://rijksuitgaven-api-production-3448.up.railway.app/api/v1/modules/instrumenten?q=prorail&limit=5" | jq '.meta.total'
```

### 6.2 Test Search in UI

1. Go to https://beta.rijksuitgaven.nl
2. Search for a known recipient
3. Verify results appear

### 6.3 Update data_freshness Table (Optional)

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

### Materialized View Refresh Takes Too Long

Large tables may take 30-60 seconds per view. This is normal.

### Typesense Sync Fails

1. Check Typesense is running: `curl https://typesense-production-35ae.up.railway.app/health`
2. Check API key is correct
3. Check Supabase connection string

### API Returns Old Data

Make sure you completed:
1. ✅ Step 4: Refresh materialized views
2. ✅ Step 5: Re-sync Typesense

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

### Post-Import (REQUIRED)
- [ ] Refresh materialized views
- [ ] Re-sync Typesense
- [ ] Test API endpoints
- [ ] Test search in UI

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
| `scripts/typesense/README.md` | Typesense sync documentation |
| `scripts/data/DATA-MIGRATION-README.md` | Initial migration process |
| `docs/LOCAL-SETUP.md` | Local development setup |

---

## Version History

| Date | Changes |
|------|---------|
| 2026-01-26 | Initial version |
