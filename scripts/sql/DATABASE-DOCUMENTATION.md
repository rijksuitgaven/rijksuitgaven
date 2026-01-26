# Database Documentation

**Database:** Supabase (PostgreSQL)
**Project:** kmdelrgtgglcrupprkqf
**Region:** eu-west-1
**Created:** 2026-01-21
**Data Migrated:** 2026-01-23
**Last Updated:** 2026-01-26

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  instrumenten   │  │    apparaat     │  │     inkoop      │ │
│  │   674,826 rows  │  │   21,315 rows   │  │   635,866 rows  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    provincie    │  │    gemeente     │  │     publiek     │ │
│  │   67,456 rows   │  │  126,377 rows   │  │  115,020 rows   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ universal_search│  │  user_profiles  │                      │
│  │ 1,456,095 rows  │  │    (auth)       │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  Total: 3,096,955 data rows + user profiles                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extensions Enabled

| Extension | Purpose |
|-----------|---------|
| `postgis` | Geographic/geometry data (publiek.locatie) |
| `vector` | Future: AI embeddings for semantic search |

---

## Amount Units (IMPORTANT)

⚠️ **Different tables store amounts in different units:**

| Table | Column | Unit | Example |
|-------|--------|------|---------|
| **instrumenten** | bedrag | ×1000 (thousands) | 345 = €345.000 |
| **apparaat** | bedrag | ×1000 (thousands) | 100 = €100.000 |
| inkoop | totaal_avg | Absolute euros | 345000 = €345.000 |
| provincie | bedrag | Absolute euros | 345000 = €345.000 |
| gemeente | bedrag | Absolute euros | 345000 = €345.000 |
| publiek | bedrag | Absolute euros | 345000 = €345.000 |
| **universal_search** | all year columns | Absolute euros | 345000 = €345.000 |

**Note:** The `universal_search` materialized view converts instrumenten amounts by multiplying ×1000 to get absolute euros. All other tables are already in absolute euros.

**When querying instrumenten directly:** Remember to multiply bedrag by 1000 for absolute euros.

---

## Tables

### 1. instrumenten (Financiële Instrumenten)

**Description:** Rijksbegroting financial instruments - subsidies, grants, and financial transfers from the national government.

**Rows:** 674,826

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| begrotingsjaar | INTEGER | Budget year (e.g., 2023) |
| begrotingshoofdstuk | VARCHAR(255) | Budget chapter code (e.g., "V", "VII") |
| begrotingsnaam | VARCHAR(255) | Budget chapter name (e.g., "Buitenlandse Zaken") |
| ris_ibos_nummer | VARCHAR(255) | RIS/IBOS reference number |
| artikel | VARCHAR(255) | Budget article |
| artikelonderdeel | VARCHAR(255) | Budget article subsection |
| instrument | VARCHAR(255) | Financial instrument type |
| detail | VARCHAR(255) | Additional detail |
| regeling | VARCHAR(255) | Regulation/scheme name |
| ontvanger | VARCHAR(255) | Recipient name |
| bedrag | INTEGER | Amount in **thousands of euros (×1000)** |
| kvk_nummer | INTEGER | Chamber of Commerce number |
| rechtsvorm | VARCHAR(255) | Legal entity type |
| id_nummer | INTEGER | ID number |
| register_id_nummer | VARCHAR(255) | Register ID number |
| plaats | VARCHAR(255) | Location/city |
| bedrag_normalized | BIGINT | Normalized amount (euros × 1000) |
| source | VARCHAR(50) | Data source identifier |

**Indexes:**
- `idx_instrumenten_ontvanger` - Fast recipient lookup
- `idx_instrumenten_jaar` - Fast year filtering
- `idx_instrumenten_regeling` - Fast regulation search

---

### 2. apparaat (Apparaatsuitgaven)

**Description:** Government operational expenditures - personnel costs, equipment, facilities.

