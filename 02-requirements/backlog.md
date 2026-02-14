# Product Backlog

**Last Updated:** 2026-02-14

Items logged for future versions, not in V1.0 scope.

---

## V1.0 Backlog

### Staffelbedrag Explanation (User Education) (COMPLETED)

**Priority:** Medium (V1.0)
**Added:** 2026-02-06
**Completed:** 2026-02-07
**Status:** ✅ COMPLETED
**Type:** UX / Documentation

**Problem:**
Users unfamiliar with government data may not understand what "staffelbedrag" means. The Inkoop and Publiek (COA) modules show averaged staffel amounts, not precise figures.

**Solution Implemented (UX-013):**
- Info icon (ⓘ) next to footer text on Inkoop and Publiek modules
- Click opens navy popover with staffel range table and explanation (Dutch)
- Word "staffelbedrag(en)" in footer text is also clickable (dotted underline)
- Popover matches search tips pattern (navy dark bg + pink accent bar)
- Content: explanation of midpoint calculation, staffel 1-13 ranges, source reference

**Decision:** Option 1 chosen - info icon with popover explanation, plus clickable word in footer text.

---

### Data Quality: Encoding Corruption Cleanup (COMPLETED)

**Priority:** High (V1.0)
**Added:** 2026-02-07
**Completed:** 2026-02-07
**Status:** ✅ COMPLETED
**Type:** Data Quality / Bug

**Problem:**
Legacy WordPress/MySQL data had encoding corruption from CSV export. Three types: double-encoded UTF-8 (~4,400 rows, e.g., `CafÃ©`), triple-encoded (~400 rows in inkoop), and lost characters replaced with `?` (~500 rows).

**Resolution:** 6 Python scripts (asyncpg parameterized queries) + 1 SQL file (431 explicit UPDATE statements). Additional targeted fixes for division signs (÷→ö), Mac Roman encoding (√ç→ä), euro signs (‚Çè→€), and section sign restoration (ç→§). All 7 materialized views refreshed, Typesense re-synced with audit passed. Scripts preserved at `scripts/data/fix-encoding-phase1*.py` and `scripts/sql/025-fix-encoding-question-marks.sql`.

---

### Data Quality: "Amsersfoort" Typo in Gemeente Data (COMPLETED)

**Priority:** Medium (V1.0)
**Added:** 2026-02-07
**Completed:** 2026-02-07
**Status:** ✅ COMPLETED
**Type:** Data Quality / Bug

**Problem:**
The gemeente table contained "Amsersfoort" (typo) alongside "Amersfoort". 1,168 duplicate rows.

**Resolution:** SQL UPDATE, refreshed materialized views, re-synced Typesense gemeente collection. Migration: `023-fix-amsersfoort-typo.sql`.

---

### Data Availability Indicators (COMPLETED)

**Priority:** High (V1.0)
**Added:** 2026-02-06
**Completed:** 2026-02-07
**Status:** ✅ COMPLETED
**Effort:** 3-5 hours (actual ~2 hours)
**Type:** Feature / UX

**Problem:**
Users cannot distinguish between:
- **Real zero** - Entity received €0 (confirmed data)
- **No data** - Data doesn't exist for this entity/year combination

Example: Gemeente Amersfoort has data for 2020-2024, but not 2016-2019. Currently all show `-` which is ambiguous.

**Solution (Approved Design):**
- `—` (em-dash) for "no data exists"
- `0` for "real zero"
- Tooltip: "Geen data beschikbaar voor deze periode"
- Database table `data_availability` tracks year ranges per entity
- API returns `data_available_from` and `data_available_to` per row

**Design Document:** `docs/plans/2026-02-06-data-availability-indicators-design.md`

**Implementation Steps:**
1. Database: Create `data_availability` table + RLS
2. Backend: Add availability fields to API response
3. Frontend: Update cell rendering logic
4. Expanded rows: Apply same rendering

**Implementation:** Complete (2026-02-07). Migration 022 executed, API verified, deployed to production.

---

### Cascading Filter Performance Optimization

**Priority:** Medium (V1.1)
**Added:** 2026-02-08
**Status:** BACKLOGGED
**Type:** Performance

**Problem:**
Cascading filter option requests (POST `/filter-options`) take 300-500ms per request. Each filter change triggers a new request. With the Begroting filter in instrumenten module (674K rows), loading times can feel slow.

**Current State:**
- 5 parallel queries via `asyncio.gather()` per request
- Each query runs `SELECT DISTINCT field, COUNT(DISTINCT primary) ... GROUP BY ... ORDER BY ...`
- ~300-500ms for instrumenten (largest table), ~100-200ms for smaller modules
- Debounced 200ms to reduce request frequency

**Observed (2026-02-08, local dev):**
- Cold call (first POST, no active filters, instrumenten): **21s** (includes Turbopack compile 701ms + backend 20.3s)
- Warm call (second POST, same params): **6.9s** (compile 4ms + backend 6.9s)
- Production will be faster (no Turbopack compile), but unfiltered instrumenten (674K rows) remains the worst case

**Potential Solutions:**

| Option | Effort | Impact |
|--------|--------|--------|
| **Materialized filter option cache** | 4-8 hours | High — pre-compute options for unfiltered state |
| **Redis cache for filter combos** | 4-8 hours | High — cache frequent filter combinations |
| **Typesense facets** | 1-2 days | High — built-in faceting, ~10ms |
| **Partial indexes on filter columns** | 2 hours | Medium — faster GROUP BY |
| **Frontend option caching** | 2 hours | Medium — cache unfiltered options, only refetch on filter change |

**Decision:** Parked for V1.1. Current performance is acceptable for launch.

---

### Custom 404 Page Design

**Priority:** Medium (V1.0)
**Added:** 2026-02-08
**Completed:** 2026-02-13
**Status:** ✅ COMPLETED
**Type:** UX / Design

**Problem:**
The current 404 page is the default Next.js error page — generic and off-brand. Users who hit a broken link or mistype a URL see no helpful guidance.

