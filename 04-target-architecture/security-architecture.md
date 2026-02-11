# Security Architecture

**Project:** Rijksuitgaven.nl
**Version:** 1.0 (Current Deployment)
**Date:** 2026-02-11
**Status:** Deployed

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Network Security](#network-security)
3. [Database Security](#database-security)
4. [HTTP Security Headers](#http-security-headers)
5. [Input Validation & Sanitization](#input-validation--sanitization)
6. [Export Security](#export-security)
7. [Secrets Management](#secrets-management)
8. [Security Audit Findings](#security-audit-findings)

---

## Authentication & Authorization

### Authentication: Supabase Auth + Magic Link

**Flow:**

1. User enters email at `/login`
2. Frontend calls BFF route `/api/auth/magiclink`
3. BFF calls Supabase Auth `signInWithOtp({ email })`
4. Supabase sends magic link email via Resend SMTP
5. User clicks link → redirected to `/auth/callback?code=...`
6. **Client-side PKCE exchange:**
   ```typescript
   const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   await supabase.auth.exchangeCodeForSession(code)
   ```
7. Browser sets httpOnly cookies (`sb-access-token`, `sb-refresh-token`)
8. User redirected to `/integraal`

**Critical Implementation Detail (Next.js 16):**

- Server-side `cookieStore().set()` in dynamic rendering SUCCEEDS silently but clears auth cookies
- Solution: ALL auth cookie management is client-side via `createBrowserClient`
- `lib/supabase/server.ts` `setAll()` function is now a no-op
- Middleware uses its own `createServerClient` for token refresh

**Session Management:**

- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days
- Middleware refreshes token on every request if needed
- Logout: Client-side `supabase.auth.signOut()` + clear cookies

### Authorization: Subscription-Based + Admin Role

**Subscription Check (Middleware):**

```typescript
// After auth check, before page access
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .single()

const status = computeStatus(subscription)

if (status === 'expired') {
  return NextResponse.redirect('/verlopen')
}

if (status === 'grace') {
  // Show banner warning, allow access
}
```

**Status Computation (No Cron Job):**

```typescript
function computeStatus(sub: Subscription): 'active' | 'grace' | 'expired' {
  if (sub.cancelled_at) return 'expired'

  const now = new Date()
  if (now <= new Date(sub.end_date)) return 'active'
  if (now <= new Date(sub.grace_ends_at)) return 'grace'

  return 'expired'
}
```

**Grace Periods:**

- Monthly plan: 3 days
- Yearly plan: 14 days

**Admin Role:**

- Stored in `subscriptions.role` column ('member' | 'admin')
- Admin pages: `/team`, `/team/leden`
- Admin API routes check role before allowing mutations
- Service role client used for admin operations (bypasses RLS)

---

## Network Security

### BFF (Backend-for-Frontend) Proxy Pattern

**Architecture:**

```
Browser → Next.js BFF → FastAPI Backend
              ↓
        X-BFF-Secret
```

**8 BFF Routes (app/src/app/api/...):**

1. `/api/modules/route.ts` → `GET /api/v1/modules`
2. `/api/[module]/route.ts` → `GET /api/v1/modules/{module}`
3. `/api/[module]/[value]/details/route.ts` → `GET /api/v1/modules/{module}/{value}/details`
4. `/api/[module]/[value]/grouping-counts/route.ts` → `GET /api/v1/modules/{module}/{value}/grouping-counts`
5. `/api/[module]/filters/route.ts` → `POST /api/v1/modules/{module}/filter-options`
6. `/api/autocomplete/route.ts` → `GET /api/v1/search/autocomplete`
7. `/api/auth/magiclink/route.ts` → Supabase Auth
8. `/api/feedback/route.ts` → UX-025 feedback submission

**X-BFF-Secret Header:**

```typescript
// BFF adds header
headers: {
  'X-BFF-Secret': process.env.BFF_SECRET!,
}

// Backend validates
@app.middleware("http")
async def verify_bff_secret(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        secret = request.headers.get("X-BFF-Secret")
        if secret != os.getenv("BFF_SECRET"):
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
    return await call_next(request)
```

**Why BFF Pattern:**

- Keeps `TYPESENSE_API_KEY` server-side (never exposed to browser)
- Single shared secret between Next.js and FastAPI
- Backend is directly internet-accessible (Railway limitation)
- BFF is cosmetic proxy, NOT security boundary

**Pre-Launch TODO:**

- Add rate limiting (Railway plugin or FastAPI middleware)
- Consider network isolation (Railway private networking)

---

## Database Security

### Row Level Security (RLS)

**All tables have RLS enabled:**

```sql
ALTER TABLE instrumenten ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparaat ENABLE ROW LEVEL SECURITY;
-- ... (all 7 source tables + subscriptions)
```

**Public Read Access (Source Tables):**

```sql
CREATE POLICY "public_read" ON instrumenten
FOR SELECT USING (true);
```

**Subscription-Protected:**

```sql
CREATE POLICY "user_read_own" ON subscriptions
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_role_all" ON subscriptions
USING (auth.jwt()->>'role' = 'service_role');
```

**Service Role Usage:**

- Used ONLY in `/api/team/leden` route (admin member management)
- Created via `lib/supabase/supabase-admin.ts`:
  ```typescript
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  ```
- Railway environment variable: `SUPABASE_SERVICE_ROLE_KEY`

### SQL Injection Prevention

**All queries use parameterized queries:**

```python
# ✅ SAFE - parameterized
cursor = await conn.execute(
    "SELECT * FROM instrumenten WHERE ontvanger = $1",
    [recipient]
)

# ❌ NEVER DO THIS - string interpolation
cursor = await conn.execute(
    f"SELECT * FROM instrumenten WHERE ontvanger = '{recipient}'"
)
```

**Column/Table Name Whitelisting:**

```python
ALLOWED_SORT_COLUMNS = ['ontvanger', 'totaal', 'y2024', 'y2023', ...]
ALLOWED_MODULES = ['instrumenten', 'apparaat', 'inkoop', ...]

if sort_by not in ALLOWED_SORT_COLUMNS:
    raise HTTPException(400, "Invalid sort column")
```

---

## HTTP Security Headers

### Content Security Policy (CSP)

```typescript
// middleware.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

response.headers.set('Content-Security-Policy', cspHeader)
```

**Why `unsafe-inline` and `unsafe-eval`:**

- Next.js development requires `unsafe-eval`
- Inline styles needed for Tailwind CSS and shadcn/ui components
- Trade-off: Next.js compatibility vs. strict CSP

**Future hardening:**

- Use nonces for inline scripts (Next.js 15+ support)
- Remove `unsafe-eval` in production build

### HTTP Strict Transport Security (HSTS)

```typescript
response.headers.set(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
)
```

- 2 years max-age
- Includes subdomains
- Preload-eligible (for future submission to HSTS preload list)

### Other Security Headers

```typescript
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
response.headers.set(
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=()'
)
```

---

## Input Validation & Sanitization

### Body Size Validation

**Critical: NEVER trust Content-Length header**

```typescript
// ✅ CORRECT - Read actual bytes
const text = await request.text()
if (text.length > MAX_SIZE) {
  return new Response('Payload too large', { status: 413 })
}
const body = JSON.parse(text)

// ❌ WRONG - Trusting Content-Length header
const contentLength = request.headers.get('content-length')
if (Number(contentLength) > MAX_SIZE) { // Attacker can lie
  return new Response('Payload too large', { status: 413 })
}
```

**Limits:**

- Cascading filter request: 100 values per key (BFF + backend both enforce)
- Feedback text: 5,000 characters
- Feedback screenshot: 5MB

### Cascading Filter Value Limit

**Prevents abuse via massive filter payloads:**

```python
# backend/app/services/modules.py
for key, values in filters.items():
    if len(values) > 100:
        raise HTTPException(400, f"Filter '{key}' has too many values")
```

```typescript
// app/src/app/api/[module]/filters/route.ts
if (Array.isArray(value) && value.length > 100) {
  return NextResponse.json(
    { error: 'Too many filter values' },
    { status: 400 }
  )
}
```

### Zod Schema Validation (Frontend)

```typescript
const FeedbackSchema = z.object({
  message: z.string().min(1).max(5000),
  userAgent: z.string().optional(),
  url: z.string().url(),
  screenshot: z.string().optional(), // base64
})
```

---

## Export Security

### CSV Formula Injection Prevention

**Problem:** Excel interprets cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` as formulas.

**Solution:** Prefix dangerous characters with single quote:

```python
def sanitize_csv_cell(value: str) -> str:
    if value and value[0] in ['=', '+', '-', '@', '\t', '\r']:
        return f"'{value}"
    return value
```

**Applied to all CSV exports:**

- `/api/v1/modules/{module}/export` (500 row limit enforced)

---

## Secrets Management

### Environment Variables (Railway)

**All secrets stored in Railway environment variables:**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (public, but rate-limited by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (admin access, NEVER exposed to browser)
- `BFF_SECRET` (shared between Next.js and FastAPI)
- `TYPESENSE_API_KEY` (server-side only)
- `TYPESENSE_URL`
- `RESEND_API_KEY` (email sending)

**Railway deploys inject these automatically.**

**Local development:**

```bash
# app/.env.local (gitignored)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh... (admin)
BFF_SECRET=your-secret-here
BACKEND_API_URL=http://localhost:8000

# backend/.env (gitignored)
SUPABASE_DB_URL=postgresql://...
TYPESENSE_URL=http://localhost:8108
TYPESENSE_API_KEY=your-key
BFF_SECRET=your-secret-here (same as frontend)
```

**Never commit:**

- `.env` files
- API keys
- Passwords
- Private keys

---

## Security Audit Findings

### Audit Date: 2026-02-08

**Critical Fixes Applied:**

1. **Body size validation:** Switched from Content-Length header to actual byte read
2. **Cascading filter limits:** Enforced 100 values per key (BFF + backend)
3. **CSV formula injection:** Added single quote prefix for dangerous characters
4. **X-BFF-Secret:** Added shared secret between Next.js and FastAPI
5. **HSTS header:** Added with 2-year max-age and preload

**Medium Priority (Deferred to Pre-Launch):**

1. **Rate limiting:** Not yet implemented (plan: Railway plugin or FastAPI middleware)
2. **Backend network isolation:** Backend is directly accessible (Railway limitation)
3. **CSP nonces:** Using `unsafe-inline` for Next.js compatibility (can harden post-launch)

**Low Priority (Backlog):**

1. **Error logging:** No centralized error tracking (Sentry deferred to V1.1)
2. **Audit logging:** No admin action audit trail (deferred to V1.1)
3. **2FA for admins:** Not implemented (backlog)

---

## Security Checklist (Pre-Launch)

- [ ] Add rate limiting (10 req/min per IP for autocomplete)
- [ ] Review all service_role usage (minimize attack surface)
- [ ] Test auth flow end-to-end on production
- [ ] Verify RLS policies on all tables
- [ ] Scan dependencies for vulnerabilities (`npm audit`, `pip-audit`)
- [ ] Test CSV formula injection with Excel
- [ ] Verify HSTS header in production
- [ ] Document incident response plan

---

**Document maintained by:** Technical Lead
**Last updated:** 2026-02-11
