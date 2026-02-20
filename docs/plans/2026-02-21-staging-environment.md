# Staging Environment Setup

**Date:** 2026-02-21
**Status:** Approved
**Context:** V0.9 beta is live on beta.rijksuitgaven.nl with 10 testers. We need a safe way to develop and test new features without affecting beta users.

---

## Current Deployment

| Component | Service | Deploys From |
|-----------|---------|-------------|
| Frontend (Next.js) | Railway | `main` branch, auto-deploy |
| Backend (FastAPI) | Railway | `main` branch, auto-deploy |
| Database | Supabase | Manual migrations |
| Search | Typesense | Railway, manual sync |

**Production URL:** beta.rijksuitgaven.nl
**Auto-deploy:** Every push to `main` triggers a Railway deploy (~2 min).

---

## Proposed Setup

### Two Environments

| | Production | Staging |
|--|-----------|---------|
| **Branch** | `main` | `staging` |
| **URL** | beta.rijksuitgaven.nl | staging-rijksuitgaven.up.railway.app |
| **Database** | Supabase (shared) | Supabase (shared) |
| **Typesense** | Shared | Shared |
| **Backend** | Shared | Shared |
| **Cost** | Existing | ~€5/month (one extra Railway service) |

Staging is a separate Railway service for the **frontend only**. It shares the same backend, database, and Typesense instance. This means:

- Real data for realistic testing
- No data duplication or sync issues
- Minimal extra cost
- SQL migrations still need care (see below)

### Why Not a Separate Backend/Database?

A fully isolated staging environment (own Supabase project, own backend, own Typesense) would cost ~€30-40/month extra and require data syncing. Not worth it at this stage. The shared-backend approach works because:

1. Most changes are frontend/BFF — the staging frontend just calls the same backend
2. Backend changes are typically backwards-compatible
3. SQL migrations are additive (new tables/columns/functions), not destructive

If we ever need destructive database testing, we can spin up a temporary Supabase project.

---

## Workflow

### Day-to-Day Development

```
1. Code locally on any branch (main, feature/xyz)
2. Push to `staging` branch → auto-deploys to staging URL
3. Test on staging URL with real data
4. When satisfied, merge to `main` → auto-deploys to beta.rijksuitgaven.nl
```

### Git Branch Strategy

```
feature/xyz ──→ staging ──→ main
                  │            │
                  ▼            ▼
              staging URL    beta.rijksuitgaven.nl
```

- **`main`** — always stable, always matches what beta testers see
- **`staging`** — integration branch for testing before release
- **Feature branches** — optional, for larger features

### For Quick Fixes

```
main (direct push) → beta.rijksuitgaven.nl
```

Small fixes (typos, copy changes, urgent bugs) can still go directly to `main`.

### For New Features

```
1. git checkout -b feature/xyz
2. ... develop ...
3. git checkout staging && git merge feature/xyz
4. git push origin staging          → test on staging URL
5. git checkout main && git merge staging
6. git push origin main             → live on beta
```

### SQL Migrations

SQL migrations run against the shared database, so they affect both environments:

- **Additive migrations** (new tables, columns, functions): Safe to run anytime
- **Destructive migrations** (ALTER column type, DROP): Test locally first, apply carefully
- **Rule:** Run migrations BEFORE merging to main, so staging can verify the new schema works

---

## Railway Configuration

### What Needs to Be Created

1. **New Railway service** in the existing project — "Frontend Staging"
2. **Source:** Same GitHub repo, `staging` branch
3. **Root directory:** `app/` (same as production frontend)
4. **Environment variables:** Copy from production frontend, with these changes:

| Variable | Change |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Set to staging Railway URL |
| All others | Same as production |

### What Does NOT Change

- Production Railway service (stays on `main`)
- Backend service (shared)
- Supabase project (shared)
- Typesense service (shared)
- Custom domain setup (beta.rijksuitgaven.nl stays on production)

---

## Future: Full Production

When we move from beta to full production (V1.0+), the setup evolves:

| | V0.9 (now) | V1.0+ |
|--|-----------|-------|
| **Production URL** | beta.rijksuitgaven.nl | rijksuitgaven.nl |
| **Staging URL** | staging-*.up.railway.app | staging.rijksuitgaven.nl (optional) |
| **Staging purpose** | Test before beta testers see it | Test before all users see it |

The workflow stays the same — only the URLs change.

---

## Cost Impact

| Item | Monthly Cost |
|------|-------------|
| Current total | ~€180 |
| Staging frontend service | +€5-10 |
| **New total** | ~€185-190 |

The staging service is lightweight — it's just a Next.js frontend with minimal traffic (only you).
