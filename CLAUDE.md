# Claude Code Instructions

## BEFORE EVERY RESPONSE - Quick Check

| Check | Action |
|-------|--------|
| **Model** | State `**Model:** [Haiku/Sonnet/Opus] - [reason]` and WAIT for approval. EVERY response, no exceptions. |
| **Approval** | NEVER edit files, run commands, or make changes without explicit user approval ("ok", "yes", "go"). Proposing a change is NOT permission to execute it. |
| **Skill** | UI → `/frontend-design`. DB schema → `/database-schema-designer`. Query/RLS → `/supabase-postgres`. Creative → `/brainstorm-mode`. |
| **Docs** | Read requirements BEFORE proposing. Check `docs/VERSIONING.md` for roadmap. |

**Model selection is MANDATORY.** Do not proceed without user approval. The ONLY exception is direct follow-ups where the user explicitly said "yes/ok/go" to a specific proposed action in the same task.

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

## Golden Rules (7 Rules - No Exceptions)

### 0. NEVER ACT WITHOUT APPROVAL (ABSOLUTE RULE)

**Propose first, then WAIT. Never edit, write, or execute anything without explicit user approval.**

This means:
- **Describe** what you plan to do
- **WAIT** for the user to say "ok", "yes", "go", or similar
- **THEN** execute

**This applies to EVERYTHING:** file edits, git operations, code changes, documentation updates, builds, pushes. Even when the user seems to agree with a direction in discussion, that is NOT permission to edit files. Only an explicit "yes/ok/go/do it/update it" is approval.

**Violations:** If you edit a file before receiving explicit approval, you have broken the most important rule. There are ZERO exceptions.

### 1. Model Selection (MANDATORY - COST CONTROL)

**You are running on Opus. Opus costs 10x more than Sonnet.**

**RULE: After every user prompt, state the recommended model and wait for approval.**

#### Response Format (EVERY TIME)

```
**Model:** [Haiku/Sonnet/Opus] - [one-line reason]
```

Then STOP and wait for user to say "ok", "yes", "go", or similar.

#### Model Guidelines

| Task Type | Model | Examples |
|-----------|-------|----------|
| Read, search, git, status checks | **Haiku** | "Read the log file", "git status" |
| Code edits, bug fixes, features | **Sonnet** | "Fix this bug", "Add a button" |
| Architecture, complex planning | **Opus** | "Design auth system", "Plan migration" |

#### Examples

```
User: "Read the daily log"
Claude: **Model:** Haiku - simple file read
[waits for approval]

User: "Fix the dropdown bug"
Claude: **Model:** Sonnet - single-file code fix
[waits for approval]

User: "How should we structure the new API?"
Claude: **Model:** Opus - architecture decision
[waits for approval]
```

#### No Approval Needed

Skip model approval ONLY when the user explicitly says "yes/ok/go" to a specific proposed action and you are executing that exact action. All other responses MUST state the model. When in doubt, state the model.

### 1b. Design Discussion (BEFORE Implementation)

**For any UI/UX feature, present the approach BEFORE writing code:**

1. **Assign UX number** (per Rule 3a) and write requirement entry
2. State proposed design decisions (position, behavior, styling)
3. List any questions or trade-offs
4. Wait for user approval

**Format:**
```
**UX-XXX: [Feature Name]**

**Proposed Design:**
- [Key decision 1]
- [Key decision 2]

**Questions:**
- [Any clarifications needed]

Ready to implement?
```

**Rule:** No code until design is approved AND UX requirement is written.

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

### 3a. Requirements-First Documentation (MANDATORY)

**Every user-facing feature MUST have a formal requirement entry BEFORE implementation starts.**

**The Requirement Gate (3 steps BEFORE writing code):**

1. **Assign UX number:** Check `02-requirements/search-requirements.md` for next available number
2. **Write the requirement entry** with:
   - `### UX-XXX: [Name]`
   - Requirement description
   - Behavior details (what the user sees/does)
   - Priority (P0/P1/P2)
   - Status: `⏳ In Development`
3. **Show the user:** Include the UX number in your design discussion (Rule 1b)

**After implementation:**
4. Update status to `✅ Implemented YYYY-MM-DD`
5. Update `docs/FRONTEND-DOCUMENTATION.md` if component behavior changes
6. Update `02-requirements/backlog.md` if it was a backlog item

**What counts as "user-facing"?**

| Needs UX-XXX | Does NOT need UX-XXX |
|--------------|---------------------|
| New UI element or component | Backend refactoring |
| Changed user interaction/behavior | Performance optimization (invisible) |
| New page or route | Security hardening |
| Visual design changes | Infrastructure changes |
| Error/empty states users see | Code cleanup/imports |
| Legal compliance displays | API changes (not visible to user) |
| Export formats | Database migrations |

