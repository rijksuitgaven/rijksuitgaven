# Privacybeleid

**Laatst bijgewerkt:** 12 februari 2026

---

## Artikel 1 – Algemeen

1.1 Dit privacybeleid beschrijft hoe Rijksuitgaven.nl omgaat met persoonsgegevens van gebruikers die het platform bezoeken of zich abonneren op de diensten.

1.2 Rijksuitgaven.nl respecteert de privacy van alle gebruikers en draagt er zorg voor dat persoonlijke informatie vertrouwelijk wordt behandeld.

---

## Artikel 2 – Verzameling van persoonsgegevens

2.1 Rijksuitgaven.nl verzamelt persoonsgegevens die door de gebruiker actief worden verstrekt of door de abonnementsbeheerder worden aangeleverd:

- **E-mailadres:** Vereist voor authenticatie via Magic Link-inlogmethode
- **Volledige naam:** Voor identificatie binnen het platform
- **Organisatie:** Om aan te geven bij welke organisatie u werkzaam bent
- **Abonnementsgegevens:** Type abonnement (maandelijks/jaarlijks), startdatum, einddatum, status
- **Gebruikersrol:** Of u lid of beheerder bent van de organisatielicentie
- **Notities:** Optionele administratieve notities van de beheerder

2.2 Voor authenticatie gebruikt Rijksuitgaven.nl een Magic Link-systeem waarbij geen wachtwoorden worden opgeslagen. Alleen uw e-mailadres wordt gebruikt om inloglinks te versturen.

2.3 Rijksuitgaven.nl verzamelt geen IP-adressen, geen device-informatie, en gebruikt geen tracking- of analytische systemen.

---

## Artikel 3 – Gebruik van persoonsgegevens

3.1 Rijksuitgaven.nl gebruikt persoonsgegevens voor de volgende doeleinden:

- **Uitvoering van de overeenkomst (AVG artikel 6(1)(b)):** Het leveren van toegang tot het platform, authenticatie via Magic Link, beheer van abonnementen en gebruikersaccounts
- **Klantenservice en ondersteuning:** Het beantwoorden van vragen en het oplossen van technische problemen
- **Abonnementsbeheer:** Het bijhouden van actieve, verlopen en opgezegde abonnementen
- **Communicatie:** Het verzenden van inloglinks, systeemmeldingen en administratieve berichten
- **Wettelijke verplichtingen:** Het bewaren van administratieve gegevens zoals vereist door fiscale wetgeving

3.2 **Rechtsgrondslag:** De verwerking van uw persoonsgegevens is noodzakelijk voor de uitvoering van de overeenkomst (abonnement) tussen u en Rijksuitgaven.nl (AVG artikel 6(1)(b)).

---

## Artikel 4 – Delen van persoonsgegevens

4.1 Rijksuitgaven.nl maakt gebruik van de volgende verwerkers voor het leveren van de dienst:

| Verwerker | Doel | Locatie | Waarborgen |
|-----------|------|---------|------------|
| **Supabase Inc.** | Database-hosting en authenticatieservices | Frankfurt, Duitsland (AWS EU-Central-1) | AVG-verwerkersovereenkomst, gegevens blijven binnen EU |
| **Railway Corp.** | Hosting van webapplicatie en zoekinfrastructuur | Amsterdam, Nederland | AVG-verwerkersovereenkomst, gegevens blijven binnen EU |
| **Resend Inc.** | Verzending van Magic Link-e-mails voor authenticatie | Verenigde Staten (met EU-dataverwerking) | Standard Contractual Clauses (SCC's), AVG-verwerkersovereenkomst |

4.2 Alle verwerkers zijn gebonden aan verwerkersovereenkomsten die voldoen aan de AVG. Gegevens worden uitsluitend verwerkt binnen de Europese Economische Ruimte (EER), met uitzondering van Resend, waarvoor Standard Contractual Clauses van toepassing zijn.

4.3 Rijksuitgaven.nl deelt geen persoonsgegevens met derden voor marketing- of commerciële doeleinden.

---

## Artikel 5 – Beveiliging van persoonsgegevens

5.1 Rijksuitgaven.nl treft passende technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen verlies of onrechtmatig gebruik:

- **Versleuteling tijdens transport:** Alle communicatie verloopt via HTTPS met TLS 1.3, inclusief HSTS-header voor geforceerde beveiligde verbindingen
- **Versleuteling in opslag:** Alle databasegegevens worden versleuteld opgeslagen (AES-256) via Supabase/AWS-infrastructuur
- **Toegangsbeveiliging:** Row Level Security (RLS) policies in de database zorgen dat gebruikers alleen hun eigen gegevens kunnen inzien
- **Sessiebeveiliging:** Sessie-tokens worden opgeslagen in httpOnly, secure, sameSite cookies die niet toegankelijk zijn via JavaScript
- **Authenticatie:** Passwordless Magic Link-systeem voorkomt wachtwoordlekken; geen wachtwoorden worden opgeslagen
- **Invoervalidatie:** Alle gebruikersinvoer wordt gevalideerd en geparametriseerd om SQL-injectie te voorkomen
- **Administratortoegang:** Abonnementsbeheer vereist admin-rol; toegang tot service-level functies is beperkt tot geautoriseerd personeel

5.2 Persoonsgegevens worden opgeslagen in beveiligde cloud-omgevingen binnen de EU (Frankfurt en Amsterdam) met enterprise-grade fysieke en digitale beveiligingsmaatregelen.

5.3 Toegang tot productiegegevens is beperkt tot technisch noodzakelijke handelingen en wordt niet gebruikt voor andere doeleinden.

---

## Artikel 6 – Bewaartermijnen

6.1 Rijksuitgaven.nl bewaart persoonsgegevens volgens de volgende termijnen:

- **Actieve abonnementen:** Gegevens worden bewaard zolang het abonnement actief is
- **Verlopen abonnementen:** Gegevens blijven bewaard na expiratie zodat eenvoudig hernieuwing mogelijk is. Er vindt geen automatische verwijdering plaats bij verlopen van het abonnement.
- **Opgezegde abonnementen:** Gegevens blijven bewaard tenzij de abonnementsbeheerder expliciet om verwijdering verzoekt
- **Administratieve gegevens:** Minimaal zeven jaar na beëindiging abonnement (wettelijke verplichting fiscale administratie)
- **Inlog-sessies:** Access tokens 1 uur, refresh tokens maximaal 30 dagen of tot uitloggen

6.2 **Verwijdering op verzoek:** Gebruikers kunnen te allen tijde verzoeken om verwijdering van hun persoonsgegevens. Na een verzoek tot verwijdering worden alle gegevens binnen 30 dagen definitief verwijderd, met uitzondering van gegevens die op grond van wettelijke verplichtingen moeten worden bewaard.

6.3 **Handmatige verwijdering:** Op dit moment vindt verwijdering van gebruikersaccounts handmatig plaats door de abonnementsbeheerder via het Supabase-dashboard. Self-service verwijdering is gepland voor een toekomstige versie.

---

## Artikel 7 – Rechten van gebruikers

7.1 Op grond van de Algemene Verordening Gegevensbescherming (AVG) heeft u de volgende rechten:

- **Recht op inzage (artikel 15 AVG):** U kunt opvragen welke persoonsgegevens wij van u verwerken
- **Recht op rectificatie (artikel 16 AVG):** U kunt verzoeken om correctie van onjuiste of onvolledige gegevens
- **Recht op verwijdering (artikel 17 AVG):** U kunt verzoeken om verwijdering van uw persoonsgegevens
- **Recht op beperking (artikel 18 AVG):** U kunt verzoeken om beperking van de verwerking
- **Recht op bezwaar (artikel 21 AVG):** U kunt bezwaar maken tegen bepaalde verwerkingen
- **Recht op gegevensoverdraagbaarheid (artikel 20 AVG):** U kunt uw gegevens in een gestructureerd, gangbaar en machineleesbaar formaat ontvangen

7.2 **Uitoefening van rechten:** U kunt uw rechten uitoefenen door een e-mail te sturen naar contact@rijksuitgaven.nl. Wij reageren binnen 30 dagen op uw verzoek.

7.3 **Gegevensoverdraagbaarheid in de praktijk:** Rijksuitgaven.nl biedt de mogelijkheid om gezochte data te exporteren in CSV- of Excel-formaat (maximaal 500 rijen per export). Voor volledige export van uw accountgegevens kunt u contact opnemen.

7.4 **Recht om klacht in te dienen:** Als u vindt dat Rijksuitgaven.nl niet correct omgaat met uw persoonsgegevens, heeft u het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (www.autoriteitpersoonsgegevens.nl).

---

## Artikel 8 – Cookies

8.1 Rijksuitgaven.nl maakt uitsluitend gebruik van **essentiële (functionele) cookies** die strikt noodzakelijk zijn voor de werking van het platform. Er worden **geen analytische, tracking of marketing cookies** gebruikt.

8.2 De volgende cookies en lokale opslag worden gebruikt:

| Type | Naam | Doel | Bewaartermijn |
|------|------|------|---------------|
| **Sessie-cookie** | `sb-access-token` | Authenticatie: bewaart inlogstatus (Supabase access token) | 1 uur of tot uitloggen |
| **Sessie-cookie** | `sb-refresh-token` | Authenticatie: verlengt inlogsessie automatisch | 30 dagen of tot uitloggen |
| **Lokale opslag** | `cookie-banner-dismissed` | Onthoudt dat cookiemelding is weggeklikt | Permanent (tot browser-data wordt gewist) |
| **Lokale opslag** | Gebruikersvoorkeuren | Tabelinstellingen zoals kolomweergave en filters | Permanent (tot browser-data wordt gewist) |

8.3 **Eigenschappen van sessie-cookies:**
- `httpOnly`: Ja (cookies zijn niet toegankelijk via JavaScript, bescherming tegen XSS-aanvallen)
- `secure`: Ja (cookies worden alleen via HTTPS verzonden)
- `sameSite`: Lax (bescherming tegen CSRF-aanvallen, staat Magic Link-authenticatie toe)

8.4 **Rechtsgrondslag:** Voor essentiële cookies is geen voorafgaande toestemming vereist onder artikel 11.7a Telecommunicatiewet en de ePrivacy-richtlijn, aangezien deze strikt noodzakelijk zijn voor het leveren van de door u gevraagde dienst (inloggen en gebruik van het platform).

8.5 **Geen externe tracking:** Rijksuitgaven.nl maakt geen gebruik van:
- Google Analytics of andere analysetools
- Marketing cookies of advertentiecookies
- Social media tracking pixels
- Third-party tracking scripts

8.6 **Zelfgehoste fonts:** Het platform gebruikt zelfgehoste lettertypes (via Next.js next/font). Er worden geen externe verzoeken gedaan naar Google Fonts of andere externe diensten die tracking zouden kunnen veroorzaken.

8.7 **Cookies beheren:** U kunt cookies beheren of verwijderen via de instellingen van uw browser. Het blokkeren van essentiële cookies zal echter resulteren in het niet kunnen inloggen en gebruiken van het platform.

---

## Artikel 9 – Wijzigingen in het privacybeleid

9.1 Rijksuitgaven.nl behoudt zich het recht voor om dit privacybeleid te wijzigen. Wijzigingen zullen op de website worden gepubliceerd. Het is aan te raden dit beleid regelmatig te raadplegen.

---

## Artikel 10 – Contact

10.1 Voor vragen over dit privacybeleid of de verwerking van persoonsgegevens kan de gebruiker contact opnemen met Rijksuitgaven.nl via:

**E-mail:** contact@rijksuitgaven.nl

---

*Dit privacybeleid is voor het laatst bijgewerkt op 12 februari 2026.*
