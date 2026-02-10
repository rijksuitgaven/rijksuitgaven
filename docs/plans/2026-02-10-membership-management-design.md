# Membership Management Design

**Date:** 2026-02-10
**Status:** Approved
**Scope:** V1.0

---

## Overview

Manual-first membership management system. Invoicing happens in external accounting software (Moneybird/Exact). Rijksuitgaven stores subscription data for access control and eventual admin panel.

Optimized for manual invoicing (B2B, government). Stripe auto-renewal is a future nice-to-have, not V1.

---

## Data Model

### `subscriptions` table

```sql
CREATE TABLE subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  organization    text,
  plan            text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  grace_ends_at   date NOT NULL,
  cancelled_at    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Key decisions:**
- `user_id` is unique — one subscription per user (no history table, YAGNI)
- `email` denormalized for quick lookup in admin pages (no join to auth.users)
- `role` column for admin access (`'member'` | `'admin'`)
- `cancelled_at` for manual deactivation before end date
- `notes` for internal scratchpad (invoice refs, special arrangements)
- No invoice data — lives in accounting software
- No status column — status is computed from dates (see Access Control)

**Grace period by plan:**

| Plan    | Price     | Grace period | `grace_ends_at`      |
|---------|-----------|-------------|----------------------|
| Monthly | €150/mo   | 3 days      | `end_date + 3 days`  |
| Yearly  | €1,500/yr | 14 days     | `end_date + 14 days` |

---

## Access Control

### Status computation (no stored status — dates are source of truth)

```
cancelled_at is set          → expired (blocked)
today <= end_date            → active
today <= grace_ends_at       → grace (access + warning banner)
today > grace_ends_at        → expired (blocked)
```

### Middleware flow

```
Request comes in
  → Check auth cookie (existing flow)
  → No session? → /login
  → Has session? → Compute subscription status from dates
    → active    → Allow access
    → grace     → Allow access + show warning banner
    → expired   → Redirect to /verlopen
    → no row    → Redirect to /verlopen
```

### Performance

- Subscription data (end_date, grace_ends_at, cancelled_at, role) cached alongside auth session
- Refreshed via `useAuth()` hook (extends existing pattern)
- No per-request database query beyond what auth already does

---

## User-Facing Pages

### `/profiel` — Subscription info

- Email address
- Name + Organization
- Plan type: "Maandelijks" or "Jaarlijks"
- End date: "Uw abonnement loopt tot [date]"
- During grace: warning text in red
- "Uitloggen" button
- Contact link: "Wilt u uw abonnement wijzigen? Neem contact op."
- No self-service plan changes, no payment history, no cancel button

### `/verlopen` — Expired page

- "Uw abonnement is verlopen op [date]"
- "Neem contact op voor verlenging" + email/phone
- Logout button
- No access to any module

### Warning banner (grace period)

- Shown on every page during grace period
- Yearly: "Uw abonnement verloopt op [date]. Neem contact op voor verlenging."
- Monthly: "Uw abonnement is verlopen. Neem binnen [X dagen] contact op voor verlenging."
- Dismissable per session (returns on next visit)
- Top of page, not a modal

---

## Admin Pages (`/team`)

### Access control

- Check `role = 'admin'` from subscriptions table
- No role system beyond member/admin
- Add admins by updating the role column in `/team/leden`

### `/team` — Dashboard

- Total active users count
- Expiring within 30 days (list with names + end dates)
- Users in grace period (needs attention)
- Quick link to "Nieuw lid toevoegen"

### `/team/leden` — Member management

- Table: Name, Organization, Email, Plan, Status (computed), End date
- Default sort: soonest expiry first
- Click row to edit: change plan, extend end date, add notes, deactivate
- "Nieuw lid" button → form:
  - Email, first name, last name, organization, plan, start date
  - End date auto-calculated from plan
  - Grace period auto-calculated from plan
- Creating a member does two things:
  1. Creates Supabase Auth user (triggers magic link invite email)
  2. Creates subscription row

### What we're NOT building (V1)

- No invoice management (accounting software)
- No email sending for renewals (manual)
- No usage analytics
- No self-service signup
- No Stripe integration

---

## Future expansion (`/team` namespace)

- `/team/statistieken` — Usage stats, logins, popular modules
- `/team/facturen` — Invoice tracking (when needed)
- Stripe integration for self-service monthly subscribers

---

## Implementation order

1. SQL migration: create `subscriptions` table
2. Middleware: subscription check + redirect logic
3. `/verlopen` page
4. Warning banner component
5. `/profiel` page updates (show plan info)
6. `/team/leden` — member list + add form
7. `/team` — dashboard
8. CSV import script for WordPress migration (~50 users)
