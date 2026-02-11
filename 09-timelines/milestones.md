# Project Milestones

**Project:** Rijksuitgaven.nl V1.0 SaaS Migration
**Created:** 2026-01-20
**Last Updated:** 2026-02-11

---

## Milestone Overview

| Milestone | Target Date | Actual Date | Status |
|-----------|-------------|-------------|--------|
| M1: Infrastructure Setup | 2026-01-26 | 2026-01-24 | ✅ COMPLETE |
| M2: Data Migration | 2026-01-26 | 2026-01-23 | ✅ COMPLETE |
| M3: Core API | 2026-02-02 | 2026-01-26 | ✅ COMPLETE |
| M4: Module Pages | 2026-02-09 | 2026-01-26 | ✅ COMPLETE |
| M5: Search Integration | 2026-02-09 | 2026-01-26 | ✅ COMPLETE |
| M6: Authentication | 2026-02-16 | 2026-02-10 | ✅ COMPLETE |
| M7: Membership Management | 2026-02-16 | 2026-02-11 | ✅ COMPLETE |
| M8: User Migration | 2026-02-18 | - | ⏳ IN PROGRESS |
| M9: Marketing Pages | 2026-02-25 | - | 🔜 PLANNED |
| M10: Launch | 2026-03-04 | - | 🔜 PLANNED |

---

## Milestone Details

### M1: Infrastructure Setup ✅
**Target:** 2026-01-26 | **Actual:** 2026-01-24

**Deliverables:**
- [x] Supabase project created (EU region)
- [x] Railway account and services configured
- [x] Typesense deployed on Railway
- [x] Next.js app deployed to Railway
- [x] Custom domain configured (beta.rijksuitgaven.nl)
- [x] All services connected and communicating

**Status:** Completed 2 days ahead of schedule

---

### M2: Data Migration ✅
**Target:** 2026-01-26 | **Actual:** 2026-01-23

**Deliverables:**
- [x] Database schema created (7 source tables)
- [x] 3.1M rows migrated from MySQL to PostgreSQL
- [x] Data integrity verified (row counts, totals)
- [x] Materialized views created for performance
- [x] Typesense index built (466,827 recipients)
- [x] Entity resolution (451,445 unique recipients)

**Status:** Completed 3 days ahead of schedule

---

### M3: Core API ✅
**Target:** 2026-02-02 | **Actual:** 2026-01-26

**Deliverables:**
- [x] FastAPI backend deployed
- [x] All 7 module endpoints functional
- [x] On-the-fly aggregation working
- [x] Performance <500ms for aggregations
- [x] Module configuration system
- [x] Filter and search endpoints

**Status:** Completed 7 days ahead of schedule

---

### M4: Module Pages ✅
**Target:** 2026-02-09 | **Actual:** 2026-01-26

**Deliverables:**
- [x] DataTable component with TanStack Table
- [x] All 6 module pages (instrumenten, apparaat, inkoop, provincie, gemeente, publiek)
- [x] Integraal (cross-module) page
- [x] Expandable rows with grouping
- [x] Year columns (2016-2024)
- [x] Mobile-friendly tables (sticky columns)

**Status:** Completed 14 days ahead of schedule

---

### M5: Search Integration ✅
**Target:** 2026-02-09 | **Actual:** 2026-01-26

**Deliverables:**
- [x] Global search bar in header
- [x] Autocomplete <25ms (target was <50ms)
- [x] Typesense integration
- [x] Search performance <25ms (target was <100ms)
- [x] CSV export (500 rows max)
- [x] Column customization (UX-005)
- [x] Filter badge count (SR-009)
- [x] Keyboard shortcut "/" (SR-004)
- [x] Cascading filters (all 6 modules) - added 2026-02-08

**Status:** Completed 14 days ahead of schedule, enhanced in Week 5 extension

---

### M6: Authentication ✅
**Target:** 2026-02-16 | **Actual:** 2026-02-10

**Deliverables:**
- [x] Supabase Auth + PKCE flow
- [x] Magic Link authentication
- [x] Email templates (Dutch via Resend SMTP)
- [x] Resend domain + DNS verified (DKIM/SPF/MX)
- [x] Session refresh middleware
- [x] Protected routes (middleware)
- [x] Protected BFF routes (9 routes)
- [x] Backend X-BFF-Secret protection
- [x] Login page + LoginForm component
- [x] Auth callback (PKCE + cross-device)
- [x] Logout handler
- [x] Profile page

**Status:** Completed 6 days ahead of schedule

---

### M7: Membership Management ✅
**Target:** 2026-02-16 | **Actual:** 2026-02-11

**Deliverables:**
- [x] Subscriptions table (030-subscriptions.sql)
- [x] Middleware subscription check
- [x] Grace period system (3d monthly / 14d yearly)
- [x] Status lifecycle (active/grace/expired)
- [x] /verlopen expired page
- [x] /profiel with plan info
- [x] /team admin dashboard
- [x] /team/leden member management
- [x] Admin API (GET/POST/PATCH)
- [x] Admin role check + service role client
- [x] UX-026 profile dropdown

**Pricing:**
- Monthly: €150/mo
- Yearly: €1,500/yr

**Status:** Completed 5 days ahead of schedule

---

### M8: User Migration ⏳
**Target:** 2026-02-18 | **Actual:** In Progress

**Deliverables:**
- [ ] Export ~50 WordPress users from ARMember
- [ ] Import to Supabase (via /team/leden or script)
- [ ] Assign subscription plans (monthly/yearly)
- [ ] Branded magic link email template
- [ ] Branded invite email template
- [ ] "Stuur uitnodiging" button per member
- [ ] Send invite emails to all users

**Status:** Week 7 in progress

---

### M9: Marketing Pages 🔜
**Target:** 2026-02-25 | **Actual:** Planned

**Deliverables:**
- [ ] Homepage
- [ ] /about page
- [ ] /pricing page
- [ ] /privacy page (includes subscription data)
- [ ] /terms page
- [ ] /contact page
- [ ] 404 page (already exists)
- [ ] SEO optimization
- [ ] Lighthouse score >90

**Status:** Planned for Week 8

---

### M10: Launch 🔜
**Target:** 2026-03-04 | **Actual:** Planned

**Deliverables:**
- [ ] Final QA testing
- [ ] Load testing (50 concurrent users)
- [ ] Security audit
- [ ] Rate limiting enabled
- [ ] Monitoring verified
- [ ] Rollback plan documented
- [ ] DNS switch to Railway
- [ ] HTTPS verified
- [ ] Announcement email sent to 50 users
- [ ] WordPress decommissioned

**Status:** Planned for Week 9

---

## Milestone Tracking

### On Schedule / Ahead
- M1-M7: All completed ahead of schedule
- Average: 7.6 days ahead

### At Risk
- None currently

### Blocked
- None currently

---

## Critical Path

**Current Critical Path:**
1. M8: User Migration (Week 7) → M9: Marketing Pages (Week 8) → M10: Launch (Week 9)

**Dependencies:**
- M10 (Launch) depends on M8 (User Migration) and M9 (Marketing Pages)
- M8 depends on branded email templates
- No parallel work blockers

---

**Next Milestone:** M8 - User Migration (2026-02-18 target)
**Days to Launch:** ~14 days (Week 9 target)
