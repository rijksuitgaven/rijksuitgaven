# Project Phases

**Project:** Rijksuitgaven.nl V2.0 SaaS Migration
**Created:** 2026-01-20
**Last Updated:** 2026-02-11

---

## Phase Overview

| Phase | Duration | Status | Completion |
|-------|----------|--------|------------|
| Phase 1: Data Migration | Weeks 1-2 | ✅ COMPLETE | 2026-01-26 |
| Phase 2: Search Platform | Weeks 3-5 | ✅ COMPLETE | 2026-02-09 |
| Phase 3: Auth + Membership | Week 6 | ✅ COMPLETE | 2026-02-11 |
| Phase 4: Pre-Launch | Weeks 7-8 | ⏳ IN PROGRESS | Target: 2026-02-25 |
| Phase 5: Launch | Week 9 | 🔜 PLANNED | Target: 2026-03-04 |

**Overall Progress:** ~90% complete (4 of 5 phases complete)

---

## Phase Details

### Phase 1: Data Migration ✅
**Duration:** Weeks 1-2 (2026-01-20 to 2026-01-26)
**Status:** COMPLETE (2026-01-26)

**Objective:** Migrate all data from WordPress + MySQL to Next.js + Supabase + Typesense infrastructure

**Key Activities:**
1. Infrastructure setup (Supabase, Railway, Typesense)
2. Database schema design (7 source tables)
3. Data migration (3.1M rows)
4. Materialized views for performance
5. Typesense index building
6. Entity resolution

**Deliverables:**
- [x] Supabase project configured (EU region)
- [x] Railway services deployed (Next.js, FastAPI, Typesense)
- [x] 3.1M rows migrated with integrity verified
- [x] 466,827 recipients indexed in Typesense
- [x] 451,445 unique recipients after entity resolution
- [x] All services connected via BFF architecture

**Performance Results:**
- Typesense search: <25ms (target was <100ms)
- Materialized view queries: 114-480ms
- Infrastructure cost: €87-120/month (target <€180)

**Lessons Learned:**
- Materialized views critical for aggregation performance
- pg_trgm + GIN indexes essential for text search
- Entity resolution prevents duplicate results

---

### Phase 2: Search Platform ✅
**Duration:** Weeks 3-5 (2026-01-27 to 2026-02-09)
**Status:** COMPLETE (2026-02-09)

**Objective:** Build complete search platform with all 7 modules, filters, and UX features

**Key Activities:**
1. Core UI components (DataTable, expandable rows)
2. All 7 module pages
3. Global search + autocomplete
4. Filter system (cascading bidirectional filters)
5. CSV export
6. UX enhancements (26 features)
7. Security audit and hardening

**Deliverables:**
- [x] DataTable component with TanStack Table
- [x] All 6 module pages + integraal (cross-module)
- [x] Global search bar with autocomplete
- [x] Cascading filters on all modules
- [x] CSV export (500 rows max)
- [x] Column customization (UX-005)
- [x] Filter badge count (SR-009)
- [x] Keyboard shortcuts (SR-004)
- [x] Data availability indicators (UX-012)
- [x] Betalingen filter (UX-022)
- [x] Security headers (CSP, HSTS)
- [x] SQL injection prevention
- [x] Error handling hardening

**UX Features Implemented:**
- UX-001 through UX-021 (21 features)
- 4 security requirements
- Mobile message banner
- Google search link
- Module-specific footer text
- Site-wide footer component

**Performance Optimizations:**
- Parallel queries via asyncio.gather (~130-280ms)
- Typesense hybrid search (100-150ms warm)
- Word-boundary search for accuracy
- Materialized views for aggregations

**Mini Sprint Extension (2026-01-29 to 2026-02-09):**
- Security fixes (7 critical issues)
- Code audit (55 issues resolved)
- Typesense data enrichment
- Filter performance (70% faster)

---

