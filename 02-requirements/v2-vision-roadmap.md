# V3.0 Vision & Roadmap

**Created:** 2026-01-20
**Status:** Vision / Planning
**Tagline:** "The Bloomberg Terminal for Rijksfinancien"

---

## Vision

Transform Rijksuitgaven from a search tool into the definitive platform for understanding Dutch government spending - where data becomes insight, patterns become stories, and spending becomes accountability.

---

## Target Audience

### Primary (Well-Funded)

| Segment | Why They Pay | Budget |
|---------|--------------|--------|
| **Political Parties** | Research for policy, budget debates, opposition work | High |
| **Media Organizations** | Investigative journalism, data stories | High |
| **Consultancies** | Advisory services, market intelligence | High |

### Secondary

| Segment | Why They Pay | Budget |
|---------|--------------|--------|
| **NGOs/Watchdogs** | Monitoring, advocacy, accountability | Medium |
| **Academic Researchers** | Publications, policy research | Medium |
| **Government (Internal)** | Benchmarking, analysis | Medium |

---

## The V3.0 Difference

| V2.0 | V3.0 |
|------|------|
| Search for recipients | Discover patterns |
| View spending data | Understand spending context |
| Export tables | Generate insights |
| Individual data points | Connected information |
| "What was spent" | "Why, who, and what changed" |

---

## Core Feature Pillars

### Pillar 1: Follow the Money to the People

**Problem:** Users can see who receives money, but not who controls those organizations or how people are connected across recipients.

**Solution:** Company profiles with board of directors, cross-recipient connections, and people networks.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Company Profile: ProRail B.V.                                   KvK: 30124359│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Total Received: €8.2B (2016-2024)                                           │
│                                                                              │
│ SPENDING TREND                          SOURCES                              │
│ ████████████████████ 2024: €1.2B       • Fin. Instrumenten: €7.8B           │
│ ██████████████████   2023: €1.1B       • Inkoop: €400M                      │
│ ████████████████     2022: €980M       • Publiek: €50M                      │
│ ██████████████       2021: €890M                                            │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ BOARD OF DIRECTORS                                                           │
│ • J. van der Berg (CEO) - Also at: NS, Tennet                               │
│ • M. de Vries (CFO) - Also at: Schiphol Group                               │
│ • A. Jansen (COO) - Previously: RWS, Min. I&W                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ TOP REGELINGEN                          RELATED RECIPIENTS                   │
│ • Beheer & onderhoud spoor: €4.2B      • NS Reizigers B.V.                  │
│ • Realisatie pers. vervoer: €2.1B     • Rijkswaterstaat                     │
│ • Kapitaalstorting: €1.5B             • Schiphol Group                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ LINKED LEGISLATION                                                           │
│ • Spoorwegwet (2003)                                                        │
│ • Concessiewet personenvervoer                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Company profiles based on KvK registration
- Board of directors with cross-references
- "Also at" connections (people appearing at multiple recipients)
- Historical leadership changes
- Related recipients (same board members, same sector)

---

### Pillar 2: My Government Priorities

**Problem:** Users care about specific policy areas but data is organized by recipient/regeling, not by user interests.

