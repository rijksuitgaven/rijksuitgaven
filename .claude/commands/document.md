# Document Session Work

Comprehensive documentation task to ensure all work is properly recorded and verified.

## Step 1: Document All Work Completed

Review the current session and document everything in the daily log (`logs/daily/YYYY-MM-DD.md`):

1. **Read the current daily log** to see what's already documented
2. **Add any missing work items** including:
   - Features implemented
   - Bug fixes
   - Performance optimizations
   - Configuration changes
   - SQL migrations created/executed
3. **Update Files Created/Modified tables** with all affected files
4. **Update Issues Resolved table** with problems fixed

## Step 2: Audit All Documentation

Check these files for accuracy and completeness:

| File | Check For |
|------|-----------|
| `logs/SESSION-CONTEXT.md` | Current phase, sprint, pending decisions, blockers |
| `logs/daily/YYYY-MM-DD.md` | Today's work fully documented |
| `02-requirements/search-requirements.md` | Requirements marked as implemented |
| `docs/DATABASE-DOCUMENTATION.md` | Schema changes reflected |
| `scripts/sql/README.md` or headers | Migration scripts documented |
| `CLAUDE.md` | Any new rules or patterns added |

For each file:
- Verify information is current (not stale)
- Check for conflicts with other documents
- Ensure no "TBD" items that should be resolved

## Step 3: Verify Against Requirements

### V1.0 Requirements Check
Read `02-requirements/search-requirements.md` and verify:
- [ ] Which requirements were addressed today
- [ ] Mark implemented items with dates
- [ ] Note any partial implementations

### V2.0 Roadmap Check
Read `02-requirements/research-mode-vision.md` and verify:
- [ ] Today's work doesn't block V2.0 features
- [ ] Architecture decisions are V3-compatible

### Sprint Plan Check
Read `09-timelines/v2-sprint-plan.md` and verify:
- [ ] Current sprint status
- [ ] Which deliverables are complete
- [ ] What remains for current week

## Step 4: Identify Open Items

List any:
1. **Incomplete features** - Started but not finished
2. **Pending decisions** - Need founder input
3. **Technical debt** - Shortcuts taken that need addressing
4. **Unclear requirements** - Need clarification
5. **Blocked items** - Waiting on external factors

## Step 5: Ask Clarifying Questions

For any open items or unclear points, use the AskUserQuestion tool to get answers before finalizing documentation.

## Step 6: Update SESSION-CONTEXT.md

After all documentation is complete, update SESSION-CONTEXT.md with:
- Current sprint status
- Work completed today
- Pending decisions (if any)
- Next steps

## Step 7: Commit Documentation

Stage and commit all documentation changes with a clear message.
