# V1.0 Sprint Plan

**Created:** 2026-01-20
**Duration:** 9 weeks (was 8, added UX/UI sprint)
**Working Mode:** Solo founder + AI (few hours daily)
**Start Date:** 2026-01-21

---

## Working Assumptions

| Factor | Value |
|--------|-------|
| Daily dedication | 2-4 hours |
| Decision speed | Immediate (no approval delays) |
| Execution speed | Same-day (copy-paste commands) |
| AI role | Writes all code, provides commands |
| Human role | Executes commands, tests, decides |

---

## Pre-Sprint: Account Setup (Day 0)

**Duration:** 1-2 hours
**Blocker:** Must complete before Week 1

| Task | Action | Time |
|------|--------|------|
| Create Supabase account | https://supabase.com → Sign up → Create project (EU region) | 10 min |
| Create Railway account | https://railway.app → Sign up | 5 min |
| Note credentials | Save project URLs, API keys in password manager | 5 min |
| Share with Claude | Provide project URLs (not secrets) for configuration | 5 min |

**Deliverable:** Supabase project URL, Railway account ready

---

## Week 1: Infrastructure + Data Migration

**Goal:** Data in Supabase, searchable in Typesense, staging site accessible

### Day 0: DNS Setup (Before Starting)

| Task | Details |
|------|---------|
| Add custom domain in Railway | `beta.rijksuitgaven.nl` → Railway provides CNAME target |
| Add CNAME record in DNS | `beta` → Railway-provided target (e.g., `j65ghs38.up.railway.app`) |
| Add A record | `nieuws.rijksuitgaven.nl` → current server IP |
| Verify propagation | `dig beta.rijksuitgaven.nl` or online DNS checker |

**Note:** Must add custom domain in Railway FIRST, then use the CNAME target Railway provides.

**nieuws subdomain:** For Mailster/Mailgun email system. Keep WordPress running on current server for marketing emails only.

### Day 1-2: Supabase Setup

| Task | Details |
|------|---------|
| Create database schema | Claude provides SQL, you execute in Supabase SQL editor |
| Tables to create | `apparaat`, `inkoop`, `instrumenten`, `provincie`, `publiek`, `stad`, `universal_search`, `universal_search_source` |
| Enable pgvector | For V2.0 readiness (empty, just enable extension) |
| Set up Row Level Security | Basic policies for authenticated users |

### Day 3-4: Data Migration

| Task | Details |
|------|---------|
| Export MySQL data | CSV export of source tables (not pivot tables) |
| Transform if needed | Claude provides scripts for any data cleaning |
| Import to Supabase | Use Supabase CSV import or SQL INSERT |
| Verify row counts | Compare MySQL vs Supabase counts |

### Day 5-6: Typesense Setup

| Task | Details |
|------|---------|
| Deploy Typesense on Railway | Claude provides railway.json config |
| Create search collections | One per module + universal |
| Build initial index | Sync from Supabase → Typesense |
| Test search | Verify <100ms response |

### Day 7: Next.js Project

| Task | Details |
|------|---------|
| Create Next.js app | `npx create-next-app@latest rijksuitgaven-v2` |
| Install dependencies | Supabase client, Typesense client, shadcn/ui, Tremor, TanStack |
| Project structure | Claude provides folder structure |
| Deploy to Railway | Basic "Hello World" deployment |

**Week 1 Deliverables:**
- [x] Supabase with all source data (3.1M rows migrated 2026-01-23)
- [x] Typesense with search index (466,827 recipients + 9,628 apparaat, <25ms search)
- [x] Next.js deployed on Railway (2026-01-24: `rijksuitgaven-production.up.railway.app`)
- [x] All services connected (Supabase, Typesense, TanStack, shadcn/ui installed)

---

## Week 2: Backend API + Data Layer

**Goal:** API endpoints for all modules with on-the-fly aggregation

### Day 1-2: API Structure

