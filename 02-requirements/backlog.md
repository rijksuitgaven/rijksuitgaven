# Product Backlog

**Last Updated:** 2026-01-26 (performance items updated after optimization)

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

**Priority:** High (Post-V1.0)
**Added:** 2026-01-20

**Problem:**
Recipients are spelled differently across data sources:
- "politie", "Politie", "POLITIE" (casing)
- "Politie" vs "Korps Nationale Politie" (name variations)
- Same entity appears as multiple rows in aggregated views

**V1.0 Workaround:**
Case-insensitive grouping using `UPPER(Ontvanger)` in SQL queries.
- Solves: casing differences
- Does NOT solve: name variations, entity matching

**Future Solution (V2.0+):**
Build entity mapping table:
```
┌─────────────────────────┬──────────────────────┬───────────┐
│ variant                 │ canonical_name       │ kvk       │
├─────────────────────────┼──────────────────────┼───────────┤
│ politie                 │ Politie Nederland    │ 12345678  │
│ Korps Nationale Politie │ Politie Nederland    │ 12345678  │
└─────────────────────────┴──────────────────────┴───────────┘
```

**Approach:**
1. KvK-based matching where available
2. Fuzzy matching + manual review for rest
3. Maintain entity table for new data imports

**Effort:** Medium-High (data analysis + tooling + manual review)

---

### Download Screenshot Feature

**Priority:** Low
**Added:** 2026-01-20

Allow users to download a screenshot/image of current view for reports and presentations.

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
