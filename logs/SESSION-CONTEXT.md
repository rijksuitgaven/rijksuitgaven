# Session Context

**Last Updated:** 2026-02-12
**Project Phase:** V1.0 Development
**Current Sprint:** Week 6 - User Auth + Membership (Auth COMPLETE 2026-02-10, Membership COMPLETE 2026-02-11, Landing Page COMPLETE 2026-02-12, user migration remaining)

---

## Product Versioning (UPDATED 2026-02-03)

**Source of truth:** `docs/VERSIONING.md`

| Version | Name | Use Case | Status |
|---------|------|----------|--------|
| **V1** | Search Platform | "Who received money?" | 🔨 Building |
| **V2** | Rijksuitgaven Reporter | "What's in the news about spending?" | 📋 Planned |
| **V3** | Theme Discovery | "What's happening in defensie?" | 📋 Planned |
| **V4** | Inzichten (Self-Service BI) | "Show me trends and anomalies" | 📋 Planned |
| **V5** | AI Research Mode | "Help me investigate this" | 📋 Planned |
| **V6** | Research Workspace | "Build a case, share with team" | 📋 Planned |
| **V7** | External Integrations | "What law governs this?" | 📋 Planned |
| **V8** | Network Analysis | "Who runs these organizations?" | 📋 Planned |
| **V9** | European Platform | "Compare NL with Germany" | 📋 Planned |

**Version scheme:** X.0 = Major (new capability) | X.Y = Minor (improvements) | X.Y.Z = Patch (fixes)

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
- ✅ **Mini Sprint COMPLETE** (2026-02-06): All Week 3-5 deliverables done
- ✅ **2026-02-08:** 11 sessions — docs audit, auth requirements, data validation, UX-019/020/021/022, filter audit, 2 code audits (55+7 fixes), security hardening, betalingen column+filter, expanded row fix
- ✅ **2026-02-09:** UX-023 GroupingSelect + autocomplete perf + Typesense enrichment + UX-024 type-ahead req (V1.1) + UX-025 feedback button req (V1.0) + beta newsletter + marketing folder + GitHub Projects eval (V1.2)
- ✅ **2026-02-10:** Week 6 Auth — Magic Link authentication fully implemented and deployed. Supabase Auth + PKCE, Resend SMTP, middleware + BFF guards, login/logout/profile pages, X-BFF-Secret backend protection. **Critical cookie fix:** server-side Set-Cookie headers in Next.js 16 cleared auth cookies — switched to fully client-side PKCE exchange, removed getUser() from layout, made server.ts setAll() no-op. End-to-end tested on production.
- ✅ **2026-02-11:** Membership management system — subscriptions table, computed status from dates (no cron), grace periods (3d monthly / 14d yearly), `/team` admin dashboard, `/team/leden` member management, `/verlopen` expired page, subscription banner, profile page with plan info. UX-026 profile dropdown completed. SQL migration + env vars configured on production.
- ✅ **2026-02-11 (Session 3):** Branded email templates (magic link + invite user) configured in Supabase. UX-025 Feedback button with element marking — Suggestie/Bug/Vraag categories, Feedbucket-style element highlighting, Resend email delivery with screenshot attachment. 5 iterations to polish UX.
- ✅ **2026-02-11 (Session 4):** Feedback management system at `/team/feedback` (admin inbox, status workflow, categories). Dashboard redesign (Proposal B — consistent section cards). Invite flow with status lifecycle (Aangemaakt → Uitgenodigd → Actief), `invited_at` column, per-row invite/resend buttons, fallback to generateLink+Resend for existing users. Trial role (14 days, 0 grace), role dropdown (Member/Trial/Admin) in both forms, ESC to close modal. Migrations 031, 033, 034 executed.
- ✅ **2026-02-12 (Session 5):** UX-027 Post-login landing page (Module Hub) — 6+ design iterations: Ontvangers/Kosten grouping, euro totals, user-specified titles. Formal Dutch (u/uw) enforced across entire frontend. Login security: email enumeration prevention (OWASP). activated_at tracking (migration 035, /me/activate endpoint). Profile logout button restyle. 6 commits.
- ✅ **2026-02-12 (Session 6):** V1.0 scope review + planning. Branded email templates confirmed complete. Moved exact phrase search + wildcard syntax from V1.1 → V1.0. Decision: Resend Broadcasts replaces WordPress/Mailster (kill `nieuws.rijksuitgaven.nl`). Decision: `contacts` table as lightweight CRM (prospect/subscriber/churned) with `/team/contacten` admin UI + Resend Audience sync. Documentation audit: 4 gaps fixed (FRONTEND-DOCUMENTATION, DATABASE-DOCUMENTATION).
- ✅ **2026-02-13 (Session 1):** UX-028 Contacts Management — full-stack implementation. SQL migration (036-contacts.sql), CRUD API routes (GET/POST/PATCH/DELETE), Resend Audience sync helper, `/team/contacten` admin page with sortable table, add/edit/delete modals, type badges (prospect/subscriber/churned), stats bar, semi-automatic type transitions (subscription link → subscriber). TeamNav updated with Contacten tab. **Migration not yet executed on production.**
- ⏳ **User migration** — ~50 WordPress users to import to Supabase
- ⏳ **V1 Feature Close Review** — check backlog and sprints

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

## Recent Work (Last 5 Files)

1. **app/src/app/team/contacten/page.tsx** ⭐ CREATED (2026-02-13)
   Contacts management admin page — sortable table, add/edit/delete modals, type badges

2. **app/src/app/api/v1/team/contacten/route.ts** ⭐ CREATED (2026-02-13)
   Contact CRUD API — GET (list all) + POST (create with duplicate check + Resend sync)

3. **app/src/app/api/v1/team/contacten/[id]/route.ts** ⭐ CREATED (2026-02-13)
   Contact API — PATCH (update + semi-auto type) + DELETE (with Resend cleanup)

4. **app/src/app/api/_lib/resend-audience.ts** ⭐ CREATED (2026-02-13)
   Resend Audience sync helper — create/update/delete contacts in Resend

5. **scripts/sql/036-contacts.sql** ⭐ CREATED (2026-02-13)
   Migration: contacts table with RLS, indexes, trigger — NOT YET EXECUTED

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
- `GET /api/v1/modules/{module}/{value}/grouping-counts` - Grouping field distinct counts ⭐ NEW 2026-02-09
- `POST /api/v1/modules/{module}/filter-options` - Cascading filter options with counts ⭐ NEW 2026-02-08
- `GET /api/v1/search/autocomplete` - Typesense proxy (API key server-side) ⭐ NEW 2026-01-29
- `GET /api/v1/health` - Health check (database + Typesense status)
- `GET /health` - Railway health probe endpoint

