# Infrastructure Roadmap

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Status:** Tracking Document

**Principle:** Only create things when required. This document tracks what's needed for each version.

---

## Current Infrastructure (V1)

| Component | Status | Details |
|-----------|--------|---------|
| Supabase PostgreSQL | ✅ Deployed | Pro plan, Frankfurt EU |
| pgvector extension | ✅ Enabled | Ready when needed |
| Next.js frontend | ✅ Deployed | Railway, Amsterdam |
| FastAPI backend | ✅ Deployed | Railway, Amsterdam |
| Typesense search | ✅ Deployed | Railway, 451K indexed |
| Redis | ❌ Not needed yet | Deploy before V3 |
| Worker service | ❌ Not needed yet | Manual sync acceptable |

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

## V2 - Theme Discovery

**Trigger:** When starting V2 development

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

---

## V3 - AI Research Mode

**Trigger:** When starting V3 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `embeddings` | id, source_table, source_id, content_type, embedding vector(1536) | Vector search |
| `research_sessions` | id, user_id, title, messages, created_at | Chat history |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| **Redis** | AI response caching, rate limiting | €7-10/month |
| **Worker service** | Background AI processing | €10-12/month |

### API Keys Required

- [ ] ANTHROPIC_API_KEY (Claude)

### Cost Impact

- Claude API: €20-40/month (with caching)
- Total V3 addition: ~€40-60/month

---

## V4 - Research Workspace

**Trigger:** When starting V4 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `dossiers` | id, user_id, title, description, is_public, timestamps | Collections |
| `dossier_items` | id, dossier_id, item_type, item_data, position | Items in dossiers |

### Infrastructure

- Supabase Storage for PDF exports (included in Pro plan)

---

## V5 - External Integrations

**Trigger:** When starting V5 development

### Database

| Table | Columns | Purpose |
|-------|---------|---------|
| `legislation_cache` | id, regeling, wet_url, summary, fetched_at | Cached legislation |

### Infrastructure

| Component | Purpose | Cost |
|-----------|---------|------|
| Scraping worker | wetten.overheid.nl | Included in worker service |

---

## V6 - Network Analysis (Rijksnetwerken)

**Trigger:** When starting V6 development

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

## V7 - European Platform

**Trigger:** When starting V7 development

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
 └─► V2 (ibos_domains, recipient_domain_mappings)
       └─► V3 (embeddings, research_sessions, Redis, Worker)
             └─► V4 (dossiers, dossier_items)
             └─► V6 (entities, people, entity_people, KvK API)
                   └─► V5 (legislation_cache) - can parallel with V4/V6
                         └─► V7 (multi-tenant)
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
**Last updated:** 2026-01-30
