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
| `docs/VERSIONING.md` | Version roadmap reflects shipped features (see Step 3) |
| `02-requirements/search-requirements.md` | Requirements marked as implemented |
| `docs/DATABASE-DOCUMENTATION.md` | Schema changes reflected |
| `scripts/sql/README.md` or headers | Migration scripts documented |
| `CLAUDE.md` | Any new rules or patterns added |

For each file:
- Verify information is current (not stale)
- Check for conflicts with other documents
- Ensure no "TBD" items that should be resolved

## Step 3: VERSIONING.md Reconciliation (MANDATORY)

**The roadmap page at `/team/roadmap` reads from `docs/VERSIONING.md`. If VERSIONING.md is stale, users see wrong data.**

### Reconciliation Process

1. **Read both sources:**
   - `logs/SESSION-CONTEXT.md` → Pending Tasks table (items marked ✅)
   - `docs/VERSIONING.md` → Version features and their status

2. **Find mismatches:** Identify items that are:
   - ✅ in SESSION-CONTEXT but missing or wrong status in VERSIONING.md
   - Implemented on staging but shown as "Planned" in VERSIONING.md
   - Live on production but shown as "On staging" in VERSIONING.md
   - Missing entirely from VERSIONING.md (new features not yet added)

3. **Present the delta to the user:**
   ```
   ## VERSIONING.md Reconciliation

   | Feature | SESSION-CONTEXT | VERSIONING.md | Action Needed |
   |---------|----------------|---------------|---------------|
   | [feature] | ✅ Live | 📋 Planned | Update to ✅ Live |
   | [feature] | ✅ Staging | Missing | Add to V2.X |
   ```

   If no mismatches: state "VERSIONING.md is in sync — no updates needed."

4. **With user approval, update:**
   - `docs/VERSIONING.md` — feature status, version assignments
   - `02-requirements/backlog.md` — mark completed items, remove shipped features
   - Run `node app/scripts/copy-roadmap-data.mjs` to regenerate `app/src/generated/roadmap-data.ts`

### Status Vocabulary (use consistently)

| Status | Emoji | Meaning |
|--------|-------|---------|
| Planned | 📋 | Designed, not started |
| In Progress | 🔨 | Actively being built |
| On Staging | 🧪 | Deployed to staging for testing |
| Live | ✅ | On production |
| Deferred | ⏳ | Moved to later version |

## Step 4: Verify Against Requirements

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

## Step 5: Identify Open Items

List any:
1. **Incomplete features** - Started but not finished
2. **Pending decisions** - Need founder input
3. **Technical debt** - Shortcuts taken that need addressing
4. **Unclear requirements** - Need clarification
5. **Blocked items** - Waiting on external factors

## Step 6: Ask Clarifying Questions

For any open items or unclear points, use the AskUserQuestion tool to get answers before finalizing documentation.

## Step 7: Update SESSION-CONTEXT.md

After all documentation is complete, update SESSION-CONTEXT.md with:
- Current sprint status
- Work completed today
- Pending decisions (if any)
- Next steps

## Step 8: Commit Documentation

Stage and commit all documentation changes with a clear message.

Include `app/src/generated/roadmap-data.ts` if it was regenerated in Step 3.
