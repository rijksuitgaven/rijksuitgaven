#!/bin/bash
# =============================================================================
# Test Runner — Single entry point for all test suites
# =============================================================================
#
# Usage:
#   ./scripts/tests/run.sh smoke              # Post-deploy health check (~15s)
#   ./scripts/tests/run.sh regression         # Known-bug regression tests (~30s)
#   ./scripts/tests/run.sh all                # Run everything (~45s)
#
# Environment:
#   API_BASE=http://localhost:8000 ./scripts/tests/run.sh smoke   # Test local backend
#   API_BASE=https://your-staging-url ./scripts/tests/run.sh all  # Test staging
#
# Default: production backend (https://rijksuitgaven-api-production-3448.up.railway.app)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-help}" in
    smoke)
        bash "$SCRIPT_DIR/smoke.sh"
        ;;
    regression)
        bash "$SCRIPT_DIR/regression.sh"
        ;;
    all)
        echo "Running all test suites..."
        echo ""
        bash "$SCRIPT_DIR/smoke.sh"
        SMOKE_EXIT=$?
        bash "$SCRIPT_DIR/regression.sh"
        REGRESSION_EXIT=$?

        echo ""
        echo "══════════════════════════════════════════════════"
        echo "  Final Results"
        echo "══════════════════════════════════════════════════"
        if [ "$SMOKE_EXIT" -eq 0 ] && [ "$REGRESSION_EXIT" -eq 0 ]; then
            echo -e "  \033[0;32m\033[1mALL SUITES PASSED\033[0m"
            exit 0
        else
            [ "$SMOKE_EXIT" -ne 0 ] && echo -e "  \033[0;31mSmoke:      FAILED\033[0m"
            [ "$SMOKE_EXIT" -eq 0 ] && echo -e "  \033[0;32mSmoke:      PASSED\033[0m"
            [ "$REGRESSION_EXIT" -ne 0 ] && echo -e "  \033[0;31mRegression: FAILED\033[0m"
            [ "$REGRESSION_EXIT" -eq 0 ] && echo -e "  \033[0;32mRegression: PASSED\033[0m"
            exit 1
        fi
        ;;
    *)
        echo "Test Runner — Rijksuitgaven"
        echo ""
        echo "Usage: $0 [suite]"
        echo ""
        echo "Suites:"
        echo "  smoke       Post-deploy health check (~15s)"
        echo "  regression  Known-bug regression tests (~30s)"
        echo "  all         Run all suites (~45s)"
        echo ""
        echo "Environment variables:"
        echo "  API_BASE    Backend URL (default: production)"
        echo ""
        echo "Examples:"
        echo "  $0 smoke"
        echo "  $0 all"
        echo "  API_BASE=http://localhost:8000 $0 smoke"
        exit 0
        ;;
esac
