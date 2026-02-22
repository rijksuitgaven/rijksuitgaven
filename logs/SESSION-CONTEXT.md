# Session Context

**Last Updated:** 2026-02-22
**Project Phase:** V2.0 Development
**Current Sprint:** Week 8+ — Pre-Launch Polish & Beta Feedback
**Beta Status:** V0.9 live at beta.rijksuitgaven.nl (10 testers, launched 2026-02-21)

> **Full history:** `logs/SESSION-CONTEXT-ARCHIVE.md` (archived 2026-02-22)

---

## Product Versioning

**Source of truth:** `docs/VERSIONING.md`

| Version | Name | Status |
|---------|------|--------|
| **V1** | WordPress Platform (legacy) | ✅ Superseded |
| **V2** | Search Platform | 🔨 Building |
| **V3–V10** | Reporter → European | 📋 Planned |

**Scheme:** X.0 = Major | X.Y = Minor | X.Y.Z = Patch
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
| Railway cron service | ✅ Deployed (Feb 22) | curlimages/curl, sequence processor, hourly weekdays. Verified: returns weekend skip |
| Onboarding email sequence | ⏳ Ready to implement | 5 emails designed, copy final. See `docs/plans/2026-02-22-onboarding-email-sequence.md` |
| Homepage copy optimization | ⏳ In progress | V1 headline restored, "doel door doen" applied to value prop #1. Remaining props TBD |
| CRM Phase 3 | ⏳ Pending | Drop redundant subscription columns (email, first_name, last_name, org) |
| User migration | ⏳ Pending | ~50 WordPress users to import to Supabase |
| Rate limiting | ⏳ Pending | Cloudflare free tier in front of Railway |
| SEO optimization | ⏳ Pending | OG image, twitter cards, per-page metadata, structured data |
| DNS switch | ⏳ Pending | rijksuitgaven.nl → Railway, update metadataBase, rollback plan |

---

## Recent Work (Last 5)

1. **Homepage Copy + Onboarding Sequence Design** (2026-02-22)
   Restored V1 headline/subheadline, applied "doel door doen" to value prop. Designed 5-email onboarding sequence for beta users (welkom+login, zoeken, filteren, ontdekking, details+export). Full copy written and documented.

2. **Email Module UX Polish** (2026-02-22)
   Help popovers (Dutch) for compose workflow + sequence setup. Sequence steps upgraded from basic textarea to full compose experience: rich text editor (Tiptap), preheader, preview with device toggles, pre-send checklist, test email, edit existing steps. 2 commits.

2. **Professional Campaign Features (13 features)** (2026-02-22)
   6 phases: bounce/complaint/UA webhooks, test email + precheck + device preview, link tracking + device stats + campaign comparison, engagement scoring + per-person timeline, sequence engine (4 tables + cron), preference center (/voorkeuren). 6 SQL migrations (066-071). Railway cron service for sequences. Staging protocol fix (merge, never force-push).

3. **Email Media Library + Deployment Protocol + SPF Fix** (2026-02-22)
   Sharp image processing (960px, thumbnails), email_media table, media picker, media tab. Reverted UX-039 from production. CLAUDE.md deployment gate. Fixed broken SPF record for email deliverability.

4. **Versiegeschiedenis + search enhancements** (2026-02-21, afternoon)
   Multi-word AND search, exact phrase, wildcard. /versiegeschiedenis page. Staffel popover fix. 8 commits.

5. **Versiegeschiedenis + search enhancements** (2026-02-21, afternoon)
   Multi-word AND search, exact phrase, wildcard. /versiegeschiedenis page. Staffel popover fix. 8 commits.

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

Last migration: **071-email-preferences.sql** (2026-02-22)

Full list: 001 → 071. See `SESSION-CONTEXT-ARCHIVE.md` for complete execution log.

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

---

## Key Active Decisions

| Decision | Outcome |
|----------|---------|
| Single-view architecture | ADR-014, no two-view toggle |
| Auth | Magic Link only (Supabase Auth + PKCE + Resend) |
| All transactional email | Bypasses Supabase → Resend with branded templates |
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
