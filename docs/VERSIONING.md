# Versioning Structure

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Status:** Active

---

## Versioning Scheme

| Format | Meaning | Example |
|--------|---------|---------|
| **X.0** | Major release - new capability, new use cases | 1.0, 2.0, 3.0 |
| **X.Y** | Minor release - improvements and smaller additions within major | 1.1, 1.2, 2.1 |
| **X.Y.Z** | Patch release - bug fixes | 1.0.1, 1.1.2 |

**Rule:** If it enables a NEW use case or serves a NEW audience, it's a major release.

---

## Major Versions Overview

| Version | Name | New Capability | New Use Case |
|---------|------|----------------|--------------|
| **V1** | Search Platform | Find data fast | "Who received money?" |
| **V2** | Theme Discovery | Understand by domain | "What's happening in defensie?" |
| **V3** | Inzichten | Self-service BI | "Show me trends and anomalies" |
| **V4** | AI Research Mode | Conversational analysis | "Help me investigate this" |
| **V5** | Research Workspace | Save and share findings | "Build a case, share with team" |
| **V6** | External Integrations | Connect to legislation | "What law governs this spending?" |
| **V7** | Network Analysis | Map people & connections | "Who runs these organizations?" |
| **V8** | European Platform | Multi-country | "Compare NL with Germany" |

> **Note:** Consider brainstorming whether V3 (Inzichten) should come before V2 (Theme Discovery).

---

## V1 - Search Platform

**Core promise:** €1.75 trillion searchable in <100ms.

**New use case:** "Who received money?"

### V1.0 - Search MVP ✅ (Current)

**Status:** In development, Week 6

**Features:**
- Fast keyword search (<100ms via Typesense)
- 7 modules (Instrumenten, Apparaat, Inkoop, Provincie, Gemeente, Publiek, Integraal)
- Advanced filters per module
- Cross-module search
- Year columns with trend indicators
- Expandable rows with grouping
- CSV export (500 rows limit)
- Magic Link authentication
- URL sharing

**Target users:** Journalists, researchers, opposition parties

### V1.1 - Search Improvements

- Exact phrase search with quotes (`"rode kruis"`)
- Wildcard syntax support (`prorail*`)
- Semantic search (embeddings via Cohere)
- Search on Regeling/Omschrijving fields
- Recent search history
- Saved searches

### V1.2 - Search Polish

- Search analytics
- Performance optimizations
- Accessibility improvements
- UX refinements from beta feedback

---

## V2 - Theme Discovery

**Core promise:** Don't just search - explore by policy domain.

**New use case:** "What's happening in defensie/klimaat/zorg?"

**Dependency:** Requires V1.0 complete

### V2.0 - Theme Landing Pages

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

**Why this is a major release:**
- Serves NEW audience (mainstream media, mainstream parties)
- Enables NEW use case (theme-first discovery)
- Foundation for AI (IBOS classification)

**Target users:** Mainstream media, political parties, universities

### V2.1 - Theme Improvements

- More themes/domains
- Custom theme pages for specific audiences
- Theme comparison tools
- Email alerts for theme changes

---

## V3 - Inzichten

**Core promise:** Create your own analyses and dashboards.

**New use case:** "Show me trends and anomalies in my area of interest"

**Dependency:** Requires V1.0 (data), benefits from V2.0 (themes)

### V3.0 - Self-Service BI

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

### V3.1 - Inzichten Improvements

- More chart types
- Embeddable widgets
- Public dashboard sharing
- API for custom integrations

---

## V4 - AI Research Mode

**Core promise:** Conversational analysis - ask questions, get answers.

**New use case:** "Help me investigate infrastructure spending"

**Dependency:** Requires V2.0 (IBOS classification for domain understanding)

### V4.0 - Conversational AI

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

### V4.1 - AI Improvements

- Smarter follow-ups
- Better visualization generation
- Faster response times
- More query types supported

---

## V5 - Research Workspace

**Core promise:** Build cases, save findings, collaborate.

**New use case:** "Build a dossier and share with my editor"

**Dependency:** Requires V4.0 (Research Mode to generate findings worth saving)

### V5.0 - Save & Share

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

### V5.1 - Workspace Improvements

