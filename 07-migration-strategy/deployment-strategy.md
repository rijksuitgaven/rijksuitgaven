# Deployment Strategy

**Created:** 2026-01-21
**Status:** Confirmed

---

## Overview

| Aspect | Decision |
|--------|----------|
| Production domain | rijksuitgaven.nl |
| Beta domain | beta.rijksuitgaven.nl |
| Beta protection | Magic Link (Supabase Auth) |
| Beta testers | 10 people (launched 2026-02-21) |
| Cutover approach | Hard switch (DNS) |
| Rollback plan | None - thorough testing before switch |

---

## Infrastructure

### Current State
```
rijksuitgaven.nl
    │
    └── WordPress on private server (contracted hosting)
        └── Can be terminated anytime after switch
```

### Target State
```
rijksuitgaven.nl
    │
    └── Next.js on Railway
        ├── Supabase (database + auth)
        └── Typesense (search)
```

### DNS Control
- **Registrar/DNS:** Controlled by founder (Vimexx)
- **Railway process:** Add custom domain in Railway dashboard → Railway provides unique CNAME target → Add CNAME in DNS
- **Current:** beta.rijksuitgaven.nl → `j65ghs38.up.railway.app`

---

## Development Phase (Weeks 1-7)

### Two Sites Running Parallel

| Site | URL | Purpose | Access |
|------|-----|---------|--------|
| Production (beta) | beta.rijksuitgaven.nl | Live service for beta testers | Magic Link only |
| Production (future) | rijksuitgaven.nl | Public launch (after M1.0) | Public (with login) |
| Local dev | localhost:3000 | Development and testing | Magic Link (localhost) |

### Development Setup (Updated 2026-02-28)

**No separate staging environment.** Localhost serves as the full dev/test environment.

1. **Feature branches** for unreleased work (never on main)
2. **Localhost testing** with full auth (RESEND_API_KEY + SUPABASE_SERVICE_ROLE_KEY in .env.local)
3. **Hotfixes** go straight to main
4. **Push to main** auto-deploys to production via Railway

**Supabase setup:**
1. Auth → Settings → Disable "Enable email signup"
2. Auth → Users → "Create user" for each tester
3. Users receive Magic Link when they request login

---

## Beta Testing Phase (Week 8, Days 1-5)

### Beta Testers
- **Total:** 5 people
- **Recruitment:** Founder selects from existing customers or contacts
- **Access:** Magic Link to beta.rijksuitgaven.nl

### Beta Testing Checklist

| Area | Test |
|------|------|
| Auth | Magic Link flow works |
| Search | <100ms response, autocomplete works |
| All 7 modules | Data displays correctly |
| Filters | All filters work per module |
| Export | CSV download (500 rows) |
| Mobile | Tables usable on phone |
| Overzicht | Module totals correct |
| Navigation | All links work |

### Issue Tracking
- Beta testers report issues directly (email/chat)
- Fix critical issues before switch
- Non-critical issues go to backlog

---

## Cutover (Week 8, Days 6-7)

### Pre-Switch Checklist

- [ ] All beta tester issues resolved
- [ ] Performance verified (<100ms search, <1s page load)
- [ ] All 50 user emails imported to Supabase Auth
- [ ] "Welcome to new platform" email drafted
- [ ] DNS TTL lowered (if not already low)

### Switch Procedure

**Step 1: DNS Update**
```
Current:  rijksuitgaven.nl → Private server (WordPress)
New:      rijksuitgaven.nl → Railway (Next.js)
```

**Step 2: Verify**
- [ ] HTTPS working
- [ ] Homepage loads
- [ ] Login works
- [ ] One module test (search + filter + export)

**Step 3: User Communication**
- Send announcement email to 50 users
- Include: What changed, how to log in (Magic Link), support contact

**Step 4: Shutdown Old Server**
- After 1-2 weeks of stable operation
- Terminate WordPress hosting contract

---

## Post-Launch

### Monitoring (Week 9+)
- Watch for user-reported issues
- Monitor Railway/Supabase dashboards
- Check error logs (Sentry if configured)

### Old Server
- Keep WordPress data backup (just in case)
- Terminate hosting after 2 weeks stable operation

---

## DNS Records Reference

**Important:** Railway custom domains require adding the domain in Railway dashboard FIRST. Railway then provides a unique CNAME target to use in your DNS records.

### During Development (Current)
```
# Step 1: Add beta.rijksuitgaven.nl in Railway → Railway provides CNAME target
# Step 2: Add DNS record:
beta.rijksuitgaven.nl    CNAME    j65ghs38.up.railway.app  (Railway-provided)
nieuws.rijksuitgaven.nl  A        [current-server-ip]
```

### After Switch
```
# Step 1: Add rijksuitgaven.nl in Railway → Railway provides CNAME target
# Step 2: Add DNS records:
rijksuitgaven.nl         CNAME    [railway-provided-target].up.railway.app
www.rijksuitgaven.nl     CNAME    rijksuitgaven.nl
nieuws.rijksuitgaven.nl  A        [current-server-ip]  (keep for email)
beta.rijksuitgaven.nl    (remove or keep for future testing)
```

---

## Marketing Email Strategy

**Decision (2026-02-12):** Resend Broadcasts — replaces WordPress/Mailster entirely

~~**Previous decision (2026-01-21):** Keep Mailster + Mailgun on subdomain~~ — superseded, Mailster not up to standard.

### Current Setup (being replaced)
- WordPress + Mailster plugin + Mailgun on `nieuws.rijksuitgaven.nl`

### New Approach (V1.0)
```
rijksuitgaven.nl         → New platform (Next.js on Railway)
Resend Broadcasts        → Email campaigns (same vendor as transactional)
nieuws.rijksuitgaven.nl  → DECOMMISSION after launch
```

### Why Resend Broadcasts
- Already in stack (magic links, invite emails)
- Single contact list shared with transactional (subscriptions table)
- React Email templates (same tech as existing branded templates)
- Open/click/bounce tracking built in
- Broadcast API for V2 Reporter (programmatic sends)
- Free for 1,000 contacts, $40/mo for 5,000+
- Eliminates WordPress server dependency

### Setup Tasks (Week 7)
1. Create Resend Audience, sync contacts from subscriptions table
2. Build branded campaign template (React Email)
3. Test broadcast with open/click tracking
4. Migrate any remaining Mailster-only contacts

### Post-Launch
- Decommission `nieuws.rijksuitgaven.nl` and WordPress server
- Remove DNS record for nieuws subdomain

---

## Summary

```
Week 1-7:  Build on beta.rijksuitgaven.nl (Magic Link protected)
           WordPress stays live on rijksuitgaven.nl

Week 8:    Beta test with 5 users
           Fix issues

Day X:     DNS switch: rijksuitgaven.nl → Railway
           Email 50 users
           WordPress → archive/shutdown
```

**No rollback plan needed** - site is straightforward, testing will be thorough.
