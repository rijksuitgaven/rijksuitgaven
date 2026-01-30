# Local Development Setup

**Purpose:** Everything needed to develop on a new machine.

**Last Updated:** 2026-01-26

---

## Quick Start (New Machine)

```bash
# 1. Clone the repo
git clone [your-repo-url]
cd rijksuitgaven

# 2. Install system dependencies
brew install node python3

# 3. Install Python packages (for Typesense sync)
pip3 install typesense psycopg2-binary

# 4. Install Node packages (run from /app folder)
cd app
npm install

# 5. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys
```

---

## System Requirements

| Tool | Version | Install Command | Purpose |
|------|---------|-----------------|---------|
| Node.js | 18+ | `brew install node` | Next.js runtime |
| Python | 3.10+ | `brew install python3` | Typesense sync scripts |
| npm | 9+ | Comes with Node | Package manager |
| Git | Any | `brew install git` | Version control |
| psql (libpq) | Any | `brew install libpq` | Database scripts (data updates) |

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
python3 --version # Should be 3.10+
git --version     # Any version
/usr/local/opt/libpq/bin/psql --version  # Any version (for data updates)
```

**Note:** psql is installed via libpq but not symlinked. Use full path: `/usr/local/opt/libpq/bin/psql`

---

## Python Packages

| Package | Install Command | Purpose |
|---------|-----------------|---------|
| typesense | `pip3 install typesense` | Typesense API client |
| psycopg2-binary | `pip3 install psycopg2-binary` | PostgreSQL driver |

### Install All Python Packages

```bash
pip3 install typesense psycopg2-binary
```

---

## Node Packages (in /app folder)

Installed via `npm install` from `package.json`. Key packages:

| Package | Purpose | Status |
|---------|---------|--------|
| next | React framework | ✅ Installed |
| react | UI library (v19) | ✅ Installed |
| typescript | Type safety | ✅ Installed |
| tailwindcss | Styling | ✅ Installed |
| @supabase/supabase-js | Supabase client | ✅ Installed |
| typesense | Typesense client | ✅ Installed |
| @tanstack/react-table | Data tables | ✅ Installed |
| @tanstack/react-query | Server state | ✅ Installed |
| recharts | Charts (React 19 compatible) | ⏳ To install Week 3 |
| shadcn/ui components | UI components | ✅ Installed (v3.7.0) |
| xlsx | Excel export (SheetJS) | ✅ Installed |

### Chart Library Decision (2026-01-26)

Tremor v3.18.7 requires React 18, but Next.js 15 uses React 19.

**Decision:** Use **Recharts** instead of Tremor.

| Aspect | Recharts | Tremor |
|--------|----------|--------|
| React 19 | ✅ Compatible | ❌ Not compatible |
| Bundle size | 50KB | 95KB |
| Charts needed | ✅ All V1.0 charts | - |

**For V2.0:** Add Nivo selectively for treemap/heatmap (Recharts doesn't have these).

**Reference:** `docs/plans/CHART-LIBRARY-QUICK-REFERENCE.md`

---

## Environment Variables

Create `app/.env.local` with:

```env
# Backend API (FastAPI)
NEXT_PUBLIC_API_URL=https://rijksuitgaven-api-production-3448.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kmdelrgtgglcrupprkqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[get from Supabase dashboard]

# Typesense
NEXT_PUBLIC_TYPESENSE_HOST=typesense-production-35ae.up.railway.app
NEXT_PUBLIC_TYPESENSE_PORT=443
NEXT_PUBLIC_TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=0vh4mxafjeuvd676gw92kpjflg6fuv57

# Database (for scripts only, not Next.js)
SUPABASE_DB_URL=postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Note:** `NEXT_PUBLIC_API_URL` defaults to the Railway API if not set.

**Get keys from:**
- Supabase: https://supabase.com/dashboard/project/kmdelrgtgglcrupprkqf/settings/api

---

## Running Locally

### Next.js Development Server

```bash
cd app
npm run dev
```

Opens at: http://localhost:3000

### Typesense Sync

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven
SUPABASE_DB_URL="postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" python3 scripts/typesense/sync_to_typesense.py --recreate
```

---

## IDE Setup (Optional)

### VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar) - for better TS support

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## Railway Deployment

| Property | Value |
|----------|-------|
| App URL | `https://rijksuitgaven-production.up.railway.app` |
| **Beta URL** | `https://beta.rijksuitgaven.nl` |
| Root Directory | `app` |
| Region | EU West (Amsterdam) |
| Auto-deploy | Yes (on push to main) |

**To redeploy manually:** Push to GitHub, Railway auto-deploys.

### DNS Configuration (Vimexx)

| Type | Name | Value |
|------|------|-------|
| CNAME | beta | `j65ghs38.up.railway.app` (Railway-provided target) |

**Note:** CNAME target is provided by Railway when adding custom domain. Don't use app URL directly.

**Production DNS (Week 8):** Will point `rijksuitgaven.nl` to Railway (new target will be provided).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `command not found: node` | `brew install node` |
| `command not found: python` | Use `python3` instead |
| `command not found: pip` | Use `pip3` instead |
| Supabase connection fails | Use pooler URL, not direct URL |
| Port 3000 in use | `npx kill-port 3000` or use `npm run dev -- -p 3001` |

---

## Folder Structure

```
rijksuitgaven/
├── app/                    # Next.js frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.local         # Environment variables (not in git)
├── backend/                # FastAPI backend (NEW - Week 2)
│   ├── app/
│   │   ├── main.py        # FastAPI application
│   │   ├── config.py      # Environment configuration
│   │   └── api/v1/        # API endpoints
│   ├── requirements.txt
│   ├── .env               # Environment variables (not in git)
│   └── README.md
├── scripts/
│   ├── typesense/         # Typesense sync scripts
│   ├── sql/               # Database scripts
│   └── data/              # Data migration scripts
├── docs/                  # Documentation
├── logs/                  # Session logs
└── ...
```

---

## Backend (FastAPI) Setup

### Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip3 install -r requirements.txt
```

### Environment Variables

Create `backend/.env`:

```env
# Supabase (PostgreSQL) - Use pooler URL
DATABASE_URL=postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Typesense
TYPESENSE_HOST=typesense-production-35ae.up.railway.app
TYPESENSE_API_KEY=0vh4mxafjeuvd676gw92kpjflg6fuv57
TYPESENSE_PROTOCOL=https
TYPESENSE_PORT=443

# Debug mode
DEBUG=false
```

### Run Backend Locally

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Opens at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Backend Packages

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.115.0 | Web framework |
| uvicorn | 0.32.0 | ASGI server |
| asyncpg | 0.30.0 | PostgreSQL async driver |
| sqlalchemy | 2.0.36 | ORM (optional) |
| pydantic | 2.10.0 | Validation |
| httpx | 0.28.0 | HTTP client for Typesense |
