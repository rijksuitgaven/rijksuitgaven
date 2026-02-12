# Homepage Brief 2: Fully Out of the Box

**Date:** 2026-02-13
**Status:** Discussion complete, awaiting prioritization
**Team:** Sophie (Creative Strategist B2G), Marco (Performance Marketer), Lena (Brand Designer), Daan (Copywriter Dutch B2G), Priya (UX Specialist), Thomas (Web Designer), Eva (Information Architect)

---

## Core Insight

> **"Stop describing the data, start showing it."**
> Every other SaaS product has to fake their "wow moment" with screenshots and testimonials. Rijksuitgaven has €1.700 miljard of real, fascinating, publicly relevant data. The data is the best salesperson we have.

---

## Context

Brief 1 (evolutionary improvements) was implemented in Session 3 on 2026-02-13: section reorder, trust bar, Brawler headings, hero product screenshot, conversion CTA, scroll animations, outcome-first copy. Brief 2 operates without constraints — "if the team could do anything they liked, what would they do?"

---

## Concept 1: "De Geldstroom" — Animated Data Flow Hero

**Impact:** Highest | **Effort:** 16-24 hours | **Priority:** V1.1

**Description:**
Replace the static hero with a continuously animated visualization showing money flowing from the Rijksbegroting to recipients. A simplified Sankey/flow diagram — budget categories on the left, recipient categories on the right, animated particles flowing between them.

**Visual language:**
- Navy background, pink accent particles, white labels
- Slow, graceful particle movement — dignified, not flashy
- Aesthetic: Bloomberg meets Rijksoverheid — authoritative, not playful

**Copy integration:**
The headline "Waar gaat €1.700 miljard naartoe?" appears over the animation. The answer is literally visualizing itself behind the text. The subheadline becomes unnecessary.

**Interaction:**
- Hover over any flow line → tooltip: "Defensie → €15.2 mld" or "Subsidies → ProRail → €461 mln"
- Click any node → pulses pink, CTA: "Bekijk 4.213 ontvangers in Financiële Instrumenten →"
- Creates zero-barrier product experience without login

**Architecture impact:**
Replaces hero section, trust bar, AND product screenshot. Three sections become one — but the one is more powerful than all three combined. Visitor immediately understands: real data, massive scale, explorable.

