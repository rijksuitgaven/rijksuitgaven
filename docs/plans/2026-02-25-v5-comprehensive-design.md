# V5.0 Inzichten — Comprehensive Dashboard Design

**Created:** 2026-02-25
**Status:** Approved design — lab prototypes
**Builds on:** `docs/plans/2026-02-24-v5-inzichten-design.md` (concepts 1-9)
**Expert Teams:** Per-domain teams, each with Adversarial Strategist + Creative Strategist

---

## Overview

This document extends the V5.0 Inzichten lab prototype from 9 to 21 visualization concepts, organized across 7 analytical domains. Each domain answers a fundamental question about Dutch government spending.

The design follows a "Government Spending Dashboard" framework — not just data display, but analytical reasoning tools that support transparency, accountability, pattern detection, and comparative reasoning.

### The 7 Analytical Domains

| # | Domain | Core Question | Concepts |
|---|--------|--------------|----------|
| 1 | Composition | Where is the money going? | 1, 5, 9, **10**, **11** |
| 2 | Trend & Dynamics | How is spending evolving? | 1, 3, 4, 7, **12**, **13** |
| 3 | Budget vs. Actual | Did we spend what we planned? | **14** (proxy) |
| 4 | Outlier & Anomaly | What looks unusual? | 7, 8, **15** |
| 5 | Structural Flow | How does money move? | 6, 9, **16** |
| 6 | Efficiency & Performance | What outcomes per euro? | **17**, **18**, **19** |
| 7 | Ranking & Comparison | Who spends more or less? | 2, 3, **20**, **21** |

### Data Limitation Flags

Two domains have fundamental data gaps, addressed with honest proxies:

- **Domain 3 (Budget vs. Actual):** No begrotingsdata in database. Proxy: rolling 3-year average as statistical baseline. Never labeled "budget afwijking."
- **Domain 6 (Efficiency):** No outcome/output metrics. Proxies: spending structure, per-capita, and regeling distribution analysis. Never labeled "efficiency" without qualification.

---

## Existing Concepts (1-9)

See `docs/plans/2026-02-24-v5-inzichten-design.md` for full specifications.

| # | Name | Domain | Status |
|---|------|--------|--------|
| 1 | Spending Pulse | Composition, Trend | Built |
| 2 | New Money | Ranking | Built |
| 3 | The Movers | Trend, Ranking | Built |
| 4 | Ministry DNA | Trend | Built |
| 5 | Spending Landscape (Treemap) | Composition | Built |
| 6 | Dependency Radar | Flow | Built |
| 7 | Concentration Index | Outlier, Trend | Built |
| 8 | Anomaly Detector | Outlier | Built |
| 9 | Money Flow (Sankey) | Flow | Built |

---

## Domain 1: Composition — "Where is the money going?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Existing coverage:** Pulse (module-level stacked area), Treemap (ministry hierarchy), Sankey (flow).
**Gap:** No temporal share comparison. No 4-level deep hierarchy explorer.

### Concept 10: Share Shift (Proportional Allocation Over Time)

**One-line:** How has the proportional allocation across ministries changed from 2016-2024?

**Question:** "Welk ministerie krijgt een groter of kleiner deel van de taart?"

**Visualization:** 100% stacked bar chart — 9 bars (one per year), each segmented by ministry. Hover shows exact % and absolute amount.

**Why this works cognitively:** Humans compare aligned segment lengths against a shared baseline. 100% normalization eliminates the "absolute growth masks share decline" problem.

**Interaction:**
- Absolute / proportional (100%) toggle — prevents hiding magnitude
- Module selector (default: instrumenten)
- Top-N ministry filter + "Overig" bucket for remainder
- Hover: ministry name, % share, absolute EUR
- Click segment: drill into that ministry's regelingen

**Data:** `instrumenten_aggregated` grouped by `begrotingsnaam` per year column.

**Tech:** Recharts (BarChart with stacked=true). BFF: `GET /api/v1/inzichten/share-shift?module=instrumenten&top=12`

**Adversarial mitigations:**
- Dual-mode toggle mandatory — proportional view hides absolute growth
- Label: "Bron: Instrumenten — subsidies, bijdragen en leningen"
- "Overig" bucket for ministries below top-N (prevents visual noise)
- 2024 asterisk
- Only instrumenten has `begrotingsnaam` — module-scoped label required

**Verification questions:**
1. Do all modules have ministry attribution? — **No.** Only `instrumenten` has `begrotingsnaam`. Cross-module ministry composition is impossible.
2. Can we show "share of total" without misleading? — Only with explicit scope: share of instrumenten spending, not all government spending.
3. Does the Treemap already cover this? — Partially. Treemap handles hierarchy but lacks the temporal dimension.

