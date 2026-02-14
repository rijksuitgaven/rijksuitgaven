# De Geldstroom — Dynamic Sankey Hero Design

**Date:** 2026-02-14
**Status:** Approved for implementation
**Author:** Design Sprint Team (Senior UI/UX Lead + 5 specialists)
**Prototype:** `/h1` (current static version)
**Target:** Replace `/h1` with dynamic build-time version, integrate into homepage hero

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Team & Process](#team--process)
3. [Concept](#concept)
4. [6 Stories with Real Data](#6-stories-with-real-data)
5. [Design Decisions](#design-decisions)
6. [Information Architecture](#information-architecture)
7. [Motion & Interaction Design](#motion--interaction-design)
8. [Build-Time Architecture](#build-time-architecture)
9. [Adversarial Review & Mitigations](#adversarial-review--mitigations)
10. [Mobile Strategy](#mobile-strategy)
11. [Implementation Plan](#implementation-plan)
12. [Appendix: Raw Query Results](#appendix-raw-query-results)

---

## Executive Summary

The `/h1` prototype ("De Geldstroom") shows an animated Sankey-style flow diagram with budget categories flowing to recipient types. Currently all data is hardcoded/fabricated.

**Decision:** Replace with real government spending data, generated at build time (no public API), with 6 selectable stories and a year slider (2016-2024). Each story represents a different data module, showing different facets of government spending.

**Key findings from data validation:**
- COA (asylum) spending increased 6.6× from €0.56 mld (2018) to €3.72 mld (2024)
- Sociale Verzekeringsbank receives €36.4 mld from one ministry (largest single flow)
- Gemeente Amsterdam appears in 5 of 6 data sources (€11.3 mld total)
- Politie appears in 4 modules totaling €34.3 mld
- All 6 stories validated with compelling, verifiable data

---

## Team & Process

| Role | Focus |
|------|-------|
| **Lead** — Senior UI/UX Engineer | Architecture, interaction design, build feasibility |
| **Creative Strategist** (Sophie) | Narrative, emotional impact, conversion |
| **Data Specialist** (Daan) | Query feasibility, data integrity, edge cases |
| **Information Architect** (Eva) | Hierarchy, cognitive load, what to show/hide |
| **Motion Designer** (Thomas) | Animation quality, performance, accessibility |
| **Adversarial Strategist** (Marcus) | Risk identification, failure modes, data accuracy |

**Process:** 11 rounds of structured team interaction with verification questions at each step. Every design decision validated against real production data (queried live from Supabase).

---

## Concept

### Before (Static Prototype)
- 5 fake budget categories (Sociale Zekerheid, Zorg, Onderwijs, Defensie, Infrastructuur)
- 5 fake recipient types (Gemeenten, Provincies, Bedrijven, ZBO's, Burgers)
- 18 flow links with fabricated weights
- Static "€1.700 miljard" headline
- Animated particles (decorative only)

### After (Dynamic Build-Time)
- **6 selectable stories** — each showing a different data module
- **Real amounts** from production database, generated at `next build`
- **Year selector** (2016-2024) — amounts, flows, and headline update per year
- **Particle density proportional to flow amount** — motion carries meaning
- **Node click → module page CTA** — conversion at peak curiosity
- **No public API** — data baked into static JSON at build time

### Core Narrative Framework
1. **Claim** (headline): "Waar ging €X mld naartoe in [year]?"
2. **Evidence** (Sankey): Real budget chapters/orgs flowing to real recipients
3. **Invitation** (CTA on node click): "Bekijk alle ontvangers →" linking to module

---

## 6 Stories with Real Data

### Story Order (Tab Sequence)

| # | Story | Tab Label | Default? | Year Range |
|---|-------|-----------|----------|------------|
| 1 | Integraal | "Alle bronnen" | **Yes** (default) | 2016-2024 |
| 2 | Publiek | "Publieke organisaties" | No | 2018-2024 |
| 3 | Instrumenten | "Rijksbegroting" | No | 2016-2024 |
| 4 | Inkoop | "Inkoopdata" | No | 2017-2024 |
| 5 | Gemeente | "Gemeenten" | No | 2016-2024 |
| 6 | Provincie | "Provincies" | No | 2016-2024 |

---

### Story 1: Integraal — "Alle bronnen" (Default)

**Narrative:** "One recipient, many funding streams" — shows why this platform exists.

**Left nodes (6):** Our 6 data modules with per-year totals
- Financiële instrumenten
- Inkoopuitgaven
- Provinciale subsidies
- Gemeentelijke subsidies
- Publiek (RVO/COA/NWO/ZonMW)
- Apparaatsuitgaven

**Right nodes (5+1):** Top cross-module recipients + Overige

**Real data (top recipients appearing in 3+ modules):**

| Recipient | Modules | Total |
|-----------|---------|-------|
| Politie | 4 (Instrumenten, Inkoop, Provincie, Publiek) | €34.3 mld |
| ProRail B.V. | 3 (Instrumenten, Inkoop, Provincie) | €12.7 mld |
| Gemeente Rotterdam | 3 (Instrumenten, Provincie, Publiek) | €12.0 mld |
| Gemeente Amsterdam | 5 (Instrumenten, Gemeente, Inkoop, Provincie, Publiek) | €11.3 mld |
| Universiteit Utrecht | 5 (all except Apparaat) | €5.7 mld |
| Universiteit van Amsterdam | 5 (all except Apparaat) | €5.3 mld |
| Gemeente Utrecht | 3 (Instrumenten, Provincie, Publiek) | €5.1 mld |
| Rijksuniversiteit Groningen | 5 (all except Apparaat) | €4.8 mld |

**Build-time query approach:**
1. Take top 10 recipients from universal_search (by totaal, source_count >= 3)
2. For each, query each source table: `SUM(bedrag) WHERE UPPER(ontvanger) = UPPER(recipient)` per year
3. This gives per-module, per-year amounts for each recipient

**Why this is the default:** Answers "why would I use this platform?" — no single government database shows you the full picture.

---

### Story 2: Publiek — "Publieke organisaties"

**Narrative:** "Who gets public funding?" — COA spending trend is the most dramatic data story.

**Left nodes (4):** Source organizations (no "Overige" needed — exactly 4)

| Organization | Total (all years) | Recipients |
|-------------|-------------------|-----------|
| COA | €10.6 mld | 11,101 |
| RVO | €4.1 mld | 49,545 |
| ZonMW | €2.5 mld | 3,001 |
| NWO | €0.65 mld | 285 |

**COA yearly spending trend (the dramatic story):**

| Year | COA Spending | Recipients | vs. Previous |
|------|-------------|-----------|-------------|
| 2018 | €0.56 mld | 2,183 | — |
| 2019 | €0.54 mld | 2,139 | -4% |
| 2020 | €0.66 mld | 1,752 | +22% |
| 2021 | €0.83 mld | 1,974 | +26% |
| 2022 | €1.41 mld | 2,788 | +70% |
| 2023 | €2.94 mld | 3,975 | +109% |
| **2024** | **€3.72 mld** | **5,173** | **+27%** |

**6.6× increase from 2018 to 2024.** When someone scrubs the year slider, COA flows visibly explode.

**Top COA recipients (2024):**

| Recipient | Amount (2024) | Type |
|-----------|--------------|------|
| RMA Healthcare | €341 mln | Healthcare |
| Trigion Beveiliging B.V. | €304 mln | Security |
| Le Cocq Holding Didam B.V. | €258 mln | Accommodation |
| Valk Exclusief Holding B.V. | €158 mln | Hotels |
| Start People B.V. | €104 mln | Staffing |

**Top RVO recipients (2024):** [To be queried in build script]
**Top ZonMW recipients (2024):** [To be queried in build script]
**Top NWO recipients (2024):** SURF - Coöperatie SURF U.A. (€42 mln)

**Right nodes:** Top 5 recipients across all 4 orgs for selected year + "Overige ontvangers"

**Year range:** 2018-2024 (COA data starts 2018)

**Design note (Marcus):** This data is politically sensitive. Same visual treatment as all other stories — no editorial framing, no alarm colors. Same navy/blue/pink palette, same particle speed. The data speaks for itself.

---

### Story 3: Instrumenten — "Rijksbegroting"

**Narrative:** "Where does the government budget go?" — largest dataset, recognizable names.

**Left nodes (6+1):** Top begrotingsnamen + "Overige begrotingen"

| Budget Chapter (2024) | Amount | Recipients |
|-----------------------|--------|-----------|
| Sociale Zaken en Werkgelegenheid | €62.6 mld | 3,336 |
| Onderwijs, Cultuur en Wetenschap | €56.2 mld | 21,327 |
| Gemeentefonds | €43.8 mld | 343 |
| Volksgezondheid, Welzijn en Sport | €37.4 mld | 8,277 |
| Financiën | €14.4 mld | 382 |
| Justitie en Veiligheid | €8.7 mld | 1,042 |
| *Overige begrotingen (10+)* | *~€75 mld* | — |

**Top 6 covers ~78% of total (€270 mld / €345 mld).** "Overige" at 22% is acceptable.

**Top flows (2024):**

| Flow | Amount |
|------|--------|
| Sociale Zaken → **Sociale Verzekeringsbank** | €36.4 mld |
| Sociale Zaken → **Belastingdienst/Toeslagen** | €10.6 mld |
| Sociale Zaken → **UWV** | €7.1 mld |
| Gemeentefonds → **Amsterdam** | €3.0 mld |
| Gemeentefonds → **Rotterdam** | €2.3 mld |
| Gemeentefonds → **Den Haag** | €1.8 mld |
| Onderwijs → **Universiteit Utrecht** | €867 mln |
| Onderwijs → **Universiteit van Amsterdam** | €819 mln |

**Right nodes:** Top 5 recipients across all begrotingsnamen for selected year + "Overige ontvangers"

**Year range:** 2016-2024

**Key insight:** The SVB flow (€36.4 mld) is the single largest money flow in the entire dataset. Jaw-dropping when rendered as a thick flow line.

---

### Story 4: Inkoop — "Inkoopdata"

**Narrative:** "Which ministry buys from whom?" — procurement data, concrete company names.

**Left nodes:** Top 5 ministries by procurement volume + "Overige ministeries"

| Ministry | Total (all years) | Suppliers |
|----------|-------------------|----------|
| I&W (Infrastructuur & Waterstaat)* | €30.0 mld | ~40,000 |
| BZK (Binnenlandse Zaken) | €21.9 mld | 29,989 |
| J&V (Justitie & Veiligheid)* | €12.4 mld | ~84,000 |
| DEF (Defensie) | €7.9 mld | 31,429 |
| VWS (Volksgezondheid) | €7.0 mld | 12,902 |

*\* Requires name normalization: "I&W" and "I & W" are the same ministry, "J&V" and "J & V" too. Build script must map variants to canonical names.*

**Data note:** Inkoop uses `totaal_avg` column (average staffelbedragen, estimated midpoints). Column name in source table is `totaal_avg`, not `bedrag`. Amounts are in absolute euros.

**Right nodes:** Top 5 suppliers across all ministries for selected year + "Overige leveranciers"

**Year range:** 2017-2024 (inkoop data starts 2017)

**Ministry name normalization map (for build script):**
```
"I & W"  → "I&W"
"I & M"  → "I&M"  (older name for same ministry)
"J & V"  → "J&V"
"EZ"     → "EZK"  (if applicable)
```

---

### Story 5: Gemeente — "Gemeenten"

**Narrative:** "Where does your city spend?" — local, relatable amounts.

**Left nodes:** Top 6 gemeentes + "Overige gemeenten"

| Gemeente | Total (all years) | Recipients |
|----------|-------------------|-----------|
| Amsterdam | €5.9 mld | 6,037 |
| Den Haag | €2.5 mld | 4,357 |
| Groningen | €847 mln | 2,076 |
| Almere | €845 mln | 531 |
| Tilburg | €830 mln | 2,666 |
| Breda | €776 mln | 1,353 |

**Amsterdam dominates.** The flow from Amsterdam will be the thickest by far — 2.4× Den Haag.

**Right nodes:** Top 5 recipients across these gemeentes for selected year + "Overige ontvangers"

**Year range:** 2016-2024 (check data_availability per gemeente)

---

### Story 6: Provincie — "Provincies"

**Narrative:** "Where do provinces invest?" — geographic story, complete set.

**Left nodes:** Top 6 provinces + "6 overige provincies"

| Provincie | Total (all years) | Recipients |
|-----------|-------------------|-----------|
| Noord-Brabant | €4.4 mld | 1,972 |
| Gelderland | €2.3 mld | 3,268 |
| Zuid-Holland | €1.5 mld | 1,651 |
| Limburg | €1.3 mld | 3,531 |
| Noord-Holland | €1.1 mld | 2,461 |
| Overijssel | €1.1 mld | 5,512 |

**Note:** 12 provinces total is a known, finite set. "6 overige provincies" communicates completeness. (Missing from top 6: Utrecht €863 mln, Drenthe €663 mln, Friesland €640 mln, Zeeland €562 mln, + Flevoland + Groningen.)

**Right nodes:** Top 5 recipients across these provinces for selected year + "Overige ontvangers"

**Year range:** 2016-2024 (check data_availability per provincie)

---

## Design Decisions

### Consolidated Decision Table

| Decision | Choice | Rationale | Validated by |
|----------|--------|-----------|-------------|
| **Data source** | Build-time static JSON | No public API, no scraping risk, fastest page load | Marcus, Daan |
| **Stories** | 6 selectable via tabs | Shows platform breadth, each click = product demo | Sophie, Eva |
| **Default story** | Integraal ("Alle bronnen") | Product pitch — shows why platform exists | Team consensus |
| **Story tabs position** | Below Sankey, subtle text row | Progressive disclosure — hero works without tabs | Eva, Sophie |
| **Year selector** | Horizontal pills, not slider | Discrete data points, not continuous range | Thomas |
| **Headline** | Dynamic: "Waar ging €X mld naartoe in [year]?" | Specific, verifiable, credible per-year claim | Sophie |
| **Left node count** | Top 5-7 + "Overige" per story | Prevent "Overige" dominating (keep <30%) | Eva, Marcus |
| **Right node count** | Top 5 recipients + "Overige ontvangers" | Trust the data — obscure names = our value prop | Sophie, Marcus |
| **Node order** | Fixed by most recent year ranking | Prevents visual chaos when changing years | Eva, Thomas |
| **"Overige" label** | "X overige [type]" with count | Communicates it's many small ones, not one big one | Eva |
| **Publiek left nodes** | All 4 orgs (no Overige needed) | Exactly 4 source organizations — cleanest Sankey | Daan |
| **Flow visualization** | Line thickness proportional to amount | Visual encoding of scale | Thomas |
| **Particle density** | Proportional to flow amount | Motion carries meaning, not decoration | Thomas |
| **Year transition** | Morph amounts + thicknesses (600ms) | Smooth, shows change over time | Thomas |
| **Node click** | Story-specific CTA → module page | Conversion at peak curiosity | Sophie |
| **Tooltip on flow hover** | "Source → Target: €X mld" | Detail on demand, not cluttering the view | Eva |
| **Amount scale** | Per-story normalization | Instrumenten (€60 mld) vs Publiek (€3 mld) need different scales | Thomas, Marcus |
| **Mobile** | Simplified version (no Sankey) | Sankey doesn't work at 375px width | Marcus, Thomas |
| **Accessibility** | `prefers-reduced-motion` disables particles | WCAG compliance, info preserved via thickness + labels | Thomas |
| **Accuracy safeguard** | Checksum: flows sum = node totals | Homepage credibility is non-negotiable | Marcus |
| **Build fallback** | Previous JSON committed to repo | Build doesn't fail if DB unreachable | Marcus |
| **Inkoop normalization** | Map ministry name variants to canonical | "I&W"/"I & W"/"I & M" → single node | Marcus, Daan |
| **Year range per story** | Dynamic from data_availability | Instrumenten 2016-2024, Publiek 2018-2024, Inkoop 2017-2024 | Daan |
| **Political sensitivity** | Same visual treatment for all stories | No editorial framing — data speaks for itself | Marcus |

---

## Information Architecture

### Visual Hierarchy (top to bottom)

1. **Headline** (read): "Waar ging €289 mld naartoe in 2024?"
2. **Year pills** (interact): `2016 · 2017 · ... · 2024` — active year in pink
3. **Sankey diagram** (see): Left nodes → flow lines with particles → right nodes
4. **Story tabs** (explore): "Alle bronnen · Publieke organisaties · Rijksbegroting · ..."
5. **Attribution** (trust): "Bron: rijksfinancien.nl"

### What We Show

| Element | Content | Purpose |
|---------|---------|---------|
| Left nodes (5-7) | Source categories with amounts | Recognizable budget/org names |
| Right nodes (5+1) | Top recipients with amounts | Concrete, verifiable names |
| Flow links | Proportional thickness | The "aha" moment — money flowing |
| Year pills | 2016-2024 | Temporal exploration |
| "Overige" nodes | Aggregated remainder | Prevents misleading impression |
| Story tabs | 6 module perspectives | Platform breadth |

### What We Hide (Show on Interaction)

| Element | Trigger | Content |
|---------|---------|---------|
| Flow amounts | Hover tooltip | "Sociale Zaken → SVB: €36.4 mld" |
| Recipient detail amounts | Hover on right node | Sum of all incoming flows |
| Module page CTA | Click any node | "Bekijk alle ontvangers van X →" |

---

## Motion & Interaction Design

### Particles

- **Density proportional to flow amount** — thick flows = river of particles, thin flows = trickle
- **Cap at 200 simultaneous particles** for performance
- **Spawn rate** weighted by flow amount (heavier flows spawn more frequently)
- **Glow effect** preserved from prototype (radial gradient behind each particle)
- **Fade in/out** at flow endpoints (5% fade-in, 10% fade-out)

### Year Transition Animation

When user clicks a different year pill:
1. Amounts count up/down to new values (400ms, ease-out)
2. Flow thicknesses morph smoothly (600ms CSS transition on stroke-width)
3. Particle density adjusts gradually (not instant)
4. If a recipient exits top 5 and new one enters: fade out old (300ms), fade in new (300ms, 150ms delay)

### Story Transition Animation

When user clicks a different story tab:
1. Current flows fade out (300ms)
2. Node labels cross-fade to new names (200ms)
3. New flows fade in (400ms)
4. Particles restart on new flow paths
5. Year pills update to story's year range

### Year Selector Design

- Horizontal row of clickable pills: `2016 · 2017 · 2018 · ... · 2024`
- Active year: pink background, white text
- Inactive years: transparent, blue-light text
- Keyboard navigation: left/right arrow keys
- Per-story year range (Publiek starts at 2018, Inkoop at 2017)

### Accessibility

- `prefers-reduced-motion`: Disable particles entirely, show static flows only. Year and story transitions become instant.
- All amounts available as text (not just visual encoding)
- ARIA labels on nodes and flows
- Keyboard navigable (tab through nodes, arrow through years)

---

## Build-Time Architecture

### Data Pipeline

```
next build (Railway)
  → prebuild script: generate-geldstroom-data.ts
  → Connects to Supabase via SUPABASE_SERVICE_ROLE_KEY (already in Railway env)
  → Queries 6 source tables for each year
  → Computes: top nodes, flows, totals per story per year
  → Validates: checksum (flow sums = node totals)
  → Writes: app/src/data/geldstroom.json
  → Component imports JSON statically (zero runtime API calls)
```

### JSON Schema

```json
{
  "generatedAt": "2026-02-14T12:00:00Z",
  "stories": {
    "integraal": {
      "label": "Alle bronnen",
      "years": [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
      "leftNodes": [
        {
          "id": "instrumenten",
          "label": "Financiële instrumenten",
          "amounts": { "2016": 234000000000, "2017": 241000000000, ... }
        },
        ...
      ],
      "rightNodes": [
        {
          "id": "politie",
          "label": "Politie",
          "amounts": { "2016": 3200000000, "2017": 3400000000, ... }
        },
        ...
        {
          "id": "overige",
          "label": "Overige ontvangers",
          "amounts": { "2016": ..., "2024": ... }
        }
      ],
      "flows": [
        {
          "source": "instrumenten",
          "target": "politie",
          "amounts": { "2016": 2800000000, "2017": 2900000000, ... }
        },
        ...
      ],
      "yearTotals": { "2016": 280000000000, ..., "2024": 345000000000 }
    },
    "publiek": { ... },
    "instrumenten": { ... },
    "inkoop": { ... },
    "gemeente": { ... },
    "provincie": { ... }
  }
}
```

### Build Script Queries Per Story

**Integraal:**
1. Get top 10 recipients from universal_search (by totaal, source_count >= 3)
2. For each recipient, query each of 6 source tables for per-year amounts
3. Module totals: SUM per source table per year

**Publiek:**
1. Source org totals: `GROUP BY source, jaar`
2. Top recipients per year: `GROUP BY source, ontvanger WHERE jaar = X ORDER BY SUM DESC LIMIT 5`
3. Flows: `GROUP BY source, ontvanger, jaar` for top recipients

**Instrumenten:**
1. Top begrotingsnamen: `GROUP BY begrotingsnaam, begrotingsjaar ORDER BY SUM DESC`
2. Top recipients per begrotingsnaam per year
3. Flows: `GROUP BY begrotingsnaam, ontvanger, begrotingsjaar`

**Inkoop:**
1. Ministry normalization map applied first
2. Top ministeries: `GROUP BY normalized_ministerie, jaar`
3. Top leveranciers: `GROUP BY normalized_ministerie, leverancier, jaar`

**Gemeente:**
1. Top gemeentes: `GROUP BY gemeente, jaar ORDER BY SUM DESC`
2. Top recipients per gemeente per year

**Provincie:**
1. Top provinces: `GROUP BY provincie, jaar ORDER BY SUM DESC`
2. Top recipients per province per year

### Estimated JSON Size

- Each story: ~6 left nodes + ~6 right nodes + ~20 flows × 9 years = ~3KB
- Total: 6 stories × 3KB = ~18KB
- Gzipped: ~4KB
- **Negligible impact on page load**

### Fallback Strategy

- Generated JSON committed to repo after first successful generation
- If Supabase is unreachable during build: use previously committed JSON + log warning
- Build never fails due to data unavailability

### When Data Updates

- On every `git push` to main (triggers Railway build)
- Government data updates ~yearly, so build-time generation is more than sufficient
- Manual trigger: re-run `npm run prebuild` locally if needed

---

## Adversarial Review & Mitigations

### Risk 1: Data Accuracy on Homepage
**Risk:** Any wrong number is visible to journalists who fact-check.
**Mitigation:** Checksum validation in build script. Flows sum must equal node totals. Year totals must match actual database aggregates. Build fails loudly on mismatch. Attribution: "Bron: rijksfinancien.nl".

### Risk 2: Year-Over-Year Node Instability
**Risk:** Top 5 ranking changes between years — nodes jump positions.
**Mitigation:** Fix node order based on most recent year (2024). Amounts change, positions don't. Enables intuitive comparison across years.
**Verification:** Top begrotingsnamen have been stable since 2016 (same cast, different amounts).

### Risk 3: "Overige" Dominance
**Risk:** If top 5 covers only 60%, "Overige" becomes second-largest node.
**Mitigation:** Use top 6-7 nodes to keep "Overige" below 30%. Tested: top 6 instrumenten covers 78%.

### Risk 4: Obscure Recipient Names
**Risk:** "Stichting Participatiefonds" means nothing to visitors.
**Decision:** Trust the data. Obscure organizations receiving massive amounts IS our value proposition. "I've never heard of this and it gets €800 million?" = the hook.

### Risk 5: Mobile Rendering
**Risk:** Sankey with 10+ nodes doesn't work at 375px.
**Mitigation:** Below `md:` breakpoint, show simplified version (animated counters or stacked bar). Mobile message banner already tells users to use desktop.

### Risk 6: Political Sensitivity (COA)
**Risk:** COA spending is a hot political topic. Visualization could appear editorial.
**Mitigation:** Identical visual treatment for all 6 stories. No red colors on COA, no alarmist animations. Same palette, same particle speed, same typography. Data presented factually.

### Risk 7: Inkoop Ministry Name Inconsistencies
**Risk:** "I&W" and "I & W" appear as separate nodes (same ministry, different formatting across years).
**Mitigation:** Normalization map in build script. ~4-5 ministries affected. Map all variants to canonical abbreviation.

### Risk 8: Integraal Per-Module Amounts
**Risk:** universal_search doesn't store per-module amounts. Need to join back to source tables.
**Mitigation:** Build script queries each source table separately for top recipients. ~60 queries total (10 recipients × 6 tables). Acceptable at build time (~10-15 seconds total).

### Risk 9: Entity Resolution Across Tables
**Risk:** "ProRail" vs "PRORAIL" vs "ProRail B.V." in different source tables.
**Mitigation:** Use `UPPER(ontvanger)` matching against the normalized key from universal_search. Same normalization function used in materialized views.

---

## Mobile Strategy

### Above `md:` (768px+): Full Sankey

Full visualization with:
- SVG nodes + canvas particles
- Year selector pills
- Story tabs
- Hover tooltips
- Click interactions

### Below `md:`: Simplified Version

Replace Sankey with:
- Headline (same dynamic text)
- 3-4 animated counters (total spending, recipients, data sources, years)
- Single CTA button
- No flow diagram, no year slider, no story tabs

**Rationale:** The mobile message banner already recommends desktop. The simplified version maintains the data credibility message without the complex visualization.

---

## Implementation Plan

### Step 1: Build Script (~3 hours)
- Create `scripts/generate-geldstroom-data.ts`
- Query Supabase for all 6 stories × all years
- Ministry name normalization
- Checksum validation
- Output: `app/src/data/geldstroom.json`
- Add `prebuild` script to `package.json`

### Step 2: Refactor Component (~4 hours)
- Replace hardcoded data with JSON import
- Add year selector (horizontal pills)
- Add story tabs (subtle text row below Sankey)
- Particle density proportional to flow amount
- Per-story visual scale normalization
- Year transition animation (morphing amounts + thicknesses)
- Story transition animation (cross-fade)

### Step 3: CTA & Navigation (~1 hour)
- Node click → "Bekijk alle ontvangers van X →" overlay
- CTA links to correct module page with search pre-filled
- Story tabs update headline text

### Step 4: Mobile Fallback (~1 hour)
- Simplified counter animation below `md:`
- Same headline, different presentation

### Step 5: Accessibility (~1 hour)
- `prefers-reduced-motion` support
- ARIA labels on nodes and flows
- Keyboard navigation (tab, arrow keys)

### Total Estimated Effort: ~10-12 hours

---

## Appendix: Raw Query Results

### Instrumenten — Top 10 Begrotingsnamen (2024)

```
begrotingsnaam                            | total (€ mld) | recipients
------------------------------------------+--------------+-----------
Sociale Zaken en Werkgelegenheid          |         62.6 |      3,336
Onderwijs, Cultuur en Wetenschap          |         56.2 |     21,327
Gemeentefonds                             |         43.8 |        343
Volksgezondheid, Welzijn en Sport         |         37.4 |      8,277
Financiën                                 |         14.4 |        382
Justitie en Veiligheid                    |          8.7 |      1,042
Economische Zaken en Klimaat              |          6.8 |      9,689
Buitenlandse handel en ontwikkelingshulp  |          5.9 |      2,819
Provinciefonds                            |          4.0 |         12
Landbouw, Natuur en Voedselkwaliteit      |          2.9 |      2,912
```

### Instrumenten — Top Flows (2024)

```
begrotingsnaam                    | ontvanger                                  | € mln
----------------------------------+--------------------------------------------+--------
Sociale Zaken en Werkgelegenheid  | Sociale Verzekeringsbank                   | 36,354
Sociale Zaken en Werkgelegenheid  | Belastingdienst/Toeslagen                  | 10,646
Sociale Zaken en Werkgelegenheid  | UWV                                        |  7,093
Gemeentefonds                     | Gemeente Amsterdam                         |  3,042
Gemeentefonds                     | Gemeente Rotterdam                         |  2,326
Gemeentefonds                     | Gemeente 's-Gravenhage                     |  1,825
Onderwijs, Cultuur en Wetenschap  | Nederlandse organisatie voor ...            |  1,393
Onderwijs, Cultuur en Wetenschap  | Commissariaat voor de Media                |  1,248
Gemeentefonds                     | Gemeente Utrecht                           |  1,029
Onderwijs, Cultuur en Wetenschap  | Universiteit Utrecht                       |    867
Onderwijs, Cultuur en Wetenschap  | Universiteit van Amsterdam                 |    819
```

### Publiek — Source Organizations (All Years)

```
source | total (€ mld) | recipients
-------+--------------+-----------
COA    |        10.64 |     11,101
RVO    |         4.12 |     49,545
ZonMW  |         2.50 |      3,001
NWO    |         0.65 |        285
```

### COA — Yearly Spending Trend

```
year | spending (€ mld) | recipients
-----+-----------------+-----------
2018 |            0.56 |      2,183
2019 |            0.54 |      2,139
2020 |            0.66 |      1,752
2021 |            0.83 |      1,974
2022 |            1.41 |      2,788
2023 |            2.94 |      3,975
2024 |            3.72 |      5,173
```

### COA — Top Recipients (2024)

```
ontvanger                      | € mln
-------------------------------+------
RMA Healthcare                 | 340.5
Trigion Beveiliging B.V.       | 303.5
Le Cocq Holding Didam B.V.    | 258.0
Valk Exclusief Holding B.V.   | 157.8
Belastingdienst Apeldoorn     | 125.0
Start People B.V.             | 103.9
```

### Inkoop — Top Ministeries (All Years)

```
ministerie | total (€ mld) | suppliers
-----------+--------------+----------
BZK        |        21.90 |    29,989
I&W*       |        30.01 |   ~40,000
DEF        |         7.88 |    31,429
VWS        |         6.99 |    12,902
J&V*       |        12.36 |   ~84,000
FIN        |         6.22 |    20,364
EZK        |         5.07 |    20,471

* Combined from name variants (I&W + I & W + I & M; J&V + J & V)
```

### Provincie — All Provinces (All Years)

```
provincie     | total (€ mld) | recipients
--------------+--------------+-----------
Noord-Brabant |         4.39 |      1,972
Gelderland    |         2.34 |      3,268
Zuid-Holland   |         1.53 |      1,651
Limburg       |         1.27 |      3,531
Noord-Holland |         1.10 |      2,461
Overijssel    |         1.05 |      5,512
Utrecht       |         0.86 |        866
Drenthe       |         0.66 |      3,150
Friesland     |         0.64 |      3,060
Zeeland       |         0.56 |      1,012
```

### Gemeente — Top 10 (All Years)

```
gemeente    | total (€ mld) | recipients
------------+--------------+-----------
Amsterdam   |         5.94 |      6,037
Den Haag    |         2.54 |      4,357
Groningen   |         0.85 |      2,076
Almere      |         0.85 |        531
Tilburg     |         0.83 |      2,666
Breda       |         0.78 |      1,353
Amersfoort  |         0.58 |        674
Arnhem      |         0.56 |      2,038
Haarlem     |         0.44 |      1,146
Utrecht     |         0.39 |        975
```

### Integraal — Top Cross-Module Recipients (3+ Modules)

```
ontvanger                    | modules | sources                                        | total (€ mld)
-----------------------------+---------+------------------------------------------------+--------------
Politie                      |       4 | Instrumenten, Inkoop, Provincie, Publiek        |        34.26
ProRail B.V.                 |       3 | Instrumenten, Inkoop, Provincie                 |        12.69
Gemeente Rotterdam           |       3 | Instrumenten, Provincie, Publiek                |        12.02
Gemeente Amsterdam           |       5 | Instrumenten, Gemeente, Inkoop, Provincie, Pub. |        11.26
Universiteit Utrecht         |       5 | Instrumenten, Gemeente, Inkoop, Provincie, Pub. |         5.70
Universiteit van Amsterdam   |       5 | Instrumenten, Gemeente, Inkoop, Provincie, Pub. |         5.25
Gemeente Utrecht             |       3 | Instrumenten, Provincie, Publiek                |         5.06
Rijksuniversiteit Groningen  |       5 | Instrumenten, Gemeente, Inkoop, Provincie, Pub. |         4.78
Universiteit Leiden          |       5 | Instrumenten, Gemeente, Inkoop, Provincie, Pub. |         4.33
Gemeente Groningen           |       4 | Instrumenten, Gemeente, Provincie, Publiek      |         4.04
```

---

## Related Documents

- **Brief 2 concepts:** `02-requirements/homepage-brief2-out-of-the-box.md`
- **Current prototype:** `app/src/app/h1/page.tsx`
- **Homepage component:** `app/src/components/homepage/public-homepage.tsx`
- **Brand identity:** `02-requirements/brand-identity.md`
- **Typography system:** See MEMORY.md (dual-width IBM Plex)

---

**Document Status:** Complete — Ready for implementation
**Next Step:** Build-time data script → Component refactor → Integration into homepage
