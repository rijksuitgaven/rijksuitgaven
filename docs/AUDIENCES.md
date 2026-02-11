# Target Audiences

**Project:** Rijksuitgaven.nl
**Created:** 2026-01-30
**Updated:** 2026-02-03
**Status:** Draft - For Discussion

---

## Overview

Understanding who uses Rijksuitgaven.nl and why they use it.

---

## Current User Base (V1)

Based on user research (50 existing users):

| Segment | Percentage | Primary Need |
|---------|------------|--------------|
| Political staff | 50% | Oversight, policy development |
| Journalists | 25% | Investigations, stories |
| Researchers | 25% | Analysis, academic work |

**Core question all users ask:** "Where does the money go, and does it work?"

---

## User Archetypes

### Hunters vs Grazers

| Type | Behavior | Entry Point | Example |
|------|----------|-------------|---------|
| **Hunters** | Know what they're looking for | Search by recipient | "Show me ProRail spending" |
| **Grazers** | Want insights delivered | Browse by theme | "What's happening in defensie?" |

**Key insight:** Theme landing pages (V3) serve BOTH:
- Hunters get quick entry to domain
- Grazers get ready-made insights

---

## Audience Segments

### 1. Political Staff (Opposition)

**Who:** Researchers and advisors for opposition parties (Tweede Kamer)

**Need:** Find ammunition for parliamentary questions, oversight

**Behavior:**
- Search for specific recipients or ministries
- Track spending trends over time
- Export data for internal reports
- Time-sensitive (debates, questions)

**Value proposition:** "Find the story in the numbers"

**Version fit:** V1 (Search) + V2 (Reporter) + V3 (Themes)

---

### 2. Investigative Journalists

**Who:** Journalists at major outlets (NRC, Volkskrant, Follow the Money, etc.)

**Need:** Find stories, verify claims, deep investigations

**Behavior:**
- Complex multi-step research
- Cross-reference multiple modules
- Need context (legislation, history)
- Long research cycles (weeks/months)

**Value proposition:** "Uncover what others miss"

**Version fit:** V1 + V2 (Reporter) + V3 + V5 (AI Research) + V6 (Workspace)

---

### 3. News Journalists

**Who:** Daily news reporters, regional media

**Need:** Quick facts for breaking stories

**Behavior:**
- Fast lookups
- Simple questions
- Deadline pressure
- Less depth, more speed

**Value proposition:** "Get facts in seconds"

**Version fit:** V1 (Search) + V2 (Reporter - daily briefing!) + V3 (Themes)

---

### 4. Organization Admins (V1 - Current)

**Who:** Organization owners/managers with admin role

**Need:** Manage team members, subscriptions, access control

**Behavior:**
- Add new members to organization subscription
- Edit member details (name, email)
- Deactivate members when they leave
- Monitor subscription status (dashboard)
- Send invite emails to new members

**Access:**
- `/team` - Admin dashboard with organization metrics
- `/team/leden` - Member management page (add/edit/deactivate)
- Service role API access (bypasses RLS)

**Role Management:**
- Role column in subscriptions table: `'member'` or `'admin'`
- Admin-only routes protected by role check
- Admin API endpoints require admin role

**Value proposition:** "Manage your team's access efficiently"

**Version fit:** V1 (current)

**Technical:**
- RLS policies enforce row-level access
- Service role client bypasses RLS for admin operations
- Admin checks in middleware + API routes

---

### 5. Academic Researchers

**Who:** University researchers, PhD students, policy institutes

**Need:** Data for academic analysis, longitudinal studies

**Behavior:**
- Bulk data needs
- Methodical approach
- Citation requirements
- Long timelines

**Value proposition:** "Reliable data for rigorous research"

**Version fit:** V1 + V5 (AI Research) + V6 (save/export)

---

### 6. Government (Internal)

**Who:** Municipalities, provinces, ministries

**Need:** Benchmark, policy development, internal oversight

**Behavior:**
- Compare with peers
- Track own spending
- Prepare reports
- Compliance needs

**Value proposition:** "Know where you stand"

**Version fit:** V1 + V3 + custom features

---

### 7. Compliance Officers (V8 - Future)

**Who:** Banks, insurers, accountants (KYC/AML teams)

**Need:** Due diligence, fraud detection, regulatory compliance

**Behavior:**
- Screen recipients against watchlists
- Map organizational networks
- Identify conflicts of interest
- Automated monitoring

**Value proposition:** "See who's behind the money"

**Version fit:** V8 (Rijksnetwerken)

---

### 8. Mainstream Parties (V3 - Future)

**Who:** Researchers for coalition/governing parties

**Need:** Policy development, understanding spending landscape

**Behavior:**
- Theme-first exploration
- Less adversarial than opposition
- Policy impact analysis
- Long-term planning

**Value proposition:** "Understand the full picture"

**Version fit:** V3 (Themes) + V5 (AI Research)

---

## Audience Evolution by Version

| Version | Primary Audience | New Audience |
|---------|------------------|--------------|
| **V1** | Opposition, journalists, researchers | - |
| **V2** | Same + daily briefing recipients | Passive consumers (email) |
| **V3** | + Mainstream parties, mainstream media | Theme-first users |
| **V4** | + Self-service analysts | Dashboard builders |
| **V5** | + Deep researchers | AI-comfortable users |
| **V6** | + Teams, newsrooms | Collaborative users |
| **V7** | + Legal researchers | Context seekers |
| **V8** | + Banks, compliance | B2B enterprise |
| **V9** | + International | European market |

---

## V2 Reporter - Audience Fit

The Rijksuitgaven Reporter (V2) is particularly valuable for:

| Audience | Why Reporter Helps |
|----------|-------------------|
| **Journalists** | Story angles delivered daily, connected to spending data |
| **Beleidsmedewerkers** | Dossier context with relevant regelingen, trends |
| **Opposition staff** | Ammunition delivered to inbox, less searching needed |

**Key insight:** Reporter converts passive users into engaged daily readers.

---

## User Research Gaps

**What we don't know yet:**

- [ ] Detailed job-to-be-done per segment
- [ ] Willingness to pay by segment
- [ ] Feature priority by segment
- [ ] Competitive alternatives used
- [ ] Pain points with current solution

**Recommended research:**

1. Interview 5-10 users per segment
2. Survey all 50 existing users
3. Analyze usage patterns (when V1 launches)
4. Competitive analysis

---

## Discussion Points

1. **Priority segments:** Focus on opposition + journalists first?
2. **Government market:** Large opportunity but long sales cycles?
3. **Compliance market (V8):** Separate go-to-market needed?
4. **Academic discount:** Worth the lower revenue?
5. **International (V9):** Partner-led or direct?

---

**Document maintained by:** Product Owner
**Last updated:** 2026-02-11
