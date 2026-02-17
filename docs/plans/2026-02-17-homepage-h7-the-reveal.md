# Homepage H7: The Reveal

**Date:** 2026-02-17
**Status:** Design specification
**Concept team:** Sofia (Conversion Designer), Daan (Data Table Specialist), Lena (Visual Designer), Kai (Information Architect), Viktor (Adversarial Reviewer)

---

## 1. Concept Manifesto

Every SaaS homepage in existence follows the same tired script: hero headline, subheadline, screenshot, features, pricing, contact form. The visitor reads _about_ the product before ever touching it. H7 inverts this entirely. The moment a visitor lands, they are already inside the product. The hero is not an image of a search box -- it _is_ the search box, backed by 463,731 real recipients and nine years of government spending data. The dark navy container that dominates the viewport is not a decorative block; it is the same visual language the logged-in product uses. "Waar gaat 1.700 miljard naartoe?" is not a rhetorical question -- it is an invitation to type and find out. The page earns the right to sell only after the visitor has already experienced the "aha moment." By the time they reach the pricing section, they are no longer prospects wondering what the product does. They are people who have seen their own municipality, their own university, their own curiosity reflected back as real numbers. The page says: _we have the data, come explore._ Everything after the first scroll exists to close what the data already opened.

---

## 2. Section-by-Section Specification

### 2.0 Sticky Header (persistent)

**Purpose:** Navigation safety net. Always visible. The only white element above the fold.

**Content:**
- Left: Rijksuitgaven logo (full wordmark on desktop, icon on mobile)
- Right: Phone number (desktop only), "Boek een demo" (pink CTA), "Login" (outline button)

**Layout:**
- Sticky `top: 0`, `z-index: 40`
- Height: 80px desktop, 64px mobile
- `max-width: 1080px` centered content
- White background at 95% opacity with `backdrop-blur-sm`
- Bottom border: 1px `var(--gray-light)`

**Visual treatment:**
- Identical to current `PublicHeader` in `public-homepage.tsx`
- Logo: `h-14 w-auto` desktop, `h-12 w-12` mobile (icon only)
- "Boek een demo": `bg-[var(--pink)]`, white text, 15px bold, rounded-lg
- "Login": pink text, pink border, white background, rounded-lg

**Interactions:**
- Logo hover: `scale-[1.02]` transition
- CTA hover: darker pink (`var(--pink-hover)`), shadow lift
- Phone hover: navy-dark text color shift

**Mobile adaptations:**
- Phone number hidden below `lg` (1024px)
- Logo switches to icon-only below `sm` (640px)
- Both CTAs remain visible; gap shrinks to `gap-2`

**Decisions:**
- Viktor's recommendation: keep the header to prevent disorientation for less tech-savvy audiences (raadsleden, journalisten). The hero darkness makes navigation critical.
- No hamburger menu. Two actions + logo is sufficient for a single-page conversion funnel.

---

### 2.1 The Reveal -- Full-Width Dark Navy Hero

**Purpose:** The visitor lands directly into data. No white hero. No explanation. Search first.

**Content (top to bottom inside the dark block):**

1. **Headline:** "Waar gaat **€1.700 miljard** naartoe?"
   - Full text: `Waar gaat €1.700 miljard naartoe?`
   - "€1.700 miljard" rendered in pink `var(--pink, #E62D75)`
   - Remaining text in white

2. **Subline:** "Doorzoek 450.000+ ontvangers van overheidsgeld — direct en zonder account"
   - White text at 85% opacity

3. **Search input:** Animated placeholder cycling through "ProRail", "Gemeente Amsterdam", "Rijksmuseum", "Universiteit", "Rode Kruis"
   - White background (95% opacity), pink focus ring
   - Search icon left, clear button right

4. **Quick-search chips:** "Probeer:" label + ProRail, Amsterdam, Universiteit, Rijksmuseum, Rode Kruis
   - Glass-like: `rgba(255,255,255,0.08)` background, `rgba(255,255,255,0.12)` border

5. **White inset data table:** 10 rows of real recipients
   - Columns: Ontvanger | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | Totaal
   - 2018--2023: redacted navy bars (gated content signal)
   - 2024 + Totaal: real formatted euro amounts
   - Default state: 10 curated hardcoded recipients (no API call)
   - Search state: live API results from 463,731 recipients via Typesense

6. **Footer row inside dark card:**
   - Left: "Bronnen: Rijksoverheid & medeoverheden" (condensed, 12px, white at 35%)
   - Right: "Bekijk alle jaren en data →" (14px, 600 weight, white, turns pink on hover)

7. **Trust indicators (inside dark card, below footer):**
   - Three items inline: `450.000+ ontvangers` · `9 jaar data` · `€1.700+ mld aan uitgaven`
   - White text at 55% opacity, medium weight
   - Dot separators, centered

**Layout:**
- Full-width dark background extending edge to edge
- Content constrained to `max-width: 1100px`, centered
- No border-radius on the dark block itself (full-bleed hero)
- Inner content padding: `48px 32px 40px`
- Search input max-width: 600px, centered
- Table white inset: 12px border-radius, `inset 0 1px 3px rgba(0,0,0,0.06)` shadow

