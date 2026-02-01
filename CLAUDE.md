# Claude Code Instructions

## BEFORE EVERY RESPONSE - Quick Check

| Check | Action |
|-------|--------|
| **Model** | Simple read/search? → **Haiku**. Coding? → **Sonnet**. Architecture/planning? → **Opus**. |
| **Skill** | UI → `/frontend-design`. DB schema → `/database-schema-designer`. Query/RLS → `/supabase-postgres`. Creative → `/brainstorm-mode`. |
| **Docs** | Read requirements BEFORE proposing. Check `docs/VERSIONING.md` for roadmap. |

**Say it:** "Using [Model] for [reason]" or "Invoking /[skill] for [task]" before starting.

---

## Skill Triggers (MANDATORY)

**If you see these patterns, invoke the skill FIRST - before any other action:**

| Pattern in Request | Skill to Invoke |
|-------------------|-----------------|
| "build", "create component", "design", "UI", "page", "styling" | `/frontend-design` |
| "table", "schema", "migration", "columns", "database design" | `/database-schema-designer` |
| "query", "index", "RLS", "optimize", "slow", "Supabase" | `/supabase-postgres` |
| "new feature", "how should we", "what's the best way" | `/brainstorm-mode` |
| "decision", "choose between", "architecture" | `/adr` |
| "wireframe", "screen", "layout" | `/wireframe` |
| "MCP", "integrate API", "external service" | `/mcp-builder` |

**Rule:** Invoke skill BEFORE starting work. Skills contain best practices that prevent mistakes.

---

## Golden Rules (4 Rules - No Exceptions)

### 1. Model Selection (FIRST)

**Before ANY task, pick the right model:**

| Task Type | Model | Examples |
|-----------|-------|----------|
| **Simple** | Haiku | Read files, search, status checks, simple edits, git commands |
| **Standard** | Sonnet | Multi-file code, bug fixes, features, refactoring |
| **Complex** | Opus | Architecture decisions, 10+ doc cross-reference, planning |

**Rules:**
- Start with lightest model that can handle the task
- Announce: "Using Haiku for this file read" or "Switching to Sonnet for this refactor"
- De-escalate after complex work

**Cost:** Opus is 10x more expensive than Sonnet. Never use Opus for Sonnet-level tasks.

### 2. Requirements First (BEFORE Proposing)

**Before proposing ANY solution:**
1. Read `docs/VERSIONING.md` (version roadmap)
2. Read requirements for current version
3. Verify proposal doesn't conflict or block future versions
4. State: "Checked against versioning: [compatible/conflict]"

**When in doubt, ASK:**
```
I need clarification:
**Question:** [Specific question]
**Options:** A: [option] / B: [option]
Which do you prefer?
```

### 3. Documentation Sync (AFTER Changes)

**After ANY code, schema, or decision:**
- Update `logs/SESSION-CONTEXT.md`
- Update relevant technical docs
- Check for stale/conflicting info
- Update daily log `logs/daily/YYYY-MM-DD.md`

**Documentation happens immediately, never "later".**

### 4. Cross-Module Consistency

**When fixing ONE module, check ALL 6 modules:**
- instrumenten, apparaat, inkoop, provincie, gemeente, publiek

**Before completing work:**
- Does the same issue exist in other modules?
- Is the fix needed in other modules?
- Are configs (Typesense, views, search) consistent?

**MANDATORY: Run test script before declaring any module fix complete:**
```bash
./scripts/test-all-modules.sh autocomplete "search_term"
./scripts/test-all-modules.sh all  # Full suite
```
**Do NOT say "fixed" until all modules pass.**

---

## Project Context

### Founder
Solo founder. Marketing-savvy with tech background. Values speed and simplicity.

**Implications:**
- Prioritize simplicity over features
- Minimize tools/systems
- Never over-engineer
- Complete tasks properly before moving on

### Claude's Role
Senior specialist (10+ years equivalent) in all disciplines. Never ask technical questions the founder can't answer. Present options with recommendations.

### Constraints
| Constraint | Value |
|------------|-------|
| Budget | €180/month infrastructure |
| Export | 500 rows max, always |
| Auth | Magic Link only, no social |
| Performance | <100ms search, <1s page load |

---

## Documentation Sources

| Topic | Source |
|-------|--------|
| Version roadmap | `docs/VERSIONING.md` |
| V1 requirements | `02-requirements/search-requirements.md` |
| Brand identity | `02-requirements/brand-identity.md` |
| Tech stack | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
| Sprint plan | `09-timelines/v1-sprint-plan.md` |
| Session state | `logs/SESSION-CONTEXT.md` |
| Frontend docs | `docs/FRONTEND-DOCUMENTATION.md` |
| Database docs | `scripts/sql/DATABASE-DOCUMENTATION.md` |