**Effort:** 4-5 hours.

---

### Concept 11: Sunburst (Deep Hierarchy Explorer)

**One-line:** See all 4 levels of the spending tree at once — Ministry → Regeling → Instrument → Ontvanger.

**Question:** "Hoe diep gaat de geldboom? Waar zitten de grootste takken?"

**Visualization:** Concentric rings — inner ring = ministries, second = regelingen, third = instrument types, outer = top recipients. Click any segment to zoom and make it the new center.

**Why this works cognitively:** Sunbursts show part-to-whole relationships across multiple levels simultaneously. Unlike treemap (which flattens to one level at a time), sunburst lets you see all 4 levels at once and spot which branches dominate.

**Interaction:**
- Click segment to zoom (re-center on that branch)
- Breadcrumb navigation: "Alle > VWS > Zorgverzekeringswet > Subsidie"
- Year selector
- Hover: name, absolute amount, % of parent, % of total
- Top-N per ring (configurable: 5/10/15)

**Data:** `instrumenten_aggregated` grouped by begrotingsnaam, regeling, instrument, ontvanger.

**Tech:** D3 (d3-hierarchy + d3-partition for sunburst layout). BFF: `GET /api/v1/inzichten/sunburst?year=2024&top=10`

**Adversarial mitigations:**
- Outer rings get very thin with many segments — top-N + "Overig" threshold per ring mandatory
- Arc length is harder to compare than rectangle area — explicit % labels on hover
- Must not imply this covers all spending (instrumenten only)
- COALESCE null regeling/instrument to "Geen regeling" / "Geen instrument"
- 2024 asterisk

**Verification questions:**
1. Can we build 4-level hierarchy from our data? — **Yes.** `instrumenten_aggregated` has begrotingsnaam, regeling, instrument, ontvanger.
2. Is sunburst better than treemap for this? — Different purpose. Treemap is better for single-level comparison. Sunburst is better for seeing all levels simultaneously.
3. Performance with many nodes? — Top-N filtering per ring keeps node count manageable (<500 total).

**Effort:** 6-7 hours.

---

## Domain 2: Trend & Dynamics — "How is spending evolving over time?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Existing coverage:** Pulse (stacked area), Movers (rank trajectory), Ministry DNA (sparklines), Concentration (Gini trend).
**Gap:** No indexed growth comparison. No acceleration/velocity view.

### Concept 12: Growth Comparator (Indexed Line Chart)

**One-line:** Compare growth trajectories regardless of scale — a €1M recipient and a €50B ministry both start at 100.

**Question:** "Hoe verhouden de groeisnelheden van ministeries/ontvangers zich tot elkaar?"

**Visualization:** Multi-line chart, all rebased to index 100 in user-selected base year. Up to 5 entities selectable. Each line a distinct color.

**Why this works cognitively:** Rebasing eliminates scale differences. Pure growth trajectory becomes visible. Humans detect slope and convergence/divergence naturally in overlaid lines.

**Interaction:**
- Entity search/picker (autocomplete, up to 5 entities)
- Base year selector (default: 2016) — changes entire chart perspective
- Module selector
- Absolute / Indexed toggle (indexed default)
- Tooltip always shows absolute EUR regardless of mode
- Click entity in legend to isolate/compare

**Data:** Any `*_aggregated` view. Index = `(year_amount / base_year_amount) * 100`.

**Tech:** Recharts (LineChart). BFF: `GET /api/v1/inzichten/growth-comparator?module=instrumenten&entities=ProRail,NS,Schiphol&base_year=2016`

**Adversarial mitigations:**
- Base year selector MANDATORY — never hardcode. 2016 vs 2020 (pre-COVID vs post-COVID) tells completely different stories
- Tooltip always shows absolute EUR (indexed number alone misleads)
- Warning when base-year amount < €1M: "Kleine basis — percentages kunnen misleidend zijn"
- Entities with €0 in base year excluded (division by zero)
- 2024 asterisk

**Verification questions:**
1. Can we compute indexed growth for any entity? — **Yes.** All `*_aggregated` views have year columns. Index = year_amount / base_year_amount * 100.
2. What happens if an entity has €0 in the base year? — Division by zero. Must exclude or show as "N/A in basisjaar."
3. Does the Movers concept already cover this? — **No.** Movers shows rank, not growth rate. An entity can maintain rank #5 while growing 200%.

**Effort:** 5-6 hours.