| Task | Details |
|------|---------|
| FastAPI setup | Python backend (decided 2026-01-21) |
| Base endpoints | `/api/v1/modules/{module}` |
| Query parameters | filters, sort, pagination, grouping |

### Day 3-4: Aggregation Queries

| Task | Details |
|------|---------|
| Single-view queries | GROUP BY with year columns |
| Expandable row data | Detail query for expansion |
| Performance test | Ensure <500ms for aggregations |

### Day 5-7: Module Endpoints

| Endpoint | Table |
|----------|-------|
| `/api/v1/instrumenten` | `instrumenten` |
| `/api/v1/apparaat` | `apparaat` |
| `/api/v1/inkoop` | `inkoop` |
| `/api/v1/provincie` | `provincie` |
| `/api/v1/gemeente` | `gemeente` |
| `/api/v1/publiek` | `publiek` |
| `/api/v1/integraal` | `universal_search` + `universal_search_source` |

**Week 2 Deliverables:**
- [x] All 7 module API endpoints working (2026-01-26)
- [x] On-the-fly aggregation tested (materialized views for performance)
- [x] <500ms response times verified (see performance results below)

**Performance Results (2026-01-26, after pg_trgm + entity resolution):**
| Module | Basic Query | Search (3+ chars) | Status |
|--------|-------------|-------------------|--------|
| instrumenten | 114-204ms | 237ms | ✅ |
| apparaat | 172ms | 215ms | ✅ |
| inkoop | 180-480ms | 175-312ms | ✅ |
| provincie | 196ms | 228ms | ✅ |
| gemeente | 191ms | 598ms | ✅ |
| publiek | 222ms | 247ms | ✅ |
| integraal | 190-380ms | 181-226ms | ✅ |

**Optimizations applied:** Materialized views, pg_trgm + GIN indexes, source table indexes, entity resolution (451,445 unique recipients).

---

## Week 3: Core UI Components

**Goal:** Reusable table component with single-view architecture

### Day 1-2: Table Component

| Component | Features |
|-----------|----------|
| `DataTable` | TanStack Table base |
| Year columns | 2016-2024 always visible |
| Totaal column | Row sum |
| Sorting | Click column headers |
| Pagination | 25/50/100 rows per page |
| **Trend anomaly indicator** | Red highlight for 10%+ year-over-year changes (UX enhancement) |
| **Hover tooltip** | Shows exact % change vs previous year |

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md` (Enhancement 5)

### Day 3-4: Expandable Rows

| Feature | Details |
|---------|---------|
| Expand icon | ▶ / ▼ toggle |
| **Prominent context** | Regeling as headline, breadcrumb hierarchy (UX enhancement) |
| **Cross-module indicator** | "Ook in: Instrumenten, Publiek" when recipient appears elsewhere |
| Sub-rows | Grouped by user-selected field |
| Grouping selector | Dropdown: Regeling, Artikel, Instrument, etc. |
| Lazy loading | Fetch detail data on expand |

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md`

### Day 5-7: Filter Panel

| Filter | Type |
|--------|------|
| Text search | Typesense instant search |
| Year range | Slider or dropdown |
| Amount range | Min/max input |
| Module-specific | Varies per module |
| Clear all | Reset button |

**Week 3 Deliverables:**
- [x] DataTable component working (2026-01-26)
- [x] Expandable rows with grouping (2026-01-26)
- [x] Filter panel functional (2026-01-26)
- [x] Real-time filter application (2026-01-26)

---

## Week 4: Module Pages

**Goal:** All 7 module pages functional

### Day 1-3: Module Pages

| Page | Route | Special Features |
|------|-------|------------------|
| Instrumenten | `/instrumenten` | Regeling, Ontvanger, Artikel filters |
| Apparaat | `/apparaat` | Kostensoort (no Ontvanger) |
| Inkoop | `/inkoop` | Leverancier, Ministerie, Categorie |
| Provincie | `/provincie` | Provincie filter |
| Stad (Gemeente) | `/gemeente` | Stad filter |
| Publiek | `/publiek` | Source (RVO/COA/NWO), Regeling |

