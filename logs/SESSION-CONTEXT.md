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
| UX-039 Vergelijk (row pinning) | ⏳ On staging | Pin up to 4 rows, export selection, promoted to main |
| CRM Phase 3 | ⏳ Pending | Drop redundant subscription columns (email, first_name, last_name, org) |
| User migration | ⏳ Pending | ~50 WordPress users to import to Supabase |
| Rate limiting | ⏳ Pending | Cloudflare free tier in front of Railway |
| SEO optimization | ⏳ Pending | OG image, twitter cards, per-page metadata, structured data |
| DNS switch | ⏳ Pending | rijksuitgaven.nl → Railway, update metadataBase, rollback plan |

---

## Recent Work (Last 5)

1. **Versiegeschiedenis + search enhancements** (2026-02-21, afternoon — undocumented due to crash)
   Multi-word AND search, exact phrase, wildcard. /versiegeschiedenis page. Staffel popover fix. CHANGELOG.md. Version renumbering in docs. A-track admin versioning doc. Email resend design doc. 8 commits.

2. **UX-039 Vergelijk — Row Pinning** (2026-02-21, Sessions 3-4, staging)
   Pin up to 4 rows. TanStack RowPinning API. Export selection. "Wis selectie" toolbar button. 2 commits.

3. **Staging environment** (2026-02-21, Sessions 1-2)
   Railway "Frontend Staging" service. 3 workflows, 7 risks. CLAUDE.md rules. 2 commits.

4. **Browser & device analytics** (2026-02-20, Session 8)
   Server-side UA parsing. SQL function `get_usage_devices` (migration 064). Dashboard DevicesSection. 2 commits.

5. **UX-038 "Ook in" column** (2026-02-20, Session 5)
   Renamed "Gevonden in" → "Ook in". SQL enrichment for secondary matches. 1 commit.

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

Last migration: **064-usage-devices.sql** (2026-02-20)

Full list: 001 → 064. See `SESSION-CONTEXT-ARCHIVE.md` for complete execution log.

Key recent migrations:
| # | Description | Date |
|---|-------------|------|
| 058 | Unsubscribe tokens | 2026-02-19 |
| 059 | Campaign history | 2026-02-19 |
| 060 | Campaign events | 2026-02-19 |
| 061 | CRM pipeline stages | 2026-02-19 |
| 062 | Public page analytics (8 RPC functions) | 2026-02-19 |
| 063 | Campaign drafts | 2026-02-20 |
| 064 | Browser/device analytics | 2026-02-20 |

---

## Key Active Decisions

| Decision | Outcome |
|----------|---------|
| Single-view architecture | ADR-014, no two-view toggle |
| Auth | Magic Link only (Supabase Auth + PKCE + Resend) |
| All transactional email | Bypasses Supabase → Resend with branded templates |
| Export limit | 500 rows always |
| Staging workflow | Feature → staging → main. SQL before code. |
| Legal entity | Rijksuitgaven.nl (KVK 96257008) |
| Formal Dutch | u/uw in all user-facing text |
| Typography | IBM Plex Sans (public) + Condensed (data pages) |
| Analytics | Server-side, pseudonymized (SHA256 actor_hash) |
| CRM | `people` table as identity anchor, pipeline stages |

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
