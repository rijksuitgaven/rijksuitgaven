# Rijksuitgaven Reporter - Design Document

**Created:** 2026-02-03
**Version:** V2.0
**Status:** Approved Design

---

## Overview

A daily midday email that connects breaking news to government spending data. An AI agent scans news sources, extracts relevant topics, searches your existing database, and delivers a personalized briefing based on the user's profession.

**Core insight:** Instead of pre-classifying 500K recipients into themes (expensive, inaccurate), we classify the *news* and search existing data dynamically. The rich text fields (regeling, omschrijving, trefwoorden, beleidsterrein) become the matching surface.

---

## Value Proposition

| Profession | What they get |
|------------|---------------|
| **Journalist** | Story angles backed by spending data. "Kabinet praat over wolven - hier is wie er €2.3M aan ontving" |
| **Beleidsmedewerker** | Dossier context. Relevant regelingen, 5-year trends, links to Kamerstukken |

---

## V2.0 Scope

| Feature | Included |
|---------|----------|
| Profession templates | 2 (Journalist, Beleidsmedewerker) |
| Items per email | 3-5 focused items |
| Delivery time | Midday (12:00-12:30) |
| AI analysis level | Light (data + insights, not full articles) |
| Signup | Platform users only, opt-in |
| News sources | Free RSS (government + news) |

**Success metrics:**
- Open rate >40%
- Click-through rate >15%
- User retention (still subscribed after 30 days) >70%

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   News Sources  │────▶│   AI Processor  │────▶│  Your Database  │
│   (RSS feeds)   │     │    (Claude)     │     │   (Typesense)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Email Service  │◀────│ Template Engine │
                        │    (Resend)     │     │  (per profession)│
                        └─────────────────┘     └─────────────────┘
```

**Processing steps:**

1. **Collect** (6:00-10:00) - Cron job fetches RSS feeds every 30 min, stores new articles
2. **Process** (10:00-11:00) - Claude analyzes articles, extracts keywords & entities, scores relevance
3. **Match** (11:00-11:30) - Search Typesense with extracted keywords, aggregate results across modules
4. **Generate** (11:30-12:00) - Apply profession template, generate light insights per match
5. **Send** (12:00-12:30) - Deliver personalized emails via Resend

---

## News Sources (V2.0)

| Source | RSS URL | Type | Est. volume |
|--------|---------|------|-------------|
| Rijksoverheid.nl | rijksoverheid.nl/rss/nieuws | Government | ~10/day |
| Tweede Kamer | tweedekamer.nl/rss | Parliament | ~15/day |
| NOS Politiek | feeds.nos.nl/nospolitiek | News | ~15/day |
| RTL Nieuws | rtlnieuws.nl/rss/politiek | News | ~10/day |

**~50 articles/day** → After relevance filtering → **~10-15 relevant** → Top **3-5 per email**

---

## AI Processing Pipeline

**Input:** Article title + first 500 words

**Claude Haiku extracts:**
1. Keywords (5-10): `["wolf", "fauna", "provincies", "schade", "beleid"]`
2. Named entities: `["BIJ12", "IPO", "Minister van LNV"]`
3. Theme (IBOS-aligned): `"Natuur en milieu"`
4. Relevance score (0-100): Is this about government spending?
5. Summary (1 sentence): For email preview

**Skip if:**
- Relevance score < 30
- No extractable keywords
- Duplicate of recent article

**Matching logic:**
```
For each keyword/entity:
  → Search Typesense (all collections)
  → Weight: ontvanger match = 100, regeling = 80, other fields = 50
  → Aggregate matches across modules
  → Rank by: match_score × amount (bigger spending = more newsworthy)
```

---

## Email Template

```
Subject: Rijksuitgaven Reporter - [datum] - [top thema]

Header:
┌─────────────────────────────────────────────────────┐
│  RIJKSUITGAVEN REPORTER                             │
│  Dinsdag 4 februari 2026 · Middag editie            │
└─────────────────────────────────────────────────────┘

Per item (3-5 items):
┌─────────────────────────────────────────────────────┐
│  [THEMA BADGE]                                      │
│  Nieuwstitel (link naar artikel)                    │
│                                                     │
│  In de data:                                        │
│  • ProRail B.V. — €461M (Instrumenten)              │
│  • NS Groep — €234M (Instrumenten)                  │
│  • Prorail Infra — €89M (Inkoop)                    │
│                                                     │
│  [AI INSIGHT - profession specific]                 │
│                                                     │
│  → Bekijk details                                   │
└─────────────────────────────────────────────────────┘

