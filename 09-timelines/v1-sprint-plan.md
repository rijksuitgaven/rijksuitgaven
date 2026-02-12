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
| **Trend anomaly indicator** | Red highlight for 50%+ year-over-year changes (UX enhancement, threshold raised from 10% on 2026-02-07) |
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
- Search performance Phase 2 → ✅ **Completed 2026-02-09** (moved from V1.1 to V1.0: Typesense data enrichment)
- Next task → Mobile message banner

**Performance Results (2026-02-03 - Phase 1):**
- Implemented `asyncio.gather()` for parallel query execution
- All modules now respond in ~130-280ms (was ~750ms)
- Commit: `ee055a4`
- Query tuning attempt (Python relevance sorting) reverted - no improvement

**V1.0 Optimization (2026-02-09) — Typesense data enrichment moved from V1.1 to V1.0:**
- ✅ Enriched recipients Typesense collection with year amounts
- ✅ Integraal search uses Typesense hybrid (WHERE IN) instead of regex
- ✅ Production: ~100-150ms warm (was ~200ms regex)
- Commit: `f2a97c1`

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

### Mini Sprint Extension (2026-02-08)

Additional UI/UX work completed after mini sprint was marked complete:

| Task | Status |
|------|--------|
| UX-019: Table Info Popover | ✅ Compact icon+one-liner legend in results toolbar |
| UX-020: Filter Auto-Expand on Column Click | ✅ Filter panel auto-expands when clicking column values |
| UX-021: Cascading Bidirectional Filters | ✅ All 6 modules, counts, parallel queries |
| Inkoop staffel filter 500 error fix | ✅ INTEGER→text cast for asyncpg |
| Staffel popover relocation (UX-013 update) | ✅ Filter label clickable, icon removed from footer |
| Footer email update (info→contact) | ✅ |
| Custom select dropdown (Integraal) | ✅ Replaced native select |
| Data migration validation | ✅ EUR 1.77 trillion across 1.6M rows verified |
| Auth requirements document | ✅ 18 requirements + 4 security, all decisions resolved |
| Full-stack code audit (55 issues) | ✅ 6 critical, 15 high, 23 medium, 18 low — all fixed |
| Security hardening | ✅ SQL injection, error leakage, parameterization, security headers |
| Next.js 16.1.4→16.1.6 update | ✅ 3 high CVEs fixed, turbopack root configured |
| Dependency cleanup | ✅ Removed unused supabase-js, typesense; split dev requirements |
| Error/404 pages + robots.txt | ✅ Branded pages, /api/ and /login disallowed |
| Deep security & vulnerability audit | ✅ 3 teams with adversarial verification, 15 false positives eliminated |
| Security fixes (7) | ✅ CSP/HSTS, body size, value limits, formula injection, error messages |

---

## Week 6: Auth + Membership Management

**Goal:** Magic Link auth, membership management, user migration, protected routes
**Status:** ✅ COMPLETE (2026-02-11) — Auth + membership fully functional
**Requirements:** `02-requirements/auth-requirements.md` (18 requirements, all decisions resolved 2026-02-08)

> **Note:** Overzicht page was originally planned for this week but deferred to V5 (AI Research Mode) on 2026-02-06. V1 expanded row covers the functional need.

### Implementation (2026-02-10) ✅

| Task | Status |
|------|--------|
| Supabase Auth + PKCE flow | ✅ Magic Link working end-to-end |
| Email templates (Dutch) | ✅ Custom template via Resend SMTP |
| Resend domain + DNS (DKIM/SPF/MX) | ✅ All verified |
| Session refresh middleware | ✅ `getUser()` per navigation |
| Protected page routes (middleware) | ✅ Redirects to `/login` |
| Protected BFF routes (9 routes) | ✅ Returns 401 JSON |
| Backend X-BFF-Secret protection | ✅ Shared secret middleware |
| Login page + LoginForm component | ✅ Dutch copy, 60s cooldown |
| Auth callback (PKCE + cross-device) | ✅ Dutch error messages |
| Logout handler | ✅ SignOut + redirect |
| AuthButton in header | ✅ Email + Uitloggen |
| Footer auth state | ✅ Different links for logged in/out |
| Profile page (minimal) | ✅ Email + logout |
| 401 handling in frontend api.ts | ✅ All 4 fetch functions |
| CSP updated for Supabase | ✅ Specific project URL |
| Railway env vars configured | ✅ Supabase keys + BFF_SECRET |

