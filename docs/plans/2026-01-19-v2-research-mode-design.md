# V2.0 Research Mode - Design Document

**Date:** 2026-01-19
**Status:** Approved
**Source:** Brainstorm session + Eerste Kamer user interview

---

## Executive Summary

V2.0 introduces **Research Mode** - a conversational AI interface for professional analysis of government spending. Positioned as the **"Bloomberg Terminal for Rijksfinanciën"**.

### Key Paradigm Shift

| Aspect | V1.0 (Search) | V2.0 (Research Mode) |
|--------|---------------|----------------------|
| Entry point | Recipient (Ontvanger) | Policy Domain (Beleidsterrein) |
| Primary question | "Who received money?" | "Where does the tax euro go?" |
| User flow | Recipient → Payments | Domain → Trends → Recipients |
| Interface | Search bar + filters | Conversational AI |

---

## Target Users

- Eerste Kamer (Senate) staff
- Journalists (investigative)
- Political parties (oversight)
- Academic researchers
- Financial analysts

---

## Core Features

### 1. Domain-First Analysis

**IBOS Classification** (30 official Dutch policy domains)

| IBOS | Beleidsterrein |
|------|----------------|
| 01 | Openbaar bestuur en democratie |
| 02 | Openbare orde en veiligheid |
| 03 | Defensie |
| 04 | Buitenlandse zaken en internationale samenwerking |
| 05 | Justitie en rechtsorde |
| 06 | Migratie en asiel |
| 07 | Onderwijs |
| 08 | Wetenschap en innovatie |
| 09 | Cultuur, media en erfgoed |
| 10 | Volksgezondheid |
| 11 | Zorg |
| 12 | Sport en bewegen |
| 13 | Sociale zekerheid |
| 14 | Arbeidsmarkt |
| 15 | Inkomen en armoedebeleid |
| 16 | Volkshuisvesting en ruimtelijke ordening |
| 17 | Mobiliteit en transport |
| 18 | Infrastructuur |
| 19 | Milieu |
| 20 | Klimaat en energie |
| 21 | Natuur en biodiversiteit |
| 22 | Landbouw, visserij en voedsel |
| 23 | Economie en ondernemerschap |
| 24 | Industrie en handelsbeleid |
| 25 | Digitalisering en informatiebeleid |
| 26 | Overheidsorganisatie en rijksdienst |
| 27 | Belastingen en fiscale regelingen |
| 28 | Financiële markten |
| 29 | Ontwikkelingssamenwerking (thematisch) |
| 30 | Overig / generiek rijksbeleid |

**AI Classification:**
- Clear cases: Use existing metadata (Begrotingsnaam, Artikel, etc.)
- Ambiguous cases: AI infers IBOS code from recipient + context
- Shows confidence level and reasoning

**User Personalization:**
- Users select their "focus domains"
- Dashboard prioritizes selected domains
- Different users, different views (journalist vs politician)

---

### 2. Query Types Supported

| Query Type | Example | Output |
|------------|---------|--------|
| Distribution | "Waar gaat de belastingeuro naartoe?" | Percentage breakdown by domain |
| Trend | "Hoe ontwikkelt zorguitgaven over tijd?" | Year-over-year comparison |
| Comparison | "Vergelijk onderwijs vs zorg spending" | Side-by-side analysis |
| Top N | "Welk bedrijf kreeg het meest in 2024?" | Ranked list |
| Groeiers/Dalers | "Snelste groeiers in Zorg" | Growth/decline ranking |
| Drill-down | "Wie ontvangt meeste in domein X?" | Recipients within domain |
| Anomaly | "Waarom steeg uitgaven in 2023?" | AI explanation of patterns |

---

### 3. Comparison Capabilities

All comparison types supported:

| Comparison | Example |
|------------|---------|
| Recipient vs Recipient | ProRail vs Rijkswaterstaat |
| Year vs Year | 2020 vs 2024 |
| Domain vs Domain | Zorg vs Onderwijs |
| Module vs Module | Instrumenten vs Apparaat |

---

### 4. Visualizations

