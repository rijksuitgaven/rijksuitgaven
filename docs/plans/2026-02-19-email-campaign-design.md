# Email Campaign System Design

**Date:** 2026-02-19
**Status:** Approved
**Related:** Backlog item "Email Campaign Management (Resend Broadcasts)"

---

## Overview

Replace WordPress/Mailster email campaigns with Resend Broadcasts. Compose and send campaigns entirely in Resend Dashboard. Build a lightweight `/team/mail` admin page for audience sync management and list counts.

## Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   /team/mail page    │     │   Resend Dashboard   │
│                      │     │                      │
│  4 list count cards  │     │  Pick template       │
│  [Synchroniseren]    │────▶│  Select segment      │
│  [Open Resend ↗]     │     │  Compose content     │
│                      │     │  Add images/GIFs     │
│  Last sync timestamp │     │  Test email          │
│  Resend contact count│     │  Send / Schedule     │
│                      │     │  View stats          │
└──────────┬───────────┘     └──────────────────────┘
           │
           │ POST /api/v1/team/mail/sync
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│   Supabase           │     │   Resend Contacts    │
│                      │     │                      │
│  people table        │────▶│  Audience contacts   │
│  subscriptions table │     │  with segment IDs    │
│                      │     │                      │
└──────────────────────┘     └──────────────────────┘
```

## Four Lists (Segments)

| Segment | Source logic | Use case |
|---------|-------------|----------|
| Per maand | `subscriptions.plan = 'monthly'` + active | Product updates, upsell to yearly |
| Per jaar | `subscriptions.plan = 'yearly'` + active | Product updates, renewal reminders |
| Churned | Has subscription with `cancelled_at` set | Win-back campaigns |
| Prospects | People with no active subscription | Conversion campaigns |

Each segment is created in Resend Dashboard. Segment IDs stored as env vars.

**Mapping rules:**
- Active monthly subscription → `per_maand`
- Active yearly subscription → `per_jaar`
- Cancelled/expired subscription → `churned`
- No subscription, or trial only → `prospects`
- Archived contacts (`archived_at IS NOT NULL`) → NOT synced (removed from Resend)

## Branded Email Template

Stored in Resend as a reusable template. Selectable via "Pick a template" when composing a broadcast.

### Template structure

```
┌─────────────────────────────────────────┐
│           Light blue bg #E1EAF2         │
│                                         │
│          [Rijksuitgaven logo]           │
│              220px wide                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        White card #FFFFFF          │  │
│  │                                   │  │
│  │  [Content area]                   │  │
│  │                                   │  │
│  │  Supports:                        │  │
│  │  - Headings                       │  │
│  │  - Body text (bold, links, lists) │  │
│  │  - Images / GIFs (full-width)     │  │
│  │  - CTA button (pink #D4286B)      │  │
│  │  - Dividers                       │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Rijksuitgaven.nl                       │
│  Het Maven Collectief                   │
│  KvK: 96257008                          │
│  contact@rijksuitgaven.nl               │
│                                         │
│  Afmelden: {{{RESEND_UNSUBSCRIBE_URL}}} │
│                                         │
└─────────────────────────────────────────┘
```

### From address

`Rijksuitgaven <contact@rijksuitgaven.nl>`

### Design tokens

| Element | Value |
|---------|-------|
| Background | `#E1EAF2` |
| Card | `#FFFFFF`, border-radius 8px, padding 40px 36px |
| Heading | `#0E3261`, 22px, bold |
| Body text | `#4a4a4a`, 15px, line-height 24px |
| CTA button | `#D4286B`, border-radius 6px, padding 14px 48px, white text 16px bold |
| Footer text | `#8a8a8a`, 13px |
| Link color | `#436FA3` |
| Logo | 220px wide, hosted at `{siteUrl}/logo.png` |
| Max width | 480px |

Matches existing magic link and welcome email templates.

## `/team/mail` Page

### Layout

```
/team/mail
┌─────────────────────────────────────────────┐
│ TeamNav: [...] [E-mail]                     │
├─────────────────────────────────────────────┤
│                                             │
│  E-mail                                     │
│                                             │
│  ┌──────────┐ ┌──────────┐                  │
│  │ Per maand│ │ Per jaar │                  │
│  │    12    │ │     3    │                  │
│  ├──────────┤ ├──────────┤                  │
│  │ Prospects│ │ Churned  │                  │
│  │    28    │ │     5    │                  │
│  └──────────┘ └──────────┘                  │
│                                             │
│  [Nieuw bericht ↗]       [Synchroniseren]   │
│                                             │
│  Laatst gesynchroniseerd: 19 feb 09:14      │
│  Resend contacten: 48                       │
│                                             │
│  [Open Resend Dashboard ↗]                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Components

- **4 count cards** — live from Supabase, same computed status logic as leden page
- **"Nieuw bericht"** — external link to Resend Dashboard broadcast compose
- **"Synchroniseren"** — triggers full backfill/resync via `POST /api/v1/team/mail/sync`
- **Last sync timestamp** — stored in Supabase (simple key-value or derived from most recent sync)
- **Resend contact count** — returned from sync endpoint
- **"Open Resend Dashboard"** — link to `https://resend.com/broadcasts` (stats, sent campaigns)

## Sync Implementation

### Backfill endpoint: `POST /api/v1/team/mail/sync`

Admin-only. Full reconciliation of Supabase people → Resend Contacts.

```
1. Query all people LEFT JOIN subscriptions
   WHERE people.archived_at IS NULL

2. For each person, compute target segment:
   - monthly active → RESEND_SEGMENT_MAAND
   - yearly active  → RESEND_SEGMENT_JAAR
   - cancelled      → RESEND_SEGMENT_CHURNED
   - no sub / trial → RESEND_SEGMENT_PROSPECTS

3. For each person:
   a) If no resend_contact_id → create contact with segment
   b) If has resend_contact_id → update contact (name, segment)

4. For archived people with resend_contact_id:
   → delete from Resend, clear resend_contact_id

5. Return { synced: N, created: N, updated: N, removed: N }
```

Concurrency: 5 parallel API calls. ~50 contacts finishes in ~2 seconds.

### Ongoing sync triggers

Update `resend-audience.ts` to include segment assignment on every sync action:

| Trigger | Action | Segment |
|---------|--------|---------|
| Add member (POST /team/leden) | Create/update contact | Based on plan |
| Add contact (POST /team/contacten) | Create contact | prospects |
| Cancel subscription ("Opzeggen") | Update contact | churned |
| Archive contact | Delete from Resend | — |
| Convert contact to member | Update contact | Based on plan |
| Update subscription plan | Update contact | New plan segment |

### Resend Contacts API usage

```typescript
// Create with segment
await resend.contacts.create({
  audienceId: RESEND_AUDIENCE_ID,
  email: person.email,
  firstName: person.first_name,
  lastName: person.last_name,
  segments: [{ id: targetSegmentId }],
})

// Update segment (remove old, add new)
await resend.contacts.update({
  audienceId: RESEND_AUDIENCE_ID,
  id: person.resend_contact_id,
  segments: [{ id: newSegmentId }],
})
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `RESEND_API_KEY` | Railway frontend | Already configured |
| `RESEND_AUDIENCE_ID` | Railway frontend | Already configured |
| `RESEND_SEGMENT_MAAND` | Railway frontend | New — monthly segment ID |
| `RESEND_SEGMENT_JAAR` | Railway frontend | New — yearly segment ID |
| `RESEND_SEGMENT_CHURNED` | Railway frontend | New — churned segment ID |
| `RESEND_SEGMENT_PROSPECTS` | Railway frontend | New — prospects segment ID |

## Email Statistics

Viewed in Resend Dashboard (per-broadcast: opens, clicks, bounces, unsubscribes). Not pulled into our app for V1.0.

Future V1.1: Resend webhooks → store in Supabase → show in `/team/mail`.

## Manual Setup Steps (Resend Dashboard)

1. Create 4 segments in Resend: Per maand, Per jaar, Churned, Prospects
2. Note segment IDs → set as Railway env vars
3. Create branded HTML template in Resend (paste template HTML)
4. Run first sync from `/team/mail`
5. Compose test broadcast, send to yourself

## Campaign Workflow (Ongoing)

```
1. /team/mail → verify list counts look correct
2. Click "Nieuw bericht" → opens Resend Dashboard
3. Pick branded template
4. Select target segment (or multiple)
5. Write subject, compose content (text, images, CTA)
6. Click "Test email" → verify in your inbox
7. Click "Send" (or schedule)
8. View stats in Resend Dashboard
```

## Implementation Tasks

| # | Task | Effort |
|---|------|--------|
| 1 | Create 4 segments in Resend Dashboard + note IDs | 10 min |
| 2 | Add 4 segment env vars to Railway | 5 min |
| 3 | Create branded HTML template in Resend | 30 min |
| 4 | Update `resend-audience.ts` — add segment assignment | 30 min |
| 5 | Build `POST /api/v1/team/mail/sync` backfill endpoint | 1h |
| 6 | Build `/team/mail` page (counts, sync button, links) | 1.5h |
| 7 | Add "E-mail" tab to TeamNav | 5 min |
| 8 | Wire ongoing sync triggers (leden, contacten, cancel, archive, convert) | 1h |
| 9 | Test: sync, compose, test email, verify segments | 30 min |
| **Total** | | **~5 hours** |
