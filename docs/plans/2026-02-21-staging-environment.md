# Staging Environment Setup

**Date:** 2026-02-21
**Status:** Approved & Operational
**Context:** V0.9 beta is live on beta.rijksuitgaven.nl with 10 testers. We need a safe way to develop and test new features without affecting beta users.

---

## Deployment Map

| Component | Service | Deploys From | Auto-deploy? |
|-----------|---------|-------------|-------------|
| Frontend Production | Railway | `main` branch | Yes |
| Frontend Staging | Railway | `staging` branch | Yes |
| Backend (FastAPI) | Railway | `main` branch | Yes |
| Database | Supabase | Manual migrations | N/A |
| Search | Typesense | Railway, manual sync | N/A |

| Environment | URL | Branch |
|-------------|-----|--------|
| **Production** | beta.rijksuitgaven.nl | `main` |
| **Staging** | frontend-staging-production-ce7d.up.railway.app | `staging` |

**Constraint:** Backend deploys from `main` only. There is no staging backend. Backend changes go live immediately. Frontend staging calls the shared production backend.

---

## Three Workflows

### A. Quick Fix (direct to main)

**When:** Typos, copy changes, urgent bugs, documentation.

```
1. Code on main locally
2. git add + git commit
3. git push origin main                                    → production deploys
4. git push origin main:staging && git branch -f staging main  → keep staging in sync
```

**Rule:** Every push to main MUST sync staging. Never leave staging behind.

### B. Feature Development (staging first)

**When:** New components, new API routes, UI changes, anything non-trivial.

```
1. git checkout -b feature/xyz           (branch from main)
2. ... develop + commit ...
3. git checkout main
4. git merge feature/xyz
5. git push origin main:staging && git branch -f staging main   → staging deploys
6. ... test on staging URL ...
7. git push origin main                  → production deploys
8. git branch -d feature/xyz             → cleanup
```

**Rule:** One feature on staging at a time. Finish and promote before starting the next.

**Verification checklist before promoting to production:**
- [ ] Feature works on staging URL
- [ ] Auth/login still works
- [ ] No console errors
- [ ] If visual change: checked on mobile

### C. Database Migration (highest risk)

**When:** New tables, columns, functions, indexes, ALTER statements.

```
1. Write migration SQL in scripts/sql/
2. Review carefully (additive only — no DROP, no ALTER TYPE)
3. Execute migration on Supabase                           → shared DB, affects both envs
4. Push code to staging                                    → staging deploys
5. Test on staging URL                                     → verify new schema works
6. Push to main                                            → production deploys
```

**Rule:** Migration FIRST, code SECOND. Code must never reference non-existent schema.

**Rule:** Keep migrations backwards-compatible. Old code must still work with new schema during the deploy window.

---

## Constraints & Risks

| # | Risk | Impact | Prevention |
|---|------|--------|------------|
| 1 | Push to main, forget to sync staging | Staging falls behind, future merges conflict | Always use combined push command |
| 2 | Push code before migration | 500 errors for all users | Migration-first rule |
| 3 | Two features on staging, one not ready | Can't promote cleanly | One feature at a time |
| 4 | Env var mismatch between environments | Feature works on staging, breaks on production | Quarterly env var audit |
| 5 | Shared DB migration breaks both envs | Both staging and production down | Additive-only migrations, test locally first |
| 6 | Local staging branch goes stale | Confusion about what's deployed | Always run `git branch -f staging main` after sync |
| 7 | Staging sends real emails | Beta testers get duplicate/test emails | Accepted risk — staging is founder-only |

### Staging Sends Real Emails

Staging has the same `RESEND_API_KEY` as production. Actions on staging (invites, campaigns) send **real emails**. This is acceptable while only the founder uses staging. If staging is ever shared with others, remove `RESEND_API_KEY` from staging env vars.

### No Staging Backend

Backend changes deploy from `main` only. For breaking backend changes (rare), test locally first, then push to `main` with the frontend change in the same commit/deploy window.

---

## Environment Variables

Staging is a duplicate of production. All env vars are identical. No `NEXT_PUBLIC_SITE_URL` exists — the app derives its URL from request headers (`x-forwarded-host`).

Staging URL is added to `ALLOWED_HOSTS` in:
- `app/src/app/api/v1/auth/magic-link/route.ts`
- `app/src/app/api/v1/team/leden/[id]/invite/route.ts`

---

## Future: Full Production

| | V0.9 (now) | V1.0+ |
|--|-----------|-------|
| **Production URL** | beta.rijksuitgaven.nl | rijksuitgaven.nl |
| **Staging URL** | frontend-staging-production-ce7d.up.railway.app | staging.rijksuitgaven.nl (optional) |
| **Staging purpose** | Test before beta testers see it | Test before all users see it |

The workflow stays the same — only the URLs change.

---

## Cost Impact

| Item | Monthly Cost |
|------|-------------|
| Current total | ~€180 |
| Staging frontend service | +€5-10 |
| **New total** | ~€185-190 |