**Solution:**
Design a branded 404 page that:
- Matches the site's visual identity (navy theme, typography)
- Clearly communicates "page not found" in Dutch
- Provides a link back to the homepage (Overzicht)
- Optionally includes the search bar so users can find what they were looking for
- Keeps it simple and on-brand — no gimmicks

---

### Rate Limiting via Cloudflare (Pre-Launch)

**Priority:** High (Pre-Launch)
**Added:** 2026-02-08
**Updated:** 2026-02-12
**Status:** ⏳ TODO (V1.0 — before launch)
**Type:** Security / Infrastructure

**Problem:**
No rate limiting exists anywhere in the stack. An attacker can send thousands of requests/second to any BFF endpoint, saturating the backend's 10-connection asyncpg pool and degrading service for all users. The autocomplete endpoint (called on every keystroke) and cascading filters endpoint (7 parallel DB queries per request) are the most amplifiable vectors.

**Decision (2026-02-12):** Cloudflare free tier in front of Railway.

**Implementation:**
1. Create Cloudflare account (free tier)
2. Change DNS for `beta.rijksuitgaven.nl` (and later `rijksuitgaven.nl`) to proxy through Cloudflare
3. Configure rate limiting rules in Cloudflare dashboard
4. Verify Railway still receives traffic correctly
5. Benefits: rate limiting + DDoS protection + WAF for free

**Estimated effort:** 30 minutes

---

### Backend Network Isolation (Pre-Launch)

**Priority:** High (Pre-Launch)
**Added:** 2026-02-08
**Status:** ✅ COMPLETE (BFF secret implemented 2026-02-10, private networking deferred to V1.1)
**Type:** Security

**Problem:**
The backend FastAPI service is directly accessible on the internet at its Railway URL. The BFF proxy pattern is cosmetic — all BFF protections (sanitization, body limits, future auth) can be bypassed by hitting the backend URL directly. The URL follows a predictable pattern (`{service}-production-{4hex}.up.railway.app`, 65K combinations).

**Potential Solutions:**

| Option | Effort | Impact | Status |
|--------|--------|--------|--------|
| **Railway private networking** | 1 hour | High — backend only reachable from BFF container | V1.1 |
| **API key between BFF and backend** | 2-4 hours | High — backend rejects requests without secret header | ✅ Done 2026-02-10 |
| **IP allowlisting** | 1 hour | Medium — fragile if Railway IPs change | Not needed |

**Implemented:** `X-BFF-Secret` shared secret. `proxyToBackend()` sends header; `BFFSecretMiddleware` in FastAPI validates it. Railway private networking deferred to V1.1 for full network isolation.

---

### xlsx Package Replacement (V1.1)

**Priority:** Medium (V1.1)
**Added:** 2026-02-08
**Status:** BACKLOGGED
**Type:** Security / Dependency

**Problem:**
The `xlsx` (SheetJS) npm package has known CVEs: prototype pollution (GHSA-4r6h-8v6p-xvw6, CVSS 7.8) and ReDoS (GHSA-5pgg-2g8v-p4x9, CVSS 7.5). The open-source version is abandoned (no fix available). Current usage is write-only (`aoa_to_sheet`, `writeFile` for XLS export), so CVEs targeting parse paths are not directly exploitable. However, compliance scanners will flag this.

**Potential Solutions:**

| Option | Effort | Impact |
|--------|--------|--------|
| **Replace with ExcelJS** | 4-8 hours | High — actively maintained, MIT license |
| **Replace with commercial SheetJS** | 2 hours | Medium — requires license, different npm package |
| **Remove XLS export** | 30 min | Low — only offer CSV (functional regression) |

**Decision:** Replace with ExcelJS in V1.1. Low urgency since write-only usage.

---

## Post-V1.0 Backlog

### Overzichtspagina / Recipient Profile Panel

**Priority:** Deferred to V5 (AI Research Mode)
**Added:** 2026-01-20 (original)
**Updated:** 2026-02-06 (deferred decision)
**Type:** Feature / UX

**Original Request:**
High-level overview page showing module totals per year, as entry point to platform.

**Analysis (2026-02-06):**
Compared WordPress "detail page" with current V1 expanded row:

| Feature | WordPress Detail Page | V1 Expanded Row |
|---------|----------------------|-----------------|
| Scope | All metadata at once | One grouping at a time |
| Year breakdown | ✅ | ✅ |
| Groupable fields | Links to filter | Clickable filters |
| Google search link | ✅ | ✅ (added 2026-02-06) |

**Conclusion:** V1 expanded row covers the functional need. A comprehensive "Recipient Profile Panel" is not needed until V5.

**Where This Functionality Fits:**

| Version | Need Level | Reason |
|---------|------------|--------|
| V1 | Low | Expanded row suffices for "who received money" |
| V2 | Low | Email briefings, not interactive exploration |
| V3 | Medium | Theme pages link to recipients, but search handles it |
| V5 | **HIGH** | AI Research needs full recipient context to analyze |
| V6 | **HIGH** | Workspace needs full profile to save/annotate |
| V8 | **CRITICAL** | Network analysis: click node → see full profile + connections |

**V5 Implementation (Recommended):**
Build **Recipient Profile Panel** as slide-out panel:
- All years across all modules
- All metadata fields
- Cross-module summary ("€450M total: Instrumenten €300M, Publiek €150M")
- External links (Google, KvK in V7)
- AI context reference
- "Add to Dossier" action (V6)

**Decision:** Skip for V1.0. Build as part of V5 AI Research Mode where it becomes essential.

---

### Logo Asset Optimization

**Priority:** Low (V1.1)
**Added:** 2026-02-06
**Type:** Design / Brand

**Problem:**
Current `logo.png` (1900×540px) includes tagline "Snel inzicht voor krachtige analyses" which becomes unreadable when scaled down for compact headers. The full logo requires h-14 (56px) minimum height to be legible.

**Current state:**
- Using full designed logo asset (Option C hybrid approach)
- Desktop: h-14 (56px) logo in h-24 (96px) masthead
- Mobile: icon only (h-12, 48px)
- Tagline barely readable at current size