**Visual treatment:**
- Background: `var(--navy-dark, #0E3261)`
- Noise texture overlay: inline SVG `feTurbulence fractalNoise`, 0.035 opacity, `mix-blend-mode: overlay`
- Grid pattern: 40px cells, `rgba(255,255,255,0.015)` lines
- Pink left accent bar: 3px wide, gradient `transparent → var(--pink) → transparent`, 40% opacity
- Radial gradient: `ellipse 80% 60% at 80% 20%, rgba(141,186,220,0.08)`
- No box-shadow on the outer container (full-bleed has no edges)

**Headline typography:**
- Font: `var(--font-body)` (IBM Plex Sans)
- Size: `clamp(36px, 6vw, 64px)`
- Weight: 700
- Line-height: 1.05
- Letter-spacing: -0.02em
- Text centered
- `text-wrap: balance`

**Subline typography:**
- Font: `var(--font-body)`
- Size: `clamp(16px, 2vw, 20px)`
- Weight: 400
- Color: `rgba(255,255,255,0.85)`
- Max-width: 640px, centered
- Margin-top: 16px

**Animations:**
- Headline: `h2FadeUp` 0.6s ease-out, 0.1s delay
- Subline: `h2FadeUp` 0.7s ease-out, 0.25s delay
- Search input: `h2FadeUp` 0.7s ease-out, 0.4s delay
- Chips: `h2FadeUp` 0.5s ease-out, 0.6s delay
- Table rows: staggered `h2RowFadeIn` with 30ms per row
- All use `translateY(20px) → 0` with `opacity 0 → 1`

**Interactions:**
- Search: 200ms debounce, live API results
- Chips: click fills search input and triggers API
- Table row hover: subtle `#F8FAFD` background
- Footer CTA hover: text turns pink, arrow slides right 4px
- Rate limit: inline message in table area

**Mobile adaptations (< 768px):**
- Headline: `clamp(32px, 6vw, 64px)` naturally scales down
- Year columns 2018--2023 hidden (CSS class `.h2-year-col { display: none }`)
- Table shows 3 columns: Ontvanger | 2024 | Totaal
- Table `min-width` override to prevent horizontal scroll
- Padding: `32px 20px 28px`
- Trust indicators stack to 2 lines if needed, centered
- Chips wrap naturally with `flex-wrap`

**Difference from H6:**
H6 had a white hero with pink headline, followed by a product screenshot in a browser frame. The hero was descriptive text. H7 eliminates the white hero entirely. The first pixel below the sticky header is dark navy. The headline lives _inside_ the data environment. There is no screenshot because the visitor is looking at the real product.

---

### 2.2 Ontdekking van de Week -- H3 Widget

**Purpose:** Secondary hook. After the visitor has tried the search, this section offers editorial surprise. Returning visitors see something new.

**Content:**
- Section label: "Ontdekking van de Week" -- small eyebrow above the card
- 23 verified discoveries rotating in a carousel
- Each discovery shows:
  - Animated count-up number (pink, large)
  - One-sentence editorial insight (white)
  - Source attribution (white at 40%)
  - "Ontdek meer →" CTA linking to relevant module
  - Social share buttons: LinkedIn, X, Bluesky (top right)

**Copy:**

Eyebrow above the card:
```
Ontdekking van de Week
```

Example discoveries (from H3 data):
```
€13,1 miljard
TenneT Holding ontving €13,1 miljard in 2024 voor het stroomnet — 8x meer dan een jaar eerder.
Bron: Financiële Instrumenten, 2024

€1,1 miljard
Eén bedrijf — RMA Healthcare — ontving meer dan €1 miljard van het COA.
Bron: Publiek (COA), 2018–2024
```

**Layout:**
- Max-width: 1000px, centered
- Section padding: `pt-16 md:pt-24 pb-16 md:pb-20`
- Eyebrow: centered, 13px, pink, uppercase, `letter-spacing: 0.1em`, 600 weight
- Card: full content width, 16px border-radius, min-height 380px
- Card internal padding: `3rem 3.5rem`

**Visual treatment:**
- Identical dark navy container style as hero (noise, grid, gradient, pink accent bar)
- `box-shadow: 0 4px 24px rgba(14,50,97,0.18), 0 1px 3px rgba(14,50,97,0.08)`
- Number: `clamp(3.5rem, 8vw, 6rem)`, 700 weight, pink, tabular-nums
- Insight text: `clamp(1.05rem, 2vw, 1.35rem)`, 400 weight, white
- Share buttons: glass-like squares, white at 50% opacity, 8px border-radius

**Animations:**
- Auto-rotate every 5 seconds, pauses on hover
- Cards crossfade with `translateY(12px)` enter, `translateY(-12px)` exit
- 0.7s `cubic-bezier(0.2,1,0.2,1)` spring easing
- Count-up animation: 1.4s, cubic ease-out, triggered on card becoming active
- `ScrollReveal` entrance when scrolled into view

**Interactions:**
- Hover on card: pauses auto-rotation
- "Ontdek meer →" button: pink background, links to module page
- Share buttons: open social platform share dialogs in new tab
- Number animates from 0 to target value on each card transition

**Mobile adaptations:**
- Card padding reduces to `2rem 1.5rem`
- Share buttons move below the CTA row (stacked)
- Number font size naturally scales via `clamp`
- Min-height reduces to 320px

---

### 2.3 The Product -- "Zoek. Vergelijk. Exporteer."

