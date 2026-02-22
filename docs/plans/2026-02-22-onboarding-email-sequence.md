# Onboarding Email Sequence Design

**Created:** 2026-02-22
**Status:** All 5 emails final — ready for implementation
**Goal:** Increase usage and awareness among existing beta users
**Principle:** "Doel door doen" — lead with the goal, then the means

---

## Sequence Architecture

| # | Delay | Subject | Core Theme |
|---|---|---|---|
| **1** | Day 0 | Welkom bij het nieuwe Rijksuitgaven.nl | Toegang + login + feedback ask |
| **2** | Day 2 | Zoeken | Autocomplete, Nederlands, integraal |
| **3** | Day 4 | Filteren | Cascading, klik-to-filter, kolommen |
| **4** | Day 7 | Ontdekking | 9 jaar, anomalieën, "Ook in" |
| **5** | Day 11 | Details + export | Uitklappen, groepering, Excel/CSV |

Optional 6th email (day 18): Roadmap + feedback close-loop. Decision deferred.

---

## Design Decisions

| Decision | Outcome | Rationale |
|---|---|---|
| Job-based, not feature-based | Each email = one user goal | Features listed = manual; goals = motivation |
| Standalone emails | Each works independently | Open rates drop per email; no dependencies |
| Feedback in Mail 1 | Active ask, not just mention | Beta users = feedback is the point |
| Absolute bedragen in Mail 1 | One-line trust signal | Users discover full amounts on login |
| No images | Text + CTA button only | Outlook/Citrix block images by default (B2G audience) |
| Deep link CTAs | Link to relevant module page | Homepage = extra click; module page = immediate value |
| 7-day session explained | "Bezoek 1x per week = blijft ingelogd" | Honest, habit-forming, not apologetic |
| No em dashes | Avoid "—" in copy | AI-sounding; use commas or periods instead |

---

## Content Sources

All email content derived from `/versiegeschiedenis` page features:
- V2.0 release notes (Feb 20, 2026)
- V2.0.1 search enhancements (Feb 21, 2026)

---

## Mail 1: Welkom (FINAL)

**Subject:** Welkom bij het nieuwe Rijksuitgaven.nl

**Preheader:** Uw persoonlijke toegang tot alle overheidsuitgaven van 2016 tot 2024.

**Heading:** Welkom bij het nieuwe Rijksuitgaven.nl

**Body:**

Beste {{voornaam}},

Rijksuitgaven.nl is volledig vernieuwd. Een sneller platform en krachtigere zoek- en filterfuncties, gebouwd om u direct inzicht te geven in overheidsuitgaven.

**Inloggen zonder wachtwoord**
U logt voortaan in via een persoonlijke link die u per e-mail ontvangt. Geen wachtwoord meer nodig!

1. Ga naar beta.rijksuitgaven.nl
2. Vul uw e-mailadres in
3. Open de link in uw inbox (check ook uw spam folder)
4. U bent ingelogd

Zolang u het platform minstens één keer per week bezoekt, blijft u ingelogd. Pas als u langer dan 7 dagen niet inlogt, ontvangt u een nieuwe link per e-mail.

Alle bedragen worden nu als volledige getallen getoond, tot op de euro, en dus geen mix meer tussen absolute en "x 1.000".

**Dit is een beta, uw feedback maakt het beter**
U bent een van de eerste gebruikers van het nieuwe platform. Ziet u iets dat beter kan, mist u iets, of werkt iets niet zoals verwacht? Gebruik de feedbackknop rechtsonder op het scherm. Elke suggestie wordt gelezen.

**CTA button:** Log in op Rijksuitgaven.nl
**CTA URL:** https://beta.rijksuitgaven.nl

---

## Mail 2: Zoeken (FINAL)

**Subject:** Vind elke ontvanger in seconden

**Preheader:** Resultaten terwijl u typt, uit alle databronnen tegelijk.

**Heading:** Vind in milliseconden wat u zoekt

**Body:**

Beste {{voornaam}},

U ziet resultaten terwijl u typt. Zodra u begint te typen krijgt u suggesties uit alle databronnen tegelijk. U ziet direct of een ontvanger voorkomt in de Rijksbegroting, bij gemeenten, provincies of publieke uitvoeringsorganisaties.

Zoek op "politie" en u vindt Nationale Politie en Politieacademie, maar niet Politieke beweging DENK. Rijksuitgaven herkent Nederlandse woordgrenzen en voorkomt irrelevante resultaten.

**Drie manieren om te zoeken**

- **Meerdere woorden:** Zoek op `rode kruis` en u vindt alle ontvangers waarin beide woorden voorkomen, ongeacht de volgorde.
- **Exacte woordgroep:** Zet aanhalingstekens om woorden: `"rode kruis"` vindt alleen resultaten waar deze woorden direct naast elkaar staan.
- **Zoeken met sterretje:** Typ `prorail*` om alles te vinden dat begint met "prorail", zoals ProRail B.V. en Prorail Holding.

