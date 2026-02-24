# Session Context

**Last Updated:** 2026-02-24
**Project Phase:** V2.0 Development
**Current Sprint:** Week 8+ — Pre-Launch Polish & Beta Feedback
**Beta Status:** V0.9 live at beta.rijksuitgaven.nl (10 testers, launched 2026-02-21)

> **Full history:** `logs/SESSION-CONTEXT-ARCHIVE.md` (archived 2026-02-22)

---

## Product Versioning

**Source of truth:** `docs/VERSIONING.md`

| Track | Current | Status |
|-------|---------|--------|
| **V** (End-user) | V2.0 Search Platform | 🔨 Building |
| **A** (Admin) | A1.0 Beheer MVP | ✅ Live |
| **M** (Marketing) | M1.0 Lancering | 📋 Planned |
| **D** (Data) | D1.0 Gemeente Uitbreiding | 📋 Planned |

**Scheme:** VX.Y = end-user | AX.Y = admin | MX.Y = marketing | DX.Y = data
**API endpoints** `/api/v1/` are API versions, NOT product versions.

---

## Pending Tasks

| Task | Status | Notes |
|------|--------|-------|
| Search enhancements | ✅ Implemented (Feb 21) | Multi-word AND, exact phrase `"..."`, wildcard stripping |
| /versiegeschiedenis page | ✅ Implemented (Feb 21) | Benefit-oriented changelog + V2.x roadmap |
| Staffel popover fix | ✅ Fixed (Feb 21) | Shows all 14 staffels (0-13) |
| UX-039 Vergelijk (row pinning) | ⏳ On staging only | Pin up to 4 rows, export selection. Reverted from main 2026-02-22 |
| Email Media Library | ✅ Live (both) | Sharp processing, DB tracking, media picker, media tab. Admin feature |
| Email deliverability (SPF fix) | ✅ Done (DNS) | Replaced broken self-referencing SPF with correct Resend + ZXCS includes |
| Campaign features (13) | ✅ Implemented (Feb 22) | 6 phases: webhook, pre-send, analytics, engagement, sequences, preferences |
| Conditional segment builder | ✅ Implemented (Feb 22) | AND/OR conditions on campaigns, 4 types, negation, live evaluation. Migration 072 |
| Campaign detail view upgrade | ✅ Implemented (Feb 22) | KPI bar, header card, recipient filters/sort, single-line format, last_name |
| Email system polish | ✅ Implemented (Feb 22) | Template fixes, editor autolink/unlink, test email input, segment counting fix, Mail 1 copy |
| Email template width/font | ✅ Fixed (Feb 23) | 480→600px, 15→16px, auto-link prevention |
| Railway cron service | ✅ Fixed (Feb 22) | curlimages/curl, hardcoded Bearer token (exec-form no expansion), schedule `0 7-16 * * 1-5`. CRON_SECRET rotated. |
| VERSIONING restructure | ✅ Done (Feb 22) | 4 tracks (V/A/M/D), URL state→V2.2, M1.0 launch gate, D1.0 Gemeente, V2.x renumbered |
| UX-039 reverted from main | ✅ Fixed (Feb 23) | Reverted `d2e61dd`, staging preserved. Added staging-only registry to CLAUDE.md |
| Totaal sort broken (all modules) | ✅ Fixed (Feb 23) | `total`→`totaal` mapping via SORT_FIELD_MAP. Sort Field Contract in CLAUDE.md |
| Source table year inflation | ✅ Fixed (Feb 23) | `SUM(bedrag)` included 2025+ data. Now `CASE WHEN year BETWEEN 2016 AND 2024` |
| Kolommen + filters (UX-006 revised) | ✅ Fixed (Feb 23) | Kolommen always visible, user controls column selection. Filter columns no longer auto-override |
| Publiek regio column bug | ✅ Fixed (Feb 23) | Config used `regio`, DB column is `provincie`. Zero results when Regio selected |
| Email deliverability overhaul | ✅ Fixed (Feb 23) | noreply→contact@, plain-text multipart, Reply-To, DMARC rua, SPF -all. DNS pending user action. |
| Magic link expiry 1h→24h | ✅ Fixed (Feb 24) | Supabase OTP 86400s + copy updated in 4 files |
| Expired link error message | ✅ Fixed (Feb 24) | "activatielink via beheerder" → "inloglink, vul e-mailadres in" |
| Invite email rewrite | ✅ Fixed (Feb 24) | 5 iterations: stripped copy, correct session info, unified fonts, new subject, expiry above button |
| Lab section (/team/lab) | ✅ Implemented (Feb 24) | Admin-only prototypes: h1-h5 moved from public routes, card grid, dynamic slug, Lab tab+dashboard card |
| Cron-sequences bearer token | ✅ Fixed (Feb 24) | Hardcoded token not updated after CRON_SECRET rotation. User updated Railway start command |
| Email spam (Soverin) | ⏳ Diagnosed | Shared SES IP reputation. Recommendation: dedicated Resend IP (~$20/month) |
| Roadmap page (/team/roadmap) | ✅ Implemented (Feb 24) | Parses VERSIONING.md + backlog.md, 4 track tabs, version cards, feature table, 6 parser fixes. Build-time embed for Railway. |
| Onboarding email sequence | ⏳ Ready to implement | 5 emails designed, copy final. See `docs/plans/2026-02-22-onboarding-email-sequence.md` |
| Homepage copy optimization | ⏳ In progress | V1 headline restored, "doel door doen" applied to value prop #1. Remaining props TBD |
| CRM Phase 3 | ⏳ Pending | Drop redundant subscription columns (email, first_name, last_name, org) |
| User migration | ⏳ Pending | ~50 WordPress users to import to Supabase |
| Rate limiting | ⏳ Pending | Cloudflare free tier in front of Railway |
| SEO optimization | ⏳ Pending | OG image, twitter cards, per-page metadata, structured data |
| DNS switch | ⏳ Pending | rijksuitgaven.nl → Railway, update metadataBase, rollback plan |

