# Campaign Features Research — Platform Analysis & Feature Inventory

**Date:** 2026-02-22
**Status:** Research Complete
**Context:** Building professional-grade campaign features inside `/team`, keeping Resend as sending engine

---

## 1. Platform Comparison Summary

### Platforms Analyzed

| Platform | Type | Pricing (500 contacts) | Pricing (5,000) | Key Strength |
|----------|------|----------------------|-----------------|--------------|
| **Resend** | Transactional + broadcast API | $20/mo | $60/mo | Developer DX, webhooks, React Email |
| **Loops** | SaaS marketing email | Free | $49/mo | SaaS-focused, simple, cheap |
| **Customer.io** | Behavioral automation | $100/mo | $100/mo | Best automation, weekday Time Windows |
| **Mailchimp** | Full-service marketing | ~$13/mo | ~$70/mo | Most features, Litmus previews |
| **Brevo** | Multichannel CRM+email | Free (300/day) | $25/mo | EU-based, multichannel |
| **MailerLite** | Creator/SMB email | Free (1K) | $39/mo | Subject line tester, surveys |
| **Postmark** | Transactional only | $15/mo | $15-70/mo | Best deliverability, zero marketing |
| **Mailgun** | Email infrastructure API | $15/mo | $35/mo | Mature API, validation service |
| **SendGrid** | Scale email | Free (trial) | $60-80/mo | Volume, confusing pricing |
| **Beehiiv** | Newsletter platform | $0-49/mo | $49-99/mo | Referral program, ad network |
| **Kit** | Creator platform | Free (1K) | $66/mo | Creator monetization, visual automations |
| **Mailster** | WordPress plugin | One-time €89 | Same | Self-hosted, data sovereignty |

### Decision: Stay on Resend

**Rationale:**
- Already integrated (webhooks, contacts, broadcasts, transactional)
- Webhook infrastructure provides raw data for most features we need
- No second vendor complexity (single sender reputation, one set of API keys)
- Cost-effective ($20-60/mo vs $100+/mo for Customer.io)
- Features we need are UI-over-webhook-data, not platform capabilities

**When to reconsider:**
- 5,000+ users needing behavioral triggers → evaluate Customer.io
- V3 Reporter (multi-channel: email + push + in-app) → evaluate Customer.io
- Rate limit issues (Resend: 2 req/sec) → request higher limit or evaluate alternatives

---

## 2. Resend Capabilities Assessment

### What Resend Does Well

| Capability | Rating | Notes |
|------------|--------|-------|
| Transactional email (API) | ✅ Native | Clean REST API, React Email support |
| Broadcast campaigns | ✅ Native | WYSIWYG editor, audience segments, topics |
| Webhook events (17 types) | ✅ Native | Delivered, opened, clicked, bounced, complained + contact + domain events |
| Per-link click tracking | ✅ Native | `click.link` + `click.userAgent` in webhook payload |
| Idempotency | ✅ Native | `Idempotency-Key` header, 24-hour expiration |
| Scheduling | ✅ Native | `scheduled_at` param, natural language or ISO 8601 |
| RFC 8058 unsubscribe | ✅ Native | Automatic for broadcasts, manual header for transactional |
| Contact management | ✅ Native | Properties, segments, topics |
| Batch sending | ✅ Native | Up to 100 emails per API call |

### What Resend Does NOT Have

| Feature | Rating | Impact |
|---------|--------|--------|
| Drip/sequence campaigns | ❌ | Must build scheduler ourselves |
| Weekday-only scheduling | ❌ | Must build day-of-week check |
| Pre-send quality checks | ❌ | Must build validation layer |
| A/B testing | ❌ | Must split audience + compare manually |
| Engagement scoring | ❌ | Must compute from webhook data |
| Per-contact cross-campaign history | ❌ | Must build from webhook data |
| Email client/device dashboard | ❌ | Must parse UA from click webhooks |
| Campaign comparison | ❌ | Must build comparison UI |
| Click heatmap | ❌ | Must build link ranking UI |
| Dynamic content (if/else blocks) | ❌ | Must render server-side |
| Inbox placement testing | ❌ | External tool (GlockApps, mail-tester.com) |
| Bounce auto-suppress | ❌ | Must flag on webhook event |