**Integraal doorzoeken**
Doorzoek alle databronnen in één keer. U ziet per ontvanger in welke bronnen deze voorkomt en hoeveel betalingen er zijn.

**Zie waar uw zoekterm ook voorkomt**
De "Ook in" kolom toont of uw zoekterm ook in een regeling, omschrijving of ander veld staat. Zo ontdekt u verbanden die u anders zou missen.

**CTA button:** Zoek uw eerste ontvanger
**CTA URL:** https://beta.rijksuitgaven.nl/integraal

*Tips of suggesties? Gebruik de feedbackknop rechtsonder op het scherm.*

---

## Mail 3: Filteren (FINAL)

**Subject:** Preciezer resultaat door filters die live meebewegen

**Preheader:** Combineer filters en de resultaten worden direct bijgewerkt.

**Heading:** Filter tot u precies vindt wat u nodig heeft

**Body:**

Beste {{voornaam}},

Elke module heeft eigen filters waarmee u snel kunt inzoomen. Combineer meerdere filters tegelijk en de resultaten worden direct bijgewerkt.

**Filters die op elkaar reageren**
Selecteer een provincie en de overige filtervelden tonen automatisch alleen de opties die daarbinnen relevant zijn, met aantallen. Zo filtert u nooit naar een lege selectie.

**Klik om te filteren**
Klik op een waarde in de tabel, zoals een regeling, categorie of gemeente, en de resultaten filteren direct.

**Kies uw eigen kolommen**
Bepaal via de Kolommen-knop welke extra informatie u in de tabel wilt zien: artikel, regeling, gemeente, categorie of andere velden.

**CTA button:** Probeer de filters
**CTA URL:** https://beta.rijksuitgaven.nl/instrumenten

*Tips of suggesties? Gebruik de feedbackknop rechtsonder op het scherm.*

---

## Mail 4: Ontdekking (FINAL)

**Subject:** Opvallende verschuivingen in één oogopslag

**Preheader:** Negen jaar overheidsuitgaven naast elkaar, met automatische markering van grote veranderingen.

**Heading:** Zie trends en opvallende uitgaven over 9 jaar

**Body:**

Beste {{voornaam}},

Alle overheidsuitgaven van 2016 tot en met 2024 staan in kolommen naast elkaar. Zo ziet u in één blik hoe budgetten zich over de jaren ontwikkelen.

Standaard ziet u de meest recente jaren. Klik op het pijltje naast 2016-20 om alle 9 jaren zichtbaar te maken.

**Opvallende verschuivingen direct zichtbaar**
Cellen met meer dan 50% jaar-op-jaar verandering worden rood gemarkeerd. Beweeg uw muis over de cel om het exacte percentage te zien. Zo ziet u direct waar budgetten sterk zijn gestegen of gedaald.

**Weet precies welke data beschikbaar is**
Niet elke databron dekt alle jaren. Een streepje (—) betekent "geen data beschikbaar", niet €0. Zo weet u altijd of een bedrag werkelijk nul is of dat er simpelweg geen data voor dat jaar bestaat.

**CTA button:** Bekijk de trends
**CTA URL:** https://beta.rijksuitgaven.nl/gemeente

*Tips of suggesties? Gebruik de feedbackknop rechtsonder op het scherm.*

---

## Mail 5: Details + Export (FINAL)

**Subject:** Alle details achter elk bedrag, en neem uw data mee

**Preheader:** Klap rijen uit voor de details, exporteer naar Excel met één klik.

**Heading:** Zoom in op de details achter de bedragen

**Body:**

Beste {{voornaam}},

Klik op een ontvanger om alle onderliggende betalingen te zien. De details klappen direct onder de rij uit, u verlaat de pagina niet.

**Groepeer op elk veld**
Bekijk de betalingen gegroepeerd op artikel, regeling, gemeente of een ander veld. Wissel tussen groeperingen om het bedrag vanuit verschillende invalshoeken te bekijken.

**Zoek een ontvanger op Google**
Eén klik op het linkicoon naast de naam opent Google met die ontvangernaam. Handig voor snel achtergrondonderzoek.

**Exporteer voor uw eigen analyses**
Download tot 500 rijen naar Excel (.xlsx) of CSV, inclusief alle zichtbare kolommen en jaarbedragen. Het bestand wordt automatisch benoemd met de module en datum, zodat u uw exports geordend houdt.

**CTA button:** Bekijk de details
**CTA URL:** https://beta.rijksuitgaven.nl/inkoop

*Tips of suggesties? Gebruik de feedbackknop rechtsonder op het scherm.*

---

## Footer (Mail 2-5)

All emails 2-5 include: *"Tips of suggesties? Gebruik de feedbackknop rechtsonder op het scherm."*
