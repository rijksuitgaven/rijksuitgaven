#!/bin/bash
# =============================================================================
# Smoke Test — Post-Deploy Health Verification
# =============================================================================
# Run after EVERY deploy to verify the system is alive and functional.
# Tests: health, all 7 modules return data, autocomplete works, search works.
#
# Usage:
#   ./scripts/tests/smoke.sh                    # Test production backend
#   API_BASE=http://localhost:8000 ./scripts/tests/smoke.sh  # Test local
#
# Duration: ~15 seconds
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

print_header "Smoke Test — Post-Deploy"
echo "  API: $API_BASE"
if [ -n "$BFF_SECRET" ]; then
    echo "  Auth: X-BFF-Secret configured"
else
    echo -e "  Auth: ${YELLOW}No BFF_SECRET — module endpoints will be skipped${NC}"
fi

# ─── Health Check ────────────────────────────────────────────────────────────

print_section "Health Check"

fetch "$API_BASE/health"
if [ $? -eq 0 ]; then
    status=$(echo "$RESPONSE" | jq -r '.status // "unknown"' 2>/dev/null)
    if [ "$status" = "healthy" ] || [ "$status" = "ok" ]; then
        pass "Backend health" "$status"
    else
        fail "Backend health" "status: $status"
    fi
else
    fail "Health endpoint" "Backend unreachable at $API_BASE/health"
fi

# ─── Public Search (no auth needed) ──────────────────────────────────────────

print_section "Public Search (no auth)"

fetch "$API_BASE/api/v1/public/search?q=prorail&limit=3"
if [ $? -eq 0 ]; then
    # Public search returns an array, not { success: true }
    count=$(echo "$RESPONSE" | jq 'length' 2>/dev/null)
    if [ "$count" -gt 0 ] 2>/dev/null; then
        pass "Public search 'prorail'" "$count results"
    else
        fail "Public search 'prorail'" "0 results"
    fi
else
    fail "Public search endpoint" "unreachable"
fi

# ─── Authenticated endpoints (require BFF_SECRET) ───────────────────────────

if [ -z "$BFF_SECRET" ]; then
    print_section "Module Data — SKIPPED (set BFF_SECRET to enable)"
    skip "Module endpoints" "BFF_SECRET not set"
else

# ─── Module Data (all 7 modules) ────────────────────────────────────────────

print_section "Module Data — All 7 Modules"

for module in "${ALL_MODULES[@]}"; do
    if fetch_ok "$API_BASE/api/v1/modules/${module}?limit=3" "$module: API request"; then
        row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
        assert_gt0 "$row_count" "$module: returns data"
    fi
done

# ─── Autocomplete ────────────────────────────────────────────────────────────

print_section "Autocomplete"

if fetch_ok "$API_BASE/api/v1/modules/instrumenten/autocomplete?q=gemeente&limit=3" "instrumenten: autocomplete request"; then
    count=$(echo "$RESPONSE" | jq '[.current_module, .field_matches, .other_modules] | map(length) | add' 2>/dev/null)
    assert_gt0 "$count" "instrumenten: autocomplete has results"
fi

# ─── Basic Search ────────────────────────────────────────────────────────────

print_section "Search"

if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=prorail&limit=3" "instrumenten: search request"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "instrumenten: search 'prorail' returns results"
fi

if fetch_ok "$API_BASE/api/v1/modules/integraal?q=prorail&limit=3" "integraal: search request"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "integraal: search 'prorail' returns results"
fi

fi  # end BFF_SECRET check

# ─── Summary ─────────────────────────────────────────────────────────────────

print_summary "Smoke Test"
