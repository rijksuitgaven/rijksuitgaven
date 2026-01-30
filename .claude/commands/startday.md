Start of day briefing. As Project Manager, prepare the session by reviewing all documentation and presenting actionable next steps.

## MANDATORY: Read First (Do Not Skip)

You MUST read these files before presenting the briefing:

1. `logs/SESSION-CONTEXT.md` - Current status, pending decisions, blockers
2. Most recent file in `logs/daily/` - Last session details
3. `04-target-architecture/RECOMMENDED-TECH-STACK.md` - Current tech decisions
4. `02-requirements/search-requirements.md` - Search feature specs

## 2. Create Today's Daily Log

**IMMEDIATELY** create the daily log file for today:

1. Create file: `logs/daily/YYYY-MM-DD.md`
2. Add header with date, project, phase, sprint
3. Start with empty sections ready to be filled:
   - Summary (to be written at end of day)
   - Work Completed (add items as you go)
   - Files Created/Modified
   - Issues Resolved
   - Next Steps

**Template:**
```markdown
# Daily Log - YYYY-MM-DD

**Project:** Rijksuitgaven.nl SaaS Migration
**Phase:** [current phase]
**Sprint:** [current sprint]
**Session Duration:** [to be filled]

---

## Summary

[To be completed at /closeday]

---

## Work Completed

[Add items throughout the day]

---

## Files Created

| File | Description |
|------|-------------|

## Files Modified

| File | Changes |
|------|---------|

---

## Issues Resolved

| Issue | Solution |
|-------|----------|

---

## Next Steps

[To be completed at /closeday]

---

**Session Status:** In Progress
```

This ensures the log exists from the start and can be updated throughout the session.

## 3. Start Development Server

Start the Next.js dev server so the user can test changes locally:

```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven/app && npm run dev
```

Run this in the background. Confirm server is running on http://localhost:3000 (or :3001 if 3000 is occupied).

## 4. Additional Reading (Based on Current Phase)

If phase involves UI/wireframes, also read:
- `03-wordpress-baseline/current-ui-overview.md`
- All images in `assets/screenshots/current-ui/`

If phase involves architecture decisions, also read:
- `04-target-architecture/architecture-impact-analysis.md`

## 5. Check for Blockers

Identify any:
- Unresolved decisions blocking progress
- Missing information needed
- Dependencies on external input

## 6. Present Session Briefing

Output a structured briefing:

```
## Good morning! Session Briefing - [DATE]

### Project Status
- **Phase:** [current phase]
- **Sprint:** [current sprint/focus]
- **Last Session:** [date and summary]

### Key Context
[2-3 bullet points of critical context for today]

### Pending Decisions (if any)
[List any decisions that need user input]

### Today's Recommended Actions
1. **[Action 1]** - [brief description]
2. **[Action 2]** - [brief description]
3. **[Action 3]** - [brief description]

### Questions for You
[Any clarifying questions before starting work]

Ready to begin?
```

## 7. Await User Direction

After presenting the briefing, wait for user to:
- Confirm the plan
- Adjust priorities
- Add new tasks
- Provide answers to questions

Do NOT start working until user confirms direction.
