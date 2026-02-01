#!/bin/bash
# BSIF Conformance Test Runner
# Version: 1.0.0-draft
# This script runs conformance tests for BSIF implementations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POSITIVE_DIR="${SCRIPT_DIR}/positive"
NEGATIVE_DIR="${SCRIPT_DIR}/negative"
SCHEMA_FILE="${SCRIPT_DIR}/../../docs/schemas/bsif.json"
VALIDATOR_CMD=""  # Set via environment or command line

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Error codes
E_SUCCESS=0
E_MISSING_VALIDATOR=1
E_VALIDATION_FAILED=2
E_TEST_FILE_NOT_FOUND=3

usage() {
    cat <<EOF
BSIF Conformance Test Runner

Usage: $0 [OPTIONS] --validator COMMAND

Options:
    --validator CMD    Validator command (required)
    --help            Show this help message

Environment Variables:
    BSIF_VALIDATOR    Validator command (alternative to --validator)

Examples:
    $0 --validator "ajv validate --spec=../docs/schemas/bsif.json --data="
    BSIF_VALIDATOR="python validate.py" $0

Required Arguments:
    --validator CMD   Command that validates a BSIF document.
                      The document content is passed via stdin.
                      Returns 0 for valid, non-zero for invalid.

Exit Codes:
    0    All tests passed
    1    Missing validator command
    2    Validation failed
    3    Test file not found

EOF
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Run a single positive test
run_positive_test() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .json)

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [[ ! -f "$test_file" ]]; then
        log_error "Test file not found: $test_file"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return $E_TEST_FILE_NOT_FOUND
    fi

    log_info "Running positive test: $test_name"

    # Run validator
    if echo "cat '$test_file' | $VALIDATOR_CMD" | bash > /dev/null 2>&1; then
        log_info "  ✓ PASSED: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return $E_SUCCESS
    else
        log_error "  ✗ FAILED: $test_name (expected valid, but validator rejected)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return $E_VALIDATION_FAILED
    fi
}

# Run a single negative test
run_negative_test() {
    local test_file="$1"
    local test_name=$(basename "$test_file" .json)

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [[ ! -f "$test_file" ]]; then
        log_error "Test file not found: $test_file"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return $E_TEST_FILE_NOT_FOUND
    fi

    log_info "Running negative test: $test_name"

    # Run validator - should FAIL for invalid specs
    if ! echo "cat '$test_file' | $VALIDATOR_CMD" | bash > /dev/null 2>&1; then
        log_info "  ✓ PASSED: $test_name (correctly rejected)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return $E_SUCCESS
    else
        log_error "  ✗ FAILED: $test_name (expected invalid, but validator accepted)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return $E_VALIDATION_FAILED
    fi
}

# Main test execution
main() {
    local validator_cmd=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --validator)
                validator_cmd="$2"
                shift 2
                ;;
            --help|-h)
                usage
                exit $E_SUCCESS
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit $E_MISSING_VALIDATOR
                ;;
        esac
    done

    # Use environment variable if command not provided
    if [[ -z "$validator_cmd" ]]; then
        validator_cmd="$BSIF_VALIDATOR"
    fi

    if [[ -z "$validator_cmd" ]]; then
        log_error "Validator command not specified"
        log_error "Use --validator CMD or set BSIF_VALIDATOR environment variable"
        usage
        exit $E_MISSING_VALIDATOR
    fi

    VALIDATOR_CMD="$validator_cmd"

    echo "=========================================="
    echo "BSIF Conformance Test Suite"
    echo "=========================================="
    echo "Validator: $VALIDATOR_CMD"
    echo ""

    # Check if schema exists
    if [[ ! -f "$SCHEMA_FILE" ]]; then
        log_warning "Schema file not found: $SCHEMA_FILE"
    fi

    # Run positive tests
    log_info "Running positive tests (should PASS validation)..."
    echo ""

    for test_file in "$POSITIVE_DIR"/*.json; do
        if [[ -f "$test_file" ]]; then
            run_positive_test "$test_file"
        fi
    done

    echo ""
    log_info "Running negative tests (should FAIL validation)..."
    echo ""

    for test_file in "$NEGATIVE_DIR"/*.json; do
        if [[ -f "$test_file" ]]; then
            run_negative_test "$test_file"
        fi
    done

    # Print summary
    echo ""
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo "Total tests:  $TOTAL_TESTS"
    echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
    echo ""

    if [[ $FAILED_TESTS -eq 0 ]]; then
        log_info "All tests passed!"
        exit $E_SUCCESS
    else
        log_error "Some tests failed!"
        exit $E_VALIDATION_FAILED
    fi
}

main "$@"
