# Claude Code Instructions

## Project
Rijksuitgaven.nl SaaS Platform Migration - Documentation and planning repository.

## Founder Context

**Solo founder** doing everything: development, design, marketing, operations.

| Aspect | Detail |
|--------|--------|
| Background | Marketing savvy with tech background |
| Experience | Co-founder of AI company (successfully sold) |
| Working style | Visual preference, values speed |
| Decision rule | If it adds a tool/system, needs strong justification |

**Implications for Claude:**
- Prioritize simplicity over features
- Minimize number of tools/systems
- Speed to market matters
- Don't over-engineer solutions
- One-person bandwidth = realistic scope

## Working Mode

**Speed-first development:** Solo founder can decide and execute immediately. No approval delays.

| Aspect | Approach |
|--------|----------|
| Decisions | Immediate (founder decides on the spot) |
| Execution | Same-day (copy-paste commands) |
| Claude's role | Write all code, provide ready-to-execute commands |
| Founder's role | Execute commands, test features, make decisions |
| Daily commitment | 2-4 hours |
| Blockers | Resolve same session or note for next |

**Sprint Plan:** See `rijksuitgaven-saas-docs/09-timelines/v1-sprint-plan.md`

**Current Phase:** Pre-development (account setup next)

---

## Documentation Rules

**Single Source of Truth:** Every piece of information lives in ONE place. Never create duplicate documents.

| Topic | Single Source |
|-------|---------------|
| Tech stack | `04-target-architecture/RECOMMENDED-TECH-STACK.md` |
| Project scope | `01-project-overview/project-charter.md` |
| Success metrics | `01-project-overview/success-criteria.md` |
| Sprint plan | `09-timelines/v1-sprint-plan.md` |
| Session state | `logs/SESSION-CONTEXT.md` |

**If information exists in multiple places:** Delete duplicates, keep the most comprehensive version.

**Before creating a new document:** Check if the information belongs in an existing document.

---

## Project Rules (Always Apply)

### Constraints
- **Budget:** Stay under €180/month infrastructure
- **Export limit:** 500 rows always, never unlimited
- **Auth:** Magic Link (passwordless), never social login
- **Timeline:** V1.0 in 8 weeks, V2.0 in +12 weeks

### Standards
- **Language:** Dutch primary, i18n-ready from day 1
- **Performance:** <100ms search, <1s page load
- **Pricing:** €150/month or €1,500/year (ex VAT)

### V1.0 Scope (Must-Haves)

**Single-View Architecture (ADR-014):**
- All 6 module pages + Overzicht page
- Single smart view with on-the-fly aggregation (NO two-view toggle)
- Year columns always visible for trend analysis
- Expandable rows with user-selectable grouping
- Source tables only (7 tables, not 20+ pivot tables)

**Cross-Module ("Integraal"):**
- Discovery layer: Recipient → Module breakdown → Navigate to module
- Includes: instrumenten, gemeente, provincie, publiek, inkoop
- Excludes: apparaat (separate module, no recipients)

**New Features:**
- Global search bar + autocomplete (Typesense)
- Enhanced filters (year + amount range)
- CSV export (500 rows)
- Magic Link auth (Supabase) - 50 users to migrate
- Overzicht page (module totals with sub-source drill-down)

**Marketing Pages:**
- Homepage (port from WordPress)
- Support, About, Contact, Pricing, Demo booking
- Simple Next.js components, no CMS

**Technical Foundation:**
- Next.js + Supabase + Typesense stack
- Future-proof architecture for V2.0

### Not Building
- Social login (never)
- Unlimited exports (never)
- Research Mode (V2.0, not V1.0)
- Two-view toggle (eliminated by ADR-014)
- Pre-computed pivot tables (on-the-fly aggregation instead)

## Mandatory Documentation (Must Read Before Acting)

**Rule:** Before starting any task, read the relevant documentation listed below. Do not skip this step.

### Before ANY wireframe/UI work:
- `rijksuitgaven-saas-docs/03-current-state/current-ui-overview.md`
- `rijksuitgaven-saas-docs/assets/screenshots/current-ui/` (all images)

### Before ANY API work:
- `rijksuitgaven-saas-docs/06-technical-specs/api-specifications.md`
- `rijksuitgaven-saas-docs/04-target-architecture/RECOMMENDED-TECH-STACK.md`

