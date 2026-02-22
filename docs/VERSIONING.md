# Versioning Structure

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Updated:** 2026-02-22
**Status:** Active

---

## Versioning Scheme

| Format | Meaning | Example |
|--------|---------|---------|
| **X.0** | Major release - new capability, new use cases | V2.0, V3.0, V4.0 |
| **X.Y** | Minor release - improvements and smaller additions within major | V2.1, V2.2, V3.1 |
| **X.Y.Z** | Patch release - bug fixes | V2.0.1, V2.1.2 |
| **AX.Y** | Admin/internal release - /team pages, admin tooling | A1.0, A1.1, A2.0 |

**Rules:**
- If it enables a NEW use case or serves a NEW audience, it's a major release.
- If it only affects `/team/*` pages or admin tooling, it goes in the **A-track** (not V-track).
- The V-track is end-user facing. The A-track is internal/admin facing.

---

## Major Versions Overview

| Version | Name | New Capability | New Use Case |
|---------|------|----------------|--------------|
| **V1** | WordPress Platform | Original site | rijksuitgaven.nl (legacy) |
| **V2** | Search Platform | Find data fast | "Who received money?" |
| **V3** | Rijksuitgaven Reporter | News + spending intelligence | "What's in the news about government spending?" |
| **V4** | Theme Discovery | Understand by domain | "What's happening in defensie?" |
| **V5** | Inzichten | Self-service BI | "Show me trends and anomalies" |
| **V6** | AI Research Mode | Conversational analysis | "Help me investigate this" |
| **V7** | Research Workspace | Save and share findings | "Build a case, share with team" |
| **V8** | External Integrations | Connect to legislation | "What law governs this spending?" |
| **V9** | Network Analysis | Map people & connections | "Who runs these organizations?" |
| **V10** | European Platform | Multi-country | "Compare NL with Germany" |

---

## V1 - WordPress Platform (Legacy)

The original rijksuitgaven.nl built on WordPress. Superseded by V2.

---

## V2 - Search Platform

**Core promise:** €1.75 trillion searchable in <100ms.

**New use case:** "Who received money?"

### V2.0 - Search MVP (Current)

**Status:** In development (~95% complete, V2.0 Beta private beta Week 9, V2.0 public launch Week 11)

**Features:**
- Fast keyword search (<100ms via Typesense)
- 7 modules (Instrumenten, Apparaat, Inkoop, Provincie, Gemeente, Publiek, Integraal)
- Advanced filters per module (searchable multi-select)
- Cross-module search
- Year columns with trend indicators
- Expandable rows with grouping
- CSV/XLS export (500 rows limit)
- Magic Link authentication
- URL sharing
- BFF proxy (security)
- Typesense data enrichment (recipients collection with year amounts for hybrid search)
- Feedback button with screenshot area selection (UX-025)
- Exact phrase search with quotes (`"rode kruis"`)
- Wildcard syntax support (`prorail*`)
- Email campaigns via Resend Broadcasts (replaces WordPress/Mailster)

**Target users:** Journalists, researchers, opposition parties

### V2.1 - Vergelijk

**Status:** On staging, release ~1 week post-launch

- UX-039: Row pinning (pin up to 4 rows for side-by-side comparison, export selection)

### V2.2 - Zoeken

- UX-024: Type-ahead with recent searches (localStorage, reduced debounce, response caching)
- Fuzzy/typo tolerance (Typesense `num_typos`)
- Accurate multi-field match reporting ("Ook in" for multi-word searches)
- Semantic search (Cohere embeddings, ~€1/month)
- Field-specific search syntax (`leverancier:prorail`) — power users

### V2.3 - Performance

- Cascading filter performance optimization (materialized cache or Typesense facets)
- Filter performance optimization (indexes, progressive loading)
- Railway private networking (Typesense egress savings)

### V2.4 - Homepage & Marketing

- Tab-based feature explorer (replace 6-card grid with tabbed browser frame)
- Audience-personalized landing variants (`?ref=journalist`, `?ref=gemeente`)
- Logo asset optimization (compact variant, SVG)

### V2.5 - Data & Integraal