**Rows:** 21,315

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| begrotingsjaar | INTEGER | Budget year |
| begrotingshoofdstuk | VARCHAR(255) | Budget chapter code |
| begrotingsnaam | VARCHAR(255) | Budget chapter name |
| ris_ibos_nummer | VARCHAR(255) | RIS/IBOS reference |
| artikel | VARCHAR(255) | Budget article |
| artikelonderdeel | VARCHAR(255) | Article subsection |
| instrument | VARCHAR(255) | Instrument type |
| detail | VARCHAR(255) | Additional detail |
| kostensoort | VARCHAR(255) | Cost type/category |
| bedrag | INTEGER | Amount in **thousands of euros (×1000)** |
| bedrag_normalized | BIGINT | Normalized amount (×1000) |
| source | VARCHAR(50) | Data source |

**Indexes:**
- `idx_apparaat_kostensoort` - Fast cost type filtering
- `idx_apparaat_jaar` - Fast year filtering

---

### 3. inkoop (Inkoopuitgaven)

**Description:** Government procurement/purchasing data.

**Rows:** 635,866

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| jaar | INTEGER | Year |
| ministerie | VARCHAR(255) | Ministry (e.g., "BZK", "VWS") |
| leverancier | VARCHAR(255) | Supplier/vendor name |
| categorie | TEXT | Procurement category |
| staffel | INTEGER | Amount bracket/tier |
| totaal_avg | DOUBLE PRECISION | Total/average amount |
| source | VARCHAR(50) | Data source |

**Indexes:**
- `idx_inkoop_leverancier` - Fast supplier lookup
- `idx_inkoop_jaar` - Fast year filtering
- `idx_inkoop_ministerie` - Fast ministry filtering

---

### 4. provincie (Provinciale subsidies)

**Description:** Provincial government subsidies and grants.

**Rows:** 67,456

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| provincie | VARCHAR(255) | Province name (e.g., "Noord-Holland") |
| nummer | VARCHAR(255) | Reference number |
| jaar | INTEGER | Year |
| ontvanger | VARCHAR(255) | Recipient name |
| omschrijving | TEXT | Description |
| bedrag | INTEGER | Amount in euros |
| source | VARCHAR(50) | Data source |

**Indexes:**
- `idx_provincie_ontvanger` - Fast recipient lookup
- `idx_provincie_jaar` - Fast year filtering
- `idx_provincie_provincie` - Fast province filtering

---

### 5. gemeente (Gemeentelijke subsidies)

**Description:** Municipal government subsidies and grants.

**Rows:** 126,377

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| gemeente | VARCHAR(255) | Municipality name (was: "stad") |
| nummer | VARCHAR(255) | Reference number |
| jaar | INTEGER | Year |
| ontvanger | VARCHAR(255) | Recipient name |
| omschrijving | TEXT | Description |
| bedrag | INTEGER | Amount in euros |
| beleidsterrein | VARCHAR(255) | Policy area |
| beleidsnota | TEXT | Policy document reference |
| regeling | VARCHAR(255) | Regulation/scheme |
| source | VARCHAR(50) | Data source |

**Indexes:**
- `idx_gemeente_ontvanger` - Fast recipient lookup
- `idx_gemeente_jaar` - Fast year filtering
- `idx_gemeente_gemeente` - Fast municipality filtering

**Note:** Column was renamed from `stad` to `gemeente` during migration.

---

### 6. publiek (Publiek gefinancierd)

**Description:** Public funding data from RVO, COA, NWO and other public organizations.