### Key Technical Details

- **Rate limit:** 2 req/sec per team (all API keys combined). At 5,000 users this means queuing.
- **Batch endpoint limitations:** No `scheduled_at`, no attachments in batch sends.
- **Max schedule window:** 30 days ahead.
- **Data retention:** Pro plan = 3 days, Scale = 7 days. We must store our own event history.
- **Click webhook payload:** Includes `click.link`, `click.userAgent`, `click.ipAddress`, `click.timestamp`.
- **Open webhook:** Does NOT reliably include user-agent. Open tracking is pixel-based (Apple MPP blocks it).

---

## 3. Industry Feature Inventory

### Pre-Send Quality & Testing

| Feature | Mailchimp | Customer.io | Brevo | MailerLite | Mailster | Our Plan |
|---------|-----------|-------------|-------|------------|---------|----------|
| Spam score check | External (GlockApps) | ❌ | ❌ | ❌ | ❌ | External (mail-tester.com) |
| HTML rendering preview | ✅ Litmus (90+ clients) | ❌ | ⚠️ Basic | ❌ | ❌ | ❌ Not building |
| Link validation | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ Build |
| Image validation (load + alt text) | ✅ | ❌ | ❌ | ❌ | ✅ Screenshot #1 | ✅ Build |
| Authentication check | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ Build |
| Subject line scoring | ❌ | ❌ | ❌ | ✅ | ❌ | ⚠️ Basic (length, spam words) |
| A/B testing | ✅ | ✅ | ✅ | ✅ | ❌ | ⏳ Future |
| Test email to self | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Build |
| Device preview (desktop/mobile) | ✅ | ❌ | ✅ | ❌ | ✅ Screenshot #1 | ✅ Build |

### Subscriber Intelligence

| Feature | Mailchimp | Customer.io | Mailster | Our Plan |
|---------|-----------|-------------|---------|----------|
| Per-person email timeline | ✅ | ✅ (best) | ✅ Screenshot #2 | ✅ Build |
| Campaign engagement history | ✅ | ✅ | ✅ | ✅ Build |
| Open/click rates per person | ✅ Star rating | ✅ Behavioral | ✅ | ✅ Build |
| Email client detection | ✅ | ✅ (human vs bot) | ✅ | ✅ Build (from click UA) |
| Device type | ✅ | ✅ | ✅ | ✅ Build |
| Engagement scoring | ✅ 1-5 stars | ✅ Segments | ❌ | ✅ Build |
| Avg time to open/click | ❌ | ❌ | ✅ Screenshot #2 | ⏳ Future |
| Unsubscribe reason tracking | ✅ (only platform) | ❌ | ❌ | ⏳ Future |

### Campaign Analytics

| Feature | Mailchimp | Customer.io | Brevo | Mailster | Our Plan |
|---------|-----------|-------------|-------|---------|----------|
| Open/click/bounce/complaint rates | ✅ | ✅ | ✅ | ✅ | ✅ Have |
| Click tracking per link (ranked) | ✅ | ❌ | ✅ | ✅ | ✅ Build |
| Click heatmap on email | ✅ | ❌ | ✅ | ✅ | ⏳ Future |
| Device/client breakdown | ✅ | ✅ | ✅ | ✅ | ✅ Build |
| Campaign comparison | ✅ | ✅ | ✅ | ⚠️ | ✅ Build |
| Engagement over time (hourly) | ✅ | ✅ | ✅ | ⚠️ | ⏳ Future |
| Geographic breakdown | ✅ | ✅ | ✅ | ✅ | ⏳ Future |
| Best time to send (AI) | ✅ | ❌ | ✅ | ❌ | ⏳ Future |

### Automated Flows

| Feature | Customer.io | Loops | Mailchimp | Our Plan |
|---------|-------------|-------|-----------|----------|
| Welcome/onboarding sequence | ✅ Best | ✅ | ✅ | ✅ Build |
| Weekday-only scheduling | ✅ Native Time Windows | Unverified | ✅ | ✅ Build (CET check) |
| Conditional branching | ✅ 3 branch types | ⚠️ Basic | ✅ | ⏳ Future |
| Goal tracking | ✅ | ❌ | ✅ | ⏳ Future |
| Re-engagement campaigns | ✅ | ❌ | ✅ | ⏳ Future |

