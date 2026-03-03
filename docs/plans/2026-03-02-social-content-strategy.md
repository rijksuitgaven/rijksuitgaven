# Social Content Strategy — Rijksuitgaven.nl

**Created:** 2026-03-02
**Updated:** 2026-03-03
**Status:** ✅ Implemented — pipeline generates 500 posts from source tables
**Goal:** 500 factual, retweetable posts (3/day × ~6 months) across X, Bluesky, LinkedIn
**Tool:** Buffer (manual CSV import)

---

## Principles

1. **Factual only** — every number must be directly verifiable from the source data
2. **No editorializing** — state what IS, not what should be. The facts speak for themselves.
3. **Staffel honesty** — inkoop and publiek use staffelbedragen (brackets). Never present midpoints as exact amounts. Use bracket boundaries or rankings instead.
4. **Politically neutral** — sensitive topics (COA, defensie) are reported with the same factual tone as any other data point
5. **"Doel door doen"** — the post's goal is to make people stop scrolling. The means is a surprising fact.

---

## Data Accuracy Rules

| Module | Amount Type | What We Can Say | What We Cannot Say |
|--------|-----------|-----------------|-------------------|
| instrumenten | Exact (×1000) | "€13.100.000.000" | — |
| apparaat | Exact (×1000) | "€7.276.336.000" | — |
| gemeente | Exact | "€182.126.005" | — |
| provincie | Exact | "€499.435.571" | — |
| inkoop | Staffel brackets | "contracten boven €150 miljoen" | "ontving €637 miljoen" |
| publiek | Staffel brackets | "negen contracten boven €50 miljoen" | "ontving €1 miljard" |

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

## Post Formats (5 Types)

### 1. Scale Shock
One number that makes you stop scrolling.

**Structure:** "[Bedrag/feit]. [Context dat het schokkend maakt]."

**Example:**
> TenneT Holding ontving €13.100.000.000 in 2024 als lening voor het stroomnet. Een jaar eerder: €1.602.000.000.

**Works best with:** Exact modules (instrumenten, apparaat, gemeente, provincie). Large single-year amounts. Dramatic YoY changes.

### 2. Comparison
A vs B makes abstract numbers tangible.

**Structure:** "[A]: [bedrag]. [B]: [bedrag]. [framing]."

**Example:**
> Amsterdam ontving €4.022.206.697 aan gemeente-uitkeringen. Den Haag: €2.167.675.501. Bijna de helft minder.

**Works best with:** Gemeente vs gemeente. Provincie vs provincie. Ontvanger vs ontvanger. Year vs year.

### 3. Concentration
"Eén [entity]" creates curiosity about who and why.

**Structure:** "Eén [type] [feit]. [context]."

**Example (staffel):**
> RMA Healthcare ontving negen contracten boven €50 miljoen van het COA. Waarvan één boven €150 miljoen. In zeven jaar tijd.

**Works best with:** Top ontvangers. Dominant leveranciers. Unexpected recipients.

### 4. Category Reveal
Spending on unexpected categories.

**Structure:** "[Categorie]: [feit]. De grootste [type]: [naam]."

**Example (staffel):**
> Shuttel B.V. had zeven jaar op rij inkoopcontracten tussen €25 en €50 miljoen bij het Rijk. Categorie: reis en verblijf.

**Works best with:** Inkoop categories. Apparaat kostensoorten. Cross-module totals.

### 5. Curiosity Question
Open with a question, answer immediately.

**Structure:** "[Vraag]? [Antwoord]."

**Example:**
> Hoeveel ontving de Openbare Bibliotheek Amsterdam van de gemeente? €182.126.005. Bijna evenveel als het Stedelijk Museum en de Nationale Opera samen.

**Works best with:** Well-known organizations. Surprising comparisons. Counter-intuitive facts.

---

## Number Formatting

| Context | Format | Example |
|---------|--------|---------|
| Exact amounts (exact modules) | Full with dots | €13.100.000.000 |
| Staffel bracket boundaries | Rounded with "miljoen" | "boven €150 miljoen" |
| Contract counts | Written out | "negen contracten" |
| Year ranges | Digits | "2018–2024" |
| Percentages | Not used | — (implies false precision on staffel data) |

---

## Hashtag Convention

- **Single hashtag only: #Rijksuitgaven** (brand recognition, no noise)
- Appended after final period: "...voor '{descriptor}'. #Rijksuitgaven"
- No topic, region, or entity hashtags (decision from Mar 3 Q&A round 2, Q25)
- All posts optimized for X (50-280 chars including hashtag)

---

## Content Mix (500 posts, balanced across modules)

| Module | Template Set | ~Posts | Key Fields |
|--------|-------------|-------|------------|
| instrumenten | Standard (14) + Extra (6) | ~100 | ontvanger, jaar, bedrag, descriptor, type |
| apparaat | Apparaat (8) | ~50 | begrotingsnaam, kostensoort, jaar, bedrag |
| inkoop | Staffel (6) | ~80 | leverancier, staffel bracket, categorie |
| provincie | Standard (14) + Extra (4) | ~60 | ontvanger, jaar, bedrag, descriptor, provincie |
| gemeente | Standard (14) + Extra (4) | ~80 | ontvanger, jaar, bedrag, descriptor, gemeente |
| publiek | Standard (14) + Extra (4) | ~60 | ontvanger, jaar, bedrag, descriptor, source |
| coa | COA Staffel (6) | ~70 | ontvanger, staffel bracket, regeling |