**Options to explore:**
1. Create compact logo variant without tagline (just icon + "Rijksuitgaven")
2. Create SVG version for crisp scaling at any size
3. Redesign tagline with larger font in source file
4. Accept current size as brand presence vs. space trade-off

**Decision:** Keep current implementation for V1.0 launch. Revisit in V1.1 UX polish phase.

---

### Integraal View Redesign (Brainstorm Required)

**Priority:** Medium
**Added:** 2026-01-30
**Type:** Architecture / Brainstorm

**Problem:**
The current Integraal view (`universal_search` materialized view) is not a "true" integraal view. It aggregates recipients across modules but cannot show extra columns because different modules have different fields in their source tables:

| Module | Fields Available |
|--------|------------------|
| Instrumenten | regeling, artikel, instrument, begrotingsnaam |
| Apparaat | kostensoort (no recipient), artikel, detail |
| Inkoop | categorie, staffel, ministerie |
| Provincie | provincie, omschrijving |
| Gemeente | gemeente, omschrijving, beleidsterrein |
| Publiek | source, regeling, trefwoorden, sectoren |

**Current Limitation:**
- Integraal can only show: Ontvanger, year columns, totaal, modules list
- Cannot show "extra columns" like individual module pages can
- No common denominator across all modules

**Questions to Explore:**
1. Should Integraal show module-specific columns when drilling down?
2. Should we create a unified taxonomy mapping different fields to common concepts?
3. Is the current "discovery layer" approach sufficient (find recipient → navigate to module)?
4. What do users actually need from cross-module view?

**Decision:** Requires brainstorm session to determine approach. Park for post-V1.0.

---

### API Performance: Inkoop & Integraal Endpoints

**Priority:** Low (Mostly Resolved)
**Added:** 2026-01-26
**Updated:** 2026-01-26 (after pg_trgm + source table indexes)

**Current State (After Optimization):**

| Module | Basic Query | Search (3+ chars) | Status |
|--------|-------------|-------------------|--------|
| instrumenten | 114-204ms | 237ms | ✅ |
| apparaat | 172ms | 215ms | ✅ |
| provincie | 196ms | 228ms | ✅ |
| gemeente | 191ms | 598ms | ✅ |
| publiek | 222ms | 247ms | ✅ |
| inkoop | 180-480ms | 175-312ms | ✅ Improved |
| integraal | 190-380ms | 181-226ms | ✅ Improved |

**Optimizations Applied:**
1. ✅ Materialized views (100x faster aggregation)
2. ✅ pg_trgm + GIN indexes (4x faster ILIKE search)
3. ✅ Source table indexes (faster details queries)
4. ✅ Connection pool tuning (handles more concurrent users)

**Remaining options (if traffic grows):**
- Redis/memory caching layer
- Read replica for heavy queries

**Decision:** Performance is now acceptable. Monitor in production.

---

### Entity Resolution / Recipient Normalization

**Priority:** ✅ COMPLETED (V1.0)
**Added:** 2026-01-20
**Completed:** 2026-01-26

**Problem:**
Recipients were spelled differently across data sources:
- "N.V. Nederlandse Spoorwegen" vs "Nederlandse Spoorwegen" (N.V. format)
- "NS Vastgoed B.V." vs "NS Vastgoed BV" (B.V. format)
- Casing variations

**Solution Implemented:**
Created `normalize_recipient()` PostgreSQL function that handles:
- Casing (UPPER)
- B.V./BV/N.V./NV format variations (stripped)
- Extra spaces (normalized)

Rebuilt `universal_search` materialized view with normalization.

**Result:**
- 466,827 → 451,445 entities
- **15,382 duplicates merged (3.3%)**
- ProRail: multiple rows → 1 row (€12.7B)
- NS Spoorwegen: 3 rows → 1 row (€90M)

**Script:** `scripts/sql/009-entity-resolution-normalization.sql`

**Remaining (V2.0+):**
- KvK-based matching for remaining name variations (e.g., "Politie" vs "Korps Nationale Politie")
- Entity mapping table for complex cases

---

### Download Screenshot Feature

**Priority:** Low
**Added:** 2026-01-20

Allow users to download a screenshot/image of current view for reports and presentations.

---

### Search on Other Fields (Regeling, Omschrijving)

**Priority:** ✅ COMPLETED
**Added:** 2026-01-29
**Completed:** 2026-01-31

**Problem:**
When search matches on fields OTHER than Ontvanger (e.g., Regeling, Omschrijving), the current UI can't show why that result appeared.

**Solution Implemented:**
- "Gevonden in" column shows matched field and value when search hits non-primary fields
- Uses Typesense highlight data (zero additional latency)
- Documented in search-requirements.md as UX-002d

---

### Full URL State Restoration

**Priority:** Medium
**Added:** 2026-01-20

V1.0 has basic URL sharing (search term, module, key filters).
V2.0: Full state in URL including expanded rows, pagination position, all filter states.

---

### Analytics Integration

**Priority:** Medium (V1.1 or V1.2)
**Added:** 2026-01-21
**Updated:** 2026-02-14
**Status:** ✅ COMPLETED 2026-02-14 (Phase 2 implemented as UX-032)
**Type:** Product Analytics / GDPR

**Goal:** Track user behavior and usage patterns at scale (building for 500+ users, not just current 50).

**What was implemented (UX-032):**
- Server-side event logging via BFF (Phase 2 from original plan)
- 6 event types: module_view, search, row_expand, filter_apply, export, column_change
- Pseudonymized user tracking (SHA256 actor_hash, no PII)
- Client-side batching hook (`use-analytics.ts`) — flush every 30s or 10 events
- BFF endpoint (`POST /api/v1/analytics`) — fire-and-forget write to Supabase
- Admin dashboard at `/team/statistieken` — 6 sections with date range picker
- SQL: `038-usage-events.sql` (table) + `038b-usage-events-functions.sql` (7 RPC functions)
- Design doc: `docs/plans/2026-02-14-usage-statistics-design.md`