- Integraal cross-module data completeness (regelingen in integraal view)
- Integraal view redesign (brainstorm — module-specific columns)
- Data provenance / freshness indicator ("Data bijgewerkt: [date]")

### V2.6 - Polish & Toegankelijkheid

- Accessibility: colorblind anomaly indicator (pattern/dot overlay)
- xlsx package replacement (ExcelJS — CVE cleanup)
- UX refinements from beta feedback
- GitHub Projects visual dashboard (stakeholder visibility)

### V2.7 - Externe Koppelingen

- AI Integration: MCP Server + OpenAI GPT (teaser API, lead generation)
- Full URL state restoration (expanded rows, pagination, all filters)

---

## Admin Track (A-series)

Internal admin tooling at `/team/*`. Separate release cadence from the end-user V-track.

**Audience:** Platform admin (founder)

### A1.0 - Beheer MVP (Current)

**Status:** ✅ Live

| Feature | Status |
|---------|--------|
| Member management (`/team/leden`) — add, invite, deactivate, role assignment | ✅ Live |
| Feedback inbox (`/team/feedback`) — status workflow, admin notes | ✅ Live |
| Usage statistics (`/team/statistieken`) — pulse, insights, user activity, error tracking | ✅ Live |
| Contact management (`/team/contacten`) — prospect tracking, Resend audience sync | ✅ Live |
| Email campaigns via Resend Broadcasts (compose, drafts, segments, batch send) | ✅ Live |
| Email Media Library — Sharp image processing, DB tracking, media picker, browsable media tab | ✅ Live |
| Campaign analytics — link tracking, device stats, campaign comparison | ✅ Live |
| Pre-send quality — test email, 5-area precheck, device preview | ✅ Live |
| Bounce/complaint auto-suppress — webhook-driven, hard bounce + complaint handling | ✅ Live |
| Subscriber engagement scoring — per-person timeline, engagement badges | ✅ Live |
| Email sequences — multi-step drip campaigns, cron-based hourly processor, auto-enroll on invite | ✅ Live |
| Preference center — topic-based opt-out, public page at /voorkeuren | ✅ Live |
| UTM builder — compose UI for UTM parameters, auto-append to CTA + body links | 📋 Planned |

### A1.1 - Bulk & CRM

| Feature | Status |
|---------|--------|
| Row selector for bulk actions (`/team/leden`) | 📋 Planned |
| Contact-to-subscriber conversion flow (`/team/contacten`) | 📋 Planned |
| Campaign event retention cleanup (1-year rolling) | 📋 Planned |

### A1.2 - Inzichten

| Feature | Status |
|---------|--------|
| Enhanced statistieken dashboard (deeper search funnel, retention metrics) | 📋 Planned |
| Search success/failure analysis improvements | 📋 Planned |

### A2.0 - Subscription Management

| Feature | Status |
|---------|--------|
| Self-service plan management (upgrade/downgrade) | 📋 Planned |
| Stripe integration for automated billing | 📋 Planned |
| Automated renewal notifications | 📋 Planned |

---

## V3 - Rijksuitgaven Reporter

**Core promise:** News intelligence meets spending data - daily briefings that connect current events to government spending.

**New use case:** "What's in the news about government spending?"

**Dependency:** Requires V2.0 complete

**Design document:** `docs/plans/2026-02-03-rijksuitgaven-reporter-design.md`

### V3.0 - Daily Email Briefing

**Features:**
- **AI news scanner** - Scans RSS feeds from Rijksoverheid.nl, Kamerstukken, NOS, RTL
- **Keyword extraction** - Claude extracts topics, entities, relevance from articles
- **Dynamic matching** - Search existing data with extracted keywords (no pre-classification needed)
- **Daily midday email** - 3-5 items, profession-specific insights
- **Two profession templates:**
  - Journalist: Story angles, key recipients, trends
  - Beleidsmedewerker: Relevant regelingen, historical context, Kamerstukken
- **Light AI analysis** - Data + insights, not full generated articles
- **Platform opt-in** - Settings page to enable/configure

