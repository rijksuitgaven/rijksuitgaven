# Marketing Pages Requirements

**Created:** 2026-01-20
**Updated:** 2026-02-11 (status verification)
**Version:** V1.0
**Source:** Brainstorm session

**Status:** ⏳ PLANNED FOR WEEK 8-9 (not yet built)
**Current State:** Only privacy policy page (`/privacybeleid`) is implemented. Marketing pages (homepage, pricing, about, contact, support) are planned for Week 8 sprint before public launch.

---

## Overview

Marketing and public pages for rijksuitgaven.nl. Built as simple Next.js components without a CMS - content edited directly in code.

---

## Decision: No CMS

| Factor | Decision |
|--------|----------|
| Team size | Solo founder |
| Content changes | Infrequent |
| Technical ability | Can edit React components |
| Speed priority | No time for CMS setup/learning |
| Maintenance | One less system to maintain |

**Content editing workflow:** Edit component file → commit → deploy

---

## Pages

### 1. Homepage (Public)

**URL:** `/`

**Purpose:** Convert visitors to demo requests / subscriptions

**Content (port from current WordPress):**

| Section | Content |
|---------|---------|
| Hero | "Overheidsbestedingen snel tot in detail doorzoeken en vergelijken" |
| Tagline | "Rijksuitgaven is hét onafhankelijke platform voor inzicht in overheidsuitgaven" |
| Value Props | 3 cards: Zoek/filter, Patronen ontdekken, Vergelijken |
| B2G Section | "Rijksuitgaven voor Overheden" offering |
| Sample Data | Live table preview (connect to API) |
| Features Grid | 6 features with icons |
| Pricing | Professional subscription details |
| Custom | "Op maat" enterprise offering |
| Demo CTA | Contact form / booking |
| Footer | Links, social |

**Implementation:**
```
/app/page.tsx
├── <Hero />
├── <ValueProps />
├── <B2GSection />
├── <SampleDataTable />
├── <FeaturesGrid />
├── <PricingSection />
├── <CustomSection />
├── <DemoRequest />
└── <Footer />
```

**Note:** Keep all content identical to current WordPress site.

---

### 2. Pricing Page

**URL:** `/pricing`

**Content:**
- Professional: €150/month or €1,500/year (ex VAT)
- Features included
- "Op maat" for organizations
- FAQ about pricing
- CTA to demo/contact

---

### 3. Support Pages

**URL:** `/support`, `/support/[slug]`

**Content:**
- Getting started guide
- FAQ
- Data sources explanation
- Export guide
- Feature documentation

**Implementation:**
- Markdown files in `/content/support/`
- Rendered by Next.js at build time
- Simple search/filter on support index page

```
/content/support/
├── getting-started.md
├── faq.md
├── data-sources.md
├── export-guide.md
└── modules/
    ├── instrumenten.md
    ├── apparaat.md
    └── ...
```

---

### 4. About Page

**URL:** `/about`

**Content:**
- What is Rijksuitgaven
- Mission/vision
- Data sources and methodology
- Team/founder info (optional)

---

### 5. Contact Page

**URL:** `/contact`

**Content:**
- Contact form (simple: name, email, message)
- Email address
- Response time expectation

**Form handling:** Supabase function or simple email service (Resend, Postmark)

---

### 6. Demo Booking

**URL:** `/demo`

**Options:**
- Calendly embed (self-service scheduling)
- Or: Contact form with "Request demo" option

**Recommendation:** Calendly embed - reduces back-and-forth

---

### 7. Login Page

**URL:** `/login`

**Content:**
- Magic Link form (enter email, receive login link)
- "Forgot password" link
- Link to pricing/demo for non-subscribers

**Implementation:** Supabase Auth UI or custom form

---

### 8. Terms & Privacy

**URLs:** `/terms`, `/privacy`

**Content:** Legal pages (static text)

---

## Shared Components

### Header/Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│ Logo    Overzicht | Integraal | Modules ▼ | Support | Login    │
└─────────────────────────────────────────────────────────────────┘
```

**Public (not logged in):**
- Logo → Home
- Features
- Pricing
- Support
- Login / Demo button

**Logged in:**
- Logo → Overzicht
- Overzicht
- Integraal
- Modules dropdown
- Support
- Account

### Footer

- Navigation links
- Social links
- Legal links (Terms, Privacy)
- Copyright

---

## Technical Implementation

### Stack
- Next.js App Router
- Tailwind CSS
- shadcn/ui components (optional)
- No CMS

### Build Approach

1. **v0.dev** - Generate initial component designs
2. **Claude Code** - Integrate, add logic, connect to API
3. **Direct editing** - Update content in component files

### Performance Goals
- Homepage: <1s load time
- Lighthouse score: >90

### SEO
- Meta tags per page
- Open Graph tags
- Sitemap.xml
- robots.txt

---

## Content Language

All content in Dutch. Same text as current WordPress site.

---

## Not Included (Post-V1.0)

- Blog
- Newsletter signup
- Multi-language support
- A/B testing
- Analytics dashboard (use Plausible or similar)

---

## Related Documents

- [Current Homepage Archive](../03-wordpress-baseline/web-archives/01-Home-not logged in.html)
- [Overzicht Page Requirements](./overzicht-page-requirements.md)