---

## Recent Work (Last 5)

1. **Login UX + Lab + Cron Fix + Roadmap** (2026-02-24)
   Session 1: Spam analysis, magic link 1h→24h, expired link fix, invite email rewrite. Session 2: Lab section — h1-h5 to /team/lab, card grid, Lab tab+dashboard. Cron fix: bearer token. Session 3: /team/roadmap — parses VERSIONING.md+backlog.md, 4 track tabs, version cards, feature table. Railway fix: build-time embed (committed generated TS). 6 parser accuracy fixes from full audit.

2. **Critical Production Bug Fixes + Email Deliverability** (2026-02-23)
   7 fixes + deliverability overhaul: UX-039 reverted from main, Totaal sort broken (`total`→`totaal`), source table year inflation, Kolommen+filters (UX-006 revised), Publiek zero results (`regio`→`provincie`). Email: noreply→contact@, plain-text multipart, Reply-To, DMARC rua, SPF -all. Prevention: staging-only registry, Sort Field Contract.

2. **4 Release Tracks (VERSIONING restructure)** (2026-02-22)
   VERSIONING.md restructured with 4 release tracks: V (end-user), A (admin), M (marketing/launch), D (data). URL state restoration moved to V2.2. M1.0 Lancering = launch gate (6 items before DNS switch). D1.0 = Gemeente Haarlemmermeer. V2.x renumbered (eliminated V2.4 Homepage, V2.7).

3. **Cron Fix + A-track Status** (2026-02-22)
   A-track per-feature status tracking in VERSIONING.md, UTM builder added to A1.0. Railway cron-sequences crash fixed: `$CRON_SECRET` not expanded in Docker exec-form, hardcoded value. Schedule corrected to weekday hours. Secret rotated.

4. **Email System Polish** (2026-02-22)
   Template fixes: list spacing, duplicate footer, heading left-align+spacing, auto-greeting removed. Editor: autolink disabled, unlink button. Test email: editable recipient address. Segment bug: active subscription determines leden (not pipeline_stage). Onboarding Mail 1 copy updated. CLAUDE.md Rule 0: never act without approval.

5. **Campaign Detail View Upgrade** (2026-02-22)
   Team brainstorm analyzed old email system screenshots → P0+P1 implementation. KPI summary bar (5 metrics with %), campaign header card, recipient filter toggles, sort controls, single-line recipient format, last_name in API.

---

## Infrastructure

### Supabase (Database + Auth)

| Property | Value |
|----------|-------|
| Project URL | `https://kmdelrgtgglcrupprkqf.supabase.co` |
| Region | Europe (Frankfurt) |
| Plan | **Pro** (€25/month) |
| Extensions | postgis, vector (pgvector) |
| Pooler URL | `aws-1-eu-west-1.pooler.supabase.com:5432` |

### Railway (Hosting)

| Property | Value |
|----------|-------|
| **Production URL** | `https://beta.rijksuitgaven.nl` |
| **Railway URL** | `https://rijksuitgaven-production.up.railway.app` |
| **CNAME Target** | `j65ghs38.up.railway.app` |
| **Staging URL** | `https://frontend-staging-production-ce7d.up.railway.app` |
| **Staging Branch** | `staging` |
| **Cron Service** | `curlimages/curl` Docker on Railway, schedule `0 7-16 * * 1-5` |
| **Cron URL** | `POST https://beta.rijksuitgaven.nl/api/v1/cron/sequences` |
| **Env Var** | `CRON_SECRET` on frontend + cron service |
| Root Directory | `app` |
| Region | EU West (Amsterdam) |

### FastAPI Backend

| Property | Value |
|----------|-------|
| URL | `https://rijksuitgaven-api-production-3448.up.railway.app` |
| Health | `/health` |
| API Docs | `/docs` (Swagger) |
| Root Directory | `backend` |
| Performance | 114-989ms |

### Typesense (Search)