**Standard (V2.0):**
- Bar charts
- Line charts
- Pie charts

**Advanced (V2.0):**
- Sankey diagrams (money flow: source → domain → recipient)
- Treemaps (hierarchical spending breakdown)
- Heatmaps (year × domain matrix)

All charts:
- Interactive (hover, click, zoom)
- Downloadable (PNG, SVG)
- Embeddable in exports

---

### 5. wetten.overheid.nl Integration

**Must-have for V2.0**

- Every Regeling links to corresponding legislation
- AI can reference legal basis for spending
- Deep links to specific articles

**Implementation:**
```
User: "Wat is de wettelijke basis voor deze regeling?"
AI: "De regeling 'Bijdrage aan medeoverheden' valt onder het
     Infrastructuurfonds (artikel 8, lid 2).
     Zie: [wetten.overheid.nl/BWBR...]"
```

---

### 6. Workspace Features

**V2.0:**
| Feature | Status |
|---------|--------|
| Save queries | ✅ Included |
| Export CSV/Excel | ✅ Included |
| Export PDF reports | ✅ Included (results only, no chat) |
| Share read-only links | ✅ Included |
| Alerts | ⏸️ Low priority (data is static) |

**Later versions:**
| Feature | Version |
|---------|---------|
| PowerPoint export | V2.1 |
| Share + comment | V2.1 |
| Full collaboration | V2.2+ |

---

### 7. Module Coverage

**All modules have same Research Mode capabilities:**
- Financiële Instrumenten
- Apparaatsuitgaven
- Inkoopuitgaven
- Provinciale Subsidieregisters
- Gemeentelijke Subsidieregisters
- Publiek
- Integraal zoeken

No special treatment per module.

---

## Technical Requirements

### AI Architecture
- Primary: Claude Sonnet 4.5 (conversational, MCP support)
- Fallback: OpenAI GPT-4
- Orchestration: LangChain
- Context: 200K tokens (full conversation history)

### Data Layer
- IBOS domain mapping (new)
- Pre-computed analytics tables
- wetten.overheid.nl integration (MCP tool)

### Performance
- AI response: <3 seconds (text)
- AI response with chart: <5 seconds
- Streaming responses (show as AI "types")

---

## Pricing

**Model:** Premium tier over V1.0 base
**Exact pricing:** TBD at V2.0 launch

**Considerations:**
- Hybrid (base + included queries + overage) OR
- Flat unlimited with fair use policy
- Professional users prefer predictable budgets

---

## Out of Scope (V2.0)

### Parked for V2.1
- PowerPoint export
- Share + comment collaboration
- Voice input
- Geographic visualization (maps)

### Parked for V3.0 (requires begroting data)
- Under-spending detection (onderuitputting)
- Budget vs actual comparison
- Cash shift tracking (kasverschuivingen)

---

## Version Roadmap

| Version | Focus | Timeline |
|---------|-------|----------|
| V1.0 | Search migration | 8 weeks |
| V2.0 | Research Mode + Domain analysis | +12 weeks |
| V2.1 | Enhanced exports + collaboration | +8 weeks |
| V3.0 | Budget analysis (needs new data) | TBD |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Research Mode adoption | 30% of subscribers |
| AI response time | <3s (P50) |
| Query success rate | 95%+ |
| User satisfaction | NPS >50 |
| Premium tier conversion | 20% of V1.0 users |

---

## Open Questions

1. **IBOS mapping effort:** How much manual classification needed vs AI-derived?
2. **wetten.overheid.nl API:** Official API available or scraping needed?
3. **Pricing validation:** Test pricing with pilot users before launch

---

## Appendix: Eerste Kamer Interview Insights

Key observations from user research:

1. **Entry point matters:** Users think in domains, not recipients
2. **Trend analysis critical:** Year-over-year changes, not snapshots
3. **Duyserberg method:** Map all spending to policy domains
4. **Tax euro question:** "What percentage goes where?"
5. **Efficiency focus:** More money ≠ better policy
6. **Legal context:** Link to legislation is must-have

---

**Document Status:** Approved
**Next Steps:** Update search-requirements.md, begin wireframes