**Rows:** 115,020

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| projectnummer | VARCHAR(255) | Project reference number |
| jaar | INTEGER | Year |
| omschrijving | TEXT | Description |
| ontvanger | VARCHAR(255) | Recipient name |
| kvk_nummer | VARCHAR(50) | Chamber of Commerce number |
| regeling | VARCHAR(255) | Regulation/scheme |
| bedrag | INTEGER | Amount in euros |
| locatie | GEOMETRY(Point, 4326) | Geographic location (PostGIS) |
| trefwoorden | TEXT | Keywords |
| sectoren | VARCHAR(255) | Sectors |
| eu_besluit | VARCHAR(100) | EU decision reference |
| source | VARCHAR(30) | Data source (NOT NULL) |
| provincie | VARCHAR(100) | Province |
| staffel | VARCHAR(7) | Amount bracket |
| onderdeel | VARCHAR(10) | Subsection |

**Indexes:**
- `idx_publiek_ontvanger` - Fast recipient lookup
- `idx_publiek_jaar` - Fast year filtering
- `idx_publiek_source` - Fast source filtering

**Note:** Uses PostGIS geometry for location data.

---

### 7. universal_search (Cross-module search - MATERIALIZED VIEW)

**Description:** Aggregated cross-module search for "Integraal zoeken". One row per unique recipient with yearly totals across all recipient-based modules.

**Type:** MATERIALIZED VIEW (not a table)

**Unique Recipients:** ~466,827

**Modules Included:**
- Financiële instrumenten (ontvanger)
- Inkoopuitgaven (leverancier)
- Publiek (ontvanger) - RVO, COA, NWO, ZonMW
- Gemeentelijke subsidieregisters (ontvanger)
- Provinciale subsidieregisters (ontvanger)

**Excluded:** Apparaatsuitgaven (operational costs, no external recipients)

| Column | Type | Description |
|--------|------|-------------|
| ontvanger_key | TEXT | Normalized recipient (UPPER) for grouping |
| ontvanger | TEXT | Display name (original case) |
| sources | TEXT | Comma-separated list of modules |
| source_count | INTEGER | Number of modules recipient appears in |
| "2016" - "2025" | BIGINT | Yearly totals in absolute euros |
| totaal | BIGINT | Grand total across all years |

**All amounts in ABSOLUTE EUROS** (€1 = 1)

**Indexes:**
- `idx_universal_search_key` - Unique on ontvanger_key
- `idx_universal_search_ontvanger` - Fast recipient search
- `idx_universal_search_sources` - Fast source filtering
- `idx_universal_search_totaal` - Fast sorting by amount

**Refresh Command:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

**Script:** `scripts/sql/004-universal-search-materialized-view.sql`

---

### 7b. Aggregated Materialized Views (API Performance) ⭐ NEW 2026-01-26

**Description:** Pre-computed aggregations per module for fast API queries. Each view contains one row per primary entity (ontvanger/kostensoort/leverancier) with year columns.

**Purpose:** Reduces API response time from 9-19 seconds to <500ms by avoiding GROUP BY on large tables.

**Script:** `scripts/sql/006-aggregated-materialized-views.sql`

| View | Source Table | Primary Field | Unique Rows |
|------|--------------|---------------|-------------|
| `instrumenten_aggregated` | instrumenten | ontvanger | 221,362 |
| `apparaat_aggregated` | apparaat | kostensoort | 759 |
| `inkoop_aggregated` | inkoop | leverancier | 208,737 |
| `provincie_aggregated` | provincie | ontvanger | 25,960 |
| `gemeente_aggregated` | gemeente | ontvanger | 21,989 |
| `publiek_aggregated` | publiek | ontvanger | 63,194 |

**Column Structure (all views):**

| Column | Type | Description |
|--------|------|-------------|
| [primary_field] | TEXT | ontvanger, kostensoort, or leverancier |
| "2016" - "2024" | BIGINT | Yearly totals in absolute euros |
| totaal | BIGINT | Grand total across all years |
| row_count | BIGINT | Number of source rows aggregated |

**Amount Normalization:**
- `instrumenten_aggregated` and `apparaat_aggregated`: Amounts multiplied by 1000 (source data in ×1000)
- All other views: Amounts as-is (already in absolute euros)

