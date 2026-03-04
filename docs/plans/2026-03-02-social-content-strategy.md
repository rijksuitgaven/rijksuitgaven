# Social Content Strategy — Rijksuitgaven.nl

**Created:** 2026-03-02
**Updated:** 2026-03-03 (templates curated, hashtags contextual, factual accuracy verified)
**Status:** ✅ Implemented — pipeline generates 500 posts from source tables
**Goal:** 500 factual, retweetable posts (3/day × ~6 months) across X, Bluesky, LinkedIn
**Tool:** Buffer (manual CSV import)

---

## Principles

1. **Factual only** — every number must be directly verifiable from the source data
2. **No editorializing** — state what IS, not what should be. The facts speak for themselves.
3. **Staffel honesty** — inkoop and COA use staffelbedragen (brackets). Never present midpoints as exact amounts. Use bracket boundaries only.
4. **No unverifiable claims** — never use words like "koopt", "inkoopcontracten", "leverancier", "levert aan". We only know money went from A to B. Use "ontving van" and "betaalde aan" only.
5. **Politically neutral** — sensitive topics (COA, defensie) are reported with the same factual tone as any other data point
6. **"Doel door doen"** — the post's goal is to make people stop scrolling. The means is a surprising fact.

---

## Data Accuracy Rules

| Module | Amount Type | What We Can Say | What We Cannot Say |
|--------|-----------|-----------------|-------------------|
| instrumenten | Exact (×1000) | "€13.100.000.000" | — |
| apparaat | Exact (×1000) | "€7.276.336.000" | — |
| gemeente | Exact | "€182.126.005" | — |
| provincie | Exact | "€499.435.571" | — |
| inkoop | Staffel brackets | "bedragen boven €150 miljoen" | "ontving €637 miljoen", "inkoopcontracten", "koopt" |
| publiek (COA) | Staffel brackets | "bedragen boven €50 miljoen" | "ontving €1 miljard", "contracten", "leverancier" |

### Staffel Brackets (Source: Rijksoverheid)

| Staffel | Range |
|---------|-------|
| 0 | Negatief – €0 |
| 1 | €1 – €10.000 |
| 2 | €10.001 – €50.000 |
| 3 | €50.001 – €100.000 |
| 4 | €100.001 – €250.000 |
| 5 | €250.001 – €500.000 |
| 6 | €500.001 – €1.000.000 |
| 7 | €1.000.001 – €5.000.000 |
| 8 | €5.000.001 – €10.000.000 |
| 9 | €10.000.001 – €25.000.000 |
| 10 | €25.000.001 – €50.000.000 |
| 11 | €50.000.001 – €100.000.000 |
| 12 | €100.000.001 – €150.000.000 |
| 13 | Meer dan €150.000.001 |

---

## Number Formatting

| Context | Format | Example |
|---------|--------|---------|
| Exact amounts (exact modules) | Full with dots | €13.100.000.000 |
| Staffel bracket boundaries | Rounded with "miljoen" | "boven €150 miljoen" |
| Year ranges | Digits | "2018–2024" |
| Percentages | Not used | — (implies false precision on staffel data) |

---

## Hashtag Convention

- **Contextual hashtags** — 2-3 per post, derived from data fields (no brand hashtag)
- Appended after final period: "...voor '{descriptor}'. #Tag1 #Tag2"
- All posts optimized for X (50-280 chars including hashtags)

### Hashtag Sources Per Module

| Module | Tag 1 (topic) | Tag 2 (context) | Tag 3 (entity) |
|--------|--------------|-----------------|-----------------|
| instrumenten | #Subsidies | — | `make_entity_tag()` |
| apparaat | #Overheidsuitgaven | ministry map | kostensoort map |
| inkoop | #Overheidsuitgaven | category map | `make_entity_tag()` |
| provincie | #Provincies | #ProvincieNaam | `make_entity_tag()` |
| gemeente | #Gemeenten | #GemeenteNaam | `make_entity_tag()` |
| publiek | #Subsidies | #Source (NWO/RVO/ZonMW) | `make_entity_tag()` |
| coa | #COA | #Asielopvang | `make_entity_tag()` |