**Purpose:** Brief product capability summary. Not a feature dump. Three verbs, three columns, three micro-animations. This replaces the 6 feature cards from H6.

**Content:**

Section headline:
```
Het meest complete platform voor overheidsuitgaven
```

Subheadline:
```
Alles doorzoekbaar en vergelijkbaar.
```

Three columns:

**Column 1: Zoek**
```
Zoek
Vind iedere ontvanger, regeling of instrument in seconden.
Slim zoeken met autocomplete over 450.000+ ontvangers.
```

**Column 2: Vergelijk**
```
Vergelijk
Bekijk 9 jaar uitgaven naast elkaar en signaleer trends.
Per ontvanger, per regeling, per bron — alles in één overzicht.
```

**Column 3: Exporteer**
```
Exporteer
Download resultaten als Excel of CSV voor uw eigen analyses.
Klik, selecteer en exporteer — klaar in 3 stappen.
```

**Layout:**
- White background section
- Max-width: 1080px, centered
- Section padding: `pt-16 md:pt-24 pb-16 md:pb-20`
- Headline: left-aligned, pink, same style as H6 Features headline
- Three columns: `grid md:grid-cols-3 gap-8 md:gap-12`
- Each column: icon area (48px) + verb title + 2-line description

**Visual treatment:**
- Background: white with subtle gradient to `#f8f9fb` at bottom
- Verb title: 24px, 700 weight, navy-dark
- Description: 15px, 400 weight, navy-dark at 70% opacity
- Each column top: a minimal line icon (search magnifier, bar chart, download arrow) in navy-medium, 48px

**Animations:**
- `ScrollReveal` on each column with staggered timing
- Icon: subtle `scale(0.95) → scale(1)` on reveal
- Optional micro-interaction: on hover, icon shifts to pink for 200ms

**Interactions:**
- Columns are not clickable (no link targets)
- Icon hover: color transition from navy-medium to pink

**Mobile adaptations:**
- Single column stack
- 24px gap between items
- Icons inline-left of text (same layout as H6 ValueProp components)

---

### 2.4 Audience -- "Gebouwd voor"

**Purpose:** Show visitors they belong here. Five audience tabs with auto-rotation.

**Content:**

Section label:
```
Gebouwd voor
```

Five tabs (pill buttons, auto-rotating):

**Tab 1: Raadsleden**
```
Raadsleden en Statenleden
Vergelijk prestaties met de data van andere gemeenten en provincies, formuleer vragen en verbeter beleid.
```

**Tab 2: Politiek**
```
Politieke partijen
Directe inzage in werkelijke realisatie van begrotingen, wetten en regelingen.
```

**Tab 3: Journalisten**
```
Journalisten & onderzoekers
Krijg razendsnel toegang tot data om verhalen te ontdekken en impactvolle analyses te maken.
```

**Tab 4: Bedrijven**
```
Bedrijven & non-profits
Vind kansen in subsidies en aanbestedingen en maak betere strategische keuzes.
```

**Tab 5: Academici**
```
Academici & studenten
Gebruik betrouwbare data voor onderzoek en onderwijs over publieke financiën.
```

**Layout:**
- White background
- Max-width: 1080px, centered
- Section padding: `py-12 md:py-16`
- Tab bar: centered row of pill buttons with flex-wrap
- Description area: centered, max-width 560px, min-height 80px
- Progress bar: 5 dots below description, active dot wider (32px vs 16px)

**Visual treatment:**
- Identical to current H6 `AudienceSection` implementation
- Active tab: navy-dark background, white text, `pillFadeIn` animation
- Inactive tabs: 70% opacity navy text, hover lightens
- Description crossfade: `audienceFadeIn 350ms ease-out`
- Progress bar: pink fill on active dot, 5s linear fill animation

**Animations:**
- Auto-advance every 5 seconds
- Pause on hover of tab bar or description
- `pillFadeIn`: pill background fade-in 250ms
- `audienceFadeIn`: text crossfade 350ms
- `progressFill`: linear 5s fill for timing indicator

**Interactions:**
- Click any tab to switch immediately
- Hover pauses auto-rotation
- Each tab has icon (Heroicons outline) + label

**Mobile adaptations:**
- Pills wrap to 2 rows naturally
- Description text remains centered
- Gap between pills: 2px instead of 1.5px
- Progress dots remain

---

### 2.5 Social Proof / Trust -- "De cijfers"

**Purpose:** Credibility through numbers. Data authority. Source attribution.

**Content:**

Section headline:
```
De cijfers
```

Four metrics in a horizontal row:

```
€1.700+ mld          4.900+              9                 6
aan uitgaven          regelingen          begrotingsjaren   databronnen
```

Below the metrics:
```
Bronnen: Rijksoverheid, provincies en gemeenten
```

**Layout:**
- White background, border-top and border-bottom: 1px `var(--gray-light)`
- Max-width: 1080px, centered
- Section padding: `py-8 md:py-12`
- Metrics: flex row, centered, gap 8--14 between items
- Each metric: number (large, bold) above label (small, uppercase, muted)
- Source line: centered, 13px, navy-medium at 50%

**Visual treatment:**
- Numbers: 26--32px, 700 weight, navy-dark, `font-heading`
- Labels: 13px, uppercase, letter-spacing 0.15em, navy-medium
- Clean, minimal -- no backgrounds, no cards, just type