### Membership Management (2026-02-11) ✅

| Task | Status |
|------|--------|
| Subscriptions table (030-subscriptions.sql) | ✅ Executed on production |
| Middleware subscription check + /verlopen redirect | ✅ |
| useSubscription hook (client-side) | ✅ |
| Grace period banner (3d monthly / 14d yearly) | ✅ |
| /verlopen expired page | ✅ |
| /profiel with plan info | ✅ |
| /team admin dashboard | ✅ |
| /team/leden member management | ✅ |
| Admin API (GET/POST/PATCH) | ✅ |
| Admin role check + service role client | ✅ |
| UX-026 profile dropdown | ✅ |
| SUPABASE_SERVICE_ROLE_KEY on Railway | ✅ |

**Membership Details (Backlog):**
- Pricing: Monthly €150/mo, Yearly €1,500/yr
- Grace periods: 3 days (monthly), 14 days (yearly)
- Status: Computed from dates (no cron, no status column)
- Admin pages: /team (dashboard), /team/leden (member management)

**Week 6 Deliverables:**
- [x] Magic Link authentication working (2026-02-10)
- [x] Membership management system (2026-02-11)
- [x] Protected routes enforced (2026-02-10)
- [x] Admin features functional (2026-02-11)

---

## Week 7: Pre-Launch - User Migration & Email Templates

**Goal:** Migrate WordPress users to Supabase, branded emails, final pre-launch tasks
**Status:** IN PROGRESS (Week 7 as of 2026-02-11)

### Day 1-2: Branded Email Templates

| Task | Details | Status |
|------|---------|--------|
| Magic link email template | Branded HTML email for authentication | Backlog |
| Invite email template | Branded HTML email for new member onboarding | Backlog |
| Test both templates | Verify rendering in major email clients | Pending |
| Deploy via Resend | Update Supabase SMTP settings if needed | Pending |

### Day 3-4: WordPress User Migration

| Task | Details | Status |
|------|---------|--------|
| Export WordPress users | ~50 users from ARMember plugin | Pending |
| Parse user data | Extract email, name, subscription dates | Pending |
| Import to Supabase | Via /team/leden or batch script | Pending |
| Set subscription plans | Monthly/yearly based on WP data | Pending |
| Verify all imports | Check subscriptions table accuracy | Pending |

### Day 5: Invite System Implementation

| Task | Details | Status |
|------|---------|--------|
| "Stuur uitnodiging" button | Per-member button in /team/leden | Backlog |
| Invite API endpoint | POST /api/admin/members/:id/invite | Pending |
| Email trigger | Send branded invite email via Resend | Pending |
| Test invite flow | End-to-end verification | Pending |

### Day 6-7: Final Pre-Launch Tasks

| Task | Details | Status |
|------|---------|--------|
| UX-025: Feedback button | Persistent button for user feedback | Backlog |
| 404 page | Branded not-found page | Completed (exists) |
| Rate limiting (backend) | Add rate limiting middleware | Backlog |
| Final QA pass | Test all critical user flows | Pending |

**Week 7 Deliverables:**
- [x] Branded magic link email template (2026-02-11, `docs/email-templates/magic-link.html`)
- [x] Branded invite email template (2026-02-11, `docs/email-templates/invite-user.html`)
- [ ] ~50 WordPress users migrated to Supabase
- [x] Invite system functional (2026-02-11)
- [x] UX-025 feedback button (2026-02-11)
- [ ] Exact phrase search (`"rode kruis"`) — moved from V1.1 to V1.0
- [ ] Wildcard syntax (`prorail*`) — moved from V1.1 to V1.0
- [ ] `contacts` table + admin UI at `/team/contacten` (prospects + subscribers)
- [ ] Resend Audience sync (contacts → Resend on create/update)
- [ ] Resend Broadcasts setup (campaign template, test send)
- [ ] Migrate Mailster contacts into `contacts` table
- [ ] Rate limiting on backend (Cloudflare)
- [ ] All systems QA verified

