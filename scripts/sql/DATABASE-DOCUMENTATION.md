# Database Documentation

**Database:** Supabase (PostgreSQL)
**Project:** kmdelrgtgglcrupprkqf
**Region:** eu-west-1
**Created:** 2026-01-21
**Data Migrated:** 2026-01-23
**Last Updated:** 2026-02-14 (usage_events table, analytics functions)

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
│  │  451,445 rows   │  │    (auth)       │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  Total: 2,092,305 data rows + user profiles                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extensions Enabled

| Extension | Purpose |
|-----------|---------|
| `postgis` | Geographic/geometry data (publiek.locatie) |
| `vector` | Future: AI embeddings for semantic search |
| `pg_trgm` | Trigram indexes for fast ILIKE searches |

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

### 0. data_availability (Data Availability Indicators)

**Description:** Tracks which years have data per module/entity. Used by frontend to distinguish "no data" (em-dash) from "real zero" (0).

**Migration:** `022-data-availability.sql`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| module | TEXT | Module name (e.g., 'instrumenten', 'gemeente') |
| entity_type | TEXT | NULL for module-level, 'gemeente'/'provincie'/'source' for entity-level |
| entity_name | TEXT | NULL for module-level, entity value for entity-level |
| year_from | INT | First year with data |
| year_to | INT | Last year with data |
| updated_at | TIMESTAMP | Last update time |

**Granularity:**
- Module-level (entity_type=NULL): instrumenten, inkoop, apparaat - all entities share same year range
- Entity-level: gemeente (per gemeente), provincie (per provincie), publiek (per source/organisatie)
- No module-level rows for entity-level modules; backend defaults to full range (2016-2024) when unfiltered

**Indexes:**
- Primary key on id
- Composite index on (module, entity_type, entity_name) for fast lookups

**Maintenance:** Update `year_to` when new year data arrives. Edit via Supabase Studio. After updates, restart backend to clear `_availability_cache`.

---

### 0b. subscriptions (Membership Management)

**Description:** User subscription and membership data. Status computed from dates (no status column). Linked to Supabase Auth.

**Migration:** `030-subscriptions.sql` (added 2026-02-11)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (default gen_random_uuid()) |
| user_id | UUID | Foreign key to auth.users (UNIQUE) |
| email | TEXT | User email (NOT NULL) |
| name | TEXT | User full name |
| organization | TEXT | Organization name |
| plan | TEXT | 'monthly' or 'yearly' |
| role | TEXT | 'member' or 'admin' (default: 'member') |
| start_date | DATE | Subscription start date |
| end_date | DATE | Subscription end date |
| grace_ends_at | DATE | Grace period end date (3 days monthly, 14 days yearly) |
| cancelled_at | TIMESTAMPTZ | When subscription was cancelled |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMPTZ | Row creation time (default NOW()) |
| updated_at | TIMESTAMPTZ | Last update time (default NOW()) |

**Status Logic (computed, not stored):**
- `cancelled_at` IS NOT NULL → expired
- TODAY <= `end_date` → active
- TODAY <= `grace_ends_at` → grace
- Otherwise → expired

**RLS Policies:**
- Users can read own row: `(SELECT auth.uid()) = user_id`
- Service role has full access (no RLS)

**Indexes:**
- `subscriptions_user_id_key` (UNIQUE) - Fast lookup by user_id (used by middleware)
- `idx_subscriptions_end_date` - Fast admin queries for expiring subscriptions

**Additional columns (added post-initial migration):**
- `first_name` TEXT, `last_name` TEXT — split name fields (migration 030)
- `invited_at` TIMESTAMPTZ — when invite email was sent (migration 033)
- `activated_at` TIMESTAMPTZ — first login timestamp, set once (migration 035)
- `last_active_at` TIMESTAMPTZ — real user activity, updated by middleware every 5 min (migration 037)
- `role` supports 'trial' in addition to 'member'/'admin' (migration 034)

**Usage:**
- Middleware checks subscription on every page request (after auth), updates `last_active_at` (throttled 5 min)
- Admin pages: `/team` (dashboard) and `/team/leden` (member management)
- Service role client: `app/api/_lib/supabase-admin.ts` (bypasses RLS)
- Requires: `SUPABASE_SERVICE_ROLE_KEY` env var on Railway frontend