- Folders and organization
- Team workspaces
- Comments and collaboration
- Version history

---

## V6 - External Integrations

**Core promise:** Connect spending to its legal and business context.

**New use case:** "What regulation governs this subsidy?"

**Dependency:** Requires V4.0+ (meaningful when doing research)

### V6.0 - Legislation Integration

**Features:**
- **wetten.overheid.nl integration**
- Link Regelingen to legislation
- Legislation summaries in AI responses
- "View the law" links

### V6.1 - Business Integration

- KvK integration (company profiles)
- Beneficial ownership data
- Company financials context

---

## V7 - Network Analysis (Rijksnetwerken)

**Core promise:** See who runs the organizations that receive tax money, and how they're connected.

**New use case:** "Who are the people behind these organizations? Are there conflicts of interest?"

**Dependency:** Requires V1 (recipient data), benefits from V4 (AI can analyze networks)

**Tagline:** "Verbonden door geld"

### V7.0 - Network Foundation

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

### V7.1 - Network Improvements

- Beneficial ownership (UBO) data
- International director connections
- Automated risk scoring
- Custom alert rules
- Compliance reporting templates

---

## V8 - European Platform

**Core promise:** Every EU tax euro findable.

**New use case:** "Compare Dutch defense spending with German"

**Dependency:** V1-V4 proven in NL market

### V8.0 - Multi-Country Foundation

**Features:**
- Multi-tenant architecture
- Localization framework (i18n)
- Country-specific data schemas
- Franchise onboarding tools
- White-label theming

### V8.1+ - Country Rollouts

- Pilot countries
- Data pipeline templates
- Local partner portal
- Revenue sharing system

---

## Product Tiers vs. Versions

Tiers control ACCESS to versions:

| Tier | Price | Version Access |
|------|-------|----------------|
| **Pro** | €1,500/year | V1 + V2 + V3 |
| **Research** | TBD | V1-V5 |
| **Voor Overheden** | €9,000+ | V1-V6 + municipality features |
| **Voor Universiteiten** | €3,000+ | V1-V6 + academic features |
| **Rijksnetwerken** | €25,000+/year | V7 (compliance/KYC module) |
| **Franchise** | License | V8 (white-label European) |

---

## Version Dependencies

```
V1.0 Search ─────────────────────────────────► CURRENT
  │
  ├─► V1.1, V1.2 (improvements)
  │
  ├─► V2.0 Theme Discovery
  │     │
  │     ├─► V2.1 (improvements)
  │     │
  │     └─► V3.0 Inzichten (Self-Service BI)
  │           │
  │           └─► V4.0 AI Research Mode
  │                 │
  │                 ├─► V4.1 (improvements)
  │                 │
  │                 ├─► V5.0 Research Workspace
  │                 │     │
  │                 │     └─► V6.0 External Integrations
  │                 │
  │                 └─► V7.0 Network Analysis ◄──┐
  │                       (benefits from AI)     │
  │                                              │
  └──────────────────────────────────────────────┘
        (requires recipient data)

V8.0 European Platform
  └─► Requires V1-V4 proven in NL market
```

---

## Current Roadmap

| Version | Status | Timeline |
|---------|--------|----------|
| V1.0 | 🔨 Building | Now (Week 6 of 9) |
| V1.1 | 📋 Planned | Post-launch |
| V2.0 | 📋 Planned | Q1-Q2 2026 |
| V3.0 | 📋 Planned | Q2 2026 |
| V4.0 | 📋 Planned | Q2-Q3 2026 |
| V5.0 | 📋 Planned | Q3 2026 |
| V6.0 | 📋 Planned | Q3 2026 |
| V7.0 | 📋 Planned | Q3+ 2026 (can start after V1, benefits from V4) |
| V8.0 | 📋 Planned | 2027+ (after NL market proven) |

---

## Quick Reference

**"Is this a major or minor release?"**

| Change | Version Type | Example |
|--------|--------------|---------|
| New capability / new use case | **Major (X.0)** | Theme pages, AI chat |
| Improvement to existing capability | **Minor (X.Y)** | Better search, faster AI |
| Bug fix | **Patch (X.Y.Z)** | Fix search ranking |

---

**Document maintained by:** Product Owner
**Last updated:** 2026-01-31