**Selection:** Round-robin across modules, max 3 posts per recipient entity, shuffled output.

---

## Platform Notes

| Platform | Max length | Notes |
|----------|-----------|-------|
| X | 280 chars | One thought, one number. Short. |
| Bluesky | 300 chars | Same content as X |
| LinkedIn | 3000 chars | Same content — no need for longer version |

All posts are written to fit X (280 chars). Same post goes to all three platforms via Buffer.

---

## Quality Checklist (per post)

- [ ] Every number directly verifiable from source data
- [ ] Staffel modules: bracket language only, no midpoint amounts
- [ ] No editorializing or opinion
- [ ] Under 280 characters (excl. hashtags)
- [ ] 3–5 relevant hashtags
- [ ] Not politically suggestive in framing
- [ ] Module source identifiable

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
| `text` | Full post text including #Rijksuitgaven | In 2023 ontving ProRail €1.234.567 via 'Spoorinfrastructuur'. #Rijksuitgaven |
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
| English title filter | Remove research titles (ZonMW/NWO) | "A cholestatic itch mouse model..." |
| Address filter | Remove street addresses as descriptors | "A.J. Ernststraat 195" |
| Budget code stripping | Clean hierarchical prefixes | "1 Ruimtelijke Ontwikkeling - 2.11 ..." → meaningful part |
| Numeric group filter | Remove aggregated anonymous groups | "1542 natuurlijke personen" |
| Max per recipient | Prevent entity dominance | Max 3 posts per entity |

---

## Template Sets (Implemented)

### Set 1: Standard Templates (14 universal + module-specific extras)

Universal (work for all modules with bedrag):
```
Dankzij '{descriptor}' kreeg {ontvanger} in {jaar} {bedrag}.
In {jaar} ontving {ontvanger} {bedrag} via '{descriptor}'.
{bedrag} werd in {jaar} toegekend aan {ontvanger} onder '{descriptor}'.
Met '{descriptor}' werd in {jaar} {bedrag} verstrekt aan {ontvanger}.
Via '{descriptor}' ging in {jaar} {bedrag} naar {ontvanger}.
In {jaar} kwam {bedrag} terecht bij {ontvanger} dankzij '{descriptor}'.
Voor {ontvanger} betekende {jaar}: {bedrag} via '{descriptor}'.
Resultaat van '{descriptor}': {ontvanger} ontving in {jaar} {bedrag}.
Wist u dat {ontvanger} in {jaar} {bedrag} ontving via '{descriptor}'?
Kort: {ontvanger} kreeg in {jaar} {bedrag} onder '{descriptor}'.
{bedrag} in {jaar}: dat is wat {ontvanger} ontving via '{descriptor}'.
Met behulp van '{descriptor}' ontving {ontvanger} in {jaar} {bedrag}.
Voor '{descriptor}' werd in {jaar} {bedrag} toegekend aan {ontvanger}.
Samengevat: {ontvanger} kreeg in {jaar} {bedrag} via '{descriptor}'.
```

Instrumenten extras (6): adds {type} field (bijdrage, lening, etc.)
Provincie extras (4): adds {provincie} context
Gemeente extras (4): adds {gemeente} context
Publiek extras (4): adds {source} context (NWO, RVO, ZonMW)

### Set 2: Apparaat Templates (8)

Internal government cost framing — no "ontvanger ontving":
```
In {jaar} gaf {begrotingsnaam} {bedrag} uit aan {kostensoort}.
{bedrag} in {jaar}: zoveel besteedde {begrotingsnaam} aan {kostensoort}.
De post '{kostensoort}' bij {begrotingsnaam} bedroeg in {jaar} {bedrag}.
... (8 total)
```

### Set 3: Staffel Templates (6 inkoop + 6 COA)

Bracket-based — no exact amounts:
```
{leverancier} heeft inkoopcontracten {bracket} bij de Rijksoverheid voor '{categorie}'.
Het Rijk koopt bij {leverancier} in de prijsklasse {bracket} voor '{categorie}'.
Bij het COA heeft {ontvanger} contracten {bracket} voor de regeling '{regeling}'.
... (12 total)
```

## Sample Output Posts

1. Dankzij 'Bijdrage ZBO's/RWT's: Politie' kreeg de Nationale Politie in 2023 €7.276.336.000. #Rijksuitgaven
2. In 2024 gaf Defensie €2.891.234.000 uit aan personeel. #Rijksuitgaven
3. Accenture heeft inkoopcontracten boven €25 miljoen bij de Rijksoverheid voor 'automatisering'. #Rijksuitgaven
4. Via RVO ontving Vattenfall in 2023 €12.456.789 voor 'SDE++ subsidie'. #Rijksuitgaven
5. Bij het COA heeft RMA Healthcare contracten boven €150 miljoen voor de regeling 'opvang'. #Rijksuitgaven