---

### 0c. feedback (User Feedback)

**Description:** User-submitted feedback items with screenshot support. Managed via `/team/feedback` admin page.

**Migration:** `031-feedback.sql` (added 2026-02-11)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (default gen_random_uuid()) |
| user_id | UUID | Foreign key to auth.users |
| email | TEXT | User email at time of submission |
| category | TEXT | 'suggestie', 'bug', or 'vraag' |
| message | TEXT | User's feedback message |
| page_url | TEXT | URL where feedback was submitted |
| screenshot | TEXT | Base64 screenshot of marked element |
| element_html | TEXT | HTML of marked element (if any) |
| status | TEXT | 'nieuw', 'in_behandeling', 'afgerond', 'afgewezen' (default: 'nieuw') |
| priority | TEXT | 'laag', 'normaal', 'hoog' (default: 'normaal') |
| admin_notes | TEXT | Admin notes on the feedback item |
| created_at | TIMESTAMPTZ | Submission time (default NOW()) |

**RLS Policies:**
- Users can insert own feedback: `(SELECT auth.uid()) = user_id`
- Users can read own feedback: `(SELECT auth.uid()) = user_id`
- Service role has full access (admin operations)

**Usage:**
- Submit: POST `/api/v1/feedback` (from feedback button UX-025)
- Admin inbox: `/team/feedback` with status/category filters
- Email notification: sent to `contact@rijksuitgaven.nl` via Resend on new feedback

---

### 0d. contacts (Contact Management / CRM)

**Description:** Lightweight CRM for email campaign management. Tracks prospects, subscribers, and churned contacts. Syncs to Resend Audience for broadcasts. Managed via `/team/contacten` admin page.

**Migration:** `036-contacts.sql` (added 2026-02-13)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (default gen_random_uuid()) |
| email | TEXT | Contact email (NOT NULL, UNIQUE) |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| organization | TEXT | Organization name |
| type | TEXT | 'prospect', 'subscriber', or 'churned' (default: 'prospect') |
| source | TEXT | How contact was acquired (website, event, referral, import) |
| notes | TEXT | Admin notes |
| resend_contact_id | TEXT | Resend Audience contact ID (for sync) |
| subscription_id | UUID | Foreign key to subscriptions (ON DELETE SET NULL) |
| created_at | TIMESTAMPTZ | Row creation time (default NOW()) |
| updated_at | TIMESTAMPTZ | Last update time (auto-updated by trigger) |

**Semi-automatic type transitions:**
- Linking `subscription_id` auto-sets type to 'subscriber'
- Manual override always available

**RLS Policies:**
- Row Level Security enabled (service role bypasses)

**Indexes:**
- `contacts_email_key` (UNIQUE) — prevent duplicate contacts
- `idx_contacts_type` — fast filtering by type
- `idx_contacts_subscription_id` — fast subscription lookup

**Trigger:** `contacts_updated_at` — auto-updates `updated_at` on every row change

**Resend Audience Sync:**
- On create: syncs to Resend Audience, stores `resend_contact_id`
- On update: syncs name changes to Resend
- On delete: removes from Resend Audience
- Fire-and-forget: sync failures logged but don't block operations
- Helper: `app/api/_lib/resend-audience.ts`

**Usage:**
- Admin page: `/team/contacten` (CRUD, sortable table, type badges)
- API: GET/POST `/api/v1/team/contacten`, PATCH/DELETE `/api/v1/team/contacten/[id]`
- Requires: `RESEND_API_KEY` + `RESEND_AUDIENCE_ID` env vars on Railway

---

### 0e. usage_events (Product Analytics)

**Description:** Server-side product analytics events. Pseudonymized user tracking (no PII). Used by admin dashboard at `/team/statistieken`.

