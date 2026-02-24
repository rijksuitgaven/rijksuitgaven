# V5.0 Inzichten — Lab Prototype Design

**Created:** 2026-02-24
**Status:** Approved for lab prototype (h6)
**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Mei (Dashboard UX), Dara (Adversarial Strategist)

---

## Context

V5.0 "Inzichten" will add interactive data visualization dashboards to Rijksuitgaven.nl. The current V2 platform is table-based — great for lookup ("how much did ProRail get?") but unable to reveal patterns, trends, or structural changes in Dutch government spending.

This document captures the expert team discussion and approved visualization concepts for the lab prototype at `/team/lab/h6`.

---

## What V2 Cannot Show (and V5 Should)

- Aggregate patterns (total spending per ministry over time)
- Distribution shapes (how many recipients get what amount ranges)
- Cross-module relationships (same recipient in multiple modules)
- Concentration/diversity (is spending becoming more or less concentrated)
- Anomaly detection beyond simple YoY%
- Comparative views (province vs province, ministry vs ministry)
- New entrant detection (who appeared for the first time with large amounts)

---

## Key Adversarial Findings

These findings apply to ALL visualizations and informed every design decision:

1. **Geographic visualization killed** — Only publiek has PostGIS data (~7% of total). A choropleth would irresponsibly imply it represents 100% of spending.
2. **2024 data may be incomplete** — Every concept must flag 2024 with asterisk and footnote.
3. **Entity resolution imperfections** — "First appearance" ≠ "new organization." Language must say "Eerste verschijning in deze dataset."
4. **x1000 unit mismatch** — instrumenten/apparaat amounts are x1000. ALL normalization happens in the BFF, never client-side.
5. **Provenance required** — Every visualization needs a footer: source modules, last updated, scope description.
6. **Area perception bias** — Treemaps must include explicit numeric labels. Size alone misleads.
7. **Rank hides magnitude** — The Movers concept provides an absolute-amount toggle to prevent this.

---

## Approved Concepts

### Concept 1: Spending Pulse (Dashboard Landing)

**One-line:** Single-screen overview with headline KPIs, trend indicators, and stacked area hero chart.

**Aha moment:** There is no single place today where a user can see the overall shape of Dutch government spending in one glance.

**Data:** `universal_search` for headline numbers, individual `*_aggregated` views for module breakdown.

**Interaction:**
- 4-6 KPI cards (Totale uitgaven, Unieke ontvangers, Grootste ontvanger, Gemiddeld per ontvanger)
- Each card: current year value, 9-year sparkline, delta vs previous year
- Hero chart: stacked area by module (6 colors), hover cross-hair, toggleable modules
- Navigation cards linking to the other 5 concepts

**Tech:** Recharts (AreaChart + LineChart sparklines). BFF: `GET /api/v1/inzichten/pulse`.

**Effort:** 4-5 hours.

---

### Concept 2: New Money (New Entrant Detector)

**One-line:** For each year, surface recipients who appeared for the first time with significant amounts.

**Aha moment:** In 2022, 14 organizations received >€10M for the first time. Which ministry? Which regulation? This is oversight gold.

**Data:** All 6 `*_aggregated` views. First-appearance computed from year columns (first non-zero year).

**Interaction:**
- Year selector bar (2017-2024, not 2016 since no prior data)
- Threshold slider (€100K / €1M / €10M / €50M)
- Horizontal bar chart sorted by first-year amount
- Click bar → accordion with cross-module timeline, ministry context, subsequent years
- Summary stat: "In [year], [N] nieuwe ontvangers ontvingen samen €[X]"

**Tech:** Recharts (BarChart vertical layout). BFF: `GET /api/v1/inzichten/new-entrants?year=2022&min_amount=1000000`.

**Adversarial mitigations:**
- Label: "Eerste verschijning in deze dataset" (not "Nieuwe ontvanger")
- Exclude 2016 from selector (no prior data to compare)
- Negative amounts filtered out
- Cross-module presence shown to catch entity resolution gaps

**Effort:** 5-6 hours.

---

### Concept 3: The Movers (Ranked Line Chart)

**One-line:** Track top 25 recipients' rank positions over 9 years — who's rising, falling, entering, exiting.

**Aha moment:** The "top 10" is not static. An organization that was #3 in 2016 might be #18 in 2024.

**Data:** Any `*_aggregated` view (user selects module). RANK() OVER per year column.

**Interaction:**
- Module selector dropdown
- 25 lines, all muted gray by default
- Hover: bold + pink highlight, others fade to 10% opacity
- Click: pin up to 3 recipients for comparison
- Toggle: "Positie" (rank, inverted Y-axis) / "Bedrag" (absolute amount)
- Tooltip always shows absolute amount regardless of view mode

**Tech:** Recharts (LineChart). BFF: `GET /api/v1/inzichten/movers?module=instrumenten&top=25`.

**Adversarial mitigations:**
- Rank mode: tooltip always shows absolute amount
- Label: "Top 25 van X.XXX ontvangers" for scale context
- 2024 flagged with asterisk

**Effort:** 5-6 hours.

---

### Concept 4: Ministry DNA (Small Multiples Sparkline Grid)

**One-line:** Vital-signs dashboard showing every ministry's spending behavior across 5 metrics, each as a 9-year sparkline.