**Indexes per view:**
- `idx_[view]_[primary]` - Fast lookup by primary field
- `idx_[view]_totaal` - Fast sorting by total amount

**Refresh Commands (run after data updates):**
```sql
REFRESH MATERIALIZED VIEW instrumenten_aggregated;
REFRESH MATERIALIZED VIEW apparaat_aggregated;
REFRESH MATERIALIZED VIEW inkoop_aggregated;
REFRESH MATERIALIZED VIEW provincie_aggregated;
REFRESH MATERIALIZED VIEW gemeente_aggregated;
REFRESH MATERIALIZED VIEW publiek_aggregated;
```

**Performance Results:**

| View | Query Time | Improvement |
|------|------------|-------------|
| instrumenten_aggregated | 114ms | 100x faster |
| apparaat_aggregated | 172ms | - |
| inkoop_aggregated | 567ms | - |
| provincie_aggregated | 196ms | - |
| gemeente_aggregated | 191ms | - |
| publiek_aggregated | 222ms | - |

---

### 8. data_freshness (Data completeness tracking)

**Description:** Tracks when each data source was last updated, for UI indicators showing partial/incomplete data.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| source | VARCHAR(100) | Module name (e.g., 'Gemeentelijke subsidieregisters') |
| sub_source | VARCHAR(100) | Sub-source (e.g., 'Amsterdam', 'Noord-Holland') |
| year | INTEGER | Data year |
| last_updated | DATE | When data was last imported |
| is_complete | BOOLEAN | Whether all expected data is present |
| record_count | INTEGER | Number of records for this source/year |
| notes | TEXT | Optional notes |

**Purpose:** UI shows indicators (e.g., "2025*") when year data is incomplete.

---

### 9. user_profiles (Authentication)

**Description:** User profile data linked to Supabase Auth.

**Rows:** TBD (users to be migrated)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| email | TEXT | User email (NOT NULL) |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| organisation | TEXT | Organization name |
| role | TEXT | User role |
| phone | TEXT | Phone number |
| subscription_type | TEXT | 'yearly' or 'monthly' |
| subscription_start | DATE | Subscription start date |
| subscription_end | DATE | Subscription end date |
| user_list | TEXT | Legacy list category |
| created_at | TIMESTAMP | Account creation time |
| preferences | JSONB | User preferences (JSON) |

**Note:** Linked to Supabase Auth via foreign key to `auth.users`.

---

## Triggers

### Source Column Auto-Population

Triggers automatically set the `source` column on INSERT for tables with constant source values.

| Table | Trigger | Function | Source Value |
|-------|---------|----------|--------------|
| apparaat | `set_apparaat_source` | `set_source_apparaat()` | Apparaatsuitgaven |
| gemeente | `set_gemeente_source` | `set_source_gemeente()` | Gemeentelijke subsidieregisters |
| inkoop | `set_inkoop_source` | `set_source_inkoop()` | Inkoopuitgaven |
| instrumenten | `set_instrumenten_source` | `set_source_instrumenten()` | Financiële instrumenten |
| provincie | `set_provincie_source` | `set_source_provincie()` | Provinciale subsidieregisters |
| publiek | _(none)_ | - | Varies (COA, NWO, RVO, ZonMW) |

**Script:** `scripts/sql/003-source-column-triggers.sql`

**Future Note:** The `source` column may become redundant since each table inherently represents a single source. If removed, drop triggers using the removal script in the SQL file.

### Verify Triggers
```sql
SELECT tgname as trigger_name, relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname LIKE 'set_%_source';
```

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Data Tables (instrumenten, apparaat, inkoop, provincie, gemeente, publiek, universal_search)

```sql
-- Only authenticated users can read data
CREATE POLICY "Authenticated users can read [table]" ON [table]
  FOR SELECT USING (auth.role() = 'authenticated');
```

### User Profiles