---

## Week 8: Marketing Pages & Final Polish

**Goal:** All public pages live, final visual polish
**Status:** PLANNED (starts 2026-02-17)

### Day 1-2: Homepage

| Section | Details | Status |
|---------|---------|--------|
| Hero | Port from WordPress (same copy) | Pending |
| Value props | 3 cards | Pending |
| Sample data | Live table preview | Pending |
| Features grid | 6 features | Pending |
| Pricing | €150/month or €1,500/year | Pending |
| CTA | Login / Demo request | Pending |

### Day 3-4: Support & Legal Pages

| Page | Details | Status |
|------|---------|--------|
| `/about` | Mission, data sources | Pending |
| `/contact` | Contact form (Resend) | Pending |
| `/pricing` | Pricing details, FAQ | Pending |
| `/privacy` | Privacy policy + subscription data clause | Pending |
| `/terms` | Terms of service | Pending |

### Day 5-6: SEO & Final Polish

| Task | Details | Status |
|------|---------|--------|
| SEO | Meta tags, Open Graph, structured data | Pending |
| Footer updates | Ensure all links correct | Completed (footer exists) |
| Favicon | Brand icon | Pending |
| Cross-browser test | Chrome, Firefox, Safari, Edge | Pending |
| Mobile responsiveness | Test on real devices | Pending |

### Day 7: Performance & Accessibility

| Task | Details | Status |
|------|---------|--------|
| Lighthouse audit | Score >90 all pages | Pending |
| Accessibility check | WCAG 2.1 AA compliance | Pending |
| Performance test | <1s page load verified | Pending |
| Documentation update | Update FRONTEND-DOCUMENTATION.md | Pending |

**Week 8 Deliverables:**
- [ ] Homepage live
- [ ] All legal pages (privacy, terms)
- [ ] Contact form working
- [ ] SEO optimized
- [ ] Lighthouse score >90
- [ ] Accessibility verified

---

## Week 9: Launch

**Goal:** Go live with V1.0
**Status:** PLANNED (starts 2026-02-24)

### Day 1-2: Final Testing & QA

| Test | Details | Status |
|------|---------|--------|
| Functional | All features work end-to-end | Pending |
| Performance | Search <25ms, page load <1s | Pending |
| Mobile | Test on phone/tablet | Pending |
| Auth flow | Magic Link complete flow | Pending |
| Membership | Subscription lifecycle (active/grace/expired) | Pending |
| Admin features | /team and /team/leden functionality | Pending |
| Edge cases | Empty results, long text, special characters | Pending |
| Load testing | 50 concurrent users simulation | Pending |

### Day 3-4: Security & Infrastructure Final Check

| Task | Details | Status |
|------|---------|--------|
| Security audit | RLS policies, no data leaks | Pending |
| Rate limiting | Backend rate limiting enabled | Pending |
| Error logging | Railway logs verified | Completed |
| Backups | Supabase daily backups confirmed | Pending |
| Monitoring | Railway + Supabase dashboards | Completed |
| DNS TTL | Lower to 300s for quick cutover | Pending |

### Day 5: Beta Testing

| Task | Details | Status |
|------|---------|--------|
| Beta invite | 3-5 testers on beta.rijksuitgaven.nl | Pending |
| Collect feedback | Critical issues only | Pending |
| Fix blockers | Resolve any launch-blocking issues | Pending |
| Final smoke test | Login → search → export flow | Pending |

### Day 6: Launch Preparation

| Task | Details | Status |
|------|---------|--------|
| Draft announcement email | "Welcome to new platform" | Pending |
| Verify all 50 users | Check subscriptions table | Pending |
| Rollback plan | Document DNS rollback steps | Pending |
| Launch checklist | Final go/no-go review | Pending |

### Day 7: Go Live

| Task | Details | Status |
|------|---------|--------|
| DNS switch | `rijksuitgaven.nl` CNAME → Railway | Pending |
| Verify HTTPS | SSL certificate working | Pending |
| Smoke test | Login, search, one module end-to-end | Pending |
| Send announcement | Email 50 users with Magic Link instructions | Pending |
| Monitor actively | Watch Railway + Supabase for issues | Pending |