### List Hygiene

| Feature | All Major Platforms | Our Plan |
|---------|-------------------|----------|
| Hard bounce auto-suppress | ✅ Standard | ✅ Build |
| Complaint auto-unsubscribe | ✅ Standard | ✅ Build |
| Inactive subscriber detection | ✅ Most platforms | ⏳ Future |
| Preference center | ✅ Most platforms | ⏳ Future (need 3+ email types) |
| Email verification/cleaning | ⚠️ Via integrations | ⏳ Future |

---

## 4. What We're Building — Feature Scope

### Tier 1: Build Now (Professional Foundation)

| # | Feature | Category | Effort |
|---|---------|----------|--------|
| 1 | Onboarding email sequence engine | Automated Flows | Large |
| 2 | Test email to self | Pre-Send Quality | Small |
| 3 | Pre-send checklist (5 areas, pass/fail + fix suggestions) | Pre-Send Quality | Medium |
| 4 | Device preview (desktop/tablet/mobile) | Pre-Send Quality | Small |
| 5 | Per-person email timeline | Subscriber Intelligence | Medium |
| 6 | Engagement scoring (active/at-risk/cold) | Subscriber Intelligence | Medium |
| 7 | Email client detection (from click UA) | Subscriber Intelligence | Small |
| 8 | Click tracking per link (ranked, in our UI) | Campaign Analytics | Medium |
| 9 | Campaign comparison | Campaign Analytics | Medium |
| 10 | Per-campaign device/client breakdown | Campaign Analytics | Small |
| 11 | Hard bounce auto-suppress | List Hygiene | Small |
| 12 | Complaint auto-unsubscribe | List Hygiene | Small |

### Pre-Send Checklist Areas (Pass/Fail + Fix Suggestions)

| Area | Checks | Fix Suggestion Example |
|------|--------|----------------------|
| **Inhoud** | Subject length (30-60 chars), spam trigger words, preheader present, `{{voornaam}}` used | "Onderwerpregel is 82 tekens — korter dan 60 voor betere weergave op mobiel" |
| **Links** | All URLs return HTTP 200, no localhost/test URLs, unsubscribe link present | "Link 'https://example.com/page' geeft een 404 — controleer de URL" |
| **Afbeeldingen** | All images load (HTTP 200), alt text present, file size < 500KB each | "Afbeelding 'banner.jpg' mist alt-tekst — voeg een beschrijving toe voor toegankelijkheid" |
| **Authenticatie** | SPF pass, DKIM pass, DMARC pass for sending domain | "DKIM niet geconfigureerd — ga naar Resend dashboard → Domains" |
| **Ontvangers** | Segment selected, count > 0, no suppressed addresses included | "3 ontvangers hebben een hard bounce — deze worden overgeslagen" |

### Tier 2: Build Next (Near Future)

| # | Feature | Category | Effort |
|---|---------|----------|--------|
| 13 | **Preference center** — subscribers manage topics, frequency, pause | List Hygiene | Medium |

Essential for retention as email types grow (campaigns, onboarding, future Reporter/alerts). Prevents full unsubscribes by letting users dial down instead of opt out entirely.

### Deferred to Later

- A/B testing (subject lines)
- Click heatmap overlay on email
- Re-engagement campaigns
- Dynamic content blocks (if/else)
- Geographic breakdown
- Engagement over time charts
- Unsubscribe reason tracking
- Inbox placement testing

---

## 5. Existing Infrastructure We Build On

### Database Tables (already exist)

| Table | Relevant Data |
|-------|--------------|
| `campaign_events` | event_type, link_url, email, campaign_id, occurred_at, resend_email_id |
| `campaigns` | subject, heading, body, segment, sent_count, sent_at, status |
| `people` | email, first_name, pipeline_stage, unsubscribed_at, resend_contact_id |
| `subscriptions` | user_id, person_id, plan, role, invited_at, last_active_at |
| `email_media` | filename, original_name, width, height, alt_text |

### Webhook Data Available

