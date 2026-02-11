# Architecture Overview

> **⚠️ HISTORICAL PROPOSAL (2026-01-14)**
> This document was written before implementation began. The actual system diverged significantly.
> For current architecture, see the "Current Architecture (2026-02-11)" section below, or refer to `logs/SESSION-CONTEXT.md`.

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** 1.0
**Date:** 2026-01-14
**Status:** Historical Document (see Current Architecture below)

---

## Current Architecture (2026-02-11)

### Actual Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Database** | **Supabase PostgreSQL (Frankfurt EU)** | Pro plan, pgvector enabled, Auth built-in |
| **Backend** | **FastAPI + asyncpg** | Raw parameterized queries (NOT SQLAlchemy/Alembic) |
| **Frontend** | **Next.js 16 + TanStack Table + Recharts** | React 19 compatible, NOT Tremor |
| **Search** | **Typesense** | 7 collections, 463K recipients enriched |
| **Auth** | **Supabase Auth + Magic Link + PKCE** | Fully client-side, NOT NextAuth.js |
| **Hosting** | **Railway (Amsterdam)** | Next.js + FastAPI + Typesense |
| **Cache** | **None deployed yet** | Redis deferred to V5 (AI Research Mode) |
| **AI** | **None deployed yet** | Deferred to V2+ (Rijksuitgaven Reporter, Research Mode) |

### Actual Data Flow

```
User Browser
    │
    ▼
Next.js Frontend (Railway)
    │ HTTPS/JSON
    │ (8 BFF proxy routes)
    │
    ▼
FastAPI Backend (Railway)
    │ X-BFF-Secret header
    │
    ├──► Supabase PostgreSQL (Read-only queries via asyncpg)
    │     • 7 source tables (instrumenten, apparaat, inkoop, etc.)
    │     • 7 materialized views (*_aggregated)
    │     • subscriptions table (membership management)
    │
    └──► Typesense (Search autocomplete)
          • 7 collections (recipients, 6 modules)
          • <25ms search performance
```

### Actual Authentication Flow

**Supabase Magic Link + PKCE (Fully Client-Side)**

1. User enters email → `/api/auth/magiclink` (BFF) → Supabase Auth
2. User clicks email link → `/auth/callback` page
3. **Client-side PKCE exchange** (createBrowserClient) → Sets httpOnly cookies
4. Middleware validates session on every request
5. Subscription check: `subscriptions` table (status computed from dates)

**Critical:** NO server-side cookie setting in Next.js 16. All auth state managed client-side.

### Actual Membership System

**Subscriptions Table (No Cron Job)**

- Status computed from dates: `cancelled_at`, `end_date`, `grace_ends_at`
- Grace periods: 3 days (monthly), 14 days (yearly)
- Admin role: `subscriptions.role` column ('member' | 'admin')
- Admin pages: `/team` (dashboard), `/team/leden` (member management)
- Service role client bypasses RLS for admin operations

### Actual Security Architecture

| Layer | Implementation |
|-------|----------------|
| **Network** | BFF proxy pattern, X-BFF-Secret shared secret |
| **Auth** | Supabase session tokens, middleware guards |
| **Database** | RLS policies on all tables, service_role for admin only |
| **HTTP** | CSP (default-src 'self'), HSTS with preload |
| **Input** | Body size validation (read actual bytes), SQL identifier whitelist |
| **Export** | CSV formula injection prevention (prefix with single quote) |

### Actual Infrastructure Costs

```
Supabase (Pro):           €25/month (PostgreSQL + Auth + Storage)
Railway:
  - Next.js frontend:     €15-25/month
  - FastAPI backend:      €15-25/month
  - Typesense:            €15-25/month
─────────────────────────────────────
V1 Total:                 €70-100/month
Budget:                   €180/month
Buffer:                   €80-110/month
```

### Key Divergences from Original Proposal