---

### Concept 13: Spending Velocity (Acceleration Heatmap)

**One-line:** Spot where spending growth is accelerating or decelerating — the "second derivative" of government spending.

**Question:** "Waar versnelt of vertraagt de uitgavengroei?"

**Visualization:** Heatmap grid — rows = entities (ministries or top recipients), columns = year pairs (16→17, 17→18, ... 23→24). Cell color = YoY % change (green = growth, red = decline, intensity = magnitude).

**Why this works cognitively:** Heatmaps reveal patterns across two dimensions simultaneously. A ministry that was stable for years then suddenly accelerated shows as a row of gray cells followed by an intense green cell — the pattern is instant.

**Interaction:**
- Module selector
- Entity level toggle: ministries / top-N recipients
- Sort by: latest change, total, name
- Color scale: symmetric around 0%, capped at ±100%
- Click cell: detail panel with absolute amounts, context
- Hover: exact % change + absolute values for both years

**Data:** Any `*_aggregated` view. Per entity per year-pair: `(year_n - year_n1) / year_n1 * 100`.

**Tech:** Recharts (custom heatmap using ScatterChart or HTML table with colored cells). BFF: `GET /api/v1/inzichten/spending-velocity?module=instrumenten&level=ministry&top=20`

**Adversarial mitigations:**
- Color scale MUST be symmetric around 0% and capped (±100%) — prevents outliers from washing out the rest
- Near-zero base amounts excluded (% change is meaningless for €0 → €1K)
- Minimum absolute change threshold (e.g., >€100K) to prevent noise
- 2024 asterisk on last column
- Module-scoped label

**Verification questions:**
1. Can we compute YoY % change for year pairs? — **Yes.** Consecutive year columns in aggregated views.
2. How do we handle entities with €0 in the prior year? — Exclude from % change calculation (infinity). Show as "nieuw" or "N/A."
3. Does Anomaly Detector (Concept 8) already do this? — **Partially.** Anomaly Detector shows single year-pair outliers. Velocity Heatmap shows the pattern across ALL year-pairs simultaneously — you can see acceleration/deceleration trajectories.

**Effort:** 5-6 hours.

---

## Domain 3: Budget vs. Actual — "Did we spend what we planned?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Critical data limitation:** Our database contains actual spending only. No begrotingsdata (planned budgets). A true budget-vs-actual variance dashboard is impossible without budget data.

**Creative solution:** Use rolling 3-year average as statistical baseline (proxy for "expected" spending). Honest labeling: "afwijking van historisch patroon" — never "begrotingsafwijking."

### Concept 14: Pattern Deviation (Statistical Variance)

**One-line:** Which spending lines deviated most from their own historical pattern?

**Question:** "Welke uitgaven wijken het meest af van hun eigen historisch patroon?"

**Visualization:**
- **Primary:** Waterfall-style chart showing top deviators. X-axis = entities, bars show deviation from 3-year rolling average (green = above expected, red = below expected). Sorted by absolute deviation.
- **Secondary:** Variance heatmap — rows = ministries/recipients, columns = years, color = deviation from rolling average.

**Why this works cognitively:** Waterfall charts reveal cumulative differences — each bar shows the gap between expected and actual. The heatmap overlay reveals temporal patterns of deviation (consistent over-spending vs one-time spike).

**Interaction:**
- Module selector
- Entity level: ministries / top-N recipients
- View toggle: waterfall (top deviators) / heatmap (all entities over time)
- Year selector (for waterfall: which year to analyze)
- Threshold: minimum absolute deviation to show
- Click entity: detail panel with historical pattern + deviation explanation

**Data:** Any `*_aggregated` view. Rolling 3-year average computed in BFF: `avg(year_n3, year_n2, year_n1)`. Deviation = `actual - expected`.

**Tech:** Recharts (BarChart for waterfall, custom heatmap). BFF: `GET /api/v1/inzichten/pattern-deviation?module=instrumenten&year=2024&level=ministry&top=20`

**Adversarial mitigations:**
- NEVER label this "budget afwijking" — always "patroon afwijking" or "afwijking van historisch gemiddelde"
- Rolling average requires 3 prior years — first usable year is **2019** (avg of 2016-2018)
- New recipients (appeared after 2018) have insufficient history — exclude or flag "onvoldoende historie"
- Provenance: "Verwachting berekend op basis van 3-jarig voortschrijdend gemiddelde"
- 2024 asterisk

