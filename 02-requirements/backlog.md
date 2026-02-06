# Product Backlog

**Last Updated:** 2026-02-06

Items logged for future versions, not in V1.0 scope.

---

## V1.0 Backlog

### Staffelbedrag Explanation (User Education)

**Priority:** Medium (V1.0)
**Added:** 2026-02-06
**Type:** UX / Documentation

**Problem:**
Users unfamiliar with government data may not understand what "staffelbedrag" means. The Inkoop and Publiek (COA) modules show averaged staffel amounts, not precise figures.

**Staffel Definition (source: data.overheid.nl):**

| Staffel | Range |
|---------|-------|
| 0 | Negatief – €0 |
| 1 | €1 – €10.000 |
| 2 | €10.001 – €50.000 |
| 3 | €50.001 – €100.000 |
| 4 | €100.001 – €250.000 |
| 5 | €250.001 – €500.000 |
| 6 | €500.001 – €1.000.000 |
| 7 | €1.000.001 – €5.000.000 |
| 8 | €5.000.001 – €10.000.000 |
| 9 | €10.000.001 – €25.000.000 |
| 10 | €25.000.001 – €50.000.000 |
| 11 | €50.000.001 – €100.000.000 |
| 12 | €100.000.001 – €150.000.000 |
| 13 | Meer dan €150.000.001 |

**How we display it:**
Results show the **midpoint** of each staffel range. For staffel 13 (>€150M), we use €225M as the representative value.

**Options to explore:**
1. Info icon (ⓘ) next to footer text with popover explanation
2. Tooltip on "staffelbedrag" in footer
3. Dedicated help/FAQ page with all data methodology
4. Collapsible "About the data" section on module pages

**Decision:** Find appropriate place to explain this during V1.0 polish.

---

### Data Availability Indicators (Implementation Ready)

**Priority:** High (V1.0)
**Added:** 2026-02-06
**Status:** Design approved, implementation pending
**Effort:** 3-5 hours
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

**Decision:** Implementation starts next session.

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

**Priority:** Low
**Added:** 2026-01-21

Add website analytics to track user behavior and usage patterns.

**Options to evaluate:**
- Plausible (privacy-focused, paid)
- Umami (self-hosted, free)
- PostHog (product analytics)
- Simple custom tracking

**Decision:** Not required for V1.0 launch. Add post-launch.

---

### Error Tracking / Monitoring

**Priority:** Low
**Added:** 2026-01-21

Add error tracking to catch and debug production issues.

**Options to evaluate:**
- Sentry (industry standard)
- Railway built-in logging
- Supabase logs
- Custom error boundary + logging

**Decision:** Not required for V1.0 launch. Add post-launch based on need.

---

### User-Configurable Anomaly Threshold

**Priority:** Low
**Added:** 2026-01-21
**Source:** UX Brainstorm Session

V1.0 has fixed 10% threshold for trend anomaly highlighting (red cells).

**Future enhancement:** Allow users to configure their own threshold:
- 5% (sensitive - more highlights)
- 10% (default)
- 15% (less sensitive)
- 20% (only major changes)

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

### Search Performance Optimization

**Priority:** ✅ PHASE 1 COMPLETE (V1.1 for Phase 2)
**Added:** 2026-02-03
**Updated:** 2026-02-04
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

**Phase 2 - Deferred to V1.1:**
- Store year amounts in Typesense documents
- Skip PostgreSQL entirely for search results
- Target: ~25-50ms

**Status:** Phase 1 complete. Phase 2 deferred to V1.1 per user decision (2026-02-03).

---