**Migration:** `038-usage-events.sql` (added 2026-02-14)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (default gen_random_uuid()) |
| event_type | VARCHAR(20) | Event type: module_view, search, row_expand, filter_apply, export, column_change |
| actor_hash | VARCHAR(16) | Pseudonymized user ID (SHA256 first 16 chars, NOT reversible) |
| module | VARCHAR(20) | Module name (nullable — some events are module-independent) |
| properties | JSONB | Event-specific data (query, result_count, format, filters, etc.) |
| created_at | TIMESTAMPTZ | Event timestamp (default NOW()) |

**Indexes:**
- `idx_usage_events_created_at` — date range queries (dashboard)
- `idx_usage_events_event_type` — filter by event type
- `idx_usage_events_module` — filter by module
- `idx_usage_events_actor_hash` — unique user counts
- `idx_usage_events_type_created` — composite: event_type + created_at
- `idx_usage_events_properties` — GIN index on JSONB (query by properties->>'query', etc.)

**RLS Policies:**
- RLS enabled, no public SELECT policies
- Admin reads via service_role (bypasses RLS)
- Authenticated users can INSERT (for BFF endpoint)

**Retention:** `cleanup_old_usage_events(days_to_keep INT DEFAULT 90)` — deletes events older than N days. Call manually or via cron.

**RPC Functions (migration `038b-usage-events-functions.sql`):**

| Function | Returns | Description |
|----------|---------|-------------|
| `get_usage_pulse(since_date)` | total_events, unique_actors, module_views, searches, exports | Top-line metrics |
| `get_usage_modules(since_date, max_results)` | module, view_count, unique_actors | Module popularity |
| `get_usage_searches(since_date, max_results)` | query, search_count, avg_results, top_module | Top search terms |
| `get_usage_filters(since_date, max_results)` | filter_field, usage_count, unique_actors, top_module | Most-used filters |
| `get_usage_columns(since_date, max_results)` | column_name, usage_count, unique_actors, top_module | Column customization usage |
| `get_usage_exports(since_date)` | module, export_count, unique_actors, total_rows | Export activity |
| `get_usage_zero_results(since_date, max_results)` | query, search_count, top_module | Zero-result searches (most actionable) |
| `get_usage_actors(since_date, max_results)` | actor_hash, last_seen, event_count, top_module, search_count, export_count, module_count | Per-user activity summary (migration 039) |
| `get_usage_actor_detail(target_actor, since_date)` | event_type, module, properties, created_at | Single user's event timeline, max 50 (migration 039) |
| `get_usage_errors(since_date, max_results)` | module, message, properties, actor_hash, created_at | Recent error events with context (migration 040) |
| `get_usage_sessions_summary(since_date)` | total_sessions, unique_actors, avg_duration_seconds, avg_events_per_session, avg_modules_per_session | Session metrics (30-min gap boundary, migration 042) |
| `get_usage_exit_intent(since_date, max_results)` | last_event_type, session_count, percentage | Last action before session ends (migration 042) |
| `get_usage_search_success(since_date)` | total_searches, successful_searches, success_rate | Search→action success proxy (migration 042) |
| `get_usage_retention(since_date)` | cohort_month, month_offset, active_count, cohort_size, retention_rate | Monthly retention cohort grid (migration 042) |

`get_usage_actors` enhanced (migration 042): now returns session_count, avg_session_seconds, engagement_score, avg_gap_days, gap_trend, external_link_count.

All functions: `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`

**Usage:**
- Client: `useAnalytics()` hook batches events, flushes to `POST /api/v1/analytics`
- BFF: Validates events, hashes user_id → actor_hash, fire-and-forget write
- Dashboard: `/team/statistieken` calls `supabase.rpc()` for all 7 functions in parallel
- Env var: `ANALYTICS_HASH_SECRET` on Railway frontend