**Verification questions:**
1. Does any table contain planned budget amounts? — **No.** Only realized spending.
2. Is begrotingsdata publicly available? — **Yes** (rijksfinancien.nl). But not in our database. Separate D-track project.
3. Could we approximate "planned" with prior-year actuals? — That's just YoY change (Concept 8). The 3-year rolling average is a more stable baseline.
4. First usable year? — **2019.** Need 2016+2017+2018 for first average.

**Effort:** 5-6 hours.

---

## Domain 4: Outlier & Anomaly Detection — "What looks unusual?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Existing coverage:** Concentration Index (distribution inequality via Gini/Lorenz), Anomaly Detector (temporal YoY changes).
**Gap:** No view of the distribution *shape* itself — how many recipients get what amounts.

### Concept 15: Spending Spectrum (Distribution Explorer)

**One-line:** See the shape of government spending — how many recipients sit in each amount bracket?

**Question:** "Hoe is het geld verdeeld? Hoeveel ontvangers zitten in welke schaal?"

**Visualization:**
- **Primary:** Log-scale histogram — x-axis = amount brackets (€1K, €10K, €100K, €1M, €10M, €100M, €1B+), y-axis = number of recipients. Each bar clickable for recipient list.
- **Secondary:** Box plot per year (small multiples, 9 plots) — median, quartiles, and extreme values shifting over time.
- **Highlight mode:** Search for an entity, see where it sits in the distribution (highlighted vertical line on histogram).

**Why this works cognitively:** Histograms reveal distribution shape — skewness, clusters, gaps. Box plots compress this into comparable summaries across years. Together they answer "what's normal and what's exceptional."

**Interaction:**
- Module selector
- Year selector
- Log / linear scale toggle (default: log — linear is useless for power-law distributions)
- Entity search highlight (pink line showing where a specific entity sits)
- Box plot year comparison (show all 9 years side by side)
- Click histogram bar: expand to show recipients in that bracket

**Data:** Any `*_aggregated` view. Bracket computation in BFF: sort amounts, bucket into log-scale ranges.

**Tech:** Recharts (BarChart for histogram, BoxPlot via custom component). BFF: `GET /api/v1/inzichten/spending-spectrum?module=instrumenten&year=2024&highlight=ProRail`

**Adversarial mitigations:**
- Log scale DEFAULT — government spending follows extreme power law. Linear scale shows one giant bar at €0-€1M and invisible bars for everything else.
- Bracket labels must be human-readable (€1K–€10K, not scientific notation)
- Use "uitzonderlijke bedragen" not "outliers" or "uitschieters" (loaded in government context)
- Negative amounts get their own section (not mixed into positive distribution)
- Provenance: per-module scope label
- 2024 asterisk

**Verification questions:**
1. Can we compute percentiles from aggregated views? — **Yes.** ORDER BY amount column, compute p25/p50/p75/p95/p99.
2. How skewed is the distribution? — **Extremely.** In instrumenten, ~80% of recipients receive <€1M, top 0.1% receive >€1B. Classic power law.
3. Does Concentration Index (Concept 7) already cover this? — **No.** Gini/Lorenz shows *inequality level*. Spectrum shows the *shape* — where the clusters are, where the gaps are.

**Effort:** 5-6 hours.

---

## Domain 5: Structural Flow — "How does money move through the system?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Existing coverage:** Money Flow Sankey (forward flow: Ministry → Regeling → Ontvanger), Dependency Radar (cross-module presence).
**Gap:** No recipient-centric reverse view — "how does money reach THIS organization?"

### Concept 16: Reverse Flow (Recipient-Centric Sankey)

**One-line:** Pick any recipient and trace backwards — which ministries, regulations, and modules feed into this one organization?

**Question:** "Via welke kanalen ontvangt deze organisatie overheidsgeld?"

**Visualization:** Inverted Sankey — the recipient is on the right. Left side shows all modules, ministries, and regulations that feed into this one entity. Width = normalized EUR amount per channel.

**Why this works cognitively:** Reversing the flow direction shifts the analytical frame from "where does the money go?" to "where does THIS money come from?" — a fundamentally different question that reveals dependency patterns.

**Interaction:**
- Recipient search bar (autocomplete from universal_search)
- All modules shown simultaneously (amounts from universal_search, already normalized to EUR)
- Click any flow strand: year-over-year trend for that specific channel
- Compare mode: pick 2 recipients side-by-side
- Year selector (or total across all years)

**Data:** `universal_search` for per-module totals per recipient. `instrumenten_aggregated` for ministry/regeling detail when instrumenten module is present.

**Tech:** Recharts Sankey (inverted layout). BFF: `GET /api/v1/inzichten/reverse-flow?recipient=ProRail&year=2024`

