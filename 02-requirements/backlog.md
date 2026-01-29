# Product Backlog

**Last Updated:** 2026-01-29 (added semantic search design)

Items logged for future versions, not in V1.0 scope.

---

## Post-V1.0 Backlog

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

**Priority:** Medium
**Added:** 2026-01-29
**Sprint:** UI/UX Sprint

**Problem:**
When search matches on fields OTHER than Ontvanger (e.g., Regeling, Omschrijving), the current UI can't show why that result appeared.

**Example:**
- Search: "politie"
- Match: Regeling "Subsidieregeling Politiewerk"
- Ontvanger shown: "Gemeente Amsterdam"
- User confusion: "Why is Amsterdam in my politie search?"

**Solutions to explore:**
1. Show "Matched on: Regeling" indicator
2. Show snippet of matched field below Ontvanger
3. Separate section for "Also found in Regelingen"
4. Highlight matched terms in expandable row

**Design doc:** `docs/plans/2026-01-29-search-relevance-ranking.md` (deferred section)

---

### Full URL State Restoration

**Priority:** Medium
**Added:** 2026-01-20

V1.0 has basic URL sharing (search term, module, key filters).
V2.0: Full state in URL including expanded rows, pagination position, all filter states.

---

### Inzichten / Self-Service BI

**Priority:** Medium
**Added:** 2026-01-20

Current "Inzichten BETA" shows pre-prepared analyses. Future: allow users to create their own analyses and dashboards.

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

**Priority:** Medium
**Added:** 2026-01-29
**Target:** V1.1 (word rules) / V2.0 (embeddings)

**Problem:**
Current keyword search (`ILIKE '%term%'`) matches substrings without understanding meaning.

Example: "politie" (police) matches "Politieke" (political) - completely different domains.

| Search | Current Result | Desired |
|--------|----------------|---------|
| politie → Politie | ✅ | ✅ |
| politie → Politieacademie | ✅ | ✅ |
| politie → Politieke beweging | ✅ | ❌ |

**Proposed Solutions:**

| Version | Approach | Effort | Accuracy |
|---------|----------|--------|----------|
| V1.1 | Dutch word rules (-ie/-iek pattern) | 4-8 hours | ~90% |
| V2.0 | Embeddings (vector similarity) | 2-3 days | ~95% |

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