**Animations:**
- `ScrollReveal` with `.scroll-reveal-scale` variant (compact elements)
- Numbers could optionally count-up on first view (low priority)

**Interactions:**
- None. Pure trust signal.

**Mobile adaptations:**
- 2x2 grid instead of 4-column row
- Centered within each cell
- Gap: 24px vertical, 32px horizontal

---

### 2.6 Pricing + CTA -- Combined Conversion Section

**Purpose:** Remove the gap between "what does it cost?" and "how do I start?" Combine pricing cards with the demo request form.

**Content:**

Section headline:
```
Onze abonnementen
```

**Card 1: Professioneel**

Header bar: navy-dark background, "Professioneel" white centered text

Subheadline:
```
Onbeperkt toegang voor diepgaande inzichten en krachtige analyses
```

Three feature columns (identical to current H6):

Column 1 -- Features:
```
- Slim zoeken op ontvanger
- Uitgebreid zoeken met filters
- Alle details per ontvanger
- Grafieken
- Begroting in één oogopslag
- Top ontvangers, regelingen en meer
```

Column 2 -- Data:
```
- Financiële Instrumenten (2016–2024)
- Apparaatsuitgaven (2016–2024)
- Provinciale subsidieregisters (2018–2024)
- Gemeentelijke subsidieregisters
- Inkoopuitgaven (2017–2023)
```

Column 3 -- Benefits:
```
- Ontdek verrassende uitgaven
- Snel vergelijken van data
- Onbeperkte zoekopdrachten
- Slimme exportopties naar Excel en CSV
- Deel en beïnvloed nieuwe features
- En nog heel veel meer
```

CTA below features:
```
Boek een demo →
```

**Card 2: Op maat**

Navy-dark background card with wave background image:

Headline:
```
Op maat
```

Description:
```
Heeft u meerdere persoonlijke abonnementen nodig of heeft u voor uw organisatie specifieke wensen? Wij helpen u graag met een offerte op maat.
```

Features:
```
- Geselecteerde datasets
- Maatwerkrapportages en geavanceerde analyses
- Persoonlijk advies
- Trainingen en exclusieve sessies voor uw team
```

CTA:
```
Neem contact op →
```

**Layout:**
- Gradient background: `from-[#eef2f7] to-white`
- Max-width: 1080px, centered
- Section padding: `pt-12 md:pt-16 pb-16 md:pb-24`
- Professioneel card: full-width, rounded-xl, shadow
- Op maat card: full-width, navy background, rounded-xl, heavier shadow, 5px margin-top

**Visual treatment:**
- Identical to current H6 `SubscriptionSection`
- Professioneel header: navy-dark, white text, centered
- Feature columns: 3-column grid on desktop, pink checkmarks
- "Boek een demo" CTA: pink background, white text, centered below columns
- Op maat: wave-menu.webp background image (left bottom, 53% size)

**Interactions:**
- "Boek een demo" links to `#aanmelden` (contact form below)
- "Neem contact op" links to `#aanmelden`
- CTA hover: darker pink, shadow increase, 2px lift

**Mobile adaptations:**
- Feature columns stack to single column
- Op maat: background image may be less visible but is decorative only

---

### 2.7 B2G -- "Rijksuitgaven voor Overheden"

**Purpose:** Separate pitch for government buyers. Different conversion path (brochure + appointment).

**Content:**

Badge:
```
Nieuwe dienst
```

Headline:
```
Rijksuitgaven voor Overheden
```

Subheadline:
```
Werk aan vertrouwen. Bouw aan transparantie.
```

Description:
```
Rijksuitgaven voor Overheden maakt uw financiële data direct vergelijkbaar met die van andere mede-overheden en geeft uw volksvertegenwoordigers onbeperkt toegang tot rijksuitgaven.nl voor beter beleid en scherpe controle.
```

Two CTAs:
```
Maak afspraak →
Vraag brochure aan
```

Three feature blurbs:

**Blurb 1:**
```
Gecertificeerde onboarding van uw financiële data
Rijksuitgaven voor Overheden helpt u om uw data op gestructureerde wijze aan te leveren en actueel te houden. Uw data is daardoor vergelijkbaar met andere mede-overheden.
```

**Blurb 2:**
```
Onbeperkte toegang voor ambtenaren en volksvertegenwoordigers
Uw financiële medewerkers en de leden van uw Provinciale Staten of gemeenteraad krijgen onbeperkt toegang tot meer dan €1.700 miljard aan overheidsuitgaven in ruim 4.900 regelingen.
```

**Blurb 3:**
```
Snel inzicht en overzicht in overheidsuitgaven
Zoek en filter Financiële Instrumenten, Apparaatsuitgaven, Inkoopuitgaven, Provinciale en Gemeentelijke subsidies in seconden voor snel inzicht.
```

**Layout:**
- Off-white background: `#f8f9fb`
- Max-width: 1080px, centered
- Section padding: `pt-16 md:pt-24 pb-16 md:pb-20`
- Text block: max-width 680px, left-aligned
- CTAs: row with flex-wrap, gap-3
- Blurbs: 3-column grid, icon + text, margin-top 48--64px

**Visual treatment:**
- "Nieuwe dienst" badge: navy-dark background, white text, uppercase 13px, rounded-md
- Headline: pink, 32--54px, bold, balanced
- Subheadline: navy-dark, 22--24px
- Description: navy-dark at 80%, 18--20px
- Primary CTA: pink background, white text
- Secondary CTA: pink border, pink text, fills pink on hover
- Blurb icons: 64px wide, custom illustrations (certificaat.png, gemeenteraad.png, filters.png)