**GDPR Analysis (2026-02-09 expert team review):**

| Tracking type | Consent needed? | Notes |
|--------------|----------------|-------|
| Server-side logs (Railway) | No | Legitimate interest, already available |
| Supabase Auth queries (last_sign_in_at) | No | Already available |
| Plausible/Umami (cookie-free, EU-hosted) | No (basic pageviews) | French DPA approved; Dutch DPA hasn't ruled specifically |
| Custom events (server-side BFF logging) | No | Log API calls in BFF, no client-side tracking needed |
| PostHog / GA4 (cookies, user profiling) | Yes | Requires consent mechanism, overkill for now |

**Remaining phases (future):**

| Phase | Trigger | Action | Cost |
|-------|---------|--------|------|
| 1 | Post-launch | Plausible or Umami Cloud (pageviews, traffic, top pages) | €9/month |
| ~~2~~ | ~~200+ users~~ | ~~Server-side event logging~~ | ✅ Done (UX-032) |
| 3 | 500+ users | PostHog with proper consent mechanism | Free tier |

**Key rules:**
- Never use Google Analytics (US data transfer, consent required, anti-privacy)
- Prefer server-side event tracking over client-side scripts (no consent needed)
- Current cookie banner ("alleen noodzakelijke cookies") stays intact through Phase 1-2
- Phase 3 requires updating cookie banner to consent mechanism

---

### Error Tracking / Monitoring

**Priority:** Low
**Added:** 2026-01-21
**Completed:** 2026-02-14
**Status:** ✅ COMPLETED (integrated into UX-032)

**Problem:** Need to catch and debug production client-side errors.

**Solution Implemented (as part of UX-032):**
- `error` event type tracked in `use-analytics.ts` (12th event type)
- Captures: error message, search query, sort column, active filters, module
- Immediate flush (bypasses 30s batch timer)
- Admin dashboard errors section: stacked cards with context pills
- `DELETE /api/v1/team/statistieken` — clear all error events
- SQL: `get_usage_errors()` function (migration 040)

**Note:** This is client-side error tracking only. Server-side monitoring (Sentry, Railway logs) remains a separate consideration for post-launch if needed.

---

### User-Configurable Anomaly Threshold

**Priority:** Low
**Added:** 2026-01-21
**Source:** UX Brainstorm Session

V1.0 has fixed 50% threshold for trend anomaly highlighting (red cells). Originally 10% but raised to 50% on 2026-02-07 as normal government budget adjustments (5-20% YoY) created too much noise.

**Future enhancement:** Allow users to configure their own threshold:
- 25% (sensitive - more highlights)
- 50% (current default)
- 75% (less sensitive)
- 100% (only major changes)

**Location:** User settings/preferences.

---

### Data Provenance / Freshness Indicator

**Priority:** Medium
**Added:** 2026-01-21
**Source:** UX Brainstorm Session

Show users when data was last updated and where it came from.

**Level 1 (simpler):** Module-level "Data bijgewerkt: [date]" indicator.

**Level 2 (detailed):** Per-row/cell provenance:
- Source dataset name
- Publication date
- Data provider

**Decision:** Deferred to post-V1.0. Review implementation approach later.

---

### Accessibility: Colorblind Indicator

**Priority:** Medium
**Added:** 2026-01-21
**Source:** UX Brainstorm Session

V1.0 trend anomaly indicator uses red color only. Users with color blindness may not see it.

**Options:**
- Add small dot (●) in corner of highlighted cells
- Bold text for anomaly cells
- Pattern overlay instead of color only

**Decision:** Deferred. Evaluate based on user feedback post-launch.

---

### Newsletter: Media Topics + Spending Data

**Priority:** Low (Marketing/Content)
**Added:** 2026-01-21
**Source:** UX Brainstorm Session

Content marketing idea: Monitor Dutch media for trending topics, connect to spending data, create newsletter.

**Concept:**
- Track news topics (e.g., "wolf protection", "climate adaptation")
- Link to relevant spending data in platform
- Send newsletter: "This week in the news + the EUR behind it"

**Value:**
- Builds audience
- Demonstrates platform value
- Timely, relevant content

**Decision:** Evaluate post-V1.0 as marketing initiative.

---

### AI Integration: MCP Server + OpenAI GPT

**Priority:** Medium (Marketing/Lead Generation)
**Added:** 2026-01-21
**Source:** Brainstorm Session

Enable AI assistants (Claude, ChatGPT) to query recipient spending data as a lead generation tool.

**Strategy:** Citation without extraction
- AI queries live data from Rijksuitgaven servers (not trained into models)
- Returns teaser data with CTA to platform
- Full details remain behind paywall

**Example interaction:**
```
User: "How much did ProRail receive from the Dutch government?"

AI: "ProRail B.V. received €461M in 2024.
     Sources: Financiële Instrumenten (€412M), Publiek (€49M)

     📊 For trends, breakdowns, and exports: rijksuitgaven.nl"
```

**What to expose (teaser):**
- Recipient name + total amount (latest year)
- Which modules they appear in
- Record count

**What stays behind paywall:**
- Year-over-year breakdown
- Drill-down by Regeling, Artikel, etc.
- Export functionality

**Technical components:**
1. Public API endpoint: `/api/public/recipient?name=X`
2. MCP server wrapper (for Claude)
3. OpenAI GPT Action (for ChatGPT)
4. robots.txt: Block training crawlers, allow search crawlers

**Effort:** 8-12 hours total

**Decision:** Post-V1.0. Implement after platform stable.

---

### Entity Resolution: Module Views (Case Normalization)

**Priority:** High - V1.0 Release
**Added:** 2026-01-29
**Related:** Extends previous entity resolution work (scripts/sql/009-entity-resolution-normalization.sql)

**Problem:**
Recipient case variations still appear as separate rows in individual module views:
- "politie", "Politie", "POLITIE" shown separately in Financiële Instrumenten
- "Politieke beweging DENK", "Politieke Beweging DENK", "Politieke Beweging Denk" as 4 rows
- Same recipient, different casing = different aggregated totals