---

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
- `idx_instrumenten_ontvanger_details` - Details query optimization
- `idx_instrumenten_begrotingsjaar` - Fast year filtering
- `idx_instrumenten_ontvanger_jaar` - Composite: recipient + year (details with year filter)
- `idx_instrumenten_regeling` - Fast regulation search
- `idx_instrumenten_ontvanger_normalized` - Functional index on `normalize_recipient(ontvanger)` for entity resolution
- `idx_instrumenten_begrotingsnaam` - Filter dropdown DISTINCT (2026-02-05)
- `idx_instrumenten_artikel` - Filter dropdown DISTINCT (2026-02-05)
- `idx_instrumenten_artikelonderdeel` - Filter dropdown DISTINCT (2026-02-05)
- `idx_instrumenten_instrument` - Filter dropdown DISTINCT (2026-02-05)

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
- `idx_apparaat_kostensoort_details` - Details query optimization
- `idx_apparaat_begrotingsjaar` - Fast year filtering
- `idx_apparaat_kostensoort_jaar` - Composite: kostensoort + year
- `idx_apparaat_begrotingsnaam` - Filter dropdown DISTINCT (2026-02-05)
- `idx_apparaat_artikel` - Filter dropdown DISTINCT (2026-02-05)
- `idx_apparaat_detail` - Filter dropdown DISTINCT (2026-02-05)

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
- `idx_inkoop_leverancier_details` - Details query optimization
- `idx_inkoop_jaar` - Fast year filtering
- `idx_inkoop_leverancier_jaar` - Composite: supplier + year
- `idx_inkoop_ministerie` - Fast ministry filtering / Filter dropdown DISTINCT
- `idx_inkoop_categorie` - Filter dropdown DISTINCT (2026-02-05)
- `idx_inkoop_staffel` - Filter dropdown DISTINCT (2026-02-05)

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
- `idx_provincie_ontvanger_details` - Details query optimization
- `idx_provincie_jaar` - Fast year filtering
- `idx_provincie_ontvanger_jaar` - Composite: recipient + year
- `idx_provincie_provincie` - Fast province filtering / Filter dropdown DISTINCT (2026-02-05)

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
- `idx_gemeente_ontvanger_details` - Details query optimization
- `idx_gemeente_jaar` - Fast year filtering
- `idx_gemeente_ontvanger_jaar` - Composite: recipient + year
- `idx_gemeente_gemeente` - Fast municipality filtering / Filter dropdown DISTINCT
- `idx_gemeente_beleidsterrein` - Filter dropdown DISTINCT (2026-02-05)

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
- `idx_publiek_ontvanger_details` - Details query optimization
- `idx_publiek_jaar` - Fast year filtering
- `idx_publiek_ontvanger_jaar` - Composite: recipient + year
- `idx_publiek_source` - Fast source filtering / Filter dropdown DISTINCT (2026-02-05)
- `idx_publiek_regeling` - Filter dropdown DISTINCT (2026-02-05)

**Note:** Uses PostGIS geometry for location data.

---

### 7. universal_search (Cross-module search - MATERIALIZED VIEW)

**Description:** Aggregated cross-module search for "Integraal zoeken". One row per unique recipient with yearly totals across all recipient-based modules.

**Type:** MATERIALIZED VIEW (not a table)

**Unique Recipients:** 451,445 (after entity resolution)

**Entity Resolution (2026-01-26):**
Uses `normalize_recipient()` function to merge duplicate recipients with different spellings:
- B.V./BV variations (e.g., "ProRail B.V." → "PRORAIL")
- N.V./NV variations (e.g., "N.V. Nederlandse Spoorwegen" → "NEDERLANDSE SPOORWEGEN")
- Casing variations (all converted to UPPER)
- Extra spaces (normalized to single space)

**Result:** 15,382 duplicates merged (466,827 → 451,445)

**Modules Included:**
- Financiële instrumenten (ontvanger)
- Inkoopuitgaven (leverancier)
- Publiek (ontvanger) - RVO, COA, NWO, ZonMW
- Gemeentelijke subsidieregisters (ontvanger)
- Provinciale subsidieregisters (ontvanger)

**Excluded:** Apparaatsuitgaven (operational costs, no external recipients)

| Column | Type | Description |
|--------|------|-------------|
| ontvanger_key | TEXT | Normalized recipient (UPPER, no B.V./N.V.) for grouping |
| ontvanger | TEXT | Display name (original case, first occurrence) |
| sources | TEXT | Comma-separated list of modules |
| source_count | INTEGER | Number of modules recipient appears in |
| record_count | BIGINT | Total payment rows across all modules (UX-022, added 2026-02-08) |
| "2016" - "2024" | BIGINT | Yearly totals in absolute euros |
| totaal | BIGINT | Grand total across all years |
| years_with_data | INTEGER | Number of years with non-zero amounts |
| random_order | DOUBLE PRECISION | Pre-computed random value for fast random sorting |