**Animations:**
- `ScrollReveal` on text block, CTAs, and each blurb (staggered)

**Interactions:**
- Both CTAs link to `#aanmelden`
- CTA hover: standard pink hover states

**Mobile adaptations:**
- CTAs stack vertically (full width)
- Blurbs single column with 32px gap
- Icons: 56px wide

---

### 2.8 Contact Form -- Demo Request

**Purpose:** Final conversion point. Demo request form that all CTAs anchor to.

**Content:**

Left column headline:
```
Interesse? Vraag meteen een demo aan
```

Left column description:
```
Wilt u ook zien wat een schat aan financiële informatie u kunt ontsluiten met Rijksuitgaven? Vul dan het contactformulier in om een demo aan te vragen en wij nemen zo snel mogelijk contact met u op.
```

Phone callout:
```
Direct persoonlijk contact?
Bel ons op 085-0806960.
```

Right column -- form fields:
```
Voornaam *
Achternaam *
Uw zakelijke e-mail *
Op welk nummer kunnen wij u het beste bereiken?
☐ Ik ga akkoord met het privacy beleid en de voorwaarden.
[Neem contact met mij op]
Wij reageren binnen 1 werkdag.
```

Success state:
```
Bedankt voor uw aanvraag!
Wij nemen zo snel mogelijk contact met u op.
```

Error state:
```
Er ging iets mis. Probeer het later opnieuw of bel ons op 085-0806960.
```

**Layout:**
- Pink background: `var(--pink)`
- Max-width: 1080px, centered
- Section padding: `pt-14 md:pt-20 pb-16 md:pb-20`
- 2-column grid: text left, form right (md:grid-cols-2 gap-10 md:gap-16)
- `id="aanmelden"` for anchor navigation

**Visual treatment:**
- Identical to current H6 `ContactSection`
- Left text: white, bold headline 30--36px
- Description: white at 90%, 18--20px
- Phone number: white, underlined, semibold, removes underline on hover
- Form inputs: white background, rounded-lg, 15px text
- Submit button: white background, navy-dark text, full width
- GDPR checkbox: white text at 85%, links to /privacybeleid
- Success: white/15% background, blur, centered checkmark icon
- "Wij reageren binnen 1 werkdag": 13px, white at 70%, centered

**Interactions:**
- Form submission: POST to `/api/v1/contact`
- Loading state: "Verzenden..." with disabled button
- Success state: form replaced with confirmation
- Error state: inline message below button
- Analytics: error tracking on failure

**Mobile adaptations:**
- Single column: text stacks above form
- Gap reduces to 32px
- Inputs and button remain full width

---

## 3. The Dark-First Philosophy

### How H7 differs from H6

H6 (current production homepage) follows a conventional structure:

1. **White hero** with pink headline, description text, value props, product screenshot
2. **Trust bar** (numbers on white background)
3. **Audience tabs** (white section)
4. **Features** (off-white gradient with 6 screenshot cards)
5. **Pricing** (off-white to white gradient)
6. **B2G** (off-white section)
7. **Contact** (pink section)

The page reads top-down as: white, white, white, off-white, off-white, off-white, pink. The first impression is corporate-clean but unremarkable. The visitor must scroll past approximately 900px of text and a static screenshot before encountering any interactive element.

H7 inverts this:

1. **Dark navy hero** with live search table (the product itself)
2. **Dark navy discovery card** (editorial data stories)
3. **White product summary** (brief, not exhaustive)
4. **White audience tabs** (unchanged)
5. **White trust bar** (simplified)
6. **Off-white pricing + CTAs** (combined)
7. **Off-white B2G** (unchanged)
8. **Pink contact form** (unchanged)

The first 100vh is dominated by dark navy. The visitor sees: dark → dark → white → white → white → off-white → off-white → pink. The dark blocks at the top create a dramatically different first impression -- authoritative, data-centric, Bloomberg-editorial. The transition from dark to white occurs _after_ the visitor has interacted with data, creating a natural reading break that says "now let us tell you more."

### The visual contract

Dark navy = **data environment.** The H2 search table and H3 discovery card both use the same visual language: noise texture, grid pattern, pink accent bar. When the visitor encounters these blocks, they understand instinctively that they are looking at the product, not marketing material.

White = **information environment.** Feature descriptions, audience tabs, pricing, and B2G are explanatory. They use white backgrounds to signal a shift from "experience" to "learn."

Pink = **conversion environment.** The contact form is the only pink section. It is the final destination.

This three-tone hierarchy (navy → white → pink) gives the page a clear narrative arc: **interact → understand → act.**

---

## 4. Copy Inventory

### Dutch headlines (all formal u/uw)