**Why this is a major release:**
- Enables NEW use case (push intelligence, not just pull search)
- Different interaction paradigm (passive consumption vs. active search)
- Foundation for personalized experience
- Increases engagement and retention

**Target users:** Journalists, policy staff (same as V2, but passive engagement)

**Cost:** ~€10-15/month (Claude Haiku + Resend)

### V3.1 - Reporter Improvements

- "Anders" profession with generic template
- Topic preferences (defensie, zorg, onderwijs)
- Breaking alerts for high-relevance news
- Personalized homepage (in-app feed)

---

## V4 - Theme Discovery

**Core promise:** Don't just search - explore by policy domain.

**New use case:** "What's happening in defensie/klimaat/zorg?"

**Dependency:** Requires V2.0 complete

### V4.0 - Theme Landing Pages

**Features:**
- **IBOS domain classification** (30 policy domains mapped to 450K recipients)
- **Theme landing pages** (/thema/defensie, /thema/klimaat, /thema/zorg, etc.)
  - Hero: total spending + trend
  - Top 10 recipients (clickable)
  - Trend chart (2016-2024)
  - Key anomalies highlighted
  - Related themes
  - "Dig deeper" → Search
- Theme navigation in header
- Basic visualizations (bar, line, pie charts)

**Documentation:**
| Topic | Location |
|-------|----------|
| Reference data (IBOS codes) | `docs/reference/ibos-domains.md` |
| Field mappings | `docs/reference/mapping-*.md` |
| Progress tracking | `docs/v4-themes/PROGRESS.md` |
| Quality metrics | `docs/v4-themes/QUALITY.md` |
| Decisions (ADRs) | `docs/v4-themes/DECISIONS.md` |
| SQL migrations | `scripts/sql/v4-themes/` |

**Why this is a major release:**
- Serves NEW audience (mainstream media, mainstream parties)
- Enables NEW use case (theme-first discovery)
- Foundation for AI (IBOS classification)

**Target users:** Mainstream media, political parties, universities

**V3 + V4 Synergy:** When Theme Discovery launches, Reporter automatically gets smarter matching via IBOS domains.

### V4.1 - Theme Improvements

- More themes/domains
- Custom theme pages for specific audiences
- Theme comparison tools
- Email alerts for theme changes

---

## V5 - Inzichten

**Core promise:** Create your own analyses and dashboards.

**New use case:** "Show me trends and anomalies in my area of interest"

**Dependency:** Requires V2.0 (data), benefits from V4.0 (themes)

### V5.0 - Self-Service BI

**Features:**
- Custom dashboard builder
- Trend analysis tools
- Anomaly detection and alerts
- Comparison views (year-over-year, recipient-to-recipient)
- Saved analyses
- Scheduled reports
- Export to PowerPoint/PDF

**Why this is a major release:**
- Enables NEW use case (create analyses, not just search)
- Different interaction paradigm (build dashboards vs. browse)
- Unlocks recurring usage (check my dashboard weekly)

**Target users:** Policy analysts, controllers, financial journalists

### V5.1 - Inzichten Improvements

- More chart types
- Embeddable widgets
- Public dashboard sharing
- API for custom integrations

---

## V6 - AI Research Mode

**Core promise:** Conversational analysis - ask questions, get answers.

**New use case:** "Help me investigate infrastructure spending"

**Dependency:** Requires V4.0 (IBOS classification for domain understanding)

### V6.0 - Conversational AI

**Features:**
- **/research page** with chat interface
- Natural language queries
- Multi-step analysis (context retention)
- AI-generated visualizations
- Comparison tools (recipients, years, modules)
- Follow-up suggestions
- Research tier subscription

**Why this is a major release:**
- Completely new interaction paradigm (chat vs. search)
- Enables complex analysis without expertise
- Premium tier unlocks new revenue

**Target users:** Deep researchers, investigative journalists, policy analysts

### V6.1 - AI Improvements

- Smarter follow-ups
- Better visualization generation
- Faster response times
- More query types supported

---

## V7 - Research Workspace

**Core promise:** Build cases, save findings, collaborate.

**New use case:** "Build a dossier and share with my editor"