**Root Cause:**
The `normalize_recipient()` function was applied to `universal_search` (integraal) but NOT to individual module aggregated views.

**Solution:**
Rebuild all module aggregated views using `normalize_recipient()` in the GROUP BY, with first-letter capitalization for display.

**Status:** ✅ COMPLETED (2026-01-29)
- ✅ `instrumenten_aggregated` - Done
- ✅ `inkoop_aggregated` - Done
- ✅ `provincie_aggregated` - Done
- ✅ `gemeente_aggregated` - Done
- ✅ `publiek_aggregated` - Done
- ➖ `apparaat_aggregated` - Not needed (uses kostensoort, not recipients)

**Script:** `scripts/sql/010-normalize-module-aggregated-views.sql`

---

### Semantic Search: Dutch Language Awareness

**Priority:** ✅ V1.1 COMPLETE
**Added:** 2026-01-29
**V1.1 Completed:** 2026-01-29
**Target:** V2.0 (embeddings)

**Problem:**
Current keyword search (`ILIKE '%term%'`) matches substrings without understanding meaning.

Example: "politie" (police) matches "Politieke" (political) - completely different domains.

| Search | Current Result | Desired |
|--------|----------------|---------|
| politie → Politie | ✅ | ✅ |
| politie → Politieacademie | ✅ | ✅ |
| politie → Politieke beweging | ✅ | ❌ |

**V1.1 Implementation (COMPLETE):**
1. **Dutch word rules:** For searches ending in "-ie", exclude "-iek" false cognates
2. **Option C ranking:** Exact match first, then everything else by totaal (biggest money flows)

**Roadmap:**

| Version | Approach | Effort | Accuracy | Status |
|---------|----------|--------|----------|--------|
| V1.1a | Dutch word rules + Option C ranking | 4-8 hours | ~90% | ✅ Complete |
| V1.1b | Embeddings (Cohere, vector similarity) | 2-3 days | ~95% | Planned |

**V2.0 Embeddings:**
- **Vendor:** Cohere embed-multilingual-v3 (native Dutch support)
- **Scope:** Full database (~9M tokens: recipients, regelingen, omschrijvingen)
- **Cost:** €0.90 one-time, ~€1/month
- **Storage:** pgvector in Supabase (already enabled)

**Benefits:**
- Filter false positives semantically
- Entity clustering (group related organizations)
- Theme search ("infrastructure" finds rail, road, water entities)
- Multilingual queries

**Design document:** `docs/plans/2026-01-29-semantic-search-design.md`

---

### Filters UX Review

**Priority:** Medium (UX)
**Added:** 2026-01-31
**Type:** UX / Review

**Task:**
Take a close look at the filter panel UX and identify improvements needed.