| Section | Element | Text |
|---------|---------|------|
| 2.1 Hero | Headline | Waar gaat **€1.700 miljard** naartoe? |
| 2.1 Hero | Subline | Doorzoek 450.000+ ontvangers van overheidsgeld — direct en zonder account |
| 2.1 Hero | Search placeholder | Zoek bijv. "[animatie]"... |
| 2.1 Hero | Chips label | Probeer: |
| 2.1 Hero | Footer left | Bronnen: Rijksoverheid & medeoverheden |
| 2.1 Hero | Footer right | Bekijk alle jaren en data → |
| 2.1 Hero | Trust line | 450.000+ ontvangers · 9 jaar data · €1.700+ mld aan uitgaven |
| 2.1 Hero | Empty state | Geen resultaten voor "[query]" — probeer een andere zoekterm |
| 2.1 Hero | Rate limit | U heeft het maximale aantal zoekopdrachten bereikt. Probeer het over een minuut opnieuw. |
| 2.2 Ontdekking | Eyebrow | Ontdekking van de Week |
| 2.2 Ontdekking | CTA | Ontdek meer → |
| 2.3 Product | Headline | Het meest complete platform voor overheidsuitgaven |
| 2.3 Product | Subheadline | Alles doorzoekbaar en vergelijkbaar. |
| 2.3 Product | Verb 1 | Zoek |
| 2.3 Product | Desc 1 | Vind iedere ontvanger, regeling of instrument in seconden. Slim zoeken met autocomplete over 450.000+ ontvangers. |
| 2.3 Product | Verb 2 | Vergelijk |
| 2.3 Product | Desc 2 | Bekijk 9 jaar uitgaven naast elkaar en signaleer trends. Per ontvanger, per regeling, per bron — alles in één overzicht. |
| 2.3 Product | Verb 3 | Exporteer |
| 2.3 Product | Desc 3 | Download resultaten als Excel of CSV voor uw eigen analyses. Klik, selecteer en exporteer — klaar in 3 stappen. |
| 2.4 Audience | Label | Gebouwd voor |
| 2.4 Audience | Tab labels | Raadsleden, Politiek, Journalisten, Bedrijven, Academici |
| 2.5 Trust | Headline | De cijfers |
| 2.5 Trust | Source | Bronnen: Rijksoverheid, provincies en gemeenten |
| 2.6 Pricing | Headline | Onze abonnementen |
| 2.6 Pricing | CTA 1 | Boek een demo → |
| 2.6 Pricing | Card 2 title | Op maat |
| 2.6 Pricing | Card 2 CTA | Neem contact op → |
| 2.7 B2G | Badge | Nieuwe dienst |
| 2.7 B2G | Headline | Rijksuitgaven voor Overheden |
| 2.7 B2G | Subheadline | Werk aan vertrouwen. Bouw aan transparantie. |
| 2.7 B2G | CTA 1 | Maak afspraak → |
| 2.7 B2G | CTA 2 | Vraag brochure aan |
| 2.8 Contact | Headline | Interesse? Vraag meteen een demo aan |
| 2.8 Contact | Submit | Neem contact met mij op |
| 2.8 Contact | Success | Bedankt voor uw aanvraag! |
| 2.8 Contact | Timeline | Wij reageren binnen 1 werkdag. |
| Header | CTA | Boek een demo |
| Header | Login | Login |

### Copy preservation from H6

| H6 original | H7 usage | Change |
|-------------|----------|--------|
| "Waar gaat €1.700 miljard naartoe?" | Hero headline inside dark block | Moved from white to dark; now white+pink on navy |
| "hét onafhankelijke platform" | Dropped from hero; implicit via data demonstration | The search itself proves independence |
| "doorzoeken en vergelijken" | Hero subline: "Doorzoek 450.000+ ontvangers..." | Verb form preserved, made concrete |
| "Het meest complete platform" | Section 2.3 headline (unchanged) | Preserved verbatim |
| 5 audience descriptions | Section 2.4 (unchanged) | Preserved verbatim |
| "Werk aan vertrouwen. Bouw aan transparantie." | Section 2.7 subheadline (unchanged) | Preserved verbatim |
| Contact form | Section 2.8 (unchanged) | Preserved verbatim |

---

## 5. Decisions Made

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Hero treatment | Full-bleed dark navy, no border-radius | H7 is about immersion; rounded corners create separation |
| Headline position | Inside dark block, white+pink on navy | The question lives in the data environment, not above it |
| "Probeer nu" CTA | Removed from hero | The search input IS the "try it" action; a button is redundant |
| "Boek een demo" placement | Header only + pricing section + B2G | Conversion CTA stays accessible but doesn't compete with search interaction |
| H2 widget integration | Expanded to full-width hero | No separate widget embedding; the hero IS the widget |
| H3 widget integration | Standalone dark card section below hero | Maintains its own visual identity; two dark blocks in sequence are intentional |
| Two dark sections in sequence | Acceptable | The transition between hero (interactive) and discovery (editorial) provides enough content contrast despite same visual treatment |
| Feature cards count | 3 verbs replace 6 screenshots | The visitor already saw the real product; screenshots are redundant |
| Product screenshot | Removed entirely | The live table replaces the static screenshot; showing a screenshot after interacting with real data would be a step backward |
| Trust bar position | Inside hero dark block | Anchoring trust data near the search results reinforces credibility at the moment of interaction |
| Separate trust section | Also kept as Section 2.5 | Belt and suspenders; repeated metrics reinforce at different scroll depths |
| Contact form background | Pink (unchanged) | Creates clear visual break for final conversion environment |
| Value props (3 blurbs) | Replaced by Zoek/Vergelijk/Exporteer | Value props were outcome-oriented; the new verbs are action-oriented, matching H7's "do it" personality |
| 6 feature screenshot cards | Removed | Replaced by 3-verb summary; the interactive hero demonstrates features better than screenshots |
| Extra features checklist | Moved into pricing card features | Consolidating "what you get" into one location reduces scroll length |
| Auto-rotation (discovery) | 5 seconds, pause on hover | Matches existing H3 behavior; tested and proven |
| Mobile year columns | Hidden (Ontvanger + 2024 + Totaal only) | Consistent with H2 spec; 3 columns fit mobile width |
| Anti-scraping | Progressive rate limit + query cost + fingerprint | Already specified in H2 doc; no change for H7 |