**Dependency:** Requires V6.0 (Research Mode to generate findings worth saving)

### V7.0 - Save & Share

**Features:**
- Save research sessions
- Share read-only links
- Annotations and notes
- Dossiers (collections of findings)
- Export to Excel, PDF
- Session history

**Why this is a major release:**
- Enables collaborative workflows
- Creates sticky usage (saved work = retention)
- B2B value (teams can share)

### V7.1 - Workspace Improvements

- Folders and organization
- Team workspaces
- Comments and collaboration
- Version history

---

## V8 - External Integrations

**Core promise:** Connect spending to its legal and business context.

**New use case:** "What regulation governs this subsidy?"

**Dependency:** Requires V6.0+ (meaningful when doing research)

### V8.0 - Legislation Integration

**Features:**
- **wetten.overheid.nl integration**
- Link Regelingen to legislation
- Legislation summaries in AI responses
- "View the law" links

### V8.1 - Business Integration

- KvK integration (company profiles)
- Beneficial ownership data
- Company financials context

### V8.2 - Procurement Integration (TenderNed)

- **TenderNed API integration** (tenderned.nl — official Dutch government procurement platform)
- Enrich inkoop module with tender details (contract descriptions, award criteria, procedure type)
- Link leveranciers to awarded tenders
- Contract value vs. actual spending comparison
- Tender timeline (publication → award → spending)

---

## V9 - Network Analysis (Rijksnetwerken)

**Core promise:** See who runs the organizations that receive tax money, and how they're connected.

**New use case:** "Who are the people behind these organizations? Are there conflicts of interest?"

**Dependency:** Requires V2 (recipient data), benefits from V6 (AI can analyze networks)

**Tagline:** "Verbonden door geld"

### V9.0 - Network Foundation

**Features:**
- **KvK integration** - Link recipients to Chamber of Commerce data
- **Board member mapping** - Directors, supervisory boards, founders
- **Address clustering** - Organizations at same address
- **Role history** - Track CVs and career paths of key people
- **Overlap detection** - Same person on multiple recipient boards
- **Network visualization** - Graph view of connections
- **PEP flagging** - Politically Exposed Persons identification

**Data requirements:**
- KvK API access (paid)
- Historical director data
- Address normalization
- Person entity resolution

**Why this is a major release:**
- Serves NEW audience (compliance officers, banks, regulators)
- Enables NEW use case (fraud detection, due diligence, KYC)
- Requires significant new data layer (people, not just organizations)
- Different UX paradigm (network graphs vs. tables)

**Target users:**
- Banks & insurers (KYC/AML compliance)
- Accountants & auditors
- Government regulators & toezichthouders
- Investigative journalists (premium)

**Revenue model:**
| Tier | Price | Features |
|------|-------|----------|
| Monitoring | €25,000/year | Dataset access, alerts |
| API Access | €50,000/year | Custom queries, integration |
| Enterprise | €100,000+/year | Full access, support, SLA |

**Market size:** 40-60 organizations (banks, insurers, accountants)
**Conservative ARR potential:** €1.1M

### V9.1 - Network Improvements

- Beneficial ownership (UBO) data
- International director connections
- Automated risk scoring
- Custom alert rules
- Compliance reporting templates

---

## V10 - European Platform

**Core promise:** Every EU tax euro findable.

**New use case:** "Compare Dutch defense spending with German"

**Dependency:** V2-V6 proven in NL market

### V10.0 - Multi-Country Foundation

**Features:**
- Multi-tenant architecture
- Localization framework (i18n)
- Country-specific data schemas
- Franchise onboarding tools
- White-label theming

### V10.1+ - Country Rollouts

- Pilot countries
- Data pipeline templates
- Local partner portal
- Revenue sharing system

---

## Product Tiers vs. Versions

Tiers control ACCESS to versions:

| Tier | Price | Version Access |
|------|-------|----------------|
| **Pro** | €1,500/year | V2 + V3 + V4 |
| **Research** | TBD | V2-V7 |
| **Voor Overheden** | €9,000+ | V2-V8 + municipality features |
| **Voor Universiteiten** | €3,000+ | V2-V8 + academic features |
| **Rijksnetwerken** | €25,000+/year | V9 (compliance/KYC module) |
| **Franchise** | License | V10 (white-label European) |