**All amounts in ABSOLUTE EUROS** (€1 = 1)

**Indexes:**
- `idx_universal_search_key` - Unique on ontvanger_key
- `idx_universal_search_ontvanger` - Fast recipient search
- `idx_universal_search_sources` - Fast source filtering
- `idx_universal_search_totaal` - Fast sorting by amount
- `idx_universal_search_random` - Fast random order sorting
- `idx_universal_search_years` - Fast years_with_data filtering
- `idx_universal_search_years_random` - Composite: years_with_data + random
- `idx_universal_search_record_count` - Fast betalingen bracket filtering

**Refresh Command:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

**Scripts:**
- `scripts/sql/004-universal-search-materialized-view.sql` (original version)
- `scripts/sql/009-entity-resolution-normalization.sql` (with entity resolution)

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
| ontvanger_key | TEXT | Normalized primary key for lookups |
| [primary_field] | TEXT | ontvanger, kostensoort, or leverancier (display name) |
| "2016" - "2024" | BIGINT | Yearly totals in absolute euros |
| totaal | BIGINT | Grand total across all years |
| row_count | BIGINT | Number of source rows aggregated |
| years_with_data | INTEGER | Count of years with non-zero amounts (for min_years filter) |
| random_order | FLOAT | Pre-computed random value for fast random sorting |

**Module-specific columns (for search and display):**

| View | Extra Columns |
|------|---------------|
| instrumenten_aggregated | artikel, regeling, instrument, begrotingsnaam |
| apparaat_aggregated | artikel, detail |
| inkoop_aggregated | categorie, staffel |
| provincie_aggregated | provincie, omschrijving |
| gemeente_aggregated | gemeente, omschrijving |
| publiek_aggregated | organisatie |

**Amount Normalization:**
- `instrumenten_aggregated` and `apparaat_aggregated`: Amounts multiplied by 1000 (source data in ×1000)
- All other views: Amounts as-is (already in absolute euros)

**Indexes per view:**
- `idx_[view]_[primary]` - Fast lookup by primary field
- `idx_[view]_totaal` - Fast sorting by total amount
- `idx_[view]_[primary]_trgm` - GIN trigram index for fast ILIKE searches (added 2026-01-26)

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

### 9. subscriptions (Membership Management)

**Description:** Subscription and membership data. Status computed from dates (no status column, no cron job).

**Migration:** `030-subscriptions.sql`
**Created:** 2026-02-11

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (gen_random_uuid()) |
| user_id | UUID | Foreign key to auth.users (UNIQUE, NOT NULL) |
| email | TEXT | User email (NOT NULL) |
| name | TEXT | Full name |
| organization | TEXT | Organization name |
| plan | TEXT | 'monthly' or 'yearly' (NOT NULL) |
| role | TEXT | 'member' or 'admin' (default: 'member', NOT NULL) |
| start_date | DATE | Subscription start date (NOT NULL) |
| end_date | DATE | Subscription end date (NOT NULL) |
| grace_ends_at | DATE | Grace period end date (auto-computed: end_date + 3d for monthly, +14d for yearly) |
| cancelled_at | TIMESTAMPTZ | When subscription was cancelled (NULL if active) |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Status Calculation (computed, not stored):**
```typescript
if (cancelled_at !== null) return 'expired'
if (today <= end_date) return 'active'
if (today <= grace_ends_at) return 'grace'
return 'expired'
```

**Grace Periods:**
- Monthly: 3 days (end_date + 3)
- Yearly: 14 days (end_date + 14)

**Indexes:**
- `idx_subscriptions_user_id` - UNIQUE on user_id (one subscription per user)
- `idx_subscriptions_end_date` - Fast lookup for expiration checks

**RLS Policies:**
```sql
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

**Admin Access:** Admin pages at `/team` and `/team/leden` use service role client (`lib/supabase/admin.ts`) with `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