| Property | Value |
|----------|-------|
| URL | `typesense-production-35ae.up.railway.app` |
| Collections | 7 (recipients + 6 modules) |
| Total documents | ~2.1M |
| Performance | <25ms search |
| Sync docs | `scripts/typesense/README.md` |
| Data update | `scripts/data/DATA-UPDATE-RUNBOOK.md` |

---

## Executed SQL Migrations

Last migration: **072-campaign-conditions.sql** (2026-02-22)

Full list: 001 → 072. See `SESSION-CONTEXT-ARCHIVE.md` for complete execution log.

Key recent migrations:
| # | Description | Date |
|---|-------------|------|
| 060 | Campaign events | 2026-02-19 |
| 061 | CRM pipeline stages | 2026-02-19 |
| 062 | Public page analytics (8 RPC functions) | 2026-02-19 |
| 063 | Campaign drafts | 2026-02-20 |
| 064 | Browser/device analytics | 2026-02-20 |
| 065 | Email media library | 2026-02-22 |
| 066 | Bounce suppress (bounced_at, bounce_type on people) | 2026-02-22 |
| 067 | Campaign event UA columns | 2026-02-22 |
| 068 | Engagement scoring SQL functions | 2026-02-22 |
| 069 | Email sequences (4 tables) | 2026-02-22 |
| 070 | Campaign events sequence columns | 2026-02-22 |
| 071 | Email preferences + topics | 2026-02-22 |
| 072 | Campaign conditions (JSONB + index) | 2026-02-22 |

---

## Key Active Decisions

| Decision | Outcome |
|----------|---------|
| Single-view architecture | ADR-014, no two-view toggle |
| Auth | Magic Link only (Supabase Auth + PKCE + Resend) |
| All transactional email | Bypasses Supabase → Resend with branded templates. From: contact@rijksuitgaven.nl. Multipart (HTML+text). |
| Export limit | 500 rows always |
| Staging workflow | Admin→both, fixes→ask, user features→staging only. Batch release. SQL before code. |
| Legal entity | Rijksuitgaven.nl (KVK 96257008) |
| Formal Dutch | u/uw in all user-facing text |
| Typography | IBM Plex Sans (public) + Condensed (data pages) |
| Analytics | Server-side, pseudonymized (SHA256 actor_hash) |
| CRM | `people` table as identity anchor, pipeline stages |
| Email sequences | Cron-based hourly (weekdays), configurable send_time per sequence, auto-enroll on invite |
| Email preferences | Topic-based opt-out, public preference center at /voorkeuren, default opt-in |
| Copywriting | "Doel door doen" principle: lead with goal (why), then means (how). Formal u/uw. No em dashes. |
| Campaign targeting | AND/OR conditions on campaigns: delivered/opened/clicked/engagement_level. JSONB on campaigns table. |
| Release tracks | 4 tracks: V (end-user), A (admin), M (marketing/launch), D (data). Each has own cadence and audience. |
| M1.0 Launch Gate | 6 items must complete before DNS switch: SEO, DNS plan, rate limiting, user migration, homepage copy, logo |
| D-track | Data releases separate from features. D1.0 = Gemeente Haarlemmermeer, D1.1 = Jaarupdate 2025 |
| Roadmap data | Build-time embed: prebuild generates `src/generated/roadmap-data.ts` from VERSIONING.md+backlog.md. Committed to git (Railway Root Dir=app/ can't access repo root). Regenerate locally after markdown edits. |

---

## Module Configuration Reference

| Module | Primary Field | Amount Field | Multiplier |
|--------|--------------|--------------|------------|
| instrumenten | ontvanger | bedrag | ×1000 |
| apparaat | kostensoort | bedrag | ×1000 |
| inkoop | leverancier | totaal_avg | ×1 |
| provincie | ontvanger | bedrag | ×1 |
| gemeente | ontvanger | bedrag | ×1 |
| publiek | ontvanger | bedrag | ×1 |
| integraal | ontvanger | (universal_search) | ×1 (normalized) |

**Filter configuration:** See `SESSION-CONTEXT-ARCHIVE.md` lines 1091-1101.

---

## Quick Links

| Topic | File |
|-------|------|
| Version roadmap | `docs/VERSIONING.md` |
| Search requirements | `02-requirements/search-requirements.md` |
| Brand identity | `02-requirements/brand-identity.md` |
| Tech stack | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
| Frontend docs | `docs/FRONTEND-DOCUMENTATION.md` |
| Database docs | `scripts/sql/DATABASE-DOCUMENTATION.md` |
| Backlog | `02-requirements/backlog.md` |
| Staging setup | `docs/plans/2026-02-21-staging-environment.md` |
| Data update runbook | `scripts/data/DATA-UPDATE-RUNBOOK.md` |

---

## Notes

- **UX counter:** Next available UX-040
- **Communication:** English with Claude, Dutch (formal u/uw) for user-facing text
- **Budget:** ~€190/month infrastructure
- **psql path:** `/usr/local/Cellar/libpq/18.1/bin/psql`
- **python:** Use `python3` on macOS
