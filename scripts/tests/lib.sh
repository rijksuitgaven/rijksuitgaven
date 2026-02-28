#!/bin/bash
# =============================================================================
# Shared test library — sourced by all test scripts
# =============================================================================

# Configuration
API_BASE="${API_BASE:-https://rijksuitgaven-api-production-3448.up.railway.app}"
BFF_BASE="${BFF_BASE:-https://beta.rijksuitgaven.nl}"
BFF_SECRET="${BFF_SECRET:-}"
MODULES=("instrumenten" "apparaat" "inkoop" "provincie" "gemeente" "publiek")
ALL_MODULES=("instrumenten" "apparaat" "inkoop" "provincie" "gemeente" "publiek" "integraal")

# Build auth header array (empty if no secret)
AUTH_HEADER=()
if [ -n "$BFF_SECRET" ]; then
    AUTH_HEADER=(-H "X-BFF-Secret: $BFF_SECRET")
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# =============================================================================
# Core helpers
# =============================================================================

print_header() {
    echo ""
    echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}── $1${NC}"
}

pass() {
    local test_name=$1
    local details=$2
    echo -e "  ${GREEN}✓${NC} $test_name"
    [ -n "$details" ] && echo -e "    ${details}"
    PASSED=$((PASSED + 1))
}

fail() {
    local test_name=$1
    local details=$2
    echo -e "  ${RED}✗${NC} $test_name"
    [ -n "$details" ] && echo -e "    ${details}"
    FAILED=$((FAILED + 1))
}

skip() {
    local test_name=$1
    local reason=$2
    echo -e "  ${YELLOW}⊘${NC} $test_name — $reason"
    SKIPPED=$((SKIPPED + 1))
}

# Fetch JSON from URL, store in $RESPONSE. Returns curl exit code.
# Automatically includes X-BFF-Secret header when BFF_SECRET is set.
fetch() {
    local url="$1"
    RESPONSE=$(curl -s --max-time 15 "${AUTH_HEADER[@]}" "$url" 2>/dev/null)
    return $?
}

# Fetch and assert success=true. Sets $RESPONSE.
fetch_ok() {
    local url="$1"
    local label="$2"
    fetch "$url" || { fail "$label" "curl failed (timeout or network error)"; return 1; }
    local success=$(echo "$RESPONSE" | jq -r '.success // false' 2>/dev/null)
    if [ "$success" != "true" ]; then
        fail "$label" "success!=true"
        return 1
    fi
    return 0
}

# Assert integer field > 0
assert_gt0() {
    local value="$1"
    local label="$2"
    if [ -z "$value" ] || [ "$value" = "null" ] || [ "$value" -le 0 ] 2>/dev/null; then
        fail "$label" "expected >0, got: $value"
        return 1
    fi
    pass "$label" "$value results"
    return 0
}

# Assert integer field >= 0 (may legitimately be 0)
assert_gte0() {
    local value="$1"
    local label="$2"
    if [ -z "$value" ] || [ "$value" = "null" ]; then
        fail "$label" "expected >=0, got: $value"
        return 1
    fi
    pass "$label"
    return 0
}

# Assert HTTP status code
assert_status() {
    local url="$1"
    local expected="$2"
    local label="$3"
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${AUTH_HEADER[@]}" "$url" 2>/dev/null)
    if [ "$status" = "$expected" ]; then
        pass "$label" "HTTP $status"
    else
        fail "$label" "expected HTTP $expected, got $status"
    fi
}

# Print summary and exit with appropriate code
print_summary() {
    local suite_name="${1:-Tests}"
    echo ""
    echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $suite_name — Summary${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}Passed:  $PASSED${NC}"
    [ "$FAILED" -gt 0 ] && echo -e "  ${RED}Failed:  $FAILED${NC}" || echo -e "  Failed:  0"
    [ "$SKIPPED" -gt 0 ] && echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
    echo ""

    if [ "$FAILED" -gt 0 ]; then
        echo -e "  ${RED}${BOLD}FAILED${NC} — fix issues before deploying"
        exit 1
    else
        echo -e "  ${GREEN}${BOLD}ALL PASSED${NC}"
        exit 0
    fi
}
