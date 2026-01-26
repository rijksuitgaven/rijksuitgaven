# Session Context

**Last Updated:** 2026-01-26
**Project Phase:** Phase 1 - V1.0 Development
**Current Sprint:** Week 2 COMPLETE → Next: Week 3 - Core UI Components

---

## Current Status

### What We're Working On
- ✅ Documentation structure created
- ✅ Current environment analyzed
- ✅ Database structure documented
- ✅ Technology stack recommended
- ✅ Search requirements deep-dive
- ✅ Architecture impact analysis
- ✅ V2.0 Research Mode design
- ✅ Batch 1 wireframes (for new features)
- ✅ Wireframes reviewed and approved (2026-01-23)
- ✅ V1.0 scope finalized (single-view architecture + new search)
- ✅ Sprint plan created (8 weeks)
- ✅ Documentation audit completed
- ✅ PM audit completed (all gaps closed)
- ✅ Deployment strategy documented
- ✅ UX brainstorm completed (7 enhancements decided)
- ✅ Folder restructure completed (version-explicit names)
- ✅ Supabase project created and schema deployed
- ✅ Railway account created, project configured
- ✅ Typesense deployed with persistent volume
- ✅ Data migration completed (MySQL → Supabase) - 3.1M rows
- ✅ Universal search materialized view created
- ✅ Source column triggers deployed
- ✅ Data freshness tracking table created
- ✅ **Typesense collections & sync** - 451,445 recipients indexed, <25ms search
- ✅ **Week 1 Day 7:** Next.js project setup (COMPLETED 2026-01-24)
- ✅ **Week 1 COMPLETE** - All deliverables done
- ✅ **Week 2 Day 1:** FastAPI backend deployed (COMPLETED 2026-01-26)
- ✅ **Chart Library:** Recharts selected (React 19 compatible)
- ✅ **RESOLVED:** Query performance optimized (114-989ms, was 9-19 seconds)
- ✅ **Week 2 COMPLETE:** All 7 API endpoints working, tested, documented

### Active Tasks
| Task | Status | Notes |
|------|--------|-------|
| V1.0 scope redefinition | ✅ Completed | Single-view architecture, not 1:1 port |
| Single-view architecture | ✅ Completed | ADR-014, no two-view toggle |
| Cross-module requirements | ✅ Completed | `cross-module-requirements.md` |
| Product backlog | ✅ Completed | `backlog.md` created |
| Recipient normalization | ✅ Decided | V1.0: UPPER(), V2.0: entity table |
| Project overview docs | ✅ Completed | All 4 files in `01-project-overview/` updated |
| Sprint plan | ✅ Completed | `09-timelines/v1-sprint-plan.md` |
| Auth decision | ✅ Completed | Magic Link (passwordless) |
| Documentation audit | ✅ Completed | 14 empty files deleted, auth refs updated |
| PM audit | ✅ Completed | All gaps identified and closed |
| Deployment strategy | ✅ Completed | beta.rijksuitgaven.nl → DNS switch |
| UX brainstorm | ✅ Completed | 7 enhancements for V1.0 |
| Folder restructure | ✅ Completed | Version-explicit names |

---

## Recent Work (Last 3 Files)