**Format for design discussion:**
```
**UX-XXX: [Feature Name]**
**Proposed Design:**
- [Key decision 1]
- [Key decision 2]

Ready to implement?
```

**Rule:** If it affects what users see or do, it gets a UX-XXX entry. No exceptions. The entry is created BEFORE code, not after.

**Current UX numbers used:** UX-001 through UX-042. Next available: **UX-043**.

### 4. Cross-Module Consistency

**When fixing ONE module, check ALL 7 views:**
- instrumenten_aggregated, apparaat_aggregated, inkoop_aggregated, provincie_aggregated, gemeente_aggregated, publiek_aggregated, **universal_search**

**`universal_search` is the 7th view.** It powers the integraal module. Every column or index added to the 6 module views MUST also be evaluated for `universal_search`. It was missed before (years_with_data) — never again.

**Before completing ANY schema/view change:**

| Check | How |
|-------|-----|
| Same column needed in other views? | Query `pg_attribute` for all 7 views, compare column lists |
| Same index needed in other views? | Query `pg_indexes` for all 7 views, compare index lists |
| Backend code assumes column exists? | Grep for column name in `modules.py` — is integraal using a computed fallback? |

**Verification query (run after ANY view change):**
```sql
SELECT relname, array_agg(attname ORDER BY attnum)
FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid
WHERE relname IN ('instrumenten_aggregated','apparaat_aggregated','inkoop_aggregated',
  'provincie_aggregated','gemeente_aggregated','publiek_aggregated','universal_search')
AND attnum > 0 AND NOT attisdropped
GROUP BY relname ORDER BY relname;
```

**MANDATORY: Run test script before declaring any module fix complete:**
```bash
./scripts/test-all-modules.sh autocomplete "search_term"
./scripts/test-all-modules.sh all  # Full suite
```
**Do NOT say "fixed" until all modules pass.**

### 5. Filter Resilience (No Silent Data Loss)

**When adding filtering/validation logic that removes results:**

1. **Fetch MORE than needed** - If filtering will discard ~80% of results, fetch 4x-5x more
2. **Test edge cases** - Search for rare/small entities, not just common ones
3. **Verify with production data** - Filters that work on test data may fail on real data

**Example (Autocomplete):**
```python
# ❌ Bad: Only 25 results, word-boundary filter discards most
per_page = limit * 5  # 25 for limit=5

# ✅ Good: 100 results ensures filtered results still populate
per_page = limit * 20  # 100 for limit=5
```

**Rule:** Adding a filter must NEVER silently break existing functionality. If you add filtering, verify the end-to-end user experience still works.

### 6. No Feature Removal Without Approval

**NEVER remove, comment out, or disable existing features without explicit approval.**

This includes:
- Visible UI elements (buttons, links, sections)
- Placeholder features awaiting implementation
- Commented code that represents planned functionality
- Any user-facing behavior

**"Redesign" does NOT mean "rewrite from scratch":**
- Visual/structural changes: ✅ OK
- Removing existing functionality: ❌ Requires approval

**Before any removal:**
1. List what will be removed/disabled
2. Explain why
3. Wait for explicit approval

**Commit messages must list removed features:**
```
❌ Bad: "Header redesign"
✅ Good: "Header redesign (auth links temporarily removed - pending Week 6)"
```

**Rule:** If it existed before and won't exist after, get approval first.

---

## Project Context

### Founder
Solo founder. Marketing-savvy with tech background. Values speed and simplicity.

**Implications:**
- Prioritize simplicity over features
- Minimize tools/systems
- Never over-engineer
- Complete tasks properly before moving on

### Building Philosophy (MANDATORY)

**We are building for 500+ users. The guiding principle is perfection and 100% accuracy.**

- NEVER use current user count as an argument to deprioritize or simplify features
- Build every feature as if 500+ users depend on it today
- Beta is a phase, not a constraint — build production-grade from day one
- "We only have X users" is NOT a valid reason to cut corners, skip features, or suggest simpler alternatives

### Claude's Role
Senior specialist (10+ years equivalent) in all disciplines. Never ask technical questions the founder can't answer. Present options with recommendations.

### Constraints
| Constraint | Value |
|------------|-------|
| Budget | ~€190/month infrastructure |
| Export | 500 rows max, always |
| Auth | Magic Link only, no social |
| Performance | <100ms search, <1s page load |
| Railway deploy | ~2 minutes after push to main |