**Adversarial mitigations:**
- Only show modules where the recipient actually appears — no empty channels
- Entity resolution warning: "Op basis van naamherkenning — sommige organisaties kunnen onder meerdere namen voorkomen"
- Amount footnote per module explaining unit context (instrumenten x1000 normalization already done in view, inkoop = gemiddelde contractwaarde)
- Compare mode limited to 2 recipients (more becomes unreadable)
- 2024 asterisk

**Verification questions:**
1. Can we build a cross-module flow? — **Not as sums.** Amount units differ (x1000 vs actual). But `universal_search` has pre-normalized amounts.
2. Can we build a recipient-centric reverse view? — **Yes.** `universal_search` has per-source amounts already normalized to EUR.
3. Does Dependency Radar (Concept 6) already show this? — It shows *which* modules, not *how much* per module per channel. Reverse Sankey adds the magnitude and regeling dimension.

**Effort:** 5-6 hours.

---

## Domain 6: Efficiency & Performance — "What outcomes per euro?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Critical data limitation:** No outcome/output metrics in the database. No CBS performance indicators linked to spending. True cost-effectiveness analysis impossible without outcome data.

**Creative proxies:** Three spending-structure proxies that reveal meaningful structural characteristics without outcome data.

### Concept 17: Ministry Cost Structure (Cross-Module Allocation)

**One-line:** How does each ministry divide its spending across subsidies, procurement, and civil service costs?

**Question:** "Hoe verdeelt elk ministerie het geld over subsidies, inkoop en apparaat?"

**Visualization:** Stacked horizontal bar chart — one bar per ministry, segments = spending per module (instrumenten, inkoop, apparaat where available). Sorted by total. Absolute + proportional toggle.

**Why this works cognitively:** Stacked bars against a shared baseline reveal both total magnitude (bar length) and internal composition (segment proportions). A ministry that's 80% apparaat and 20% subsidies has a fundamentally different structure than one that's 20/80.

**Interaction:**
- Sorted by: total, apparaat%, instrumenten%, inkoop%
- Absolute / proportional toggle
- Year selector
- Click ministry: drill into per-module breakdown with trend
- Hover segment: module name, amount, % of ministry total

**Data:** Cross-module aggregation by ministry/begrotingsnaam. `instrumenten_aggregated` (begrotingsnaam), `apparaat_aggregated` (begrotingsnaam where available), `inkoop_aggregated` (ministerie where available).

**Tech:** Recharts (BarChart horizontal stacked). BFF: `GET /api/v1/inzichten/ministry-structure?year=2024`

**Adversarial mitigations:**
- Not all modules have ministry attribution — show only what's linkable
- Label: "Gebaseerd op modules met begrotingsnaam — niet alle uitgaven zijn opgenomen"
- Missing modules noted per ministry
- Some ministries appear in instrumenten but not inkoop — gaps are real, not errors
- 2024 asterisk

**Verification questions:**
1. Which modules have ministry/begrotingsnaam? — `instrumenten` (begrotingsnaam), `apparaat` (begrotingsnaam). `inkoop` has partial ministry data.
2. Can we sum across modules? — **With caution.** Units are normalized in views, but coverage differs per module. Must note gaps.
3. Is this "efficiency"? — **No.** It's spending structure. Never label as efficiency without outcome data.

**Effort:** 5-6 hours.

---

### Concept 18: Spending per Capita (Gemeente)

**One-line:** How much does the government spend per inhabitant, per municipality?

**Question:** "Hoeveel geeft de overheid per inwoner uit, per gemeente?"

**Visualization:** Sorted bar chart — one bar per gemeente, height = spending / population. Color = above/below national average. Table toggle for precision.

**Why this works cognitively:** Per-capita normalization is the most intuitive "fairness" metric. It immediately answers "does this municipality get more or less than average?" without requiring expertise.

**Interaction:**
- Sort by: per-capita amount, total amount, population, name
- Above/below average coloring (navy = above, pink = below)
- Year selector
- National average reference line
- Click gemeente: detail panel with trend, breakdown by omschrijving
- Table toggle for full data

**Data:** `gemeente_aggregated` for spending amounts. CBS population data (static lookup table, ~350 rows, updated annually — separate data ingestion required).

**Tech:** Recharts (BarChart). BFF: `GET /api/v1/inzichten/per-capita?year=2024`