**Technical approach:**
- D3.js or Framer Motion + custom SVG
- Data can be static/hardcoded (budget category totals don't change often)
- No backend API needed — presentation layer only

**Conversion prediction:** 2-3x increase in demo requests. Visitors who interact with data self-qualify.

---

## Concept 2: "Probeer het zelf" — Live Search Widget

**Impact:** Very High | **Effort:** 8-12 hours | **Priority:** V1.0

**Note:** Also in backlog as "Interactive Search Demo on Homepage" — Brief 2 takes it further.

**Description:**
Not a sandboxed single-module search but a **real search experience** embedded on the homepage with actual results from all 6 modules.

**Widget behavior:**
Search input with placeholder: "Zoek een organisatie, gemeente of regeling..."
Visitor types "ProRail" and within 200ms sees:

```
ProRail B.V.                    €12.7 mld (2016-2024)
  Financiële Instrumenten       €12.2 mld
  Inkoopuitgaven                €412 mln
  Publiek                       €49 mln

  → Bekijk alle details (inloggen vereist)
```

**Show vs. withhold:**
- Show: recipient name, total amount, module breakdown
- Withhold: year-by-year trend, drill-down, export, filters
- Visitor sees enough to want more

**Position:** Section 2, right after hero. Before trust bar. Logic: Hero poses question → Search lets you answer it → Trust bar confirms data is real → Rest builds business case.

**Technical approach:**
- Public `/api/v1/public/search` endpoint, rate-limited (10 req/min per IP)
- Returns top 5 results with summary data only
- Lightweight frontend: search input + results list, ~200 lines
- No TanStack Table, no filters

**Conversion insight (Marco):** Single highest-converting pattern in B2B SaaS. Algolia, Stripe — let visitor experience the "aha moment" before asking for anything.

---

## Concept 3: "Ontdekking van de Week" — Data Stories

**Impact:** High | **Effort:** 4-6 hours (component) + 30 min/week (content) | **Priority:** V1.0

**Description:**
A rotating "Ontdekking van de Week" card featuring a surprising or newsworthy spending fact sourced directly from the data. Updated weekly (manually or automated from V2 Reporter pipeline). Each discovery links to the platform with a pre-filled search.

**Example discoveries:**
- "De Politieacademie ontving €342 miljoen — meer dan 12 provincies samen."
- "Wist u dat de overheid €47 miljoen uitgaf aan wolvenbeheer in 2024?"
- Real patterns from the database — not made up.

**Position:** Between Features and Subscriptions. Serves as social proof through data — not "Trusted by 50 organizations" (weak with 50 users) but "Here's what our data reveals" (strong regardless of user count).

**Visual:**
- Navy card, large pink number (euro amount), one-sentence insight, "Ontdek meer →" CTA
- Clean, editorial — Financial Times data annotation aesthetic
- Rotates weekly — returning visitors see something new

**Additional benefits:**
- Solves "returning visitor problem" — always a reason to scroll past fold
- Each discovery sharable on LinkedIn (pre-loaded search URL)
- Content marketing embedded in the product
- Can be automated via V2 Reporter pipeline later

---

## Concept 4: "Geldkaart" — Geographic Spending Map

**Impact:** Medium-High | **Effort:** 12-16 hours | **Priority:** V1.1

**Description:**
Interactive map of the Netherlands showing spending by province/gemeente. Color intensity indicates spending volume. Hover shows amount. Click goes to module page.

**Visual:**
- Color scale: navy (low) → pink (high)
- Brand palette as data encoding — beautiful AND informative
- Could replace product screenshot as hero image
- NOS.nl election map format — instantly understood by every Dutch person

**Interaction:**
- Hover: province name + total spending
- Click: tooltip with "Bekijk 47 subsidieregisters in Gelderland →"
- Map is a navigation device disguised as a visualization

**Target audience hook:**
Particularly powerful for gemeente/provincie audience — council members, aldermen can literally find their own gemeente on the map and compare. Immediate emotional hook.

**Distribution:**
Visual that gets shared, screenshotted, embedded in presentations. Markets itself. Positions Rijksuitgaven as the "authority" on geographic spending data.

**Technical approach:**
- react-map-gl or SVG-based (static province shapes)
- Static data (province/gemeente totals)

---

## Concept 5: "Het Verschil" — Before/After Narrative

**Impact:** Medium | **Effort:** 8-10 hours | **Priority:** V1.1

**Description:**
Instead of listing features, show the transformation. A scroll-driven narrative section: as visitor scrolls, the "before" state (dark, cluttered, frustrating) transforms into the "after" state (clean, branded, fast).

**Before state (left/top):**
- Spreadsheets, PDFs, manual work, weeks of research
- Monochrome, dense text, overlapping papers
- The reality: government workers downloading CSVs from different ministry websites

**After state (right/bottom):**
- Clean interface, instant results, 3 clicks to insight
- Brand colors, clean UI, actual product screenshots
- The promise: everything in one platform

**Execution:**
Scroll-synced parallax section. CSS-only transition at midpoint, no heavy libraries. Single section that tells the entire product story.

**Audience resonance:**
For government audience, the "before" state is painfully real. Showing that reality — then showing the solution — is more persuasive than any feature list.

---

## Team Ranking Summary

| # | Concept | Impact | Effort | Priority | Dependencies |
|---|---------|--------|--------|----------|--------------|
| 1 | **De Geldstroom** — Animated data flow hero | Highest | 16-24h | V1.1 | D3.js or Framer Motion |
| 2 | **Probeer het zelf** — Live search widget | Very High | 8-12h | V1.0 | Rate limiting (Cloudflare), public API |
| 3 | **Ontdekking van de Week** — Data stories | High | 4-6h + ongoing | V1.0 | Content pipeline |
| 4 | **Geldkaart** — Geographic spending map | Medium-High | 12-16h | V1.1 | react-map-gl or SVG |
| 5 | **Het Verschil** — Before/After narrative | Medium | 8-10h | V1.1 | None |

---

## Decisions Needed

1. Which concepts to implement for V1.0 launch? (Team recommends: #2 + #3)
2. For "Probeer het zelf": rate limiting must be in place first (Cloudflare — see backlog)
3. For "Ontdekking van de Week": who writes the weekly discovery? (Founder? Automated?)
4. For "De Geldstroom": D3.js vs Framer Motion? (Design discussion needed)
5. For "Geldkaart": which data to show? Province totals only, or gemeente-level?

---

## Related Backlog Items

- Interactive Search Demo on Homepage (already in backlog, High priority V1.0)
- Tab-Based Feature Explorer (already in backlog, Medium V1.1)
- Audience-Personalized Landing Variants (already in backlog, Medium V1.1)
- Rate Limiting / Cloudflare (pre-requisite for public search endpoint)
