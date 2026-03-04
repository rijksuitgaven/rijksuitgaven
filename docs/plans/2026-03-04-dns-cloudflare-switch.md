# DNS & CloudFlare Switch Plan

**Date:** 2026-03-04
**Target:** Weekend of 8-9 March 2026
**Goal:** Move rijksuitgaven.nl from Vimexx DNS to CloudFlare, point root domain to Railway, retire nieuws subdomain

---

## Current DNS Records at Vimexx (Complete Inventory)

Screenshot taken 2026-03-04. This is the full record set.

### A Records

| Name | Value | Action | Reason |
|------|-------|--------|--------|
| ftp | 185.104.29.82 | **Remove** | Legacy ZXCS hosting, not used |
| mail | 185.104.29.82 | **Remove** | Legacy mail server, email via Resend now |
| nieuws | 185.104.29.82 | **Remove** | Nieuws being stopped |
| pop | 185.104.29.82 | **Remove** | Legacy POP mail, not used |
| rijksuitgaven.nl | 5.200.23.235 | **Replace** → CNAME to Railway | WordPress → Railway switch |
| smtp | 185.104.29.82 | **Remove** | Legacy SMTP, not used |
| v100 | 185.104.29.82 | **Keep** | WordPress archive/backup |
| www | 5.200.23.235 | **Replace** → redirect to @ | Will 301 to rijksuitgaven.nl |
| www.nieuws | 185.104.29.82 | **Remove** | Nieuws being stopped |
| www.v100 | 185.104.29.82 | **Keep** | WordPress archive/backup |

### AAAA Records (IPv6)

| Name | Value | Action |
|------|-------|--------|
| ftp | 2a06:2ec0:1:... | **Remove** |
| mail | 2a06:2ec0:1:... | **Remove** |
| nieuws | 2a06:2ec0:1:... | **Remove** |
| pop | 2a06:2ec0:1:... | **Remove** |
| smtp | 2a06:2ec0:1:... | **Remove** |
| v100 | 2a06:2ec0:1:... | **Keep** |
| www.nieuws | 2a06:2ec0:1:... | **Remove** |
| www.v100 | 2a06:2ec0:1:... | **Keep** |

### NS Records

| Name | Value | Action |
|------|-------|--------|
| rijksuitgaven.nl | ns.zxcs.be | **Replace** → CloudFlare NS |
| rijksuitgaven.nl | ns.zxcs.eu | **Replace** → CloudFlare NS |
| rijksuitgaven.nl | ns.zxcs.nl | **Replace** → CloudFlare NS |

### CNAME Records

| Name | Value | Action |
|------|-------|--------|
| beta | j65ghs38.up.railway.app | **Keep** (proxy via CloudFlare) |
| email.nieuws | eu.mailgun.org | **Remove** (nieuws stopped) |

### MX Records

| Name | Value | Action | Reason |
|------|-------|--------|--------|
| nieuws | 10 mxa.eu.mailgun.org | **Remove** | Nieuws stopped |
| nieuws | 10 mxb.eu.mailgun.org | **Remove** | Nieuws stopped |
| rijksuitgaven.nl | 10 spamrelay.zxcs.nl | **Keep** | Incoming email for contact@rijksuitgaven.nl |
| rijksuitgaven.nl | 40 fallbackmail.zxcs.nl | **Keep** | Fallback for incoming email |
| send | 10 feedback-smtp.eu-west-1.amazonses.com | **Keep** | Resend/SES bounce handling |

### TXT Records

| Name | Value (abbreviated) | Action | Reason |
|------|---------------------|--------|--------|
| _acme-challenge | WzD4LLHmY0PQk... | **Remove** | Let's Encrypt — CloudFlare handles SSL |
| _dmarc | v=DMARC1; p=reject; rua=mailto:dmarc@rijksuitgaven.nl; | **Keep** | Our DMARC policy |
| _dmarc.nieuws | v=DMARC1; p=none; ... mailgun/ondmarc | **Remove** | Nieuws stopped |
| email._domainkey.nieuws | k=rsa; p=MIGfMA0G... (Mailgun DKIM) | **Remove** | Nieuws stopped |
| mailster._domainkey | k=rsa; p=MIGfMA0G... (WordPress Mailster) | **Remove** | Legacy WordPress email plugin |
| nieuws | v=spf1 include:mailgun.org ~all | **Remove** | Nieuws stopped |
| resend._domainkey | p=MIGfMA0G... (Resend DKIM) | **Keep** | Our transactional email DKIM |
| rijksuitgaven.nl | google-site-verification=DVCD9fS6G5... | **Keep** | Google Search Console |
| rijksuitgaven.nl | google-site-verification=Ri-m4HOQTCC... | **Keep** | Google Search Console |
| rijksuitgaven.nl | v=spf1 mx a include:spfmailpod.zxcs.nl include:rrproxyspf.zxcs.nl include:send.resend.dev ~all | **Review** | SPF — may need cleanup (remove ZXCS includes if not sending from there) |
| send | v=spf1 include:amazonses.com ~all | **Keep** | SES/Resend bounce subdomain |
| x._domainkey | v=DKIM1; k=rsa; p=... (Resend/SES DKIM) | **Keep** | Resend sending DKIM |