| Event | Fields We Get | Used For |
|-------|--------------|----------|
| `email.delivered` | email, campaign_id, timestamp | Delivery confirmation |
| `email.opened` | email, campaign_id, timestamp | Open tracking (pixel-based, Apple MPP caveat) |
| `email.clicked` | email, campaign_id, link_url, userAgent, ipAddress, timestamp | Click tracking, client detection |
| `email.bounced` | email, bounce type/subtype | Bounce auto-suppress |
| `email.complained` | email | Complaint auto-unsubscribe |

### API Routes (already exist)

| Route | Purpose |
|-------|---------|
| `POST /api/v1/team/mail/send` | Send campaign (batch, 100/batch, 600ms delay) |
| `POST /api/v1/team/mail/drafts` | Save draft |
| `GET /api/v1/team/mail/campaigns` | List campaigns with aggregate stats |
| `GET /api/v1/team/mail/campaigns/[id]` | Campaign detail with per-recipient events |
| `POST /api/v1/webhooks/resend` | Webhook handler (Svix verified) |

---

## 6. Architecture Notes

### Onboarding Sequence Engine

**Approach:** Build on Resend API, NOT Resend Broadcasts.
- Sequences are transactional (personalized per user, triggered by signup)
- Use `resend.emails.send()` not broadcasts
- Table: `email_sequences` (sequence definitions) + `email_sequence_steps` (individual emails) + `email_sequence_enrollments` (who is enrolled, current step)
- Daily cron at 09:00 CET checks for pending sends where `scheduled_for <= today AND weekday`
- Weekday check: `new Date().getDay()` in CET timezone, skip 0 (Sunday) and 6 (Saturday)
- All users are NL timezone — no per-user timezone logic needed

### Per-Person Timeline

**Approach:** Query `campaign_events` joined with `campaigns` for a given email address.
- Already have the data — just need a UI component
- Show on `/team/leden/[id]` detail page
- Include sequence emails once built

### Engagement Scoring

**Approach:** Compute from `campaign_events` data.
- Active: opened or clicked in last 30 days
- At-risk: no opens/clicks in 30-90 days
- Cold: no engagement in 90+ days
- New: fewer than 3 campaigns sent
- Could be an RPC function or computed on read

### Pre-Send Checklist

**Approach:** Server-side validation endpoint.
- `POST /api/v1/team/mail/precheck` — accepts campaign HTML + subject + segment
- Returns pass/fail per area with fix suggestions
- Link checking: parallel HEAD requests with timeout
- Image checking: parse `<img>` tags, check src loads, check alt attribute
- Subject: regex for spam words, length check
- Auth: call Resend domain verification API or cache known status

---

## 7. Sources

### Platform Documentation
- [Resend Docs](https://resend.com/docs) — API reference, webhooks, broadcasts
- [Resend Pricing](https://resend.com/pricing) — $20/mo Pro, $90/mo Scale
- [Customer.io Docs](https://docs.customer.io) — Time Windows, behavioral triggers
- [Loops.so Docs](https://loops.so/docs) — Loop Builder, event triggers
- [Mailchimp Help](https://mailchimp.com/help/) — Inbox Preview, click maps, unsubscribe surveys
- [Brevo Help](https://help.brevo.com) — Click heatmaps, send-time optimization
- [MailerLite Features](https://www.mailerlite.com/features) — Subject line tester, surveys
- [Beehiiv Features](https://www.beehiiv.com/features) — Referral program, A/B testing
- [Kit Docs](https://help.kit.com) — Visual automations, re-engagement
- [Mailster KB](https://kb.mailster.co) — Precheck, per-subscriber analytics

### External Tools Referenced
- [Mail-Tester](https://www.mail-tester.com/) — Free spam score testing
- [GlockApps](https://glockapps.com/) — Inbox placement testing
- [Litmus](https://litmus.com/) — Email rendering across clients

### Resend-Specific Technical Details
- Webhook event types: 17 total (11 email + 3 contact + 3 domain)
- Webhook retry: 5s, 5m, 30m, 2h, 5h, 10h escalation
- Webhook dedup: `svix-id` header
- Rate limit: 2 req/sec per team
- Batch: 100 emails per call, no scheduling in batch
- Schedule window: max 30 days
- Data retention: Pro 3 days, Scale 7 days
- Click tracking: per-domain toggle, rewrites links to redirect URLs
