# Integration Architecture

**Project:** Rijksuitgaven.nl
**Version:** 2.0 (Current Deployment)
**Date:** 2026-02-11
**Status:** Deployed

---

## Table of Contents

1. [Overview](#overview)
2. [Internal Integrations](#internal-integrations)
3. [External Integrations](#external-integrations)
4. [Future Integrations](#future-integrations)

---

## Overview

This document describes the actual integrations in the deployed V2.0 system.

### Current Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    RIJKSUITGAVEN V2.0                     │
│                                                           │
│  Next.js Frontend ──► BFF Routes ──► FastAPI Backend     │
│         │                                    │            │
│         │                                    ├──► Supabase PostgreSQL
│         │                                    │            │
│         │                                    └──► Typesense
│         │                                                 │
│         └──────────────► Supabase Auth ──► Resend SMTP   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Key Points:**

- All integrations are internal or simple HTTPS/JSON
- No AI integrations yet (deferred to V3+)
- No external data APIs yet (deferred to V8+)
- Authentication via Supabase (built-in)

---

## Internal Integrations

### 1. Next.js Frontend ↔ FastAPI Backend

**Protocol:** HTTPS/JSON

**Data Flow:**

```
Browser → Next.js BFF Route → FastAPI Backend
              ↓
        X-BFF-Secret header
```

**8 BFF Routes:**

| BFF Route | Backend Endpoint | Method |
|-----------|------------------|--------|
| `/api/modules` | `/api/v1/modules` | GET |
| `/api/[module]` | `/api/v1/modules/{module}` | GET |
| `/api/[module]/[value]/details` | `/api/v1/modules/{module}/{value}/details` | GET |
| `/api/[module]/[value]/grouping-counts` | `/api/v1/modules/{module}/{value}/grouping-counts` | GET |
| `/api/[module]/filters` | `/api/v1/modules/{module}/filter-options` | POST |
| `/api/autocomplete` | `/api/v1/search/autocomplete` | GET |
| `/api/auth/magiclink` | Supabase Auth (direct) | POST |
| `/api/feedback` | (stores in Supabase) | POST |

**Security:**

- X-BFF-Secret header (shared secret between Next.js and FastAPI)
- Backend validates secret before processing request
- BFF never exposes `TYPESENSE_API_KEY` to browser

**Error Handling:**

```typescript
// BFF standardized error response
{
  "error": "Error message for user",
  "details": "Technical details (dev only)"
}
```

**Timeout:**

- BFF timeout: 30 seconds
- Backend timeout: 25 seconds (ensures BFF can respond)

---

### 2. FastAPI Backend ↔ Supabase PostgreSQL

**Protocol:** PostgreSQL wire protocol (asyncpg)

**Connection:**

```python
import asyncpg

# Connection pooler (not direct connection)
DATABASE_URL = "postgresql://postgres.kmdelrgtgglcrupprkqf:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Create connection pool
pool = await asyncpg.create_pool(
    DATABASE_URL,
    min_size=5,
    max_size=20,
    command_timeout=20.0
)

# Execute query
async with pool.acquire() as conn:
    rows = await conn.fetch("SELECT * FROM instrumenten WHERE jaar = $1", [2024])
```

**Connection Pooling:**

- Min connections: 5
- Max connections: 20
- Supabase pooler: 100 connections available (Pro plan)
- Current usage: ~20 connections (peak)

**Query Patterns:**

- **Aggregated queries:** `SELECT * FROM instrumenten_aggregated WHERE ...`
- **Detail queries:** `SELECT * FROM instrumenten WHERE ontvanger = $1`
- **Filter options:** `SELECT DISTINCT regeling, COUNT(*) FROM instrumenten GROUP BY regeling`

**Performance:**

- Aggregated queries: 50-200ms
- Detail queries: 100-500ms
- Filter queries: 200-1000ms (depends on filters)

**Error Handling:**

```python
try:
    rows = await conn.fetch(query, params)
except asyncpg.PostgresError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(500, "Database query failed")
```

---

### 3. FastAPI Backend ↔ Typesense

**Protocol:** HTTPS/JSON

**Client Library:** `typesense` (Python)

**Configuration:**

```python
import typesense

client = typesense.Client({
    'nodes': [{
        'host': 'typesense-production-35ae.up.railway.app',
        'port': '443',
        'protocol': 'https'
    }],
    'api_key': os.getenv('TYPESENSE_API_KEY'),
    'connection_timeout_seconds': 5
})
```

**Search Query:**

```python
# Autocomplete search
results = client.collections['recipients'].documents.search({
    'q': search_term,
    'query_by': 'ontvanger',
    'prefix': 'true,true',
    'per_page': 10,
    'typo_tolerance': 2
})
```

**Performance:**

- Search latency: <25ms (target: <100ms)
- Concurrent searches: Unlimited (Typesense handles)

**Error Handling:**

```python
try:
    results = client.collections[collection].documents.search(params)
except typesense.exceptions.RequestUnauthorized:
    logger.error("Typesense API key invalid")
    raise HTTPException(500, "Search service unavailable")
except typesense.exceptions.RequestMalformed as e:
    logger.error(f"Malformed search query: {e}")
    raise HTTPException(400, "Invalid search query")
```

---

### 4. Next.js Frontend ↔ Supabase Auth

**Protocol:** HTTPS/JSON (Supabase Auth API)

**Client:** `@supabase/supabase-js` (browser client)

**Magic Link Flow:**

```typescript
// Step 1: User enters email
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})

// Step 2: User clicks email link → redirected to /auth/callback?code=...

// Step 3: Client-side PKCE exchange
const supabase = createBrowserClient(...)
await supabase.auth.exchangeCodeForSession(code)

// Step 4: Browser sets httpOnly cookies
// - sb-access-token
// - sb-refresh-token
```

**Session Management:**

```typescript
// Check session
const { data: { session } } = await supabase.auth.getSession()

// Refresh token (middleware does this automatically)
const { data: { session } } = await supabase.auth.refreshSession()

// Logout
await supabase.auth.signOut()
```

**Error Handling:**

```typescript
if (error) {
  if (error.status === 429) {
    return "Te veel aanvragen, probeer het later opnieuw"
  }
  return "Er is iets misgegaan, probeer het opnieuw"
}
```

---

## External Integrations

### 1. Supabase Auth ↔ Resend SMTP

**Protocol:** SMTP (Simple Mail Transfer Protocol)

**Configuration (Supabase Dashboard):**

- SMTP Host: `smtp.resend.com`
- SMTP Port: `587` (TLS)
- SMTP Username: `resend`
- SMTP Password: (Resend API key)
- From Email: `noreply@rijksuitgaven.nl`

**Email Types:**

1. **Magic Link:** User login (sent on `/api/auth/magiclink`)
2. **Password Reset:** Not used (passwordless auth only)

**Email Template:**

```html
<!-- Supabase default template -->
<h2>Magic Link</h2>
<p>Click the link below to sign in:</p>
<a href="{{ .ConfirmationURL }}">Sign in</a>
```

**Customization:** Can override template in Supabase dashboard (deferred to V2.1)

**Rate Limiting:**

- Resend free tier: 100 emails/day
- Supabase default: 3 emails per hour per email address

**Error Handling:**

- If SMTP fails, Supabase returns error to BFF
- BFF shows generic error to user
- Admin can check Supabase logs for details

---

## Future Integrations (V3+)

### V3.0 - Rijksuitgaven Reporter

**Claude API (Anthropic):**

```python
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Extract keywords from news article
message = client.messages.create(
    model="claude-3-haiku-20240307",
    max_tokens=500,
    messages=[{
        "role": "user",
        "content": f"Extract keywords from: {article_text}"
    }]
)
```

**RSS Feeds:**

```python
import feedparser

# Fetch RSS feeds
feeds = [
    'https://www.rijksoverheid.nl/rss',
    'https://nos.nl/rss/nieuws.xml',
    'https://www.rtlnieuws.nl/rss'
]

for feed_url in feeds:
    feed = feedparser.parse(feed_url)
    for entry in feed.entries:
        process_article(entry)
```

**Resend API (Email Delivery):**

```python
import resend

resend.api_key = os.getenv("RESEND_API_KEY")

# Send daily briefing email
resend.Emails.send({
    "from": "reporter@rijksuitgaven.nl",
    "to": user.email,
    "subject": "Rijksuitgaven Dagelijks Briefing",
    "html": render_template("briefing.html", items=items)
})
```

---

### V6.0 - AI Research Mode

**Claude API (Conversational):**

```python
# LangChain agent with MCP tools
from langchain.agents import AgentExecutor
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4.5-20250929",
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

agent = AgentExecutor(
    agent=create_claude_agent(llm, tools),
    memory=ConversationBufferMemory()
)

response = agent.run(user_message)
```

**MCP Tools:**

```python
from mcp import MCPServer

mcp = MCPServer()

@mcp.tool
def get_domain_distribution(year: int):
    """Get IBOS domain breakdown for a year"""
    return query_analytics_domain_yearly(year)

@mcp.tool
def search_recipients(query: str):
    """Search for recipients matching a query"""
    return search_typesense(query)
```

**Redis (Caching):**

```python
import redis.asyncio as redis

# Connection
r = await redis.from_url(os.getenv("REDIS_URL"))

# Cache AI response
await r.setex(
    f"ai:{query_hash}",
    86400,  # 24 hour TTL
    json.dumps(response)
)

# Retrieve cached response
cached = await r.get(f"ai:{query_hash}")
if cached:
    return json.loads(cached)
```

---

### V8.0 - External Integrations

**wetten.overheid.nl (Web Scraping):**

```python
from bs4 import BeautifulSoup
import httpx

async def fetch_regulation(regeling_name: str):
    # Search wetten.overheid.nl
    search_url = f"https://wetten.overheid.nl/zoeken?q={regeling_name}"

    async with httpx.AsyncClient() as client:
        response = await client.get(search_url)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Parse first result
        first_result = soup.find('a', class_='result-link')
        regulation_url = first_result['href']

        # Fetch regulation text
        regulation = await client.get(regulation_url)
        text = extract_text(regulation.text)

        return {
            "title": regeling_name,
            "url": regulation_url,
            "text": text
        }
```

**KvK API (Company Data):**

```python
import httpx

async def fetch_company_data(kvk_number: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.kvk.nl/api/v1/basisprofielen/{kvk_number}",
            headers={"apikey": os.getenv("KVK_API_KEY")}
        )
        return response.json()
```

---

**Document maintained by:** Technical Lead
**Last updated:** 2026-02-11
