# Email System: "Send to Remaining" + Gap Analysis

**Date:** 2026-02-21
**Status:** Approved design, not yet implemented
**A-track:** A1.1 (Bulk & CRM)

---

## Problem

When a campaign is sent (e.g., onboarding email to all new members), people who join after that send miss the email. There's no way to resend to those who haven't received it.

## Expert Team Review

| Role | Perspective |
|------|-------------|
| Email Deliverability Engineer | Resend API limits, bounce handling, sender reputation |
| CRM/Marketing Automation Architect | Drip campaigns, sequences, lifecycle triggers |
| Database Engineer | Schema design, deduplication, query performance |
| Privacy/GDPR Specialist | Consent tracking, data retention, unsubscribe compliance |
| Adversarial Strategist | Edge cases, failure modes, wrong assumptions |

## Gap Analysis (verified against codebase)

| Gap | Impact | Severity |
|-----|--------|----------|
| No `campaign_recipients` table | Can't determine who already received a campaign | Critical for resend |
| No triggered/sequence emails | New members miss onboarding campaigns | Core ask |
| No bounce auto-suppress | Sending to bounced addresses hurts sender reputation | Deliverability risk |
| No segment auto-reassignment | Person changes status but stays in old Resend segment | Wrong audience |
| No per-person send history | Admin can't see "what emails did person X receive?" | CRM blind spot |
| No campaign cooldown | Same person could receive 3 campaigns in 1 day | Spam perception |

---

## Approved Design: Campaign Recipients + "Verstuur naar overige"

### 1. Campaign Recipients Table

```sql
CREATE TABLE campaign_recipients (
  campaign_id  UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  person_id    UUID REFERENCES people(id) ON DELETE CASCADE,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, person_id)
);
```

**Verified:**
- Composite PK prevents double-sends (INSERT fails on duplicate)
- Race condition mitigation: insert recipient row BEFORE calling Resend, delete on send failure
- Backfill existing campaigns from `campaign_events` (delivered events have person_id)

### 2. "Verstuur naar overige" Button

When admin clicks on a sent campaign:
1. Query current segment members
2. Subtract `campaign_recipients` for that campaign_id
3. Show count: "14 nieuwe ontvangers"
4. Send only to the delta

**Verified:**
- Unsubscribed users filtered out (segment query checks `unsubscribed_at IS NULL`)
- Content staleness is admin's decision (they see content before resending)
- Consent is per-segment, not per-campaign — no additional consent needed

### 3. Bounce Auto-Suppress (A1.1)

Update webhook handler to mark bounced addresses. Exclude from future sends.

### 4. Sequences (Deferred to A2.0)

Full automation (trigger events, delay steps, enrollment tracking) deferred. The "Send to Remaining" pattern handles the onboarding use case manually with zero new infrastructure beyond the recipients table.

**Adversarial validation:** Don't build sequences until "Send to Remaining" has been used 10+ times and the manual process becomes painful. Over-automating email for <100 users adds complexity without proportional value.

---

## Implementation Priority

| Priority | What | Complexity |
|----------|------|------------|
| A1.1 | `campaign_recipients` table + "Verstuur naar overige" button | Low |
| A1.1 | Bounce auto-suppress | Low |
| A1.2 | Per-person email timeline in `/team/contacten/[id]` | Medium |
| A2.0 | Automated sequences | High |

---

## Key Files (current email system)

- Campaign send: `app/src/app/api/v1/team/mail/send/route.ts`
- Campaign template: `app/src/app/api/_lib/campaign-template.ts`
- Resend audience sync: `app/src/app/api/_lib/resend-audience.ts`
- Webhook handler: `app/src/app/api/v1/webhooks/resend/route.ts`
- People table migration: `scripts/sql/045-people-table.sql`
- Campaigns migration: `scripts/sql/059-campaigns.sql`
- Campaign events migration: `scripts/sql/060-campaign-events.sql`