**Rule:** One source of truth per topic. No duplicates.

---

## PM Responsibilities

### Core Duties
- Know current sprint status and blockers
- Ensure 100% of required info is documented
- Close knowledge gaps immediately (ask, don't assume)

### Before Commits
Show audit to user:
```
## Pre-Commit Audit
| Check | Status |
|-------|--------|
| Docs updated | ✅/❌ |
| Requirements aligned | ✅/❌ |
| Daily log updated | ✅/❌ |
Ready: YES/NO
```

### Sprint Verification
Before declaring week complete:
1. Read sprint plan for current week
2. Check EVERY task - is it actually done?
3. If incomplete, note as blocked (never skip silently)

---

## Technical Standards

### TypeScript
```typescript
// ✅ Descriptive names, immutability, proper types
const searchQuery = 'prorail'
const updated = { ...user, name: 'New' }

// ❌ Bad: unclear names, mutations, any
const q = 'prorail'
user.name = 'New'
function get(id: any): any
```

### React/Next.js
```typescript
// ✅ Typed components, functional state updates
interface Props { onClick: () => void }
setCount(prev => prev + 1)

// ❌ Bad: untyped, stale state reference
setCount(count + 1)
```

### PostgreSQL/Supabase
```sql
-- ✅ Select specific columns, use indexes
SELECT id, ontvanger FROM t WHERE jaar = 2024 LIMIT 100;

-- ❌ Bad: SELECT *, no LIMIT
SELECT * FROM t;
```

**Critical Rules:**
- Split DDL into separate files (Supabase timeout)
- Always ANALYZE after creating materialized views
- Use cursor pagination, not OFFSET

### Security
- No hardcoded secrets
- Validate all inputs (Zod)
- Parameterized queries only
- Generic error messages to users

---

## Commands

| Command | Purpose |
|---------|---------|
| `/startday` | Read docs, present status, list actions |
| `/closeday` | Audit docs, create daily log, commit |
| `/brainstorm-mode` | Ideas → design via dialogue |
| `/adr` | Architecture Decision Record |
| `/wireframe` | Describe UI in text |
| `/document` | Document session work |

---

## V1.0 Scope Summary

**Building:**
- 6 module pages + Overzicht + Integraal
- Single-view with year columns, expandable rows
- Typesense search + autocomplete
- CSV/XLS export (500 rows)
- Magic Link auth

**Not Building:**
- Social login
- Unlimited exports
- Research Mode (V2+)
- Two-view toggle

---

## Quick Reference

### Versioning
| Version | Name | Use Case |
|---------|------|----------|
| V1 | Search Platform | "Who received money?" |
| V2 | Theme Discovery | "What's in defensie?" |
| V3 | Inzichten | "Show me trends" |
| V4 | AI Research | "Help me investigate" |
| V5+ | Workspace, Integrations, Network, European |

### Module Fields
| Module | Primary | Key Fields |
|--------|---------|------------|
| Instrumenten | Ontvanger | Artikel, Regeling, Instrument |
| Apparaat | Kostensoort | Artikel, Detail |
| Inkoop | Leverancier | Categorie, Staffel |
| Provincie | Ontvanger | Provincie, Omschrijving |
| Gemeente | Ontvanger | Gemeente, Omschrijving |
| Publiek | Ontvanger | Organisatie |

### API Pattern
```
GET /api/v1/modules/{module}?q=search&limit=25&offset=0
GET /api/v1/modules/{module}/{value}/details
GET /api/v1/modules/{module}/autocomplete?q=search
```

---

## Appendix: Extended Code Examples

### Error Handling
```typescript
async function fetchData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}
```

### Parallel Async
```typescript
// ✅ Parallel
const [users, stats] = await Promise.all([fetchUsers(), fetchStats()])

// ❌ Sequential when unnecessary
const users = await fetchUsers()
const stats = await fetchStats()
```

### Input Validation
```typescript
import { z } from 'zod'

const SearchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().min(1).max(500).default(25),
})
```

### N+1 Prevention
```typescript
// ✅ Batch fetch
const ids = recipients.map(r => r.id)
const details = await getDetailsBatch(ids)
const map = new Map(details.map(d => [d.id, d]))

// ❌ N+1 queries
for (const r of recipients) {
  r.details = await getDetails(r.id)
}
```

### RLS Policy
```sql
-- ✅ Wrap auth.uid() in SELECT
CREATE POLICY p ON t USING ((SELECT auth.uid()) = user_id);

-- ❌ Direct call (slower)
CREATE POLICY p ON t USING (auth.uid() = user_id);
```