### Typesense (Search Engine)

| Property | Value |
|----------|-------|
| Platform | Railway (template deployment) |
| URL | `typesense-production-35ae.up.railway.app` |
| API Key | **In Railway env vars only** (rotated 2026-02-07) |
| Status | ✅ Running |
| Collections | 7 (recipients, instrumenten, inkoop, publiek, gemeente, provincie, apparaat) |
| Performance | <25ms search (target <100ms) |
| Scripts | `scripts/typesense/collections.json`, `scripts/typesense/sync_to_typesense.py` |
| **Sync Docs** | `scripts/typesense/README.md` ← **Use this for re-indexing** |
| **Data Update** | `scripts/data/DATA-UPDATE-RUNBOOK.md` ← **Full data update procedure** |
| **Backend Proxy** | `/api/v1/search/autocomplete` - API key stays server-side |

**Document Counts (verified 2026-02-09, post-data-enrichment):**

| Collection | Documents |
|------------|-----------|
| recipients | 463,731 |
| instrumenten | 674,818 |
| inkoop | 635,862 |
| publiek | 115,019 |
| gemeente | 126,376 |
| provincie | 67,455 |
| apparaat | 9,628 |
| **Total** | **~2.1M** |

**Mandatory Audit:** Sync script now includes automatic audit that compares Typesense counts with PostgreSQL. Sync fails if counts don't match.

### Supabase Connection String (for scripts)

**Setup:** Export `SUPABASE_DB_PASSWORD` from your password manager or Railway dashboard before running scripts.