### Ministry Map (apparaat)

| Ministry | Tag |
|----------|-----|
| Defensie | #Defensie |
| Justitie en Veiligheid | #JenV |
| Binnenlandse Zaken | #BZK |
| Buitenlandse Zaken | #BuZa |
| Financiën | #Financien |
| Infrastructuur en Waterstaat | #IenW |
| Onderwijs, Cultuur en Wetenschap | #OCW |
| Sociale Zaken en Werkgelegenheid | #SZW |
| Volksgezondheid, Welzijn en Sport | #VWS |
| Economische Zaken en Klimaat | #EZK |
| Landbouw, Natuur en Voedselkwaliteit | #LNV |
| Algemene Zaken | #AZ |
| Koninkrijksrelaties en Digitalisering | #KenD |

### Category Map (inkoop)

Only mapped categories get a hashtag — unknown categories are skipped:

| Category | Tag |
|----------|-----|
| automatisering / ict | #ICT |
| advies | #Advies |
| personeel | #Personeel |
| huisvesting | #Huisvesting |
| reis en verblijf | #Reiskosten |
| vervoer | #Vervoer |
| inhuur | #Inhuur |
| beveiliging | #Beveiliging |
| communicatie | #Communicatie |
| facilitair | #Facilitair |
| juridisch | #Juridisch |

### Entity Tag Rules

- Strip B.V./N.V. suffixes
- Strip Stichting/Gemeente/Provincie/Ministerie/Koninklijke prefixes
- Only if 1-2 words remain, max 25 chars
- Invalid characters stripped: `re.sub(r'[^#\w]', '', tag)`

---

## Content Mix (500 posts, balanced across modules)

| Module | Template Set | ~Posts | Key Fields |
|--------|-------------|-------|------------|
| instrumenten | Standard (5) + Extra (2) | ~74 | ontvanger, jaar, bedrag, descriptor, type |
| apparaat | Apparaat (6) | ~74 | begrotingsnaam, kostensoort, jaar, bedrag |
| inkoop | Inkoop (3) | ~74 | leverancier, staffel bracket, categorie |
| provincie | Standard (5) + Extra (3) | ~57 | ontvanger, jaar, bedrag, descriptor, provincie |
| gemeente | Standard (5) + Extra (3) | ~74 | ontvanger, jaar, bedrag, descriptor, gemeente |
| publiek | Standard (5) + Extra (4) | ~74 | ontvanger, jaar, bedrag, descriptor, source |
| coa | COA (5) | ~74 | ontvanger, staffel bracket, regeling |

**Selection:** Round-robin across modules, max 3 posts per recipient entity, shuffled output.

---

## Platform Notes

| Platform | Max length | Notes |
|----------|-----------|-------|
| X | 280 chars | One thought, one number. Short. |
| Bluesky | 300 chars | Same content as X |
| LinkedIn | 3000 chars | Same content — no need for longer version |

All posts are written to fit X (280 chars incl. hashtags). Same post goes to all three platforms via Buffer.

---

## Quality Checklist (per post)

- [ ] Every number directly verifiable from source data
- [ ] Staffel modules: bracket language only, no midpoint amounts
- [ ] No unverifiable claims (no "koopt", "contracten", "leverancier", "levert")
- [ ] No editorializing or opinion
- [ ] Under 280 characters (including hashtags)
- [ ] 2-3 contextual hashtags
- [ ] Not politically suggestive in framing
- [ ] Module source identifiable
- [ ] All text fields ≤ 50 characters (skip if longer)

---

## Implemented Pipeline

**Method:** Fully automated — rule-based extraction + template generation, no Claude API scoring.

### Pipeline Steps

```
1. python3 social/extract_facts.py     # 7 SQL queries → 7 fact CSVs (~2,800 rows)
2. python3 social/generate_posts.py    # 3 template sets → 500 posts → buffer-ready.csv
3. Manual: import buffer-ready.csv into Buffer
```

### Folder Structure

