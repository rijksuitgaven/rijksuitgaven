# Authentication Requirements (V1.0 - Week 6)

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** V1.0 - Search Platform
**Date:** 2026-02-08 (Updated: 2026-02-11)
**Status:** ✅ Implemented 2026-02-10 (PKCE flow, client-side exchange)
**Sprint:** Week 6 (Auth) - COMPLETE

> **Scope:** This document covers V1.0 authentication requirements only.
> Magic Link email authentication via Supabase Auth.
> No social login, no SSO, no multi-factor (all post-V1.0).

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Method](#authentication-method)
3. [User Migration](#user-migration)
4. [Routes & Access Control](#routes--access-control)
5. [UI Components](#ui-components)
6. [Email Templates](#email-templates)
7. [Session Management](#session-management)
8. [Error Handling](#error-handling)
9. [Technical Implementation](#technical-implementation)
10. [Security Requirements](#security-requirements)
11. [Testing Checklist](#testing-checklist)
12. [Out of Scope](#out-of-scope)
13. [Decisions Log](#decisions-log)

---

## Overview

### Goal
Enable the 50 existing WordPress users to log in to the new platform using Magic Link (passwordless email authentication). Protect all data pages behind authentication while keeping marketing/support pages public.

### Constraints

| Constraint | Value |
|------------|-------|
| Auth provider | Supabase Auth (already provisioned) |
| Method | Magic Link only (no passwords, no social) |
| Users to migrate | ~50 (from WordPress `4yi3uwye_users` table) |
| Session duration | 30 days (refresh token lifetime) |
| Email provider | Resend (custom domain: noreply@rijksuitgaven.nl) |

### Implementation Status (Completed 2026-02-10)

| Component | Status |
|-----------|--------|
| `@supabase/supabase-js` + `@supabase/ssr` | ✅ Installed |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configured (.env.local + Railway) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configured (.env.local + Railway) |
| Supabase client initialization | ✅ Created (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`) |
| Middleware (route protection) | ✅ Implemented (`middleware.ts`) |
| Login page | ✅ Implemented (`app/login/page.tsx`) |
| Auth callback | ✅ Implemented (`app/auth/callback/page.tsx` - client-side PKCE) |
| Profile page | ✅ Implemented (`app/profiel/page.tsx`) |
| Header auth UI | ✅ Implemented (UX-026: Profile dropdown with user icon + chevron) |
| Footer auth state | ✅ Updated (removed email + logout from bottom bar) |
| BFF route protection | ✅ Implemented (session check on all API routes) |
| Membership system | ✅ Implemented (subscriptions table, admin pages at /team) |

### Implementation Highlights

**PKCE Flow (Fully Client-Side):**
- Magic Link email received → user clicks link
- Redirects to `/auth/callback` (Page Component, not Route Handler)
- `createBrowserClient()` exchanges code for session client-side
- Session cookies set by browser client (NEVER server-side in Next.js 16 on Railway)
- Redirects to `/integraal` after successful auth

**Key Decision:** Server-side cookie setting with `cookieStore.set()` in Next.js 16 on Railway FAILS silently. All auth flows use browser client exclusively.

**Auth Hooks:**
- `useAuth()` at `hooks/use-auth.ts` — reads session via browser client
- `useSubscription()` at `hooks/use-subscription.ts` — reads subscription status

**Middleware:**
- Protects all module pages + /profiel + /team routes
- Checks subscription status (redirects to /verlopen if expired)
- No subscription row = allow access (safe default during setup)

---

## Authentication Method

### AUTH-001: Magic Link (Passwordless Email)

**Requirement:** Users log in by entering their email address and clicking a link sent to their inbox.

**Flow:**

```
1. User navigates to /login
2. User enters email address
3. User clicks "Stuur inloglink" (Send login link)
4. System sends Magic Link email via Supabase
5. User receives email, clicks link
6. Link redirects to /auth/callback (Supabase confirms token)
7. User is redirected to /integraal (landing page)
8. Session cookie is set
```

**Error scenarios:**

| Scenario | User sees |
|----------|-----------|
| Email not found in Supabase | Same success message (security: don't reveal which emails exist) |
| Invalid/expired link | "Deze link is verlopen. Vraag een nieuwe aan." |
| Already logged in | Redirect to /integraal |
| Network error | "Er ging iets mis. Probeer het opnieuw." |

**Priority:** P0 (Critical)

---

### AUTH-002: No Password Authentication

**Requirement:** The platform does NOT support password-based login.

**Rationale:**
- Simpler UX (no password to remember)
- No password reset flow needed
- No password strength requirements
- Reduced security surface (no credential stuffing)
- Target audience (50 users) is small enough for Magic Link

**Priority:** P0 (Critical)

---

## User Migration

### AUTH-003: WordPress User Import

**Requirement:** Import ~50 existing WordPress users into Supabase Auth.

**Source:** WordPress `4yi3uwye_users` table

**Data to migrate per user:**

| WordPress Field | Supabase Field | Notes |
|----------------|----------------|-------|
| `user_email` | `email` | Primary identifier |
| `display_name` | `raw_user_meta_data.full_name` | Optional, for display |
| `user_registered` | `created_at` | Preserve original signup date |

**Migration approach:**
1. Export emails from WordPress (SQL query or phpMyAdmin CSV)
2. Use Supabase Admin API to create users (`supabase.auth.admin.createUser()`)
3. Set `email_confirm: true` (skip email verification since these are existing users)
4. Verify all users appear in Supabase Dashboard → Authentication → Users

**What NOT to migrate:**
- WordPress passwords (Magic Link = no passwords)
- WordPress roles/capabilities (V1.0 has no role system)
- WordPress user meta (preferences start fresh)

**Priority:** P0 (Critical)

---

### AUTH-004: Welcome Email

**Requirement:** Send announcement email to all 50 users explaining the platform migration.

**Content (Dutch):**
- Subject: "Rijksuitgaven.nl - Nieuw platform is live"
- Body:
  - Platform is vernieuwd (faster, better search)
  - Login works via Magic Link (no password needed)
  - Step-by-step: go to rijksuitgaven.nl → click Inloggen → enter email → check inbox
  - Link to support page if questions
  - Your existing email address works automatically

**Timing:** Send AFTER user migration is complete and DNS switch is done (Week 9).

**Priority:** P1 (High)

---

## Routes & Access Control

### AUTH-005: Route Protection Matrix

**Requirement:** Protect data pages, keep marketing pages public.

| Route Pattern | Access | Notes |
|---------------|--------|-------|
| `/` | Public | Homepage (marketing) |
| `/login` | Public | Login page |
| `/auth/callback` | Public | Magic Link callback handler |
| `/integraal` | Protected | Cross-module search (landing page for logged-in users) |
| `/instrumenten` | Protected | Module page |
| `/apparaat` | Protected | Module page |
| `/inkoop` | Protected | Module page |
| `/provincie` | Protected | Module page |
| `/gemeente` | Protected | Module page |
| `/publiek` | Protected | Module page |
| `/profiel` | Protected | User profile/settings |
| `/about` | Public | About page (Week 8) |
| `/support` | Public | Support pages (Week 8) |
| `/support/*` | Public | Support articles (Week 8) |
| `/contact` | Public | Contact form (Week 8) |
| `/pricing` | Public | Pricing page (Week 8) |
| `/demo` | Public | Demo request (Week 8) |
| `/terms` | Public | Terms of service (Week 8) |
| `/privacy` | Public | Privacy policy |
| `/privacybeleid` | Public | Privacy policy (Dutch URL) |
| `/api/*` | Server-side auth | BFF routes (verify session server-side) |

**Behavior when unauthenticated user hits protected route:**
- Redirect to `/login`
- After successful login, redirect back to originally requested page
- Store intended destination in URL param: `/login?redirect=/instrumenten`

**Priority:** P0 (Critical)

---

### AUTH-006: Middleware Implementation

**Requirement:** Next.js middleware intercepts requests to protected routes and checks authentication.

**Implementation approach:**

```
middleware.ts (root level)
├── Check if route is in protected list
├── If protected: verify Supabase session
│   ├── Session valid → continue to page
│   └── Session invalid/missing → redirect to /login?redirect={path}
└── If public: continue to page
```

**Key decisions:**
- Use Next.js middleware (runs on edge, before page renders)
- Use `@supabase/ssr` package for server-side session handling
- Session stored in HTTP-only cookies (not localStorage)
- Middleware refreshes session token if near expiry

**Priority:** P0 (Critical)

---

## UI Components

### AUTH-007: Login Page (`/login`)

**Requirement:** Clean, branded login page with email input.

**Layout:**
- Centered card on gray-light background
- Logo at top
- "Inloggen" heading
- Email input field
- "Stuur inloglink" button (pink CTA)
- Helper text: "We sturen een inloglink naar je e-mailadres"
- Error message area (below button)

**States:**

| State | Display |
|-------|---------|
| Default | Email input + CTA button |
| Loading | Button shows spinner, input disabled |
| Success | "Check je inbox! We hebben een inloglink gestuurd naar {email}" |
| Error | Red error message below button |
| Already logged in | Auto-redirect to /integraal |

**Validation:**
- Email format validation (client-side)
- Empty field prevention
- Rate limiting display: "Te veel pogingen. Probeer het over X minuten opnieuw."

**Priority:** P0 (Critical)

---

### AUTH-008: Header Auth State

**Requirement:** Header shows different content based on authentication state.

**Logged out:**
- Header shows module tabs (visible but clicking redirects to /login)
- "Inloggen" link in masthead (top-right)

**Logged in:**
- Header shows module tabs (fully functional)
- User email or name in masthead (top-right)
- "Uitloggen" link

**Layout (logged in):**
```
[Logo]                                    [user@email.com] [Uitloggen]
[Integraal | Instrumenten | Apparaat | Inkoop | Provincie | Gemeente | Publiek]
```

**Layout (logged out):**
```
[Logo]                                                      [Inloggen]
[Integraal | Instrumenten | Apparaat | Inkoop | Provincie | Gemeente | Publiek]
```

**Priority:** P1 (High)

---

### AUTH-009: Footer Auth Link

**Requirement:** Footer "Inloggen" link updates based on auth state.

**Current:** Footer has "Inloggen" link pointing to `/login`.

**Behavior:**
- Logged out: Shows "Inloggen" → `/login`
- Logged in: Shows "Uitloggen" → triggers logout

**Priority:** P2 (Medium)

---

### AUTH-010: Profile Page (`/profiel`)

**Requirement:** Basic profile page showing user info.

**V1.0 Scope (minimal):**
- Display user email
- Display account creation date
- "Uitloggen" button
- No editing capabilities in V1.0

**Future (post-V1.0):**
- Edit display name
- Notification preferences (V2.0 Reporter)
- Anomaly threshold preference
- Export history

**Priority:** P2 (Medium)

---

## Email Templates

### AUTH-011: Magic Link Email Template

**Requirement:** Customize the Supabase Magic Link email to match brand.

**Template content (Dutch):**

| Field | Value |
|-------|-------|
| From name | Rijksuitgaven.nl |
| From email | noreply@rijksuitgaven.nl (or Supabase default) |
| Subject | Inloggen bij Rijksuitgaven.nl |
| Body | See below |

**Email body (Dutch):**
```
Hallo,

Klik op de onderstaande link om in te loggen bij Rijksuitgaven.nl:

[Inloggen] ← button/link

Deze link is X minuten geldig. Als je niet hebt geprobeerd in te loggen, kun je deze e-mail negeren.

Met vriendelijke groet,
Rijksuitgaven.nl
```

**Styling:**
- Brand colors (navy header, pink CTA button)
- Clean, minimal layout
- Mobile-friendly
- No images (fast loading, no blocking)

**Configuration:** Supabase Dashboard → Authentication → Email Templates → Magic Link

**Priority:** P1 (High)

---

### AUTH-012: Custom SMTP (Optional)

**Requirement:** Evaluate whether to use Supabase's built-in SMTP or a custom provider.

**Options:**

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| Supabase built-in | Zero config, works immediately | Rate limits, generic from-address | Free |
| Resend | Custom domain, better deliverability | Setup required, API key | Free tier (100/day) |
| Postmark | Best deliverability | Most setup | $15/month |

**Decision:** Use Resend with custom domain (noreply@rijksuitgaven.nl). Better deliverability and professional from-address. Free tier covers 100 emails/day — more than enough for 50 users.

**Setup required:**
- Resend account + API key
- DNS records for rijksuitgaven.nl (SPF, DKIM, DMARC)
- Configure in Supabase Dashboard → Authentication → SMTP Settings

**Priority:** P1 (High)

---

## Session Management

### AUTH-013: Session Duration

**Requirement:** Configure appropriate session lifetime.

**Supabase defaults:**
- Access token: 1 hour (JWT)
- Refresh token: Indefinite (until manually revoked)

**Decision:** 30-day session duration.

| Setting | Value | Rationale |
|---------|-------|-----------|
| JWT expiry | 1 hour | Supabase default, good security |
| Refresh token lifetime | 30 days | Long enough for daily users, short enough for paid platform |
| Refresh token rotation | Enabled | Prevents token reuse |
| Refresh token reuse interval | 10 seconds | Handles concurrent requests |
| Inactivity timeout | None (V1.0) | Small user base, don't annoy users |

**Behavior:**
- Session persists across browser closes (refresh token in cookie)
- Middleware auto-refreshes expired access tokens using refresh token
- If refresh token is revoked/expired: redirect to /login

**Priority:** P1 (High)

---

### AUTH-014: Logout

**Requirement:** Users can explicitly log out.

**Flow:**
1. User clicks "Uitloggen" (header or profile page)
2. Call `supabase.auth.signOut()`
3. Clear session cookies
4. Redirect to `/login`

**Behavior:**
- Logout is immediate (no confirmation dialog)
- All local state is cleared
- Redirect to login page with clean state

**Priority:** P1 (High)

---

## Error Handling

### AUTH-015: Auth Error Messages (Dutch)

**Requirement:** All auth-related error messages are in Dutch.

| Error Code | Dutch Message |
|------------|---------------|
| `invalid_email` | "Voer een geldig e-mailadres in" |
| `rate_limit` | "Te veel pogingen. Probeer het over een paar minuten opnieuw." |
| `magic_link_expired` | "Deze inloglink is verlopen. Vraag een nieuwe aan." |
| `session_expired` | (Silent redirect to /login, no error shown) |
| `network_error` | "Er ging iets mis. Controleer je internetverbinding en probeer het opnieuw." |
| `unknown_error` | "Er is een onverwachte fout opgetreden. Probeer het opnieuw." |

**Security rule:** NEVER reveal whether an email exists in the system. Always show the same success message regardless: "Check je inbox! We hebben een inloglink gestuurd naar {email}."

**Priority:** P1 (High)

---

## Technical Implementation

### AUTH-016: Supabase Client Setup

**Requirement:** Initialize Supabase clients for both browser and server contexts.

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser client (used in components) |
| `lib/supabase/server.ts` | Server client (used in Server Components, API routes) |
| `lib/supabase/middleware.ts` | Middleware client (used in Next.js middleware) |

**Package:** `@supabase/ssr` (handles cookie-based sessions for Next.js)

**Note:** `@supabase/supabase-js` is already installed. Need to add `@supabase/ssr`.

**Priority:** P0 (Critical)

---

### AUTH-017: File Structure

**Requirement:** Organized auth-related file structure.

```
app/src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      # Magic Link callback (API route)
│   └── profiel/
│       └── page.tsx          # Profile page (protected)
├── components/
│   └── auth/
│       ├── login-form.tsx    # Login form component
│       └── auth-button.tsx   # Header auth state component
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client
│       └── middleware.ts     # Middleware client
└── middleware.ts             # Route protection (root level!)
```

**Note:** `middleware.ts` must be at the `app/src/` root (Next.js convention).

**Priority:** P1 (High)

---

### AUTH-018: BFF Route Protection

**Requirement:** Backend-for-Frontend (BFF) API routes verify authentication server-side.

**Current BFF routes** (`app/src/app/api/`):
- `/api/v1/modules/*` - Module data
- `/api/v1/search/*` - Typesense search proxy

**Behavior:**
- Each BFF route reads session from cookies using server-side Supabase client
- If no valid session: return `401 Unauthorized`
- If valid session: forward request to FastAPI backend as usual

**Implementation:**
- Create shared `getAuthenticatedUser()` helper
- Call at top of each BFF route handler
- Return 401 with JSON `{ error: "Niet ingelogd" }` if unauthenticated

**Frontend handling of 401:**
- Detect 401 in API client (`lib/api.ts`)
- Redirect to `/login` page
- Show toast/message: "Je sessie is verlopen. Log opnieuw in."

**Priority:** P0 (Critical)

---

## Security Requirements

### SEC-001: Cookie Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `httpOnly` | `true` | Prevents XSS from reading session |
| `secure` | `true` | HTTPS only |
| `sameSite` | `lax` | Allows Magic Link redirect |
| `path` | `/` | Available on all routes |

**Priority:** P0 (Critical)

---

### SEC-002: Rate Limiting

**Requirement:** Prevent brute-force login attempts.

**Supabase built-in:** Rate limits Magic Link requests per email (default: 60 seconds between requests).

**Frontend:** Disable "Send" button for 60 seconds after successful request. Show countdown.

**Priority:** P1 (High)

---

### SEC-003: Magic Link Expiry

**Requirement:** Magic Links expire after a reasonable time.

**Supabase default:** 1 hour (3600 seconds).

**Recommended:** Keep default (1 hour). Users may not check email immediately.

**Configuration:** Supabase Dashboard → Authentication → Settings → Mailer OTP Expiration.

**Priority:** P1 (High)

---

### SEC-004: No User Registration

**Requirement:** New users CANNOT self-register. Admin-only user creation.

**Configuration:**
- Supabase Dashboard → Authentication → Settings → Disable Sign-ups: **ON**
- Only admin can create users (via Dashboard or Admin API)
- Magic Link for existing emails only (but don't reveal this to users)

**Rationale:** Paid SaaS platform. Users are added by admin after purchase.

**Priority:** P0 (Critical)

---

## Testing Checklist

### Happy Path
- [ ] Navigate to /login → see login form
- [ ] Enter valid email → see "Check je inbox" message
- [ ] Click Magic Link in email → redirected to /integraal
- [ ] Header shows user email + "Uitloggen"
- [ ] Navigate between modules → all work
- [ ] Click "Uitloggen" → redirected to /login
- [ ] Footer shows "Inloggen" when logged out

### Protection
- [ ] Navigate to /instrumenten when logged out → redirect to /login
- [ ] After login → redirected to /instrumenten (preserved destination)
- [ ] Access /api/v1/modules/instrumenten directly → 401
- [ ] Homepage (/) remains accessible without login
- [ ] /login accessible without login
- [ ] /support accessible without login (when built)

### Edge Cases
- [ ] Enter non-existent email → same success message (security)
- [ ] Click expired Magic Link → see expiry error
- [ ] Click Magic Link twice → second click shows error or is ignored
- [ ] Open Magic Link in different browser → session in that browser
- [ ] Close browser, reopen → still logged in (persistent session)
- [ ] Multiple tabs → all share same session
- [ ] Request Magic Link, wait >1 hour, click → expired error

### Error States
- [ ] Empty email → validation error
- [ ] Invalid email format → validation error
- [ ] Spam "Send" button → rate limit message
- [ ] No internet when clicking send → network error
- [ ] Supabase down → generic error message

---

## Privacy & Data Retention

### AUTH-019: Data Retention for Cancelled Members

**Requirement:** When a member's subscription expires or is cancelled, their account data is NOT automatically deleted.

**Rationale:**
- Simplifies renewal process (member can easily reactivate)
- Preserves organizational relationship (member may return later)
- Admin retains control over data lifecycle
- Avoids accidental data loss from temporary cancellations

**Data lifecycle:**

| Subscription State | User Data Status | Access to Platform |
|-------------------|------------------|-------------------|
| Active | Retained | Full access |
| Expired (grace period) | Retained | Full access |
| Expired (past grace) | Retained | Redirected to /verlopen page |
| Cancelled | Retained | Redirected to /verlopen page |
| Admin-deleted | Removed from database | No authentication possible |

**Deletion process:**
1. **V1.0:** Manual deletion by admin via Supabase Dashboard
2. **V1.1+ (planned):** Self-service deletion button in profile page
3. **Future consideration:** Optional auto-deletion X days after cancellation (not implemented in V1.0)

**GDPR compliance:**
- Privacy policy documents retention policy
- Users can request deletion via contact@rijksuitgaven.nl
- Admin processes deletion requests within 30 days
- No automatic deletion ensures no accidental data loss

**Priority:** P1 (High) — Important for business operations and GDPR compliance

---

### AUTH-020: Data Minimization

**Requirement:** Only collect personal data that is strictly necessary for service delivery.

**Data collected:**

| Field | Required? | Purpose | Legal Basis |
|-------|-----------|---------|-------------|
| Email | Yes | Authentication (Magic Link) | Contract performance (AVG 6(1)(b)) |
| Name | Yes | Identification within platform | Contract performance (AVG 6(1)(b)) |
| Organization | Yes | Organizational affiliation | Contract performance (AVG 6(1)(b)) |
| Subscription plan | Yes | Access control, billing | Contract performance (AVG 6(1)(b)) |
| Subscription dates | Yes | Access control | Contract performance (AVG 6(1)(b)) |
| Role (member/admin) | Yes | Authorization for /team pages | Contract performance (AVG 6(1)(b)) |
| Notes (admin-only) | No | Administrative reference | Legitimate interest (AVG 6(1)(f)) |

**Data NOT collected:**
- No passwords (passwordless authentication)
- No IP addresses (no logging/tracking)
- No device information
- No behavioral analytics
- No third-party tracking

**Priority:** P0 (Critical) — GDPR requirement

---

### AUTH-021: Data Processor Documentation

**Requirement:** Document all third-party services that process personal data.

**Data processors:**

| Processor | Service | Data Processed | Location | Safeguards |
|-----------|---------|----------------|----------|------------|
| Supabase Inc. | Database + Auth | Email, name, org, subscription data, session tokens | Frankfurt, Germany (AWS EU-Central-1) | AVG processor agreement, data stays in EU |
| Railway Corp. | Application hosting | Session cookies (in transit), no persistent storage | Amsterdam, Netherlands | AVG processor agreement, data stays in EU |
| Resend Inc. | Email delivery (Magic Links) | Email addresses (transient) | United States (with EU processing) | Standard Contractual Clauses (SCCs), AVG processor agreement |

**Sub-processors:**
- Supabase uses AWS (Frankfurt datacenter) — covered by Supabase DPA
- Railway uses Google Cloud (Amsterdam) — covered by Railway DPA
- All processors maintain sub-processor lists per GDPR requirements

**Documentation location:** Privacy policy at `/privacybeleid` (Article 4)

**Priority:** P0 (Critical) — GDPR requirement (AVG artikel 28)

---

### AUTH-022: User Rights Implementation

**Requirement:** Enable users to exercise their GDPR rights.

**Rights supported:**

| Right | AVG Article | Implementation | Status |
|-------|-------------|----------------|--------|
| Right to access | 15 | User can request data export via contact@rijksuitgaven.nl | ✅ Manual process |
| Right to rectification | 16 | User can request corrections via contact@rijksuitgaven.nl | ✅ Manual process |
| Right to erasure | 17 | Admin deletes account via Supabase Dashboard | ✅ Manual (V1.0) |
| Right to restriction | 18 | User can request processing limitation via contact@rijksuitgaven.nl | ✅ Manual process |
| Right to data portability | 20 | CSV/Excel export available in-app (max 500 rows) | ✅ Implemented |
| Right to object | 21 | User can request deletion (no profiling/marketing occurs) | ✅ Manual process |
| Right to lodge complaint | 77 | Privacy policy includes link to Autoriteit Persoonsgegevens | ✅ Documented |

**Response time:** 30 days (GDPR requirement: 1 month)

**Self-service (planned V1.1+):**
- Profile page: Download my data (JSON export)
- Profile page: Delete my account (with confirmation)

**Priority:** P0 (Critical) — GDPR requirement

---

## Out of Scope (V1.0)

| Feature | Planned Version | Notes |
|---------|----------------|-------|
| Password login | Never | Magic Link only, by design |
| Social login (Google, GitHub) | Never (V1.0 decision) | Simplicity over convenience |
| Multi-factor authentication | V1.1+ | If enterprise customers request |
| Role-based access control | V2.0+ | All V1.0 users have same access |
| User self-registration | V1.1+ | Admin-only for now (paid SaaS) |
| Account deletion | V1.1+ | Manual via Supabase Dashboard |
| Email change | V1.1+ | Manual via Supabase Dashboard |
| "Remember me" toggle | Never | Sessions always persist |
| Password reset | Never | No passwords exist |
| Login with phone/SMS | V2.0+ | If demand exists |
| Session management UI | V1.1+ | "Active sessions" list |
| Audit log | V1.1+ | Track login/logout events |
| Recent search history | Post-auth | Requires user identity (SR-004) |

---

## Decisions Log

All questions resolved on 2026-02-08:

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Session duration | **30 days** | Good balance of convenience and security for paid platform |
| Q2 | SMTP provider | **Resend** (custom domain) | Professional from-address (noreply@rijksuitgaven.nl), better deliverability |
| Q3 | Login page header | **Minimal (logo only)** | Industry standard for SaaS login (Stripe, Linear, Notion). Clean, focused. WordPress also used simple centered form |
| Q4 | Homepage (/) before Week 8 | **Redirect to /login** | Simplest pattern. WordPress showed marketing page but that's Week 8 scope. After login → /integraal (mirrors WordPress's /zoek/ landing) |
| Q5 | Magic Link from-address | **noreply@rijksuitgaven.nl** | Custom domain via Resend. Requires DNS setup (SPF, DKIM, DMARC) |

**WordPress baseline reference:** Login was username+password centered form. Logged-out homepage was marketing page with "Probeer nu" + "Login" buttons. Logged-in homepage redirected to `/zoek/` with full module navigation + "Uitloggen" link. New platform follows same pattern but with Magic Link instead of password.

---

## Implementation Order (Recommended)

| Day | Task | Depends On |
|-----|------|------------|
| Day 1 | Install `@supabase/ssr`, create Supabase clients (client/server/middleware) | Nothing |
| Day 1 | Create middleware.ts with route protection | Supabase clients |
| Day 1 | Enable Supabase Auth settings (disable signups, Magic Link) | Nothing (Supabase Dashboard) |
| Day 2 | Build /login page with login form | Supabase clients |
| Day 2 | Build /auth/callback route | Supabase clients |
| Day 2 | Test end-to-end login flow | Login page + callback |
| Day 3 | Update header with auth state (logged in/out) | Working auth |
| Day 3 | Update footer auth link | Working auth |
| Day 3 | Build /profiel page (minimal) | Working auth |
| Day 3 | Add BFF route authentication | Working auth |
| Day 4 | Customize Magic Link email template | Nothing (Supabase Dashboard) |
| Day 4 | Export WordPress users, import to Supabase | Nothing |
| Day 4 | Test with real migrated user | User import |
| Day 4 | Frontend 401 handling in api.ts | BFF auth |

---

**Document Status:** Ready for Implementation
**Last Updated:** 2026-02-08
**Author:** Technical Project Manager (AI Assistant)