| Component | Proposed (2026-01-14) | Actual (2026-02-11) | Reason |
|-----------|-----------------------|---------------------|--------|
| Database | MySQL Phase 1 → PostgreSQL Phase 2 | **Supabase PostgreSQL** (direct migration) | pgvector needed for V2, Auth built-in |
| ORM | SQLAlchemy + Alembic | **asyncpg raw queries** | Simpler, no migration overhead |
| Auth | NextAuth.js | **Supabase Auth + Magic Link** | Built-in, passwordless |
| Auth Flow | JWT in httpOnly cookies | **PKCE client-side exchange** | Next.js 16 cookie issues |
| Charts | Tremor | **Recharts** | React 19 compatible |
| Cache | Redis (deployed) | **Not deployed yet** | Not needed until V5 |
| AI | OpenAI + Claude (deployed) | **Not deployed yet** | Deferred to V2+ |
| MCP Server | Implemented | **Not implemented yet** | Deferred to V5 (Research Mode) |

---

## Original Proposal (2026-01-14) - Historical Record

*The content below describes the system as originally envisioned. Refer to the "Current Architecture" section above for the actual deployed system.*

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Deployment Architecture](#deployment-architecture)
6. [Technology Stack](#technology-stack)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Integration Points](#integration-points)
10. [Migration Strategy](#migration-strategy)

---

## Executive Summary

### Current State
- **Platform:** WordPress + WpDataTables + ARMember
- **Database:** MySQL/MariaDB 12.1.2 (~2GB)
- **Performance:** 5s page load, 5s search
- **Users:** 30 paying subscribers
- **Data:** 7 modules, 2.5M+ rows across 50+ tables
- **Pain Points:** Slow search, no AI capabilities, limited scalability

### Target State
- **Frontend:** Next.js 14 (React, TypeScript, SSR)
- **Backend:** Python FastAPI (async, RESTful API)
- **Database:** MySQL (Phase 1) → PostgreSQL (Phase 2)
- **Search:** Typesense (dedicated search engine)
- **Cache:** Redis (query caching, sessions)
- **AI:** OpenAI + Claude (natural language queries)
- **Hosting:** Railway (managed platform)
- **Performance:** <1s page load, <100ms search
- **Cost:** €89-152/month (within €180 budget)

### Key Improvements
- ✅ **50x faster search** (5s → <100ms)
- ✅ **5x faster page loads** (5s → <1s)
- ✅ **AI-powered queries** (natural language interface)
- ✅ **Modern API** (RESTful, documented, extensible)
- ✅ **Scalable architecture** (10x growth capacity)
- ✅ **Cost savings** (€28-91/month)
- ✅ **MCP server support** (AI data access)

---

## High-Level Architecture

### System Context Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SYSTEMS                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐               │
│  │   OpenAI    │  │   Claude     │  │  Mailgun    │               │
│  │   (GPT-4)   │  │  (Anthropic) │  │   (Email)   │               │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘               │
│         │                 │                  │                       │
└─────────┼─────────────────┼──────────────────┼───────────────────────┘
          │                 │                  │
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼───────────────────────┐
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼──────────┐           │
│  │                                                       │           │
│  │           RIJKSUITGAVEN.NL SAAS PLATFORM             │           │
│  │                                                       │           │
│  │  ┌───────────────────────────────────────────────┐   │           │
│  │  │         FRONTEND (Next.js 14)                 │   │           │
│  │  │  • Server-side rendering                      │   │           │
│  │  │  • React components                           │   │           │
│  │  │  • TypeScript                                 │   │           │
│  │  │  • Tailwind CSS + Shadcn/ui                   │   │           │
│  │  │  • TanStack Query (data fetching)             │   │           │
│  │  │  • Supabase Auth (authentication)             │   │           │
│  │  └───────────────────┬───────────────────────────┘   │           │
│  │                      │                               │           │
│  │                      │ HTTPS / JSON                  │           │
│  │                      │                               │           │
│  │  ┌───────────────────▼───────────────────────────┐   │           │
│  │  │         API LAYER (Python FastAPI)            │   │           │
│  │  │  • RESTful endpoints                          │   │           │
│  │  │  • Async/await (high concurrency)             │   │           │
│  │  │  • Pydantic validation                        │   │           │
│  │  │  • Auto-generated OpenAPI docs                │   │           │
│  │  │  • PKCE authentication                        │   │           │
│  │  │  • Rate limiting                              │   │           │
│  │  │  • MCP server implementation                  │   │           │
│  │  │  • Business logic layer                       │   │           │
│  │  └───┬────────┬─────────┬─────────┬──────────────┘   │           │
│  │      │        │         │         │                  │           │
│  │      ▼        ▼         ▼         ▼                  │           │
│  │  ┌────────┐┌─────────┐┌────────┐┌──────────┐        │           │
│  │  │ MySQL  ││Typesense││ Redis  ││   AI     │        │           │
│  │  │(Prod)  ││(Search) ││(Cache) ││ Services │        │           │
│  │  │        ││         ││        ││          │        │           │
│  │  │• 2GB   ││• Index  ││• Query ││• OpenAI  │        │           │
│  │  │• 50+   ││  data   ││  cache ││• Claude  │        │           │
│  │  │  tables││• <100ms ││• Session││• MCP     │        │           │
│  │  │• 7     ││  search ││• Rate  ││          │        │           │
│  │  │  modules││        ││  limit ││          │        │           │
│  │  └────────┘└─────────┘└────────┘└──────────┘        │           │
│  │                                                       │           │
│  └───────────────────────────────────────────────────────┘           │
│                    ALL HOSTED ON RAILWAY                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
                    ┌─────────────────┐
                    │     USERS       │
                    │                 │
                    │  • Citizens     │
                    │  • Researchers  │
                    │  • Journalists  │
                    │  • Organizations│
                    └─────────────────┘
```

---

## System Components

### 1. Frontend Layer (Next.js 14)

**Purpose:** User interface and client-side logic

**Technology:** Next.js 14 with App Router
- React 18 (UI components)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Shadcn/ui (component library)
- TanStack Query (server state management)
- Supabase Auth (authentication)
- Zod (validation)

**Responsibilities:**
- Server-side rendering (SSR) for performance
- Client-side hydration for interactivity
- User authentication UI
- Search interface
- Data tables and visualizations
- AI query interface
- Export functionality
- Responsive design (mobile/tablet/desktop)
- Internationalization (i18n)

**Key Features:**
- Fast initial page loads (<1s)
- SEO-friendly (SSR)
- Accessible (WCAG 2.1 AA)
- Progressive enhancement
- Offline capability (future)

**Location:** Railway (separate service)
**Port:** 3000 (internal), 443 (external HTTPS)
**Dependencies:** API Layer, Redis (session cache)

---

### 2. API Layer (Python FastAPI)

**Purpose:** Business logic, data access, and AI orchestration

**Technology:** Python 3.11+ with FastAPI
- FastAPI 0.109+ (web framework)
- SQLAlchemy 2.0+ (ORM)
- Alembic (migrations)
- Pydantic v2 (validation)
- python-dotenv (config)
- httpx (async HTTP client)
- LangChain (AI orchestration)
- MCP SDK (AI data access)

**Responsibilities:**
- RESTful API endpoints
- Authentication & authorization (Supabase session tokens)
- Database queries (read-only initially)
- Search orchestration (Typesense)
- AI query processing
- MCP server implementation
- Rate limiting
- Caching strategy
- Business logic
- Data transformation
- Error handling

**Key Endpoints:**
```
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

# Search
GET    /api/v1/search?q={query}&modules={modules}&year={year}
GET    /api/v1/search/suggest?q={query}

# Data Modules (7 modules)
GET    /api/v1/modules/instrumenten/recipients
GET    /api/v1/modules/instrumenten/recipients/{id}
GET    /api/v1/modules/instrumenten/consolidated?ontvanger={name}
GET    /api/v1/modules/apparaat/recipients
...

# AI
POST   /api/v1/ai/query
GET    /api/v1/ai/suggestions

# Analytics
GET    /api/v1/analytics/top-recipients
GET    /api/v1/analytics/year-over-year

# MCP Server (for AI tools)
POST   /mcp/get_financial_data
POST   /mcp/search_recipients
```

**Location:** Railway (separate service)
**Port:** 8000 (internal), 443 (external HTTPS)
**Dependencies:** MySQL, Typesense, Redis, OpenAI, Claude

---

### 3. Database Layer (MySQL → PostgreSQL)

**Purpose:** Persistent data storage

#### Phase 1: MySQL (Current)
**Technology:** MySQL/MariaDB 12.1.2
- Keep existing schema
- Read-only access from new platform
- Continue using existing data import process

**Data Structure:**
- 7 data modules (each with 3 tables: source, pivot, consolidated)
- Universal search table (2.1M rows)
- Analytics/insights tables
- WordPress user/subscription tables

**Connection:**
- SQLAlchemy ORM
- Connection pooling (10-20 connections)
- Read replica (future)

#### Phase 2: PostgreSQL (Future)
**Technology:** PostgreSQL 15+
- Better JSON support
- Superior full-text search
- Better for complex queries
- Improved performance
- Native array/JSONB types

**Migration Strategy:**
- After Phase 1 validated
- Schema optimization
- Data migration scripts
- Zero downtime cutover

**Location:** Railway MySQL (Phase 1), Railway PostgreSQL (Phase 2)
**Size:** 2GB → 10GB+ (growth capacity)

---

### 4. Search Engine (Typesense)

**Purpose:** Fast, typo-tolerant search across all modules

**Technology:** Typesense 0.25+
- Single binary (no Java)
- Sub-100ms search response
- Typo tolerance (fuzzy matching)
- Faceted filtering
- Vector search support (for AI)
- Boolean operators (AND, OR, NOT)

**Index Structure:**
```json
{
  "name": "recipients",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "ontvanger", "type": "string"},
    {"name": "modules", "type": "string[]"},
    {"name": "total_all_years", "type": "int64"},
    {"name": "year_2024", "type": "int32"},
    {"name": "year_2023", "type": "int32"},
    ...
    {"name": "begrotingsnaam", "type": "string[]"},
    {"name": "instrument", "type": "string[]"},
    {"name": "regeling", "type": "string[]"},
    {"name": "details_vector", "type": "float[]"}
  ]
}
```

**Indexing Strategy:**
- Nightly full re-index (automated)
- Real-time updates (future)
- 2.1M documents indexed
- <500MB memory usage

**Performance:**
- Query time: <100ms (99th percentile)
- Indexing time: ~10 minutes (full re-index)
- Concurrent queries: 1000+/sec

**Location:** Railway (separate service)
**Port:** 8108 (internal)
**Size:** 512MB RAM, 5GB storage

---

### 5. Cache Layer (Redis)

**Purpose:** Performance optimization and session management

**Technology:** Redis 7.2+
- In-memory key-value store
- Persistence enabled (RDB snapshots)

**Use Cases:**
1. **Query Result Caching**
   - API responses cached (5-60 minutes TTL)
   - Search results cached (15 minutes TTL)
   - 80% cache hit rate target

2. **Session Storage**
   - User sessions (Supabase refresh tokens)
   - Authentication state
   - 24-hour TTL

3. **Rate Limiting**
   - Per-user API limits
   - Per-IP rate limits
   - AI query quotas

4. **AI Response Caching**
   - Natural language query results
   - 80% of queries repeat
   - 7-day TTL

**Cache Keys:**
```
# API responses
cache:api:v1:modules:instrumenten:recipients:{params_hash}

# Search results
cache:search:{query_hash}

# AI responses
cache:ai:{query_hash}

# Sessions
session:{user_id}:{token}

# Rate limits
ratelimit:{user_id}:{endpoint}
```

**Location:** Railway (separate service)
**Port:** 6379 (internal)
**Size:** 256MB RAM, 1GB storage

---

### 6. AI Services

**Purpose:** Natural language query understanding and data analysis

#### OpenAI (GPT-4 Turbo)
**Use Cases:**
- Query intent understanding
- Natural language to search query translation
- Quick answers
- Autocomplete suggestions

**Configuration:**
```python
{
  "model": "gpt-4-turbo",
  "temperature": 0.3,  # More deterministic
  "max_tokens": 500,
  "cache_enabled": True
}
```

**Cost Optimization:**
- Use GPT-3.5-turbo for simple queries
- Cache all responses (Redis)
- Rate limiting per user tier

#### Claude (Anthropic)
**Use Cases:**
- Complex data analysis
- Multi-step reasoning
- Report generation
- MCP tool integration

**Configuration:**
```python
{
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.5,
  "max_tokens": 2000,
  "cache_enabled": True
}
```

#### MCP Server Implementation
**Purpose:** Allow AI to directly query data

```python
from mcp import MCPServer

mcp_server = MCPServer(app)

@mcp_server.tool
def get_financial_data(recipient: str, year: int):
    """Get financial data for a recipient in a specific year"""
    return db.query_financial_data(recipient, year)

@mcp_server.tool
def search_recipients(query: str, filters: dict):
    """Search for recipients matching a query"""
    return typesense.search(query, filters)
```

**Location:** External APIs (OpenAI, Anthropic)
**Authentication:** API keys (environment variables)
**Cost:** €30-60/month (with caching)

---

## Data Flow

### 1. User Search Flow

```
┌──────┐
│ User │ Types "prorail 2024"
└───┬──┘
    │
    ▼
┌─────────────────────────┐
│  Frontend (Next.js)     │
│  1. Capture input       │
│  2. Debounce (300ms)    │
│  3. Send to API         │
└───┬─────────────────────┘
    │
    │ GET /api/v1/search?q=prorail+2024
    │
    ▼
┌─────────────────────────┐
│  API Layer (FastAPI)    │
│  1. Validate request    │
│  2. Check cache (Redis) │────┐
└───┬─────────────────────┘    │
    │                          │ Cache HIT
    │ Cache MISS               │ (return cached)
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  Typesense              │    │
│  1. Parse query         │    │
│  2. Execute search      │    │
│  3. Return results      │    │
│     (<100ms)            │    │
└───┬─────────────────────┘    │
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  API Layer (FastAPI)    │    │
│  1. Format results      │    │
│  2. Cache in Redis      │◄───┘
│  3. Return JSON         │
└───┬─────────────────────┘
    │
    │ JSON response
    │
    ▼
┌─────────────────────────┐
│  Frontend (Next.js)     │
│  1. Display results     │
│  2. Render components   │
│  3. Show pagination     │
└─────────────────────────┘
    │
    ▼
┌──────┐
│ User │ Sees results in <500ms
└──────┘
```

**Performance Target:** <500ms end-to-end

---

### 2. AI Natural Language Query Flow

```
┌──────┐
│ User │ Types "Which organizations received the most infrastructure funding in 2024?"
└───┬──┘
    │
    ▼
┌─────────────────────────┐
│  Frontend (Next.js)     │
│  1. Detect AI query     │
│  2. Show loading state  │
│  3. Send to AI API      │
└───┬─────────────────────┘
    │
    │ POST /api/v1/ai/query
    │ {"query": "...", "context": {...}}
    │
    ▼
┌─────────────────────────┐
│  API Layer (FastAPI)    │
│  1. Validate request    │
│  2. Check cache (Redis) │────┐
└───┬─────────────────────┘    │
    │                          │ Cache HIT
    │ Cache MISS               │ (return cached)
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  OpenAI (GPT-4)         │    │
│  1. Parse intent        │    │
│  2. Extract params:     │    │
│     - module: instrumenten
│     - filter: "Infrastructuurfonds"
│     - year: 2024        │    │
│     - sort: amount DESC │    │
│     - limit: 10         │    │
└───┬─────────────────────┘    │
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  API Layer (FastAPI)    │    │
│  1. Execute structured  │    │
│     query (via MCP)     │    │
└───┬─────────────────────┘    │
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  Database (MySQL)       │    │
│  SELECT Ontvanger,      │    │
│         SUM(Bedrag)     │    │
│  FROM instrumenten      │    │
│  WHERE year = 2024      │    │
│    AND Begrotingsnaam   │    │
│    LIKE '%Infra%'       │    │
│  ORDER BY Bedrag DESC   │    │
│  LIMIT 10               │    │
└───┬─────────────────────┘    │
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  Claude (Analysis)      │    │
│  1. Format results      │    │
│  2. Add context         │    │
│  3. Generate answer     │    │
└───┬─────────────────────┘    │
    │                          │
    ▼                          │
┌─────────────────────────┐    │
│  API Layer (FastAPI)    │    │
│  1. Cache response      │◄───┘
│  2. Return JSON         │
└───┬─────────────────────┘
    │
    │ JSON response
    │
    ▼
┌─────────────────────────┐
│  Frontend (Next.js)     │
│  1. Render answer       │
│  2. Show source data    │
│  3. Display chart       │
└─────────────────────────┘
    │
    ▼
┌──────┐
│ User │ Sees answer: "In 2024, the top infrastructure funding recipients were:
│      │  1. ProRail B.V. (€461M)
│      │  2. Rijkswaterstaat (€234M)..."
└──────┘
```

**Performance Target:** <3s end-to-end (AI processing)

---

### 3. Data Import Flow (Admin)

```
┌────────────────┐
│ Government     │ Publishes new CSV data (yearly)
│ Data Source    │
└───┬────────────┘
    │
    ▼
┌─────────────────────────┐
│  Admin User             │
│  1. Download CSV        │
│  2. Upload to PhpMyAdmin│
│  3. Run import script   │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  MySQL (Production)     │
│  1. Insert into source  │
│     tables              │
│  2. Trigger re-pivot    │
│  3. Update analytics    │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Background Job         │
│  (Railway Cron)         │
│  1. Detect new data     │
│  2. Trigger re-index    │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  API Layer (FastAPI)    │
│  1. Read new data       │
│  2. Transform format    │
│  3. Send to Typesense   │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Typesense              │
│  1. Re-index all docs   │
│  2. Swap index (atomic) │
│  3. Delete old index    │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Redis                  │
│  1. Clear all caches    │
│  2. Warm up common      │
│     queries             │
└───┬─────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Users                  │
│  See updated data       │
│  (next query)           │
└─────────────────────────┘
```

**Frequency:** Monthly/Yearly (on government data release)
**Duration:** ~15 minutes (full re-index)

---

## Deployment Architecture

### Railway Platform

**Why Railway:**
- GUI-based deployment (user preference)
- Automatic HTTPS
- Built-in monitoring
- GitHub integration (CI/CD)
- Environment variables management
- Resource scaling via sliders

### Services Configuration

```yaml
# Railway Services Structure

1. frontend-nextjs:
   - Image: Node 20
   - Build: npm run build
   - Start: npm start
   - Port: 3000
   - Resources: 512MB RAM, 0.5 vCPU
   - Cost: €15-25/month
   - Environment:
     - NEXT_PUBLIC_API_URL
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY

2. backend-fastapi:
   - Image: Python 3.11
   - Build: pip install -r requirements.txt
   - Start: uvicorn main:app --host 0.0.0.0 --port 8000
   - Port: 8000
   - Resources: 1GB RAM, 1 vCPU
   - Cost: €15-25/month
   - Environment:
     - DATABASE_URL
     - TYPESENSE_URL
     - REDIS_URL
     - OPENAI_API_KEY
     - ANTHROPIC_API_KEY

3. database-mysql:
   - Image: MySQL 8.0
   - Volume: 10GB
   - Resources: 256MB RAM
   - Cost: €7/month
   - Backup: Daily snapshots

4. search-typesense:
   - Image: typesense/typesense:0.25
   - Volume: 5GB
   - Resources: 512MB RAM
   - Cost: €15-25/month
   - API Key: Generated

5. cache-redis:
   - Image: Redis 7.2
   - Volume: 1GB
   - Resources: 256MB RAM
   - Cost: €7-10/month
   - Persistence: RDB enabled
```

### Networking

```
┌─────────────────────────────────────────────────────┐
│              Railway Private Network                │
│                                                     │
│  frontend-nextjs ──┐                               │
│                    │                               │
│                    ▼                               │
│              backend-fastapi ──┬──► database-mysql │
│                                │                   │
│                                ├──► search-typesense
│                                │                   │
│                                └──► cache-redis    │
│                                                     │
└─────────────────────────────────────────────────────┘
         │                    │
         │                    │
         ▼                    ▼
    [HTTPS/443]          [External APIs]
    users access         OpenAI, Claude
```

**Security:**
- All internal communication over private network
- External access only via HTTPS (443)
- Environment variables for secrets
- No hardcoded credentials

---

## Technology Stack

See [RECOMMENDED-TECH-STACK.md](./RECOMMENDED-TECH-STACK.md) for detailed rationale.

### Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 | SSR, SEO, React, TypeScript, industry standard |
| Backend | Python FastAPI | Async, AI-friendly, auto docs, fast development |
| Database | MySQL → PostgreSQL | Keep existing (Phase 1), optimize later (Phase 2) |
| Search | Typesense | 50x faster, simple, cost-effective |
| Cache | Redis | Industry standard, multiple use cases |
| AI | OpenAI + Claude | Best-in-class, complementary strengths |
| Hosting | Railway | GUI-based, simple, within budget |
| CI/CD | GitHub Actions | Automated testing and deployment |

---

## Security Architecture

### Authentication & Authorization

**Authentication:** Supabase session tokens (access + refresh)
- Issued by FastAPI backend
- 15-minute access token lifetime
- 7-day refresh token lifetime (stored in Redis)
- Stored in httpOnly cookies (XSS protection)

**Authorization:** Role-Based Access Control (RBAC)
- Roles: Free, Basic, Premium, Admin
- Permissions per endpoint
- Rate limits per role

**User Tiers:**
```python
FREE = {
    "searches_per_day": 10,
    "ai_queries_per_day": 0,
    "export_rows": 100
}

BASIC = {
    "searches_per_day": 100,
    "ai_queries_per_day": 10,
    "export_rows": 1000
}

PREMIUM = {
    "searches_per_day": 1000,
    "ai_queries_per_day": 100,
    "export_rows": 100000
}
```

### Data Security

**In Transit:**
- HTTPS/TLS 1.3 everywhere
- Certificate management via Railway

**At Rest:**
- Database encryption (Railway managed)
- Encrypted backups
- Secrets in environment variables (Railway vault)

**Input Validation:**
- Pydantic models (FastAPI)
- Zod schemas (Next.js)
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React escaping, CSP headers)

**API Security:**
- Rate limiting (per user, per IP)
- CORS (whitelist frontend domain)
- API key rotation (AI services)
- Request size limits
- Timeout enforcement

### Privacy & Compliance

**GDPR:**
- User data deletion (right to be forgotten)
- Data export (right to data portability)
- Cookie consent banner
- Privacy policy

**Data Handling:**
- No PII in logs
- Anonymized analytics
- Secure session management

---

## Scalability & Performance

### Current Capacity (Recommended Stack)

| Metric | Capacity | Notes |
|--------|----------|-------|
| Concurrent users | 1,000+ | With caching |
| Database size | 10GB+ | 5x current |
| Search response | <100ms | 99th percentile |
| API requests/min | 1,000+ | Per service |
| AI queries/day | 10,000+ | With caching |

### Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Page load | <1s | 5s |
| Search | <100ms | 5s |
| API response | <200ms | 2s+ |
| AI query | <3s | N/A |

### Scaling Strategy

**Horizontal Scaling:**
- Frontend: Add more Next.js instances (Railway)
- Backend: Add more FastAPI instances (Railway)
- Database: Read replicas (future)
- Cache: Redis cluster (future)

**Vertical Scaling:**
- Increase RAM/CPU via Railway dashboard (GUI sliders)
- Database: Upgrade to larger plan

**Caching Layers:**
1. Browser cache (static assets)
2. CDN cache (future - CloudFlare)
3. Redis cache (API responses)
4. Database query cache

**When to Scale Up:**
- >10,000 concurrent users
- >50GB database
- >10,000 requests/min
- Response times exceed targets

---

## Integration Points

### Internal Integrations

1. **Frontend ↔ Backend**
   - Protocol: HTTPS/JSON
   - Authentication: Supabase session tokens in httpOnly cookies
   - Error handling: Standardized error codes

2. **Backend ↔ Database**
   - Protocol: MySQL wire protocol
   - ORM: SQLAlchemy
   - Connection pooling: 10-20 connections

3. **Backend ↔ Typesense**
   - Protocol: HTTPS/JSON
   - API Key authentication
   - Circuit breaker pattern

4. **Backend ↔ Redis**
   - Protocol: Redis protocol
   - Connection pooling
   - Fallback to direct DB on cache miss

### External Integrations

1. **OpenAI API**
   - Protocol: HTTPS/JSON
   - Authentication: API key
   - Rate limit: Per pricing tier
   - Fallback: Claude API

2. **Claude API (Anthropic)**
   - Protocol: HTTPS/JSON
   - Authentication: API key
   - MCP support: Native
   - Fallback: OpenAI API

3. **Mailgun (Email)**
   - Protocol: HTTPS REST API
   - Authentication: API key
   - Use cases: Transactional emails, notifications

4. **GitHub (CI/CD)**
   - Protocol: Git + GitHub Actions
   - Authentication: SSH keys
   - Triggers: Push to main, PR

---

## Migration Strategy

See [07-migration-strategy/](../07-migration-strategy/) for detailed plans.

### Phase 1: Build & Validate (Weeks 1-6)

**Goal:** New platform working with existing data

1. Set up Railway infrastructure
2. Build FastAPI backend (connects to existing MySQL)
3. Build Next.js frontend
4. Set up Typesense and index existing data
5. Implement basic AI features
6. Internal testing

**Risk:** Low - no data migration, parallel operation

### Phase 2: User Migration (Week 7)

**Goal:** Migrate users from WordPress to new platform

1. Export WordPress users + ARMember subscriptions
2. Import to new system
3. Send migration emails with new credentials
4. Provide migration guide
5. Support period (2 weeks)

**Risk:** Medium - user experience change

### Phase 3: Launch & Cutover (Week 8)

**Goal:** Switch primary domain to new platform

1. Final testing with real users
2. DNS cutover (rijksuitgaven.nl → new platform)
3. Keep WordPress as fallback (2 weeks)
4. Monitor performance and errors
5. Gradual rollout (10% → 50% → 100%)

**Risk:** Medium - production cutover

### Phase 4: Optimization (Post-Launch)

**Goal:** Improve performance and features

1. Analyze usage patterns
2. Optimize slow queries
3. Enhance AI features
4. Consider PostgreSQL migration
5. Add advanced analytics

**Risk:** Low - iterative improvement

### Rollback Plan

At any point, if critical issues arise:
1. DNS cutover back to WordPress (5 minutes)
2. Users continue on old platform
3. Fix issues in new platform
4. Re-attempt cutover when ready

**Zero Downtime Guarantee:** WordPress remains operational throughout migration.

---

## Cost Breakdown

### Monthly Operating Costs

| Service | Cost (€/month) | Notes |
|---------|----------------|-------|
| **Railway Infrastructure** | | |
| Frontend (Next.js) | 15-25 | 512MB RAM, 0.5 vCPU |
| Backend (FastAPI) | 15-25 | 1GB RAM, 1 vCPU |
| MySQL | 7 | 10GB storage |
| Typesense | 15-25 | 512MB RAM, 5GB storage |
| Redis | 7-10 | 256MB RAM, 1GB storage |
| **Subtotal** | **59-92** | |
| | | |
| **AI Services** | | |
| OpenAI API | 15-30 | With caching |
| Claude API | 15-30 | With caching |
| **Subtotal** | **30-60** | |
| | | |
| **Total** | **89-152** | **Within €180 budget** |
| **Savings** | **28-91** | vs current €180 |

### Cost Controls

1. **Railway spending limits** - Set max €150/month
2. **AI rate limiting** - Per user quotas
3. **Caching** - 80% AI cost reduction
4. **Monitoring alerts** - Email if >€100/month
5. **Resource optimization** - Auto-scale down during low usage

---

## Monitoring & Observability

### Metrics to Track

1. **Performance:**
   - Page load time (p50, p95, p99)
   - API response time
   - Search latency
   - AI query latency

2. **Availability:**
   - Uptime (target: 99.9%)
   - Error rate (target: <0.1%)
   - Database connection pool

3. **Business:**
   - Active users
   - Searches per day
   - AI queries per day
   - Subscription conversions

4. **Cost:**
   - Railway usage
   - AI API costs
   - Data transfer

### Tools

- **Railway Dashboard:** Built-in metrics, logs
- **Google Analytics:** User behavior
- **Sentry:** Error tracking (future)
- **Grafana:** Custom dashboards (future)

---

## Questions & Next Steps

### Questions for Approval

1. ✅ Approve overall architecture?
2. ✅ Approve technology stack (Python + FastAPI + Next.js)?
3. ✅ Approve hosting platform (Railway)?
4. ✅ Approve phased migration approach?
5. ✅ Any concerns about cost (€89-152/month)?

### Next Steps (When Approved)

1. **Create detailed API specifications** (06-technical-specs/api-specifications.md)
2. **Design database connection strategy** (06-technical-specs/database-connection-strategy.md)
3. **Create setup guide** (07-migration-strategy/setup-guide.md)
4. **Generate scaffolding commands** (copy-paste ready)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Awaiting Approval
**Author:** AI Assistant (following development-methodology.md)