```
social/
├── extract_facts.py            # 7 extraction queries from source tables
├── generate_posts.py           # Template-based post generation + filtering
├── facts/                      # Intermediate fact CSVs (gitignored)
│   ├── instrumenten_rows.csv   # (ontvanger, jaar, bedrag, descriptor, type)
│   ├── apparaat_rows.csv       # (begrotingsnaam, kostensoort, jaar, bedrag)
│   ├── inkoop_rows.csv         # (leverancier, staffel, categorie)
│   ├── provincie_rows.csv      # (ontvanger, jaar, bedrag, descriptor, provincie)
│   ├── gemeente_rows.csv       # (ontvanger, jaar, bedrag, descriptor, gemeente)
│   ├── publiek_rows.csv        # (ontvanger, jaar, bedrag, descriptor, source)
│   └── coa_rows.csv            # (ontvanger, staffel, regeling)
└── posts/
    └── buffer-ready.csv        # 500 posts (text, module, entity, jaar, chars)
```

### CSV Output Columns

| Column | Description | Example |
|--------|-------------|---------|
| `text` | Full post text including hashtags | In 2024 ontving Provincie Drenthe €203.179.000 via 'Algemene uitkering'. #Subsidies #Drenthe |
| `module` | Source module | instrumenten / apparaat / inkoop / provincie / gemeente / publiek / coa |
| `entity` | Primary entity in the post | ProRail |
| `jaar` | Year referenced (empty for staffel) | 2023 |
| `chars` | Character count | 134 |

### Buffer Import

Buffer accepts CSV with a `text` column. Extra columns are for internal tracking — Buffer ignores them.

### Extraction Thresholds

| Module | Minimum Amount | Multiplier | Year Range | Max Rows |
|--------|---------------|------------|------------|----------|
| instrumenten | €100,000 | ×1000 | 2022-2024 | 500 |
| apparaat | €1,000,000 | ×1000 | 2022-2024 | 300 |
| inkoop | staffel ≥ 7 | — | all years | 300 |
| provincie | €25,000 | ×1 | 2022-2024 | 500 |
| gemeente | €25,000 | ×1 | 2022-2024 | 500 |
| publiek | €25,000 | ×1 | 2022-2024 | 500 |
| coa | staffel ≥ 7 | — | all years | 200 |

### Filters Applied

| Filter | Purpose | Example |
|--------|---------|---------|
| Entity blocklist | Remove generic/anonymous entities | "Niet toegewezen", "Anoniem", "Particulier" |
| Tautology check | Remove entity↔context overlap | Gelderland → Stichting Erfgoed Gelderland |
| English title filter | Remove research titles (20 marker words) | "A cholestatic itch mouse model..." |
| Address filter | Remove street addresses as descriptors | "A.J. Ernststraat 195" |
| Budget code stripping | Clean hierarchical prefixes | "1 Ruimtelijke Ontwikkeling - 2.11 ..." → meaningful part |
| Numeric group filter | Remove aggregated anonymous groups | "1542 natuurlijke personen" |
| Truncated entity filter | Remove entities cut mid-word in source | ending with `-` or `…` |
| Field length limit | Skip all text fields > 50 chars | descriptor, entity, kostensoort, begrotingsnaam, categorie, regeling |
| Max per recipient | Prevent entity dominance | Max 3 posts per entity |

---

## Template Sets (31 templates — curated Mar 3)

### Set 1: Standard Templates (5 universal)

Used by instrumenten, provincie, gemeente, publiek:
```
In {jaar} ontving {ontvanger} {bedrag} via '{descriptor}'.
{bedrag} werd in {jaar} toegekend aan {ontvanger} onder '{descriptor}'.
Met '{descriptor}' werd in {jaar} {bedrag} verstrekt aan {ontvanger}.
In {jaar} kwam {bedrag} terecht bij {ontvanger} dankzij '{descriptor}'.
Met behulp van '{descriptor}' ontving {ontvanger} in {jaar} {bedrag}.
```

### Instrumenten extras (2) — adds {type} field
```
Onder '{descriptor}' kreeg {ontvanger} in {jaar} een {type} van {bedrag}.
In {jaar} werd {ontvanger} ondersteund met {bedrag} vanuit '{descriptor}'.
```

