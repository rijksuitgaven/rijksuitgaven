# Product Backlog

**Last Updated:** 2026-02-24

Future work items, organized by release track. For completed features, see `docs/VERSIONING.md`.

> **Source of truth:** `docs/VERSIONING.md` tracks what shipped and in which version.
> This file tracks what's NOT yet built — ideas, planned work, and deferred items.
> When an item here is implemented, REMOVE it from this file and update VERSIONING.md.

---

## V-Track (End-User Features)

### V2.2 — Zoeken

#### Search: Fuzzy/Typo Tolerance

**Priority:** Medium | **Added:** 2026-02-12

V2.0 search requires exact spelling. Typesense supports `num_typos` parameter but it's not enabled.

**Solution:** Enable `num_typos: 1` or `2` for autocomplete. May need "Bedoelde u: ProRail?" UI for fuzzy matches.

**Effort:** 2-4 hours

---

#### Search: Accurate Multi-Field Match Reporting

**Priority:** Medium | **Added:** 2026-02-12

Multi-word AND search "Gevonden in" column uses first-word heuristic. Can be inaccurate when words match across different fields.

**Solution:** Check all words against all fields, report all matched fields. Minor UI change to show multiple matched fields.

**Effort:** 2-4 hours

---

#### Search: Field-Specific Search Syntax

**Priority:** Low | **Added:** 2026-02-12

Power users may want `leverancier:prorail` or `regeling:subsidie` syntax. Requires parser extension, field validation per module, and UI for field selection.

**Effort:** 4-8 hours

---

#### Semantic Search: Dutch Embeddings (V3.0 prep)

**Priority:** Medium | **Added:** 2026-01-29

V2.1 Dutch word rules (✅ Complete). Next step: Cohere embed-multilingual-v3 embeddings for semantic search.

- **Scope:** Full database (~9M tokens: recipients, regelingen, omschrijvingen)
- **Cost:** €0.90 one-time, ~€1/month
- **Storage:** pgvector in Supabase (already enabled)
- **Benefits:** Filter false positives, entity clustering, theme search, multilingual queries

**Design document:** `docs/plans/2026-01-29-semantic-search-design.md`

---

### V2.3 — Performance

#### Filter Performance: Typesense Facets

**Priority:** Medium | **Added:** 2026-02-05 | **Effort:** 1-2 days

Two related problems: cascading filter updates (300-500ms per change) and dropdown option loading (500ms+ for large fields like Regeling with 2000+ options). Both caused by PostgreSQL `SELECT DISTINCT` + `GROUP BY` on large tables.

**Solution:** Typesense facets — single request returns search results + all filter option counts in ~10ms (vs 300-900ms). Replaces 5 parallel DB queries with one Typesense call.

**Current state:** Acceptable for beta after indexes + parallel queries + debouncing. Optimize when user base grows.

---

#### Railway Private Networking for Typesense

**Priority:** Low | **Added:** 2026-01-29

Backend connects to Typesense via public URL (egress fees). Private networking attempted but failed (Caddy/IPv6 issues). Egress costs minimal for now.

---

### V2.4 — Data & Integraal

#### Integraal View Redesign

**Priority:** Medium | **Added:** 2026-01-30

`universal_search` can only show: ontvanger, year columns, totaal, modules list. Cannot show module-specific extra columns because modules have different fields.

**Questions:** Should integraal show module-specific columns when drilling down? Unified taxonomy? Discovery layer approach sufficient?

**Decision:** Requires brainstorm session.

---

#### Integraal View: Cross-Module Data Completeness

**Priority:** Medium | **Added:** 2026-02-11

Enrich integraal view with regelingen (exist in instrumenten + publiek but not in universal_search).

**Options:** JSONB column, junction table, array columns. Related to Integraal View Redesign — may combine.

---

#### Data Provenance / Freshness Indicator

**Priority:** Medium | **Added:** 2026-01-21

Show users when data was last updated. Level 1: module-level "Data bijgewerkt: [date]". Level 2: per-row source dataset + publication date.

---

### V2.5 — Polish & Toegankelijkheid

#### Accessibility: Colorblind Indicator

**Priority:** Medium | **Added:** 2026-01-21

Trend anomaly indicator uses red color only. Options: dot overlay, bold text, pattern instead of color only.

---

#### xlsx Package Replacement (ExcelJS)

**Priority:** Medium | **Added:** 2026-02-08

SheetJS has known CVEs (prototype pollution CVSS 7.8, ReDoS CVSS 7.5). Write-only usage so not directly exploitable, but compliance scanners flag it.

**Solution:** Replace with ExcelJS. **Effort:** 4-8 hours.

---

#### User-Configurable Anomaly Threshold

**Priority:** Low | **Added:** 2026-01-21

Fixed 50% threshold for trend highlighting. Allow users to configure: 25% (sensitive), 50% (default), 75%, 100% (only major changes).

---

#### Filters UX Review

**Priority:** Medium | **Added:** 2026-01-31

Review filter layout, interaction patterns, mobile experience, state clarity, clear/reset behavior.

---

#### Extra Columns Behavior During Search

