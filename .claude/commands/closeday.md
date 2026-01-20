Create a comprehensive daily log for today and update session context. Follow this process:

## 0. Documentation Audit (REQUIRED)

**Documentation must always be up to date.** Before creating logs, verify all documentation reflects current decisions:

1. **Audit all folders** - Go through every project folder and check for:
   - Outdated information
   - Inconsistencies with today's decisions
   - Duplicate or conflicting content

2. **Change perspectives** - If unsure about something, switch roles and verify:
   - Project Manager → check scope, timeline, deliverables
   - Architect → check technical decisions, ADRs, tech stack
   - UX Designer → check wireframes, requirements, user flows
   - Developer → check specs match implementation plans

3. **Ask before updating** - Never just update something. If unclear, ask first.

4. **Single source of truth** - Ensure no duplicate or conflicting information exists.

**Rule:** Be certain before making changes. When in doubt, ask.

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

**IMPORTANT:** All project files live in ONE repository: `rijksuitgaven-saas-docs/`

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven-saas-docs
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
