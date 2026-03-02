# Recommended Technology Stack

## Overview
Based on your requirements: beginner-friendly, cost-effective (€50-200/month), future-proof, scalable, solo founder project, ASAP launch (8 weeks), and MCP server support for AI.

---

## Executive Summary

**Recommended Stack:** Python + FastAPI + Next.js + Supabase + Typesense + Railway

**Design Principle:** V3-ready from day 1. No platform migrations between V2 and V3.

**Why:**
- ✅ Within €180/month budget (estimated €102-150)
- ✅ Easy deployment (Supabase + Railway - both GUI-based)
- ✅ Fast development (8 weeks for V2.0)
- ✅ **V3-ready architecture** - only feature enablement, no migrations
- ✅ Excellent for AI/data work
- ✅ MCP server support built-in
- ✅ pgvector included in Supabase for V3.0 semantic search
- ✅ Great documentation and community

**Monthly Cost Estimate:** €102-150 (well within €180 budget!)

**Migration-Free Guarantee:**
| Component | V2 | V3 | Migration |
|-----------|----|----|-----------|
| Next.js + Recharts | ✅ | ✅ | None |
| FastAPI | ✅ | ✅ | None |
| Supabase | ✅ | ✅ | None |
| Typesense | ✅ | ✅ | None |
| Railway | ✅ | ✅ | None |

### Architecture Decisions (2026-01-20)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase (PostgreSQL) | Easy setup, pgvector included, Auth built-in |
| Search Engine | Typesense | Fast autocomplete <50ms, typo tolerance |
| Vector Search | pgvector (Supabase) | Only ~2-5K vectors needed (not 500K) |
| Semantic Approach | IBOS domain classification | Lookup table replaces most vector search |
| Data Sync | Nightly rebuild | Simple, fits monthly government data updates |

---

