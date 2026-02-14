# Usage Statistics Design — UX-032

**Date:** 2026-02-14
**Status:** Approved
**Team:** Jeroen (Analytics Lead), Marloes (Data Engineer), Pieter (Privacy), Anouk (Dashboard UX), Sander (Backend Architect), Thomas (Adversarial Reviewer)

---

## Overview

Server-side product analytics with pseudonymized user tracking. All event capture happens in the BFF layer — no external analytics tools, no cookies, no consent needed. Data displayed on an admin dashboard at `/team/statistieken`.

**Goal:** Understand user behavior to improve the product in record speed. Every metric must answer a specific business question or it gets cut.

---

## Events (6 Types)

### 1. `module_view` — Which modules are popular?

| Property | Type | Example |
|----------|------|---------|
| module | string | `"integraal"` |
| search_query | string? | `"prorail"` |
| result_count | number | `42` |
| has_filters | boolean | `true` |

### 2. `search` — What do users look for?

| Property | Type | Example |
|----------|------|---------|
| query | string | `"coa"` |
| module | string | `"publiek"` |
| result_count | number | `5` |
| autocomplete_used | boolean | `true` |
| selected_result | string? | `"CENTRAAL ORGAAN OPVANG ASIELZOEKERS"` |

### 3. `row_expand` — Do users drill into data?

| Property | Type | Example |
|----------|------|---------|
| module | string | `"inkoop"` |
| recipient | string | `"Heijmans"` |
| search_query | string? | `"heijmans"` |

### 4. `filter_apply` — Which filters are used?

| Property | Type | Example |
|----------|------|---------|
| module | string | `"instrumenten"` |
| field | string | `"begrotingsnaam"` |
| values | string[] | `["Financiën"]` |
| result_count | number | `1204` |

### 5. `export` — What data do users take away?

| Property | Type | Example |
|----------|------|---------|
| module | string | `"gemeente"` |
| format | string | `"xls"` |
| row_count | number | `500` |
| search_query | string? | `"amsterdam"` |
| has_filters | boolean | `true` |

### 6. `column_change` — Which columns matter?

| Property | Type | Example |
|----------|------|---------|
| module | string | `"instrumenten"` |
| columns | string[] | `["artikel", "regeling"]` |

---

## Database Schema

Single table with JSONB properties for flexibility.

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(20) NOT NULL,
  actor_hash VARCHAR(16) NOT NULL,
  module VARCHAR(20),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_usage_events_created_at ON usage_events (created_at);
CREATE INDEX idx_usage_events_type ON usage_events (event_type);
CREATE INDEX idx_usage_events_type_created ON usage_events (event_type, created_at);
CREATE INDEX idx_usage_events_module ON usage_events (module);
CREATE INDEX idx_usage_events_actor ON usage_events (actor_hash);

-- GIN index for JSONB property queries
CREATE INDEX idx_usage_events_properties ON usage_events USING GIN (properties);

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- No public read — admin only via service_role
-- BFF writes via service_role client
```

### Storage Estimates

| Users | Events/day | Events/month | Storage/month |
|-------|-----------|-------------|---------------|
| 50 | ~500 | ~15,000 | ~3 MB |
| 200 | ~2,000 | ~60,000 | ~12 MB |
| 500 | ~5,000 | ~150,000 | ~30 MB |

With 90-day retention: max ~90 MB at 500 users. Negligible for Supabase Pro (8 GB).

---

## Privacy & GDPR

### Pseudonymization

- `actor_hash` = first 16 characters of `SHA256(user_id + ANALYTICS_HASH_SECRET)`
- `ANALYTICS_HASH_SECRET` stored as Railway env var, never in code
- Static hash (no rotation) — sufficient at any user count
- Hash cannot be reversed without the secret
- No PII stored in events table: no email, name, IP, or user agent

### Consent

- Server-side BFF logging = legitimate interest under GDPR
- No client-side cookies or tracking scripts
- Current cookie banner ("alleen noodzakelijke cookies") stays unchanged
- No consent mechanism needed

### Data Retention

- Auto-delete events older than 90 days
- Weekly scheduled SQL: `DELETE FROM usage_events WHERE created_at < NOW() - INTERVAL '90 days'`
- If user requests data deletion: actor_hash is irreversible, no action needed

---

## Capture Architecture

### Client Side

```
useAnalytics() hook
  │
  ├── track('module_view', { module, ... })
  ├── track('search', { query, ... })
  ├── track('filter_apply', { field, ... })
  ├── track('row_expand', { recipient, ... })
  ├── track('export', { format, ... })
  └── track('column_change', { columns, ... })
  │
  ▼
