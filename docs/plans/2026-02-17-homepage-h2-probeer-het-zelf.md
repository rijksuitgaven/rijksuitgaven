# Homepage H2: "Probeer het zelf" — Live Search Table Widget

**Date:** 2026-02-17
**Status:** Implementing (Phase 2 — live search)
**Team:** Sofia (Conversion Designer), Daan (Data Table Specialist), Lena (Visual Designer), Kai (Information Architect), Viktor (Adversarial Reviewer)
**Security Team:** Nadia (Pen Tester), Sanjay (Backend Architect), Tomasz (Frontend Engineer), Elara (Rate Limiting Specialist), Viktor (Adversarial Strategist)

---

## Concept

Replace the current H2 prototype (search → summary cards) with a **live-filtering data table** inside a dark navy container (H3 visual style). The table shows real recipients with redacted bars for gated year columns — creating "classified document" tension that drives conversion.

**Core insight:** Show the real product (a data table with year columns), gate the value (historical years hidden), let the visitor interact (search/filter). The data sells itself.

**Phase 1 (complete):** 56 curated hardcoded recipients, client-side filter.
**Phase 2 (in progress):** Live search against 463,731 recipients via public API, with anti-scraping measures.

---

## Layout (top to bottom)

### 1. Header (outside the dark card)

