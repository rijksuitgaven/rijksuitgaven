# Research Mode Vision (V2.0)

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** 2.0 (Post-V1.0 Launch)
**Date:** 2026-01-23
**Status:** Vision Document - Not for V1.0 Implementation

> **Important:** This document describes V2.0 features. Do not implement these in V1.0.
> For V1.0 search requirements, see: `search-requirements.md`

---

## Table of Contents

1. [Vision Statement](#vision-statement)
2. [Research Mode Requirements](#research-mode-requirements)
3. [Data Visualization](#data-visualization)
4. [External Integrations](#external-integrations)
5. [Workspace Features](#workspace-features)
6. [Export Capabilities](#export-capabilities)
7. [Performance Requirements](#performance-requirements)
8. [User Stories](#user-stories)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Version Roadmap](#version-roadmap)
11. [Open Questions](#open-questions)

---

## Vision Statement

### RM-001: Research Mode Vision

**Requirement:** Create a conversational AI interface for deep financial data analysis

**Vision Statement:**
"Research Mode is the **Bloomberg Terminal for Rijksfinanciën** - a professional analysis platform that answers the question: **Where does the tax euro go?**"

**Key Paradigm Shift:**

| Aspect | V1.0 (Search) | V2.0 (Research Mode) |
|--------|---------------|----------------------|
| Entry point | Recipient (Ontvanger) | Policy Domain (Beleidsterrein) |
| Primary question | "Who received money?" | "Where does the tax euro go?" |
| User flow | Recipient → Payments | Domain → Trends → Recipients |

**Core Concept:**
- **Domain-first analysis** using IBOS classification (30 policy domains)
- AI-first interface (conversational, not traditional search)
- Multi-step analysis capability
- Data visualization on demand (including Sankey, Treemap, Heatmap)
- Integration with wetten.overheid.nl (must-have)
- Professional workspace (save, share, export)

**Target Users:**
- Eerste Kamer (Senate) staff - primary user research source
- Journalists (investigative reporting)
- Academic researchers (policy analysis)
- Political parties (oversight, policy development)
- Financial analysts (trend analysis)

**Priority:** P0 (Critical for V2.0)
**Version:** V2.0 (MVP), V2.1+ (enhancements)

---

## Research Mode Requirements

### RM-002: Access Control

**Requirement:** Two-tier subscription model

**Tiers:**

1. **Pro Account** (Basic platform access) - V1.0
   - Full search bar functionality
   - All modules accessible
   - Advanced filters
   - Standard exports (CSV, 500 rows limit)
   - Price: €150/month or €1,500/year (ex VAT)

2. **Research Account** (Pro + Research Mode) - V2.0
   - Everything in Pro
   - Research Mode (AI conversational interface)
   - Exports: CSV, Excel, PDF reports (500 rows limit)
   - Save queries
   - Advanced visualizations (Sankey, Treemap, Heatmap)
   - Share read-only links
   - Price: Premium over Pro (TBD at V2.0 launch)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-003: Interface Design

**Requirement:** Design a distinct but integrated interface for Research Mode

**Recommended: Separate Page** (/research)
- Dedicated workspace
- Full-screen chat interface (like Claude)
- Side panel for saved queries, data tables
- Clear distinction from regular search

**Rationale:**
- Research sessions are typically 10-30 minutes (not quick lookups)
- Users need space for data tables, charts, and conversation
- Separate page allows for more complex UI (split panes, saved queries sidebar)
- Matches mental model: "Search" = quick lookup, "Research" = deep analysis

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-004: Conversational AI Interface

**Requirement:** AI IS Research Mode - conversational interface like Claude

**Interface Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Research Mode]                    [New Session] [History] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI: Hallo! Ik ben je assistent voor Rijksfinanciën.       │
│      Waar kan ik je mee helpen?                            │
│                                                             │
│  User: Welke organisaties ontvingen het meeste            │
│        infrastructuurgeld in 2024?                         │
│                                                             │
│  AI: Ik heb de top 10 infrastructuur-ontvangers in 2024   │
│      voor je gevonden:                                     │
│      [Data table embedded]                                 │
│      1. ProRail B.V. - €461M                               │
│      2. Rijkswaterstaat - €234M                           │
│      ...                                                   │
│                                                             │
│      Wil je meer details over een van deze ontvangers?     │
│      [Suggested: "Vergelijk met 2023" "Toon trend"]        │
│                                                             │
│  User: Vergelijk met 2023                                  │
│                                                             │
│  AI: Hier is de vergelijking 2023 vs 2024:                │
│      [Chart: Bar chart showing year-over-year]             │
│      • ProRail: +12% (€412M → €461M)                       │
│      • Rijkswaterstaat: -8% (€255M → €234M)               │
│      ...                                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Type your question...]                            [Send] │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Chat-based interaction (like Claude)
- AI responses include:
  - Natural language explanations
  - Embedded data tables
  - Visualizations (charts, graphs)
  - Follow-up suggestions
- Streaming responses (show as AI "types")
- Markdown support (bold, lists, links)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-005: AI Capabilities

**Requirement:** AI should function exactly like Claude, but specialized for Rijksfinanciën

**AI Behaviors:**

**1. Query Understanding**
- Natural language intent parsing
- Extract entities (recipients, years, modules, amounts)
- Disambiguate ambiguous queries ("ProRail" vs "ProRail Holding")

**2. Data Analysis**
- Execute complex queries (multi-table joins, aggregations)
- Trend analysis (year-over-year changes)
- Comparative analysis (recipient A vs recipient B)
- Statistical insights (averages, outliers, growth rates)

**3. Follow-up Suggestions**
- Example: "You searched for ProRail 2024, did you want to compare with 2023?"
- Example: "Shall I show you the breakdown by Instrument type?"
- Contextual, based on current conversation

**4. Pattern Explanation**
- Example: "Funding increased 23% year-over-year, primarily due to infrastructure investments"
- Example: "This recipient appears in 3 different modules, indicating diverse funding sources"

**5. Related Recommendations**
- Example: "Related recipients: Rijkswaterstaat, VolkerWessels (similar funding patterns)"
- Example: "This Regeling is also used by 15 other recipients"

**6. Report Generation**
- Summarize findings in natural language
- Generate executive summaries
- Create formatted reports (Markdown, PDF in V2.1)

**Priority:** P0 (Critical)
**Version:** V2.0

---

### RM-006: Multi-Step Analysis

**Requirement:** Users can perform complex, multi-step research workflows

**Workflow Example:**
```
Step 1: User: "Toon me de top 10 infrastructuur ontvangers in 2024"
        AI: [Shows data table]

Step 2: User: "Vergelijk deze met 2020"
        AI: [Shows comparison table + chart]

Step 3: User: "Welke hadden de grootste groei?"
        AI: "ProRail had de grootste groei: +34% (€345M → €461M)"

Step 4: User: "Toon me de detail voor ProRail"
        AI: [Shows ProRail breakdown by Instrument, Regeling, Budget]

Step 5: User: "Waar kan ik de wet voor deze regelingen vinden?"
        AI: [Links to wetten.overheid.nl, explains regulation]

Step 6: User: "Maak een samenvatting van deze analyse"
        AI: [Generates report summary]

Step 7: User: "Exporteer dit als CSV"
        AI: [Provides download link]
```

**AI Context Retention:**
- Remember entire conversation history
- Understand pronouns ("deze", "die organisatie", "het")
- Track entities across multiple queries
- Maintain filters across conversation

**Priority:** P0 (Critical)
**Version:** V2.0

---

## Data Visualization

### RM-007: Visualization Capabilities

**Requirement:** AI can generate visualizations on demand

**Supported Chart Types:**

**V2.0 (MVP):**
- **Bar charts** (comparisons, top N)
- **Line charts** (trends over time)
- **Pie charts** (distribution, composition)
- **Tables** (detailed data, sortable)

**V2.1 (Enhanced):**
- **Stacked bar charts** (multi-series comparison)
- **Area charts** (cumulative trends)
- **Scatter plots** (correlations)
- **Heatmaps** (multi-dimensional data)
- **Geographic maps** (location-based data from Publiek module)

**Visualization Features:**
- Interactive (hover for details, click to drill down)
- Downloadable (PNG, SVG)
- Embeddable (copy link to share)
- Customizable (colors, labels, legends)

**Trigger Phrases:**
- "Maak een grafiek van..."
- "Toon visueel..."
- "Vergelijk grafisch..."
- "Visualiseer..."

**Priority:** P0 (V2.0 charts), P1 (V2.1 advanced)
**Version:** V2.0 (MVP), V2.1 (enhanced)

---

### RM-011: Comparison Tools

**Requirement:** Side-by-side comparison capabilities

**Compare Recipients:**
```
User: "Vergelijk ProRail met Rijkswaterstaat over 2020-2024"

AI: [Shows side-by-side comparison table]

    | Metric           | ProRail    | Rijkswaterstaat |
    |------------------|------------|-----------------|
    | Total (2020-24)  | €1,834M    | €1,123M         |
    | Avg per year     | €367M      | €225M           |
    | Growth rate      | +34%       | -12%            |
    | Modules present  | 3          | 2               |
    | Top Instrument   | Bijdrage.. | Apparaat..      |

    [Chart showing year-over-year trends for both]
```

**Compare Years:**
```
User: "Vergelijk 2020 met 2024 voor alle infrastructuur ontvangers"

AI: [Shows comparison with % changes]
    • Total spending: +23% (€4.2B → €5.2B)
    • New recipients: 12
    • Discontinued: 3
    • Top gainers: [list]
    • Top decliners: [list]
```

**Compare Modules:**
```
User: "In welke modules ontvangt ProRail geld?"

AI: ProRail ontvangt in 3 modules:
    1. Financiële Instrumenten: €461M (2024)
    2. Apparaatsuitgaven: €12M (2024)
    3. Publiek: €8M (2024)

    [Chart showing distribution]
```

**Priority:** P0 (Critical)
**Version:** V2.0

---

## External Integrations

### RM-008: wetten.overheid.nl Integration

**Requirement:** AI can reference and link to legislation sources

**Capability:**
- Identify Regeling names in conversation
- Auto-link to wetten.overheid.nl when mentioned
- Fetch and summarize regulation text (via web scraping or API)
- Answer questions about legal context

**Example:**
```
User: "Waar kan ik de wet voor 'Bijdrage aan medeoverheden' vinden?"

AI: "De regeling 'Bijdrage aan medeoverheden' valt onder:
     • Infrastructuurfonds (artikel 8, lid 2)
     • Zie volledige tekst: [wetten.overheid.nl/link]

     Samenvatting: Deze regeling regelt bijdragen aan provincies,
     gemeenten en waterschappen voor infrastructuurprojecten..."
```

**Technical Implementation:**
- MCP tool: `fetch_regulation(regeling_name)`
- Web scraping: wetten.overheid.nl
- Caching: Store frequently accessed regulations
- Fallback: If not found, provide search link

**Priority:** P1 (High)
**Version:** V2.0 (basic linking), V2.1 (summarization)

---

## Workspace Features

### RM-009: Save, Annotate, Share

**Requirement:** Professional research workspace capabilities

#### Save Queries
- Bookmark searches with custom names
- Organize into folders/collections
- Quick re-run saved queries
- View query history (last 30 days)

#### Annotate Results
- Add notes to specific recipients, data points
- Highlight important findings
- Tag entries (e.g., "investigate further", "for report")
- Private notes (not shared)

#### Share Research
- Generate shareable link to conversation
- Link includes:
  - Full conversation transcript
  - All data tables and charts
  - Annotations (if marked as shareable)
- Expiration options (7 days, 30 days, never)
- Password protection (optional)

**Priority:** P1 (High - Save/Share), P2 (Medium - Annotate)
**Version:** V2.0 (Save/Share), V2.1 (Annotate)

---

## Export Capabilities

### RM-010: Export Formats

**Requirement:** Export data and reports in multiple formats

**Export Formats:**

**V2.0:**
- **CSV** (data tables)
- **Excel** (data tables with formatting)
- **PDF** (conversation transcript + visualizations)
- **Markdown** (conversation transcript)

**V2.1:**
- **JSON** (structured data, for developers)
- **PowerPoint** (auto-generated presentation)

**Export Limits:**
- **All accounts:** 500 rows per export (business constraint, never unlimited)
- Rate limit: Reasonable use (no hard limit for V1.0)

**Trigger Phrases:**
- "Exporteer dit als CSV"
- "Download deze data"
- "Geef me een Excel bestand"

**Priority:** P0 (CSV/Excel), P2 (PDF/Markdown)
**Version:** V2.0 (data exports), V2.1 (document exports)

---

### RM-012: Mobile Experience

**Requirement:** Research Mode available on mobile with limitations

**Desktop (Full Experience):**
- Full conversational interface
- All visualizations
- Split-screen views
- Saved queries sidebar

**Mobile (Limited Experience):**
- Quick questions only
- Example: "Hoeveel kreeg COA in 2023?"
- AI responds with brief answer + key number
- Data tables shown in mobile-optimized format
- Charts simplified (no complex interactivity)
- No annotations or complex workflows
- Redirect to desktop for full features

**Mobile Optimization:**
- Responsive chat interface
- Voice input (future V2.1)
- Swipe gestures for navigation
- Simplified export (email link to desktop)

**Priority:** P2 (Medium)
**Version:** V2.0 (basic), V2.1 (enhanced)

---

## Performance Requirements

### PERF-003: Response Time

**Requirement:** AI responses feel responsive despite complexity

**Behavior:**
- Show "thinking" indicator immediately
- Stream response (show tokens as they arrive)
- Prioritize text response (charts load after)
- Cache frequent queries

**Performance:**
- Time to first token: <500ms
- Full response (text only): <3s
- Full response (with chart): <5s
- Subsequent queries (cached): <500ms

**Priority:** P0 (Critical)
**Version:** V2.0

---

### PERF-004: Concurrent User Capacity

**Requirement:** Support multiple users simultaneously

**V2.0 Targets:**
- 100 concurrent users (search bar)
- 20 concurrent users (Research Mode)
- 500 AI queries/hour
- 10,000 searches/hour (total)

**Scaling:**
- Auto-scale backend (Railway)
- Horizontal scaling for API layer
- Queue for AI requests (prevent overload)

**Priority:** P1 (High)
**Version:** V2.0

---

### TECH-002: AI Cost Management

**Constraint:** AI API costs must be controlled

**Cost Controls:**
1. **Caching:** Cache all AI responses (Redis, 7-day TTL)
2. **Rate Limiting:**
   - Pro: N/A (no Research Mode)
   - Research: 100 queries/day
3. **Query Optimization:** Use cheaper models for simple queries
4. **Fallback:** If AI fails, fall back to keyword search

**Monitoring:**
- Track AI API spend daily
- Alert if >€100/day
- Circuit breaker if >€500/day

**Priority:** P0 (Critical)
**Version:** V2.0

---

## User Stories

### Epic 3: Research Mode

#### US-007: Natural Language Queries

**As a journalist, I want to ask questions in natural language**

**Acceptance Criteria:**
- I navigate to /research
- I type: "Welke organisaties ontvingen het meeste infrastructuurgeld in 2024?"
- Within 3 seconds, AI responds with:
  - Natural language answer
  - Data table (top 10)
  - Suggested follow-ups
- I can click "Vergelijk met 2023" suggestion
- AI shows comparison chart

**Priority:** P0 (V2.0) | **Story Points:** 21

---

#### US-008: Save Analysis

**As a researcher, I want to save my analysis**

**Acceptance Criteria:**
- I've had a 10-minute Research Mode conversation
- I click "Save Session"
- I enter name: "ProRail Infrastructure Analysis 2024"
- Session is saved to "My Research" section
- I can re-open it later and continue conversation
- I can share link to read-only version

**Priority:** P1 (V2.0) | **Story Points:** 13

---

#### US-009: Generate Visualizations

**As a policy analyst, I want to generate visualizations**

**Acceptance Criteria:**
- In Research Mode, I ask: "Maak een grafiek van infrastructuuruitgaven 2020-2024"
- AI generates line chart showing yearly totals
- Chart is interactive (hover for values)
- I can download chart as PNG
- I can ask: "Toon dit als staafdiagram"
- AI regenerates as bar chart

**Priority:** P0 (V2.0) | **Story Points:** 13

---

#### US-010: Find Legislation Sources

**As a journalist, I want to find legislation sources**

**Acceptance Criteria:**
- In Research Mode, I ask: "Waar kan ik de wet voor 'Bijdrage aan medeoverheden' vinden?"
- AI responds with:
  - Regulation name
  - Link to wetten.overheid.nl
  - Brief summary of what regulation covers
  - Which articles apply
- I can click link to open legislation in new tab

**Priority:** P1 (V2.0) | **Story Points:** 8

---

#### US-011: Export Research Findings

**As a user, I want to export research findings**

**Acceptance Criteria:**
- In Research Mode, I've analyzed ProRail data
- I ask: "Exporteer dit als Excel"
- AI generates Excel file with:
  - All data tables from conversation
  - Charts as images
  - Summary on first sheet
- Download link appears
- File downloads successfully (<100K rows for Research tier)

**Priority:** P1 (V2.0) | **Story Points:** 8

---

### Epic 4: Cross-Module Analysis

#### US-012: Compare Recipients Across Modules

**As a researcher, I want to compare recipients across modules**

**Acceptance Criteria:**
- In Research Mode: "In welke modules ontvangt ProRail geld?"
- AI shows:
  - List of modules (3)
  - Amount per module
  - Pie chart of distribution
  - Breakdown by year for each module
- I can ask: "Vergelijk dit met Rijkswaterstaat"
- AI shows side-by-side comparison

**Priority:** P0 (V2.0) | **Story Points:** 13

---

## Acceptance Criteria

### Research Mode (V2.0)

**Must Have:**
- ✅ Separate /research page with chat interface
- ✅ AI understands natural language queries
- ✅ Multi-step conversational analysis
- ✅ Generate bar, line, pie charts
- ✅ Save sessions
- ✅ Share read-only session links
- ✅ Export to CSV, Excel
- ✅ Compare recipients, years, modules
- ✅ Link to wetten.overheid.nl
- ✅ AI response <3s (P50)

**Should Have:**
- ✅ Fetch and summarize legislation
- ✅ Annotate results
- ✅ Custom visualizations
- ✅ Report generation
- ✅ Mobile limited mode

**Could Have:**
- PDF export with branding
- PowerPoint export
- Email reports
- Scheduled alerts (V2.1)
- Voice input (V2.1)
- Geographic search (V2.1)

---

## Version Roadmap

### V2.0 - Research Mode MVP (Weeks 9-16 post-V1.0)

**Goal:** AI-powered analysis tool for professionals

**Features:**
- Conversational AI interface (/research page)
- Natural language queries
- Multi-step analysis
- Data visualizations (bar, line, pie)
- Compare recipients/years/modules
- Save sessions, share links
- Export Excel
- wetten.overheid.nl linking

**Scope:** Research tier (premium), 5-10 pilot users

---

### V2.1 - Enhanced Research (Weeks 17-24)

**Goal:** Polish and expand Research Mode

**Features:**
- Advanced visualizations (heatmaps, scatter, maps)
- Legislation summarization (fetch and parse)
- Annotations and notes
- PDF/PowerPoint exports
- Mobile improvements
- Voice input
- Geographic search (Publiek module)

**Scope:** Full rollout, marketing push

---

## Open Questions

### Architecture Decisions (For V2.0 Planning)

**Q1: Search Engine Enhancement**
- Given Research Mode requirements (AI-heavy), do we need:
  - Vector search for semantic similarity?
  - Hybrid search (keyword + semantic)?
  - RAG (Retrieval-Augmented Generation) architecture?
- **Action:** Re-evaluate during V2.0 planning phase

**Q2: AI Model Selection**
- Research Mode is conversation-heavy (like Claude)
- Should we prioritize Claude for Research Mode?
- Cost implications of conversation length?
- **Action:** Cost analysis for typical research sessions

**Q3: Data Pipeline for Research Mode**
- Research Mode needs richer data than search bar
- Should we pre-compute common analyses?
- How to structure data for AI queries?
- **Action:** Design data layer for MCP tools

**Q4: Caching Strategy**
- 80% of queries repeat (assumption)
- How to cache AI conversations (complex)?
- When to invalidate cache (data updates)?
- **Action:** Define caching architecture

---

**Document Status:** Vision Document - V2.0 Planning
**Last Updated:** 2026-01-23
**Author:** Technical Project Manager (AI Assistant)

---

*This document is referenced from V1.0 search-requirements.md for context. Do not implement V2.0 features until V1.0 is complete and launched.*