### TLSA Records

| Name | Action |
|------|--------|
| _443._tcp.rijksuitgaven.nl | **Remove** — DANE not needed with CloudFlare |
| _443._tcp.www.rijksuitgaven.nl | **Remove** — DANE not needed with CloudFlare |

---

## Summary: What Changes

| Action | Count | Records |
|--------|-------|---------|
| **Remove** | ~22 | All nieuws/*, ftp, mail, pop, smtp, mailster, _acme-challenge, TLSA, legacy AAAA |
| **Keep as-is** | ~12 | v100, www.v100, root MX, send MX, _dmarc, resend._domainkey, x._domainkey, Google verifications, root SPF, send SPF |
| **Replace** | 5 | Root A→CNAME Railway, www→redirect, 3 NS→CloudFlare |
| **Modify** | 1 | beta CNAME: keep target, enable CloudFlare proxy (orange cloud) |

---

## Services Dependent on DNS

| Service | DNS records | Risk if broken | Priority |
|---------|------------|----------------|----------|
| Railway app (beta.rijksuitgaven.nl) | beta CNAME | **Site down** | Critical |
| Incoming email (contact@rijksuitgaven.nl) | Root MX → ZXCS | **Can't receive email** | Critical |
| Resend (outbound transactional email) | resend._domainkey, x._domainkey, SPF, _dmarc | **Emails go to spam** | Critical |
| Resend/SES bounces | send MX, send SPF | **Bounce handling breaks** | High |
| Google Search Console | google-site-verification TXT (×2) | **Lose console access** | Medium |
| WordPress archive (v100) | v100 A + AAAA | **Archive inaccessible** | Low |

---

## Phase 1: CloudFlare Setup (Saturday morning)

**Estimated time: 30 min active + propagation wait**

### Step 1.1: Add zone to CloudFlare

1. Log in to CloudFlare
2. "Add a site" → enter `rijksuitgaven.nl`
3. Select **Free plan** (sufficient — includes CNAME flattening, page rules, SSL)
4. CloudFlare scans existing records — **verify against inventory above**
5. Note the two CloudFlare nameservers assigned

### Step 1.2: Configure DNS records in CloudFlare

**Add only the KEEP + REPLACE records. Do NOT import the REMOVE records.**

CloudFlare will auto-import — delete anything marked Remove above before proceeding.

Records to have in CloudFlare:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | @ | j65ghs38.up.railway.app (temporary — same as beta) | **Grey cloud** (DNS only, for now) |
| CNAME | www | rijksuitgaven.nl | **Grey cloud** |
| CNAME | beta | j65ghs38.up.railway.app | **Grey cloud** |
| A | v100 | 185.104.29.82 | Grey cloud |
| A | www.v100 | 185.104.29.82 | Grey cloud |
| AAAA | v100 | 2a06:2ec0:1:0:0:0:0:119 | Grey cloud |
| AAAA | www.v100 | 2a06:2ec0:1:0:0:0:0:119 | Grey cloud |
| MX | @ | 10 spamrelay.zxcs.nl | — |
| MX | @ | 40 fallbackmail.zxcs.nl | — |
| MX | send | 10 feedback-smtp.eu-west-1.amazonses.com | — |
| TXT | _dmarc | v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@rijksuitgaven.nl; | — |
| TXT | resend._domainkey | (full DKIM key from Vimexx) | — |
| TXT | x._domainkey | (full DKIM key from Vimexx) | — |
| TXT | @ | google-site-verification=DVCD9fS6G54TVtVsTrxOZhrcLbDmOfjxA6fpUyAXI4 | — |
| TXT | @ | google-site-verification=Ri-m4HOQTCC8QVgnX8FL4uVZUVR7y2ody02kyByQ59Y | — |
| TXT | @ | v=spf1 mx a include:spfmailpod.zxcs.nl include:rrproxyspf.zxcs.nl include:send.resend.dev ~all | — |
| TXT | send | v=spf1 include:amazonses.com ~all | — |

**Important:** All records start as grey cloud (DNS only). We enable proxy AFTER verifying everything works.

### Step 1.3: Switch nameservers at Vimexx

1. Log in to Vimexx
2. Domain settings → Nameservers
3. Replace 3 ZXCS nameservers with the 2 CloudFlare nameservers
4. Save

**Propagation:** 1-24 hours (usually 1-4 hours)

### Step 1.4: Verify after propagation

Run ALL checks before proceeding:

- [ ] `dig beta.rijksuitgaven.nl` → shows j65ghs38.up.railway.app
- [ ] `beta.rijksuitgaven.nl` loads in browser — login works
- [ ] `dig rijksuitgaven.nl MX` → shows spamrelay.zxcs.nl + fallbackmail.zxcs.nl
- [ ] Send test email TO `contact@rijksuitgaven.nl` — verify it arrives
- [ ] Send test email FROM app (trigger magic link) — check SPF/DKIM pass via headers
- [ ] Use https://www.mail-tester.com — send from app, verify score
- [ ] `dig rijksuitgaven.nl TXT` → shows SPF + Google verifications
- [ ] `v100.rijksuitgaven.nl` still loads WordPress archive
- [ ] CloudFlare dashboard shows zone as "Active"

**Stop here if ANY check fails. Debug before proceeding.**

---

## Phase 2: Production DNS Switch (after Phase 1 verified)

### Step 2.1: Railway custom domain

1. Railway dashboard → rijksuitgaven frontend service → Settings → Domains
2. "Add Custom Domain" → enter `rijksuitgaven.nl`
3. Railway provides a CNAME target — note it: `_________________.up.railway.app`
4. Add `www.rijksuitgaven.nl` too (Railway may provide same or different target)

### Step 2.2: Update CloudFlare root CNAME

In CloudFlare DNS:

1. Edit the `@` CNAME record → change value to the new Railway CNAME target from step 2.1
2. Keep as **grey cloud** (DNS only) initially

### Step 2.3: Verify root domain

- [ ] `https://rijksuitgaven.nl` loads the Railway app (not WordPress)
- [ ] Login works on `rijksuitgaven.nl`
- [ ] `https://beta.rijksuitgaven.nl` still works

### Step 2.4: Enable CloudFlare proxy

Now that everything works on DNS-only, enable proxying:

1. `@` CNAME → toggle to **orange cloud** (proxied)
2. `beta` CNAME → toggle to **orange cloud** (proxied)
3. `www` CNAME → toggle to **orange cloud** (proxied)

**Do NOT proxy:** v100, MX records, TXT records (these stay grey/DNS-only)

### Step 2.5: Configure CloudFlare settings

**SSL/TLS:**
- Mode: **Full (strict)** — Railway has valid SSL cert
- Always Use HTTPS: **On**
- Minimum TLS: **1.2**
- Automatic HTTPS Rewrites: **On**

**Caching:**
- Caching Level: **Standard**
- Browser Cache TTL: **Respect Existing Headers** (our `no-store` on API routes stays)
- Always Online: **Off** (we want real errors, not stale pages)

**Page Rules (3 free):**
1. `*rijksuitgaven.nl/api/*` → Cache Level: Bypass
2. `www.rijksuitgaven.nl/*` → Forwarding URL (301) → `https://rijksuitgaven.nl/$1`
3. (Reserve for V2.5 `/s/*` edge caching)

**Speed:**
- Brotli: **On**

**Security:**
- Security Level: **Medium**
- Bot Fight Mode: **On** — but test that Twitter/LinkedIn/Slack can still fetch OG previews
- Challenge Passage: **30 minutes**

### Step 2.6: Verify with CloudFlare proxy active

- [ ] `https://rijksuitgaven.nl` loads correctly
- [ ] `https://www.rijksuitgaven.nl` 301 redirects to `https://rijksuitgaven.nl`
- [ ] `https://beta.rijksuitgaven.nl` still works
- [ ] `curl -I https://rijksuitgaven.nl` shows `server: cloudflare` and `cf-ray` header
- [ ] Login flow works end-to-end (magic link → email → callback → session)
- [ ] All 7 modules load data
- [ ] Expanded rows work
- [ ] Export works (CSV/XLS)
- [ ] Send test email TO `contact@rijksuitgaven.nl` — still arrives
- [ ] Send test email FROM app — SPF/DKIM still pass
- [ ] `v100.rijksuitgaven.nl` still loads (not proxied)

---

## Phase 3: Code Changes (after Phase 2 verified)

### Step 3.1: Update metadataBase

**File:** `app/src/app/layout.tsx` line 23

```typescript
// Before:
metadataBase: new URL('https://beta.rijksuitgaven.nl'),

// After:
metadataBase: new URL('https://rijksuitgaven.nl'),
```

### Step 3.2: Supabase redirect URLs

1. Supabase Dashboard → Authentication → URL Configuration
2. Add `https://rijksuitgaven.nl/auth/callback` to Redirect URLs
3. Update Site URL to `https://rijksuitgaven.nl`
4. **Keep** `https://beta.rijksuitgaven.nl/auth/callback` in the list

### Step 3.3: ALLOWED_HOSTS — already done

All 3 files already include `rijksuitgaven.nl` and `www.rijksuitgaven.nl`:
- `middleware.ts` ✅
- `magic-link/route.ts` ✅
- `invite/route.ts` ✅

### Step 3.4: CSP — no changes needed

`connect-src 'self'` matches current domain automatically.

### Step 3.5: Resend sender domain — verify

`from: contact@rijksuitgaven.nl` already uses root domain. DKIM (resend._domainkey, x._domainkey) is on root domain. Should work without changes. Verify with test email after deploy.

### Step 3.6: Deploy

```bash
git commit -m "Update metadataBase to production domain rijksuitgaven.nl"
git push origin main  # → Railway auto-deploys
```

### Step 3.7: Post-deploy verification

- [ ] View page source → `<meta property="og:url"` shows `rijksuitgaven.nl`
- [ ] Magic link emails contain `rijksuitgaven.nl/auth/callback` URLs
- [ ] Invite emails contain `rijksuitgaven.nl/auth/callback` URLs
- [ ] `/team/statistieken` still recording analytics
- [ ] Share a URL on Twitter/LinkedIn/Slack — OG preview shows correctly

---

## Rollback Plan

### Phase 1 rollback (nameserver issue)

1. Vimexx → restore ZXCS nameservers (ns.zxcs.be, ns.zxcs.eu, ns.zxcs.nl)
2. Wait 1-4 hours for propagation
3. Everything returns to pre-switch state

### Phase 2 rollback (production DNS issue)

1. CloudFlare → change `@` CNAME back to old WordPress IP: add A record `5.200.23.235`
2. Or: CloudFlare → "Pause CloudFlare on site" (bypasses proxy, returns to DNS-only)
3. `beta.rijksuitgaven.nl` never went down — users can use beta URL

### Phase 3 rollback (code issue)

1. `git revert` the metadataBase commit → push to main
2. Site works on `rijksuitgaven.nl` with `beta.` in OG tags (cosmetic only)

---

## SPF Record Review (TODO during switch)

Current root SPF:
```
v=spf1 mx a include:spfmailpod.zxcs.nl include:rrproxyspf.zxcs.nl include:send.resend.dev ~all
```

After switch, we're no longer sending email from ZXCS. Consider simplifying to:
```
v=spf1 mx include:send.resend.dev -all
```

Changes:
- Remove `a` (Railway IP doesn't send email)
- Remove `spfmailpod.zxcs.nl` (not sending from ZXCS)
- Remove `rrproxyspf.zxcs.nl` (not sending from ZXCS proxy)
- Keep `mx` (in case ZXCS mail server sends replies)
- Keep `include:send.resend.dev` (Resend sending)
- Tighten `~all` to `-all` (hard fail — we know exactly who sends)

**Do this AFTER verifying email still works. Not during the initial switch.**

---

## Timeline

| When | What | Duration |
|------|------|----------|
| **Saturday AM** | Phase 1: CloudFlare zone + import records + switch NS | 30 min + wait |
| **Saturday PM** | Verify Phase 1 (email, site, DNS resolution) | 15 min |
| **Saturday PM / Sunday AM** | Phase 2: Railway custom domain + root CNAME + enable proxy + settings | 30 min + wait |
| **After propagation** | Phase 2 verification (full test suite) | 30 min |
| **After Phase 2 verified** | Phase 3: metadataBase + Supabase + deploy | 15 min |
| **After deploy** | Phase 3 verification (OG tags, emails, analytics) | 15 min |

**Total active work: ~2.5 hours. Total elapsed: 4-24 hours (DNS propagation).**

---

## After the Switch

**Retired:**
- nieuws.rijksuitgaven.nl (stopped)
- WordPress on root domain (replaced by Railway)
- ZXCS mail infrastructure (except MX for receiving)
- Legacy subdomains (ftp, mail, pop, smtp)

**Live on production domain:**
- rijksuitgaven.nl → Railway (via CloudFlare)
- beta.rijksuitgaven.nl → Railway (via CloudFlare, parallel)
- v100.rijksuitgaven.nl → WordPress archive (direct, not proxied)

**Unblocked:**
- **V2.5 Publieke Deellinks** — `/s/` routes cached at CloudFlare edge
- **M1.0 remaining items** — SEO on production domain, user migration, homepage copy
- **Future:** CloudFlare Workers, image optimization, WAF rules
