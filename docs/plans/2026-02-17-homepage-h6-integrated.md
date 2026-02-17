# Homepage H6: De Geintegreerde Homepage

**Date:** 2026-02-17
**Status:** Design specification (pre-implementation)
**Combines:** Current public-homepage.tsx + H2 "Probeer het zelf" widget + H3 "Ontdekking van de Week" widget

---

## Concept

H6 is the unified homepage that replaces the current `public-homepage.tsx` by integrating two proven interactive widgets (H2 live search table, H3 data stories carousel) into a refined 9-section editorial page. The goal is a single, cohesive visitor journey: headline hook ("Waar gaat €1.700 miljard naartoe?") into immediate hands-on interaction (search widget) into credibility proof (trust numbers) into editorial surprise (discovery carousel) into audience relevance into feature proof into pricing into government offering into conversion (demo form). Every section either builds curiosity or resolves it — nothing passive.

**Key principle:** Show, don't tell. The H2 widget replaces the static product screenshot. The H3 widget replaces the feature cards that described insights. The visitor experiences the product before being asked to buy.

---

## Section Flow & Visual Rhythm

| # | Section | Background | Content Type |
|---|---------|------------|-------------|
| 1 | Hero | White | Text (headline + subline) |
| 2 | H2 Widget | Dark navy card on white | Interactive (search table) |
| 3 | Trust Bar | White | Numbers (compact metrics) |
| 4 | H3 Widget | Dark navy card on subtle gray #f8f9fb | Interactive (discovery carousel) |
| 5 | Audience | White | Tabbed text (5 audiences) |
| 6 | Features | Gradient #f8f9fb → #eef2f7 | 3 cards + checklist |
| 7 | Subscriptions | Gradient #eef2f7 → white | 2 tiers |
| 8 | B2G | Subtle gray #f8f9fb | Text + cards |
| 9 | Contact | Pink (#E62D75) | Form |

**Rhythm pattern:** White → dark-on-white → white → dark-on-gray → white → gray-gradient → gradient → gray → pink. The two dark navy widget cards create visual anchors at positions 2 and 4, framed by breathing room. The page ends on the strong pink accent.

---

## Section 1: Hero

### Content

- **Headline:** "Waar gaat €1.700 miljard naartoe?" — sacred copy, no changes
  - "€1.700 miljard" rendered in pink (#E62D75)
  - Remaining text in navy dark (#0E3261)
- **Subline:** "Rijksuitgaven is hét onafhankelijke platform om overheidsuitgaven snel tot in detail te doorzoeken en vergelijken."
- **No CTA button in hero** — the H2 widget directly below IS the call to action ("Probeer het zelf")

### Layout

- Max-width: 1080px container, centered
- Padding: top 80px (desktop) / 56px (mobile), bottom 24px
- Headline: left-aligned (not centered — editorial feel, matching current homepage)
- Subline: left-aligned, max-width 640px

### Typography

- Headline: `clamp(32px, 5vw, 54px)`, font-weight 700, line-height 1.1, letter-spacing -0.02em, var(--font-heading)
- Subline: `clamp(18px, 2.2vw, 22px)`, font-weight 400, line-height 1.5, var(--font-body), opacity 0.8

### Visual Treatment

- Background: white (#ffffff)
- No product screenshot (H2 widget replaces it)
- No value prop icons (those move to Features section 6)

### Animations

- ScrollReveal on headline (fade-up, 600ms, spring easing)
- ScrollReveal on subline (fade-up, 600ms, 100ms delay)

### Mobile (< 768px)

- Padding top reduces to 56px
- Headline remains left-aligned, naturally wraps
- Subline max-width: 100%

### Design Decisions

The current homepage hero has: headline + subline + 3 value prop blurbs + product screenshot + "Probeer nu" CTA. In H6, the value props move to section 6 (Features), the screenshot is replaced by the live H2 widget, and the CTA is removed because the widget itself is the invitation. This creates a tighter hero-to-interaction flow with no dead space.

The headline switches from pink-only (current) to navy-with-pink-accent (matching H2's treatment) for better readability at large sizes. The "€1.700 miljard" in pink creates the accent.

---

## Section 2: H2 Widget — "Probeer het zelf"

### Content

**Above the dark card (eyebrow + headline):**
- **Eyebrow:** "Probeer het zelf" — pink (#E62D75), uppercase, 13px, 600 weight, letter-spacing 0.08em, centered
- **Headline:** "Ontdek waar **€1.700 miljard** naartoe gaat" — "€1.700 miljard" in pink, rest in navy, centered
- **Subtext:** "Een professioneel abonnement geeft u toegang tot alle jaren en 6 databronnen" — centered

**Inside the dark card (embedded H2 component):**
- Search input with animated placeholder (cycles: ProRail, Gemeente Amsterdam, Rijksmuseum, Universiteit, Rode Kruis)
- "Probeer:" quick-search chips (ProRail, Amsterdam, Universiteit, Rijksmuseum, Rode Kruis)
- White inset data table: Ontvanger | 2018-2023 (redacted bars) | 2024 (real) | Totaal (real)
- Default state: 10 curated recipients
- Search state: 10 live API results from 463,731 recipients
- Footer: "Bronnen: Rijksoverheid & medeoverheden" (left) + "Bekijk alle jaren en data →" (right)

### Layout

- Outer container: max-width 1100px, centered, padding 0 24px
- Dark card: full container width
- Content padding inside card: 32px horizontal, 32px top, 28px bottom
- Search input: max-width 600px, centered within card
- Table: full card width minus padding

### Visual Treatment

The dark card uses the established H3 visual language:
- Background: var(--navy-dark, #0E3261)
- Border-radius: 16px
- Noise texture overlay (inline SVG, fractalNoise, 0.035 opacity, mix-blend-mode: overlay)
- Subtle grid pattern (40px spacing, rgba(255,255,255,0.015) lines)
- Pink left accent bar (3px wide, gradient top-to-bottom transparent → #E62D75 → transparent, 0.4 opacity)
- Radial gradient overlay (subtle light bloom at top-right)
- Box shadow: `0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)`

White inset table panel:
- Background: #ffffff
- Border-radius: 12px
- Inset shadow: `inset 0 1px 3px rgba(0,0,0,0.06)`
- Font: var(--font-condensed) — IBM Plex Sans Condensed (matches real product)

### Interactions

- Live search: typing triggers API after 200ms debounce
- Minimum query length: 2 characters
- Quick-search chips set query and trigger search
- Clear button (x) when text present
- Search input focus: pink border ring (2px), search icon turns pink
- Row hover: background shifts to #F8FAFD
- Sort chevrons: visual only (non-functional)
- Loading: skeleton shimmer animation while API responds
- 0 results: "Geen resultaten voor "[query]" — probeer een andere zoekterm"
- Rate limited: "U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw."

### Table Columns (Desktop)

| Ontvanger | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | Totaal |
|-----------|------|------|------|------|------|------|------|--------|

- **Ontvanger:** left-aligned, sticky left, ellipsis on overflow, min-width 200px
- **2018-2023:** redacted navy bars (3 sizes: 32/48/64px, deterministic per cell)
- **2024:** real numbers, right-aligned, tabular-nums
- **Totaal:** real numbers, right-aligned, 600 weight

### Number Formatting

- >= 1 mld: `€X,X mld` (e.g. €36,6 mld)
- >= 100 mln: `€X mln` (e.g. €805 mln)
- >= 1 mln: `€X,X mln` (e.g. €5,3 mln)
- >= 1k: `€Xk` (e.g. €585k)
- 0: em-dash (—)

### Animations

- Section entrance: h2FadeUp (opacity 0→1, translateY 20→0, 700ms, 450ms delay)
- Chips: h2FadeUp (500ms, 650ms delay) — only visible when no query
- Table rows: h2RowFadeIn (staggered 30ms per row)
- Loading skeleton: h2Shimmer (linear gradient slide, 1.2s infinite)
- CTA arrow: translateX(4px) on hover

### Mobile (< 768px)

- Year columns 2018-2023 hidden via CSS class `.h2-year-col { display: none }`
- Table shows 3 columns: Ontvanger | 2024 | Totaal
- Table min-width override to 0 (prevents forced horizontal scroll)
- Search input + chips unchanged
- Card padding reduces to 20px horizontal

---

## Section 3: Trust Bar

### Content

Three indicators, centered horizontally:
- **450.000+** ontvangers
- **9 jaar** data
- **€1.700+ mld** aan uitgaven

Separated by thin vertical pipe characters ( | ).

### Layout

- Max-width: 900px, centered
- Single row with flex-wrap
- Gap: 8px vertical, 32px horizontal
- Padding: top 48px, bottom 0 (flows into section 4)

### Typography

- Value: 15px, font-weight 700, navy dark, tabular-nums
- Label: 14px, font-weight 400, navy medium (#436FA3), opacity 0.8

### Visual Treatment

- Background: white (continuous from section 2 area)
- No borders, no card — lightweight row
- Pipe separators: gray-light (#E1EAF2), 18px font-size

### Animations

- ScrollReveal fade-up, 700ms

### Mobile (< 768px)

- Naturally wraps to 2 lines if needed
- Gap reduces

### Design Decisions

The current homepage trust bar has 4 items (€1.700+ mld, 4.900+ regelingen, 9 begrotingsjaren, 6 databronnen) with large 26-32px numbers. H6 reduces to 3 compact items matching H2's trust bar treatment. "4.900+ regelingen" and "6 databronnen" are dropped because (a) "regelingen" is jargon to most visitors and (b) "databronnen" count is not a differentiator. The 3 remaining numbers (recipients, years, total amount) are universally impressive.

---

## Section 4: H3 Widget — "Ontdekking van de Week"

### Content

**Above the dark card:**
- **Eyebrow:** "Ontdekking van de Week" — pink, uppercase, 13px, 600 weight, letter-spacing 0.08em, centered
- **Headline:** "Verrassende inzichten uit de data" — navy dark, centered

**Inside the dark card (embedded H3 component):**
- Large animated counter (e.g., "€13,1 miljard") — white text, counting up on viewport entry
- Editorial insight text (e.g., "Dat ontving Zorginstituut Nederland alleen al in 2024 via financiele instrumenten")
- Source attribution line
- Social sharing buttons: LinkedIn, X (Twitter), Bluesky
- "Bekijk de data →" CTA per discovery (links to relevant module page)
- Auto-rotating carousel: advances every 8 seconds, pauses on hover
- Navigation: left/right arrows + dot indicators
- 23 verified discoveries in rotation

### Layout

- Outer container: max-width 1100px, centered
- Dark card: same dimensions and treatment as H2 card
- Content padding: 40px horizontal, 48px top, 36px bottom
- Counter: centered, large
- Insight text: centered, max-width 600px
- Social + CTA: centered row below text

### Visual Treatment

Identical dark card treatment to H2 (navy dark, noise, grid, pink accent bar, shadows). This visual consistency creates a "paired widget" feeling — two dark editorial cards on the page that clearly contain the interactive product experience.

- Counter: white, font-size clamp(36px, 6vw, 64px), font-weight 700, tabular-nums
- Insight text: white, 18-20px, font-weight 400, opacity 0.9, line-height 1.6
- Source: white, 13px, opacity 0.4, font: var(--font-condensed)
- Social icons: white at 0.5 opacity, hover to 1.0
- "Bekijk de data →" CTA: white text, turns pink on hover, arrow slides right

### Background

- Section background: #f8f9fb (subtle off-white, creates contrast with white sections above/below)
- Padding: top 64px, bottom 64px

### Interactions

- Counter: counts up from 0 on viewport entry (1.2s duration, easeOutExpo)
- Carousel: auto-advances every 8 seconds
- Hover on card: pauses auto-advance
- Arrow buttons: slide transition between discoveries (300ms)
- Dot indicators: click to jump to specific discovery
- Social buttons: open share URL in new window (pre-filled text + URL)

### Animations

- Section entrance: ScrollReveal fade-up
- Counter: countUp animation on intersection
- Card transitions: crossfade (opacity) + subtle translateX for carousel direction

### Mobile (< 768px)

- Counter font-size reduces via clamp
- Social buttons remain full-width row
- Arrow buttons: positioned at card edges, overlapping slightly
- Dot indicators shrink
- Card padding reduces to 24px horizontal

---

## Section 5: Audience — "Gebouwd voor"

### Content

5 audience tabs, auto-advancing:
1. **Raadsleden** — "Raadsleden en Statenleden" — "Vergelijk prestaties met de data van andere gemeenten en provincies, formuleer vragen en verbeter beleid."
2. **Politiek** — "Politieke partijen" — "Directe inzage in werkelijke realisatie van begrotingen, wetten en regelingen."
3. **Journalisten** — "Journalisten & onderzoekers" — "Krijg razendsnel toegang tot data om verhalen te ontdekken en impactvolle analyses te maken."
4. **Bedrijven** — "Bedrijven & non-profits" — "Vind kansen in subsidies en aanbestedingen en maak betere strategische keuzes."
5. **Academici** — "Academici & studenten" — "Gebruik betrouwbare data voor onderzoek en onderwijs over publieke financiën."

### Layout

- Max-width: 1080px, centered
- Section label: "Gebouwd voor" — centered, uppercase, 13px, 600 weight, letter-spacing 0.15em, navy medium at 0.6 opacity
- Tab bar: horizontal pill buttons, centered, flex-wrap
- Description area: centered, max-width 560px, min-height 80px (prevents layout shift)
- Progress dots: centered row below description

### Visual Treatment

- Background: white
- Active tab: navy dark pill background with white text, `shadow-[0_2px_8px_rgba(14,50,97,0.2)]`
- Inactive tabs: transparent, navy dark text at 0.7 opacity, hover: gray-light background at 0.5
- Each tab shows an icon (SVG, Heroicons outline style) + label text
- Description crossfades on tab change (350ms animation)

### Interactions

- Auto-advance: every 5 seconds
- Hover on tab bar or description: pauses auto-advance
- Click tab: immediate switch
- Progress bar: thin 3px bars per audience, active bar fills over 5s (pink), paused = full pink

### Animations

- Tab switch: pillFadeIn (250ms ease-out) for active pill background
- Description: audienceFadeIn (350ms ease-out) crossfade
- Progress: progressFill (5s linear)

### Mobile (< 768px)

- Tab pills wrap to 2-3 rows naturally
- Description area: full-width
- Auto-advance continues

---

## Section 6: Features — "Het meest complete platform"

### Content

**Headline:** "Het meest complete platform voor overheidsuitgaven" — pink (#E62D75)
**Subhead:** "Alles doorzoekbaar en vergelijkbaar." — navy dark

**3 feature cards** (reduced from current 6 — the H2 widget already demonstrates search; H3 widget already demonstrates discovery):
1. **"Alle uitgaven per ontvanger"** — "Bekijk per ontvanger uitgaven, regelingen en instrumenten, plus een handige link om snel verder te zoeken." — Screenshot: Detail01.png
2. **"Begroting in één oogopslag"** — "Bekijk het volledige begrotingsoverzicht en zie hoe het geld verdeeld wordt." — Screenshot: Begroting.png
3. **"Wie ontvangt het meest?"** — "Bekijk de top 50 ontvangers, instrumenten en artikelen op basis van uitgaven. Duik in de cijfers!" — Screenshot: Top50-ontvangers.png

**Extra features checklist** (below cards):
- Altijd actuele cijfers dankzij regelmatige dataset-updates
- Nieuwe databronnen, naast de Financiële Instrumenten ook apparaatskosten en meer
- Slimme exportopties: Excel, CSV en kopiëren naar klembord
- Feedback = impact — deel ideeën en beïnvloed nieuwe features
- Integraal zoeken door alle data, voor volledige transparantie

**Conversion CTA card** (below checklist):
- "463.000+ ontvangers doorzoekbaar in 6 databronnen"
- "Van rijkssubsidies tot gemeentelijke uitgaven — alles in één platform."
- Button: "Boek een demo ›" → #aanmelden

### Layout

- Max-width: 1080px, centered
- Cards: 3-column grid on desktop, 1-column on mobile
- Card design: white background, rounded-xl, browser chrome frame (3 dots), screenshot with aspect-ratio 4:3, title + description below
- Checklist: max-width 640px, left-aligned
- CTA card: full-width white card, centered text, shadow

### Visual Treatment

- Section background: gradient from #f8f9fb (30%) to #eef2f7
- Cards: white, rounded-xl, shadow, hover: stronger shadow + translateY(-4px)
- Browser chrome: gray (#f0f2f5) bar with 3 dots
- Screenshots: object-cover, hover: scale 1.02
- Checkmarks: pink SVG checkmark icon
- CTA card: white with subtle shadow, centered

### Interactions

- Card hover: shadow increase + 4px lift
- Screenshot hover: subtle scale (1.02, 500ms)
- CTA button hover: darker pink + stronger shadow + 2px lift

### Animations

- ScrollReveal on each card (staggered via CSS child selectors)
- ScrollReveal on checklist
- ScrollReveal on CTA card

### Mobile (< 768px)

- Cards stack to 1-column
- Screenshots: full-width
- CTA card: full-width

### Design Decisions

Reduced from 6 cards to 3. Removed: "Slim zoeken" (H2 widget demonstrates this live), "Ontdek bestedingen" (H3 widget demonstrates this), "Wat is er nieuw?" (lower-priority feature). The 3 remaining cards show capabilities the widgets cannot: detail views, budget overview, and rankings. Also removed "Nog meer inzichten zoals snelste stijgers en dalers" from checklist (not yet built, per V1 scope).

---

## Section 7: Subscriptions — "Onze abonnementen"

### Content

**Headline:** "Onze abonnementen" — pink

**Tier 1: Professioneel** (navy header card)
- Header bar: navy dark background, "Professioneel" in white, centered, 22px bold
- Body: light blue-gray (#e7eef5) background
- Subtitle: "Onbeperkt toegang voor diepgaande inzichten en krachtige analyses"
- 3-column feature grid:
  - Column 1 (Features): Slim zoeken op ontvanger, Uitgebreid zoeken met filters, Alle details per ontvanger, Grafieken, Begroting in één oogopslag, Top ontvangers, regelingen en meer
  - Column 2 (Data): Financiële Instrumenten (2016-2024), Apparaatsuitgaven (2016-2024), Provinciale subsidieregisters (2018-2024), Gemeentelijke subsidieregisters, Inkoopuitgaven (2017-2023)
  - Column 3 (Benefits): Ontdek verrassende uitgaven, Snel vergelijken van data, Onbeperkte zoekopdrachten, Slimme exportopties naar Excel en CSV, Deel en beïnvloed nieuwe features, En nog heel veel meer

**Tier 2: Op maat** (navy dark card with wave background image)
- Title: "Op maat" — white, 22px bold
- Description: "Heeft u meerdere persoonlijke abonnementen nodig of heeft u voor uw organisatie specifieke wensen? Wij helpen u graag met een offerte op maat."
- Features: Geselecteerde datasets, Maatwerkrapportages en geavanceerde analyses, Persoonlijk advies, Trainingen en exclusieve sessies voor uw team
- CTA: "Neem contact op ›" — outlined white button → #aanmelden

### Layout

- Max-width: 1080px, centered
- Professioneel: full-width card, rounded-xl
- Op maat: full-width card, rounded-xl, 5px gap below Professioneel
- Both cards have ScrollReveal

### Visual Treatment

- Section background: gradient from #eef2f7 to white
- Professioneel header: navy dark background
- Professioneel body: #e7eef5 background, rounded-b-xl
- Op maat: navy dark background, wave-menu.webp background image (53% size, left bottom)
- Checkmarks: pink SVG throughout
- Shadow on Professioneel: subtle; shadow on Op maat: `0 20px 60px rgba(14,50,97,0.3)`

### Mobile (< 768px)

- Professioneel: 3-column grid collapses to 1-column stacked list
- Op maat: unchanged (already single column)

---

## Section 8: B2G — "Rijksuitgaven voor Overheden"

### Content

- **Badge:** "Nieuwe dienst" — navy dark background, white text, uppercase, 13px bold, rounded-md
- **Headline:** "Rijksuitgaven voor Overheden" — pink, large
- **Subhead:** "Werk aan vertrouwen. Bouw aan transparantie." — navy dark, 22-24px
- **Description:** "Rijksuitgaven voor Overheden maakt uw financiële data direct vergelijkbaar met die van andere mede-overheden en geeft uw volksvertegenwoordigers onbeperkt toegang tot rijksuitgaven.nl voor beter beleid en scherpe controle."
- **CTAs:** "Maak afspraak ›" (pink filled) + "Vraag brochure aan" (pink outlined)

**3 B2G feature blurbs:**
1. **"Gecertificeerde onboarding van uw financiële data"** — Icon: certificaat.png — "Rijksuitgaven voor Overheden helpt u om uw data op gestructureerde wijze aan te leveren en actueel te houden. Uw data is daardoor vergelijkbaar met andere mede-overheden."
2. **"Onbeperkte toegang voor ambtenaren en volksvertegenwoordigers"** — Icon: gemeenteraad.png — "Uw financiële medewerkers en de leden van uw Provinciale Staten of gemeenteraad krijgen onbeperkt toegang tot meer dan €1.700 miljard aan overheidsuitgaven in ruim 4.900 regelingen."
3. **"Snel inzicht en overzicht in overheidsuitgaven"** — Icon: filters.png — "Zoek en filter Financiële Instrumenten, Apparaatsuitgaven, Inkoopuitgaven, Provinciale en Gemeentelijke subsidies in seconden voor snel inzicht."

### Layout

- Max-width: 1080px, centered
- Text block: max-width 680px, left-aligned
- CTAs: row of 2 buttons, flex-wrap
- 3 blurb cards: 3-column grid (desktop), 1-column (mobile)
- Icon + text layout per blurb (icon left, text right)

### Visual Treatment

- Section background: #f8f9fb (subtle off-white)
- Padding: top 64px, bottom 80px (desktop); top 56px, bottom 64px (mobile)
- Headline: same scale as other section headlines (clamp 28-54px)
- Icons: 64px width, flex-shrink-0

### Animations

- ScrollReveal on text block + CTAs + each blurb

### Mobile (< 768px)

- Blurbs stack to 1-column
- CTAs stack or wrap naturally
- Icons remain at 64px

---

## Section 9: Contact — Demo Form

### Content

**Left column:**
- **Headline:** "Interesse? Vraag meteen een demo aan" — white, 30-36px bold
- **Body:** "Wilt u ook zien wat een schat aan financiële informatie u kunt ontsluiten met Rijksuitgaven? Vul dan het contactformulier in om een demo aan te vragen en wij nemen zo snel mogelijk contact met u op."
- **Phone line:** "Direct persoonlijk contact? Bel ons op **085-0806960**" (linked)

**Right column (form):**
- Voornaam * (required)
- Achternaam * (required)
- Uw zakelijke e-mail * (required)
- Op welk nummer kunnen wij u het beste bereiken? (optional)
- Privacy checkbox: "Ik ga akkoord met het privacy beleid en de voorwaarden."
- Submit: "Neem contact met mij op" (white button on pink)
- Footnote: "Wij reageren binnen 1 werkdag."

**Success state:** "Bedankt voor uw aanvraag!" + "Wij nemen zo snel mogelijk contact met u op." (in frosted glass card)
**Error state:** "Er ging iets mis. Probeer het later opnieuw of bel ons op 085-0806960."

### Layout

- id="aanmelden" (anchor for all "Boek een demo" links)
- Max-width: 1080px, centered
- 2-column grid on desktop (text left, form right)
- Gap: 40-64px between columns
- Padding: top 56px, bottom 80px (desktop); top 48px, bottom 64px (mobile)

### Visual Treatment

- Background: pink (#E62D75) — full-width
- Text: white
- Form inputs: white background, navy dark text, rounded-lg
- Submit button: white background, navy dark text, rounded-lg, shadow
- Privacy link: white underline
- Focus rings: white
- Success card: white at 0.15 opacity with backdrop-blur

### Interactions

- Form submission: POST /api/v1/contact (existing endpoint)
- Button state: "Verzenden..." while sending
- Success: form replaced by confirmation card
- Error: inline error message below form
- Phone link: tel: protocol

### Mobile (< 768px)

- 2-column collapses to stacked (text above, form below)
- Form inputs: full-width

---

## Copy Inventory (Dutch, formal u/uw)

### Section 1: Hero
| Element | Text |
|---------|------|
| Headline | Waar gaat €1.700 miljard naartoe? |
| Subline | Rijksuitgaven is hét onafhankelijke platform om overheidsuitgaven snel tot in detail te doorzoeken en vergelijken. |

### Section 2: H2 Widget
| Element | Text |
|---------|------|
| Eyebrow | PROBEER HET ZELF |
| Headline | Ontdek waar €1.700 miljard naartoe gaat |
| Subtext | Een professioneel abonnement geeft u toegang tot alle jaren en 6 databronnen |
| Search placeholder | Zoek bijv. "[animated]"... |
| Chips label | Probeer: |
| Chips | ProRail, Amsterdam, Universiteit, Rijksmuseum, Rode Kruis |
| Footer left | Bronnen: Rijksoverheid & medeoverheden |
| Footer right | Bekijk alle jaren en data → |
| 0 results | Geen resultaten voor "[query]" — probeer een andere zoekterm |
| Rate limited | U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw. |
| Clear button (a11y) | Zoekveld wissen |

### Section 3: Trust Bar
| Element | Text |
|---------|------|
| Metric 1 | 450.000+ ontvangers |
| Metric 2 | 9 jaar data |
| Metric 3 | €1.700+ mld aan uitgaven |

### Section 4: H3 Widget
| Element | Text |
|---------|------|
| Eyebrow | ONTDEKKING VAN DE WEEK |
| Headline | Verrassende inzichten uit de data |
| CTA per discovery | Bekijk de data → |
| Source prefix | Bron: |

### Section 5: Audience
| Element | Text |
|---------|------|
| Section label | GEBOUWD VOOR |
| Tab 1 | Raadsleden |
| Tab 1 title | Raadsleden en Statenleden |
| Tab 1 description | Vergelijk prestaties met de data van andere gemeenten en provincies, formuleer vragen en verbeter beleid. |
| Tab 2 | Politiek |
| Tab 2 title | Politieke partijen |
| Tab 2 description | Directe inzage in werkelijke realisatie van begrotingen, wetten en regelingen. |
| Tab 3 | Journalisten |
| Tab 3 title | Journalisten & onderzoekers |
| Tab 3 description | Krijg razendsnel toegang tot data om verhalen te ontdekken en impactvolle analyses te maken. |
| Tab 4 | Bedrijven |
| Tab 4 title | Bedrijven & non-profits |
| Tab 4 description | Vind kansen in subsidies en aanbestedingen en maak betere strategische keuzes. |
| Tab 5 | Academici |
| Tab 5 title | Academici & studenten |
| Tab 5 description | Gebruik betrouwbare data voor onderzoek en onderwijs over publieke financiën. |

### Section 6: Features
| Element | Text |
|---------|------|
| Headline | Het meest complete platform voor overheidsuitgaven |
| Subhead | Alles doorzoekbaar en vergelijkbaar. |
| Card 1 title | Alle uitgaven per ontvanger |
| Card 1 description | Bekijk per ontvanger uitgaven, regelingen en instrumenten, plus een handige link om snel verder te zoeken. |
| Card 2 title | Begroting in één oogopslag |
| Card 2 description | Bekijk het volledige begrotingsoverzicht en zie hoe het geld verdeeld wordt. |
| Card 3 title | Wie ontvangt het meest? |
| Card 3 description | Bekijk de top 50 ontvangers, instrumenten en artikelen op basis van uitgaven. Duik in de cijfers! |
| Checklist 1 | Altijd actuele cijfers dankzij regelmatige dataset-updates |
| Checklist 2 | Nieuwe databronnen, naast de Financiële Instrumenten ook apparaatskosten en meer |
| Checklist 3 | Slimme exportopties: Excel, CSV en kopiëren naar klembord |
| Checklist 4 | Feedback = impact — deel ideeën en beïnvloed nieuwe features |
| Checklist 5 | Integraal zoeken door alle data, voor volledige transparantie |
| CTA card headline | 463.000+ ontvangers doorzoekbaar in 6 databronnen |
| CTA card subtext | Van rijkssubsidies tot gemeentelijke uitgaven — alles in één platform. |
| CTA button | Boek een demo › |

### Section 7: Subscriptions
| Element | Text |
|---------|------|
| Headline | Onze abonnementen |
| Tier 1 name | Professioneel |
| Tier 1 subtitle | Onbeperkt toegang voor diepgaande inzichten en krachtige analyses |
| Tier 2 name | Op maat |
| Tier 2 description | Heeft u meerdere persoonlijke abonnementen nodig of heeft u voor uw organisatie specifieke wensen? Wij helpen u graag met een offerte op maat. |
| Tier 2 CTA | Neem contact op › |

### Section 8: B2G
| Element | Text |
|---------|------|
| Badge | Nieuwe dienst |
| Headline | Rijksuitgaven voor Overheden |
| Subhead | Werk aan vertrouwen. Bouw aan transparantie. |
| Description | Rijksuitgaven voor Overheden maakt uw financiële data direct vergelijkbaar met die van andere mede-overheden en geeft uw volksvertegenwoordigers onbeperkt toegang tot rijksuitgaven.nl voor beter beleid en scherpe controle. |
| CTA primary | Maak afspraak › |
| CTA secondary | Vraag brochure aan |

### Section 9: Contact
| Element | Text |
|---------|------|
| Headline | Interesse? Vraag meteen een demo aan |
| Body | Wilt u ook zien wat een schat aan financiële informatie u kunt ontsluiten met Rijksuitgaven? Vul dan het contactformulier in om een demo aan te vragen en wij nemen zo snel mogelijk contact met u op. |
| Phone intro | Direct persoonlijk contact? |
| Phone CTA | Bel ons op 085-0806960 |
| Form: Voornaam | Voornaam * |
| Form: Achternaam | Achternaam * |
| Form: Email | Uw zakelijke e-mail * |
| Form: Phone | Op welk nummer kunnen wij u het beste bereiken? |
| Form: GDPR | Ik ga akkoord met het privacy beleid en de voorwaarden. |
| Form: Submit | Neem contact met mij op |
| Form: Footnote | Wij reageren binnen 1 werkdag. |
| Success: Title | Bedankt voor uw aanvraag! |
| Success: Body | Wij nemen zo snel mogelijk contact met u op. |
| Error | Er ging iets mis. Probeer het later opnieuw of bel ons op 085-0806960. |

---

## Decisions Made

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
| 1 | Hero CTA removal | No "Probeer nu" button in hero | H2 widget directly below IS the try-it experience; button was a dead indirection |
| 2 | Hero alignment | Left-aligned (not centered) | Matches current homepage editorial feel; centered hero felt like a generic SaaS template |
| 3 | Hero simplification | Remove value prop icons + screenshot | H2 widget replaces screenshot; value props move to Features (section 6) to avoid repetition |
| 4 | H2 headline treatment | Navy text with pink €-amount accent | Better readability at large sizes vs. current all-pink hero headline; matches H2's existing treatment |
| 5 | Trust bar reduction | 3 metrics (from 4) | "Regelingen" is jargon; "databronnen" count not a differentiator; 3 numbers are cleaner |
| 6 | Trust bar style | Compact inline (H2 style) | Large number blocks (current) felt too heavy between two dark cards; compact keeps flow |
| 7 | H3 placement | Position 4 (after trust bar) | Creates a pattern: interact → proof → discover → relevance; two dark cards spaced by trust bar |
| 8 | Section background pattern | H2 on white, H3 on #f8f9fb | Dark cards need different backgrounds behind them to prevent monotony |
| 9 | Features reduction | 3 cards (from 6) | "Slim zoeken" demonstrated by H2 widget; "Ontdek bestedingen" by H3; "Wat is er nieuw?" low priority |
| 10 | Feature card selection | Detail, Begroting, Top50 | These show capabilities the widgets cannot demonstrate; they are the "there's more" tease |
| 11 | Checklist reduction | 5 items (from 6) | Removed "snelste stijgers en dalers" — not yet built, violates V1 scope honesty |
| 12 | Conversion CTA language | "Boek een demo ›" throughout | Consistent conversion action; "Probeer nu" reserved for H2 interaction invitation only |
| 13 | H2 as standalone component | Embedded via component import | H2 page.tsx is self-contained (inline styles, own keyframes); import without modification |
| 14 | H3 as standalone component | Embedded via component import | Same approach as H2 — extract to shared component, import into homepage |
| 15 | Section ordering | Hero→H2→Trust→H3→Audience→Features→Subs→B2G→Contact | Approved flow; interactive before explanatory; builds curiosity then resolves |
| 16 | No "Gratis proberen" button | Removed from page | "Gratis proberen" was in H2 standalone; H6 replaces it with "Boek een demo" (the real conversion) |
| 17 | B2G position | After subscriptions (section 8) | B2G is a separate audience; placed after individual pricing, before final contact |
| 18 | Contact form anchor | id="aanmelden" | All "Boek een demo" and "Neem contact op" buttons scroll to this anchor |
| 19 | Typography consistency | var(--font-body) for page, var(--font-condensed) for table only | Public homepage uses regular IBM Plex Sans; only the data table inside H2 uses Condensed |

---

## Mobile Strategy (< 768px)

### Global Changes
- All max-width containers become full-width with 24px horizontal padding
- Grid columns collapse to 1
- Font sizes use clamp() — already responsive
- Dark navy cards: horizontal padding reduces to 20px

### Section-Specific
| Section | Desktop | Mobile |
|---------|---------|--------|
| Hero | Left-aligned, generous padding-top 80px | Left-aligned, padding-top 56px |
| H2 Widget | 8-column table (Ontvanger + 6 years + 2024 + Totaal) | 3-column table (Ontvanger + 2024 + Totaal) — year columns hidden via CSS |
| Trust Bar | Single row with pipe separators | Wraps to 2 lines if needed |
| H3 Widget | Full card with arrows on sides | Arrows at card edges, smaller counter |
| Audience | 5 pills in single row | Pills wrap to 2-3 rows |
| Features | 3-column card grid | 1-column stack |
| Subscriptions | Professioneel 3-column feature grid | 1-column stacked list |
| B2G | 3-column blurb grid + CTAs in row | 1-column stack, CTAs wrap |
| Contact | 2-column (text + form) | Stacked (text above, form below) |

### Touch Considerations
- H3 carousel: swipe gestures for navigation (in addition to arrows)
- Audience tabs: touch-friendly 44px minimum tap targets
- All interactive elements: minimum 44x44px touch area
- No hover-only interactions — all hover effects are enhancements only

---

## Performance Notes

### Lazy Loading
- H2 widget: loaded eagerly (visible above the fold on most screens)
- H3 widget: lazy-loaded (below the fold; intersection observer triggers component mount)
- Feature card screenshots: `loading="lazy"` on all Image components
- B2G icons: `loading="lazy"`

### Animation Budget
- Total unique keyframe animations: 7 (h2FadeUp, h2RowFadeIn, h2Shimmer, pillFadeIn, audienceFadeIn, progressFill, countUp)
- ScrollReveal: uses IntersectionObserver (fires once, disconnects after), CSS transitions only — no JS animation loop
- H3 counter countUp: requestAnimationFrame with 1.2s duration, runs once
- H2 typing placeholder: setTimeout chain (lightweight, no rAF)
- `prefers-reduced-motion: reduce` — all animations should respect this media query (disable transforms, use opacity-only transitions)

### API Calls
- H2 search: only on user interaction (typing or chip click), 200ms debounce, max 10 results
- H3 data: static (23 discoveries baked into component, no API call)
- Contact form: single POST on submit
- No API calls on initial page load

### Bundle Size Considerations
- H2 + H3 components use inline styles (no external CSS to load)
- No external animation libraries (no Framer Motion, no GSAP)
- SVG icons inline (no icon font)
- Images: Next.js Image component with automatic WebP/AVIF optimization and srcset

### Critical Path
- Above-the-fold content (Hero + H2 widget header): no API dependency, renders immediately
- H2 table default rows: hardcoded data, renders without waiting for any fetch
- Fonts: IBM Plex Sans loaded via Google Fonts with `display: swap`

---

## Implementation Notes

### Component Architecture

```
public-homepage.tsx (orchestrator)
  ├── HeroSection (inline)
  ├── ProbeerHetZelfWidget (extracted from h2/page.tsx)
  │   └── Includes: search input, chips, table, footer
  ├── TrustBar (inline, simplified)
  ├── OntdekkingVanDeWeekWidget (new H3 component)
  │   └── Includes: counter, editorial text, sharing, carousel
  ├── AudienceSection (existing, unchanged)
  ├── FeaturesSection (existing, reduced to 3 cards)
  ├── SubscriptionSection (existing, unchanged)
  ├── B2GSection (existing, unchanged)
  └── ContactSection (existing, unchanged)
```

### Extraction Steps
1. Extract H2 from `app/src/app/h2/page.tsx` into `components/homepage/probeer-het-zelf.tsx` — remove the standalone page wrapper (background gradient, standalone hero, standalone bottom CTA), keep the dark card and everything inside it
2. Build H3 as `components/homepage/ontdekking-van-de-week.tsx` — new component with the discovery data and carousel logic
3. Modify `public-homepage.tsx` — replace HeroSection + TrustBar + screenshot with new section flow
4. Remove the standalone `h2/page.tsx` route (or redirect to homepage)

### CSS Keyframes
All keyframes currently defined as inline `<style>` in H2. For H6, consolidate into a single `<style>` block at the bottom of the homepage component, or move to globals.css if reused elsewhere.

---

## Files Affected

| File | Action |
|------|--------|
| `app/src/components/homepage/public-homepage.tsx` | Major rewrite — new section flow, integrate H2/H3 |
| `app/src/components/homepage/probeer-het-zelf.tsx` | NEW — extracted H2 widget component |
| `app/src/components/homepage/ontdekking-van-de-week.tsx` | NEW — H3 discovery carousel component |
| `app/src/app/h2/page.tsx` | Remove or redirect (functionality moves to homepage) |
| `app/src/app/api/v1/public/search/route.ts` | Unchanged (already serves H2 widget) |
| `backend/app/api/v1/public.py` | Unchanged (already serves H2 widget) |
