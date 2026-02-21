# Infrastructure Architecture

**Project:** Rijksuitgaven.nl
**Version:** 2.0 (Current Deployment)
**Date:** 2026-02-11
**Status:** Deployed

---

## Table of Contents

1. [Overview](#overview)
2. [Railway Services](#railway-services)
3. [Supabase Configuration](#supabase-configuration)
4. [Domain & DNS](#domain--dns)
5. [Environment Variables](#environment-variables)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Monitoring & Logging](#monitoring--logging)
8. [Cost Breakdown](#cost-breakdown)
9. [Scaling Strategy](#scaling-strategy)

---

## Overview

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY (Amsterdam)                       │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │  Next.js 16      │  │  FastAPI         │  │Typesense │  │
│  │  Frontend        │  │  Backend         │  │ Search   │  │
│  │                  │  │                  │  │          │  │
│  │ Port: 3000       │  │ Port: 8000       │  │Port: 8108│  │
│  │ €15-25/mo        │  │ €15-25/mo        │  │€15-25/mo │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬────┘  │
│           │                     │                   │       │
└───────────┼─────────────────────┼───────────────────┼───────┘
            │                     │                   │
            │                     ▼                   │
            │           ┌─────────────────┐           │
            │           │   SUPABASE      │           │
            │           │  (Frankfurt)    │           │
            │           │                 │           │
            └──────────►│  PostgreSQL     │◄──────────┘
                        │  Auth           │
                        │  Storage        │
                        │                 │
                        │  Pro Plan       │
                        │  €25/mo         │
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   USERS         │
                        │                 │
                        │ beta.rijks      │
                        │ uitgaven.nl     │
                        └─────────────────┘
```

### Data Flow

```
User Browser (HTTPS)
    │
    ▼
beta.rijksuitgaven.nl (CNAME → Railway)
    │
    ▼
Next.js Frontend (Railway Amsterdam)
    │
    ├─► API Routes (BFF Proxy)
    │   │ - X-BFF-Secret header
    │   │ - 8 routes total
    │   │
    │   ├─► FastAPI Backend (Railway Amsterdam)
    │   │   │ - asyncpg queries
    │   │   │ - X-BFF-Secret validation
    │   │   │
    │   │   ├─► Supabase PostgreSQL (Frankfurt)
    │   │   │   - Read-only queries (public)
    │   │   │   - Admin queries (service_role)
    │   │   │
    │   │   └─► Typesense (Railway Amsterdam)
    │   │       - Autocomplete search
    │   │
    │   └─► Supabase Auth (Frankfurt)
    │       - Magic Link email via Resend
    │
    └─► Client-side (Browser)
        - Supabase Auth PKCE exchange
        - Session management
```

---

## Railway Services

### Next.js Frontend

| Property | Value |
|----------|-------|
| **Service Name** | rijksuitgaven |
| **URL** | `https://rijksuitgaven-production.up.railway.app` |
| **Custom Domain** | `beta.rijksuitgaven.nl` |
| **Root Directory** | `app` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Port** | 3000 |
| **Region** | EU West (Amsterdam) |
| **Resources** | 512MB RAM, 0.5 vCPU (auto-scaled) |
| **Cost** | €15-25/month |

**Deployment Trigger:** Push to `main` branch

**Health Check:** Railway auto-detect (checks HTTP 200 on port 3000)

**Environment Variables:** See [Environment Variables](#environment-variables)

### FastAPI Backend

| Property | Value |
|----------|-------|
| **Service Name** | rijksuitgaven-api |
| **URL** | `https://rijksuitgaven-api-production-3448.up.railway.app` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Port** | 8000 (Railway injects `$PORT`) |
| **Region** | EU West (Amsterdam) |
| **Resources** | 1GB RAM, 1 vCPU (auto-scaled) |
| **Cost** | €15-25/month |

**Deployment Trigger:** Push to `main` branch

**Health Check:** `GET /health` → `{"status": "healthy", "database": "connected"}`

**API Documentation:** `GET /docs` (Swagger UI)

**Environment Variables:** See [Environment Variables](#environment-variables)

### Typesense Search Engine

| Property | Value |
|----------|-------|
| **Service Name** | typesense |
| **URL** | `https://typesense-production-35ae.up.railway.app` |
| **Template** | Official Typesense Railway template |
| **Port** | 8108 |
| **Region** | EU West (Amsterdam) |
| **Resources** | 512MB RAM, 5GB volume (persistent) |
| **Cost** | €15-25/month |
| **Volume** | `/data` (persistent across deploys) |

**Data Persistence:** All Typesense data stored on Railway volume (survives redeploys)

**Collections:** 7 (recipients, instrumenten, inkoop, publiek, gemeente, provincie, apparaat)

**Document Count:** ~2.1M documents across all collections

**Performance:** <25ms search (target: <100ms)

**Re-indexing:** Manual via `scripts/typesense/sync_to_typesense.py` (see `scripts/typesense/README.md`)

**Environment Variables:**

- `TYPESENSE_API_KEY` (rotated 2026-02-07, stored in Railway only)
- `TYPESENSE_DATA_DIR=/data` (persistent volume mount)

---

## Supabase Configuration

### Project Details

| Property | Value |
|----------|-------|
| **Project Name** | rijksuitgaven |
| **Project URL** | `https://kmdelrgtgglcrupprkqf.supabase.co` |
| **Database Host** | `aws-1-eu-west-1.pooler.supabase.com:5432` |
| **Region** | Europe (Frankfurt) |
| **Plan** | Pro (upgraded 2026-01-23) |
| **Cost** | €25/month |

**Database Size:** ~500MB (3.1M rows across 7 source tables)

**Extensions Enabled:**

- `postgis` (geospatial, for future V9 address clustering)
- `vector` (pgvector, for future V3+ semantic search)

### Authentication Configuration

| Setting | Value |
|---------|-------|
| **Provider** | Magic Link (passwordless) |
| **SMTP** | Resend (`smtp.resend.com:587`) |
| **From Email** | `noreply@rijksuitgaven.nl` |
| **Access Token TTL** | 1 hour |
| **Refresh Token TTL** | 7 days |
| **Auto-confirm** | Enabled (no email verification step) |

**Email Template:** Supabase default (can customize later)

### Storage Configuration

| Bucket | Purpose | Public Access |
|--------|---------|---------------|
| `avatars` | User profile images (future) | Public |
| `exports` | CSV/XLS exports (future) | Private (signed URLs) |

**Current Usage:** 0GB (no file uploads in V2.0)

### Database Schema

**Tables (7 source + 1 membership):**

- `instrumenten` (1,098,950 rows)
- `apparaat` (47,992 rows)
- `inkoop` (1,059,270 rows)
- `provincie` (169,638 rows)
- `gemeente` (375,939 rows)
- `publiek` (384,063 rows)
- `universal_search` (2,135,852 rows, materialized view)
- `subscriptions` (membership management)

**Materialized Views (7 aggregated):**

- `instrumenten_aggregated`
- `apparaat_aggregated`
- `inkoop_aggregated`
- `provincie_aggregated`
- `gemeente_aggregated`
- `publiek_aggregated`
- `universal_search` (also serves as aggregated view for integraal)

**Indexes:** 40+ indexes on filter columns, sort columns, and foreign keys

**Triggers:** Source column normalization triggers on 6 module tables

---

## Domain & DNS

### Current Setup (Beta)

| Domain | Type | Target | Status |
|--------|------|--------|--------|
| `beta.rijksuitgaven.nl` | CNAME | `j65ghs38.up.railway.app` | ✅ Active |

**SSL Certificate:** Managed by Railway (auto-renew)

**Propagation:** ~5 minutes (TransIP DNS)

### Future Production Cutover

| Domain | Type | Target | Status |
|--------|------|--------|--------|
| `rijksuitgaven.nl` | CNAME | `j65ghs38.up.railway.app` | ⏳ Planned |

**Cutover Plan:**

1. Test beta thoroughly with 5 users (Week 8)
2. Update DNS CNAME from current server to Railway
3. Propagation: ~5 minutes
4. Email 50 WordPress users with new link
5. Monitor for 24 hours
6. Shut down WordPress after 1 week

**Rollback:** Revert DNS CNAME to old server (5 minute propagation)

---

## Environment Variables

### Next.js Frontend (Railway)

```env
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://kmdelrgtgglcrupprkqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase (admin - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (NEVER expose to browser)

# Backend API
BACKEND_API_URL=https://rijksuitgaven-api-production-3448.up.railway.app

# BFF Security
BFF_SECRET=<shared-secret> (same as backend)

# Node Environment
NODE_ENV=production
```

### FastAPI Backend (Railway)

```env
# Supabase Database
SUPABASE_DB_URL=postgresql://postgres.kmdelrgtgglcrupprkqf:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Typesense
TYPESENSE_URL=https://typesense-production-35ae.up.railway.app
TYPESENSE_API_KEY=<api-key>

# BFF Security
BFF_SECRET=<shared-secret> (same as frontend)

# Python Environment
PYTHONUNBUFFERED=1
```

### Typesense (Railway)

```env
TYPESENSE_API_KEY=<api-key>
TYPESENSE_DATA_DIR=/data
```

**Secret Rotation:**

- `BFF_SECRET`: Manual rotation, update both frontend + backend
- `TYPESENSE_API_KEY`: Rotated 2026-02-07, update frontend + backend + scripts
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase-managed, rotate via dashboard

---

## Deployment Pipeline

### Automated Deployment (Git Push)

```
Developer (Local)
    │
    │ git push origin main
    │
    ▼
GitHub Repository
    │
    │ Webhook notification
    │
    ▼
Railway CI/CD
    │
    ├─► Next.js Frontend
    │   1. Detect change in /app
    │   2. npm install
    │   3. npm run build
    │   4. Deploy new container
    │   5. Health check
    │   6. Switch traffic (zero downtime)
    │   │
    │   Duration: ~2 minutes
    │
    └─► FastAPI Backend
        1. Detect change in /backend
        2. pip install -r requirements.txt
        3. Start uvicorn
        4. Health check (GET /health)
        5. Switch traffic (zero downtime)
        │
        Duration: ~1 minute
```

**Typesense:** Not auto-deployed (persistent service, manual re-index only)

**Rollback:** Railway UI → Deployments → Rollback to previous (1 click)

### Manual Data Operations

**Typesense Re-index:**

```bash
# From local machine
export SUPABASE_DB_PASSWORD=<password>
python scripts/typesense/sync_to_typesense.py
```

**Duration:** ~10 minutes for 2.1M documents

**See:** `scripts/typesense/README.md`

**Database Migration:**

```bash
# Connect to Supabase via psql
/usr/local/Cellar/libpq/18.1/bin/psql "$SUPABASE_DB_URL"

# Run migration
\i scripts/sql/030-subscriptions.sql
```

**See:** `scripts/sql/DATABASE-DOCUMENTATION.md`

---

## Monitoring & Logging

### Railway Built-in Monitoring

**Available Metrics:**

- CPU usage (%)
- Memory usage (MB)
- Network traffic (MB/s)
- Request rate (req/s)
- Response time (ms)
- Error rate (%)

**Access:** Railway Dashboard → Service → Metrics tab

**Retention:** 7 days (free), 30 days (Pro plan when we upgrade)

### Logs

**Railway Logs:**

```bash
# View live logs
railway logs --service rijksuitgaven

# View backend logs
railway logs --service rijksuitgaven-api
```

**Retention:** 24 hours (free), 7 days (Pro plan)

**Log Search:** Railway UI → Service → Logs tab → Search bar

**Alerting:** Not yet configured (deferred to V2.1)

### Supabase Dashboard

**Available Metrics:**

- Database connections (current / max)
- Database size (MB)
- API requests (count)
- Storage usage (MB)

**Access:** `https://supabase.com/dashboard/project/kmdelrgtgglcrupprkqf`

**Query Performance:** Supabase → Database → Query Performance (slow query log)

### Health Checks

**Frontend:** Railway auto-detect (HTTP 200 on port 3000)

**Backend:** `GET /health`

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-11T12:34:56Z"
}
```

**Typesense:** `GET /health`

```json
{
  "ok": true
}
```

---

## Cost Breakdown

### Monthly Operating Costs (Current V2.0)

| Service | Component | Cost (€/month) |
|---------|-----------|----------------|
| **Railway** | Next.js Frontend | €15-25 |
| | FastAPI Backend | €15-25 |
| | Typesense | €15-25 |
| | **Railway Subtotal** | **€45-75** |
| **Supabase** | Pro Plan (PostgreSQL + Auth + Storage) | €25 |
| **Total** | | **€70-100** |

**Budget:** €180/month

**Buffer:** €80-110/month (for growth, V3 AI services, etc.)

### Cost Drivers

**Railway:**

- CPU time (billed per minute)
- Memory usage (billed per MB)
- Network egress (billed per GB)

**Supabase:**

- Fixed €25/month (Pro plan)
- Includes: 8GB database, 100GB bandwidth, 100GB file storage

### Cost Controls

1. **Railway Spending Limit:** Set max €100/month (Railway dashboard)
2. **Auto-scaling:** Services scale down during low traffic
3. **Database pooler:** Supabase pooler reduces connection overhead
4. **Typesense volume:** Fixed 5GB (doesn't grow with data)

### Future V3+ Costs

| Service | Purpose | Est. Cost (€/month) |
|---------|---------|---------------------|
| Claude API | Rijksuitgaven Reporter (V3) | €10-15 |
| Redis | AI response caching (V6) | €7-10 |
| Worker service | Background jobs (V3+) | €5-10 |
| **Total V3-V6** | | **€22-35** |

**Projected V6 Total:** €92-135/month (within €180 budget)

---

## Scaling Strategy

### Current Capacity

| Metric | Current | Notes |
|--------|---------|-------|
| Concurrent users | ~100 | Railway auto-scales |
| Database connections | 20/100 | Supabase pooler |
| Database size | 500MB/8GB | Pro plan capacity |
| API requests/min | ~50 | No rate limiting yet |
| Search latency | <25ms | Typesense performance |

### Scaling Triggers

**When to scale up:**

1. **CPU > 80%** for > 5 minutes → Increase Railway CPU allocation
2. **Memory > 80%** → Increase Railway memory allocation
3. **Database connections > 80** → Add read replica (Supabase)
4. **Database size > 6GB** → Upgrade Supabase plan
5. **API latency > 500ms** → Add backend instances (Railway)

### Horizontal Scaling (Future)

**Railway supports:**

- Multiple frontend instances (load balanced)
- Multiple backend instances (load balanced)
- Typesense clustering (manual setup)

**When needed:** >1,000 concurrent users

**Cost:** ~2x current infrastructure costs

### Vertical Scaling (Immediate)

**Railway GUI sliders:**

- Increase RAM: 512MB → 1GB → 2GB → 4GB
- Increase CPU: 0.5 vCPU → 1 vCPU → 2 vCPU

**Supabase plans:**

- Pro: 8GB database, €25/month (current)
- Team: 32GB database, €599/month
- Enterprise: Custom, contact sales

---

## Pre-Launch Checklist

- [ ] Verify all environment variables set in Railway
- [ ] Test deployment pipeline (push to main → auto-deploy)
- [ ] Verify health checks passing
- [ ] Test DNS cutover plan (beta → production)
- [ ] Configure Railway spending limit (€100/month)
- [ ] Set up error alerting (email on 500 errors)
- [ ] Document rollback procedure
- [ ] Test rollback (deploy → rollback → verify)
- [ ] Verify Supabase backups enabled (daily automatic)
- [ ] Document incident response plan

---

**Document maintained by:** Technical Lead
**Last updated:** 2026-02-11
