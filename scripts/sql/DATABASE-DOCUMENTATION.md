# Database Documentation

**Database:** Supabase (PostgreSQL)
**Project:** kmdelrgtgglcrupprkqf
**Region:** eu-west-1
**Created:** 2026-01-21
**Data Migrated:** 2026-01-23

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
| bedrag | INTEGER | Amount in euros |
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
| bedrag | INTEGER | Amount in euros |
| bedrag_normalized | BIGINT | Normalized amount |
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

### 7. universal_search (Cross-module search index)

**Description:** Pre-aggregated search index combining data from all modules for the "Integraal" cross-module search.

**Rows:** 1,456,095

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key (auto-generated) |
| ontvanger | VARCHAR(255) | Recipient name (main search field) |
| sources | TEXT | Comma-separated list of modules |
| sub_sources | TEXT | Detailed source breakdown |
| sub_sources_count | INTEGER | Number of sub-sources |
| source_count | INTEGER | Number of source modules |
| row_count | INTEGER | Total row count across modules |
| "2016" | DECIMAL(20,6) | Total for 2016 |
| "2017" | DECIMAL(20,6) | Total for 2017 |
| "2018" | DECIMAL(20,6) | Total for 2018 |
| "2019" | DECIMAL(20,6) | Total for 2019 |
| "2020" | DECIMAL(20,6) | Total for 2020 |
| "2021" | DECIMAL(20,6) | Total for 2021 |
| "2022" | DECIMAL(20,6) | Total for 2022 |
| "2023" | DECIMAL(20,6) | Total for 2023 |
| "2024" | DECIMAL(20,6) | Total for 2024 |
| totaal | DECIMAL(20,6) | Grand total |

**Indexes:**
- `idx_universal_ontvanger` - Fast recipient search
- `idx_universal_sources` - Fast source filtering

**Note:** Year columns are quoted ("2016") because they start with numbers.

---

### 8. user_profiles (Authentication)

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

## Related Documentation

| Document | Location |
|----------|----------|
| Migration process | `scripts/data/DATA-MIGRATION-README.md` |
| Schema SQL | `scripts/sql/001-initial-schema.sql` |
| WordPress baseline | `03-wordpress-baseline/exports/rijksuitgaven_schema.sql` |
| Architecture | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
