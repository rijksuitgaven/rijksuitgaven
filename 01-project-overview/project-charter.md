# Project Charter

## Project Name
Rijksuitgaven.nl SaaS Platform Migration

## Executive Summary
Migration of rijksuitgaven.nl from the current WordPress + MySQL stack to a modern Next.js + Supabase + Typesense architecture. V1.0 delivers a single-view architecture with enhanced search capabilities, Magic Link authentication, and membership management. V2.0 expands into a "Bloomberg Terminal for Rijksfinancien" research platform.

**Current Status (2026-02-11):** V1.0 at ~90% completion. Core platform functional, pre-launch tasks in progress (user migration, marketing pages, final QA).

## Background
Rijksuitgaven.nl is an independent platform providing insight into Dutch government expenditure data. The current system has limitations:
- WordPress backend is slow and hard to maintain
- MySQL with pre-computed pivot tables (20+ tables) limits flexibility
- Two-view toggle is a database limitation, not a user need
- No global search or cross-module search capabilities
- Limited export functionality

The migration creates a future-proof foundation that supports rapid feature development while maintaining all current functionality.

## Project Vision
A modern, high-performance government expenditure research platform that:
1. **V1.0:** Provides fast, flexible search across all government spending data with a single smart view architecture
2. **V2.0:** Becomes "The Bloomberg Terminal for Rijksfinancien" - a comprehensive research tool for political parties, journalists, and consultancies

## Objectives

1. **Migrate to modern stack** - Next.js + Supabase + Typesense replacing WordPress + MySQL
2. **Eliminate complexity** - From 20+ pivot tables to 7 source tables with on-the-fly aggregation
3. **Add global search** - Sub-100ms search with autocomplete across all modules
4. **Enable cross-module search** - "Integraal" search across 5 recipient-based modules
5. **Maintain budget** - Stay under €180/month infrastructure cost
6. **Prepare for V2.0** - Architecture supports Research Mode without platform migrations

## Scope

### In Scope (V1.0)

| Category | Features |
|----------|----------|
| **Architecture** | Single smart view with on-the-fly aggregation (no two-view toggle) |
| **Database** | Source tables only (7 tables), Supabase (PostgreSQL) |
| **Search** | Global search bar, autocomplete (<50ms), Typesense integration |
| **Cross-Module** | "Integraal" search across instrumenten, gemeente, provincie, publiek, inkoop |
| **Modules** | All 7 modules with enhanced filters |
| **Export** | CSV export (500 rows limit) |
| **Auth** | Magic Link via Supabase Auth |
| **Pages** | Overzicht (overview), module pages, marketing pages |
| **UI** | Expandable rows, user-selectable grouping, year columns for trends |

### Out of Scope (V1.0)

| Exclusion | Reason |
|-----------|--------|
| Research Mode | V2.0 feature |
| Social login | Complexity, never planned |
| Unlimited exports | Business model constraint |
| Entity resolution | V2.0 feature (UPPER() normalization for V1.0) |
| AI features | V2.0 feature |
| Company profiles | V2.0 feature |
| Full URL state | V2.0 feature (basic sharing in V1.0) |

## Key Stakeholders
See [stakeholders.md](./stakeholders.md) for details.

**Summary:** Solo founder project - one person handling all roles (development, design, marketing, operations).

## Constraints

| Constraint | Limit |
|------------|-------|
| **Budget** | €180/month maximum infrastructure |
| **Export limit** | 500 rows always (business model) |
| **Auth** | Magic Link only, no social login |
| **Timeline** | V1.0 in 8 weeks, V2.0 in +12 weeks |
| **Team** | Solo founder with AI assistance |

## Assumptions

| Assumption | Rationale |
|------------|-----------|
| Data updates monthly | Current pattern, nightly sync sufficient |
| ~20 concurrent users V1.0 | Current usage pattern |
| ~500K records scale | Current data volume |
| PostgreSQL handles aggregation | Proven for this scale |
| Typesense fits budget | Self-hosted on Railway |

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scope creep | High | Medium | Strict V1.0 feature boundary, backlog for V2.0+ |
| Performance issues | High | Low | Typesense for search, PostgreSQL for aggregation, proven stack |
| Budget overrun | Medium | Low | Cost estimates validated, €30-83 buffer |
| Solo founder burnout | High | Medium | AI-assisted development, clear phases |
| Migration data loss | High | Low | Staged migration, data validation, rollback plan |
| Search complexity | Medium | Medium | Typesense proven for this use case |

## Success Criteria
See [success-criteria.md](./success-criteria.md) for detailed metrics.

**Key Metrics:**
- Search response < 100ms
- Page load < 1s
- Infrastructure < €180/month
- All 7 modules migrated with parity
- Global search working across all data

## Budget

### V1.0 Monthly Costs (Estimated)

| Service | Cost |
|---------|------|
| Supabase Pro | €25 |
| Railway (Next.js, FastAPI, Typesense) | €52-85 |
| Domain/SSL | ~€10 |
| **Total V1.0** | **€87-120** |

### V2.0 Monthly Costs (Estimated)

| Service | Cost |
|---------|------|
| V1.0 base | €87-120 |
| Claude API (cached) | €20-40 |
| Additional Railway | €5-10 |
| **Total V2.0** | **€112-170** |

**Budget buffer:** €10-93/month

## Timeline

### V1.0: 8 Weeks

| Week | Focus |
|------|-------|
| 1-2 | Infrastructure setup (Supabase, Railway, Typesense), data migration |
| 3-4 | Core modules development, single-view architecture |
| 5-6 | Search integration, cross-module ("Integraal"), filters |
| 7 | Marketing pages, auth, testing |
| 8 | Final testing, deployment, customer migration |

### V2.0: +12 Weeks
Research Mode development after V1.0 stabilization.

---

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | [Founder] | | |

---

---

## Project Status Update (2026-02-11)

**Phase:** Pre-Launch (Week 7 of 9)

**Key Achievements:**
- All 7 modules deployed and functional
- Search performance exceeds targets (<25ms vs <100ms target)
- 26 UX features implemented
- Auth + membership management complete
- Security audit and hardening complete

**Outstanding V1.0 Tasks:**
- User migration (~50 WordPress users to Supabase)
- Branded email templates (magic link + invite)
- Marketing pages (homepage, about, pricing, legal)
- Rate limiting on backend
- Final QA + launch preparation

**Launch Target:** Week 9 (2026-02-26)

---

**Document Version:** 1.1
**Last Updated:** 2026-02-11
**Next Review:** After V1.0 launch