**Adversarial mitigations:**
- Gemeente module only — does NOT represent all government spending per municipality
- Label: "Bron: Gemeente-module — niet alle rijksuitgaven naar gemeenten"
- CBS population data year must match spending year
- Some gemeenten merged over the 2016-2024 period — handle name changes
- 2024 asterisk
- Requires CBS population data ingestion (D-track dependency)

**Verification questions:**
1. Do we have population data? — **Not yet.** CBS data readily available but needs ingestion. ~350 rows, static.
2. Does gemeente_aggregated cover all spending to municipalities? — **No.** Only the gemeente module. Instrumenten/inkoop may also flow to municipal entities.
3. Can we build this without CBS data? — **No.** Per-capita requires population. This concept depends on a small D-track task.

**Effort:** 4-5 hours (excluding CBS data ingestion).

---

### Concept 19: Regeling Profile (Regeling-Centric Distribution)

**One-line:** Pick any regulation and see its character — how many recipients, how concentrated, what's the typical amount?

**Question:** "Hoe verdeelt deze regeling het geld? Breed gespreid of geconcentreerd bij een handvol ontvangers?"

**Visualization:**
- **Search:** Regeling autocomplete (from instrumenten_aggregated distinct regelingen)
- **Profile card:** Total amount, recipient count, average per recipient, Gini coefficient, top-5 share
- **Distribution:** Mini histogram of amounts within this regeling (brackets: <€100K, €100K-€1M, €1M-€10M, €10M+)
- **Comparison:** Side-by-side two regelingen — "Zorgverzekeringswet: 3 recipients, €20B avg" vs "Subsidie Kinderopvang: 4,000 recipients, €50K avg"
- **Recipient table:** All recipients under this regeling, amounts, trend sparklines

**Why this works cognitively:** It reveals the *character* of each regulation as a distribution mechanism. A regeling with 2 recipients and €40B is structurally different from one with 10,000 recipients and €500M — even under the same ministry. This answers the user's insight: "Ontvanger A zit in Regeling B, die blijkt VEEL meer ontvangers te hebben."

**Interaction:**
- Regeling search (autocomplete)
- Year selector
- Compare mode: pick 2 regelingen side-by-side
- Sort recipient table by: amount, name, growth
- Click recipient: cross-reference to other regelingen this recipient appears in

**Data:** `instrumenten_aggregated` filtered by regeling. Gini/distribution computed in BFF.

**Tech:** Recharts (BarChart for histogram, LineChart for sparklines). BFF: `GET /api/v1/inzichten/regeling-profile?regeling=Zorgverzekeringswet&year=2024`

**Adversarial mitigations:**
- Only instrumenten module has regeling attribution
- "Geen regeling" entries (COALESCE from null) — exclude from search or flag clearly
- Regeling names can be very long — truncation + full name in tooltip
- Compare mode max 2 regelingen (more becomes unreadable)
- Gini computed only when recipient count > 10 (meaningless for small groups)
- 2024 asterisk

**Verification questions:**
1. How many distinct regelingen exist? — Varies by year. Typically 200-400 distinct values in instrumenten.
2. Can we compute per-regeling Gini? — **Yes.** Same formula as Concept 7, but filtered to one regeling's recipients.
3. Do recipients appear across multiple regelingen? — **Yes, frequently.** ProRail might appear under 5+ regelingen. The cross-reference is valuable.

**Effort:** 6-7 hours.

---

## Domain 7: Ranking & Comparison — "Who spends more or less?"

**Expert Team:** Elena (Viz Architect), Koen (Gov Finance Analyst), Ravi (Creative Strategist), Dara (Adversarial Strategist)

**Existing coverage:** New Money (sorted bars for new entrants), Movers (rank trajectory over time).
**Gap:** No simple "leaderboard" view. No head-to-head entity comparison.

### Concept 20: Leaderboard (Ranked Lollipop Chart)

**One-line:** The missing simple view — who are the biggest recipients, clean and sortable.

**Question:** "Wie ontvangt het meeste? Hoe verhouden ze zich tot elkaar?"

**Visualization:** Horizontal lollipop chart — entities sorted by amount, dot + line from zero baseline. Highlighted entity (search to select) shown in pink against navy-gray others. Top-N selector.

**Why this works cognitively:** Aligned length from shared baseline is the most accurate visual encoding for comparison (Cleveland & McGill, 1984). Lollipop is cleaner than bar chart for many items — less ink, same precision.

**Interaction:**
- Module selector (all 6 + integraal)
- Year selector (single year or total across all years)
- Top-N slider (10 / 25 / 50 / 100)
- Entity highlight search (pink highlight within the ranking)
- Filter by ministry (instrumenten), categorie (inkoop), etc.
- Click entity: detail panel with cross-module context + 9-year sparkline