```
postgresql://postgres.kmdelrgtgglcrupprkqf:$SUPABASE_DB_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
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
| `scripts/sql/011a-random-order-instrumenten.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011b-random-order-apparaat.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011c-random-order-inkoop.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011d-random-order-provincie.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011e-random-order-gemeente.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011f-random-order-publiek.sql` | 2026-01-29 | Supabase |
| `scripts/sql/011g-random-order-universal-search.sql` | 2026-01-29 | Supabase |
| `scripts/sql/010-normalize-module-aggregated-views.sql` | 2026-01-29 | Supabase (all 5 views) |
| `scripts/sql/012-enable-rls-missing-tables.sql` | 2026-01-31 | Supabase |
| `scripts/sql/013-security-hardening.sql` | 2026-01-31 | Supabase |
| `scripts/sql/014a-f-*-default-cols.sql` (6 files) | 2026-01-31 | Supabase |
| `scripts/sql/015a-f-*-years-col.sql` (6 files) | 2026-01-31 | Supabase |
| `scripts/sql/016-instrumenten-add-instrument-col.sql` | 2026-01-31 | Supabase |
| `scripts/sql/018-expand-view-columns.sql` | 2026-01-31 | Supabase |
| `scripts/sql/020-normalize-recipient-indexes.sql` | 2026-02-03 | Supabase |
| `scripts/sql/021-filter-column-indexes.sql` | 2026-02-05 | Supabase |
| `scripts/sql/022-data-availability.sql` | 2026-02-07 | Supabase |
| `scripts/sql/023-fix-amsersfoort-typo.sql` | 2026-02-07 | Supabase |
| `scripts/data/fix-encoding-phase1*.py` (6 scripts) | 2026-02-07 | Local → Supabase |
| `scripts/sql/025-fix-encoding-question-marks.sql` | 2026-02-07 | Supabase (via psql) |
| Additional encoding fixes (÷→ö, √ç→ä, ‚Çè→€, ç→§) | 2026-02-07 | Local → Supabase |
| `REFRESH MATERIALIZED VIEW` (all 7 views) | 2026-02-07 | Supabase |
| `scripts/sql/029-universal-search-record-count.sql` | 2026-02-08 | Supabase |
| `scripts/sql/030-subscriptions.sql` | 2026-02-11 | Supabase |
| `scripts/sql/031-feedback.sql` | 2026-02-11 | Supabase |
| `scripts/sql/033-invited-at.sql` | 2026-02-11 | Supabase |
| `scripts/sql/034-trial-role.sql` | 2026-02-11 | Supabase |
| `scripts/sql/035-activated-at.sql` | 2026-02-12 | Supabase |

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
| Publiek | Organisatie, Regeling, Trefwoorden, Sectoren, Provincie, Staffel, Onderdeel |
| Integraal | Module (cross-module grouping) |

**Note:** Each module has different fields - e.g., Gemeente field exists in Gemeentelijke but not Provinciale.

### V1.0 UX Enhancements (2026-01-21) ⭐ UPDATED

**Source:** UX Brainstorm Sessions with founder

**User research findings:**
- 50% Political staff, 25% Journalists, 25% Researchers
- Core need: "Where does the money go, and does it work?"
- Users think theme-first ("wolf protection"), system is recipient-first
- Users LOVE trends but struggle to spot anomalies in large numbers

| Enhancement | Decision | Status |
|-------------|----------|--------|
| **Enhanced autocomplete** | Index Omschrijving, Regeling, Beleidsterrein; show keyword matches | ✅ Done |
| **Cross-module indicator** | "Ook in: Instrumenten, Publiek" on recipient rows | ✅ Done |
| **Prominent expanded context** | Regeling as headline, breadcrumb hierarchy | ✅ Done |
| **URL sharing** | Search + key filters preserved | ✅ Done |
| **Trend anomaly indicator** | Red highlight for 50%+ year-over-year changes (raised from 10% on 2026-02-07) | ✅ Done |
| **Cross-module search results** | Always show "Ook in:" with counts above table | ✅ Done |
| **Integraal as landing** | Move Integraal tab to first position | ✅ Done |

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

### Overzicht Page (2026-01-20) → DEFERRED TO V5 (2026-02-06)

~~Dedicated overview page showing module-level totals with year columns.~~

**Decision (2026-02-06):** Deferred to V5 (AI Research Mode).

**Rationale:**
- V1 expanded row covers functional need (groupings, year breakdown, Google link)
- Full "Recipient Profile Panel" becomes essential in V5 when AI needs context
- Will be built as slide-out panel for AI Research Mode

**See:** `02-requirements/backlog.md` for full analysis

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

### Cookie Banner & Privacy Policy (2026-01-27) ⭐ NEW

**Approach:** Essential cookies only = simple disclosure (no consent mechanism needed).

| Decision | Outcome |
|----------|---------|
| Cookie banner | Simple bottom bar, non-blocking |
| Consent mechanism | None (essential cookies exempt under GDPR) |
| Privacy policy | Merged with cookie policy into single page |
| URL structure | `/privacybeleid` (Dutch), `/cookiebeleid` redirects |
| Google Fonts | Self-hosted via next/font (no external requests) |
| Analytics | Not in V1.0 (deferred to backlog) |
| Persistence | localStorage (never re-displays after dismissed) |

**Text:** "Deze website gebruikt alleen noodzakelijke cookies voor het functioneren van de site."

**Files:**
- `docs/plans/2026-01-27-cookie-banner-design.md` - Component design
- `content/privacybeleid.md` - Privacy policy content (10 articles, Dutch)

**Note:** When analytics is added (V1.1+), replace simple banner with proper consent mechanism.

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
- **V1.0 Timeline:** 9 weeks (was 8, added UX/UI optimization sprint)
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

**WEEK 2 COMPLETE.**

### Week 3 Progress (Core UI Components) - COMPLETED 2026-01-26

| Task | Status |
|------|--------|
| DataTable component | ✅ TanStack Table, year columns, trend anomaly indicator |
| Expandable rows | ✅ Grouping selector, cross-module indicator, lazy loading |
| Filter panel | ✅ Debounced search, year/amount filters, URL state sync |
| Real-time filtering | ✅ 300ms debounce, Suspense boundaries |

**Components created:**
- `app/src/components/data-table/data-table.tsx`
- `app/src/components/data-table/expanded-row.tsx`
- `app/src/components/filter-panel/filter-panel.tsx`

**WEEK 3 COMPLETE.**

### Week 4 Progress (Module Pages) - COMPLETED 2026-01-26

| Task | Status |
|------|--------|
| All 6 module pages | ✅ Using reusable ModulePage component |
| Integraal page | ✅ Cross-module search |
| Consistent styling | ✅ Brand colors, shadcn/ui theme |
| Mobile-friendly tables | ✅ Sticky columns on horizontal scroll |

**Components created:**
- `app/src/components/module-page/module-page.tsx` - Reusable template
- All 7 module pages (5 lines each)

**WEEK 4 COMPLETE.**

### Week 5 Progress (Search + Navigation) - COMPLETED 2026-01-26

| Task | Status |
|------|--------|
| Global search bar | ✅ Typesense autocomplete, <50ms |
| Header navigation | ✅ Modules dropdown, mobile menu |
| URL sharing | ✅ Search + filter state preserved |
| CSV export | ✅ Max 500 rows, Dutch format |
| Remove duplicate headers | ✅ Global header in layout.tsx |

**Components created:**
- `app/src/components/search-bar/search-bar.tsx` - Typesense autocomplete
- `app/src/components/header/header.tsx` - Global navigation
- Updated `data-table.tsx` with CSV export

**WEEK 5 COMPLETE.** Next: Week 6 - User Auth

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
- 2026-01-26 - Weeks 3, 4 & 5 complete, UX enhancements, search requirements audit
- 2026-01-29 - Mini sprint: Code review & security fixes (12 sessions, 66 commits)
- 2026-01-30 - Versioning structure V1-V7, Rijksnetwerken (V6), infrastructure review

**Last Session:** 2026-02-13 - **UX-028 Contacts Management — full-stack implementation (SQL + API + admin page + Resend sync)**

**2026-02-08 Summary:** Sessions 1-9: Docs audit, auth requirements, data validation (EUR 1.77T verified), UX-019/020/021, cascading filters, filter audit, full-stack code audit (55 fixes), deep security audit (7 fixes). Session 10: UX-022 Betalingen column + bracket filter for integraal (full-stack: SQL migration, backend, frontend). Session 11: Fixed expanded row column misalignment when searching.

**2026-02-07 Summary:** Sessions 1-4: Data availability indicators (UX-012), totals row em-dash, expand row on click, slash encoding fix, staffelbedrag popover (UX-013), anomaly threshold 50%, instant tooltips, integraal navigation. Session 5: Major encoding cleanup across all 6 tables - fixed double-encoded UTF-8 (~4,400 rows), triple-encoded inkoop (~400 rows), question mark corruption (~500 rows), plus miscellaneous fixes (÷→ö, √ç→ä, ‚Çè→€, ç→§). All 7 materialized views refreshed.

**Mini Sprint Summary (2026-01-29 → 2026-02-06):** All UI/UX polish tasks complete. Ready for Week 6 (Auth).

**2026-02-06 Sessions (14 commits):**
- Sessions 1-3: UX-010 Google search link, Overzichtspagina deferred to V5, Header logo hybrid
- Session 4: Code audit fixes (security, error handling, accessibility)
- Session 5: Module-specific footer text (Inkoop/Publiek staffelbedragen) - UX-011
- Session 6: Site-wide footer component (3-column, auth-aware)
- Session 7: Bug fixes (totals row overflow, Inloggen link styling)
- Session 8: Documentation audit, Data Availability Indicators design approved

**Mini Sprint Status:** UI/UX Polish COMPLETE - Ready for Week 6 (Auth)

**2026-02-05 Sessions:**
- Session 1: UX-003 Mobile message banner - friendly message for users on small screens
- Session 2: Filter Performance Investigation - B-tree indexes on 17 filter columns (70% faster)
- Session 3: Documentation audit + Rule 6 (no feature removal without approval)

**2026-02-04 Sessions:**
- Session 1: UX-007 Hyperlinks feature - clickable extra columns and expanded row values
- Session 2: UX-008 Hard navigation - module menu clicks reset filters and reload page
- Session 3: Documentation audit - identified gaps, added PM rules to CLAUDE.md, updated requirements

**Estimated Project Total:** ~73 hours across 15 working days (since 2026-01-14)

**Previous (2026-02-03):**
- Sessions 1-2: V2 Reporter design + V3 Theme Classification documentation
- Sessions 3-6: Expanded Row UX, column alignment, Details API performance, trend indicator fix
- Sessions 7-11: Autocomplete regression fix, smart matching (exact vs prefix), visual simplification, field match click fix, instant tooltips
- Sessions 12-14: Totals Row implementation, Search performance optimization (parallel queries 750ms → ~200ms), Query tuning attempt (reverted)

**Session 7 (Autocomplete Dropdown Regression):**
- Fixed dropdown not appearing when typing "eff"
- Root cause: Only fetching 25 results before word-boundary filtering discarded ~80%
- Solution: Increased Typesense per_page to 100

**Session 8 (Smart Autocomplete):**
- Added match_type classification: "exact" (word-boundary) vs "prefix"
- Fixed inkoop 500 error (simplified regex fallback)
- Fixed hasUserTypedRef timing issue

**Session 9 (Visual Simplification):**
- Removed muted styling for prefix matches (ranking alone is sufficient)

**Session 10 (Field Match Click Fix):**
- Fixed: clicking "OOK GEVONDEN IN" items now applies as filter, not text search
- Before: put regeling name in search → 0 results
- After: applies `regeling: ["value"]` filter → shows recipients

**Session 11 (Instant Tooltips):**
- CSS-only tooltips replacing native title (~500ms delay → instant)
- Fixed overflow clipping by positioning above text + moving to parent wrappers

**CLAUDE.md Updated:** Model selection now MANDATORY with user approval (cost control)

**CRITICAL Security Fixes:**
- Typesense API key moved to backend proxy (`/api/v1/search/autocomplete`)
- XSS risk in CSV filename sanitized
- SQL identifier validation whitelist (prevents SQL injection via sort_by/filter fields)
- Error messages now generic (internals logged server-side only)
- Debug logging removed from production

**HIGH Priority Fixes:**
- TypeScript: Added `ApiDetailRow` interface, removed all `any` types
- AbortController: Added to detail-panel, expanded-row, module-page (prevents race conditions)
- useMemo: Wrapped `allResults` (search-bar), `moduleFilters` (filter-panel), fixed `onRowClick` dependency
- Cookie banner: Fixed SSR pattern with proper null state
- Accessibility: Added `role="combobox"`, `aria-controls`, `aria-autocomplete` to search input

**MEDIUM Priority Fixes:**
- Created `lib/constants.ts` - shared MODULE_LABELS, FIELD_LABELS, ALL_MODULES (was duplicated in 4 files)
- Bug fix: `cross-module-results.tsx` using wrong API field (`data.pagination?.totalRows` → `data.meta?.total`)
- Cleanup: Removed 5 unused imports across components

**LOW Priority Fixes (delegated to Sonnet):**
- Named constants for magic numbers (ANOMALY_THRESHOLD_PERCENT, FILTER_DEBOUNCE_MS, etc.)
- JSDoc comments on all exported functions/components
- Code style improvements

**UX-002 Randomization:**
- Default view now randomized: `sort_by=random`, `min_years=4`
- Pre-computed `random_order` column in all 7 materialized views (~50ms vs 3000ms)
- True randomization: `WHERE random_order > threshold` for different results each request
- Display: "Random resultaten" instead of count

**Bug Fixes:**
- Search not filtering: frontend `search` param → backend `q` param
- pgbouncer prepared statements: disabled `statement_cache_size` for transaction mode
- YoY calculation: Added `Number.isFinite()` validation

**Features:**
- Multi-select filters for Provincie (10 options) and Gemeente (13 options)
- Backend endpoint: `GET /api/v1/modules/{module}/filters/{field}` for dropdown options
- Search dropdown reorder: Ontvangers before Zoektermen

**Created Files:**
- `app/src/lib/constants.ts` - Shared constants
- `backend/app/api/v1/search.py` - Typesense proxy endpoint
- `app/src/lib/api-config.ts` - Centralized API base URL
- `.claude/commands/document.md` - /document skill

**Module Filter Enhancements (Session 5):**
- Reordered all filters: module-specific first, Bedrag bereik last
- New filter fields: Artikelonderdeel, Instrument (Instrumenten), Detail (Apparaat), Staffel (Inkoop)
- Multi-select Organisatie for Publiek: COA, NWO, RVO, ZonMW
- Integraal filters: Modules per ontvanger (multiselect), Instanties per ontvanger (dropdown 2+/3+/5+/10+)
- Added `select` filter type for predefined dropdown options
- Bug fix: get_filter_options() now handles numeric columns (staffel INTEGER)
- All filters deployed and tested on production ✅

**Complete Filter Configuration (updated 2026-02-08 — UX-021 cascading filters):**

| Module | Cascading Filters | Other Filters |
|--------|-------------------|---------------|
| Instrumenten | Begrotingsnaam, Artikel, Artikelonderdeel, Instrument, Regeling | Bedrag bereik |
| Apparaat | Begrotingsnaam, Artikel, Detail, Kostensoort | Bedrag bereik |
| Inkoop | Ministerie, Categorie, Staffel | Bedrag bereik |
| Provincie | Provincie, Omschrijving | Bedrag bereik |
| Gemeente | Gemeente, Beleidsterrein, Regeling, Omschrijving | Bedrag bereik |
| Publiek | Organisatie, Regeling (RVO/COA), Trefwoorden (RVO), Sectoren (RVO), Provincie (RVO), Onderdeel (NWO), Staffel (COA) | Bedrag bereik |
| Integraal | *(no cascading)* | Modules per ontvanger, Betalingen per ontvanger (1/2-10/11-50/50+), Bedrag bereik |

**Search Bar Consolidation (Session 6):**
- Merged two search bars into one (was: header + filter panel, now: filter panel only)
- Filter panel now has full autocomplete with Ontvangers + Zoektermen sections
- Clickable "Ook in" module badges navigate to `/module?q=search`
- Keyboard navigation (arrows, Enter, Escape)
- URL parameter support (`?q=ProRail`)
- Design document: `docs/plans/2026-01-29-search-bar-consolidation.md`

**Autocomplete UX Redesign (Session 7):**
- Redesigned autocomplete to follow industry standard "what you see is what you get" principle
- Two-section dropdown: "Ontvangers in [Module]" (with amounts) + "Ook in andere modules" (with badges)
- New backend endpoint: `GET /api/v1/modules/{module}/autocomplete`
- Searches current module first (PostgreSQL), shows other modules as secondary
- Bug fixes: current module filtered from badges, Enter closes dropdown
- Removed confusing "/" shortcut tip

**Brand Assets Distribution (Session 8):**
- Established workflow: founder drops assets in `assets/brand/`, Claude distributes
- Favicon: `icon.svg` (auto-detected by Next.js App Router)
- Apple touch icon: `apple-icon.png` (180×180, resized from source)
- Logos: `logo.png` (full logo), `logo-white.png` (icon only for dark backgrounds)
- Header updated to show logo icon + text (icon only on mobile)
- Cleaned up default Next.js placeholder assets

**Search Relevance Ranking (Session 9):**
- Implemented relevance-based ranking: exact > starts with > word boundary > contains
- Amount tiebreaker within each relevance tier
- Design document: `docs/plans/2026-01-29-search-relevance-ranking.md`
- Bug fixes: random sort override, asyncpg count_params mismatch
- Backlog: "Search on Other Fields" (Regeling/Omschrijving matches) - deferred to UI/UX sprint
- Deployed & tested: "politie" now shows exact matches first ✅

**UI Cleanup (Session 9):**
- Removed "Alle jaren" dropdown from filter panel (redundant - year columns visible in table)

**Entity Resolution: Module Views (Session 10):**
- Extended `normalize_recipient()` to all module aggregated views (previously only universal_search)
- Problem: "politie", "Politie", "POLITIE" appeared as separate rows in instrumenten
- Solution: GROUP BY normalize_recipient(primary_field) + first-letter capitalization for display
- Script: `scripts/sql/010-normalize-module-aggregated-views.sql`
- Status: ✅ ALL COMPLETE (instrumenten, inkoop, provincie, gemeente, publiek)
- apparaat not needed (uses kostensoort category, not recipient names)

**Semantic Search V1.1 COMPLETE (Session 10):**
- Problem: "politie" (police) matches "Politieke" (political) - different domains
- **V1.1a COMPLETE:**
  - Dutch word rules: `build_search_condition()` helper excludes -ie/-iek false cognates
  - Option C ranking: Exact match first, then everything else by totaal (biggest money flows)
  - Applied to all 6 search locations ✅
  - Deployed & tested: "politie" shows Politie first, then Nationale Politie (€17.2B) near top ✅
- **V1.1b Roadmap:** Embeddings (Cohere embed-multilingual-v3, ~€1/month)
- Design document: `docs/plans/2026-01-29-semantic-search-design.md`

**Visual Refresh COMPLETE (Session 11):**
- Header redesign: 2-row compact layout (~100px), grouped tabs with gaps
- Full module names: Financiële instrumenten, Provinciale subsidieregisters, etc.
- Page background: White → #E1EAF2 (Gray Light)
- Table header: Navy #0E3261, rounded corners (pill shape), 14px semibold
- Year columns: Right-aligned (header + data cells)
- Totaal column: Bold + #D0DEEA background tint
- Logo fix: `logo-icon.png` for white header background
- Module pages: Gradient background + white content card
- Design document: `docs/plans/2026-01-29-visual-refresh-design.md`
- Build verified ✅, Deployed ✅

**Final Code Review Fixes (Session 12):**
- CRITICAL: CSV injection prevention in detail-panel filename sanitization
- HIGH: Amount validation (NaN check, max limit, console warnings)
- HIGH: Optional chaining in api.ts for defensive coding
- MEDIUM: AbortController in autocomplete prevents race conditions
- MEDIUM: createYearMap() helper for O(1) year lookups
- LOW: ErrorBoundary component + integration in module pages

**Created Files:**
- `app/src/components/error-boundary/error-boundary.tsx`
- `app/src/components/error-boundary/index.ts`

**66 commits** across 12 sessions.

---

**2026-01-30 - ROADMAP & VERSIONING SESSION**

**Focus:** Strategic planning, not coding

**Versioning Structure Established:**
- Clear V1-V7 roadmap with use cases per version
- Version scheme: X.0 = Major, X.Y = Minor, X.Y.Z = Patch
- Rijksnetwerken added as V6 (network analysis for compliance market)

**Documents Created:**
- `docs/VERSIONING.md` - Source of truth for version roadmap
- `docs/PRODUCT-TIERS.md` - Pricing tiers (draft)
- `docs/AUDIENCES.md` - 7 audience segments
- `docs/INFRASTRUCTURE-ROADMAP.md` - YAGNI tracking per version

**Infrastructure Review:**
- V1 infrastructure is production-ready
- No gaps blocking launch
- Future needs (Redis, workers, V2+ tables) tracked for when required

**4 commits** this session.

**2026-01-31 - MINI SPRINT: Supabase Security + UI/UX**

**Supabase Security Hardening:**
- Fixed RLS on `data_freshness` (enabled + public read policy)
- Fixed `spatial_ref_sys` (revoked API access - extension-owned table)
- Fixed 7 functions with mutable search_path (added `SET search_path = public`)
- Revoked direct API access to 7 materialized views (force through FastAPI)
- Accepted: 3 extensions in public schema (migration risk too high)

**UI/UX Improvements:**
- Table toolbar redesign: Results dropdown (25/100/150/250/500) + Kolommen + CSV/XLS top of table
- Footer cleaned up: "Absolute bedragen in €" + pagination only
- Added XLS export (xlsx library) alongside CSV

**Scripts executed:**
- `012-enable-rls-missing-tables.sql`
- `013-security-hardening.sql`

**Dynamic Column Selection (UX-005) - 2026-01-30 Evening:**
- Users can select up to 2 extra columns to display in table
- Columns appear between primary column and year columns
- Backend: MODE() aggregation returns most frequent value per group
- Frontend: Max 2 enforcement, localStorage persistence, export support
- Status: Frontend complete, backend needs Railway deployment

**Dynamic Match Column - 2026-01-30 Session 3:**
- When searching: shows "Match" column with "Field: Value" showing which field matched
- When NOT searching: shows user-selected extra columns (or defaults)
- Backend: `matched_field` and `matched_value` in API response
- Uses SQL CASE expressions to detect which field matched the search

**Autocomplete Field Matches - 2026-01-30 Session 4:**
- Three-section autocomplete: Ontvangers → Ook gevonden in → Ook in andere modules
- Field matches show non-primary search fields (regeling, instrument, etc.)
- Removed column count badge from Kolommen button
- Set proper default columns per module

**Default Columns Per Module:**
| Module | Default Columns |
|--------|-----------------|
| Instrumenten | Artikel, Regeling |
| Apparaat | Artikel, Detail |
| Inkoop | Categorie, Staffel |
| Provincie | Provincie, Omschrijving |
| Gemeente | Gemeente, Omschrijving |
| Publiek | Organisatie |
| Integraal | (none) |

**Pending: Materialized View Speed Fix**
- Default columns cause slower queries (source table aggregation vs materialized views)
- Need to add default columns to materialized views for speed improvement
- User approved, to be done after documentation

**Materialized View Speed Fixes - COMPLETE:**
- ✅ Created 6 migrations for default columns (014a-f)
- ✅ Created 6 migrations for years_with_data column (015a-f)
- ✅ Created migration for instrument column (016)
- ✅ All migrations executed in Supabase
- ✅ Backend deployed to Railway
- ✅ Instrumenten page now loads in ~400-500ms (was 4 seconds)

**Code Audit Fixes - COMPLETE:**
- ✅ Fixed limit validation bug (`le=100` → `le=500`) - dropdown options now work
- ✅ Added FastAPI lifespan handler for proper connection pool shutdown
- ✅ Added AbortController to MultiSelect filter (race condition fix)
- ✅ Fixed abort status check in CrossModuleResults
- ✅ Removed console statements from filter-panel, search-bar, detail-panel
- ✅ Added aria-live and role="status" to all Loader2 components (accessibility)

**2026-01-31 Session 4 - Search Improvements:**

**Word-Boundary Search (Session 3):**
- Changed from substring matching (`ILIKE %x%`) to word-boundary matching (`~* \yx\y`)
- Fixes inflated "Ook in:" counts (e.g., "politie" no longer matches "Designpolitie")
- Design doc: `docs/plans/2026-01-31-word-boundary-search.md`

**Aggregated View Search Expansion (Session 4):**
- Extended WHERE clause to search ALL view columns (ontvanger, artikel, regeling, instrument, begrotingsnaam)
- Searches like "bedrijvenbeleid" now return 95,893 results (was 0)
- Script: `scripts/sql/018-expand-view-columns.sql` executed on production

**"Gevonden in" Column Redesign (Session 4):**
- Separate column when searching (replaces extra columns)
- Line 1: Matched value (e.g., "Bedrijvenbeleid: innovatief en duurzaam ondernemen")
- Line 2: Field name (e.g., "artikel")
- Hybrid lookup function for efficient matchedField/matchedValue retrieval

**Module Page Hydration Fix (Session 4):**
- Fixed duplicate API calls with isHydrated state
- Consolidated column loading useEffects

**Session 6 - "Gevonden in" Column via Typesense (2026-01-31):**

**Problem:** "Gevonden in" column was showing "-" after Session 5 disabled the slow PostgreSQL lookup.

**Solution:** Use Typesense highlight data instead of PostgreSQL LATERAL JOIN.
- Modified `_typesense_get_primary_keys()` → `_typesense_get_primary_keys_with_highlights()`
- Returns both primary keys AND which field matched (for non-primary field matches)
- Populates `matched_field` and `matched_value` directly from Typesense response
- No additional database query needed - info comes from the same Typesense search

**Performance:** Zero additional latency (info extracted from existing Typesense search).

**Behavior:**
- When search matches primary field (ontvanger/leverancier): "Gevonden in" stays empty (match visible in name)
- When search matches non-primary field (regeling, artikel, etc.): Shows matched field and value

**Files Modified:**
- `backend/app/services/modules.py` - New highlight extraction logic

---

## Performance Optimization - COMPLETE

**Before:** ~750ms (sequential queries: main → count → totals)
**After:** ~130-280ms (parallel queries via asyncio.gather)
**Improvement:** ~60-80% faster

### Implemented: Option A - Parallel Query Execution

**Why Option A over Materialized View:**
- No schema changes needed
- Zero infrastructure cost
- Simple code change (asyncio.gather)
- Achieved target performance without complexity

**Implementation (2026-02-03):**
- Both `_get_from_aggregated_view` and `_get_from_source_table` now run queries in parallel
- Main query, count query, and totals query execute simultaneously
- Commit: `ee055a4`

**Test Results (2026-02-03):**
| Module | Search Term | Avg Response |
|--------|-------------|--------------|
| instrumenten | "prorail" | ~283ms |
| inkoop | "heijmans" | ~163ms |
| gemeente | "amsterdam" | ~131ms |
| apparaat | "ict" | ~129ms |
| provincie | "gelderland" | ~131ms |
| publiek | "universiteit" | ~138ms |

**Status:** ✅ Phase 1 COMPLETE - Phase 2 deferred to V1.1

**Query Tuning Attempt (reverted):**
- Tried moving relevance sorting from PostgreSQL to Python
- No performance improvement - regex CASE was already fast on small result sets
- Reverted in commit `79dc334`

**Next Steps:**
1. Mobile message banner (NEXT)
2. Overzicht page (blocks Week 6)
3. V1.1: Typesense data enrichment for <100ms search

---

---

**2026-01-31 Session 8 - Documentation Audit & Bug Fixes:**

**Bug Fixes:**
- ✅ "+X meer" indicator not showing: Added `extra_column_counts` to Pydantic `AggregatedRow` model
- ✅ Row hover missing sticky columns: Used Tailwind `group`/`group-hover` pattern

**Documentation Updates:**
- Fixed search-requirements.md: default columns corrected to 2 (not 3)
- Added UX-002c (Word-Boundary Search), UX-002d ("Gevonden in"), UX-002e ("+X meer" Indicator)
- Fixed FRONTEND-DOCUMENTATION.md: Apparaat columns (Kostensoort is primary, not extra)

**Backlog Updates:**
- Added: Filters UX Review (medium priority)
- Added: Extra Columns Behavior During Search (UX discussion)
- Completed: Search on Other Fields (UX-002d)

**Versioning Update:**
- Added V3 - Inzichten (Self-Service BI) as new major version
- Renumbered: V3-V7 → V4-V8
- Note: Consider brainstorming whether V3 should come before V2

**Commits:**
- Fix: Add extra_column_counts to AggregatedRow model
- Fix: Full row hover including sticky columns

---

**2026-02-01 - Autocomplete UX Fixes + Typesense Data Integrity**

**Session 1: Autocomplete UX Fixes**

**Issues fixed:**
1. "Ontvangers" section missing in autocomplete dropdown
2. Field match styling inconsistent ("in Regeling" → badge "Regeling")
3. Cross-module matching failed for Provincie/Gemeente modules

**Root cause:** Recipients found via global `recipients` collection were showing in "Ook in andere modules" even when they belonged to the current module. Substring matching for module names failed for "Provinciale subsidieregisters" → "provincie".

**Solution:**
- Added `SOURCE_TO_MODULE` mapping to convert display names to module names
- Recipients in current module now correctly show in "Ontvangers" section with amounts
- Field matches now use badge styling consistent with module badges

**Verified all 5 recipient-based modules:** Instrumenten, Provincie, Gemeente, Inkoop, Publiek

**Session 2: Typesense Data Integrity & Audit**

**Issues found:**
1. Instrumenten incomplete: 100K indexed vs 674K actual (LIMIT 100000 in sync script)
2. Apparaat ID collisions: 3,222 indexed vs 9,628 actual (ID generation missing 2 fields)
3. Module badges missing in integraal: API endpoint didn't pass `modules` to Pydantic model

**Fixes:**
- Removed `LIMIT 100000` from instrumenten sync
- Fixed apparaat ID to include all 4 GROUP BY fields
- Added `modules=r.get("modules", [])` to API endpoint

**Mandatory Audit Added:**
- Sync script now runs automatic audit after every sync
- Compares Typesense document counts with PostgreSQL
- Exits with error code if mismatch (prevents incomplete indexes)
- New `--audit-only` flag for verification without syncing

**Documentation Updated:**
- `scripts/typesense/README.md` - Manual sync process
- `scripts/data/DATA-UPDATE-RUNBOOK.md` - Added mandatory audit to Step 5
- `CLAUDE.md` - Added Railway deploy time (~2 min) constraint

**Commits:**
- `3a39965` - Fix autocomplete: show current module recipients + badge styling
- `211dc62` - Fix autocomplete module matching for all modules
- `8593871` - Fix Typesense sync: index all instrumenten records
- `a17d3de` - Fix apparaat Typesense sync: prevent ID collisions
- `e699f09` - Fix: Pass modules field to CurrentModuleResult for integraal badges
- `b60b62e` - Add mandatory audit to Typesense sync script

---

**2026-02-02 - Filter UX Optimization**

**Focus:** Convert all filter fields to searchable multi-select dropdowns

**Filters Converted (text → multiselect):**
- Instrumenten: Begrotingsnaam, Artikel, Artikelonderdeel, Instrument, Regeling
- Apparaat: Begrotingsnaam, Artikel, Detail
- Inkoop: Ministerie, Categorie, Staffel
- Gemeente: Beleidsterrein
- Publiek: Regeling

**MultiSelect Enhancements:**
- Lazy loading: Options fetch when dropdown opens (faster initial render)
- Auto-focus: Search input focuses automatically
- Option count footer: Shows "2,156 opties" to communicate data breadth
- Filtered count: Shows "24 van 2,156 opties" when searching
- Increased height: max-h-72 (288px) for better browsing
- Module change reset: Clears cached options when navigating

**Commits:**
- `5d79727` - Convert all filters to searchable multi-select dropdowns

---

**2026-02-02 Session 2: UX-006 - Advanced Filter Features**

**Feature 1: "GESELECTEERD" section in dropdown**
- Selected items appear at top with "GESELECTEERD" header
- Unselected items below with "ALLE OPTIES" header
- Matches old WordPress system UX

**Feature 2: Auto-show filter columns (max 2)**
- Active filter fields automatically become table columns
- First 2 active filters shown (unlimited filters allowed)
- Column selector hidden when filters control columns
- User's column preference returns when filters cleared

**Bug Fixes:**
- Infinite render loop: Changed useCallback to useMemo for array memoization
- Missing filter API params: Added 11 missing Query parameters to backend
- No results with filters: Include activeFilterColumns in isDefaultView check
- Empty dropdown option: Filter out empty/whitespace strings

**Commits:**
- `09b113f` - UX-006: Auto-show filter columns + GESELECTEERD section
- `5a9f242` - Fix infinite loop: use useMemo for effectiveColumns
- `3e1a5f6` - Add missing filter Query parameters to API endpoint
- `f591f9c` - Fix: Include multiselect filters in isDefaultView check
- `88a139a` - Fix: Filter out empty strings from dropdown options

---

**2026-02-02 Session 3: BFF Proxy Implementation**

**Goal:** Hide FastAPI backend URL from browsers for security.

**Implementation:**
- Created 8 Next.js API routes that proxy to FastAPI backend
- All frontend API calls now go through `/api/v1/...` (relative URLs)
- `BACKEND_API_URL` is server-side only (no `NEXT_PUBLIC_` prefix)

**Security Features:**
- Backend URL hidden from browser DevTools
- Offset capped at 10,000 (prevents scraping)
- Limit capped at 500 (matches dropdown options)
- `sort_by=random` blocked (converted to `totaal`)
- Module name validation (alphabetic only, prevents path traversal)
- 30 second timeout

**Files Created:**
- `app/src/app/api/_lib/proxy.ts` - Shared proxy helper
- `app/src/app/api/v1/modules/route.ts`
- `app/src/app/api/v1/modules/[module]/route.ts`
- `app/src/app/api/v1/modules/[module]/stats/route.ts`
- `app/src/app/api/v1/modules/[module]/autocomplete/route.ts`
- `app/src/app/api/v1/modules/[module]/filters/[field]/route.ts`
- `app/src/app/api/v1/modules/[module]/[value]/details/route.ts`
- `app/src/app/api/v1/search/autocomplete/route.ts`

**Commits:**
- `ff8ddaf` - Add BFF proxy to hide backend URL from browsers
- `f83c843` - Fix: BFF limit cap 100 → 500 to match dropdown options
- `a429fe3` - Docs: Update for BFF proxy implementation
- `7f1e36b` - UX: Change default results to 100, dropdown options 50/100/150/250/500
- `0a760fa` - UX: Default to 50 results (100 requires too much scrolling)

**Pagination Change:**
- Default results per page: 25 → 50 (better for data exploration)
- Dropdown options: 50, 100, 150, 250, 500 (was 25, 100, 150, 250, 500)

---

**2026-02-02 Session 5: Search Relevance & UX Fixes**

**Search Relevance Bug:**
- Search results were not properly sorted by relevance tier
- Root cause: PostgreSQL `\y` word boundary was double-escaped (`\\y` instead of `\y`)
- The pattern `\\ycoa\\y` meant "literal backslash + y" not word boundary
- Fix: Changed to raw f-string `rf"\y{search}\y"` in all 3 search functions
- Result: "Centraal Bureau COA" now ranks higher than "Dienst Justitiële Inrichtingen" (which only has COA in Regeling)

**Inflated "Ook in" Counts:**
- "COA" showed 326 results in Publiek (actual: ~5)
- Root cause: Typesense prefix matching returned "Coaching", "Coach", etc.
- Fix: Added `is_word_boundary_match()` filter to `_typesense_get_primary_keys_with_highlights()`
- Only results where search term appears as complete word are now included

**Dropdown UX on URL Navigation:**
- Clicking "Ook in: Publiek" opened autocomplete dropdown instead of showing table results
- Fix: Added `hasUserTypedRef` to track user typing vs URL pre-fill
- Dropdown only opens when user actively types, not when search is pre-filled from URL

**Commits:**
- `33d5b3a` - Fix: Word boundary regex escaping for relevance sorting
- `4177446` - Fix: Add word boundary filtering to Typesense search results
- `5b4c93a` - UX: Don't auto-open autocomplete dropdown on URL navigation
- `cb264e9` - Fix: Prevent dropdown opening on autocomplete results from URL navigation

---

**2026-02-02 Session 6: Search Tips Popover**

**User Need:** Help users understand the power of the new search (old WordPress search was poor).

**UX Decision:** Exception to "don't explain" rule - users burned by bad search need confidence building.

**Implementation:**
- Info icon button next to search bar (matches Filters button style)
- First-visit pulse animation (pink glow, localStorage persisted)
- Navy popover with pink accent (brand-aligned)
- Dynamic content per module via `MODULE_SEARCH_TEXT`

**Content (Dutch):**
- "SLIM ZOEKEN" header
- Module-specific searchable fields
- 3 examples: single term, multiple words, prefix
- Tip directing to filters

**V1.1 Backlog Added:**
- Exact phrase search (`"rode kruis"`)
- Wildcard syntax (`prorail*`)

**Files Modified:**
- `app/src/components/filter-panel/filter-panel.tsx` - Popover component
- `app/src/app/globals.css` - Pulse animation
- `docs/VERSIONING.md` - V1.1 features

**Commits:**
- `4a9792c` - Docs: Add phrase search and wildcards to V1.1 backlog
- `7dc0c0c` - UX: Add search tips popover with first-visit pulse animation
- `1c552d9` - Fix: Make search tips dynamic per module
- `5e0d37b` - UX: Match info button style to Filters button + simplify tip text

---

**2026-02-02 Session 7: Table Layout & UX Polish**

**Bug Fixes:**
1. Missing collapse button for 2016-20 years - added visible "< 2016-20" header
2. Table too wide with extra columns - added `table-fixed` + optimized column widths
3. Inconsistent font sizes in amounts - all amounts now use `text-xs`
4. Anomaly highlighting too chunky - simplified to subtle bg + `px-2` padding

**Decided Against:**
- Sticky Totaal column - caused layout issues with expanded rows

**Column Width Optimization:**
- Primary: 200 → 160px
- Extra columns: 180 → 140px
- Year columns: 80 → 95px
- Totaal: 100 → 110px

**Commits:** 11 commits (f4c62cb through aba271d)

---

**2026-02-02 Completed Work:**
- ✅ Session 1: Filter multi-select conversion (5 modules)
- ✅ Session 2: GESELECTEERD section + auto-show filter columns (UX-006)
- ✅ Session 3: BFF proxy implementation (8 Next.js API routes)
- ✅ Session 4: Documentation audit + UX tweaks
- ✅ Session 5: Search relevance fixes (word boundary regex + Typesense filtering)
- ✅ Session 6: Search tips popover (first-visit pulse animation)
- ✅ Session 7: Table layout polish (collapse button, table-fixed, consistent text-xs, anomaly styling)
- ✅ Session 8: Process improvement (mandatory model selection in CLAUDE.md)

**Upcoming Work Plan:**

| Day | Focus |
|-----|-------|
| ~~**2026-02-01**~~ | ~~Autocomplete fixes~~ ✅ |
| ~~**2026-02-02**~~ | ~~Filter multi-select + BFF proxy + table polish~~ ✅ |
| ~~**2026-02-03**~~ | ~~Strategic brainstorm: V2 Reporter + V3 Themes documentation~~ ✅ |
| ~~**2026-02-04**~~ | ~~Hyperlinks (clickable filter values)~~ ✅ |
| ~~**2026-02-05**~~ | ~~Mobile message banner + filter performance~~ ✅ |
| ~~**2026-02-06**~~ | ~~UX-010 Google link + Overzichtspagina decision (deferred to V5)~~ ✅ |

**Mini Sprint COMPLETE - Ready for Week 6**

**Week 6 (Next):**
- Week 6 - User Auth (Magic Link, user migration)
- Week 7-9 - Polish and launch
- Beta testing preparation

---

**2026-02-04 - UX-007 CLICKABLE HYPERLINKS**

**Focus:** Make extra column values and expanded row grouped values clickable for drill-down data exploration

**Feature Implemented:**
- Click on extra column values (Artikel, Regeling, etc.) to filter by that value
- Click on expanded row grouped values to filter by that value
- Clear start behavior: clicking clears all existing filters and applies only the clicked filter
- Visual: text turns pink (#E62D75) on hover, cursor pointer, no underline
- All rows collapse when new filtered data loads

**Technical Implementation:**
- Added `onFilterLinkClick` callback prop to DataTable and ExpandedRow components
- Added `handleFilterLinkClick` handler in ModulePage that calls `setFilters()` directly
- Added `useEffect` to reset expanded state when data changes (fixes rows staying expanded)
- Used direct state update instead of router.push() to avoid infinite render loops

**Bug Fixes During Implementation:**
1. Click not working → Changed from router.push() to direct setFilters() call
2. Infinite render loop → Removed URL-to-state sync effect
3. Rows staying expanded → Added useEffect to reset expanded state on data change

**Files Modified:**
- `app/src/components/data-table/data-table.tsx`
- `app/src/components/data-table/expanded-row.tsx`
- `app/src/components/module-page/module-page.tsx`

**Applies to all 6 modules:**
| Module | Clickable Extra Columns |
|--------|------------------------|
| Instrumenten | Artikel, Regeling |
| Apparaat | Artikel, Detail |
| Inkoop | Categorie, Staffel |
| Provincie | Provincie, Omschrijving |
| Gemeente | Gemeente, Omschrijving |
| Publiek | Organisatie |

**Commits:** (pending)
- UX-007: Clickable hyperlinks for extra columns and expanded row values

---

**2026-02-03 - STRATEGIC BRAINSTORM SESSION**

**Session 1: V2 Rijksuitgaven Reporter Design**
- Complete design document with architecture, database schema, processing pipeline
- Roadmap update: V2=Reporter (was Theme Discovery), all versions shifted
- Key decisions: RSS news scanning, Claude Haiku extraction, Resend email delivery
- Cost estimate: ~€10-15/month

**Session 2: V3 Theme Classification Documentation**
- Created documentation structure for V3 work:
  - `docs/reference/` - IBOS domains and field mappings
  - `docs/v3-themes/` - Progress, quality, decisions
  - `scripts/sql/v3-themes/` - Migration guide
- 3 ADRs documented: row-level classification, 6-layer hybrid approach, confidence scores
- Entry point added to VERSIONING.md

**5 commits** this session.