### Phase 3: Auth + Membership ✅
**Duration:** Week 6 (2026-02-10 to 2026-02-11)
**Status:** COMPLETE (2026-02-11)

**Objective:** Implement Magic Link authentication and membership management system

**Key Activities:**
1. Supabase Auth integration (PKCE flow)
2. Subscription management system
3. Admin features
4. Protected routes
5. Profile dropdown

**Authentication Deliverables:**
- [x] Supabase Auth + PKCE flow
- [x] Magic Link authentication
- [x] Email templates (Dutch via Resend SMTP)
- [x] Resend domain + DNS verified
- [x] Session refresh middleware
- [x] Protected routes (pages + BFF + backend)
- [x] Login page + LoginForm component
- [x] Auth callback (PKCE + cross-device)
- [x] Logout handler
- [x] Profile page

**Membership Management Deliverables:**
- [x] Subscriptions table (user_id, email, name, org, plan, role, dates)
- [x] Status lifecycle (active → grace → expired)
- [x] Grace periods (3d monthly / 14d yearly)
- [x] Middleware subscription check
- [x] /verlopen expired page
- [x] /profiel with plan info
- [x] /team admin dashboard
- [x] /team/leden member management
- [x] Admin API (GET/POST/PATCH)
- [x] Admin role check ('member' | 'admin')
- [x] Service role client (bypasses RLS)
- [x] UX-026 profile dropdown

**Pricing Implemented:**
- Monthly: €150/month
- Yearly: €1,500/year (€125/month equivalent, 17% discount)

**Technical Architecture:**
- Status computed from dates (no cron jobs)
- RLS policies for row-level security
- Service role key for admin operations
- Middleware checks on every page request
- No subscription row = allow access (safe default)

---

### Phase 4: Pre-Launch ⏳
**Duration:** Weeks 7-8 (2026-02-12 to 2026-02-25)
**Status:** IN PROGRESS (Week 7 as of 2026-02-11)

**Objective:** Complete user migration, marketing pages, and final pre-launch tasks

**Week 7: User Migration & Email Templates**

**User Migration Tasks:**
- [ ] Export ~50 WordPress users from ARMember
- [ ] Import to Supabase (via /team/leden or script)
- [ ] Assign subscription plans (monthly/yearly based on WP data)
- [ ] Verify all imports in subscriptions table

**Email Template Tasks:**
- [ ] Branded magic link email template (HTML)
- [ ] Branded invite email template (HTML)
- [ ] Test templates in major email clients
- [ ] Deploy via Resend SMTP

**Invite System Tasks:**
- [ ] "Stuur uitnodiging" button per member (backlog item)
- [ ] Invite API endpoint (POST /api/admin/members/:id/invite)
- [ ] Email trigger integration
- [ ] End-to-end testing

**Final Pre-Launch Tasks:**
- [ ] UX-025: Feedback button (backlog item)
- [ ] Rate limiting on backend (backlog item)
- [ ] Final QA pass (all critical flows)

**Week 8: Marketing Pages & Final Polish**

**Marketing Pages:**
- [ ] Homepage (port from WordPress)
- [ ] /about page
- [ ] /pricing page (€150/mo, €1,500/yr)
- [ ] /privacy page (includes subscription data clause)
- [ ] /terms page
- [ ] /contact page (form via Resend)

