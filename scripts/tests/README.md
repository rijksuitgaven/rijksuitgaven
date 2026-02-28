# Test Strategy — Rijksuitgaven

**Created:** 2026-02-28
**Approach:** API integration tests (curl-based, no mocking, tests real system)

---

## Philosophy

**"Every bug fixed is a test written. Every deploy is a smoke test run."**

We use curl-based API tests instead of unit tests or E2E tests because:
- Zero mocking infrastructure — tests the real system
- Low maintenance — no test framework dependencies to break
- Fast — full suite runs in <60 seconds
- Solo-founder friendly — one command, clear pass/fail

---

## Test Suites

| Suite | File | Duration | When to Run |
|-------|------|----------|-------------|
| **Smoke** | `smoke.sh` | ~15s | After EVERY deploy (both environments) |
| **Regression** | `regression.sh` | ~30s | Before commits touching search/modules/data |

### Running Tests

```bash
# Smoke test (health + public search — works without auth)
./scripts/tests/run.sh smoke

# Full smoke test (with module endpoints — requires auth)
BFF_SECRET=<secret> ./scripts/tests/run.sh smoke

# Regression tests (requires auth)
BFF_SECRET=<secret> ./scripts/tests/run.sh regression

# All suites
BFF_SECRET=<secret> ./scripts/tests/run.sh all

# Against local backend
BFF_SECRET=<secret> API_BASE=http://localhost:8000 ./scripts/tests/run.sh smoke

# Against staging
BFF_SECRET=<secret> API_BASE=https://frontend-staging-production-ce7d.up.railway.app ./scripts/tests/run.sh smoke
```

### Authentication

Most endpoints require `X-BFF-Secret` header. Set the `BFF_SECRET` env var:

- **Without `BFF_SECRET`:** Smoke tests run health + public search only; regression tests skip entirely
- **With `BFF_SECRET`:** Full test coverage including module endpoints, autocomplete, and search

---

## When to Run What

### Decision Tree

```
Changed backend/app/services/modules.py?
  └─ Run: regression + smoke

Changed any backend code?
  └─ Run: regression

Changed frontend search/filter/module components?
  └─ Run: smoke (after staging deploy)

Pushed to main or staging?
  └─ Run: smoke (MANDATORY after every deploy)

End of day (/closeday)?
  └─ Run: smoke (verify session didn't break anything)

After data update (D-track)?
  └─ Run: regression (data integrity checks)
```

### Quick Reference

| Scenario | Command |
|----------|---------|
| Just deployed | `./scripts/tests/run.sh smoke` |
| Fixed a search/module bug | `./scripts/tests/run.sh all` |
| End of session | `./scripts/tests/run.sh smoke` |
| Weekly full check | `./scripts/tests/run.sh all` |

---

## Adding Regression Tests

When fixing a bug, add a test case to `regression.sh`:

```bash
# =============================================================================
# REG-NNN: Brief description
# Date: YYYY-MM-DD | Commit: hash
# Bug: What went wrong and why
# =============================================================================

print_section "REG-NNN: Description"

if fetch_ok "$API_BASE/api/v1/modules/...?..." "REG-NNN: label"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-NNN: assertion description"
fi
```

**Rules:**
- Every test has a REG-NNN number and a date
- Include the commit hash that fixed the bug
- Comment explains the bug so future readers understand WHY the test exists
- Assert structural correctness (>0 results), not specific data values
- Use the shared helpers from `lib.sh`

---

## Current Regression Registry

| ID | Date | Bug | Commit |
|----|------|-----|--------|
| REG-001 | 2026-02-28 | Word boundary fails on `(`, `)`, `-` in search | `c91eecd` |
| REG-002 | 2026-02-23 | Sort field mapping total→totaal | See CLAUDE.md |
| REG-003 | 2026-02-23 | Publiek regio vs provincie column | See CLAUDE.md |
| REG-004 | 2026-02-23 | Source table year inflation (2025+ data) | See CLAUDE.md |
| REG-005 | 2026-02-27 | Search-scoped results (secondary match amounts) | `702b886` |
| REG-006 | 2026-02-27 | Default browse NameError (primary_only_keys) | `79c264a` |

---

## File Structure

```
scripts/tests/
├── README.md         # This file — strategy and documentation
├── lib.sh            # Shared helpers (colors, assertions, fetch)
├── smoke.sh          # Post-deploy health verification
├── regression.sh     # Known-bug regression library
└── run.sh            # Entry point: ./run.sh [smoke|regression|all]
```

---

## Future Expansion

When needed, add:
- `modules.sh` — Full module validation (all endpoints, all filters, pagination)
- `search.sh` — Deep search testing (multi-word, phrases, edge cases)

Do NOT add:
- Unit tests (mocking overhead not justified for solo founder)
- E2E/Playwright tests (fragile, high maintenance)
- CI/CD pipeline (deploy-triggered tests via Claude are sufficient)