**Areas to review:**
- Filter layout and organization
- Filter interaction patterns
- Mobile filter experience
- Filter state clarity (what's active)
- Clear/reset behavior
- Performance of filter dropdowns

**Decision:** Schedule UX review session.

---

### Extra Columns Behavior During Search

**Priority:** Medium (UX Discussion)
**Added:** 2026-01-31
**Type:** UX / Brainstorm

**Current Behavior:**
When user searches, the "Gevonden in" column replaces user-selected extra columns. User's column preferences disappear during search.

**Questions to Discuss:**
1. Should extra columns remain visible alongside "Gevonden in"?
2. Should "Gevonden in" be a separate, always-available column?
3. Should users be able to toggle between views?
4. What happens on mobile where space is limited?

**Decision:** Requires UX discussion with founder.

---

### Railway Private Networking for Typesense

**Priority:** Low (Cost Optimization)
**Added:** 2026-01-29

**Problem:**
Backend API connects to Typesense via public URL, incurring egress fees. Railway supports private networking between services in the same project.

**Current State:**
- Both services have private networking enabled
- `typesense.railway.internal` shows "Ready to talk privately"
- Connection fails with "All connection attempts failed"
- Public URL works fine

**Attempted:**
- Port 8080 (Railway PORT variable)
- Port 8108 (Typesense default)
- Hostname `typesense.railway.internal`
- Hostname `typesense` (short form)

**Possible Causes:**
- Caddy reverse proxy configuration (Typesense uses Caddy)
- IPv6/IPv4 resolution issues
- Service binding to localhost instead of 0.0.0.0

**Decision:** Use public URL for now. Egress costs are minimal for search traffic. Investigate later if costs become significant.

---

### Filter Performance Optimization

**Priority:** Medium (UX Impact)
**Added:** 2026-02-05
**Type:** Performance

**Problem 1: Large filter result sets are slow**
When filtering by a Regeling or Begroting with many recipients, the query takes 500ms+.
- Current path: Typesense → PostgreSQL aggregated view with WHERE clause
- Large result sets need re-aggregation

**Problem 2: Filter dropdown options are slow to load**
When switching between filter dropdowns (e.g., Regeling → Artikel), the new dropdown takes a long time to populate.
- Each dropdown calls `/api/v1/modules/{module}/filters/{field}`
- Queries DISTINCT values from database
- Large fields (Regeling: 2000+ options) are slow

**Solutions Pipeline:**

| Option | Problem Solved | Effort | Impact |
|--------|----------------|--------|--------|
| **Filter-specific indexes** | #1 | 2 hours | Medium |
| **Pre-cache filter options** | #2 | 4 hours | High |
| **Typesense data enrichment (V1.1)** | #1 | 1-2 days | High |
| **Progressive dropdown loading** | #2 | 4 hours | Medium |
| **Redis cache for filter combos** | #1, #2 | 4-8 hours | High |

**Quick Wins (V1.0):**
1. Add B-tree indexes on filter columns in source tables (reduces 900ms → 300ms)

**V1.1 Solution (Recommended):**
- **Typesense facets** - Use built-in faceting feature for filter dropdowns
- Single request returns search results + all filter option counts
- ~10ms response time (vs 300-900ms PostgreSQL DISTINCT)
- Aligns with Typesense data enrichment work
- No additional infrastructure needed

**Decision:** V1.0 quick fix with indexes. V1.1 full solution with Typesense facets.

---

### Mobile Responsiveness Audit

**Priority:** Low (Post-V1.0)
**Added:** 2026-02-03
**Updated:** 2026-02-05
**Type:** UX / Testing

**Status:** BACKLOGGED - Deferred to post-V1.0 (mobile message banner is V1.0 solution)

**Task:**
Comprehensive mobile UX testing and fixes based on user feedback.

**Areas to test:**
- Touch targets (min 44×44px)
- Table horizontal scroll on mobile
- Sticky columns behavior
- Filter panel (bottom sheet)
- Search autocomplete dropdown
- Expanded row content
- Header menu navigation

**V1.0 Solution:** Mobile message banner (UX-003) informs users the app works best on larger screens. Non-blocking - users can continue.

**Decision (2026-02-05):** Mobile banner is sufficient for V1.0 launch. Full audit deferred to post-launch based on beta feedback.

---

### Search Performance Optimization (COMPLETED)

**Priority:** ✅ COMPLETE (Phase 1 + Phase 2)
**Added:** 2026-02-03
**Updated:** 2026-02-09
**Status:** ✅ COMPLETED
**Type:** Performance

**Phase 1 - COMPLETE (2026-02-03):**
- Target: <100ms
- Achieved: ~130-280ms (via parallel query execution)
- Implementation: `asyncio.gather()` for main/count/totals queries
- Commit: `ee055a4`

**Previous Optimizations (already applied):**
1. ✅ Materialized views
2. ✅ pg_trgm + GIN indexes
3. ✅ Hybrid Typesense → PostgreSQL search
4. ✅ Functional indexes on normalize_recipient()
5. ✅ Parallel query execution (Phase 1)

**Phase 2 - COMPLETE (2026-02-09):**
- Enriched recipients Typesense collection with year amounts (y2016-y2024), years_with_data, record_count
- Integraal search now uses Typesense hybrid: `_typesense_search_recipient_keys()` → WHERE ontvanger_key = ANY($1)
- Regex fallback if Typesense returns 0 results
- Production results: ~97-152ms warm (was ~200ms regex)
- Commit: `f2a97c1`
- Recipients collection: 463,731 docs re-synced with enriched data

**Note:** Original Phase 2 goal was "skip PostgreSQL entirely" (~25-50ms target). Actual implementation uses Typesense for key lookup + PostgreSQL WHERE IN for data retrieval (~100ms). Full PostgreSQL bypass would require serving year amounts from Typesense directly, which isn't needed now that hybrid search is fast enough.

---

### GitHub Projects Visual Dashboard

**Priority:** Low (V1.2)
**Added:** 2026-02-09
**Status:** BACKLOGGED
**Type:** Tooling / Process

**Problem:**
Backlog, roadmap, and release tracking live in markdown files. Works well for development (Claude reads them directly) but lacks visual overview for non-technical stakeholders (sales partner).

**Proposed Solution:**
GitHub Projects board as a **read-only dashboard** on top of existing markdown:
- Board view: Triage → Backlog → In Progress → Done
- Roadmap view: timeline grouped by milestone (V1.0, V1.1, V2.0, etc.)
- Issues are lightweight pointers (title + label + link to markdown spec)
- Partner can submit ideas via `idea`-labeled issues → Triage column
- Markdown stays source of truth; board is a view, not a second system

**Setup:** ~30 minutes. Requires `gh auth refresh -s project` for CLI access.

**Decision:** Not needed for launch. Revisit in V1.2 polish phase or when partner needs independent visibility.

---

### Invite Email for New Members (COMPLETED)

**Priority:** High (V1.0 — just before launch)
**Added:** 2026-02-11
**Completed:** 2026-02-11
**Status:** ✅ COMPLETED
**Type:** Feature

**Problem:**
When admin adds a new member via `/team/leden`, `admin.createUser()` creates the auth user but does NOT send an email. Users don't know they have an account.

**Solution Implemented:**
- `invited_at` column on subscriptions table (migration 033)
- `POST /api/v1/team/leden/[id]/invite` endpoint
- Per-row "Uitnodigen" / "Opnieuw" buttons in `/team/leden`
- Status lifecycle: Aangemaakt → Uitgenodigd → Actief
- Handles existing users gracefully (generateLink + Resend fallback)

---

### Row Selector for Bulk Actions (Admin Module)

**Priority:** Low (V1.1+)
**Added:** 2026-02-11
**Status:** ⏳ Backlog
**Type:** Feature / UX

**Problem:**
When managing many members (e.g., after WordPress import), admin may want to perform actions on multiple members at once (invite all, deactivate selected, etc.).

**Solution:**
Add checkbox column to `/team/leden` table with bulk action bar:
- Select individual rows or "select all"
- Bulk actions: Invite selected, Deactivate selected
- Confirmation dialog before destructive actions

**Estimated effort:** 2-3 hours

---

### Integraal View: Cross-Module Data Completeness

**Priority:** Medium (V1.1 — Database Structure)
**Added:** 2026-02-11
**Status:** ⏳ Backlog
**Type:** Architecture / Data

**Problem:**
The `universal_search` materialized view aggregates recipients across modules but lacks cross-module detail fields. Most notably, **regelingen** (regulations) exist in multiple modules (instrumenten, publiek) but are NOT available in the integraal view. This limits the integraal view to: ontvanger, year amounts, totaal, and module list.

**Goal:**
Enrich the integraal view so it can surface module-specific data like regelingen, making it a true cross-module discovery layer. Users searching in integraal should be able to see which regelingen a recipient is associated with, without needing to drill into each module separately.

**Fields to evaluate for inclusion:**

| Field | Source Modules | Priority |
|-------|---------------|----------|
| regelingen | instrumenten, publiek | High |
| begrotingsnaam | instrumenten | Medium |
| categorie | inkoop | Medium |
| trefwoorden | publiek | Low |

**Approach Options:**
1. **JSONB column** — Store module-specific fields as JSON (e.g., `extra_data: { regelingen: [...], categorieën: [...] }`)
2. **Separate junction table** — `recipient_regelingen` mapping table linking ontvanger_key to regelingen across modules
3. **Array columns** — Add `regelingen text[]`, `categorieën text[]` etc. as array columns on `universal_search`

**Decision:** Requires design brainstorm. Related to existing "Integraal View Redesign" backlog item. May be combined.

---

### Branded Magic Link Email Template

**Priority:** High (V1.0 — before launch)
**Added:** 2026-02-11
**Completed:** 2026-02-11
**Status:** ✅ COMPLETED
**Type:** Polish

**Problem:**
Current magic link email uses Supabase default template. Looks unprofessional compared to industry standard (e.g., Claude.ai uses logo, centered card layout, prominent CTA button).

**Solution:**
Create branded HTML email template matching Rijksuitgaven brand identity:
- Logo at top (hosted image URL)
- Centered white card on light background
- Heading: "Inloggen bij Rijksuitgaven.nl"
- Subtext: "Klik op de onderstaande knop om in te loggen"
- Pink CTA button (#E62D75): "Inloggen"
- Footer: "Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren."
- Contact info in footer

**Implementation:**
1. Upload logo to public URL (e.g., `https://beta.rijksuitgaven.nl/logo.png`)
2. Create HTML template (use Resend/MJML/React Email for responsive design)
3. Test template with email preview tool
4. Paste HTML into Supabase Dashboard > Authentication > Email Templates > "Magic Link"
5. Also update "Invite User" template with same branding (for member invites)
6. Send test emails to verify rendering across clients (Gmail, Outlook, Apple Mail)

**Templates to update:**
- Magic Link (for login)
- Invite User (for new member onboarding)

**Reference:** Claude.ai email style — logo, centered card, large button, minimal text

**Estimated effort:** 1 hour (HTML template + testing)

**Related:** Invite email for new members (separate backlog item)

---

### Search: Accurate Multi-Field Match Reporting

**Priority:** Medium (V1.1)
**Added:** 2026-02-12
**Status:** BACKLOGGED
**Type:** Search / UX

**Problem:**
With multi-word AND search (e.g., `rode kruis`), the "Gevonden in" column uses a heuristic: it checks only the **first word** to determine which field matched. This can be inaccurate when words match across different fields (e.g., "rode" in `ontvanger`, "kruis" in `regeling`). Since matched_field is a UI hint (not a filter), this is acceptable for V1.0.

**V1.1 Improvement:**
- Check all words against all fields, report all matched fields
- Possibly highlight each word in its respective field
- Requires minor UI change to show multiple matched fields

**Estimated effort:** 2-4 hours

---

### Search: Fuzzy/Typo Tolerance

**Priority:** Medium (V1.1)
**Added:** 2026-02-12
**Status:** BACKLOGGED
**Type:** Search / UX

**Problem:**
V1.0 search requires exact spelling. Users who misspell recipient names (e.g., "proraill" instead of "prorail") get no results. Typesense already supports `num_typos` parameter for typo tolerance, but it's not exposed in the current implementation.

**V1.1 Improvement:**
- Enable Typesense `num_typos: 1` or `2` for autocomplete and search
- PostgreSQL regex fallback stays exact (acceptable — Typesense handles most searches)
- May need UI indicator: "Bedoelde u: ProRail?" for fuzzy matches

**Estimated effort:** 2-4 hours

---

### Search: Field-Specific Search Syntax

**Priority:** Low (V2+)
**Added:** 2026-02-12
**Status:** BACKLOGGED
**Type:** Search / Power User

**Problem:**
Power users may want to search within specific fields. Currently all searches go across all searchable fields for a module. There's no way to say "only search in leverancier" or "only search in regeling".

**Syntax idea:** `leverancier:prorail` or `regeling:subsidie`

**Deferred to V2+** — requires parser extension, field validation per module, and UI for field selection. Not needed for V1.0 audience.

**Estimated effort:** 4-8 hours

---

### Email Campaign Management (Resend Broadcasts)

**Priority:** High (V1.0 — before launch, replaces WordPress/Mailster)
**Added:** 2026-02-12
**Updated:** 2026-02-13
**Status:** ⏳ IN PROGRESS (contacts table + admin UI done, migration + Resend Audience + campaign template remaining)
**Type:** Infrastructure / Marketing

**Problem:**
Current email campaigns run on WordPress + Mailster + Mailgun at `nieuws.rijksuitgaven.nl`. This requires maintaining a separate WordPress server, the tooling is dated, and it's disconnected from the new platform. Goal is to cut WordPress entirely at launch.

**Decision:** Resend Broadcasts (already in stack for transactional email).

**Why Resend:**
- Already handles magic link + invite emails (zero new vendors)
- Single contact list shared with transactional (subscriptions → Resend Audience)
- React Email templates (same tech as existing `docs/email-templates/`)
- Broadcast API enables programmatic sends (V2 Reporter ready)
- Free for 1,000 contacts, $40/mo for 5,000+
- Kills WordPress dependency entirely

**Implementation Steps:**
1. ✅ Create `contacts` table in Supabase (migration 036-contacts.sql written, not yet executed)
2. ✅ Build admin UI at `/team/contacten` (new tab in team nav) — UX-028
3. ✅ Sync contacts → Resend Audience (on create/update/delete) — fire-and-forget helper
4. ⏳ Execute migration on Supabase production
5. ⏳ Create Resend Audience and configure `RESEND_AUDIENCE_ID` env var
6. ⏳ Build branded campaign template (React Email, reuse existing brand components)
7. ⏳ Send test broadcast, verify open/click tracking
8. ⏳ Migrate Mailster contacts into `contacts` table
9. ⏳ Backfill contacts from subscriptions table (subscriber type)
10. ⏳ Document campaign workflow for founder (dashboard → new broadcast → send)
11. After launch: decommission `nieuws.rijksuitgaven.nl` and WordPress server

**Contacts Table Design:**
```sql
contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  organization text,
  type text NOT NULL DEFAULT 'prospect',  -- prospect | subscriber | churned
  source text,                             -- website | event | referral | import
  notes text,
  resend_contact_id text,                  -- Resend Audience contact ID
  subscription_id uuid REFERENCES subscriptions(id),  -- link to subscription if exists
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

- Subscribers auto-created from `subscriptions` table (backfill + trigger/sync)
- Prospects added via `/team/contacten` admin page
- Type transitions: prospect → subscriber (on subscription create), subscriber → churned (on expiry)
- Sync to Resend Audience on create/update via API

**What Resend Broadcasts provides:**
- Visual block editor (headings, text, images, buttons, dividers)
- Open rate + click tracking + bounce tracking
- Audience management with auto-unsubscribe (GDPR)
- Scheduling (natural language: "tomorrow at 9am")
- Personalization with audience data variables

**What it does NOT provide (acceptable trade-offs):**
- No drag-and-drop multi-column layouts (use React Email for complex templates)
- No A/B subject line testing (yet)
- No automation sequences / drip campaigns (yet — single broadcasts only)

**Estimated effort:** 6-10 hours (contacts table + admin UI + Resend sync + campaign template)

---

### Interactive Search Demo on Homepage (No Login Required)

**Priority:** High (V1.0 — work on soon)
**Added:** 2026-02-12
**Status:** ⏳ Backlog
**Type:** Feature / Conversion
**Source:** Homepage audit — creative team Brief 2, item 6

**Problem:**
The homepage describes the product with screenshots and copy but never lets visitors *experience* it. Top-performing SaaS companies (Algolia, Airtable, Notion) convert by letting visitors touch the product before signing up.

**Proposed Solution:**
A sandboxed search experience embedded on the homepage — limited to one module (e.g., Instrumenten) and one year (e.g., 2024). Visitor types a query, sees real results with real amounts, experiences the speed. Teaser data only (no drill-down, no export). CTA at bottom: "Wilt u alle 9 jaren en 6 databronnen? Vraag een demo aan."

**Technical Approach:**
- Public BFF endpoint: `GET /api/v1/public/search?q=...` (rate-limited, no auth)
- Returns top 5 recipients with name + 2024 amount only
- Backend: query `universal_search` with LIMIT 5, single year column
- Frontend: lightweight search input + results list component on homepage
- No TanStack Table, no filters, no export — minimal UI

**Key Decisions Needed:**
1. Which module/year to expose?
2. Rate limiting strategy (Cloudflare required first — see rate limiting backlog item)
3. Should results link to login page or contact form?

**Estimated effort:** 8-12 hours (BFF endpoint + frontend component + rate limiting)

---

### Tab-Based Feature Explorer (Homepage Features Section)

**Priority:** Medium (V1.1)
**Added:** 2026-02-12
**Status:** ⏳ Backlog
**Type:** UX / Design
**Source:** Homepage audit — creative team, Features section review

**Problem:**
The current features section uses a 3x2 grid of equal-sized screenshot cards. While functional, this is a generic SaaS pattern. World-class data platforms (Linear, Stripe, Notion) use more engaging formats that keep visitors in the section longer and create visual hierarchy.

**Proposed Solution:**
Replace the 6-card grid with a tab-based feature explorer — one large browser frame with 6 tabs above it. Click a tab, the screenshot and description change. Mirrors the Audience section interaction pattern already on the page.

```
[ Zoeken ] [ Details ] [ Integraal ] [ Begroting ] [ Filteren ] [ Export ]
┌─────────────────────────────────────┐
│                                     │
│          LARGE SCREENSHOT           │
│                                     │
└─────────────────────────────────────┘
  Title and description below
```

**Benefits:**
- Larger screenshots = more readable product previews
- Tab clicks = micro-engagement → higher conversion on CTA below
- Consistent interaction pattern with Audience section
- Mobile-friendly (tabs as pills, single screenshot)
- Government buyers are methodical — they'll click through each tab

**Also consider (when implementing):**
- Update card content: replace "Ontdek bestedingen", "Wat is er nieuw?", "Wie ontvangt het meest?" with "Integraal doorzoeken", "Slim filteren", "Exporteren naar Excel"
- Auto-advance with progress bar (same as Audience section)
- Keyboard navigation between tabs

**Estimated effort:** 4-5 hours

---

### Audience-Personalized Landing Variants

**Priority:** Medium (V1.1)
**Added:** 2026-02-12
**Status:** ⏳ Backlog
**Type:** Feature / Marketing
**Source:** Homepage audit — creative team Brief 2, item 7

**Problem:**
One homepage serves 5 distinct audiences (journalists, municipalities, political parties, businesses, academics). Each has different buying triggers, pain points, and language. A journalist cares about "onthullingen" while a municipality cares about "vergelijkbaarheid." Serving everyone the same page means no one gets the most compelling pitch.

**Proposed Solution:**
Audience-specific landing variants using query params or UTM paths:
- `rijksuitgaven.nl/?ref=journalist` → Media-focused hero, case study, export emphasis
- `rijksuitgaven.nl/?ref=gemeente` → B2G section first, compliance language, onboarding CTA
- `rijksuitgaven.nl/?ref=politiek` → Accountability angle, transparency focus
- `rijksuitgaven.nl` (default) → General page (current)

**Technical Approach:**
- Same `PublicHomepage` component, conditional content via `useSearchParams()`
- Content arrays per audience (hero copy, featured case study, CTA text)
- Section order rearranged per audience (e.g., B2G first for gemeente)
- Shared components, no code duplication

**Key Decisions Needed:**
1. Which audiences get their own variant? (Start with journalist + gemeente?)
2. How are visitors routed? (UTM links from campaigns, LinkedIn ads, etc.)
3. Do we need analytics per variant first? (See Analytics backlog item)

**Estimated effort:** 6-8 hours per variant (copy + conditional rendering + testing)

---