**Priority:** Medium | **Added:** 2026-01-31

"Gevonden in" column replaces user-selected extra columns during search. Should they coexist? Should "Gevonden in" be a separate column?

---

#### Download Screenshot Feature

**Priority:** Low | **Added:** 2026-01-20

Allow users to download a screenshot/image of current view for reports and presentations.

---

#### AI Integration: MCP Server + OpenAI GPT

**Priority:** Medium | **Added:** 2026-01-21

Enable AI assistants to query spending data as lead generation. Teaser data (recipient + total + modules) with CTA to platform. Full details behind paywall.

**Components:** Public API endpoint, MCP server wrapper (Claude), OpenAI GPT Action (ChatGPT).

**Effort:** 8-12 hours

---

### V3+ (Future Versions)

#### Overzichtspagina / Recipient Profile Panel (V6)

**Priority:** Deferred to V6 | **Added:** 2026-01-20

Full recipient context panel: all years across modules, all metadata, cross-module summary, external links.

Not needed until V6 AI Research Mode where it becomes essential. V2 expanded row covers functional need.

---

#### Newsletter: Media Topics + Spending Data (V3.1)

**Priority:** Low | **Added:** 2026-01-21

Content marketing: monitor Dutch media for trending topics, connect to spending data, create newsletter. "This week in the news + the EUR behind it."

---

## A-Track (Admin Features)

### A1.1 — Bulk & CRM

#### Row Selector for Bulk Actions

**Priority:** Low | **Added:** 2026-02-11

Checkbox column on `/team/leden` with bulk actions: invite selected, deactivate selected.

**Effort:** 2-3 hours

---

#### Campaign Analytics: Bounce Auto-Suppress

**Priority:** Medium | **Added:** 2026-02-19

Auto-suppress recipients after N hard bounces. Mark `bounced_at` on people table. Show "Geblokkeerd" in admin.

**Effort:** 2-3 hours

---

#### Campaign Analytics: Complaint Auto-Unsubscribe

**Priority:** Medium | **Added:** 2026-02-19

On `email.complained` webhook, auto-set `unsubscribed_at`. Remove from Resend contacts.

**Effort:** 1 hour

---

#### Campaign Event Retention Cleanup

**Priority:** Low | **Added:** 2026-02-19

Delete campaign_events older than 1 year, keeping aggregated counts. ~500K rows/year growth.

**Effort:** 1 hour

---

### A1.2 — Inzichten

#### Homepage Analytics Tracking

**Priority:** Low | **Added:** 2026-02-14

Track homepage interactions: CTA clicks, plan clicks, contact form, section scroll engagement.

Deferred from UX-032 to keep initial scope focused on in-app usage.

---

#### GitHub Projects Visual Dashboard

**Priority:** Low | **Added:** 2026-02-09

Visual board on top of markdown for non-technical stakeholders. Issues as lightweight pointers. Markdown stays source of truth.

**Effort:** 30 minutes setup

---

## M-Track (Marketing & Launch)

### M1.0 — Lancering (Launch Gate)

#### SEO Optimization

**Priority:** High | **Added:** 2026-02-18

Missing: Twitter/X cards, OG image, per-page metadata, structured data (JSON-LD), sitemap content, canonical URLs, metadataBase update.

**Implementation priority:** OG image → Twitter cards → per-page titles → structured data → sitemap → canonicals.

**Effort:** 2-3 hours

---

#### Rate Limiting via Cloudflare

**Priority:** High | **Added:** 2026-02-08

No rate limiting exists. Autocomplete (every keystroke) and cascading filters (7 parallel queries) are amplifiable vectors.

**Solution:** Cloudflare free tier in front of Railway. Rate limiting + DDoS + WAF for free.

**Effort:** 30 minutes

---

#### Logo Asset Optimization

**Priority:** Low | **Added:** 2026-02-06

Current logo includes tagline that becomes unreadable when scaled down. Options: compact variant without tagline, SVG version, redesigned tagline.

---

### M1.1 — Conversie & Groei

#### Tab-Based Feature Explorer (Homepage)

**Priority:** Medium | **Added:** 2026-02-12

Replace 6-card grid with tab-based feature explorer. One large browser frame with 6 tabs. Larger screenshots, micro-engagement, consistent with Audience section pattern.

**Effort:** 4-5 hours

---

#### Audience-Personalized Landing Variants

**Priority:** Medium | **Added:** 2026-02-12

Audience-specific landing pages via `?ref=journalist`, `?ref=gemeente`, `?ref=politiek`. Same component, conditional content.

**Effort:** 6-8 hours per variant

---

## Reference

### Analytics Phases (remaining)

| Phase | Trigger | Action | Status |
|-------|---------|--------|--------|
| 1 | Post-launch | Plausible or Umami Cloud (pageviews, traffic) | 📋 Planned |
| 2 | 200+ users | Server-side event logging | ✅ Done (UX-032) |
| 3 | 500+ users | PostHog with consent mechanism | 📋 Planned |

### API Performance (monitoring)

All modules <500ms after optimizations. Remaining options if traffic grows: Redis/memory cache, read replica. Monitor in production.