**Data:** Any `*_aggregated` view, sorted by year column or totaal.

**Tech:** Recharts (BarChart horizontal with custom dot renderer for lollipop). BFF: `GET /api/v1/inzichten/leaderboard?module=instrumenten&year=2024&top=25&highlight=ProRail`

**Adversarial mitigations:**
- Always show "Top N van X.XXX ontvangers" for scale context
- Module-scoped label
- Year-specific vs cumulative must be explicit in title
- Negative amounts in separate section (or excluded with note)
- 2024 asterisk

**Verification questions:**
1. Don't existing module pages already show rankings? — **Yes, via sort.** But module pages are tables, not visual comparisons. The lollipop adds visual impact and the highlight feature.
2. Is lollipop better than bar chart? — For 25+ items, yes. Less ink-to-data ratio, same accuracy. For <10 items, bar chart is fine.
3. Does this add value beyond sorting the data table? — **Yes.** Visual comparison reveals magnitude gaps instantly (ProRail at 4x the next recipient). Tables hide this.

**Effort:** 4-5 hours.

---

### Concept 21: Head-to-Head (Entity Comparison Radar)

**One-line:** Pick 2-3 organizations and compare them across every dimension — spending, growth, breadth, stability.

**Question:** "Hoe verhouden deze organisaties zich tot elkaar op alle dimensies?"

**Visualization:** Radar/spider chart — 6 axes representing different metrics. 2-3 entities overlaid as colored polygons. Table below for precision.

**Six radar axes (all normalized 0-100 percentile within peer group):**
1. **Totale uitgaven** — Absolute spending level
2. **Groei** — % change over last 3 years
3. **Module-spreiding** — Number of modules present in (1-6)
4. **Concentratie** — % of their primary regeling's total they represent
5. **Jaren actief** — How many of 9 years with non-zero amounts (stability)
6. **Gemiddeld per module** — Average amount across active modules

**Why this works cognitively:** Radar charts reveal the *shape* of an entity's profile. Two entities with similar totals but different shapes (one broad and stable, one concentrated and volatile) are immediately distinguishable by polygon shape.

**Interaction:**
- Entity search/picker (autocomplete, 2-3 entities)
- Radar chart with tooltips showing absolute values per axis
- Comparison table below with all raw values side-by-side
- Sparkline row per entity (9-year trend)
- Click axis label: explanation of what the metric means

**Data:** `universal_search` for cross-module presence and totals. Individual `*_aggregated` views for growth and detail metrics.

**Tech:** Recharts (RadarChart). BFF: `GET /api/v1/inzichten/head-to-head?entities=ProRail,NS,Schiphol`

**Adversarial mitigations:**
- All axes MUST be normalized (0-100 percentile) — radar charts mislead when axis scales differ
- Max 3 entities (more = unreadable overlapping polygons)
- Table below radar is MANDATORY — radar for shape discovery, table for precision
- Axis ordering fixed (consistent, not optimized for visual drama)
- Percentile context: "Score 85 = hoger dan 85% van alle ontvangers"
- Entity resolution warning for cross-module metrics

**Verification questions:**
1. Can we compute all 6 metrics from existing data? — **Yes.** universal_search has source_count, totals. Aggregated views have year columns for growth.
2. Are radar charts misleading? — **Can be**, when scales differ. Percentile normalization + mandatory table mitigates this.
3. Max entities? — **3.** More creates visual noise. For larger comparisons, use Leaderboard (Concept 20).

**Effort:** 5-6 hours.

---

## Global Adversarial Findings (Apply to ALL Concepts)

These findings from the original design document (concepts 1-9) apply equally to concepts 10-21:

1. **Geographic visualization killed** — Only publiek has PostGIS data (~7%). No choropleth.
2. **2024 data may be incomplete** — Every concept: asterisk + footnote.
3. **Entity resolution imperfections** — "Eerste verschijning" ≠ "new organization." Cross-module matching is name-based.
4. **x1000 unit mismatch** — instrumenten/apparaat amounts are x1000. ALL normalization in BFF.
5. **Provenance required** — Every visualization: footer with source modules, last updated, scope.
6. **Module scope labels** — Most concepts only work with one module. Never imply total government coverage.
7. **Formal Dutch** — All user-facing labels use u/uw. Neutral framing (no "corruption" / "waste" language).

---

## Concept Summary Table

