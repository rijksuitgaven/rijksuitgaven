# Product Tiers

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Status:** Draft - For Discussion

---

## Overview

Tiers control ACCESS to versions. Each tier unlocks specific capabilities.

---

## Current Tiers

| Tier | Price | Version Access | Target Audience |
|------|-------|----------------|-----------------|
| **Pro** | €1,500/year | V1 + V2 | Journalists, researchers, opposition parties |
| **Research** | TBD | V1 + V2 + V3 + V4 | Investigative journalists, policy analysts |
| **Voor Overheden** | €9,000+/year | V1-V5 + municipality features | Municipalities, provinces |
| **Voor Universiteiten** | €3,000+/year | V1-V5 + academic features | Universities, research institutes |
| **Rijksnetwerken** | €25,000+/year | V6 (compliance/KYC module) | Banks, insurers, accountants |
| **Franchise** | License fee | V7 (white-label European) | International partners |

---

## Tier Details

### Pro (€1,500/year or €150/month)

**Current tier - V1 launch**

**Pricing:**
- Monthly: €150/month
- Yearly: €1,500/year (€125/month equivalent, 17% discount)

**Includes:**
- Fast keyword search (<25ms via Typesense)
- All 7 modules
- Advanced filters (cascading bidirectional filters)
- Year columns with trend indicators
- CSV export (500 rows max)
- URL sharing
- Magic Link authentication
- Admin member management (organization owners)

**Subscription Management:**
- Status computed from dates (active/grace/expired)
- Grace periods: 3 days (monthly), 14 days (yearly)
- No manual status updates or cron jobs required
- Admin dashboard at /team (view metrics)
- Member management at /team/leden (add/edit/deactivate members)
- Service role bypasses RLS for admin operations

**Database:**
- `subscriptions` table with user_id (FK to auth.users), email, name, org, plan, role ('member'|'admin'), dates
- RLS policies enforce row-level access control
- Middleware checks subscription status on every page request

**V2 adds:**
- Theme landing pages (/thema/defensie, etc.)
- IBOS domain navigation
- Basic visualizations

**Target:** Journalists, researchers, political staff (opposition)

---

### Research (Price TBD)

**V3 launch**

**Includes everything in Pro, plus:**
- AI Research Mode (/research page)
- Natural language queries
- AI-generated visualizations
- Save research sessions
- Share read-only links
- Export to Excel, PDF

**Target:** Deep researchers, investigative journalists, policy analysts

**Pricing considerations:**
- [ ] Premium over Pro - how much?
- [ ] Usage-based (AI queries)?
- [ ] Flat rate?

---

### Voor Overheden (€9,000+/year)

**Government tier**

**Includes everything in Research, plus:**
- Municipality-specific features (TBD)
- Bulk data access?
- Custom reports?
- Priority support?

**Target:** Municipalities, provinces, government bodies

**Open questions:**
- [ ] What municipality-specific features?
- [ ] Different pricing per organization size?
- [ ] Multi-user access included?

---

### Voor Universiteiten (€3,000+/year)

**Academic tier**

**Includes everything in Research, plus:**
- Academic-specific features (TBD)
- API access for research?
- Bulk export for analysis?
- Citation-friendly exports?

**Target:** Universities, research institutes, students (via institution)

**Open questions:**
- [ ] What academic-specific features?
- [ ] Per-institution or per-researcher?
- [ ] Student access model?

---

### Rijksnetwerken (€25,000+/year)

**V6 - Network Analysis module**

**Separate product tier for compliance market**

| Sub-tier | Price | Features |
|----------|-------|----------|
| Monitoring | €25,000/year | Dataset access, alerts |
| API Access | €50,000/year | Custom queries, integration |
| Enterprise | €100,000+/year | Full access, support, SLA |

**Includes:**
- KvK integration (board members, directors)
- Address clustering
- Network visualization
- PEP flagging
- Overlap detection
- Compliance reporting

**Target:** Banks (KYC/AML), insurers, accountants, auditors, regulators

**Market:** 40-60 organizations in NL
**ARR potential:** €1.1M (conservative)

---

### Franchise (License)

**V7 - European expansion**

**White-label platform for international partners**

**Includes:**
- Multi-tenant architecture
- Localization framework
- Country-specific data schemas
- Partner portal
- Revenue sharing

**Target:** International media, transparency organizations, governments

**Open questions:**
- [ ] License fee structure?
- [ ] Revenue share percentage?
- [ ] Support model?

---

## Discussion Points

### Pricing Strategy

1. **Pro tier validated?** €1,500/year tested with current users?
2. **Research premium:** How much more than Pro? 2x? 3x?
3. **Government willingness to pay:** €9,000 realistic?
4. **Academic budgets:** €3,000 affordable for universities?

### Feature Bundling

1. **What separates Pro from Research?** Just AI, or more?
2. **Government vs Academic:** Same features, different price?
3. **Rijksnetwerken standalone?** Or requires Pro subscription?

### Open Questions

- [ ] Free tier? Limited search for awareness?
- [ ] Trial period? How long?
- [ ] Monthly vs annual only?
- [ ] Multi-user pricing?
- [ ] Non-profit discount?

---

---

## Technical Implementation Notes

### Membership System Architecture

**Status Lifecycle:**
```
active → grace → expired
```

**Status Computation (no status column):**
- `cancelled_at` is set → expired
- `today <= end_date` → active
- `today <= grace_ends_at` → grace (3d monthly / 14d yearly)
- else → expired

**Grace Period Calculation:**
- Monthly: 3 days after `end_date`
- Yearly: 14 days after `end_date`
- Computed dynamically, no cron jobs

**Admin Features:**
- Role column: `'member'` or `'admin'`
- Admin-only pages: `/team` (dashboard), `/team/leden` (member management)
- Service role client at `app/api/_lib/supabase-admin.ts` bypasses RLS
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var on Railway frontend

**Middleware Protection:**
1. Check auth (Supabase session)
2. Check subscription (query subscriptions table)
3. If expired → redirect to `/verlopen`
4. If grace → show banner

**No subscription row = allow access** (safe default during setup)

---

**Document maintained by:** Product Owner
**Last updated:** 2026-02-11