### Post-Launch (Week 10+)

| Task | Details | Timeline |
|------|---------|----------|
| Monitor stability | Watch for bugs, performance issues | Days 1-7 |
| User feedback | Collect and prioritize issues | Days 1-14 |
| WordPress shutdown | Decommission old system | Week 11 |
| V1.1 planning | Plan next iteration | Week 10 |

**Week 9 Deliverables:**
- [ ] All tests passing
- [ ] Performance targets met (search <25ms, page <1s)
- [ ] 50 users migrated and notified
- [ ] V1.0 LIVE on rijksuitgaven.nl
- [ ] Monitoring active
- [ ] Rollback plan ready

---

## V1.0 Launch Checklist

**MUST BE COMPLETE BEFORE DNS SWITCH:**

### User Migration
- [ ] All 50 WordPress users migrated to Supabase
- [ ] Subscription plans assigned (monthly/yearly)
- [ ] Admin roles configured
- [ ] Invite emails sent to all users

### Feature Completeness
- [ ] All 7 modules functional (instrumenten, apparaat, inkoop, provincie, gemeente, publiek, integraal)
- [ ] Search <25ms (Typesense verified)
- [ ] Autocomplete working
- [ ] Cascading filters on all modules
- [ ] CSV export (500 rows)
- [ ] Magic Link authentication
- [ ] Membership management (/team, /team/leden)
- [ ] Profile dropdown (UX-026)
- [ ] Feedback button (UX-025)
- [ ] Exact phrase search + wildcard syntax
- [ ] Contacts table + admin UI (`/team/contacten`)
- [ ] Resend Broadcasts (contacts synced, campaign template, test send verified)

### Marketing Pages
- [ ] Homepage live
- [ ] /about page
- [ ] /pricing page
- [ ] /privacy page (includes subscription data)
- [ ] /terms page
- [ ] /contact page
- [ ] 404 page

### Technical Readiness
- [ ] Rate limiting enabled on backend
- [ ] Security headers (CSP, HSTS) configured
- [ ] RLS policies verified
- [ ] Error monitoring active
- [ ] Backup strategy verified
- [ ] Performance tested (load testing)
- [ ] DNS TTL lowered (300s)
- [ ] Rollback plan documented

### Communication
- [ ] Announcement email drafted
- [ ] Support email ready (contact@rijksuitgaven.nl)
- [ ] Known issues documented

### Monitoring & Rollback
- [ ] Railway dashboard accessible
- [ ] Supabase dashboard accessible
- [ ] Typesense dashboard accessible
- [ ] Rollback DNS steps documented
- [ ] Old WordPress kept running for 1 week

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

**Document Version:** 1.4
**Last Updated:** 2026-02-11

---

## Project Status Summary

| Week | Dates | Status | Key Deliverables |
|------|-------|--------|------------------|
| Week 1 | 2026-01-20–26 | ✅ COMPLETE | Data migration (3.1M rows), Typesense (<25ms), Next.js deployed |
| Week 2 | 2026-01-27–02 | ✅ COMPLETE | All 7 API endpoints, materialized views, <500ms queries |
| Week 3 | 2026-02-03–09 | ✅ COMPLETE | DataTable, expandable rows, filters, autocomplete |
| Week 4 | 2026-02-03–09 | ✅ COMPLETE | All 6 module pages + integraal, mobile-friendly |
| Week 5 | 2026-02-03–09 | ✅ COMPLETE | Global search, CSV export, column customization, keyboard shortcuts |
| Mini Sprint | 2026-01-29–02-09 | ✅ COMPLETE | Security fixes, cascading filters, UX-012–021, Typesense enrichment |
| Week 6 | 2026-02-10–11 | ✅ COMPLETE | Auth (Magic Link), membership management, UX-026 profile dropdown |
| **Week 7** | **2026-02-12–18** | **IN PROGRESS** | User migration, branded emails, invite system, feedback button |
| Week 8 | 2026-02-19–25 | PLANNED | Marketing pages, SEO, final polish |
| Week 9 | 2026-02-26–04 | PLANNED | Final testing, launch |

**V1.0 Progress:** ~90% complete | **Next: Week 7 user migration & email templates**

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