**Aha moment:** A ministry whose total spending is flat but recipient count is dropping = consolidation. Money is concentrating. Visible at a glance across all 12-15 ministries.

**Data:** `instrumenten_aggregated` for totals, `instrumenten` source table for per-year breakdowns (recipient count, regeling count, concentration).

**Five metrics per ministry:**
1. Totale uitgaven (total spending)
2. Ontvangers (unique recipient count)
3. Gemiddeld per ontvanger (average per recipient)
4. Top-5 concentratie (% to top 5 recipients)
5. Regelingen (distinct regulation count)

**Interaction:**
- Grid: rows = ministries, columns = metrics
- Each cell: tiny sparkline (80x30px) with direction color (navy=rising, pink=declining, gray=flat)
- Hover cell: expand to full chart with values
- Click ministry row: link to Spending Landscape filtered to that ministry

**Tech:** Recharts (small LineCharts). BFF: `GET /api/v1/inzichten/ministry-dna`. Source table queries for concentration metrics.

**Adversarial mitigations:**
- Direction color requires >10% change threshold (prevents noise)
- First column shows total in large text (prevents scale confusion)
- Sparklines show shape, not scale — explicitly stated in legend
- Label: "Bron: Instrumenten" (doesn't cover other modules)

**Effort:** 7-8 hours.

---

### Concept 5: Spending Landscape (Zoomable Treemap)

**One-line:** Interactive treemap revealing hierarchical spending structure: Ministry → Regulation → Instrument type.

**Aha moment:** Most ministry spending flows through a small number of regulations. VWS might route 80% through just 3 of its 30 regelingen.

**Data:** `instrumenten_aggregated` grouped by begrotingsnaam, regeling, instrument.

**Interaction:**
- Default: all ministries as top-level rectangles (sized by amount)
- Click to zoom: ministry → regelingen → instrument types
- Recipients shown as table below treemap (not inside it)
- Year toggle + comparison mode (split-screen Year A vs Year B)
- Breadcrumb: "Alle ministeries > VWS > Zorgverzekeringswet"

**Tech:** D3 (d3-hierarchy + d3-treemap). BFF: `GET /api/v1/inzichten/spending-tree?year=2024`.

**Adversarial mitigations:**
- Every cell shows exact Euro amount (area perception bias)
- Color = YoY change, NOT amount (avoids double-encoding)
- COALESCE null regeling/instrument to "Geen regeling" etc.
- Label: "Instrumenten — subsidies, bijdragen en leningen" (module scope)

**Effort:** 6-7 hours.

---

### Concept 6: Dependency Radar (Cross-Module Presence)

**One-line:** Visualize organizations by how many spending modules they appear in — revealing systemic embedding.

**Aha moment:** Some organizations appear across 4-5 modules simultaneously. An organization receiving subsidies AND procurement contracts AND publiek grants is deeply embedded.

**Data:** `universal_search` (source_count, sources). Individual `*_aggregated` for drill-down.

**Interaction:**
- Concentric rings: center = 6 modules, outer = fewer modules
- Each dot = one organization, sized by total amount
- Hover: tooltip with name, total, modules, years active
- Click: detail panel with per-module breakdown (stacked bar) + per-module sparklines
- Filter: min source_count slider, min total amount
- Table toggle for accessibility/precision
- Default: min_sources=3 (where surprises live, per Koen)

**Tech:** D3 (radial layout). BFF: `GET /api/v1/inzichten/cross-module?min_sources=3`.

**Adversarial mitigations:**
- Neutral framing: "Organisaties in meerdere bronnen" (not "afhankelijkheid")
- Table toggle is prominent (radial is for discovery, table for precision)
- Info tooltip: "Op basis van naamherkenning. Sommige organisaties kunnen onder meerdere namen voorkomen."

**Effort:** 7-8 hours.

---

## Shared Architecture

### BFF Routes
```
/api/v1/inzichten/pulse          → KPIs + hero chart data
/api/v1/inzichten/new-entrants   → first-appearance data
/api/v1/inzichten/movers         → ranked recipient time series
/api/v1/inzichten/ministry-dna   → sparkline matrix
/api/v1/inzichten/spending-tree  → treemap hierarchy
/api/v1/inzichten/cross-module   → multi-source presence
```

### Principles
- All amounts normalized to absolute EUR in BFF (never client-side)
- 24h cache TTL, invalidated on data refresh
- Every response includes `data_notes`: last_updated, year_completeness, amount_unit, scope
- Every visualization has a provenance footer

### Build Order
1. Spending Pulse (landing page, simplest, frames everything)
2. New Money (highest journalistic impact)
3. The Movers (high insight value, Recharts-native)
4. Ministry DNA (rich but needs source table queries)
5. Spending Landscape (D3 treemap)
6. Dependency Radar (D3 radial)

**Total estimated effort: 34-40 hours.**

---

## Tech Stack
- **Recharts** — Concepts 1-4 (standard charts)
- **D3** — Concepts 5-6 (treemap, radial layout)
- **React** — All components
- **IBM Plex Sans Condensed** — Data typography
- **Brand colors:** navy-dark (#1a2332), pink (#e91e63), navy-medium (#5a6577)
