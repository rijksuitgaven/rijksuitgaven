Create a comprehensive daily log for today and update session context. Follow this process:

## 0. Documentation Audit (MANDATORY - NO EXCEPTIONS)

**WE DO NOT CLOSE THE DAY WITHOUT A COMPLETE AUDIT.**

**Documentation must always be up to date.** Before creating logs, verify ALL documentation reflects current decisions.

### Audit Process

1. **Read and verify every relevant file:**
   - `logs/SESSION-CONTEXT.md` - Is status current?
   - `CLAUDE.md` - Do rules reflect current practices?
   - All files created/modified today - Are they complete?
   - Sprint plan - Does progress match reality?
   - Any config files - Are credentials/settings documented?

2. **Check all folders for outdated information:**
   - `01-project-overview/`
   - `02-requirements/`
   - `03-wordpress-baseline/`
   - `04-target-architecture/`
   - `05-v1-design/`
   - `06-technical-specs/`
   - `07-migration-strategy/`
   - `08-decisions/`
   - `09-timelines/`
   - `config/`
   - `scripts/`

3. **Change perspectives** - Switch roles and verify:
   - **Project Manager** → scope, timeline, deliverables, sprint progress
   - **Architect** → technical decisions, ADRs, tech stack consistency
   - **UX Designer** → wireframes, requirements, user flows
   - **Developer** → specs match implementation, code is documented

4. **Single source of truth** - Ensure no duplicate or conflicting information.

### MANDATORY: Ask Questions Until Resolved

**If you have ANY doubt or uncertainty:**
- You MUST ask the user before proceeding
- Do NOT make assumptions
- Do NOT close the day with unresolved questions
- Keep asking until everything is clear

**Examples of things to ask about:**
- "I see X in file A but Y in file B - which is correct?"
- "Today we did X but it's not reflected in the sprint plan - should I update it?"
- "The config file mentions Z but I don't see it documented - is this intentional?"
- "I'm unsure if feature X was completed or just started - can you confirm?"

### Audit Checklist (Must Complete)

**Consistency Checks:**
- [ ] No "said A, did B" - decisions match implementation
- [ ] No conflicting information across files
- [ ] Sprint progress matches reality (check every deliverable)

**Documentation Completeness:**
- [ ] ALL code is documented (headers, comments, README)
- [ ] ALL UI/UX is clear and documented (wireframes, decisions)
- [ ] All config/credentials are documented (not secrets, just that they exist)
- [ ] All new files created today are documented

**Session State:**
- [ ] SESSION-CONTEXT.md reflects today's work accurately
- [ ] Daily log captures everything done today
- [ ] Pending decisions are listed for next session

**Versiegeschiedenis:**
- [ ] If user-visible features shipped today → CHANGELOG.md updated (show user for approval)
- [ ] If CHANGELOG.md changed → versiegeschiedenis page updated to match

**Understanding Check:**
- [ ] I understand everything - if ANY doubt, I MUST ask before closing
- [ ] All my questions have been answered by the user

**Rule:** The day is NOT closed until all boxes are checked and all questions resolved.

### Sprint Boundary Check (every 2 weeks / end of sprint)

If today is the last day of a sprint, run these additional cross-file checks:

**Tech consistency (30 seconds each):**
- Grep `04-target-architecture/` for stale tech refs (MySQL, NextAuth, SQLAlchemy, Tremor, Redis as "deployed")
- Grep all docs for hardcoded credentials or API keys
- Grep all script docs for wrong psql path

**Numbers alignment:**
- Typesense doc counts match across `config/typesense-railway.md`, `scripts/typesense/README.md`, `SESSION-CONTEXT.md`
- Materialized view list consistent in `DATA-UPDATE-RUNBOOK.md` and `DATABASE-DOCUMENTATION.md`

**Feature coverage:**
- Every new page/route from this sprint appears in `docs/FRONTEND-DOCUMENTATION.md`
- Every new table/migration appears in `scripts/sql/DATABASE-DOCUMENTATION.md`
- Every new UX feature has a status in `02-requirements/search-requirements.md`
- `02-requirements/backlog.md` reflects completed items

**Versiegeschiedenis / Changelog (end-user facing):**
- If any user-visible features shipped today, check if `CHANGELOG.md` needs a new entry or update
- If CHANGELOG.md was updated, also update `app/src/app/versiegeschiedenis/page.tsx` to match
- Show the user the proposed changelog entry for approval BEFORE committing
- Only published/live features go in the changelog — never unreleased or staging-only work

**Architecture stubs:**
- No empty files in `04-target-architecture/`, `09-timelines/`, `01-project-overview/`

---

## 1. Create Daily Log (`logs/daily/YYYY-MM-DD.md`)

Include:
- Summary of day's work
- All tasks completed with checkmarks
- Files created/modified with links
- Key decisions made (reference ADRs if applicable)
- Problems encountered and solutions
- Discussions and clarifications with user
- Metrics (files created, lines written, etc.)
- Current blockers (if any)
- Next steps (priority order)
- Notes for next session
- Commits made today

---

## 2. Update Session Context (`logs/SESSION-CONTEXT.md`)

Update:
- "Last Updated" date
- "Current Status" section
- "Active Tasks" table
- "Recent Work" (keep only last 3 files)
- "Key Decisions Made" (add any new decisions)
- "Pending Decisions" (remove resolved, add new)
- "Blockers" section
- "Next Steps" with priority order
- "Last Session" note at bottom

---

## 3. Commit EVERYTHING to GitHub

**IMPORTANT:** All project files live in ONE repository: `rijksuitgaven/`

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven
git add -A
git status  # Verify what will be committed
git commit -m "Daily log YYYY-MM-DD: [brief summary]"
git push
```

**Checklist before committing:**
- [ ] CLAUDE.md changes included
- [ ] All new/modified docs included
- [ ] Daily log included
- [ ] SESSION-CONTEXT.md included
- [ ] No files left uncommitted

**Never leave uncommitted changes.** Everything goes to the repo.

---

## 4. Output Summary

Display a concise summary showing:
- Date of log created
- Documentation audit results (files checked, issues found/fixed)
- Number of tasks completed today
- Number of files created/modified
- Key decisions made
- Current blockers (if any)
- Top 3 next steps
- Commit hash and link to GitHub

---

Use the daily log template format from `logs/daily/2026-01-14.md` as reference for structure and detail level.