### Day 4-5: Cross-Module (Integraal) - Landing Page

| Feature | Details |
|---------|---------|
| Route | `/integraal` (also `/` for logged-in users) |
| **Tab position** | First tab (UX enhancement - users land here) |
| Default view | Random recipients with 4+ years of data |
| Results | Recipient → Module breakdown |
| Click behavior | Navigate to module with filter |
| Totals row | Grand total footer |

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md` (Enhancement 7)

### Day 6-7: Styling & Responsive

| Task | Details |
|------|---------|
| Consistent styling | shadcn/ui theme |
| Mobile responsive | Horizontal scroll, fixed first column |
| Loading states | Skeletons while fetching |
| Error states | User-friendly error messages |

**Week 4 Deliverables:**
- [x] All 6 module pages working (2026-01-26)
- [x] Integraal (cross-module) page working (2026-01-26)
- [x] Consistent styling across all pages (2026-01-26)
- [x] Mobile-friendly tables (2026-01-26: sticky columns)

---

## Week 5: Search + Navigation

**Goal:** Global search bar, autocomplete, navigation

### Day 1-2: Global Search Bar (Enhanced - UX Decision)

| Feature | Details |
|---------|---------|
| Position | Header, always visible |
| Autocomplete | <50ms suggestions from Typesense |
| **Indexed fields** | Ontvanger + Omschrijving, Regeling, Beleidsterrein (UX enhancement) |
| **Grouped results** | Keywords section + Recipients section |
| Click keyword | Navigate to module with search filter applied |
| Click recipient | Navigate to recipient detail/filtered results |
| **Cross-module results** | Always show "Ook in:" with counts above table (UX enhancement) |

**UX Reference:** See `docs/plans/2026-01-21-v1-search-ux-enhancement.md` (Enhancements 1 & 6)

**Why:** Users think theme-first ("wolf protection") but system was recipient-first. Now keywords like "wolfwerend" appear in autocomplete. Cross-module counts help users discover data across all sources.

### Day 3-4: Header Navigation

| Element | Details |
|---------|---------|
| Logo | Link to Overzicht (logged in) or Home (logged out) |
| Nav items | Overzicht, Integraal, Modules dropdown |
| Modules dropdown | All 6 modules |
| Auth buttons | Login / Account |

### Day 5-7: Enhanced Filters

| Enhancement | Details |
|-------------|---------|
| URL state | Basic filter state in URL for sharing |
| Filter persistence | Remember last used filters (localStorage) |
| Quick filters | Common presets per module |
| CSV export button | Download visible results (max 500) |

**Week 5 Deliverables:**
- [x] Global search with autocomplete (2026-01-26: Typesense integration, <50ms)
- [x] Header navigation complete (2026-01-26: modules dropdown, mobile menu)
- [x] URL sharing (basic) (2026-01-26: filters in URL via module-page)
- [x] CSV export working (2026-01-26: max 500 rows, Dutch format)
- [x] Column customization (2026-01-26: UX-005, "Kolommen" button with localStorage)
- [x] Filter badge count (2026-01-26: SR-009, shows active filter count)
- [x] Keyboard shortcut "/" (2026-01-26: SR-004, focus search)
- [x] "Did you mean" suggestions (2026-01-26: fuzzy matches when no results)

---

## Mini Sprint: UI/UX Polish (Before Week 6)

**Goal:** Complete all UI/UX refinements before moving to auth and launch prep
**Started:** 2026-01-29
**Completed:** 2026-02-06
**Status:** ✅ COMPLETE

### Completed Work

#### Session 1: Code Review + Security (2026-01-29) ✅

| Task | Status |
|------|--------|
| Golden Rules added to CLAUDE.md | ✅ |
| Typesense API key moved to backend proxy | ✅ CRITICAL FIX |
| XSS risk in CSV filename sanitized | ✅ CRITICAL FIX |
| TypeScript `any` types fixed | ✅ |
| Accessibility labels added | ✅ |
| UX-002 randomization implemented | ✅ |
| Random sort performance optimized | ✅ (~50ms vs 3000ms) |

#### Session 2: UI/UX Logic Fixes + Code Audit (2026-01-30) ✅

| Task | Status |
|------|--------|
| **BUG: Limit dropdown causes error** | ✅ Fixed - backend `le=100` → `le=500` |
| Code audit (backend + frontend) | ✅ 20 backend + 11 frontend issues identified |
| Backend: Connection pool shutdown | ✅ Added FastAPI lifespan handler |
| Frontend: AbortController fixes | ✅ Prevents race conditions |
| Frontend: Console statements removed | ✅ Production-ready |
| Frontend: Accessibility (aria-live) | ✅ Screen reader support for loaders |

#### Session 3-6: Search Speed Optimization (2026-01-31) ✅

| Task | Status |
|------|--------|
| Word-boundary search (prevents substring false positives) | ✅ |
| Hybrid Typesense → PostgreSQL search | ✅ 5-10s → 750ms |
| "Gevonden in" column via Typesense highlights | ✅ 0ms overhead |
| Golden Rule #7: Cross-module consistency | ✅ |

### Remaining UI/UX Tasks

| Task | Priority | Status |
|------|----------|--------|
| **Clickable hyperlinks (UX-007)** | **HIGH** | ✅ Completed 2026-02-04 |
| **Hard navigation (UX-008)** | **HIGH** | ✅ Completed 2026-02-04 |
| **Mobile message banner (UX-003)** | **HIGH** | ✅ Completed 2026-02-05 |
| **Filter performance (indexes)** | **HIGH** | ✅ Completed 2026-02-05 (70% faster) |
| **Search performance optimization** | **HIGH** | ✅ Phase 1 done (~130-280ms), Phase 2 deferred to V1.1 |
| Overzicht page design + implementation | ~~HIGH~~ | ✅ Deferred to V5 (2026-02-06) - V1 expanded row suffices |
| **UX-010: Google search link** | **HIGH** | ✅ Completed 2026-02-06 |
| **UX-011: Module-specific footer text** | **MEDIUM** | ✅ Completed 2026-02-06 |
| **Site-wide footer component** | **HIGH** | ✅ Completed 2026-02-06 |
| **Code audit (security, accessibility)** | **HIGH** | ✅ Completed 2026-02-06 |
| **Data availability indicators (UX-012)** | **HIGH** | ✅ Implemented 2026-02-07 (design 02-06, live 02-07) |
| Typography/spacing consistency audit | LOW | ❌ Deferred (post-V1.0) |
| Mobile responsiveness audit | LOW | ❌ Deferred (post-V1.0) |

**Decisions (2026-02-03):**
- Mobile responsiveness audit → SKIP for V1.0, add mobile message instead
- Search performance Phase 1 → ✅ Solved via parallel queries (750ms → ~200ms avg)
- Search performance Phase 2 → **Deferred to V1.1** (Typesense data enrichment)
- Next task → Mobile message banner

**Performance Results (2026-02-03 - Phase 1):**
- Implemented `asyncio.gather()` for parallel query execution
- All modules now respond in ~130-280ms (was ~750ms)
- Commit: `ee055a4`
- Query tuning attempt (Python relevance sorting) reverted - no improvement

**V1.1 Optimization Path:**
- Store year amounts in Typesense documents
- Skip PostgreSQL entirely for search results
- Target: ~25-50ms (current: ~130-280ms)

### Mini Sprint Deliverables
- [x] Security fixes complete
- [x] Code audit issues resolved
- [x] Search performance acceptable (~130-280ms)
- [x] Overzicht page → Deferred to V5 (V1 expanded row suffices)
- [x] Mobile message banner (UX-003)
- [x] Google search link (UX-010)
- [x] Module-specific footer text (UX-011)
- [x] Site-wide footer component
- [x] Data availability indicators (UX-012): designed 02-06, implemented + deployed 02-07
- [x] Ready for Week 6 (Auth)

---

## Week 6: Auth + Overzicht

**Goal:** Magic Link auth, user migration, protected routes
**Status:** ⏳ READY TO START (Mini Sprint complete 2026-02-06)

### Day 1-2: Supabase Auth Setup

| Task | Details |
|------|---------|
| Enable Magic Link | Supabase dashboard → Auth → Providers |
| Email templates | Customize login email (Dutch) |
| Session config | Set session duration |
| Protected routes | Middleware for `/app/*` routes |

### Day 3-4: User Migration

| Task | Details |
|------|---------|
| Export WordPress emails | 50 users from `4yi3uwye_users` |
| Import to Supabase | Auth → Users → Import |
| Test Magic Link | Send test login to yourself |
| Announcement email | Draft "Welcome to new platform" email |

**Week 6 Deliverables:**
- [ ] Magic Link authentication working
- [ ] 50 users migrated
- [ ] Protected routes enforced

---

## Week 7: UX/UI Optimization

**Goal:** Polish all interfaces with senior UX/UI specialist review

### Day 1-2: UX Audit

| Task | Details |
|------|---------|
| Heuristic evaluation | Review all pages against UX best practices |
| User flow analysis | Map critical paths, identify friction points |
| Accessibility check | WCAG 2.1 AA compliance, keyboard navigation |
| Mobile UX review | Touch targets, scroll behavior, responsive issues |

### Day 3-4: Visual Design Polish

| Task | Details |
|------|---------|
| Typography audit | Consistent font sizes, line heights, spacing |
| Color consistency | Brand colors applied correctly everywhere |
| Component alignment | Grid alignment, padding/margin consistency |
| Icon/visual consistency | Consistent icon style, visual weight |
| Empty/loading states | Polish skeleton loaders, empty state messages |

### Day 5-6: Interaction Refinement

| Task | Details |
|------|---------|
| Micro-interactions | Hover states, focus states, transitions |
| Feedback clarity | Loading indicators, success/error messages |
| Table UX | Column widths, row heights, click targets |
| Filter UX | Clear affordances, reset behavior, state indication |
| Navigation flow | Breadcrumbs, back navigation, deep linking |

### Day 7: Final Polish

| Task | Details |
|------|---------|
| Cross-browser testing | Chrome, Firefox, Safari, Edge |
| Responsive breakpoints | 320px, 768px, 1024px, 1440px |
| Performance perception | Perceived speed improvements |
| Documentation | Update FRONTEND-DOCUMENTATION.md with changes |
| **Railway private networking** | Configure internal network between services |

**Week 7 Deliverables:**
- [ ] UX audit completed with findings documented
- [ ] All critical UX issues resolved
- [ ] Visual design consistent across all pages
- [ ] Accessibility basics verified (WCAG AA)
- [ ] Mobile experience polished
- [ ] Railway private networking configured

---

## Week 8: Marketing Pages

**Goal:** All public pages live

### Day 1-2: Homepage

| Section | Details |
|---------|---------|
| Hero | Port from WordPress (same copy) |
| Value props | 3 cards |
| Sample data | Live table preview |
| Features grid | 6 features |
| Pricing | €150/month |
| CTA | Demo request |

### Day 3-4: Support Pages

| Page | Details |
|------|---------|
| `/support` | Index with search |
| `/support/[slug]` | Markdown articles |
| Content | Getting started, FAQ, Data sources, Export guide |

### Day 5-6: Other Pages

| Page | Details |
|------|---------|
| `/about` | Mission, data sources |
| `/contact` | Contact form (Resend/Postmark) |
| `/pricing` | Pricing details, FAQ |
| `/demo` | Calendly embed |
| `/terms`, `/privacy` | Legal pages |

### Day 7: Polish

| Task | Details |
|------|---------|
| SEO | Meta tags, Open Graph |
| Footer | Links, social, legal |
| 404 page | Custom not found |
| Favicon | Brand icon |

**Week 8 Deliverables:**
- [ ] Homepage live
- [ ] All support pages
- [ ] Contact form working
- [ ] All marketing pages complete

---

## Week 9: Launch

**Goal:** Go live with V1.0

### Day 1-2: Testing

| Test | Details |
|------|---------|
| Functional | All features work end-to-end |
| Performance | Search <100ms, page load <1s |
| Mobile | Test on phone/tablet |
| Auth flow | Magic Link complete flow |
| Edge cases | Empty results, long text, special characters |

### Day 3-4: Performance & Security

| Task | Details |
|------|---------|
| Lighthouse audit | Score >90 |
| Security review | RLS policies, no data leaks |
| Error logging | Railway built-in logs (Sentry = backlog) |
| Analytics | Skip for launch (backlog item) |

### Day 5-6: Beta Testing + Cutover Prep

| Task | Details |
|------|---------|
| Beta testing | 5 testers on beta.rijksuitgaven.nl |
| Fix critical issues | Resolve any blockers |
| Import 50 users | All user emails in Supabase Auth |
| Draft announcement | "Welcome to new platform" email |
| Lower DNS TTL | If not already low (speeds up switch) |

### Day 6-7: Go Live

| Task | Details |
|------|---------|
| DNS switch | `rijksuitgaven.nl` A/CNAME → Railway |
| Verify HTTPS | SSL certificate working |
| Smoke test | Login, search, one module end-to-end |
| Send announcement | Email 50 users with Magic Link instructions |
| Monitor | Watch for issues first 24-48 hours |

### Post-Launch (Week 10+)

| Task | Details |
|------|---------|
| Monitor | 1-2 weeks stability check |
| WordPress | Shut down after stable period |
| Cleanup | Remove beta subdomain or keep for future testing |

**Week 9 Deliverables:**
- [ ] All tests passing
- [ ] Performance targets met
- [ ] 50 users notified and migrated
- [ ] V1.0 LIVE

---

## Daily Workflow

```
Morning (or whenever you start):
1. Claude: /startday → get today's tasks
2. You: Execute first task
3. Claude: Provide code/commands
4. You: Copy-paste, execute, report result
5. Repeat until done or blocked

End of session:
1. Claude: /closeday → update logs
2. Note any blockers for tomorrow
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Stuck on technical issue | Ask Claude for alternative approach |
| Data migration issues | Keep MySQL running until verified |
| Performance problems | Typesense handles search; optimize queries |
| User complaints | Have support email ready; respond quickly |
| Scope creep | Refer to this plan; add to backlog, not V1.0 |

---

## Post-Launch (Week 9+)

After V1.0 is stable:
1. Monitor for bugs (1-2 weeks)
2. Gather user feedback
3. Plan V2.0 Research Mode
4. Begin V2.0 development (+12 weeks)

---

## Success Criteria Reminder

| Metric | Target |
|--------|--------|
| Search response | <100ms |
| Autocomplete | <50ms |
| Page load | <1s |
| Infrastructure cost | <€180/month |
| All modules | 7 working |
| Users migrated | 50 |

---

**Document Version:** 1.3
**Last Updated:** 2026-02-07

---

## UX Enhancements Summary

Additional effort from UX brainstorm session (14-23 hours total, spread across Weeks 3-5):

| Enhancement | Week | Hours |
|-------------|------|-------|
| Enhanced autocomplete | Week 5 | 4-8 |
| Cross-module indicator (rows) | Week 3 | 3-5 |
| Prominent expanded context | Week 3 | Design only |
| Trend anomaly indicator | Week 3 | 3-4 |
| Cross-module search results | Week 5 | 4-6 |
| Integraal as landing | Week 4 | Config only |

**Reference:** `docs/plans/2026-01-21-v1-search-ux-enhancement.md`
