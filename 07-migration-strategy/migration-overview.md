# Migration Strategy

**Last Updated:** 2026-01-21

## Overview

| Document | Purpose |
|----------|---------|
| [Deployment Strategy](./deployment-strategy.md) | Domain setup, staging, cutover procedure |
| [Sprint Plan](../09-timelines/v2-sprint-plan.md) | Week-by-week execution |

## Key Decisions (2026-01-21)

| Decision | Outcome |
|----------|---------|
| Production domain | rijksuitgaven.nl |
| Staging domain | beta.rijksuitgaven.nl |
| Staging protection | Magic Link (Supabase Auth) |
| Beta testers | 5 people |
| Cutover | Hard DNS switch |
| Rollback | None - thorough testing |

## Migration Summary

| What | How |
|------|-----|
| **Data** | MySQL source tables → Supabase (Week 1) |
| **Users** | 50 users via CSV → Supabase Auth (Week 6) |
| **Testing** | beta.rijksuitgaven.nl with 5 testers (Week 8) |
| **Switch** | DNS: rijksuitgaven.nl → Railway (Week 8) |

---

## Data Migration Details (2026-01-21)

### Source Data Export
- **Method:** SQL dump or data dump from current MySQL
- **Tables to migrate:** 7 source tables + `universal_search`

### EUR Normalization (IMPORTANT)
Amounts vary by module - the `universal_search` script handles conversion:

| Module | Amount Format | Conversion |
|--------|---------------|------------|
| Financiële Instrumenten | x1000 (thousands) | Already normalized |
| Apparaatsuitgaven | x1000 (thousands) | Already normalized |
| Inkoopuitgaven | Varies | Script converts |
| Provinciale subsidies | Absolute EUR | Script converts to x1000 |
| Gemeentelijke subsidies | Absolute EUR | Script converts to x1000 |
| Publiek | Absolute EUR | Script converts to x1000 |

### universal_search Table
- **Decision:** Migrate as-is (Option A)
- **Updates:** Founder has SQL scripts to repopulate when source data changes
- **Action:** Run existing scripts on Supabase/PostgreSQL after migration

---

## User Migration Details (2026-01-21)

### Data Source
- **Format:** CSV export from founder
- **Count:** ~50 users

### User Data Fields

| Field | Purpose | Required |
|-------|---------|----------|
| Email | Login identifier (Magic Link) | Yes |
| First name | Display name | Yes |
| Last name | Display name | Yes |
| Organisation | User profile | Yes |
| Role | User profile | No |
| Phone | Contact info | No |
| Start date | Subscription tracking | Yes |
| End date | Subscription expiry | Yes |
| Subscription type | "yearly" or "monthly" | Yes |
| List | User segment | Yes |

### User Lists (Segments)

| List | Meaning |
|------|---------|
| Per jaar | Annual subscriber (active) |
| Per maand | Monthly subscriber (active) |
| Prospects | Trial/demo users |
| Ex | Former subscribers |

### Supabase Schema

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organisation TEXT,
  role TEXT,
  phone TEXT,
  subscription_type TEXT, -- 'yearly', 'monthly'
  subscription_start DATE,
  subscription_end DATE,
  user_list TEXT, -- 'Per jaar', 'Per maand', 'Prospects', 'Ex'
  created_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'
);
```

---

**Note:** Detailed migration scripts and commands will be created during Week 1 development.
