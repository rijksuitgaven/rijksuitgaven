#!/bin/bash
# =============================================================================
# Cross-Module Test Script
# =============================================================================
# Run this BEFORE declaring any module-related fix complete.
# Tests key endpoints across all 6 modules to catch inconsistencies.
#
# Usage:
#   ./scripts/test-all-modules.sh              # Test all endpoints
#   ./scripts/test-all-modules.sh autocomplete # Test only autocomplete
#   ./scripts/test-all-modules.sh autocomplete "search term"
# =============================================================================

# Don't use set -e as it interferes with test logic
# set -e

# Configuration
API_BASE="${API_BASE:-https://rijksuitgaven-api-production-3448.up.railway.app}"
MODULES=("instrumenten" "apparaat" "inkoop" "provincie" "gemeente" "publiek")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo "=============================================="
    echo "$1"
    echo "=============================================="
}

test_result() {
    local module=$1
    local test_name=$2
    local success=$3
    local details=$4

    if [ "$success" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} $module: $test_name"
        [ -n "$details" ] && echo "    $details"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}✗${NC} $module: $test_name"
        [ -n "$details" ] && echo "    $details"
        FAILED=$((FAILED + 1))
    fi
}

# =============================================================================
# Test: Autocomplete
# =============================================================================

test_autocomplete() {
    local search_term="${1:-gemeente}"

    print_header "Testing Autocomplete (search: '$search_term')"

    for module in "${MODULES[@]}"; do
        # Skip apparaat for recipient searches (uses kostensoort)
        if [ "$module" = "apparaat" ] && [ "$search_term" = "gemeente" ]; then
            echo -e "  ${YELLOW}⊘${NC} $module: Skipped (uses kostensoort, not ontvanger)"
            continue
        fi

        response=$(curl -s "${API_BASE}/api/v1/modules/${module}/autocomplete?q=${search_term}")

        # Check if request succeeded
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" != "true" ]; then
            test_result "$module" "API request" "false" "Request failed"
            continue
        fi

        # Count results in each section
        current_count=$(echo "$response" | jq '.current_module | length')
        field_count=$(echo "$response" | jq '.field_matches | length')
        other_count=$(echo "$response" | jq '.other_modules | length')

        # Check if current_module has results when expected
        # (For most searches, at least one section should have results)
        total=$((current_count + field_count + other_count))

        if [ "$total" -gt 0 ]; then
            test_result "$module" "Has results" "true" "current=$current_count, fields=$field_count, other=$other_count"
        else
            test_result "$module" "Has results" "false" "No results in any section"
        fi
    done
}

# =============================================================================
# Test: Module Data Endpoint
# =============================================================================

test_module_data() {
    print_header "Testing Module Data Endpoints"

    for module in "${MODULES[@]}"; do
        response=$(curl -s "${API_BASE}/api/v1/modules/${module}?limit=5")

        # Check if request succeeded
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" != "true" ]; then
            test_result "$module" "API request" "false" "Request failed"
            continue
        fi

        # Check data returned
        row_count=$(echo "$response" | jq '.data | length')

        if [ "$row_count" -gt 0 ]; then
            test_result "$module" "Returns data" "true" "$row_count rows"
        else
            test_result "$module" "Returns data" "false" "No data returned"
        fi
    done
}

# =============================================================================
# Test: Search Functionality
# =============================================================================

test_search() {
    local search_term="${1:-prorail}"

    print_header "Testing Search (term: '$search_term')"

    for module in "${MODULES[@]}"; do
        response=$(curl -s "${API_BASE}/api/v1/modules/${module}?q=${search_term}&limit=5")

        # Check if request succeeded
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" != "true" ]; then
            test_result "$module" "Search request" "false" "Request failed"
            continue
        fi

        row_count=$(echo "$response" | jq '.data | length')
        test_result "$module" "Search returns data" "true" "$row_count results"
    done
}

# =============================================================================
# Main
# =============================================================================

echo "Cross-Module Test Script"
echo "API: $API_BASE"

case "${1:-all}" in
    autocomplete)
        test_autocomplete "${2:-gemeente}"
        ;;
    data)
        test_module_data
        ;;
    search)
        test_search "${2:-prorail}"
        ;;
    all)
        test_autocomplete "gemeente"
        test_module_data
        test_search "prorail"
        ;;
    *)
        echo "Usage: $0 [autocomplete|data|search|all] [search_term]"
        exit 1
        ;;
esac

# =============================================================================
# Summary
# =============================================================================

print_header "Summary"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}CROSS-MODULE TEST FAILED${NC}"
    echo "Fix issues before declaring complete!"
    exit 1
else
    echo -e "${GREEN}ALL MODULES PASSED${NC}"
    exit 0
fi