### Provincie extras (3) — adds {provincie} context
```
De provincie {provincie} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.
In {jaar} ontving {ontvanger} {bedrag} van de provincie {provincie} via '{descriptor}'.
De provincie {provincie} betaalde in {jaar} {bedrag} aan {ontvanger} onder '{descriptor}'.
```

### Gemeente extras (3) — adds {gemeente} context
```
De gemeente {gemeente} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.
In {jaar} ontving {ontvanger} {bedrag} van de gemeente {gemeente} via '{descriptor}'.
Vanuit de gemeente {gemeente} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.
```

### Publiek extras (4) — adds {source} context (NWO, RVO, ZonMW)
```
Via {source} ontving {ontvanger} in {jaar} {bedrag} voor '{descriptor}'.
{source} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.
In {jaar} ontving {ontvanger} {bedrag} van {source} via '{descriptor}'.
Vanuit {source} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.
```

### Set 2: Apparaat Templates (6)

Internal government cost framing — no "ontvanger ontving":
```
In {jaar} gaf {begrotingsnaam} {bedrag} uit aan {kostensoort}.
De post '{kostensoort}' bij {begrotingsnaam} bedroeg in {jaar} {bedrag}.
{begrotingsnaam} gaf in {jaar} {bedrag} uit aan {kostensoort}.
In {jaar} was de kostenpost '{kostensoort}' bij {begrotingsnaam}: {bedrag}.
Aan {kostensoort} besteedde {begrotingsnaam} in {jaar} {bedrag}.
{begrotingsnaam} besteedde in {jaar} {bedrag} aan de post '{kostensoort}'.
```

### Set 3a: Inkoop Templates (3) — bracket-based, verifiable only

Only "ontving van" and "betaalde aan" — no "koopt", "contracten", "leverancier":
```
{leverancier} ontving van de Rijksoverheid bedragen {bracket} voor '{categorie}'.
De Rijksoverheid betaalde aan {leverancier} bedragen {bracket} ({categorie}).
Aan {leverancier} betaalde de Rijksoverheid bedragen {bracket} voor '{categorie}'.
```

### Set 3b: COA Templates (5) — bracket-based, verifiable only

Only "ontving van" and "betaalde aan" — no "koopt", "contracten", "leverancier":
```
{ontvanger} ontving van het COA bedragen {bracket} voor de regeling '{regeling}'.
Het COA betaalde aan {ontvanger} bedragen {bracket}, regeling: {regeling}.
Aan {ontvanger} betaalde het COA bedragen {bracket} voor '{regeling}'.
Van het COA ontving {ontvanger} bedragen {bracket}. Regeling: {regeling}.
{ontvanger} ontving van het COA bedragen {bracket}.
```

---

## Sample Output Posts (from current buffer-ready.csv)

1. Onderwijs, Cultuur en Wetenschap gaf in 2022 €28.199.000 uit aan pensioenpremies. #Overheidsuitgaven #OCW
2. Aan FABK Defensie betaalde het COA bedragen boven €1 miljoen voor 'Overige huurkosten huisvesting'. #COA #Asielopvang #FabkDefensie
3. In 2024 ontving Stichting Voortgezet Onderwijs Haaglanden €3.029.513 van de gemeente Den Haag via '430.I Onderwijsbeleid'. #Gemeenten #DenHaag
4. Plegt-Vos Bouwgroep B.V. ontving van de Rijksoverheid bedragen boven €25 miljoen voor 'gebruik en onderhoud gebouw en terreinen'. #Overheidsuitgaven #PlegtvosBouwgroep
5. In 2024 ontving Provincie Drenthe €203.179.000 via 'Algemene uitkering'. #Subsidies #Drenthe
6. De provincie Zeeland betaalde in 2023 €2.630.450 aan Zeeuws Museum onder 'Integrale kostensubs. 2023 Zeeuws Museum'. #Provincies #Zeeland #ZeeuwsMuseum
7. Via ZonMW ontving Gemeente Dordrecht in 2023 €450.896 voor 'MDT Missie Nationale Sportweek'. #Subsidies #ZonMW #Dordrecht