**Solution:** Let users define their priorities and see how government spending aligns (or doesn't).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ My Government Priorities                                     [Edit Priorities]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Your Priorities (2024)                                                       │
│                                                                              │
│ Climate & Energy     ████████████████████████████  €12.4B  (18%)            │
│ Education            ██████████████████████        €9.8B   (14%)            │
│ Healthcare           ██████████████████████        €8.2B   (12%)            │
│ Infrastructure       ██████████████████            €7.1B   (10%)            │
│ ─────────────────────────────────────────────────────────────               │
│ YOUR PRIORITIES TOTAL                              €37.5B  (54%)            │
│ Other spending                                     €32.1B  (46%)            │
│                                                                              │
│ Trend: Your priorities received +8% vs last year                            │
│                                                                              │
│ [Share] [Create Alternative Budget] [Export Report]                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- User-defined priority areas (mapped to IBOS domains)
- "My spending" vs "Other spending" breakdown
- Year-over-year trend for user's priorities
- Shareable priority views
- **PR Feature:** "Create Your Alternative Budget" (viral potential)

---

### Pillar 3: Trends & Visual Reports

**Problem:** Users can see data but have to do their own trend analysis in Excel.

**Solution:** Built-in trend analysis with publication-ready visualizations.

**Features:**
- Trend charts with annotations
- Year-over-year change detection
- Growth/decline patterns by sector
- "What's new" - new recipients, new regelingen
- "What changed" - significant increases/decreases
- Export as PNG, SVG, PDF
- Embed codes for websites

**Visual Types:**
- Time series (spending over years)
- Comparison bars (recipients, sectors)
- Sankey diagrams (money flows)
- Geographic maps (by province/gemeente)
- Treemaps (spending composition)

---

### Pillar 4: Connected Data (Research Mode)

**Problem:** Spending data is isolated - users can't connect it to legislation, policy documents, or outcomes.

**Solution:** Integrate external data sources to provide context.

**Data Sources:**

| Source | Data | Integration |
|--------|------|-------------|
| **KvK (Handelsregister)** | Company info, board members | API (paid) |
| **wetten.overheid.nl** | Legislation text | Scraping |
| **rijksfinancien.nl** | Budget explanations | Scraping |
| **Kamerstukken (Parlementaire docs)** | Policy context | API |
| **OpenCorporates** | International company data | API |

**Features:**
- Regeling → Wet → Kamerstuk connections
- "Why does this regeling exist?" context
- Policy timeline for spending areas
- AI-assisted research ("Explain the trend in defense spending")

---

### Pillar 5: Collaboration (Future)

**Problem:** Teams work in silos, can't share findings easily.

**Solution:** Team workspaces, shared queries, annotations.

**Features (Future):**
- Team workspaces
- Shared saved searches
- Annotations on data points
- Comments and discussion threads
- Shared dashboards
- Role-based access

---

## Feature Roadmap

### Phase 1: Research Foundation
*First 6 weeks of V3.0 development*

| Feature | Priority | Effort |
|---------|----------|--------|
| AI Research Assistant | High | Large |
| IBOS Domain Navigation | High | Medium |
| Basic Trend Charts | High | Medium |
| Company Profiles (basic) | High | Medium |

### Phase 2: Deep Connections
*Weeks 7-12*

| Feature | Priority | Effort |
|---------|----------|--------|
| KvK Integration (board members) | High | Large |
| "My Priorities" Budget View | High | Medium |
| Advanced Visualizations | Medium | Medium |
| Wet ↔ Regeling Mapping | Medium | Large |

### Phase 3: Network Intelligence
*Weeks 13-18*

| Feature | Priority | Effort |
|---------|----------|--------|
| People Connections Network | Medium | Large |
| Cross-recipient Analysis | Medium | Medium |
| Report Builder | Medium | Medium |
| Alternative Budget Builder (PR) | Low | Small |

### Phase 4: Collaboration & API
*Future (V3.5+)*

| Feature | Priority | Effort |
|---------|----------|--------|
| Team Workspaces | Future | Large |
| Shared Saved Searches | Future | Medium |
| Alerts & Notifications | Future | Medium |
| API Access | Future | Large |
| Embeddable Widgets | Future | Medium |

---

## Pricing Strategy

### Proposed Tiers

| Tier | Price | Target | Key Features |
|------|-------|--------|--------------|
| **Professional** | €150/mo | Individuals | V2.0 features |
| **Research** | €350/mo | Power users | + AI, trends, company profiles |
| **Newsroom** | €800/mo | Media teams | + 5 seats, collaboration |
| **Political** | €1,500/mo | Parties, large orgs | + unlimited seats, custom reports |
| **Enterprise** | Custom | Consultancies | + API, white-label, SLA |

### Annual Discount
- Monthly × 10 for annual (2 months free)
- Research: €3,500/year
- Newsroom: €8,000/year
- Political: €15,000/year

---

## Data Requirements

### New Data Sources Needed

| Source | Purpose | Access Method | Cost |
|--------|---------|---------------|------|
| KvK Handelsregister | Company/director data | API | ~€500-2000/year |
| wetten.overheid.nl | Legislation | Scraping | Free |
| rijksfinancien.nl | Budget context | Scraping | Free |
| Kamerstukken | Parliamentary docs | Open API | Free |
| OpenCorporates | Company enrichment | API | Freemium |

### Data Processing

- KvK matching for all recipients with KvK numbers
- Entity resolution for board member names
- Wet-Regeling relationship mapping
- IBOS domain classification for all spending

---

## Technical Considerations

### AI/ML Requirements

| Capability | Use Case | Approach |
|------------|----------|----------|
| Research Assistant | Answer questions about spending | Claude API |
| Trend Detection | Identify anomalies, patterns | Statistical + ML |
| Entity Matching | Link people across organizations | Fuzzy matching + ML |
| Document Understanding | Extract from legislation | Claude/embedding |

### Infrastructure Additions

- Vector database for semantic search (pgvector)
- Background job processing for data enrichment
- Caching layer for expensive queries
- PDF/image generation for reports

---

## Success Metrics

### V3.0 Launch Goals

| Metric | Target |
|--------|--------|
| Research tier conversions | 20% of Professional users upgrade |
| New segment acquisition | 5 media organizations, 3 political parties |
| Feature engagement | 60% of Research users use AI assistant weekly |
| Revenue increase | 2x MRR within 6 months of V3.0 launch |

### User Value Indicators

- Time to insight (reduced from hours to minutes)
- Reports generated per user
- Saved searches created
- Return visit frequency

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| KvK data costs | Budget | Start with top 1000 recipients, expand gradually |
| Scraping legality | Legal | Check terms, use official APIs where available |
| AI costs | Budget | Aggressive caching, rate limiting |
| Scope creep | Timeline | Strict phase gates, MVP each feature |
| Low conversion | Revenue | Validate pricing with early adopters |

---

## Timeline Overview

```
V2.0 Launch ──────────────────────────────────────────────────────────────────>
             |         V3.0 Phase 1        |    Phase 2    |    Phase 3    |
             |   Research + Trends + KvK   | Connections   | Network + PR  |
             |        (6 weeks)            |  (6 weeks)    |  (6 weeks)    |
             |                             |               |               |
        V2.0 Done                     V3.0 Alpha      V3.0 Beta       V3.0 Launch
```

---

## UI/UX Decisions

### Research Interface: "Guided Research Assistant"

| Decision | Outcome |
|----------|---------|
| Entry point | Topic-first (policy domains), not empty search box |
| User skill level | Visual users, not comfortable with prompting or graph building |
| AI behavior | **Factual only, NO opinions** - present data, never interpret |
| Visualizations | Pre-built, one-click - users don't build their own |
| Workflow | "Add to dossier" collection model, not dashboard building |
| Output purpose | Insights for debates, articles, news (shareable, quotable) |

### Dossier Feature

| Decision | Outcome |
|----------|---------|
| Persistence | Save forever (no auto-cleanup) |
| Collaboration | Solo first, shared dossiers in future |
| Evolution path | Solo → Shared → Published (citable public resource) |

### Export & Sharing

| Decision | Outcome |
|----------|---------|
| Branding | "Powered by Rijksuitgaven" watermark on all exports |
| Formats | PDF, PowerPoint, embed code, social image, CSV |
| Quotable snippets | Auto-generated shareable text with data |

### AI Assistant Rules

**CRITICAL:** The AI assistant must be strictly factual.

| ✅ Allowed | ❌ Not Allowed |
|-----------|----------------|
| "Spending increased 340%" | "This is remarkable growth" |
| "BIJ12 receives 68% of total" | "BIJ12 receives a disproportionate amount" |
| "Trend started after 2019 law" | "The law clearly caused this increase" |
| "These organizations share board members" | "This suggests coordination" |

The AI presents data and connections. Users draw conclusions.

---

## Open Questions

1. **Topic categories:** Use IBOS domains or user-friendly labels? (TBD)
2. **KvK Integration:** Direct API or third-party enrichment service?
3. **Pricing validation:** Test prices with target segments before launch?
4. **AI budget:** How much per user per month is acceptable?
5. **Legislation scraping:** Legal review needed?
6. **People connections:** Privacy considerations for board member data?

---

## UI Concept: Topic-First Research Flow

### Step 1: Choose Topic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     Waar wilt u inzicht in?                                                │
│                                                                             │
│     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│     │ 🌍          │ │ 🏥          │ │ 🏠          │ │ 🛡️          │        │
│     │ Klimaat &   │ │ Zorg &      │ │ Wonen &     │ │ Defensie &  │        │
│     │ Energie     │ │ Welzijn     │ │ Infra       │ │ Veiligheid  │        │
│     └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                             │
│     Of zoek op onderwerp: [wolf bescherming________________] 🔍            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: AI Shows Overview + Suggests Next Steps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌾 Landbouw & Natuur › Wolf bescherming                    [+ Aan dossier] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📊 OVERZICHT                                                            │ │
│ │ Totaal uitgaven wolf-gerelateerd: €47.2M (2016-2024)                   │ │
│ │ [Auto-generated trend chart]                                            │ │
│ │ 📈 +340% sinds 2019                                  [Delen] [Opslaan] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 💡 FEITEN (automatisch gegenereerd)                                     │ │
│ │ • 68% gaat naar één ontvanger: BIJ12                                   │ │
│ │ • Provincies Gelderland en Drenthe ontvangen 80% van totaal            │ │
│ │                                                                         │ │
│ │ [Meer over BIJ12] [Vergelijk provincies] [Bekijk regelingen]           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 TOP ONTVANGERS                                                       │ │
│ │ 1. BIJ12                           €32.1M  ████████████████████  68%   │ │
│ │ 2. Provincie Gelderland            €6.2M   ████                  13%   │ │
│ │ [Bekijk alle ontvangers →]                                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: One-Click Deep Dive (Company Profile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 BIJ12                                                   [+ Aan dossier] │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ TOTAAL: €32.1M (2016-2024)        │ │ TREND [chart]                     │ │
│ │ 📈 +89% t.o.v. vorig jaar         │ │                                   │ │
│ └───────────────────────────────────┘ └───────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 💡 CONTEXT (factual only)                                               │ │
│ │ BIJ12 is de uitvoeringsorganisatie van alle provincies voor            │ │
│ │ faunaschade-vergoedingen. Groei samenvallend met:                      │ │
│ │ • Toenemend aantal wolven (van 3 naar 8 roedels, 2019-2024)            │ │
│ │ • Uitbreiding schaderegeling in 2021                                   │ │
│ │ Gerelateerde wetgeving: Wet natuurbescherming (2017)                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📋 REGELINGEN  │  🔗 GERELATEERDE ONTVANGERS                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 4: Build & Export Dossier

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📁 Dossier: "Wolf bescherming onderzoek"                   [Delen] [Export]│
├─────────────────────────────────────────────────────────────────────────────┤
│ 📝 SAMENVATTING (bewerkbaar)                                               │
│ [User's own notes and summary]                                             │
│                                                                             │
│ OPGESLAGEN ITEMS (4)                                                        │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ 📊 Trend     │ │ 💡 Feiten    │ │ 🏢 BIJ12     │ │ 📋 Regelingen│        │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                             │
│ EXPORTEREN ALS                                                              │
│ [📄 PDF] [📊 PowerPoint] [🔗 Deel link] [📰 Embed] [📋 CSV]                │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────  │
│                                        Powered by Rijksuitgaven.nl         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [Research Mode Vision (V6.0)](./research-mode-vision.md) - Detailed V6.0 specifications
- [ADR-008 to ADR-012: V3.0 Reporter Decisions](../08-decisions/)
- [IBOS Classification](./ibos-classification.md)
- [Search Requirements (V2.0)](./search-requirements.md)

---

## Appendix: "Bloomberg Moment" Stories

### Journalist Story
> "I searched for 'klimaat' and Rijksuitgaven showed me that one small foundation received €40M over 3 years - more than the entire province of Limburg. I clicked through to see the board: three former ministry officials. The company profile showed they also sat on boards of two other recipients totaling €120M. That became my front-page investigation."

### Political Party Story
> "Before the budget debate, we used 'My Priorities' to show that despite the coalition's climate promises, only 12% of new spending went to climate-related regelingen. We shared the visualization on social media - it was viewed 50,000 times and quoted in three newspapers."

### Researcher Story
> "I asked the AI assistant: 'Which recipients saw the largest spending increases in healthcare during COVID?' Within seconds, I had a list of 50 organizations with trend charts. What used to take me weeks of data gathering now takes an afternoon of analysis."