Event queue (in-memory array)
  │
  ├── Flush every 30 seconds (setInterval)
  ├── Flush at 10 events (batch size)
  └── Flush on visibilitychange (navigator.sendBeacon)
  │
  ▼
POST /api/v1/analytics  (batch of up to 20 events)
```

### BFF Endpoint

```
POST /api/v1/analytics
  │
  ├── Validate events (Zod schema, max 20 per batch)
  ├── Extract user_id from session
  ├── Hash: SHA256(user_id + secret).substring(0, 16)
  ├── Respond 200 immediately
  └── Insert into usage_events (fire-and-forget, no await)
```

### Performance Rules

1. Never block user interaction — events queue in memory
2. Never block the API response — respond before writing to DB
3. Batch writes — 1 INSERT with multiple VALUES, not N separate inserts
4. No client-side analytics scripts — zero bundle size impact (just a hook)

---

## Dashboard Design

**Location:** `/team/statistieken` (new tab in TeamNav)

### Section 1 — Pulse (4 stat cards)

| Card | Metric | Subtext |
|------|--------|---------|
| Actieve gebruikers | Unique actor_hashes | van X leden |
| Zoekopdrachten | Count of `search` events | X unieke gebruikers |
| Exports | Count of `export` events | X CSV, Y XLS |
| Rij-uitklappingen | Count of `row_expand` events | X unieke gebruikers |

### Section 2 — Modules (horizontal bar chart)

Modules sorted by view count descending. Each bar shows event count + unique users.

### Section 3 — Top zoekopdrachten (table, top 15)

Columns: Zoekterm, Aantal, Unieke gebruikers, Module

### Section 4 — Filters & Kolommen (two side-by-side tables)

**Meest gebruikte filters:** field, count, module
**Meest gebruikte extra kolommen:** column, count, module

### Section 5 — Exports (compact)

Format breakdown (CSV/XLS), average row count, top 5 exported search terms.

### Section 6 — Geen resultaten (table)

Search terms that returned 0 results. Most actionable metric — users telling you what they expect but can't find.

### Date Range

Toggle: `7 dagen` | `30 dagen` | `90 dagen` | `Alles` (default: 7 dagen)

### Skew Protection

Every metric shows two numbers: event count + unique users. Prevents misreading caused by power users.

---

## Implementation Plan

1. SQL migration: `038-usage-events.sql`
2. Client hook: `hooks/use-analytics.ts`
3. BFF endpoint: `app/api/v1/analytics/route.ts`
4. Instrument components: module-page, filter-panel, data-table
5. Dashboard API: `app/api/v1/team/statistieken/route.ts`
6. Dashboard page: `app/team/statistieken/page.tsx`
7. TeamNav update: add Statistieken tab
8. Retention: scheduled delete function

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| External analytics | No | Internal logging gives full control, zero cost |
| User identification | Pseudonymized actor_hash | Per-user patterns without PII |
| Hash method | Static SHA256 + secret | No rotation needed at any scale |
| Event storage | Single table + JSONB | Flexible, simple, fast |
| Capture method | Client batch → BFF → async write | Zero performance impact |
| Retention | 90 days auto-delete | GDPR clean, small storage |
| Dashboard | /team/statistieken | Same pattern as existing admin pages |
| Consent | Not needed | Server-side logging = legitimate interest |
