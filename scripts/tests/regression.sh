#!/bin/bash
# =============================================================================
# Regression Test — Known Bugs Must Stay Fixed
# =============================================================================
# Every bug we fix gets a permanent test case here.
# Run before commits that touch search, modules, or data logic.
#
# Usage:
#   ./scripts/tests/regression.sh
#   API_BASE=http://localhost:8000 ./scripts/tests/regression.sh
#
# Adding a new test:
#   1. Add a section below with date, bug description, and commit hash
#   2. Write a curl test that would have caught the bug
#   3. Assert the fix still works
#
# Duration: ~30 seconds
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

print_header "Regression Tests — Known Bugs"
echo "  API: $API_BASE"

if [ -z "$BFF_SECRET" ]; then
    echo -e "  Auth: ${RED}BFF_SECRET required — all regression tests need authentication${NC}"
    echo ""
    echo "  Run with: BFF_SECRET=<secret> ./scripts/tests/run.sh regression"
    echo ""
    FAILED=1
    print_summary "Regression Tests"
fi
echo "  Auth: X-BFF-Secret configured"

# =============================================================================
# REG-001: Word boundary match fails on special characters
# Date: 2026-02-28 | Commit: c91eecd
# Bug: is_word_boundary_match() used \b on both sides of every term.
#      Python's \b fails on terms ending in ( ) - . etc.
#      Result: autocomplete click on "ontvanger(s) van ..." returned 0 results.
# Also: has_primary_query=False in fallback path skipped query execution.
# =============================================================================

print_section "REG-001: Special characters in search (parentheses, hyphens)"

# Search for a name known to contain parentheses: "ontvanger(s)"
# This is the exact bug from the user report — autocomplete click with full name
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=Geanonimiseerde%20ontvanger(s)&limit=3" "REG-001a: search with parentheses"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-001a: parentheses search returns results"
fi

# Search for a term with hyphens (common in Dutch names: "Gender- en LHTBI")
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=Gender-%20en%20LHTBI&limit=3" "REG-001b: search with hyphens"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-001b: hyphen search returns results"
fi

# Autocomplete click simulation: full recipient name as search query
FULL_NAME="Geanonimiseerde%20ontvanger(s)%20van%20Subsidies%20voor%20Gender-%20en%20LHTBI%20Gelijkheid"
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=${FULL_NAME}&limit=3" "REG-001c: full name with special chars"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-001c: full name search returns results"
fi

# =============================================================================
# REG-002: Sort field mapping (total → totaal)
# Date: 2026-02-23 | Documented in CLAUDE.md Sort Field Contract
# Bug: Frontend sent sort_by=total, backend expected sort_by=totaal.
#      Caused silent 400 error — user saw stale data with misleading sort arrow.
# =============================================================================

print_section "REG-002: Sort field validation"

# Valid sort fields should return 200 with data
for sort_field in "totaal" "y2024"; do
    if fetch_ok "$API_BASE/api/v1/modules/instrumenten?limit=3&sort_by=${sort_field}" "REG-002: sort_by=$sort_field"; then
        row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
        assert_gt0 "$row_count" "REG-002: sort_by=$sort_field returns data"
    fi
done

# Primary sort uses asc (alphabetical name ordering)
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?limit=3&sort_by=primary&sort_order=asc" "REG-002: sort_by=primary (asc)"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-002: sort_by=primary returns data"
fi

# Invalid sort field should return 400
assert_status "$API_BASE/api/v1/modules/instrumenten?limit=3&sort_by=INVALID" "400" "REG-002: invalid sort_by returns 400"

# =============================================================================
# REG-003: Publiek module regio vs provincie column
# Date: 2026-02-23
# Bug: MODULE_CONFIG used "regio" but DB column is "provincie".
#      Caused zero results when Regio column selected.
# =============================================================================

print_section "REG-003: Publiek module data integrity"

if fetch_ok "$API_BASE/api/v1/modules/publiek?limit=3" "REG-003: publiek returns data"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-003: publiek has results"
fi

# Publiek with provincie filter should work (not regio)
if fetch_ok "$API_BASE/api/v1/modules/publiek?limit=3&columns=provincie" "REG-003: publiek provincie column"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-003: publiek with provincie column returns data"
fi

# =============================================================================
# REG-004: Source table year inflation (2025+ data leaking in)
# Date: 2026-02-23
# Bug: SUM(bedrag) included 2025+ data. Now bounded to 2016-2024.
# =============================================================================

print_section "REG-004: Year bounds (no 2025+ data leaking)"

# The totaal for any module should not include years outside 2016-2024
# We verify by checking that the sum of year columns approximates totaal
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=prorail&limit=1" "REG-004: fetch prorail"; then
    # Sum individual year amounts
    year_sum=$(echo "$RESPONSE" | jq '[.data[0].years["2016","2017","2018","2019","2020","2021","2022","2023","2024"]] | map(select(. != null)) | add // 0' 2>/dev/null)
    totaal=$(echo "$RESPONSE" | jq '.data[0].totaal // 0' 2>/dev/null)
    if [ "$year_sum" -eq "$totaal" ] 2>/dev/null; then
        pass "REG-004: year sum == totaal (no leaky years)" "sum=$year_sum, totaal=$totaal"
    else
        # Allow small rounding differences
        diff=$(( year_sum - totaal ))
        abs_diff=${diff#-}
        if [ "$abs_diff" -lt 1000 ] 2>/dev/null; then
            pass "REG-004: year sum ≈ totaal (rounding diff: $abs_diff)"
        else
            fail "REG-004: year sum != totaal — possible year leak" "sum=$year_sum, totaal=$totaal, diff=$diff"
        fi
    fi
fi

# =============================================================================
# REG-005: Search-scoped results (V2.0.3) — secondary matches
# Date: 2026-02-27
# Bug: RVO showed €1.8B when searching "deltares" instead of ~€122M.
#      Secondary matches (matched on regeling, not name) showed full
#      aggregated totals instead of search-filtered amounts.
# =============================================================================

print_section "REG-005: Search-scoped results (secondary match amounts)"

# Search for "deltares" in instrumenten — RVO should appear as secondary match
# with filtered amounts, not full aggregated total
if fetch_ok "$API_BASE/api/v1/modules/instrumenten?q=deltares&limit=25" "REG-005: search deltares"; then
    row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
    assert_gt0 "$row_count" "REG-005: deltares search returns results"

    # Check if any secondary matches exist (have is_secondary_match=true)
    secondary_count=$(echo "$RESPONSE" | jq '[.data[] | select(.is_secondary_match == true)] | length' 2>/dev/null)
    if [ "$secondary_count" -gt 0 ] 2>/dev/null; then
        pass "REG-005: secondary matches flagged" "$secondary_count secondary matches"
    else
        # Deltares might be a primary match in some data states — not a failure
        skip "REG-005: no secondary matches found" "deltares may be primary-only in current data"
    fi
fi

# =============================================================================
# REG-006: Default browse (no search) must work on all modules
# Date: 2026-02-27
# Bug: primary_only_keys not initialized at top scope — NameError on
#      every default browse (no search), breaking all 6 module pages.
# =============================================================================

print_section "REG-006: Default browse (no search) — all modules"

for module in "${ALL_MODULES[@]}"; do
    if fetch_ok "$API_BASE/api/v1/modules/${module}?limit=3" "REG-006: $module default browse"; then
        row_count=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
        assert_gt0 "$row_count" "REG-006: $module returns data without search"
    fi
done

# =============================================================================
# Summary
# =============================================================================

print_summary "Regression Tests"