---

## Version Dependencies

```
V1 WordPress (legacy) ──────────────────────► SUPERSEDED

V2.0 Search ─────────────────────────────────► CURRENT
  │
  ├─► V2.1 Vergelijk → V2.2 Zoeken → V2.3-V2.7 (improvements)
  │
  ├─► A1.0 Beheer MVP ─► A1.1 Bulk & CRM ─► A1.2 Inzichten ─► A2.0 Subscriptions
  │
  ├─► V3.0 Rijksuitgaven Reporter ◄─────────── NEXT
  │     │
  │     └─► V3.1 (improvements)
  │
  ├─► V4.0 Theme Discovery
  │     │   (enhances V3 with semantic matching)
  │     │
  │     └─► V5.0 Inzichten (Self-Service BI)
  │           │
  │           └─► V6.0 AI Research Mode
  │                 │
  │                 ├─► V6.1 (improvements)
  │                 │
  │                 ├─► V7.0 Research Workspace
  │                 │     │
  │                 │     └─► V8.0 External Integrations
  │                 │
  │                 └─► V9.0 Network Analysis ◄──┐
  │                       (benefits from AI)     │
  │                                              │
  └──────────────────────────────────────────────┘
        (requires recipient data)

V10.0 European Platform
  └─► Requires V2-V6 proven in NL market
```

---

## Current Roadmap

**End-User (V-track):**

| Version | Status | Timeline |
|---------|--------|----------|
| V1 | ✅ Legacy (WordPress) | Superseded by V2 |
| V2.0 | 🔨 95% Complete (beta live, public launch remaining) | Week 9-11 |
| V2.1 | 📋 Vergelijk (on staging) | ~1 week post-launch |
| V2.2 | 📋 Zoeken | Post-launch |
| V2.3 | 📋 Performance | Post-launch |
| V2.4 | 📋 Homepage & Marketing | Post-launch |
| V2.5 | 📋 Data & Integraal | Post-launch |
| V2.6 | 📋 Polish & Toegankelijkheid | Post-launch |
| V2.7 | 📋 Externe Koppelingen | Post-launch |
| V3.0 | 📋 Planned | Post V2.0 launch |
| V4.0 | 📋 Planned | Q1-Q2 2026 |
| V5.0 | 📋 Planned | Q2 2026 |
| V6.0 | 📋 Planned | Q2-Q3 2026 |
| V7.0 | 📋 Planned | Q3 2026 |
| V8.0 | 📋 Planned | Q3 2026 |
| V9.0 | 📋 Planned | Q3+ 2026 (can start after V2, benefits from V6) |
| V10.0 | 📋 Planned | 2027+ (after NL market proven) |

**Admin (A-track):**

| Version | Status | Timeline |
|---------|--------|----------|
| A1.0 | ✅ Live | Shipped with V2.0 |
| A1.1 | 📋 Bulk & CRM | Post-launch |
| A1.2 | 📋 Inzichten | Post-launch |
| A2.0 | 📋 Subscription Management | TBD |

**V2.0 Deployed Infrastructure (as of 2026-02-21):**
- ✅ Supabase PostgreSQL (Frankfurt EU, Pro plan)
- ✅ Next.js Frontend (Railway Amsterdam)
- ✅ FastAPI Backend (Railway Amsterdam)
- ✅ Typesense Search (Railway Amsterdam, 463K recipients)
- ✅ Supabase Auth (Magic Link + PKCE)
- ✅ Subscriptions table (membership management)

---

## Quick Reference

**"Is this a major or minor release?"**

| Change | Version Type | Example |
|--------|--------------|---------|
| New capability / new use case | **Major (X.0)** | Reporter, Theme pages, AI chat |
| Improvement to existing capability | **Minor (X.Y)** | Better search, faster AI |
| Bug fix | **Patch (X.Y.Z)** | Fix search ranking |

---

**Document maintained by:** Product Owner
**Last updated:** 2026-02-22