| # | Name | Domain | Viz Type | Data Source | New? | Est. Hours |
|---|------|--------|----------|-------------|------|------------|
| 1 | Spending Pulse | Composition, Trend | KPIs + Stacked Area | universal_search + aggregated | Built | — |
| 2 | New Money | Ranking | Horizontal Bar | all aggregated | Built | — |
| 3 | The Movers | Trend, Ranking | Multi-line (rank) | any aggregated | Built | — |
| 4 | Ministry DNA | Trend | Sparkline Grid | instrumenten (source+agg) | Built | — |
| 5 | Spending Landscape | Composition | Treemap (D3) | instrumenten_aggregated | Built | — |
| 6 | Dependency Radar | Flow | Radial (D3) | universal_search | Built | — |
| 7 | Concentration Index | Outlier, Trend | Lorenz + Gini Line | any aggregated | Built | — |
| 8 | Anomaly Detector | Outlier | Scatter/Bubble | universal_search | Built | — |
| 9 | Money Flow | Flow | Sankey | instrumenten_aggregated | Built | — |
| **10** | **Share Shift** | Composition | 100% Stacked Bar | instrumenten_aggregated | **New** | 4-5h |
| **11** | **Sunburst** | Composition | Sunburst (D3) | instrumenten_aggregated | **New** | 6-7h |
| **12** | **Growth Comparator** | Trend | Indexed Line | any aggregated | **New** | 5-6h |
| **13** | **Spending Velocity** | Trend | Heatmap | any aggregated | **New** | 5-6h |
| **14** | **Pattern Deviation** | Variance (proxy) | Waterfall + Heatmap | any aggregated | **New** | 5-6h |
| **15** | **Spending Spectrum** | Outlier | Log Histogram + Box | any aggregated | **New** | 5-6h |
| **16** | **Reverse Flow** | Flow | Reverse Sankey | universal_search | **New** | 5-6h |
| **17** | **Ministry Cost Structure** | Efficiency (proxy) | Stacked Horizontal Bar | cross-module by ministry | **New** | 5-6h |
| **18** | **Spending per Capita** | Efficiency (proxy) | Bar + Reference Line | gemeente_agg + CBS pop | **New** | 4-5h |
| **19** | **Regeling Profile** | Efficiency | Profile Card + Histogram | instrumenten_aggregated | **New** | 6-7h |
| **20** | **Leaderboard** | Ranking | Lollipop | any aggregated | **New** | 4-5h |
| **21** | **Head-to-Head** | Ranking | Radar/Spider + Table | universal_search + agg | **New** | 5-6h |

**New concepts estimated effort: 60-71 hours**
**Total (all 21 concepts): 110-129 hours**

---

## Tech Stack

| Library | Concepts |
|---------|----------|
| **Recharts** | 1-4, 7-10, 12-15, 17-21 (standard charts, Sankey, radar) |
| **D3** | 5-6, 11 (treemap, radial, sunburst) |
| **React** | All components |
| **IBM Plex Sans Condensed** | Data typography |
| **Brand colors** | navy-dark (#1a2332), pink (#e91e63), navy-medium (#5a6577) |

---

## Data Dependencies

| Dependency | Concepts Affected | Status |
|-----------|-------------------|--------|
| CBS population data (gemeente) | Concept 18 (Spending per Capita) | Not yet ingested — D-track task |
| Cross-module ministry linking | Concept 17 (Ministry Cost Structure) | Partially available (instrumenten + apparaat have begrotingsnaam) |
| Begrotingsdata (planned budgets) | Future true Budget vs Actual | Not available — D-track backlog |
| CBS outcome metrics | Future true Efficiency | Not available — D-track backlog |

---

## Build Priority (Recommended Order)

**Phase 1 — High impact, data-ready:**
1. Concept 20: Leaderboard (simplest, fills obvious gap)
2. Concept 12: Growth Comparator (high insight, Recharts-native)
3. Concept 10: Share Shift (temporal composition, Recharts-native)
4. Concept 15: Spending Spectrum (distribution shape, novel)

**Phase 2 — Rich analytical tools:**
5. Concept 19: Regeling Profile (regeling-centric, unique angle)
6. Concept 13: Spending Velocity (heatmap, acceleration view)
7. Concept 14: Pattern Deviation (statistical variance proxy)
8. Concept 21: Head-to-Head (radar comparison)

**Phase 3 — Advanced / D3 / data dependencies:**
9. Concept 16: Reverse Flow (inverted Sankey)
10. Concept 17: Ministry Cost Structure (cross-module linking)
11. Concept 11: Sunburst (D3 hierarchy)
12. Concept 18: Spending per Capita (requires CBS data)
