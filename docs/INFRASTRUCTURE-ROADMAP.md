# Infrastructure Roadmap

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Updated:** 2026-02-03
**Status:** Tracking Document

**Principle:** Only create things when required. This document tracks what's needed for each version.

---

## Current Infrastructure (V1)

| Component | Status | Details |
|-----------|--------|---------|
| **Database** | | |
| Supabase PostgreSQL | ✅ Deployed | Pro plan, Frankfurt EU, 500MB/8GB |
| pgvector extension | ✅ Enabled | Ready for V2+ |
| **Hosting (Railway)** | | |
| Next.js frontend | ✅ Deployed | Railway Amsterdam, €15-25/month |
| FastAPI backend | ✅ Deployed | Railway Amsterdam, €15-25/month |
| Typesense search | ✅ Deployed | Railway Amsterdam, 463K recipients |
| **Authentication** | | |
| Supabase Auth | ✅ Deployed | Magic Link + PKCE (2026-02-10) |
| Resend SMTP | ✅ Configured | Magic Link email delivery |
| **Membership** | | |
| subscriptions table | ✅ Deployed | Computed status (2026-02-11) |
| Admin dashboard | ✅ Deployed | /team, /team/leden |
| **Future Components** | | |
| Redis | ❌ Not needed yet | Deploy with V5 (AI caching) |
| Worker service | ❌ Not needed yet | Deploy with V2 (Reporter) |
| Claude API | ❌ Not needed yet | Deploy with V2 (Reporter) |

---

## V1.1 - Search Improvements

**Trigger:** After V1 launch, when adding saved searches

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `saved_searches` | id, user_id, name, query_params, created_at | User saved searches |

### Infrastructure

- None required

---

## V2 - Rijksuitgaven Reporter

**Trigger:** After V1 launch

**Design document:** `docs/plans/2026-02-03-rijksuitgaven-reporter-design.md`

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `news_articles` | id, url, title, content, source, published_at, fetched_at | Fetched news |
| `news_analysis` | id, article_id, keywords, entities, theme, relevance_score, summary | AI extraction |
| `news_matches` | id, article_id, module, matched_value, matched_field, match_score, amount | Data matches |
| `user_reporter_preferences` | user_id, opted_in, profession, created_at, last_sent_at | User settings |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| **Worker service** | RSS fetching, AI processing, email sending | €5-10/month |
| **Resend** | Email delivery | €0 (free tier: 3K/month) |

### Dependencies

```
# backend/requirements.txt additions
feedparser>=6.0.0    # RSS parsing
resend>=0.7.0        # Email delivery
```

### API Keys Required

- [ ] ANTHROPIC_API_KEY (Claude Haiku for extraction)
- [ ] RESEND_API_KEY (email delivery)

### Cost Impact

- Claude Haiku: ~€5-10/month (50 articles/day)
- Resend: €0 (free tier)
- Worker: ~€5/month (included)
- **Total V2 addition: ~€10-15/month**

---

## V3 - Theme Discovery

**Trigger:** When starting V3 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `ibos_domains` | code, name_nl, name_en | 30 policy domain reference |
| `recipient_domain_mappings` | id, recipient, ibos_code, confidence, source | Recipient → domain |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| None new | IBOS is lookup table, no new services | €0 |

### Data Work

- [ ] Populate `ibos_domains` with 30 IBOS codes
- [ ] Classify 500K recipients into domains (Claude batch API ~€30-50)

### V2 + V3 Synergy

When V3 launches, V2 Reporter automatically gets smarter:
- News classified by theme → matches all recipients in that IBOS domain
- "Wolven in het nieuws" → finds ALL nature/wildlife recipients, not just "wolf" keyword matches

---

## V4 - Inzichten (Self-Service BI)

**Trigger:** When starting V4 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `user_dashboards` | id, user_id, title, config, created_at | Custom dashboards |
| `scheduled_reports` | id, user_id, dashboard_id, schedule, recipients | Automated reports |

### Infrastructure

- Supabase Storage for PDF exports (included in Pro plan)

---

## V5 - AI Research Mode

**Trigger:** When starting V5 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `embeddings` | id, source_table, source_id, content_type, embedding vector(1536) | Vector search |
| `research_sessions` | id, user_id, title, messages, created_at | Chat history |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| **Redis** | AI response caching, rate limiting | €7-10/month |
| Worker already deployed in V2 | Background AI processing | - |

### API Keys Required

- [ ] ANTHROPIC_API_KEY (Claude - already from V2)

### Cost Impact

- Claude API: €20-40/month (with caching)
- Redis: €7-10/month
- **Total V5 addition: ~€30-50/month**

---

## V6 - Research Workspace

**Trigger:** When starting V6 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `dossiers` | id, user_id, title, description, is_public, timestamps | Collections |
| `dossier_items` | id, dossier_id, item_type, item_data, position | Items in dossiers |

### Infrastructure

- Supabase Storage for PDF exports (included in Pro plan)

---

## V7 - External Integrations

**Trigger:** When starting V7 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `legislation_cache` | id, regeling, wet_url, summary, fetched_at | Cached legislation |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| Scraping worker | wetten.overheid.nl | Included in worker service |

---

## V8 - Network Analysis (Rijksnetwerken)

**Trigger:** When starting V8 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `entities` | id, canonical_name, kvk_number, entity_type, metadata | Organizations |
| `entity_aliases` | id, entity_id, alias, source_table | Name variations |
| `people` | id, name, normalized_name, metadata | Board members |
| `entity_people` | id, entity_id, person_id, role, start_date, end_date | Connections |
| `addresses` | id, entity_id, address, normalized, lat, lng | Locations |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| KvK API access | Company data | Usage-based |

### API Keys Required

- [ ] KVK_API_KEY

### Frontend

- [ ] Graph visualization library (react-force-graph or similar)
- [ ] Network view components

### Open Questions

- [ ] Same app or separate deployment?
- [ ] KvK API cost structure?

---

## V9 - European Platform

**Trigger:** When starting V9 development

### Database

| Change | Purpose |
|--------|---------|
| Multi-tenant schema | Country isolation |
| Localization tables | i18n support |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| Multi-region deployment | Latency for EU countries | TBD |

---

## Version Dependencies

```
V1 (current)
 └─► V1.1 (saved_searches table)
 └─► V2 (news_*, user_reporter_preferences, Worker, Resend)
       └─► V3 (ibos_domains, recipient_domain_mappings)
             │    (enhances V2 Reporter with semantic matching)
             │
             └─► V4 (user_dashboards, scheduled_reports)
                   └─► V5 (embeddings, research_sessions, Redis)
                         └─► V6 (dossiers, dossier_items)
                               └─► V7 (legislation_cache)
                                     └─► V8 (entities, people, KvK API)
                                           └─► V9 (multi-tenant)
```

---

## Pre-Version Checklist Template

Before starting any version:

- [ ] Review this document for required infrastructure
- [ ] Create database tables needed
- [ ] Deploy new services needed
- [ ] Add API keys to environment
- [ ] Update cost tracking
- [ ] Update this document with actual deployment dates

---

**Document maintained by:** Technical Lead
**Last updated:** 2026-02-03