```sql
-- Users can only read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## Connection Details

### Session Pooler (IPv4 Compatible)
```
Host: aws-1-eu-west-1.pooler.supabase.com
Port: 5432
Database: postgres
User: postgres.kmdelrgtgglcrupprkqf
SSL: Required
```

### Direct Connection (IPv6 Only)
```
Host: db.kmdelrgtgglcrupprkqf.supabase.co
Port: 5432
Database: postgres
User: postgres
SSL: Required
```

---

## Schema SQL File

Full schema: `scripts/sql/001-initial-schema.sql`

```sql
-- =====================================================
-- Rijksuitgaven.nl Database Schema
-- Version: 1.0
-- Created: 2026-01-21
-- Executed: 2026-01-21 on Supabase (kmdelrgtgglcrupprkqf)
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Tables...
-- (see full file for complete schema)
```

---

## Data Statistics

| Table | Rows | Avg Row Size | Est. Size |
|-------|------|--------------|-----------|
| instrumenten | 674,826 | ~500 bytes | ~320 MB |
| apparaat | 21,315 | ~400 bytes | ~8 MB |
| inkoop | 635,866 | ~200 bytes | ~120 MB |
| provincie | 67,456 | ~300 bytes | ~20 MB |
| gemeente | 126,377 | ~350 bytes | ~42 MB |
| publiek | 115,020 | ~400 bytes | ~44 MB |
| universal_search | 1,456,095 | ~200 bytes | ~280 MB |
| **Total** | **3,096,955** | | **~834 MB** |

---

## After Data Updates

Run this after every data import/update:

```sql
-- Refresh cross-module search (required after data changes)
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

**Via psql:**
```bash
/usr/local/opt/libpq/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:${SUPABASE_DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;"
```

---

## Maintenance Queries

### Check Row Counts
```sql
SELECT 'instrumenten' as table_name, COUNT(*) as rows FROM instrumenten
UNION ALL SELECT 'apparaat', COUNT(*) FROM apparaat
UNION ALL SELECT 'inkoop', COUNT(*) FROM inkoop
UNION ALL SELECT 'provincie', COUNT(*) FROM provincie
UNION ALL SELECT 'gemeente', COUNT(*) FROM gemeente
UNION ALL SELECT 'publiek', COUNT(*) FROM publiek
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY rows;
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT
  indexrelname as index_name,
  relname as table_name,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Vacuum and Analyze
```sql
-- Run after large imports
VACUUM ANALYZE instrumenten;
VACUUM ANALYZE apparaat;
VACUUM ANALYZE inkoop;
VACUUM ANALYZE provincie;
VACUUM ANALYZE gemeente;
VACUUM ANALYZE publiek;
VACUUM ANALYZE universal_search;
```

---

## SQL Scripts

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `001-initial-schema.sql` | Create tables, indexes, RLS | Initial setup (done) |
| `002-normalize-source-column.sql` | Fix source values in existing data | After import if triggers weren't active |
| `003-source-column-triggers.sql` | Auto-set source on INSERT | Once after schema setup (done) |
| `004-universal-search-materialized-view.sql` | Cross-module search view | After data updates (refresh) |
| `005-backend-rls-policy.sql` | RLS policies for postgres role | Once after backend setup (done) |
| `006-aggregated-materialized-views.sql` | Pre-computed aggregations for API | Once (creates views) |
| `refresh-all-views.sql` | Refresh all materialized views | After every data update |

---

## Related Documentation

| Document | Location |
|----------|----------|
| **Data update runbook** | `scripts/data/DATA-UPDATE-RUNBOOK.md` ⭐ Use this for updates |
| Migration process | `scripts/data/DATA-MIGRATION-README.md` |
| Schema SQL | `scripts/sql/001-initial-schema.sql` |
| Source triggers | `scripts/sql/003-source-column-triggers.sql` |
| Typesense sync | `scripts/typesense/README.md` |
| WordPress baseline | `03-wordpress-baseline/exports/rijksuitgaven_schema.sql` |
| Architecture | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