Footer:
Instellingen wijzigen · Uitschrijven · Bekijk online
```

**Profession-specific insights:**

| Profession | AI insight example |
|------------|-------------------|
| **Journalist** | "ProRail ontving 12% meer dan vorig jaar. Drie andere infrabedrijven in top 10: BAM, Heijmans, VolkerWessels." |
| **Beleidsmedewerker** | "Valt onder artikel 14.01 Spoorwegen. Gerelateerde regeling: Beheer en Onderhoud Spoor. Trend: +8% sinds 2020." |

**CTA per item:** Links to platform with search pre-filled (`/instrumenten?q=ProRail`)

---

## User Settings

```
Account Settings page:
┌─────────────────────────────────────────────────────┐
│  Rijksuitgaven Reporter                             │
│                                                     │
│  Ontvang dagelijks een briefing over nieuws        │
│  gekoppeld aan overheidsuitgaven.                  │
│                                                     │
│  [Toggle: Aan/Uit]                                  │
│                                                     │
│  Ik werk als:                                       │
│  ○ Journalist                                       │
│  ○ Beleidsmedewerker                               │
│  ○ Anders (generic template)                        │
│                                                     │
│  [Opslaan]                                          │
└─────────────────────────────────────────────────────┘
```

**Onboarding prompt (for new users):**
After first login, show a dismissable card:
> "Nieuw: Ontvang dagelijks nieuws gekoppeld aan uitgavendata → Activeer Reporter"

---

## Database Schema

**New tables:**

```sql
-- Store fetched news articles
CREATE TABLE news_articles (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT NOT NULL,
  published_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- AI analysis results
CREATE TABLE news_analysis (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES news_articles(id),
  keywords TEXT[],
  entities TEXT[],
  theme TEXT,
  relevance_score INT,
  summary TEXT,
  processed_at TIMESTAMP DEFAULT NOW()
);

-- Matches between articles and spending data
CREATE TABLE news_matches (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES news_articles(id),
  module TEXT NOT NULL,
  matched_value TEXT NOT NULL,
  matched_field TEXT NOT NULL,
  match_score INT,
  amount BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for Reporter
CREATE TABLE user_reporter_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  opted_in BOOLEAN DEFAULT FALSE,
  profession TEXT CHECK (profession IN ('journalist', 'beleidsmedewerker', 'other')),
  created_at TIMESTAMP DEFAULT NOW(),
  last_sent_at TIMESTAMP,
  last_opened_at TIMESTAMP
);
```

---

## Technical Implementation

**Codebase location:**

| Component | Location | Technology |
|-----------|----------|------------|
| RSS fetcher | `backend/app/workers/reporter/` | Python + feedparser |
| AI processor | `backend/app/workers/reporter/` | Claude Haiku via Anthropic SDK |
| Email templates | `backend/app/templates/reporter/` | Jinja2 |
| Email sending | `backend/app/services/email.py` | Resend |
| User settings UI | `app/src/app/account/reporter/` | Next.js page |
| Scheduler | Railway cron | Triggers worker jobs |

**New dependencies:**

```
# backend/requirements.txt
feedparser>=6.0.0    # RSS parsing
resend>=0.7.0        # Email delivery
```

**Cron schedule (Railway):**

| Job | Schedule | Duration |
|-----|----------|----------|
| `fetch_news` | Every 30 min (6:00-10:00) | ~1 min |
| `process_news` | 10:00 daily | ~10 min |
| `send_reporter` | 12:00 daily | ~5 min |

**API endpoints:**

```
GET  /api/v1/reporter/preferences     # Get user's settings
POST /api/v1/reporter/preferences     # Update settings
GET  /api/v1/reporter/preview         # Preview today's email (for testing)
```

---

## Cost Estimate

| Service | Monthly cost |
|---------|-------------|
| Claude Haiku (AI) | ~€5-10 |
| Resend (email) | €0 (free tier: 3K/month) |
| Railway (worker) | ~€5 (included in existing) |
| **Total** | **~€10-15/month** |

---

## Future Roadmap

**V2.1 - Reporter Improvements:**
- Add "Anders" profession with generic template
- Topic preferences (user picks: defensie, zorg, onderwijs)
- "Breaking" alerts for high-relevance news (optional)

**V3.0 - Theme Discovery:**
- IBOS domain classification
- Reporter enhanced with semantic theme matching
- Better keyword extraction based on domain context

**V2 + V3 Synergy:**
When Theme Discovery launches, Reporter automatically gets smarter:
- News classified by theme → matches all recipients in that theme
- "Wolven in het nieuws" → finds ALL nature/wildlife recipients, not just those with "wolf" in name

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Classify news vs recipients | News | Recipients hard to classify accurately; news has context |
| News sources | Free RSS | Start simple, expand later |
| Email vs in-app | Email | Higher engagement, simpler to build |
| Profession templates | 2 (Journalist, Beleidsmedewerker) | Focus on engaged user segments |
| AI content level | Light analysis | Build trust before full generation |
| Timing | Midday (12:00) | Captures morning + overnight news |
| Items per email | 3-5 | Quality over quantity |
| Email platform | Resend | Modern, good deliverability, separate from marketing |

---

**Document Status:** Approved
**Next Step:** Add to backlog, implement after V1.0 launch