### Staging & Deployment Protocol (MANDATORY)

**Two environments exist. Staging may contain features that main does not.**

| Environment | Branch | URL |
|-------------|--------|-----|
| Production | `main` | beta.rijksuitgaven.nl |
| Staging | `staging` | frontend-staging-production-ce7d.up.railway.app |

#### Deployment Decision Gate (EVERY PUSH)

**Before ANY push, Claude must state:**

```
**Deploy to:** [target] — [reason]
```

Then WAIT for user approval. Never push without explicit confirmation.

#### CRITICAL: Never Overwrite Staging

**NEVER use `--force` or `main:staging` to push to staging.** Staging may contain
features being tested that are not yet on main (e.g., UX-039 Vergelijk/Pin).
Overwriting staging destroys those features.

**Always MERGE main into staging** so staging keeps its extra features and gets
main's new code too.

#### Deployment Decision Tree (MANDATORY — Read Before ANY Push)

**STOP. Answer: Does this code belong on production?**

**Railway auto-deploys on every push.** Every `git push origin main` triggers a production build. There is NO way to push to main without a build. Plan accordingly.

---

**A) BOTH ENVIRONMENTS** (bug fixes, admin features, SQL-then-code)

Use for: Admin `/team/*` features, bug fixes, approved batch releases.

```bash
git push origin main
git checkout staging && git pull origin staging && git merge main && git push origin staging && git checkout main
```

Result: 1 production build + 1 staging build. Both environments updated.

---

**B) STAGING ONLY** (new user-facing feature for testing)

**ABSOLUTE RULE: `git push origin main` must NEVER appear in this sequence.**
The feature is committed locally but NEVER pushed to origin/main.

```bash
# Feature is committed on local main. Do NOT push main.
git checkout staging && git pull origin staging
git merge main && git push origin staging
git checkout main
git revert HEAD --no-edit
# Do NOT push main. Nothing changed on origin/main. Zero production builds.
```

Result: 0 production builds + 1 staging build. Feature never exists on origin/main.

**Why the revert?** Local main must stay clean for future work. The revert removes the feature from local main. But since main was never pushed, the revert is local-only too.

---

**C) BATCH RELEASE** (approved staging features → production)

Use when user approves staging-only features for production release.

```bash
git cherry-pick <commit-hash-1> <commit-hash-2>   # Feature commits onto main
git push origin main
git checkout staging && git pull origin staging && git merge main && git push origin staging && git checkout main
```

Result: 1 production build + 1 staging build. Remove released features from Staging-Only Registry.

---

**SQL migrations** always execute BEFORE code: run on Supabase first, then push code.

#### Self-Verification Questions (MANDATORY — Before ANY Push)

Answer ALL 5 before executing any `git push`:

| # | Question | Staging-only answer | Both-environments answer |
|---|----------|-------------------|------------------------|
| 1 | Am I about to push to main? Does this code belong on production? | NO push to main | YES push to main |
| 2 | How many `git push` commands in my plan? | Exactly 1 (staging) | Exactly 2 (main + staging) |
| 3 | After execution, will `git log origin/main --oneline -1` show the feature? | NO | YES |
| 4 | Does my plan include `main:staging` or `--force`? | NO (both forbidden) | NO (both forbidden) |
| 5 | How many Railway production builds will trigger? | 0 | 1 |

**If any answer is wrong, STOP and fix the plan before executing.**

#### Staging-Only Feature Registry

**These features exist on staging but MUST NOT be on main.** Every feature here was deliberately kept off production. Committing any of this code to main is a production incident.

| Feature | Code Markers (grep patterns) | Files |
|---------|------------------------------|-------|
| UX-039 Vergelijk/Pin | `RowPinningState`, `PinOff`, `row.pin(`, `MAX_PINNED_ROWS`, `getPinnedData`, `Wis selectie` | `data-table.tsx`, `globals.css` |
| UX-042 Release Banner | `ReleaseBanner`, `rn-last-seen`, `release-notes` | `app-shell.tsx`, `release-banner.tsx`, `release-notes.ts` |

**Maintaining this registry:**
- When a feature is deployed staging-only, ADD it here with its code markers
- When a feature is approved for production (batch release), REMOVE it from this registry
- If you see code matching these markers on main, it's a bug — revert immediately

#### Pre-Push Checklist (MANDATORY)

**Before pushing to main:**

1. Check for staging-only code contamination:
```bash
# Auto-check: grep for ALL staging-only markers in the diff
git diff origin/main HEAD -- app/src/ | grep -iE "RowPinningState|PinOff|row\.pin\(|MAX_PINNED_ROWS|getPinnedData|Wis selectie|ReleaseBanner|rn-last-seen|release-notes"
```
If this returns ANY matches, **STOP**. Staging-only code is about to go to production. Revert the offending changes before pushing.