**No Status Column Rationale:** Status is purely time-based and computed on every request. Storing status would require cron jobs to keep it in sync, adding complexity for no benefit. Current approach is simpler and always accurate.

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

## Functions

### normalize_recipient()

**Description:** Normalizes recipient names for entity resolution. Merges variations like "ProRail B.V." and "Prorail BV" into a single entity.

**Created:** 2026-01-26
**Script:** `scripts/sql/009-entity-resolution-normalization.sql`

```sql
CREATE OR REPLACE FUNCTION normalize_recipient(name TEXT)
RETURNS TEXT AS $$
SELECT
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  UPPER(TRIM(COALESCE(name, ''))),
                  '\s+', ' ', 'g'),              -- multiple spaces → single
                '\.+$', ''),                      -- trailing dots
              ' B\.V\.?$', ''),                   -- " B.V." at end
            ' BV\.?$', ''),                       -- " BV" at end
          ' N\.V\.?$', ''),                       -- " N.V." at end
        ' NV\.?$', ''),                           -- " NV" at end
      '^N\.V\.? ', '')                            -- "N.V. " at start
  );
$$ LANGUAGE SQL IMMUTABLE STRICT;
```

**Transformations applied (in order):**
1. Convert to UPPER case
2. Collapse multiple spaces to single space
3. Remove trailing dots
4. Remove ` B.V.` or ` B.V` at end
5. Remove ` BV` at end
6. Remove ` N.V.` or ` N.V` at end
7. Remove ` NV` at end
8. Remove `N.V. ` or `N.V ` at start

**Examples:**
| Input | Output |
|-------|--------|
| "ProRail B.V." | "PRORAIL" |
| "Prorail BV" | "PRORAIL" |
| "N.V. Nederlandse Spoorwegen" | "NEDERLANDSE SPOORWEGEN" |
| "NEDERLANDSE SPOORWEGEN N.V." | "NEDERLANDSE SPOORWEGEN" |
| "NS Vastgoed B.V." | "NS VASTGOED" |

**Used by:** `universal_search` materialized view for entity grouping

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
| universal_search | 451,445 | ~200 bytes | ~85 MB |
| **Total** | **2,092,305** | | **~640 MB** |

---

## After Data Updates

Run this after every data import/update:

```sql
-- Refresh cross-module search (required after data changes)
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```

