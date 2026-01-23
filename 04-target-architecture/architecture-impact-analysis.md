# Architecture Impact Analysis

**Project:** Rijksuitgaven.nl SaaS Platform
**Version:** 1.0
**Date:** 2026-01-23
**Status:** Validated

---

## Document Structure

This document has two parts:
- **Part 1: V1.0 Architecture** - Search Bar implementation (what we're building now)
- **Part 2: V2.0 Architecture** - Research Mode planning (what's coming next)

---

## Purpose

Evaluate whether the **recommended technology stack** (Python + FastAPI + Next.js + Railway + Typesense) supports the search requirements.

- **V1.0:** Search Bar - fully validated, ready for implementation
- **V2.0:** Research Mode - architecture planned, implementation post-V1.0

---

## Executive Summary

### ✅ Good News: Core Architecture Still Valid

The recommended stack (Typesense + FastAPI + Next.js) **fully supports** Search Bar requirements (V1.0). Minor adjustments needed for Research Mode (V2.0).

### ⚠️ Key Findings:

1. **Typesense is PERFECT for Search Bar** ✅
   - Sub-100ms search ✅
   - Typo tolerance ✅
   - Autocomplete ✅
   - Boolean operators ✅
   - Supports all required query types ✅

2. **Research Mode needs ENHANCED architecture** ⚠️
   - Current: OpenAI + Claude APIs
   - **Recommendation: Add RAG (Retrieval-Augmented Generation)**
   - **Recommendation: Prioritize Claude over OpenAI (conversational focus)**
   - **Recommendation: Add LangChain for multi-step orchestration**

3. **Cost implications for Research Mode** ⚠️
   - Conversational AI is more expensive than one-off queries
   - Mitigation: Aggressive caching, Claude (better value than GPT-4 for long conversations)
   - Estimated: €80-150/month for 20 active research users (within budget)

4. **Data layer needs enrichment** ⚠️
   - Search Bar: Current database structure sufficient
   - Research Mode: Need pre-computed aggregations, metadata, vector embeddings

---

---

# PART 1: V1.0 ARCHITECTURE (Search Bar)

*This section covers V1.0 implementation. Ready for development.*

---

## Search Bar Requirements vs Typesense

| Requirement | Typesense Capability | Status | Notes |
|-------------|----------------------|--------|-------|
| **<100ms search** | Yes, <50ms typical | ✅ | Native capability |
| **Autocomplete** | Yes, instant | ✅ | Dedicated autocomplete API |
| **Typo tolerance** | Yes, fuzzy matching | ✅ | Configurable (up to 2 edits) |
| **Boolean operators** | Yes (AND, OR, NOT) | ✅ | Native support |
| **Wildcards** | Partial | ⚠️ | Prefix matching native, full wildcards via query expansion |
| **Fuzzy matching** | Yes | ✅ | Automatic |
| **Cross-module search** | Yes | ✅ | Multi-collection search |
| **Filter by fields** | Yes | ✅ | Filter parameters on any field |
| **Numeric ranges** | Yes | ✅ | Range queries (amount:1000000..5000000) |
| **Faceted filtering** | Yes | ✅ | Facet counts for UI |
| **Sort options** | Yes | ✅ | Multi-field sorting |
| **Field weighting** | Yes | ✅ | Query-time boost per field |

**Conclusion:** Typesense is an **excellent fit** for Search Bar (V1.0). No changes needed.

---

# PART 2: V2.0 ARCHITECTURE (Research Mode)

*This section covers V2.0 planning. Do not implement until V1.0 is complete.*
*For full V2.0 requirements, see: `02-requirements/research-mode-vision.md`*

---

## Research Mode Requirements vs Current Architecture

#### 2.1 Conversational AI (Claude vs OpenAI)

**Requirement:** "AI IS Research Mode" - conversational interface like Claude

**Current Recommendation:** Dual provider (OpenAI + Claude)

**Analysis:**

| Aspect | OpenAI GPT-4 | Claude Sonnet 4.5 | Recommendation |
|--------|--------------|-------------------|----------------|
| **Conversational depth** | Good (8K context) | Excellent (200K context) | ✅ **Claude** |
| **Multi-step reasoning** | Good | Excellent | ✅ **Claude** |
| **MCP support** | No | Yes (native) | ✅ **Claude** |
| **Cost per conversation** | High (€0.03/1K input) | Medium (€0.003/1K input) | ✅ **Claude** 10x cheaper! |
| **Response quality** | Excellent | Excellent | ⚠️ Tie |
| **Speed** | Fast | Fast | ⚠️ Tie |
| **Tool calling** | Yes (function calling) | Yes (better for complex) | ✅ **Claude** |
| **Streaming** | Yes | Yes | ⚠️ Tie |

**Updated Recommendation:**

**V2.0 Architecture:**
- **Primary:** Claude Sonnet 4.5 (for Research Mode)
  - Reason: Native MCP, 10x cheaper for long conversations, excellent multi-step reasoning
- **Secondary:** OpenAI GPT-4 (fallback only)
  - Use if Claude API down
  - Use for specific tasks where OpenAI excels (rare)

**Cost Implications:**
```
Research Mode Usage (20 active users):
- Avg conversation: 15 messages
- Avg tokens per conversation: ~20K input, ~5K output
- Cost per conversation (Claude): €0.06 + €0.08 = €0.14
- Conversations per user per month: 50
- Total: 20 users × 50 × €0.14 = €140/month

With 80% cache hit rate:
- €140 × 0.2 = €28/month for AI queries
- €30-50/month for infrastructure = €58-78/month total

WELL WITHIN BUDGET ✅
```

---

#### 2.2 RAG (Retrieval-Augmented Generation) Architecture

**Requirement:** AI needs access to financial data to answer questions

**Current Recommendation:** MCP server (tools for AI to query database)

**Analysis:**

**MCP Approach (Recommended):**
```python
# AI can call tools to fetch data
@mcp_server.tool
def get_recipient_data(name: str, year: int):
    """Get financial data for a recipient"""
    return db.query(...)

@mcp_server.tool
def search_typesense(query: str, filters: dict):
    """Search for recipients"""
    return typesense.search(...)
```

**Pros:**
- ✅ AI has direct access to latest data
- ✅ No need to pre-index everything
- ✅ Precise, structured queries
- ✅ Claude has native MCP support

**Cons:**
- ⚠️ Slower (AI must make tool calls)
- ⚠️ Requires good prompt engineering

**Alternative: Vector Search + RAG:**
```python
# Pre-compute embeddings for all data
# AI searches vector DB, retrieves context, generates answer
```

**Pros:**
- ✅ Faster (semantic search)
- ✅ Finds related content

**Cons:**
- ⚠️ Requires embedding ALL data (expensive)
- ⚠️ Data staleness (re-embed on updates)
- ⚠️ Less precise

**Recommendation:** **MCP-first, add vector search in V2.1**

**Rationale:**
- MCP is simpler, more precise
- Government financial data is structured (benefits from SQL, not just semantic search)
- Can add vector search later for "find similar recipients" feature

---

#### 2.3 Multi-Step Analysis (LangChain Integration)

**Requirement:** Research Mode supports multi-step workflows (see US-007)

**Current Recommendation:** Custom orchestration in FastAPI

**Analysis:**

**Without LangChain:**
```python
# Manual orchestration
async def research_query(user_message, conversation_history):
    # 1. Call Claude to understand intent
    intent = await claude.parse_intent(user_message)

    # 2. Execute queries
    data = await db.query(intent.params)

    # 3. Call Claude again to format response
    response = await claude.format_response(data)

    return response
```

**Pros:**
- ✅ Full control
- ✅ No additional dependencies

**Cons:**
- ⚠️ Complex to maintain
- ⚠️ Reinventing the wheel

**With LangChain:**
```python
from langchain.agents import AgentExecutor
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory

# Define tools for AI
tools = [
    Tool(name="GetRecipientData", func=get_recipient_data),
    Tool(name="SearchTypesense", func=search_typesense),
    Tool(name="CompareYears", func=compare_years),
]

# Create agent
agent = AgentExecutor(
    agent=create_claude_agent(tools),
    memory=ConversationBufferMemory(),
    verbose=True
)

# User asks question
response = agent.run(user_message)
```

**Pros:**
- ✅ Built-in conversation memory
- ✅ Agent reasoning (chain-of-thought)
- ✅ Tool orchestration
- ✅ Proven at scale

**Cons:**
- ⚠️ Additional dependency (Python library)
- ⚠️ Learning curve

**Recommendation:** **Use LangChain for Research Mode**

**Rationale:**
- Research Mode is conversational agent (LangChain's sweet spot)
- Saves development time (don't rebuild agent framework)
- Battle-tested for multi-step reasoning
- Active community and updates

**Updated Tech Stack:**
```python
# V2.0 Backend Dependencies
fastapi
sqlalchemy
typesense-client
redis
anthropic  # Claude API (primary)
openai     # OpenAI API (fallback)
langchain  # Agent orchestration ⭐ NEW
langchain-anthropic  # Claude integration
```

**Cost:** €0 (open source library)

---

#### 2.4 Data Visualization Requirements

**Requirement:** AI generates charts (bar, line, pie) on demand

**Current Recommendation:** Not specified

**Options:**

**Option A: Frontend Generates Charts** ⭐ **RECOMMENDED**
```
AI → API returns data (JSON)
     ↓
Frontend receives data
     ↓
React charting library renders (Recharts, Chart.js, D3)
```

**Pros:**
- ✅ Interactive charts (hover, zoom, click)
- ✅ Consistent styling
- ✅ No server-side rendering cost
- ✅ User can customize

**Cons:**
- ⚠️ AI can't directly create chart (sends data + chart type instruction)

**Option B: Backend Generates Chart Images**
```
AI → API generates PNG/SVG
     ↓
Frontend displays static image
```

**Pros:**
- ✅ AI has full control
- ✅ Easy to export

**Cons:**
- ⚠️ Not interactive
- ⚠️ Server-side rendering cost
- ⚠️ Slower

**Recommendation:** **Option A (Frontend Generates)**

**Implementation:**
```typescript
// AI response structure
{
  "message": "Hier is de grafiek van infrastructuuruitgaven 2020-2024:",
  "visualization": {
    "type": "line",  // bar, line, pie, table
    "data": {
      "labels": ["2020", "2021", "2022", "2023", "2024"],
      "datasets": [{
        "label": "Infrastructuuruitgaven",
        "data": [4200000000, 4500000000, 4800000000, 5100000000, 5200000000]
      }]
    },
    "options": {
      "title": "Infrastructuuruitgaven 2020-2024",
      "yAxisLabel": "Bedrag (€)"
    }
  }
}
```

**Frontend Library:** Recharts (React-specific, excellent for data viz)
```bash
npm install recharts
```

**Cost:** €0 (open source)

---

#### 2.5 External Source Integration (wetten.overheid.nl)

**Requirement:** AI links to and summarizes legislation

**Current Recommendation:** Web scraping via MCP tool

**Analysis:**

**Implementation:**
```python
@mcp_server.tool
async def fetch_regulation(regeling_name: str):
    """Fetch regulation from wetten.overheid.nl"""
    # 1. Search wetten.overheid.nl API (if available)
    # 2. Fallback: Web scraping with BeautifulSoup
    # 3. Parse regulation text
    # 4. Return: title, URL, summary

    return {
        "title": "Besluit financiële instrumenten",
        "url": "https://wetten.overheid.nl/...",
        "summary": "Dit besluit regelt...",
        "full_text": "..." # optional
    }
```

**Technical Details:**
- **API:** Check if wetten.overheid.nl has official API (likely yes)
- **Scraping:** BeautifulSoup + httpx (if no API)
- **Caching:** Cache regulation text (rarely changes)
- **Rate Limiting:** Respect robots.txt, implement delays

**Dependencies:**
```python
beautifulsoup4  # HTML parsing
httpx  # Async HTTP client
```

**Legal/Ethical:**
- ✅ wetten.overheid.nl is public domain
- ✅ Non-commercial use (educational/research)
- ✅ Attribute source in response

**Cost:** €0 (web scraping is free)

---

---

# PART 3: PERFORMANCE & COST ANALYSIS

---

## Performance Analysis

### V1.0: Search Bar Performance Targets

| Query Type | Target | Typesense Capability | Status |
|------------|--------|----------------------|--------|
| Simple keyword | <100ms | <50ms | ✅ Exceeds |
| Multi-word phrase | <150ms | <80ms | ✅ Exceeds |
| With 3+ filters | <300ms | <150ms | ✅ Exceeds |
| Complex boolean | <500ms | <200ms | ✅ Exceeds |
| Autocomplete | <50ms | <30ms | ✅ Exceeds |

**Conclusion:** Typesense **exceeds** all performance targets. No changes needed.

---

### V2.0: Research Mode Performance Targets

| Operation | Target | Analysis | Status |
|-----------|--------|----------|--------|
| AI text response | <3s | Claude: ~1-2s typical | ✅ Achievable |
| AI with chart | <5s | Claude: 1-2s + frontend render: 0.5s | ✅ Achievable |
| Tool call (DB query) | <500ms | SQLAlchemy + MySQL: <200ms | ✅ Achievable |
| Tool call (Typesense) | <100ms | Typesense: <50ms | ✅ Achievable |

**Bottlenecks:**
1. **Claude API latency** (1-2s) - Can't optimize, but acceptable
2. **Large data transfers** (>10K rows) - Implement pagination

**Optimizations:**
- **Streaming responses:** Show AI response as it arrives
- **Caching:** 80% of queries cached (Redis, 7-day TTL)
- **Connection pooling:** Reuse DB/API connections

**Conclusion:** All targets **achievable** with current architecture.

---

### 4. Cost Analysis (Updated)

#### 4.1 Infrastructure Costs (Unchanged)

```
Railway Infrastructure:
- Frontend (Next.js):       €15-25
- Backend (FastAPI):        €15-25
- MySQL:                    €7
- Typesense:                €15-25
- Redis:                    €7-10
─────────────────────────────────
Subtotal:                   €59-92/month
```

---

#### 4.2 AI Costs (Updated - Research Mode Focus)

**V1.0 (No Research Mode):**
```
Search Bar only (keyword search with AI fallback for complex queries):
- OpenAI GPT-4 Turbo: ~€20-30/month
- Total AI: €20-30/month
```

**V2.0 (Research Mode - 20 Active Users):**
```
Claude Sonnet 4.5 (Primary):
- 20 users × 50 conversations/month = 1,000 conversations
- €0.14 per conversation (avg 15 messages)
- Total: €140/month

With 80% cache hit rate:
- €140 × 0.2 = €28/month (actual AI cost)

OpenAI GPT-4 (Fallback - 5% of queries):
- €28 × 0.05 = €1.40/month

Total AI (V2.0): €30-35/month ✅
```

**Updated Total Monthly Cost (V2.0):**
```
Infrastructure:              €59-92
AI (Research Mode):          €30-35
───────────────────────────────────
Total:                       €89-127/month

Within budget: ✅ (€180 target)
Savings vs current: €53-91/month
Buffer for growth: €53-91
```

**Conclusion:** Research Mode is **affordable** with Claude (10x cheaper than GPT-4 for conversations).

---

---

## Data Layer Requirements

### V1.0: Search Bar - Current Database OK

**Requirement:** Typesense index of all searchable fields

**Data Flow:**
```
MySQL (source) → API (reads) → Typesense (indexes)
                                    ↓
                            User search queries
```

**Typesense Index Structure:**
```json
{
  "name": "recipients",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "ontvanger", "type": "string", "facet": false},
    {"name": "module", "type": "string", "facet": true},
    {"name": "begrotingsnaam", "type": "string", "facet": true},
    {"name": "instrument", "type": "string", "facet": true},
    {"name": "regeling", "type": "string", "facet": true},
    {"name": "year_2024", "type": "int32"},
    {"name": "year_2023", "type": "int32"},
    ... (all years)
    {"name": "total_all_years", "type": "int64"},
    {"name": "year_count", "type": "int32"}
  ]
}
```

**Indexing Strategy:**
- **Full re-index:** Nightly (automated via Railway cron)
- **Incremental:** After manual data import (trigger API endpoint)
- **Duration:** ~5-10 minutes (2.5M rows)

**Status:** ✅ No additional data processing needed

---

### V2.0: Research Mode - Needs Pre-Computed Aggregations

**Requirement:** AI needs fast access to aggregated data for analysis

**Problem:**
- AI asks: "Vergelijk ProRail met Rijkswaterstaat 2020-2024"
- Without pre-computation: 10+ SQL queries, 2-3 seconds
- With pre-computation: 1 cache lookup, <100ms

**Solution: Materialized Views / Aggregation Tables**

**New Tables (Recommended):**

**1. `analytics_recipient_yearly`**
```sql
CREATE TABLE analytics_recipient_yearly (
  ontvanger VARCHAR(255),
  year INT,
  module VARCHAR(50),
  total_amount BIGINT,
  transaction_count INT,
  top_begrotingsnaam VARCHAR(255),
  top_instrument VARCHAR(255),
  top_regeling VARCHAR(255),
  PRIMARY KEY (ontvanger, year, module),
  INDEX idx_ontvanger (ontvanger),
  INDEX idx_year (year)
);
```

**Purpose:** Fast recipient comparisons, year-over-year analysis

**2. `analytics_recipient_summary`**
```sql
CREATE TABLE analytics_recipient_summary (
  ontvanger VARCHAR(255) PRIMARY KEY,
  modules_present JSON,  -- ["instrumenten", "apparaat"]
  first_year INT,
  last_year INT,
  year_count INT,
  total_all_years BIGINT,
  avg_per_year BIGINT,
  growth_rate DECIMAL(5,2),  -- % change first to last year
  top_module VARCHAR(50),
  top_begrotingsnaam VARCHAR(255)
);
```

**Purpose:** Quick recipient profile, used by AI for context

**3. `analytics_module_trends`**
```sql
CREATE TABLE analytics_module_trends (
  module VARCHAR(50),
  year INT,
  total_amount BIGINT,
  recipient_count INT,
  avg_amount BIGINT,
  top_recipient VARCHAR(255),
  top_begrotingsnaam VARCHAR(255),
  PRIMARY KEY (module, year)
);
```

**Purpose:** Module-level insights, trends

**When to Compute:**
- After data import (nightly or on-demand)
- Incrementally (if possible)
- 5-10 minutes computation time

**Cost:** €0 (uses existing MySQL, no additional service)

---

### V2.1: Vector Search (Optional - Future)

**Requirement:** "Find similar recipients" feature

**Not needed for V2.0, but plan for future:**

**Vector Database Options:**
- **Option A:** Typesense vector search (native support!)
- **Option B:** Separate vector DB (Pinecone, Weaviate, Milvus)

**Recommendation:** **Option A (Typesense)**

**Rationale:**
- Typesense supports vector search natively (since v0.24)
- No additional service needed
- Hybrid search (keyword + semantic) in one query

**Implementation (Future V2.1):**
```python
# Generate embeddings for recipients
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')

# For each recipient
embedding = model.encode(f"{ontvanger} {begrotingsnaam} {instrument}")

# Index in Typesense
typesense.collections['recipients'].documents.upsert({
  "id": "123",
  "ontvanger": "ProRail B.V.",
  "embedding": embedding.tolist()  # 384-dim vector
})

# Search
results = typesense.search({
  "q": "*",
  "vector_query": f"embedding:([...], k:10)"
})
```

**Cost:** €0 (same Typesense instance, slight increase in memory)

---

### 6. Security & Privacy Considerations

#### 6.1 AI Conversations - Data Privacy

**Concern:** User conversations with AI contain sensitive research queries

**Mitigation:**

1. **No data sent to AI providers (Claude, OpenAI)**
   - Financial data stays in our database
   - AI only receives query results (not raw database)
   - MCP tools fetch data on-demand

2. **Conversation logging**
   - Store conversations in OUR database (not AI provider)
   - User can delete conversation history
   - Implement GDPR right to erasure

3. **Shared links**
   - User controls what's shared
   - Option to exclude sensitive annotations
   - Expiration dates on shared links

**Status:** ✅ Addressed in architecture

---

#### 6.2 Rate Limiting (Prevent Abuse)

**Concern:** Users abuse AI queries (expensive)

**Mitigation:**

**Per-User Quotas:**
```python
RESEARCH_TIER_LIMITS = {
    "queries_per_day": 100,
    "queries_per_hour": 20,
    "max_conversation_length": 50,  # messages
    "max_export_rows": 100_000
}

PRO_TIER_LIMITS = {
    "queries_per_day": 0,  # No Research Mode
    "export_rows": 10_000
}
```

**Implementation:**
- Redis-based rate limiting
- Per-user counters (reset daily/hourly)
- Graceful degradation (slow down, don't block)

**Status:** ✅ Addressed in architecture

---

## Updated Architecture Recommendation

### Changes from Original Recommendation

| Component | Original | Updated | Reason |
|-----------|----------|---------|--------|
| **AI Primary** | OpenAI GPT-4 | Claude Sonnet 4.5 | 10x cheaper for conversations, native MCP, better multi-step reasoning |
| **AI Secondary** | Claude | OpenAI GPT-4 | Demote to fallback |
| **AI Orchestration** | Custom | LangChain | Agent framework, conversation memory, proven at scale |
| **Data Layer** | MySQL read-only | MySQL + analytics tables | Pre-computed aggregations for Research Mode |
| **Visualization** | Not specified | Frontend (Recharts) | Interactive charts, no server-side rendering |
| **External APIs** | Not specified | wetten.overheid.nl (MCP tool) | Legislation lookup |

---

### Updated Tech Stack (V2.0)

#### Frontend (Next.js 14)
```
✅ No changes
+ recharts (data visualization library)
```

#### Backend (Python FastAPI)
```
✅ Existing:
- fastapi
- sqlalchemy
- alembic
- pydantic
- redis
- typesense-client

🆕 New:
- anthropic (Claude API - primary)
- openai (GPT-4 API - fallback)
- langchain (agent orchestration)
- langchain-anthropic (Claude integration)
- beautifulsoup4 (web scraping for wetten.overheid.nl)
- httpx (async HTTP client)
- sentence-transformers (future - vector embeddings for V2.1)
```

#### Database
```
✅ MySQL (Phase 1)
🆕 New tables:
- analytics_recipient_yearly
- analytics_recipient_summary
- analytics_module_trends
- research_conversations (store user sessions)
- research_shared_links (shared session management)
```

#### Infrastructure
```
✅ No changes to Railway setup
```

---

## Cost Summary (Updated)

### V1.0 (Search Bar Only)

```
Infrastructure:              €59-92/month
AI (minimal):                €20-30/month
───────────────────────────────────────
Total V1.0:                  €79-122/month

Budget:                      €180/month
Buffer:                      €58-101/month ✅
```

### V2.0 (Search Bar + Research Mode)

```
Infrastructure:              €59-92/month
AI (Claude-primary):         €30-35/month
───────────────────────────────────────
Total V2.0:                  €89-127/month

Budget:                      €180/month
Buffer:                      €53-91/month ✅
Savings vs current:          €53-91/month ✅
```

**Conclusion:** ✅ **Well within budget, even with Research Mode**

---

## Risk Assessment

### Low Risk ✅

1. **Typesense for Search Bar**
   - Proven technology
   - Exceeds performance requirements
   - Fits budget

2. **Claude API Availability**
   - Anthropic is stable, well-funded
   - Fallback to OpenAI if needed

3. **Cost Overruns**
   - 80% cache hit rate achievable
   - Rate limiting prevents abuse
   - Claude is 10x cheaper than GPT-4

### Medium Risk ⚠️

1. **LangChain Dependency**
   - Mitigation: Active community, well-maintained
   - Can replace if needed (custom orchestration)

2. **wetten.overheid.nl API Changes**
   - Mitigation: Graceful fallback to manual links
   - Cache regulation text

3. **AI Response Quality**
   - Mitigation: Extensive prompt engineering
   - User feedback loop to improve
   - Human review for critical features

### High Risk ❌

**None identified.**

---

## Recommendations

### Immediate (V1.0 Development)

1. ✅ **Proceed with Typesense for Search Bar**
   - No changes needed
   - Exceeds requirements
   - Within budget

2. ✅ **Implement core FastAPI + Next.js architecture**
   - As originally planned

3. ✅ **Set up Railway infrastructure**
   - As originally planned

---

### Before V2.0 (Research Mode)

1. 🆕 **Switch AI Primary to Claude**
   - Update RECOMMENDED-TECH-STACK.md
   - Document rationale (cost, MCP, conversation quality)

2. 🆕 **Add LangChain to backend dependencies**
   - Evaluate agent framework
   - Prototype conversation flow

3. 🆕 **Design analytics tables**
   - Create analytics_recipient_yearly, analytics_recipient_summary, analytics_module_trends
   - Implement aggregation scripts
   - Test query performance

4. 🆕 **Prototype MCP tools**
   - Implement get_recipient_data, search_typesense, compare_recipients
   - Test with Claude API
   - Measure latency

5. 🆕 **Design conversation storage schema**
   - research_conversations table
   - research_shared_links table
   - Privacy controls

---

### Optional (V2.1 Enhancements)

1. **Vector search for similarity**
   - Use Typesense native vector search
   - Generate embeddings for recipients
   - "Find similar recipients" feature

2. **Advanced visualizations**
   - Heatmaps, scatter plots, geographic maps
   - D3.js for custom charts

3. **wetten.overheid.nl deep integration**
   - Parse full regulation text
   - AI summarization
   - Cross-reference with financial data

---

## Next Steps

### 1. Update Architecture Documents

**Files to update:**
- `RECOMMENDED-TECH-STACK.md` - Switch AI primary to Claude
- `architecture-overview.md` - Add LangChain, update AI section

### 2. Create Wireframes

**Focus areas:**
- Search bar with autocomplete/instant preview
- Advanced filters (collapsible panel)
- Research Mode interface (conversational chat)
- Data visualization in Research Mode

### 3. Estimate Development Effort

**Break down user stories into tasks:**
- V1.0: Search Bar (Weeks 1-8)
- V2.0: Research Mode (Weeks 9-16)

### 4. Prioritize MVP Features

**Define what must be in V1.0 vs V2.0:**
- Critical: Search bar, filters, Typesense
- Important: Basic exports, user accounts
- Nice-to-have: Advanced analytics, insights

---

## Conclusion

### ✅ Architecture is Sound

The recommended stack (Python + FastAPI + Next.js + Railway + Typesense) **fully supports** both Search Bar (V1.0) and Research Mode (V2.0) requirements.

### 🆕 Key Changes

1. **Switch AI primary from OpenAI to Claude** (10x cost savings for conversations)
2. **Add LangChain for agent orchestration** (proven framework for conversational AI)
3. **Add analytics tables for Research Mode** (pre-computed aggregations)
4. **Frontend generates charts** (Recharts library, interactive visualizations)

### 💰 Budget Confirmed

- **V1.0:** €79-122/month (within €180 budget)
- **V2.0:** €89-127/month (within €180 budget)
- **Buffer:** €53-91/month for growth

### 🚀 Ready to Proceed

All requirements validated against architecture. No blockers identified. Proceed with:
1. Wireframe design
2. Development effort estimation
3. V1.0 MVP definition

---

**Status:** ✅ **APPROVED FOR DEVELOPMENT**
**Next:** Wireframes + UI/UX Design
**Date:** 2026-01-14