1. **backend/** ⭐ CREATED (2026-01-26)
   FastAPI backend with real aggregation queries. Deployed to Railway at `rijksuitgaven-api-production-3448.up.railway.app`

2. **docs/plans/2026-01-26-chart-library-evaluation.md** ⭐ CREATED (2026-01-26)
   Chart library research: Recharts selected over Tremor (React 19 compatibility)

3. **scripts/sql/005-backend-rls-policy.sql** ⭐ CREATED (2026-01-26)
   RLS policies allowing backend (postgres role) to read all data tables

---

## Infrastructure

### Supabase (Database + Auth)

| Property | Value |
|----------|-------|
| Project URL | `https://kmdelrgtgglcrupprkqf.supabase.co` |
| Region | Europe (Frankfurt) |
| Plan | **Pro** (upgraded 2026-01-23) |
| Created | 2026-01-21 |
| Extensions | postgis, vector (pgvector) |

### Railway (Hosting)

| Property | Value |
|----------|-------|
| Project | rijksuitgaven |
| Created | 2026-01-21 |
| Billing | Active (credit card added) |
| **Next.js App URL** | `https://rijksuitgaven-production.up.railway.app` |
| **Beta URL** | `https://beta.rijksuitgaven.nl` |
| **Beta CNAME Target** | `j65ghs38.up.railway.app` (Railway-provided) |
| Root Directory | `app` |
| Region | EU West (Amsterdam) |

### FastAPI Backend (API) ⭐ NEW 2026-01-26

| Property | Value |
|----------|-------|
| Platform | Railway |
| URL | `https://rijksuitgaven-api-production-3448.up.railway.app` |
| Health | `/health` - database connected |
| API Docs | `/docs` - Swagger UI |
| Root Directory | `backend` |
| Status | ✅ Running |
| **Performance** | ✅ 114-989ms (optimized with materialized views) |

**Endpoints:**
- `GET /api/v1/modules` - List all modules
- `GET /api/v1/modules/{module}` - Aggregated data with year columns
- `GET /api/v1/modules/{module}/{value}/details` - Expandable row details

### Typesense (Search Engine)

| Property | Value |
|----------|-------|
| Platform | Railway (template deployment) |
| URL | `typesense-production-35ae.up.railway.app` |
| API Key | `0vh4mxafjeuvd676gw92kpjflg6fuv57` |
| Status | ✅ Running |
| Collections | 7 (recipients, instrumenten, inkoop, publiek, gemeente, provincie, apparaat) |
| Indexed | 451,445 recipients (after entity resolution) |
| Performance | <25ms search (target <100ms) |
| Scripts | `scripts/typesense/collections.json`, `scripts/typesense/sync_to_typesense.py` |
| **Sync Docs** | `scripts/typesense/README.md` ← **Use this for re-indexing** |

### Supabase Connection String (for scripts)

```
postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Note:** Use pooler URL (`aws-1-eu-west-1.pooler.supabase.com`), NOT direct URL (`db.xxx.supabase.co`).

### Executed Scripts

| Script | Executed | Environment |
|--------|----------|-------------|
| `scripts/sql/001-initial-schema.sql` | 2026-01-21 | Supabase |
| `scripts/sql/002-normalize-source-column.sql` | 2026-01-23 | Supabase |
| `scripts/sql/003-source-column-triggers.sql` | 2026-01-23 | Supabase |
| `scripts/sql/004-universal-search-materialized-view.sql` | 2026-01-23 | Supabase |
| `scripts/data/transform-csv-headers.py` | 2026-01-23 | Local |
| `scripts/data/import-to-supabase.sh` | 2026-01-23 | Local → Supabase |
| `scripts/sql/005-backend-rls-policy.sql` | 2026-01-26 | Supabase |
| `scripts/sql/006-aggregated-materialized-views.sql` | 2026-01-26 | Supabase |
| `scripts/sql/refresh-all-views.sql` | 2026-01-26 | Supabase |
| `scripts/sql/007-search-optimization-indexes.sql` | 2026-01-26 | Supabase |
| `scripts/sql/008-source-table-indexes.sql` | 2026-01-26 | Supabase |
| `scripts/sql/009-entity-resolution-normalization.sql` | 2026-01-26 | Supabase |
| VACUUM ANALYZE (all tables) | 2026-01-26 | Supabase |

### Configuration Files

| File | Purpose |
|------|---------|
| `config/typesense-railway.md` | Typesense setup documentation |
| `scripts/sql/DATABASE-DOCUMENTATION.md` | Database schema, triggers, queries |
| `scripts/data/DATA-MIGRATION-README.md` | Migration process documentation |
| `scripts/data/DATA-UPDATE-RUNBOOK.md` | Data update procedure (refresh views, re-sync) |
| `scripts/sql/refresh-all-views.sql` | Refresh script for all materialized views |

---

## Key Decisions Made

### Deployment Strategy (2026-01-21) ⭐ NEW

| Decision | Outcome |
|----------|---------|
| Production domain | rijksuitgaven.nl |
| Staging domain | beta.rijksuitgaven.nl |
| Staging protection | Magic Link (Supabase Auth) |
| Beta testers | 5 people |
| Cutover approach | Hard DNS switch |
| Rollback plan | None - thorough testing before switch |
| Current hosting | Private server (can terminate anytime) |
| DNS control | Founder |

**Development flow:**
1. Build on beta.rijksuitgaven.nl (Weeks 1-7)
2. Beta test with 5 users (Week 8)
3. DNS switch to rijksuitgaven.nl
4. Email 50 users
5. Shut down WordPress

**See:** `07-migration-strategy/deployment-strategy.md`

### Folder Restructure (2026-01-21) ⭐ NEW

**Problem:** Confusion about what "current state" and "design" folders referred to (WordPress vs V1.0).

**Solution:** Renamed folders to be version-explicit:
- `03-current-state/` → `03-wordpress-baseline/`
- `05-design/` → `05-v1-design/`

**Impact:** Updated all cross-references in documentation.

**Rule Added to CLAUDE.md:** "Documentation must always be 100% up to date."

### PM Audit Decisions (2026-01-21) ⭐ NEW

| Topic | Decision |
|-------|----------|
| User data export | CSV from founder with full user profile |
| User fields | Email, name, org, role, phone, subscription dates, list |
| Data export | SQL dump from MySQL |
| EUR normalization | Varies by module; existing scripts handle conversion |
| universal_search | Migrate as-is; founder's SQL scripts can repopulate |
| Homepage content | Extract from `01-Home-not logged in.html` archive |
| Support pages | Park for later (site will change) |
| Transactional email | Supabase built-in; Mailgun if needed |
| Marketing email | Keep Mailster + Mailgun on nieuws.rijksuitgaven.nl |
| Analytics | Backlog (not V1.0) |
| Error tracking | Backlog (not V1.0) |

**See:** `07-migration-strategy/migration-overview.md`

### Marketing Email Decision (2026-01-21) ⭐ NEW

| Aspect | Decision |
|--------|----------|
| Tool | Keep Mailster + Mailgun (current setup) |
| Location | nieuws.rijksuitgaven.nl (subdomain) |
| WordPress | Stripped to Mailster only |
| Server | Current private server (continues running) |
| Future | Evaluate dedicated platform post-V1.0 |

**Rationale:** Don't migrate working email system during V1.0. Reduces risk, preserves data.

**See:** `07-migration-strategy/deployment-strategy.md`

### Final Pre-Development Decisions (2026-01-21) ⭐ NEW

| Decision | Outcome |
|----------|---------|
| Backend framework | **FastAPI (Python)** - better for data/AI work |
| URL sharing | **Search + key filters** (e.g., `/instrumenten?q=prorail&jaar=2024`) |
| Staging access | **Disable public signup** - manually add beta testers in Supabase |
| Table rename (stad→gemeente) | **Handled by existing scripts** |
| Grouping fields | **All filter fields are groupable** - each module has its own set |

### URL Sharing Specification (V1.0)

**Format:** `/[module]?q=[search]&[filter1]=[value]&[filter2]=[value]`

**Shareable parameters:**
- `q` - search term
- `jaar` - year filter
- Module-specific key filters (top 2-3 per module)

**NOT in URL (V1.0):**
- Expanded/collapsed row state
- Pagination position
- Column preferences
- Grouping selection

**Full URL state restoration:** Deferred to V2.0

### Grouping Fields Per Module (All Filter Fields Are Groupable)

| Module | Groupable/Filterable Fields |
|--------|----------------------------|
| Financiële Instrumenten | Regeling, Artikel, Artikelonderdeel, Instrument, Detail, Begrotingsnaam |
| Apparaatsuitgaven | Kostensoort, Artikel, Detail, Begrotingsnaam |
| Provinciale subsidies | Provincie, Omschrijving |
| Gemeentelijke subsidies | Gemeente, Beleidsterrein, Regeling, Omschrijving, Beleidsnota |
| Inkoopuitgaven | Ministerie, Categorie, Staffel |
| Publiek | Organisatie, Regeling, Trefwoorden, Sectoren, Regio, Staffel, Onderdeel |
| Integraal | Module (cross-module grouping) |

**Note:** Each module has different fields - e.g., Gemeente field exists in Gemeentelijke but not Provinciale.

### V1.0 UX Enhancements (2026-01-21) ⭐ UPDATED

**Source:** UX Brainstorm Sessions with founder

**User research findings:**
- 50% Political staff, 25% Journalists, 25% Researchers
- Core need: "Where does the money go, and does it work?"
- Users think theme-first ("wolf protection"), system is recipient-first
- Users LOVE trends but struggle to spot anomalies in large numbers

| Enhancement | Decision | Effort |
|-------------|----------|--------|
| **Enhanced autocomplete** | Index Omschrijving, Regeling, Beleidsterrein; show keyword matches | 4-8 hrs |
| **Cross-module indicator** | "Ook in: Instrumenten, Publiek" on recipient rows | 3-5 hrs |
| **Prominent expanded context** | Regeling as headline, breadcrumb hierarchy | Design only |
| **URL sharing** | Search + key filters preserved | Already planned |
| **Trend anomaly indicator** | Red highlight for 10%+ year-over-year changes (magnitude only) | 3-4 hrs |
| **Cross-module search results** | Always show "Ook in:" with counts above table | 4-6 hrs |
| **Integraal as landing** | Move Integraal tab to first position | Config only |

**User struggles addressed:**
- A) Finding recipients → Enhanced autocomplete
- B) Connecting dots across modules → "Ook in:" indicator + cross-module results + Integraal landing
- C) Understanding context → Prominent expanded design
- D) Sharing findings → URL sharing
- E) Tracking over time → Year columns + trend anomaly indicator (enhanced)

**Total additional effort:** 14-23 hours (~2-3 days)

**V2.0 alignment:** All decisions prepare for Research Mode without conflict.

**Deferred to backlog:**
- User-configurable anomaly threshold (5%, 10%, 15%, 20%)
- Data provenance / freshness indicator
- Accessibility: colorblind indicator for trend highlights
- Newsletter: media topics + spending data (marketing idea)

**See:** `docs/plans/2026-01-21-v1-search-ux-enhancement.md`

### V1.0 Scope Change (2026-01-20)

**V1.0 = Single-View Architecture + New Search Features**

| Category | What's Included |
|----------|-----------------|
| **ARCHITECTURE** | Single smart view with on-the-fly aggregation (NO two-view toggle) |
| **DATABASE** | Source tables only (7 tables, NOT 20+ pivot tables) |
| **NEW FEATURES** | Global search bar, autocomplete, cross-module search, enhanced filters, CSV export |
| **TECH STACK** | Next.js + Supabase + Typesense (future-proof foundation) |

**Key Decision (ADR-014):** The two-view toggle was a database limitation, not a user need. Users want pattern discovery.

**New UI Pattern:**
- Year columns always visible (trend analysis)
- Aggregated by recipient by default
- Click to expand → shows grouped sub-rows
- User chooses grouping (Regeling, Artikel, Instrument, etc.)
- "Show all rows" for raw data access

### Search & Semantic Architecture (2026-01-20) ⭐ NEW

**ADR-013:** Search and Semantic Architecture

| Component | Purpose | V1.0 | V2.0 |
|-----------|---------|------|------|
| **Supabase** | Database + Auth + pgvector | ✅ | ✅ |
| **Typesense** | Keyword search <100ms, autocomplete <50ms | ✅ | ✅ |
| **pgvector** | Vector search (~2-5K vectors only) | ❌ | ✅ |
| **IBOS classification** | Semantic lookup (replaces most vector search) | ❌ | ✅ |
| **Claude** | Complex reasoning (use sparingly) | ❌ | ✅ |

**Key decisions:**
- Migrate to Supabase (PostgreSQL) for V1.0 (not keep MySQL)
- Typesense for V1.0 keyword search (meets all requirements)
- IBOS domain classification for V2.0 semantics (500K recipients → 30 domains)
- pgvector for edge cases only (~2-5K vectors, not 500K)
- Nightly data sync: Supabase → Typesense
- Regeling → Wet matching: V2.0 feature (not V1.0 prep)

**Cost estimate:** €97-150/month (within €180 budget)

### Cross-Module ("Integraal") Architecture (2026-01-20) ⭐ NEW

| Decision | Outcome |
|----------|---------|
| Included modules | instrumenten, gemeente, provincie, publiek, inkoop |
| Excluded | Apparaatsuitgaven (operational costs, no recipients) |
| Data source | Keep aggregated `universal_search` table (normalized EUR) |
| Results display | Recipient → Module breakdown → Grouping (click to navigate) |
| Totals row | YES - grand total across all modules |
| Sorting | Asc/desc on years and totaal |
| Recipient normalization | V1.0: `normalize_recipient()` (B.V./N.V./casing) → 451,445 entities |
| Navigation | Click grouping → module page with filter applied |

**Key insight:** Cross-module = discovery layer, Module page = detail layer.

### Overzicht Page (2026-01-20) ⭐ NEW

Dedicated overview page showing module-level totals with year columns.

| Feature | Description |
|---------|-------------|
| Purpose | High-level spending overview, entry point to platform |
| Location | Dedicated page, first nav item after logo |
| Modules | All 6 modules with totals per year |
| Sub-sources | Publiek (RVO/COA/NWO), Provincies (12), Gemeentes (top 10 + "show all") |
| Click behavior | Module/sub-source → navigate to module page (with filter) |
| Data | Pre-computed `module_totals` table (monthly refresh) |
| Footer | Grand total row across all modules |

### Marketing Pages (2026-01-20) ⭐ NEW

| Decision | Outcome |
|----------|---------|
| CMS | No - edit component files directly |
| Homepage | Port from WordPress (same content) |
| Support | Markdown files in repo |
| Build approach | v0.dev for UI, Claude Code for logic |
| Reason | Solo founder, infrequent changes, speed priority |

### V2-Ready Architecture (2026-01-20) ⭐ NEW

**Principle:** No platform migrations between V1 and V2.

| Layer | Technology | V1 | V2 |
|-------|------------|----|----|
| UI Components | shadcn/ui | ✅ | ✅ |
| Charts | Recharts (+ Nivo for V2) | ✅ | ✅ |
| Tables | TanStack Table | ✅ | ✅ |
| Backend | FastAPI | ✅ | ✅ |
| Database | Supabase + pgvector | ✅ | ✅ |
| Search | Typesense | ✅ | ✅ |
| Maps | react-map-gl | - | ✅ |
| PDF Export | Puppeteer | - | ✅ |

**V2 tables created empty in V1** - no schema migrations needed.
**Feature flags** control V2 functionality - flip to enable.

### UI/UX Review Decisions (2026-01-23) ⭐ NEW

**All 6 wireframes reviewed and approved.**

| Decision | Outcome |
|----------|---------|
| Module tabs (tablet) | Keep as scrollable tabs (NOT dropdown) - single-click access |
| Module tabs (mobile) | Dropdown is acceptable |
| Detail page behavior | **Side panel** (50% width) - see results + detail simultaneously |
| "Ook in:" on detail | Show cross-module badges, click to switch module view |
| "Bron" rename | → **"Organisatie"** in Publiek module (clearer term) |

**Default Columns Per Module (updated):**

| Module | Default Detail Columns |
|--------|------------------------|
| Financiële Instrumenten | Artikel, Instrument, Regeling |
| Apparaatsuitgaven | Artikel, Detail |
| Inkoopuitgaven | Categorie, Staffel |
| Provinciale subsidieregisters | Provincie, Omschrijving |
| Gemeentelijke subsidieregisters | Gemeente, Omschrijving |
| Publiek | Organisatie |
| Integraal | Modules |

**Files updated:** All wireframes (01-06), search-requirements.md

### Brand Identity (2026-01-23) ⭐ NEW

**Source:** `02-requirements/brand-identity.md` (converted from brand book PNG)

| Category | Details |
|----------|---------|
| **Fonts** | Brawler (headings), IBM Plex Sans Condensed (body) |
| **Primary Pink** | #E62D75 |
| **Navy Dark** | #0E3261 |
| **Navy Medium** | #436FA3 |
| **Status Colors** | Green #85C97D, Yellow #FFC857, Red #E30101 |

**Rule (added to CLAUDE.md):** Brand identity is **leading** for all design work. All wireframes updated with correct brand colors.

### Data Migration Completed (2026-01-23) ⭐ NEW

| Table | Rows Imported |
|-------|---------------|
| instrumenten | 674,826 |
| apparaat | 21,315 |
| inkoop | 635,866 |
| provincie | 67,456 |
| gemeente | 126,377 |
| publiek | 115,020 |
| universal_search | 451,445 (materialized view, after entity resolution) |
| **Total** | **~1.6 million source rows + 451K aggregated** |

**Scripts created:**
- `scripts/data/transform-csv-headers.py` - CSV transformation (NULL handling, UTF-8)
- `scripts/data/import-to-supabase.sh` - psql import with encoding
- `scripts/sql/003-source-column-triggers.sql` - Auto-populate source on INSERT
- `scripts/sql/004-universal-search-materialized-view.sql` - Cross-module aggregation

**Documentation:** `scripts/sql/DATABASE-DOCUMENTATION.md`, `scripts/data/DATA-MIGRATION-README.md`

### Year Columns & Amount Format (2026-01-23) ⭐ NEW

| Decision | Outcome |
|----------|---------|
| Year column behavior | Collapse older years: `2016-20 [▶]` + 2021-2025 visible |
| Expand behavior | Click `[▶]` shows all 10 years, horizontal scroll |
| Partial data indicator | Asterisk `2025*` with tooltip from `data_freshness` table |
| Amount format | **Absolute euros** (no ×1000 notation) |
| Large numbers | Smaller font (12px) when amount >10 characters |
| Year range | **Dynamic** - only show years with data (no 2025 until imported) |

**Rationale:** 10 years of data (2016-2025) doesn't fit on screen. Collapsing older years preserves trend analysis while managing space.

### Amount Units Per Table (2026-01-23) ⭐ NEW

| Table | Unit |
|-------|------|
| instrumenten | ×1000 (source data in thousands) |
| apparaat | ×1000 (source data in thousands) |
| inkoop, provincie, gemeente, publiek | Absolute euros |
| **universal_search** | **All absolute euros** (materialized view converts) |

**Important:** When querying instrumenten directly, multiply bedrag by 1000 for absolute euros.

### UI/UX Decisions (2026-01-19)

**Wireframe Decisions (for NEW features):**
| Decision | Outcome |
|----------|---------|
| Default view | Random recipients with amounts in 4+ years |
| Filter application | Real-time (no Apply button) |
| Row expansion | ▶ expands to show line items inline |
| Column customization | User selects, saved per user |
| Mobile table | Horizontal scroll, fixed first column |

### Architecture Decisions (2026-01-14)

**ADR-001 to ADR-007:** Technology stack, migration strategy, search engine, AI strategy, agent orchestration, visualization, analytics layer

### V2.0 Research Mode Decisions (2026-01-19)

**ADR-008 to ADR-012:** IBOS domain classification, domain-first entry point, wetten.overheid.nl integration, advanced visualizations, V3.0 data requirements

### Product Decisions
- **V1.0 Timeline:** 8 weeks (Tech port + new search)
- **V2.0 Timeline:** +12 weeks (Research Mode)
- **Pricing:** €150/month or €1,500/year
- **Export limit:** 500 rows (always)
- **Auth:** Magic Link only (no social login)

---

## Pending Decisions

### Important (Not Blocking)
- ~~**Wireframe review** - Batch 1 ready for approval~~ ✅ **Completed 2026-01-23**

### Chart Library Decision ✅ **RESOLVED 2026-01-26**

**Decision:** Use Recharts instead of Tremor

| Aspect | Recharts | Tremor | Winner |
|--------|----------|--------|--------|
| React 19 Compatible | ✅ Yes | ❌ No | Recharts |
| Bundle Size | 50KB | 95KB | Recharts |
| Line/Bar/Area Charts | ✅ | ✅ | Tie |
| Sankey (V2.0) | ✅ | ✅ | Tie |
| Treemap (V2.0) | ❌ | ✅ | Tremor |
| Heatmap (V2.0) | ❌ | ✅ | Tremor |
| **Decision Rationale** | Must support React 19; Tremor incompatible. Add Nivo selectively for V2.0 treemap/heatmap. |

**Details:** See `docs/plans/2026-01-26-chart-library-evaluation.md`

**Impact:**
- V1.0: Switch Tremor → Recharts (2-4 hours, Week 2)
- V2.0: Add Nivo for advanced viz when needed (deferred, no impact on timeline)

### Resolved (2026-01-24)
- **Apparaat Typesense Search:** ✅ Include in global search
  - Primary search field: `kostensoort` (weight: 100)
  - Secondary search field: `begrotingsnaam` (weight: 50)
  - Table shows Kostensoort as first column (replaces Ontvanger)
  - Same expandable row pattern, grouping by Begrotingsnaam/Artikel/Detail
  - **See:** `docs/plans/2026-01-24-apparaat-typesense-search-design.md`

---

## Blockers

**None.** Batch 1 complete, ready for Batch 2.

---

## Quick Links

### Wireframes ⭐ NEW
- [01-Main Search Page](../05-v1-design/wireframes/01-main-search-page.md)
- [02-Header/Navigation](../05-v1-design/wireframes/02-header-navigation.md)
- [03-Search Bar](../05-v1-design/wireframes/03-search-bar-autocomplete.md)
- [04-Filter Panel](../05-v1-design/wireframes/04-filter-panel.md)
- [05-Results Table](../05-v1-design/wireframes/05-results-table.md)
- [06-Detail Page](../05-v1-design/wireframes/06-detail-page.md)

### Design Documents
- [V2.0 Research Mode Design](../docs/plans/2026-01-19-v2-research-mode-design.md)
- [Search Requirements](../02-requirements/search-requirements.md)
- [Architecture Impact Analysis](../04-target-architecture/architecture-impact-analysis.md)

### Architecture
- [Recommended Tech Stack](../04-target-architecture/RECOMMENDED-TECH-STACK.md)
- [ADR-013: Search & Semantic Architecture](../08-decisions/ADR-013-search-semantic-architecture.md) ⭐ NEW

### Current State
- [V1.0 Port Specification](../03-wordpress-baseline/v1-port-specification.md) ⭐ NEW
- [Current UI Overview](../03-wordpress-baseline/current-ui-overview.md)
- [Database Analysis](../03-wordpress-baseline/database-analysis-summary.md)
- [Web Archives](../03-wordpress-baseline/web-archives/) - 18 HTML pages

---

## Next Steps (Priority Order)

### Completed This Session ✅

1. ~~Receive web archives~~ - 18 HTML pages received
2. ~~Document port requirements~~ - `v1-port-specification.md` created
3. ~~Architecture decisions~~ - ADR-013, ADR-014 created
4. ~~Project overview docs~~ - All 4 files updated
5. ~~Sprint planning~~ - `09-timelines/v1-sprint-plan.md` created
6. ~~Auth decision~~ - Magic Link (passwordless)

### Week 1 In Progress ✅

**Pre-Sprint: Account Setup (Day 0)** - COMPLETED

| Task | Action | Status |
|------|--------|--------|
| Create Supabase account | https://supabase.com → EU region | ✅ Completed |
| Create Railway account | https://railway.app | ✅ Completed |
| Deploy Typesense | Docker on Railway | ✅ Completed |
| Execute database schema | 8 tables, indexes, RLS | ✅ Completed |

**Week 1 Progress (Day 1-2: Supabase Setup) - COMPLETED**

| Task | Status |
|------|--------|
| Create database schema | ✅ `001-initial-schema.sql` executed |
| Enable PostGIS extension | ✅ For geometry types |
| Enable pgvector extension | ✅ For V2.0 readiness |
| Set up Row Level Security | ✅ All tables protected |

**Week 1 Progress (Day 3-4: Data Migration) - COMPLETED 2026-01-23**

| Task | Status |
|------|--------|
| Export MySQL data | ✅ CSV export via PhpMyAdmin |
| Transform CSV files | ✅ Python script handles headers, NULL, UTF-8 |
| Import to Supabase | ✅ psql with UTF-8 encoding |
| Create triggers | ✅ Source column auto-population |
| Create materialized view | ✅ Universal search with absolute euros |
| Document everything | ✅ DATABASE-DOCUMENTATION.md, DATA-MIGRATION-README.md |

**Week 1 (Day 5-6: Typesense Setup) - COMPLETED 2026-01-23**

| Task | Status |
|------|--------|
| Deploy Typesense on Railway | ✅ Template deployment |
| Create search collections | ✅ 7 collections created |
| Build initial index (Supabase → Typesense sync) | ✅ 466,827 recipients indexed |
| Test search <100ms | ✅ <25ms achieved |

**Week 1 (Day 7: Next.js Setup) - COMPLETED 2026-01-24**

| Task | Status |
|------|--------|
| Create Next.js app | ✅ Done |
| Install dependencies | ✅ Done (Supabase, Typesense, TanStack, shadcn/ui) |
| Deploy to Railway | ✅ Done (`rijksuitgaven-production.up.railway.app`) |

**Note:** Tremor skipped (React 19 incompatible). Decision made 2026-01-26: Switch to Recharts (React 19 compatible, lower bundle).

**WEEK 1 COMPLETE.**

### Week 2 Progress (Backend API + Data Layer) - COMPLETED 2026-01-26

| Task | Status |
|------|--------|
| FastAPI setup | ✅ Deployed to Railway |
| Base endpoints | ✅ All 7 modules working |
| Query parameters | ✅ filters, sort, pagination |
| Aggregation queries | ✅ Materialized views (100x faster) |
| Expandable row data | ✅ Details endpoint working |
| Performance test | ✅ <500ms (except inkoop/integraal - backlogged) |

**Performance Results (after all optimizations):**
| Module | Basic Query | Search | Status |
|--------|-------------|--------|--------|
| instrumenten | 114-204ms | 237ms | ✅ |
| apparaat | 172ms | 215ms | ✅ |
| inkoop | 180-480ms | 175-312ms | ✅ |
| provincie | 196ms | 228ms | ✅ |
| gemeente | 191ms | 598ms | ✅ |
| publiek | 222ms | 247ms | ✅ |
| integraal | 190-380ms | 181-226ms | ✅ |

**WEEK 2 COMPLETE.** Next: Week 3 - Core UI Components

See full sprint plan: `09-timelines/v1-sprint-plan.md`

---

## Notes

### User Preferences
- **Communication:** English
- **Approach:** Stay factual, ask 3+ questions when unclear, don't invent
- **Mobile:** Secondary priority for V1.0

### Working Rules (Added Today)
- Mandatory documentation reading before tasks (in CLAUDE.md)
- Each command has required reading list

### Data Migration Status (Supabase)

**ADR-014:** Using source tables only (no pivot tables). Data migrated 2026-01-23.

| Table | Rows | Status |
|-------|------|--------|
| instrumenten | 674,826 | ✅ Migrated |
| apparaat | 21,315 | ✅ Migrated |
| inkoop | 635,866 | ✅ Migrated |
| provincie | 67,456 | ✅ Migrated |
| gemeente | 126,377 | ✅ Migrated |
| publiek | 115,020 | ✅ Migrated |
| universal_search | 451,445 | ✅ Materialized view (entity resolution applied) |
| **Total** | **~1.6M source + 451K aggregated** | ✅ Complete |

### Key Context
- **V1.0 = Single-View Architecture + New Features** (not 1:1 port)
- **NO two-view toggle** - single smart view with on-the-fly aggregation
- **Source tables only** - no pivot tables (7 tables instead of 20+)
- Year columns always visible for trend analysis
- Expandable rows with user-selectable grouping
- Export limit: 500 rows always

---

**Previous Sessions:**
- 2026-01-19 - V2.0 design + Batch 1 wireframes
- 2026-01-20 - V1.0 scope change, sprint planning
- 2026-01-21 - PM audit, UX brainstorm, folder restructure, Supabase setup, Typesense deployed
- 2026-01-23 - Data migration complete (3.1M rows), Typesense sync (466K recipients)

**This Session:** 2026-01-26 - **WEEK 2 COMPLETE.** FastAPI backend deployed, materialized views for performance (100x improvement), all 7 endpoints tested. Year filter Option B (show all years for recipients active in filtered year). Data Update Runbook created. Recharts selected (React 19 compatible). Entity resolution: 15,382 duplicates merged (466,827 → 451,445). Typesense re-synced with 451,445 recipients. **Next:** Week 3 - Core UI Components