**Via psql:**
```bash
/usr/local/Cellar/libpq/18.1/bin/psql "postgresql://postgres.kmdelrgtgglcrupprkqf:${SUPABASE_DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;"
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
| `004-universal-search-materialized-view.sql` | Cross-module search view (original) | Superseded by 009 |
| `005-backend-rls-policy.sql` | RLS policies for postgres role | Once after backend setup (done) |
| `006-aggregated-materialized-views.sql` | Pre-computed aggregations for API | Once (creates views) |
| `007-search-optimization-indexes.sql` | pg_trgm + GIN indexes for ILIKE | Once after views created (done) |
| `008-source-table-indexes.sql` | Source table indexes for details | Once (done) |
| `009-entity-resolution-normalization.sql` | Entity resolution + universal_search | Once (done) |
| `020-normalize-recipient-indexes.sql` | Functional indexes for normalize_recipient | Once (done) |
| `021-filter-column-indexes.sql` | B-tree indexes on filter columns for DISTINCT | Once (done 2026-02-05) |
| `022-data-availability.sql` | Create data_availability table + populate | Once (done 2026-02-07) |
| `023-fix-amsersfoort-typo.sql` | Fix "Amsersfoort" → "Amersfoort" in gemeente | Once (done 2026-02-07) |
| `024-fix-encoding-double-utf8.sql` | Fix double-encoded UTF-8 across all tables | Once (done 2026-02-07) |
| `025-fix-encoding-question-marks.sql` | Fix lost characters (431 explicit corrections) | Once (done 2026-02-07) |
| `029-universal-search-record-count.sql` | Add record_count to universal_search (UX-022) | Once (done 2026-02-08) |
| `030-subscriptions.sql` | Create subscriptions table + RLS policies | Once (done 2026-02-11) |
| `031-feedback.sql` | Create feedback table + RLS policies | Once (done 2026-02-11) |
| `033-invited-at.sql` | Add invited_at column to subscriptions | Once (done 2026-02-11) |
| `034-trial-role.sql` | Add trial role support to subscriptions | Once (done 2026-02-11) |
| `035-activated-at.sql` | Add activated_at column to subscriptions + backfill | Once (done 2026-02-12) |
| `036-contacts.sql` | Create contacts table (CRM) + RLS + trigger | Once (done 2026-02-13) |
| `037-last-active-at.sql` | Add last_active_at to subscriptions + backfill | Once (done 2026-02-13) |
| `038-usage-events.sql` | Create usage_events table + indexes + RLS + retention fn | Once (done 2026-02-14) |
| `038b-usage-events-functions.sql` | 7 SQL functions for analytics dashboard | Once (done 2026-02-14) |
| `039-usage-dashboard-v2.sql` | Dashboard V2: updated get_usage_searches (avg_results), new get_usage_actors + get_usage_actor_detail | Once (done 2026-02-14) |
| `040-usage-errors-function.sql` | Error tracking: get_usage_errors() — recent error events with context for admin dashboard | Once (done 2026-02-14) |
| `041-subscriptions-update-rls.sql` | RLS UPDATE policy for subscriptions (last_active_at) | Once (done 2026-02-14) |
| `042-advanced-analytics.sql` | Advanced analytics V3: sessions summary, exit intent, search success, retention cohorts, enhanced actors (engagement score, gap trend, external_link_count) | Once (done 2026-02-14) |
| `refresh-all-views.sql` | Refresh all materialized views | After every data update |

---

## Data Quality: Encoding Cleanup (2026-02-07)

Legacy WordPress/MySQL data had encoding corruption from CSV export. All issues were fixed across all 6 source tables.

| Type | Rows Fixed | Description |
|------|-----------|-------------|
| Double-encoded UTF-8 | ~4,400 | `CafÃ©` → `Café` (most common) |
| Triple-encoded UTF-8 | ~400 | `ÃƒÂ«` → `ë` (mainly inkoop.leverancier) |
| Lost characters (?) | ~500 | `Caf??` → `Café` (431 explicit corrections) |
| Division sign ÷→ö | 77 | `Co÷peratie` → `Coöperatie` |
| Section signs ç→§ | 160 | `ç1` → `§1` in provincie.omschrijving |
| Mac Roman √ç→ä | 6 | `Matth√çus` → `Matthäus` in gemeente |
| Euro sign ‚Çè→€ | 24 | `MON‚ÇèY` → `MON€Y` in gemeente |
| Â-prefix artifacts | 26 | `Ja-maarÂ®` → `Ja-maar®` |
| Ã³→ó, Ã¼→ü | 52 | Remaining double-encoded in inkoop |

**Scripts:** `scripts/data/fix-encoding-phase1.py` through `phase1f.py`, `scripts/sql/025-fix-encoding-question-marks.sql`

**Lesson learned:** Never do blanket character replacements across all tables. Always scope fixes to the specific tables/columns where corruption was introduced. Phase 1d demonstrated this (23,911 rows damaged, immediately reversed by Phase 1e).

---

## Related Documentation

| Document | Location |
|----------|----------|
| **Data update runbook** | `scripts/data/DATA-UPDATE-RUNBOOK.md` ⭐ Use this for updates |
| Migration process | `scripts/data/DATA-MIGRATION-README.md` |
| Encoding fix scripts | `scripts/data/fix-encoding-phase1*.py` (6 scripts) |
| Encoding fix SQL | `scripts/sql/024-fix-encoding-double-utf8.sql`, `025-fix-encoding-question-marks.sql` |
| Schema SQL | `scripts/sql/001-initial-schema.sql` |
| Source triggers | `scripts/sql/003-source-column-triggers.sql` |
| Typesense sync | `scripts/typesense/README.md` |
| WordPress baseline | `03-wordpress-baseline/exports/rijksuitgaven_schema.sql` |
| Architecture | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
