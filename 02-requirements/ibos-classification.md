# IBOS Classification Reference

**Date:** 2026-01-19
**Purpose:** Official Dutch policy domain classification for V2.0 Research Mode

---

## Overview

IBOS (Indeling Beleidsterreinen OverheidsSector) is the official Dutch classification system for policy domains. Used in V2.0 Research Mode for domain-first analysis.

## IBOS Domains (30 Categories)

| IBOS Code | Beleidsterrein (Dutch) | Policy Domain (English) |
|-----------|------------------------|-------------------------|
| **01** | Openbaar bestuur en democratie | Public administration and democracy |
| **02** | Openbare orde en veiligheid | Public order and safety |
| **03** | Defensie | Defense |
| **04** | Buitenlandse zaken en internationale samenwerking | Foreign affairs and international cooperation |
| **05** | Justitie en rechtsorde | Justice and legal order |
| **06** | Migratie en asiel | Migration and asylum |
| **07** | Onderwijs | Education |
| **08** | Wetenschap en innovatie | Science and innovation |
| **09** | Cultuur, media en erfgoed | Culture, media and heritage |
| **10** | Volksgezondheid | Public health |
| **11** | Zorg | Healthcare |
| **12** | Sport en bewegen | Sports and exercise |
| **13** | Sociale zekerheid | Social security |
| **14** | Arbeidsmarkt | Labor market |
| **15** | Inkomen en armoedebeleid | Income and poverty policy |
| **16** | Volkshuisvesting en ruimtelijke ordening | Housing and spatial planning |
| **17** | Mobiliteit en transport | Mobility and transport |
| **18** | Infrastructuur | Infrastructure |
| **19** | Milieu | Environment |
| **20** | Klimaat en energie | Climate and energy |
| **21** | Natuur en biodiversiteit | Nature and biodiversity |
| **22** | Landbouw, visserij en voedsel | Agriculture, fisheries and food |
| **23** | Economie en ondernemerschap | Economy and entrepreneurship |
| **24** | Industrie en handelsbeleid | Industry and trade policy |
| **25** | Digitalisering en informatiebeleid | Digitalization and information policy |
| **26** | Overheidsorganisatie en rijksdienst | Government organization and civil service |
| **27** | Belastingen en fiscale regelingen | Taxes and fiscal regulations |
| **28** | Financiële markten | Financial markets |
| **29** | Ontwikkelingssamenwerking (thematisch) | Development cooperation (thematic) |
| **30** | Overig / generiek rijksbeleid | Other / generic national policy |

---

## Usage in V2.0 Research Mode

### Domain Mapping Strategy

**1. Clear Cases (use existing metadata)**
- Begrotingsnaam → maps to IBOS domain
- Artikel → often indicates domain
- Existing Beleidsterrein field (Gemeentelijke module)

**2. Ambiguous Cases (AI classification)**
- AI infers IBOS code from:
  - Recipient name and type
  - KvK/SBI codes (if available)
  - Transaction descriptions
  - Historical patterns
- Always shows confidence level
- Allows user correction

### User Personalization

Users can select their **focus domains** for personalized dashboard:
- Journalist covering healthcare: 10, 11, 13
- Defense policy researcher: 03, 02
- Climate activist: 19, 20, 21
- Eerste Kamer staff: All domains

---

## Related Documents

- [V2.0 Research Mode Design](../docs/plans/2026-01-19-v2-research-mode-design.md)
- [Search Requirements](./search-requirements.md)

---

## Source

IBOS classification is based on standard Dutch government policy domain categorization. Reference: Rijksoverheid beleidsterreinen indeling.