---

## 6. Mobile Strategy (< 768px)

### What changes

| Element | Desktop | Mobile |
|---------|---------|--------|
| Header height | 80px | 64px |
| Header phone number | Visible | Hidden |
| Header logo | Full wordmark | Icon only (< 640px) |
| Hero headline | clamp to 64px max | clamp to 36px min |
| Hero padding | 48px 32px | 32px 20px |
| Table columns | 9 (Ontvanger + 6 years + 2024 + Totaal) | 3 (Ontvanger + 2024 + Totaal) |
| Table horizontal scroll | Enabled | Disabled (min-width override) |
| Quick-search chips | Single row | Wrap to 2 rows |
| Discovery card padding | 3.5rem | 1.5rem |
| Discovery share buttons | Top right of card | Below CTA row |
| Product section | 3-column grid | Single column stack |
| Audience tabs | Single row | Wrap to 2 rows |
| Trust metrics | 4-column row | 2x2 grid |
| Pricing feature columns | 3-column grid | Single column |
| B2G blurbs | 3-column grid | Single column |
| Contact form | 2-column (text + form) | Single column (text above form) |

### What does NOT change

- All copy remains identical (no mobile-specific rewording)
- All animations play (IntersectionObserver works on mobile)
- All interactive features work (search, chips, carousel)
- CTA hierarchy unchanged ("Boek een demo" is always the primary conversion)
- Dark-first visual hierarchy preserved
- Scroll-to-anchor behavior for all "#aanmelden" links

### Touch considerations

- Chips: minimum 44px touch target (padding: 6px 14px, plus natural text width)
- Table rows: minimum 44px height (padding: 10px 16px, font size 14px)
- Tab pills: minimum 44px height (padding: 10px 16px)
- Share buttons: 40px minimum (8px padding + 16px icon + 8px padding)
- All form inputs: 52px height (padding: 14px)

---

## 7. Performance Notes

### Lazy loading

| Resource | Strategy |
|----------|----------|
| H2 curated data | Hardcoded in JS bundle, no fetch (~4KB gzipped for 56 recipients) |
| H2 live search API | Fetched on demand after 200ms debounce; only on user typing |
| H3 discovery data | Hardcoded in JS bundle (~3KB gzipped for 23 discoveries) |
| Feature icons (Zoek/Vergelijk/Exporteer) | Inline SVG, no external fetch |
| Audience tab icons | Inline SVG Heroicons |
| B2G blurb images | `loading="lazy"`, below fold |
| Logo images | `priority={true}`, above fold |
| Wave background (Op maat) | CSS `background-image`, browser-managed |
| Noise texture | Inline SVG data URI, ~200 bytes |

### Animation budget

| Animation | Type | Performance |
|-----------|------|-------------|
| `h2FadeUp` | CSS `transform + opacity` | GPU-composited, 0 layout thrash |
| `h2RowFadeIn` | CSS `transform + opacity` | GPU-composited |
| `ScrollReveal` | IntersectionObserver + CSS class toggle | One-time observation, fires once |
| Discovery crossfade | CSS `transform + opacity + transition` | GPU-composited |
| Count-up | `requestAnimationFrame` + state update | ~84 frames per count-up (1.4s @ 60fps) |
| Auto-rotation timers | `setInterval` | 1 active timer at a time; cleared on unmount |
| Animated placeholder | `setTimeout` chain | Light; ~80 character events per cycle |
| Pill fade | CSS `animation: pillFadeIn` | GPU-composited |

### Bundle impact estimate

| Component | Estimated size (gzipped) |
|-----------|--------------------------|
| H2 widget (search + table + curated data) | ~8KB |
| H3 widget (discoveries + carousel + count-up) | ~5KB |
| Shared (noise, animations, types) | ~1KB |
| New sections (Product, Trust) | ~2KB |
| Preserved sections (Audience, Pricing, B2G, Contact) | ~0KB (already in bundle) |
| **Total new JS** | **~16KB gzipped** |

### Critical rendering path

1. HTML streams with header + dark hero container (SSR/SSG)
2. JS hydrates: animated placeholder starts, curated rows render
3. Below-fold sections use `ScrollReveal` (no work until visible)
4. API calls happen only when user types (no speculative fetches)

### Lighthouse targets