**Final Polish:**
- [ ] SEO optimization (meta tags, Open Graph)
- [ ] Lighthouse score >90 (all pages)
- [ ] Accessibility check (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance testing
- [ ] Documentation updates

**Expected Completion:** 2026-02-25

---

### Phase 5: Launch 🔜
**Duration:** Week 9 (2026-02-26 to 2026-03-04)
**Status:** PLANNED

**Objective:** Launch V2.0 to production and migrate users

**Key Activities:**
1. Final testing and QA
2. Security and infrastructure verification
3. Beta testing
4. DNS cutover
5. User notification
6. Monitoring and support

**Testing & QA (Days 1-2):**
- [ ] Functional testing (all features end-to-end)
- [ ] Performance testing (search <25ms, page <1s)
- [ ] Load testing (50 concurrent users)
- [ ] Mobile testing (real devices)
- [ ] Auth flow verification
- [ ] Membership lifecycle testing
- [ ] Admin features verification
- [ ] Edge case testing

**Security & Infrastructure (Days 3-4):**
- [ ] Security audit (RLS policies, no data leaks)
- [ ] Rate limiting verified
- [ ] Error logging verified (Railway logs)
- [ ] Backups verified (Supabase daily backups)
- [ ] Monitoring dashboards checked
- [ ] DNS TTL lowered to 300s
- [ ] Rollback plan documented

**Beta Testing (Day 5):**
- [ ] Invite 3-5 beta testers
- [ ] Collect feedback (critical issues only)
- [ ] Fix launch-blocking issues
- [ ] Final smoke test

**Launch Preparation (Day 6):**
- [ ] Draft announcement email
- [ ] Verify all 50 users in Supabase
- [ ] Review rollback plan
- [ ] Go/no-go checklist review

**Go Live (Day 7):**
- [ ] DNS switch (rijksuitgaven.nl → Railway)
- [ ] Verify HTTPS/SSL
- [ ] Smoke test (login → search → export)
- [ ] Send announcement to 50 users
- [ ] Monitor actively (first 24-48 hours)

**Post-Launch (Week 10+):**
- [ ] Monitor stability (Days 1-7)
- [ ] Collect user feedback (Days 1-14)
- [ ] WordPress shutdown (Week 11)
- [ ] V2.1 planning (Week 10)

**Expected Launch Date:** 2026-03-04 (Week 9, Day 7)

---

## Phase Dependencies

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
  ↓          ↓          ↓          ↓          ↓
Data      Search     Auth       Pre-     Launch
Migr.     Platf.     +Memb.     Launch
```

**Critical Path:**
- Phase 4 (Week 7-8) → Phase 5 (Week 9)
- User migration must complete before launch
- Marketing pages should complete before launch (not blocking)

---

## Risk Assessment

### Phase 4 Risks (Current)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| User migration issues | High | Low | Test import script, manual fallback |
| Email template delays | Medium | Low | Use existing Resend templates as fallback |
| Marketing page delays | Low | Medium | Not launch-blocking, can deploy post-launch |
| Rate limiting complexity | Medium | Low | Simple implementation, well-documented |

### Phase 5 Risks (Launch)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DNS propagation delays | Medium | Low | Lower TTL to 300s pre-launch |
| User confusion (new platform) | Medium | Medium | Clear announcement email, support ready |
| Performance issues under load | High | Low | Load testing in Week 9, Railway auto-scaling |
| Critical bug discovered | High | Low | Beta testing in Week 9, rollback plan ready |

---

## Success Criteria by Phase

### Phase 1 ✅
- [x] 3.1M rows migrated with integrity
- [x] Search <100ms (actual: <25ms)
- [x] Infrastructure <€180/month (actual: €87-120)

### Phase 2 ✅
- [x] All 7 modules functional
- [x] Autocomplete <50ms (actual: <25ms)
- [x] CSV export working (500 rows)
- [x] 26 UX features implemented
- [x] Security audit complete

### Phase 3 ✅
- [x] Magic Link auth working
- [x] Membership management functional
- [x] Protected routes enforced
- [x] Admin features working

### Phase 4 ⏳
- [ ] 50 users migrated
- [ ] Branded email templates deployed
- [ ] All marketing pages live
- [ ] Rate limiting enabled
- [ ] Lighthouse score >90

### Phase 5 🔜
- [ ] V2.0 live on rijksuitgaven.nl
- [ ] All 50 users notified
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Monitoring active

---

**Current Phase:** Phase 4 - Pre-Launch (Week 7 in progress)
**Next Phase:** Phase 5 - Launch (Week 9, starts 2026-02-26)
**Days to Launch:** ~14 days