## Architecture Diagram (V3-Ready)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         NEXT.JS FRONTEND                            │   │
│  │                                                                     │   │
│  │  UI Components:    shadcn/ui (Tailwind-based)                       │   │
│  │  Charts:           Recharts (React 19 compatible)                   │   │
│  │  Tables:           TanStack Table v8                                │   │
│  │  Forms:            React Hook Form + Zod                            │   │
│  │  State:            TanStack Query (server state)                    │   │
│  │  Auth:             Supabase Auth (Magic Link + PKCE)                │   │
│  │  Icons:            Lucide React                                     │   │
│  │  Maps (V3):        react-map-gl (Mapbox)                            │   │
│  │                                                                     │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────▼─────────────────────────────────────┐   │
│  │                         FASTAPI BACKEND                              │   │
│  │                                                                     │   │
│  │  /api/v1/*          V1 endpoints (active)                           │   │
│  │  /api/v2/*          V2 endpoints (stubs, enabled later)             │   │
│  │  Background Workers  Data sync, enrichment jobs                     │   │
│  │                                                                     │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│      ┌───────────┬───────────────┼───────────────┬───────────┐             │
│      ▼           ▼               ▼               ▼           ▼             │
│  ┌───────┐  ┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌─────────┐        │
│  │Redis  │  │Typesense│  │  Supabase   │  │ Worker  │  │Puppeteer│        │
│  │Cache  │  │ Search  │  │ PostgreSQL  │  │  Jobs   │  │  (V3)   │        │
│  │       │  │         │  │ + pgvector  │  │         │  │         │        │
│  │       │  │         │  │ + Storage   │  │         │  │         │        │
│  │       │  │         │  │ + Auth      │  │         │  │         │        │
│  └───────┘  └─────────┘  └─────────────┘  └─────────┘  └─────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL SERVICES (V3)                           │   │
│  │  Claude API │ KvK API │ Mapbox │ wetten.overheid.nl scraper         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              RAILWAY (Hosting)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Flow | V2.0 | V3.0 |
|------|------|------|
| **Keyword search** | Typesense (<100ms) | Same |
| **Autocomplete** | Typesense (<50ms) | Same |
| **Semantic search** | - | IBOS lookup + pgvector |
| **AI reasoning** | - | Claude (cached, sparingly) |
| **Data sync** | Nightly Supabase → Typesense | Same |

---

## Technology Stack Details

### Frontend: Next.js 14+ (App Router) - FINAL STACK

**Why Next.js:**
- ✅ Best-in-class React framework (industry standard)
- ✅ Server-side rendering = Fast initial loads
- ✅ TypeScript support out of the box
- ✅ File-based routing (easy to understand)
- ✅ Excellent documentation
- ✅ Huge community and job market
- ✅ Deploy to Railway with one command
- ✅ Future-proof (backed by Vercel, massive adoption)

**Complete Frontend Stack (V2 + V3 Ready):**

| Category | Library | Purpose |
|----------|---------|---------|
| **Framework** | Next.js 14+ | App Router, SSR |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Accessible, customizable |
| **Charts** | Recharts | Dashboards, trend charts, KPIs (React 19 compatible) |
| **Tables** | TanStack Table v8 | Sorting, filtering, pagination |
| **Forms** | React Hook Form + Zod | Validation |
| **State** | TanStack Query | Server state, caching |
| **Icons** | Lucide React | Consistent iconography |
| **Maps (V3)** | react-map-gl | Geographic visualization |
| **Rich Text (V3)** | Tiptap | Dossier notes |
| **PDF Export (V3)** | Puppeteer | Server-side rendering |

**Why Recharts for Charts (Updated 2026-01-26):**
- ✅ **React 19 compatible** (Tremor not yet supported)
- Small bundle footprint (~50KB gzipped)
- Recharts is the proven base that Tremor builds on
- Handles V2 needs (trends, bars, areas with full customization)
- V3.0 prepared: Sankey built-in, Treemap/Heatmap via Nivo addition
- Tailwind-compatible with minimal setup

```tsx
// Example: Trend chart with Recharts
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={spendingByYear}>
    <XAxis dataKey="year" />
    <YAxis />
    <Area type="monotone" dataKey="bedrag" stroke="#E62D75" fill="#E62D75" />
  </AreaChart>
</ResponsiveContainer>
```

**Why Recharts over Tremor:**
- ✅ React 19 compatibility (Tremor not yet updated)
- ✅ Lower bundle size (50KB vs 95KB with Tremor)
- ✅ Direct component library (no wrapper overhead)
- ✅ Component wrapper approach matches shadcn/ui pattern
- ⚠️ Requires custom styling vs Tremor's opinionated design (mitigated with component library)

**V3.0 Advanced Visualization Plan:**
- Recharts Sankey (built-in for module flow viz)
- Nivo for Treemap + Heatmap (added selectively when needed, ~80KB)
- Total V3 bundle: ~130KB for full suite

**Why not alternatives (2026-01-26):**
- Tremor: ❌ React 19 not supported
- Chart.js: No Sankey/Treemap/Heatmap support (V3 blocker)
- Victory: Slightly larger bundle, missing some V3 viz
- Nivo: Excellent but over-engineered for V2, bundle too large upfront

---

### Backend: Python + FastAPI

**Why Python:**
- ✅ **BEST for data/AI work** (your critical requirement)
- ✅ Simple, readable syntax (easier maintenance)
- ✅ Massive AI/ML ecosystem (OpenAI, Anthropic, LangChain)
- ✅ Excellent data manipulation (Pandas)
- ✅ MCP server SDK available from Anthropic
- ✅ Future-proof (Python everywhere in AI/data)
- ✅ Huge talent pool

**Why FastAPI:**
- ✅ Modern, fast (async/await)
- ✅ **Automatic API documentation** (Swagger/OpenAPI)
- ✅ Type hints = fewer bugs
- ✅ Excellent for quick development (your 1-2 month timeline)
- ✅ Railway deployment template ready
- ✅ Great for APIs consumed by Next.js
- ✅ Built-in validation (Pydantic)

**Alternatives considered:**
- Node.js: Good, but Python better for AI/data
- PHP Laravel: Outdated for modern APIs
- Go: Too complex for small team, overkill for your needs

**V3-Ready Backend Structure:**

```
/backend
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   │
│   ├── api/
│   │   ├── v1/                    # V1 endpoints (active)
│   │   │   ├── search.py
│   │   │   ├── modules.py
│   │   │   ├── export.py
│   │   │   └── auth.py
│   │   │
│   │   └── v2/                    # V2 endpoints (stubs)
│   │       ├── research.py        # AI assistant
│   │       ├── dossiers.py        # Dossier management
│   │       ├── companies.py       # Company profiles
│   │       └── insights.py        # Auto-generated insights
│   │
│   ├── services/
│   │   ├── search_service.py      # Typesense
│   │   ├── aggregation_service.py # On-the-fly queries
│   │   ├── export_service.py      # CSV
│   │   │
│   │   └── v2/                    # V2 services
│   │       ├── ai_service.py      # Claude
│   │       ├── kvk_service.py     # KvK API
│   │       ├── pdf_service.py     # Puppeteer
│   │       └── scraping_service.py
│   │
│   ├── workers/                   # Background jobs
│   │   ├── sync_typesense.py      # V1: search index
│   │   ├── compute_totals.py      # V1: module totals
│   │   │
│   │   └── v2/                    # V2 workers
│   │       ├── enrich_kvk.py
│   │       ├── generate_embeddings.py
│   │       └── scrape_wetten.py
│   │
│   └── models/
│       ├── database.py
│       └── schemas.py
```

**Key Libraries (V2.0 - Current):**
- **asyncpg** - PostgreSQL async driver (NOT SQLAlchemy)
- **Pydantic** - Data validation
- **python-dotenv** - Environment configuration
- **httpx** - Async HTTP client
- **typesense** - Typesense search client

**Future Libraries (V3+):**
- **anthropic** - Claude API (V3 Reporter, V6 Research Mode)
- **LangChain** - AI orchestration (V6 Research Mode)
- **langchain-anthropic** - Claude integration for LangChain
- **MCP SDK** - MCP server implementation (V6 Research Mode)
- **BeautifulSoup4** - Web scraping wetten.overheid.nl (V8)

---

### Database: Supabase (PostgreSQL) ⭐ DEPLOYED 2026-01-23

**Decision:** Migrated to Supabase for V2.0

**Why Supabase:**
- ✅ PostgreSQL with pgvector included (ready for V3.0+)
- ✅ Authentication built-in (Magic Link + PKCE)
- ✅ Easy GUI dashboard (copy/paste friendly)
- ✅ Row Level Security enabled on all tables
- ✅ Real-time subscriptions (future use)
- ✅ Deployed: Frankfurt EU region
- Pro plan: €25/month

**Migration from MySQL:**
- ✅ COMPLETED 2026-01-23
- Exported WordPress MySQL data
- Imported into Supabase PostgreSQL
- 3.1M rows across 7 source tables
- Schema updated for PostgreSQL compatibility

**Current Setup:**
- Project: `kmdelrgtgglcrupprkqf.supabase.co`
- Plan: Pro (€25/month)
- Database: 500MB / 8GB capacity
- Extensions: postgis, vector (pgvector)

**V3-Ready Database Schema:** ⭐ UPDATED 2026-01-20

Create V3 tables in V2 (empty) to avoid schema migrations later.

```sql
-- ============================================
-- V2 TABLES (Active from day 1)
-- ============================================

-- Source data tables: instrumenten, apparaat, gemeente,
-- provincie, publiek, inkoop (already defined)

-- Module totals (for Overzicht page)
CREATE TABLE module_totals (
  id SERIAL PRIMARY KEY,
  module VARCHAR NOT NULL,
  sub_source VARCHAR,
  sub_source_field VARCHAR,
  year INT NOT NULL,
  total BIGINT NOT NULL,
  row_count INT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User management
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  subscription_tier TEXT DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- V3 TABLES (Created empty, populated later)
-- ============================================

-- Entity resolution (recipient normalization)
CREATE TABLE entities (
  id SERIAL PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  kvk_number TEXT,
  entity_type TEXT, -- 'company', 'government', 'ngo'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entity_aliases (
  id SERIAL PRIMARY KEY,
  entity_id INT REFERENCES entities(id),
  alias TEXT NOT NULL,
  source_table TEXT,
  UNIQUE(alias, source_table)
);

-- People and connections
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE entity_people (
  id SERIAL PRIMARY KEY,
  entity_id INT REFERENCES entities(id),
  person_id INT REFERENCES people(id),
  role TEXT,
  start_date DATE,
  end_date DATE,
  source TEXT
);

-- Dossiers (user collections)
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dossier_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_data JSONB NOT NULL,
  position INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  query_params JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  source_table TEXT,
  source_id INT,
  content_type TEXT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- IBOS Domain Reference (30 rows)
CREATE TABLE ibos_domains (
  code VARCHAR(2) PRIMARY KEY,
  name_nl VARCHAR(255),
  name_en VARCHAR(255)
);

-- Recipient to Domain Mapping
CREATE TABLE recipient_domain_mappings (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255),
  ibos_code VARCHAR(2) REFERENCES ibos_domains(code),
  confidence DECIMAL(3,2),
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Why create V3 tables in V2:**
- Schema migrations cause downtime
- Adding tables later requires coordinated deploys
- Empty tables have zero performance impact
- Feature flags control what's active

---

### Search Engine: Typesense ⭐ CONFIRMED

**Role:** V2.0 keyword search, autocomplete, filters (NOT semantic search)

**Why Typesense:**
- ✅ Autocomplete <50ms (required)
- ✅ Typo tolerance up to 2 edits (required)
- ✅ Boolean operators (AND, OR, NOT)
- ✅ Faceted filtering
- ✅ 500K+ records, still fast
- ✅ Railway deployment: ~€15-25/month

**What Typesense handles (V2.0):**
- Keyword search <100ms
- Autocomplete suggestions
- Fuzzy matching ("prorai" → "prorail")
- Boolean queries
- Filter by year, amount, module
- Cross-module search

**What Typesense does NOT handle (V3.0):**
- Semantic search ("defense spending") → Use IBOS lookup
- Vector similarity → Use pgvector in Supabase
- AI reasoning → Use Claude

**Data Sync:**
- Nightly rebuild from Supabase → Typesense
- Triggered by cron job after data imports
- Simple, fits monthly government data updates

---

### Semantic Search Strategy: IBOS Domain Classification ⭐ NEW

**Problem:** 500K+ recipients need semantic search. Embedding all = expensive + slow.

**Solution:** IBOS domain classification (30 policy domains) + selective vector search.

**How it works:**

```
User: "Show me defense-related spending"
         │
         ▼
Step 1: Synonym lookup
        "defense" → ["Defensie", "Krijgsmacht", "Militair"]
         │
         ▼
Step 2: IBOS domain lookup
        → IBOS code "03 - Defensie"
         │
         ▼
Step 3: Database query
        SELECT * FROM recipients WHERE ibos_code = '03'
         │
         ▼
Result: All defense-related recipients (FREE, <100ms)
```

**Vector search only for (V3.0):**
- Regeling → Wet matching (~2,000 vectors)
- "Find similar recipients" feature (~2,000 top recipients)
- Ambiguous queries that IBOS can't classify

**IBOS Classification Task (V3.0 development):**
- Classify 500K recipients into 30 IBOS domains
- Method: Claude batch API (~€30-50) + manual review
- Store: `recipient_domain_mappings` table in Supabase

**Cost comparison:**

| Approach | Vectors | Monthly Cost |
|----------|---------|--------------|
| Embed all 500K recipients | 500,000 | €50-100+ |
| IBOS lookup + selective vectors | 2,000-5,000 | €0-5 |

---

### Caching: Redis (NOT YET DEPLOYED)

**Status:** Deferred to V6 (AI Research Mode)

**Why deferred:**
- V2 traffic too low to justify cost
- Supabase query performance adequate (<200ms)
- Will add for AI response caching in V6

**Future use cases (V6+):**
- ✅ Cache AI responses (80% hit rate expected)
- ✅ Rate limiting for AI queries
- ✅ Session storage (currently in Supabase)

**Railway Redis:** ~€7-10/month (when deployed)

---

### AI Integration: NOT YET DEPLOYED

**Status:** Deferred to V3+ (Rijksuitgaven Reporter, Research Mode)

#### V3.0 - Rijksuitgaven Reporter (Planned)

**Primary: Claude Haiku (Anthropic)**
- News article keyword extraction
- Lightweight AI analysis
- Cost: ~€10-15/month

#### V6.0 - AI Research Mode (Planned)

**Primary: Claude Sonnet 4.5 (Anthropic)**
- Conversational analysis
- Multi-step reasoning
- Native MCP support
- Cost: ~€25-35/month (with caching)

**Fallback: OpenAI GPT-4 (Emergency only)**
- Claude API unavailable
- Cost: ~€5-10/month (5% of queries)

#### V3.0 Research Mode AI Architecture
```
User Query → LangChain Agent → Claude Sonnet 4.5
                    ↓
              MCP Tools:
              - get_domain_distribution()
              - get_domain_trends()
              - classify_recipient()
              - search_typesense()
              - fetch_regulation()
                    ↓
              Response + Visualization
```

#### Cost Optimization Strategy:
1. **Cache AI responses** (Redis) - 80% of queries repeat
2. **Use Claude Haiku** for simple queries (even cheaper)
3. **Pre-computed analytics tables** - reduce AI query complexity
4. **Rate limiting** per user tier

**Realistic AI costs: €30-50/month** (10x cheaper than GPT-4 primary!)

---

### MCP Server Implementation

**What is MCP (Model Context Protocol)?**
Anthropic's standard for AI to access external data sources.

**V2.0 Tools (Basic):**
```python
@mcp_server.tool
def get_financial_data(recipient: str, year: int):
    """Get financial data for a recipient in a specific year"""
    return query_database(recipient, year)

@mcp_server.tool
def search_recipients(query: str):
    """Search for recipients matching a query"""
    return search_typesense(query)
```

**V3.0 Tools (Research Mode):** ⭐ NEW
```python
@mcp_server.tool
def get_domain_distribution(year: int):
    """Get IBOS domain breakdown for a year - 'Where does tax euro go?'"""
    return query_analytics_domain_yearly(year)

@mcp_server.tool
def get_domain_trends(ibos_code: str, start_year: int, end_year: int):
    """Get year-over-year trends for a policy domain"""
    return query_domain_trends(ibos_code, start_year, end_year)

@mcp_server.tool
def classify_recipient(recipient: str):
    """AI-assisted IBOS domain classification for ambiguous recipients"""
    return infer_ibos_code(recipient)

@mcp_server.tool
def compare_domains(domain_a: str, domain_b: str, year: int):
    """Compare two policy domains side-by-side"""
    return compare_ibos_domains(domain_a, domain_b, year)

@mcp_server.tool
def fetch_regulation(regeling_name: str):
    """Fetch legislation from wetten.overheid.nl"""
    return scrape_wetten_overheid(regeling_name)

@mcp_server.tool
def get_top_recipients(ibos_code: str, year: int, limit: int = 10):
    """Get top N recipients in a domain - 'Wie krijgt het meeste?'"""
    return query_top_recipients(ibos_code, year, limit)

@mcp_server.tool
def get_fastest_growers(ibos_code: str, start_year: int, end_year: int):
    """Get fastest growing/declining recipients in a domain"""
    return query_growth_ranking(ibos_code, start_year, end_year)
```

**Benefits:**
- ✅ AI can directly query your data
- ✅ Domain-first analysis ("Where does tax euro go?")
- ✅ Standardized protocol
- ✅ Works with Claude and LangChain
- ✅ Future-proof as MCP adoption grows

---

### Hosting: Railway ⭐ RECOMMENDED

**Why Railway:**
- ✅ **GUI-based** (perfect for your preference)
- ✅ **One-click deployments** from GitHub
- ✅ **Environment variables** in dashboard
- ✅ **Automatic HTTPS**
- ✅ **Built-in logging and monitoring**
- ✅ **No infrastructure code needed**
- ✅ **€5 credit free, then pay-as-you-go**
- ✅ Team already has some experience

**Cost Breakdown (Monthly):** ⭐ UPDATED 2026-01-20

**V2 (V3-Ready Setup):**
```
Supabase (Pro):            €25
  - PostgreSQL + pgvector
  - Storage (included)
  - Auth (included)

Railway:
  - Frontend (Next.js):    €15-25
  - Backend (FastAPI):     €15-25
  - Typesense:             €15-25
──────────────────────────────
V2 Infrastructure:         €70-100
Budget:                    €180/month
Buffer:                    €80-110
```

**Not yet deployed (deferred to V3+):**
- Worker service (V3 Reporter): €5-10/month
- Redis (V6 Research Mode): €7-10/month
- Claude API (V3 Reporter + V6 Research Mode): €10-40/month

**Future V3 Additions (when enabled):**
```
AI Services:
  - Claude Haiku (V3):     €10-15
  - Claude Sonnet (V6):    €20-35
Worker service:            €5-10
──────────────────────────────
V3 Additions:              €35-60
```

**Future V6 Additions (when enabled):**
```
Redis (caching):           €7-10
──────────────────────────────
V6 Additions:              €7-10
```

**Total:**
```
V2 Phase (current):        €70-100/month
V3 Phase:                  €105-160/month
V6 Phase:                  €112-170/month
Budget:                    €180/month

V2 Buffer:                 €80-110 ✅
V3 Buffer:                 €20-75 ✅
V6 Buffer:                 €10-68 ✅
```

**Note:** All future phases fit within €180 budget with caching.

**Why not alternatives:**
- **AWS/Google Cloud:** Too complex, need IaC knowledge, harder to debug
- **Vercel:** Great for frontend, but backend gets expensive fast
- **Heroku:** Dying platform, expensive, less features than Railway
- **DigitalOcean:** Requires more manual setup

---

## Development Workflow

### Git Strategy
```
main (production → auto-deploys to Railway)
  ↑
  └─ feature branches (test on localhost)
```

### Deployment Pipeline (Automated)
```
1. Push to GitHub
2. Railway detects change
3. Runs tests
4. Builds containers
5. Deploys (zero downtime)
6. Health checks
7. Rollback if issues
```

**You do:** Git push
**Railway does:** Everything else

---

## Development Timeline (1-2 Months)

### Week 1-2: Foundation
- [ ] Railway account setup
- [ ] Repository structure
- [ ] FastAPI backend skeleton
- [ ] Connect to existing MySQL
- [ ] Basic API endpoints
- [ ] Next.js frontend setup

### Week 3-4: Core Features
- [x] Authentication (Supabase Auth + Magic Link - Completed Week 6)
- [ ] User migration from ARMember
- [ ] Data API endpoints (7 modules)
- [ ] Basic search (Typesense setup)
- [ ] Index existing data

### Week 5-6: Search & UI
- [ ] Advanced search features
- [ ] Filter implementation
- [ ] Data tables (pivot views)
- [ ] Detail pages
- [ ] Responsive design

### Week 7-8: Polish & Launch
- [ ] AI integration (basic)
- [ ] Performance optimization
- [ ] User testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Production deployment
- [ ] User migration

**Post-Launch (V2.1):**
- Enhanced AI features
- MCP server refinement
- Additional analytics

---

## Cost Comparison

### Current Setup
```
WordPress hosting:          €180/month
Total:                      €180/month
```

### New Platform (Recommended)
```
Railway infrastructure:     €59-92/month
AI services (Claude):       €30-45/month
──────────────────────────────────────
Total:                      €89-137/month
Savings:                    €43-91/month
```

**Plus you get:**
- ✅ 50x faster search (<100ms vs 5s)
- ✅ AI Research Mode (Bloomberg Terminal for Rijksfinanciën)
- ✅ IBOS domain analysis ("Where does tax euro go?")
- ✅ Advanced visualizations (Sankey, Treemap, Heatmap)
- ✅ wetten.overheid.nl integration
- ✅ Better scalability
- ✅ Modern architecture
- ✅ €43-91 buffer for growth

---

## Scalability Path

### Current Capacity (Recommended Stack)
- **Users:** 1,000+ concurrent
- **Data:** 10GB+ (5x current)
- **Search:** <100ms response
- **API:** 1000+ requests/min

### When to Scale Up
If you grow beyond:
- 10,000 users
- 50GB database
- 10,000 requests/min

**Then:** Upgrade Railway resources (click slider in GUI)

**Future migration path** (if needed):
1. Keep architecture
2. Move to Kubernetes (Railway supports this)
3. Or move to AWS/GCP (containers work everywhere)

---

## Risk Mitigation

### Your Top Concern: Cost Overruns

**Fixed Costs (Monthly):**
- Railway: €89-92 (capped by resource limits you set)
- AI: Variable, but cacheable

**Cost Controls:**
1. **Railway spending limits** - Set in dashboard (e.g., max €150/month)
2. **AI rate limiting** - Prevent runaway costs
3. **Monitoring alerts** - Email if spending > threshold
4. **Free tiers** - OpenAI gives $5 free credits monthly
5. **Caching** - Reduces 80% of AI costs

**Total Predictable Monthly Cost: €90-150**
**Well within €180 budget, with €30-90 buffer**

---

## Why This Stack is Future-Proof

### Language Popularity (GitHub 2024)
1. JavaScript/TypeScript - #1 (Next.js)
2. Python - #2 (FastAPI)
3. Java - #3
4. Go - #4

✅ **You're using the top 2 most popular languages**

### Job Market
- Python developers: Huge pool, growing
- Next.js developers: Huge pool, standard
- FastAPI: Fast-growing, modern
- Railway: Cloud-agnostic (can migrate anytime)

### Technology Longevity
- Python: 30+ years, not going anywhere
- React/Next.js: Industry standard for 5+ years
- FastAPI: Adopted by major companies (Microsoft, Netflix)
- Railway: Y Combinator backed, growing fast

### No Lock-in
- **Containers:** Run anywhere
- **PostgreSQL:** Standard database
- **REST API:** Universal
- **Next.js:** Deploy to 10+ platforms
- **Open source:** No vendor control

---

## Learning Resources

### For Your Team (2-3 people)

#### Python + FastAPI (40 hours)
- FastAPI Tutorial: https://fastapi.tiangolo.com/tutorial/
- Python for Data: https://pandas.pydata.org/docs/
- Estimated: 2 weeks part-time

#### Next.js (40 hours)
- Next.js Learn: https://nextjs.org/learn
- React if needed: https://react.dev/learn
- Estimated: 2 weeks part-time

#### Typesense (10 hours)
- Typesense Guide: https://typesense.org/docs/guide/
- Estimated: 3-4 days

#### Railway (5 hours)
- Railway Docs: https://docs.railway.app/
- Estimated: 1-2 days

**Total learning: 6-8 weeks part-time**
**Overlaps with development timeline**

---

## Alternative Stack (If You Change Your Mind)

### Alternative: Node.js Full Stack
**Backend:** Node.js + Express + Prisma
**Frontend:** Next.js (same)
**Why consider:**
- Single language (JavaScript)
- Slightly faster API responses
- Good TypeScript support

**Why NOT recommended:**
- Python better for AI/data
- Smaller AI ecosystem
- Less suitable for complex data processing

**When to choose:** If Python learning curve feels too steep

---

## Decision Summary

### What You Get (V2.0 + V3.0)
✅ Modern, fast platform (5s → <100ms search)
✅ AI-powered Research Mode ("Bloomberg Terminal for Rijksfinanciën")
✅ Domain-first analysis (IBOS - "Where does tax euro go?")
✅ Advanced visualizations (Sankey, Treemap, Heatmap)
✅ wetten.overheid.nl integration
✅ MCP server with domain tools
✅ Within budget (€89-137 vs €180)
✅ Easy deployment (GUI-based Railway)
✅ Future-proof technology (Claude + LangChain)
✅ Scalable architecture
✅ V2.0 in 8 weeks, V3.0 in +12 weeks
✅ Maintainable by 2-3 person team

### Trade-offs
⚠️ Learning curve (Python + Next.js) - **Mitigated:** Excellent docs, huge community
⚠️ Initial development time - **Mitigated:** Worth it for 50x performance gain
⚠️ New deployment platform - **Mitigated:** Railway simpler than current setup
⚠️ IBOS domain mapping effort - **Mitigated:** AI-assisted classification

---

## Next Steps

1. **Review & Approve** this architecture
2. **Create Railway account** (free to start)
3. **Set up GitHub repository** structure
4. **Start Week 1** development (I'll guide you!)

Ready to proceed? Let me know and I'll create:
1. Detailed API specifications
2. Database connection strategy
3. Step-by-step setup guide
4. Project scaffolding commands (copy-paste ready!)

---

---

## V3-Ready Checklist ⭐ NEW

### What V2 Sets Up for V3 (No Migration Needed)

| Component | V2 Setup | V3 Enablement |
|-----------|----------|---------------|
| **Frontend** | Next.js + shadcn/ui + Recharts + TanStack Table | Add Mapbox, Tiptap, Puppeteer, Nivo (advanced viz) |
| **Backend** | FastAPI with /api/v1/* endpoints | Enable /api/v2/* endpoints |
| **Database** | All V3 tables created (empty) | Populate with data |
| **pgvector** | Extension enabled, embeddings table ready | Generate embeddings |
| **Storage** | Supabase Storage configured | Store PDFs, exports |
| **Workers** | Background job infrastructure | Add enrichment jobs |
| **Feature Flags** | All V3 flags = false | Flip to true |

### Feature Flags (Environment Variables)

```env
# V2 Configuration (Active)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
TYPESENSE_HOST=xxx
REDIS_URL=redis://...

# V3 Configuration (Prepared, not active)
ANTHROPIC_API_KEY=           # Add when V3 starts
KVK_API_KEY=                 # Add when V3 starts
MAPBOX_TOKEN=                # Add when V3 starts

# Feature Flags
FEATURE_AI_ASSISTANT=false   # Enable in V3
FEATURE_DOSSIERS=false       # Enable in V3
FEATURE_COMPANY_PROFILES=false
FEATURE_RESEARCH_MODE=false
```

### V2 → V3 Upgrade Path

```
V2 COMPLETE                    V3 DEVELOPMENT
─────────────                  ─────────────────
     │                              │
     │  1. Add API keys             │
     │  2. Flip feature flags       │
     │  3. Run data enrichment      │
     │  4. Deploy (same infra)      │
     │                              │
     └──────────────────────────────┘
              NO MIGRATION
```

---

## Questions or Concerns?

Let me know if you want to:
- Dive deeper into any technology choice
- See code examples
- Discuss alternatives
- Adjust the timeline
- Review cost projections
- See proof-of-concept

**I'm ready to start building when you are!**