2. Verify commit content matches intent — a commit message saying "staging only" on the main branch is a contradiction. If the feature is staging-only, the main branch must have it **reverted**.

**Before pushing to staging:**

3. Check if staging has diverged from main:
```bash
git log origin/staging --not origin/main --oneline
```
If this shows commits, staging has extra features. **NEVER force-push** in this case.

#### Post-Push Verification (MANDATORY)

**After ANY push to main, verify no staging-only code leaked:**
```bash
git show origin/main:app/src/components/data-table/data-table.tsx | grep -iE "RowPinningState|PinOff|row\.pin\(|MAX_PINNED_ROWS"
git show origin/main:app/src/components/app-shell/app-shell.tsx | grep -iE "ReleaseBanner|release-banner"
```
If matches found, **immediately revert and re-push.**

**When adding new staging-only features:** Update the registry table AND the grep patterns in both pre-push and post-push checks above.

**Full process doc:** `docs/plans/2026-02-21-staging-environment.md`

---

## Documentation Sources

| Topic | Source |
|-------|--------|
| Version roadmap | `docs/VERSIONING.md` |
| V2 requirements | `02-requirements/search-requirements.md` |
| Brand identity | `02-requirements/brand-identity.md` |
| Tech stack | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
| Sprint plan | `09-timelines/v2-sprint-plan.md` |
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

### Backlog Hygiene (MANDATORY)

**When completing ANY task that relates to a backlog item:**
1. Check `02-requirements/backlog.md` for the item
2. Update its status (Priority, Status field, dates)
3. If COMPLETE: Mark as ✅ COMPLETED with date
4. If PARTIAL: Note what's done vs. remaining
5. If DEFERRED: Note the version it's deferred to (e.g., "Deferred to V2.1")

**Rule:** Backlog items must NEVER go stale. If work was done, the backlog reflects it.

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

### Sort Field Contract (CRITICAL — English↔Dutch)

**The frontend uses English column IDs. The backend uses Dutch parameter names. These MUST be mapped.**

The frontend data-table uses English column IDs (`total`, `primary`, `year-2024`). The backend API expects Dutch sort values (`totaal`, `primary`, `y2024`). A mismatch causes a **silent 400 error** — the user sees stale data with a misleading sort indicator.

**All sort mappings live in ONE place:** `SORT_FIELD_MAP` in `module-page.tsx` → `handleSortChange`.

```typescript
const SORT_FIELD_MAP: Record<string, string> = {
  'total': 'totaal',
  'primary': 'primary',
}
// Dynamic: year-2024→y2024, extra-*→passthrough
```

**When adding a new sortable column:**
1. Add column to data-table.tsx with an `id`
2. Add the `id` → backend `sort_by` value mapping to `SORT_FIELD_MAP`
3. Add the `sort_by` value to the backend's validation list (`modules.py` sort_by checks)
4. Test: click the column header and verify the sort actually changes results

**When this goes wrong:** The sort request returns 400, the frontend catches the error, but the previous data stays displayed. The column header shows a pink sort arrow (TanStack internal state) while the data is from the PREVIOUS request. The user believes the sort is active but sees wrong data.

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

### Dutch Language: Formal "u/uw" (MANDATORY)
All user-facing Dutch text MUST use the formal form:
- **"u"** not "je" (subject/object)
- **"uw"** not "jouw/je" (possessive)
- **"Beste"** not "Hoi/Hey" (greeting in emails)
- Example: "Voer uw e-mailadres in" NOT "Voer je e-mailadres in"
- Exception: `placeholder="jouw@email.nl"` is acceptable (UX convention)

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

## V2.0 Scope Summary

**Building:**
- 6 module pages + Overzicht + Integraal
- Single-view with year columns, expandable rows
- Typesense search + autocomplete
- CSV/XLS export (500 rows)
- Magic Link auth

**Not Building:**
- Social login
- Unlimited exports
- Research Mode (V3+)
- Two-view toggle

---

## Quick Reference

### Versioning
| Version | Name | Use Case |
|---------|------|----------|
| V1 | WordPress (legacy) | Original site |
| V2 | Search Platform | "Who received money?" |
| V3 | Rijksuitgaven Reporter | "What's in the news?" |
| V4 | Theme Discovery | "What's in defensie?" |
| V5 | Inzichten | "Show me trends" |
| V6 | AI Research | "Help me investigate" |
| V7+ | Workspace, Integrations, Network, European |

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