### Before ANY architecture decisions:
- `rijksuitgaven-saas-docs/04-target-architecture/architecture-impact-analysis.md`
- `rijksuitgaven-saas-docs/02-requirements/search-requirements.md`

### At session start (/startday):
- `rijksuitgaven-saas-docs/logs/SESSION-CONTEXT.md`
- Most recent file in `rijksuitgaven-saas-docs/logs/daily/`

## Model Selection Policy

**Claude determines the appropriate model for each task.** Start with the base/lightweight model and escalate when needed.

### Model Guidelines

| Model | Cost | Use For |
|-------|------|---------|
| **Haiku** | Lowest | Simple tasks, quick operations |
| **Sonnet** | Medium | Standard development work |
| **Opus** | Highest | Complex reasoning, critical decisions |

### Haiku (Default for Simple Tasks)

**Use for:**
- Reading 1-3 files
- Quick searches (grep, glob)
- Straightforward single-file edits
- Status checks, lookups
- Running simple commands

**Examples:**
- "What's in this file?"
- "Find all TODO comments"
- "Update this import statement"
- "Run the tests"

### Sonnet (Standard Development)

**Use for:**
- Writing new components/functions
- Multi-file code changes (3-10 files)
- Debugging and fixing bugs
- Code review and refactoring
- Implementing features from clear specs
- Architecture discussions (not decisions)

**Examples:**
- "Build the DataTable component"
- "Add error handling to the API endpoints"
- "Fix the search autocomplete bug"
- "Refactor this module to use hooks"
- Most tasks during sprint execution (Week 1-8)

### Opus (Complex Reasoning)

**Use for:**
- Cross-referencing 10+ documents
- Architectural decisions (ADRs)
- Comprehensive planning (sprint plans, audits)
- Ambiguous requirements needing interpretation
- Critical decisions with trade-offs
- When Sonnet output quality is insufficient

**Examples:**
- "Audit all documentation for consistency"
- "Design the data migration strategy"
- "Decide between Option A and Option B architecture"
- "Plan the V2.0 roadmap"
- Project kickoff and major milestones

### Switching Rules

1. **Start with the lightest model** that can handle the task
2. **Escalate** if output quality is insufficient or task grows in complexity
3. **Always notify user** when switching: "Switching to Sonnet for this multi-file refactor."
4. **De-escalate** when returning to simpler tasks

### Sprint Work Model Selection

| Sprint Phase | Default Model | Escalate To |
|--------------|---------------|-------------|
| Setup/Config | Haiku | Sonnet if complex |
| Coding tasks | Sonnet | Opus if architectural |
| Bug fixes | Sonnet | - |
| Testing | Haiku | Sonnet if debugging |
| Documentation | Haiku | Sonnet if technical |
| Decisions/Planning | Opus | - |

## Documentation Structure

See `rijksuitgaven-saas-docs/README.md` for full documentation structure.

### Key Files
- `logs/SESSION-CONTEXT.md` - Current session state and pending decisions
- `02-requirements/search-requirements.md` - Search feature requirements
- `04-target-architecture/architecture-impact-analysis.md` - Tech stack validation
- `04-target-architecture/RECOMMENDED-TECH-STACK.md` - Technology decisions

## Session Continuity

### Commands
| Command | Purpose |
|---------|---------|
| `/startday` | Start of day briefing: read docs, present status, list actions |
| `/closeday` | End of day: documentation audit, create daily log, update session context |
| `/brainstorm-mode` | **Before creative work.** Ideas → designs via dialogue. One question at a time. |
| `/adr` | Create Architecture Decision Record in `08-decisions/` |
| `/wireframe` | Describe UI screens in structured text with ASCII layouts |

### /closeday Procedure

**Full procedure:** See `rijksuitgaven-saas-docs/.claude/commands/closeday.md`

**Summary:**
1. **Documentation Audit** (REQUIRED) - Verify all docs reflect current decisions
2. **Create Daily Log** - `logs/daily/YYYY-MM-DD.md`
3. **Update Session Context** - `logs/SESSION-CONTEXT.md`
4. **Commit to GitHub**
5. **Output Summary**

**Key rule:** Ask before updating. When in doubt, change perspectives (PM, Architect, UX, Developer) and verify.

### Manual Start
At the start of each session:
1. Read `logs/SESSION-CONTEXT.md` for current state
2. Review pending decisions
3. Update session context at end of work