- **Eyebrow:** "Probeer het zelf" — pink (#E62D75), uppercase, 13px, 600 weight, letter-spacing 0.08em
- **Headline:** "Ontdek waar **€1.700 miljard** naartoe gaat" — €1.700 miljard in pink
- **Subtext:** "Een professioneel abonnement geeft u toegang tot alle jaren en 6 databronnen"

### 2. Dark navy container

Same visual treatment as H3 (Ontdekking van de Week):
- Background: var(--navy-dark, #0E3261)
- Border-radius: 16px
- Noise texture overlay (inline SVG, fractalNoise, 0.035 opacity)
- Subtle grid pattern (40px, rgba white 0.015)
- Pink left accent bar (3px, gradient top-to-bottom transparent → pink → transparent, 0.4 opacity)
- Box shadow: `0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)`

### 3. Search input (inside dark card, top)

- White background input field (rgba 255,255,255,0.95)
- Search icon (left), pink on focus, white-muted when unfocused
- Animated typing placeholder: cycles through "ProRail", "Gemeente Amsterdam", "Rijksmuseum", "Universiteit", "Rode Kruis"
- Pink focus ring (2px border)
- Clear button (×) when text present
- Border-radius: 12px
- Max-width: 600px, centered

### 4. "Probeer:" chips (below search input, centered)

- Row of quick-search buttons: ProRail, Amsterdam, Universiteit, Rijksmuseum, Rode Kruis
- Click sets search query and triggers API search
- Glass-like appearance: rgba white 0.08 background, 0.12 border
- Hover: brighter background, white text, subtle lift

### 5. White inset table panel

- Background: #ffffff
- Border-radius: 12px
- Subtle inset shadow: `inset 0 1px 3px rgba(0,0,0,0.06)`
- **Default state:** 10 curated rows (before any typing)
- **Search state:** 10 API results from integraal view
- **Loading state:** skeleton rows while API responds
- Horizontal scroll on overflow with styled scrollbar

### 6. Footer (inside dark card, below table)

- Left: "Bron: data.overheid.nl" — 12px, white text at 0.35 opacity, condensed font
- Right: "Bekijk alle jaren →" — 14px, 600 weight, white text, turns pink on hover, arrow slides right 4px

---

## Table Specification

### Columns (desktop)

| Ontvanger | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | Totaal |
|-----------|------|------|------|------|------|------|------|--------|

- **Ontvanger:** left-aligned, regular weight, ellipsis on overflow, sticky left column
- **2018–2023:** redacted navy bars (not real data)
- **2024:** real numbers, right-aligned, tabular-nums
- **Totaal:** real numbers, right-aligned, 600 weight

### Redacted bars

- Color: var(--navy-dark, #0E3261) at 10% opacity
- Height: 14px
- Border-radius: 4px
- Three width sizes: 32px (small), 48px (medium), 64px (large)
- Deterministic per cell: `BAR_WIDTHS[(seed * 7 + colIndex * 13) % 3]` (hardcoded) or hash-based (API results)
- Centered in cell

### Typography

- Font: var(--font-condensed) — IBM Plex Sans Condensed, matching the real product
- Header row: 600 weight, light gray background (#F7F8FA), 13px
- Data rows: 400 weight, 14px
- Numbers: `font-variant-numeric: tabular-nums`

### Interaction

- **Live search:** typing triggers API call after 200ms debounce
- **Default rows:** 10 curated hardcoded rows before any typing
- **Max results:** 10 per search
- **Row hover:** subtle background shift to #F8FAFD
- **Sort indicators:** visual only (non-functional chevrons)
- **0 results:** "Geen resultaten voor "[query]" — probeer een andere zoekterm"
- **Rate limit:** "U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw."
- **Sticky Ontvanger column:** stays visible during horizontal scroll

### Number formatting

- ≥1 mld: `€X,X mld` (e.g. €36,6 mld)
- ≥100 mln: `€X mln` (e.g. €805 mln)
- ≥1 mln: `€X,X mln` (e.g. €5,3 mln)
- ≥1k: `€Xk` (e.g. €585k)
- 0: em-dash (—)

---

## Data Source

### Phase 1: 56 curated hardcoded (default state)

Pre-extracted from production Supabase (2026-02-17). Used as default display before typing.

**Categories:**
- Government bodies (10), Municipalities (6), Universities (9), Hogescholen (2)
- Research (5), Transport (2), Culture (10), Security (4), Social (8)

### Phase 2: Live integraal search (on typing)

- 463,731 recipients via Typesense → `universal_search` view
- Public BFF endpoint: `GET /api/v1/public/search?q=ProRail&limit=10`
- Backend endpoint: `GET /api/v1/public/search?q=ProRail&limit=10`
- Returns: `ontvanger`, `y2024`, `totaal` only
- No authentication required

---

## Search Architecture

### Data flow

```
Homepage search input
  → 200ms debounce
  → GET /api/v1/public/search?q=... (BFF)
    → Anti-scraping checks (fingerprint + rate limit + query cost)
    → GET /api/v1/public/search?q=... (Backend)
      → Typesense search (recipients collection)
      → Top 10 ontvanger_key IDs
      → SQL: SELECT ontvanger, "2024", totaal FROM universal_search WHERE ontvanger_key = ANY($1)
    → Return [{ontvanger, y2024, totaal}, ...]
  → Render in table (same visual as hardcoded rows)
```

### Endpoints

**BFF route:** `app/src/app/api/v1/public/search/route.ts`
- GET handler, no auth required
- Query params: `q` (string, min 2 chars), `limit` (number, max 10)
- Anti-scraping middleware (see below)
- Proxies to backend

**Backend route:** `backend/app/api/v1/public.py`
- GET `/api/v1/public/search`
- Typesense search → universal_search SQL
- Returns sanitized response (3 fields only)

---

## Anti-Scraping Security (Security Team Review, 2026-02-17)

### Threat model

- **Target:** 463,731 recipient names with 2024 + totaal amounts
- **Attack vector:** Automated enumeration (aa, ab, ac... zz = 676 queries covers significant ground)
- **Attacker cost (baseline):** 10 req/min × 10 results = 100 names/min = 77 hours single-IP
- **Data sensitivity:** Low (government spending is public via data.overheid.nl)
- **Goal:** Make bulk scraping impractical, not impossible

### Measures implemented (3 total, ~90 min effort)

#### 1. Progressive rate limits with burst allowance

Replace flat rate limit with token bucket:
- **Burst:** 20 tokens initially (allows rapid exploration)
- **Sustained:** refill 5 tokens/minute
- **Sliding window** (not fixed 1-min buckets) to prevent boundary gaming

Real user behavior: types 3-5 searches, clicks a few chips = ~8 requests. Well within burst.
Scraper behavior: sustained 10+ req/min = throttled after initial burst.

#### 2. Query length penalty multiplier

Short queries are the enumeration attack vector (aa, ab, ac...). Penalize them:
- 2-3 char query: costs **3 tokens**
- 4-6 char query: costs **1 token**
- 7+ char query: costs **1 token**

Formula: `Math.max(1, Math.ceil(3 / Math.sqrt(query.length)))`

Impact: "aa" costs 3 tokens → burst of 20 tokens only covers 6 short queries instead of 20. Attacker needs 676 two-char queries = 338 token cost = 68 minutes minimum (single IP).

#### 3. Fingerprint-enhanced rate limiting

Rate limit key = hash of `IP + User-Agent + Accept-Language` (not just IP).

- Prevents trivial IP rotation with same bot signature
- Different browsers/devices on same network get separate limits (shared office WiFi)
- Falls back to IP-only if headers missing

### Rate limit error message (Option B — honest)

When limit exceeded, BFF returns 429. Frontend displays inline in table area:

> "U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw."

### Measures deferred

| Measure | When to implement |
|---------|-------------------|
| Result randomization within score bands | If evidence of large-scale scraping (same queries, distributed IPs) |
| Redis persistent rate limits | If scaling to multiple Railway instances |
| Cloudflare WAF | Post-launch (Pro plan, $20/month, pushes defense to edge) |
| Response time jitter for 429s | Nice-to-have, low priority |
| User-Agent validation | Log for monitoring only, don't block |

### Rate limiter implementation

```typescript
// BFF route — Edge Runtime compatible
interface TokenBucket {
  tokens: number
  lastRefill: number
  fingerprint: string
}

const MAX_ENTRIES = 10_000
const BURST_TOKENS = 20
const REFILL_RATE = 5  // tokens per minute

function getFingerprint(ip: string, ua: string, lang: string): string {
  // SHA256 hash of combined values, first 16 chars
}

function getQueryCost(query: string): number {
  return Math.max(1, Math.ceil(3 / Math.sqrt(query.length)))
}

function consumeTokens(fingerprint: string, cost: number): boolean {
  // Refill based on elapsed time, then deduct cost
  // Return false if insufficient tokens (429)
}
```

---

## Mobile (< 768px)

- Year columns (2018–2023) hidden via `.h2-year-col { display: none }` CSS class
- Table shows 3 columns: **Ontvanger | 2024 | Totaal**
- Table min-width override to prevent forced horizontal scroll
- Search input + chips: unchanged

---

## Animations

Retained from Phase 1:
- Fade-up entrance animations (`h2FadeUp`) on all sections with staggered delays
- Chip hover lift + color transitions
- Table rows staggered fade-in (`h2RowFadeIn` — 30ms delay per row)
- CTA arrow slides right 4px on hover

New in Phase 2:
- Loading skeleton in table while API responds
- Smooth transition from default rows to search results

---

## Trust Bar (below dark card)

Three indicators (centered row):
- **463.731** ontvangers
- **9 jaar** data
- **€1.700+ mld** aan uitgaven

---

## Bottom CTA

- Headline: "Klaar om dieper te graven?"
- Single pink button: "Gratis proberen" → /login
- Hover: darker pink, shadow increase, 2px lift

---

## Decisions Made

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Table vs. cards | Table | Shows the real product; cards feel too summarized |
| Masked years style | Redacted navy bars | Premium, editorial feel — industry standard |
| Default rows | 10 curated hardcoded | Immediate value, no API call needed |
| Search data source | Live Typesense (463k recipients) | Every visitor can find something personally relevant |
| Max results | 10 per search | Compact widget, enough to demonstrate value |
| Search type | API with 200ms debounce | Feels instant, full coverage |
| Year range | 2018–2024 | Fits on screen without horizontal scroll |
| Mobile columns | 3 (Ontvanger, 2024, Totaal) | Only useful columns fit |
| CTA text | "Bekijk alle jaren →" | Single focus on what's gated |
| Amounts | Absolute euros (no x€1.000) | Matches current product |
| Trust bar | 3 items (no "6 databronnen") | Cleaner, databronnen not a USP |
| Anti-scraping | Progressive rate limit + query cost + fingerprint | Makes bulk scraping impractical without hurting real users |
| Rate limit UX | Option B — inline message | Honest and professional |
| Rate limit deferred | Redis, Cloudflare WAF, result randomization | Monitor first, implement if abuse detected |

---

## Files

### Phase 1 (implemented)
- `app/src/app/h2/page.tsx` — frontend component

### Phase 2 (implementing)
- `app/src/app/api/v1/public/search/route.ts` — BFF proxy with anti-scraping (NEW)
- `backend/app/api/v1/public.py` — backend public search endpoint (NEW)
- `app/src/app/h2/page.tsx` — updated: API integration, loading state, rate limit message