| Metric | Target |
|--------|--------|
| LCP | < 1.5s (hero headline or search input) |
| FID | < 100ms |
| CLS | < 0.05 (no layout shifts after initial paint) |
| Total bundle | < 200KB gzipped (entire page) |

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Dark hero feels too heavy / intimidating** | High | Medium | The sticky white header provides visual relief. The search input (white) draws the eye. Trust indicators below the table provide breathing room before the next section. If feedback is negative, can add 16px of white padding above the dark block. |
| **Visitor doesn't realize they can type** | High | Low | Animated placeholder cycling through real names creates motion that draws attention. Chips labeled "Probeer:" explicitly invite interaction. The search input is the largest white element in the dark container. |
| **Two dark sections in a row (hero + discovery) feel monotonous** | Medium | Medium | The hero is interactive (search); the discovery is editorial (passive). Content contrast compensates for visual similarity. If monotony is a problem, insert a white breathing strip (40px) between them, or move discovery further down. |
| **API rate limiting frustrates legitimate users** | Medium | Low | Burst allowance of 20 tokens covers normal exploration (3-5 searches). Only sustained automated queries hit limits. Error message is honest and suggests waiting 1 minute. |
| **Mobile table readability with only 3 columns** | Medium | Low | Already validated in H2 prototype. Ontvanger + 2024 + Totaal provides the essential information. Redacted bars are hidden, reducing cognitive load. |
| **"Boek een demo" not visible enough without hero CTA** | Medium | Medium | Sticky header keeps "Boek een demo" always visible. Pink button on white header is high contrast. If conversion drops, add a floating "Boek een demo" pill that appears after 5s or 50% scroll depth. |
| **SEO: less visible text for crawlers** | Medium | Low | Headline, subline, and all section text are real DOM elements. Table data is rendered in HTML (not canvas). Curated rows provide crawlable content even without JS. |
| **Page too long with 8 sections** | Low | Low | Sections 2.3 (Product) and 2.5 (Trust) are compact -- under 300px viewport height each. Total page length is comparable to H6 (which also has 7 sections). |
| **Discovery data becomes stale** | Low | Medium | 23 discoveries based on production data that changes infrequently. Source years are cited. Worst case: a number is slightly off, not factually wrong. Long-term: automate via V2 Reporter pipeline. |
| **Scraping via public search endpoint** | Low | Medium | Three-layer defense (progressive rate limit, query cost multiplier, fingerprint-enhanced limiting). Makes bulk extraction impractical without blocking real users. Cloudflare WAF deferred to post-launch. |
| **Noise texture / grid not visible on some monitors** | Low | Low | These are subtle decorative layers (0.035 opacity, 0.015 opacity). If invisible, the dark navy background alone is sufficient. They add texture on good displays, cause no harm on others. |

---

## Appendix: Section Flow Diagram

```
[Sticky Header: Logo | Boek een demo | Login]
    |
    v
[SECTION 2.1 — THE REVEAL]
    Full-bleed dark navy
    "Waar gaat €1.700 miljard naartoe?"
    [Search input with animated placeholder]
    [Probeer: chips]
    [White inset table: 10 rows, redacted bars + real 2024/Totaal]
    [Trust: 450.000+ ontvangers · 9 jaar · €1.700+ mld]
    |
    v
[SECTION 2.2 — ONTDEKKING VAN DE WEEK]
    Dark navy card (contained, rounded)
    [Count-up number + insight + share + CTA]
    Auto-rotating carousel, 23 discoveries
    |
    v
[SECTION 2.3 — THE PRODUCT]
    White background
    "Het meest complete platform"
    [Zoek | Vergelijk | Exporteer] — 3 columns
    |
    v
[SECTION 2.4 — AUDIENCE]
    White background
    "Gebouwd voor"
    [5 pill tabs: Raadsleden → Academici]
    |
    v
[SECTION 2.5 — TRUST / SOCIAL PROOF]
    White background, bordered
    "De cijfers"
    [€1.700+ mld | 4.900+ regelingen | 9 jaren | 6 databronnen]
    |
    v
[SECTION 2.6 — PRICING + CTA]
    Off-white gradient
    "Onze abonnementen"
    [Professioneel card + Boek een demo]
    [Op maat card + Neem contact op]
    |
    v
[SECTION 2.7 — B2G]
    Off-white background
    "Rijksuitgaven voor Overheden"
    [3 feature blurbs + Maak afspraak + Vraag brochure aan]
    |
    v
[SECTION 2.8 — CONTACT FORM]
    Pink background
    "Interesse? Vraag meteen een demo aan"
    [2-col: pitch text + form]
    |
    v
[Footer]
```

---

## Appendix: Component Reuse Plan

| H7 Section | Source Component | Reuse Strategy |
|------------|-----------------|----------------|
| 2.0 Header | `PublicHeader` in `public-homepage.tsx` | Reuse as-is |
| 2.1 Hero | `ProbeerHetZelfPage` in `app/h2/page.tsx` | Extract as `<HeroSearchWidget />`, modify for full-bleed |
| 2.2 Discovery | `OntdekkingPage` in `app/h3/page.tsx` | Extract as `<DiscoveryWidget />`, remove simulated context |
| 2.3 Product | New component | Build fresh (simple 3-column) |
| 2.4 Audience | `AudienceSection` in `public-homepage.tsx` | Reuse as-is |
| 2.5 Trust | `TrustBar` in `public-homepage.tsx` | Modify: add headline, simplify to 4 metrics |
| 2.6 Pricing | `SubscriptionSection` in `public-homepage.tsx` | Reuse as-is, add "Boek een demo" CTA |
| 2.7 B2G | `B2GSection` in `public-homepage.tsx` | Reuse as-is |
| 2.8 Contact | `ContactSection` in `public-homepage.tsx` | Reuse as-is |

---

**End of H7 design specification.**