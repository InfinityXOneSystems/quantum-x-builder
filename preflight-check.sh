#!/usr/bin/env bash
#
# Phase 6 Pre-Flight Validation Script
# Automated validation of system readiness for Phase 6 deployment
#
# Usage: ./preflight-check.sh [--verbose] [--json] [--fail-fast]
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${PROJECT_ROOT}/_OPS/OUTPUT/preflight-${TIMESTAMP}.json"
VERBOSE=false
JSON_OUTPUT=false
FAIL_FAST=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Results array
declare -a RESULTS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --fail-fast)
      FAIL_FAST=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Helper functions
log_info() {
  if [[ "$VERBOSE" == "true" ]] || [[ "$JSON_OUTPUT" == "false" ]]; then
    echo -e "${BLUE}[INFO]${NC} $1"
  fi
}

log_success() {
  if [[ "$JSON_OUTPUT" == "false" ]]; then
    echo -e "${GREEN}[PASS]${NC} $1"
  fi
}

log_warning() {
  if [[ "$JSON_OUTPUT" == "false" ]]; then
    echo -e "${YELLOW}[WARN]${NC} $1"
  fi
}

log_error() {
  if [[ "$JSON_OUTPUT" == "false" ]]; then
    echo -e "${RED}[FAIL]${NC} $1"
  fi
}

# Check function
check() {
  local category="$1"
  local name="$2"
  local command="$3"
  local critical="${4:-false}"
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  log_info "Checking: $name"
  
  local result="PASS"
  local message=""
  local details=""
  
  if eval "$command" > /dev/null 2>&1; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log_success "$name"
  else
    if [[ "$critical" == "true" ]]; then
      result="FAIL"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      log_error "$name"
      message="CRITICAL: Check failed"
      
      if [[ "$FAIL_FAST" == "true" ]]; then
        echo "FAIL_FAST enabled. Exiting..."
        exit 1
      fi
    else
      result="WARN"
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
      log_warning "$name"
      message="Warning: Check failed (non-critical)"
    fi
  fi
  
  # Store result
  RESULTS+=("{\"category\":\"$category\",\"name\":\"$name\",\"result\":\"$result\",\"message\":\"$message\",\"critical\":$critical}")
}

# Banner
if [[ "$JSON_OUTPUT" == "false" ]]; then
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║     Phase 6 Pre-Flight Validation Script                 ║"
  echo "║     Quantum-X-Builder System Readiness Check              ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
fi

# ============================================================================
# 1. PHASE 5 VERIFICATION
# ============================================================================
log_info "=== Phase 5 Verification ==="

check "phase5" "Phase 5 status file exists" \
  "test -f ${PROJECT_ROOT}/_OPS/_STATE/STATUS_PHASE5_ACTIVE.json" true

check "phase5" "Phase 5 autonomy is ON" \
  "grep -q '\"autonomy\": \"ON\"' ${PROJECT_ROOT}/_OPS/_STATE/STATUS_PHASE5_ACTIVE.json" true

check "phase5" "Kill switch is ACTIVE" \
  "grep -q '\"kill_switch\": \"ACTIVE\"' ${PROJECT_ROOT}/_OPS/_STATE/STATUS_PHASE5_ACTIVE.json" true

check "phase5" "Guardrails are ACTIVE" \
  "grep -q '\"guardrails\": \"ACTIVE\"' ${PROJECT_ROOT}/_OPS/_STATE/STATUS_PHASE5_ACTIVE.json" true

check "phase5" "Rollback path exists" \
  "test -d ${PROJECT_ROOT}/_OPS/_STATE/ROLLBACK_20260206_141932" false

# ============================================================================
# 2. DOCUMENTATION CHECKS
# ============================================================================
log_info "=== Documentation Checks ==="

check "docs" "Phase 6 forensic analysis exists" \
  "test -f ${PROJECT_ROOT}/PHASE6_FORENSIC_ANALYSIS.md" true

check "docs" "Phase 6 pre-flight checklist exists" \
  "test -f ${PROJECT_ROOT}/PHASE6_PREFLIGHT_CHECKLIST.md" true

check "docs" "Docker deployment guide exists" \
  "test -f ${PROJECT_ROOT}/DOCKER_DEPLOYMENT_GUIDE.md" true

check "docs" "GitHub MCP integration guide exists" \
  "test -f ${PROJECT_ROOT}/GITHUB_MCP_INTEGRATION_GUIDE.md" true

check "docs" "AI service integration guide exists" \
  "test -f ${PROJECT_ROOT}/docs/QXB_AI_SERVICE_INTEGRATION.md" false

check "docs" "System integration architecture exists" \
  "test -f ${PROJECT_ROOT}/docs/SYSTEM_INTEGRATION_ARCHITECTURE.md" false

# ============================================================================
# 3. DOCKER INFRASTRUCTURE
# ============================================================================
log_info "=== Docker Infrastructure ==="

check "docker" "Docker is installed" \
  "command -v docker" true

check "docker" "Docker daemon is running" \
  "docker info" true

check "docker" "Docker Compose is installed" \
  "docker compose version" true

check "docker" "docker-compose.yml exists" \
  "test -f ${PROJECT_ROOT}/docker-compose.yml" true

check "docker" "Backend Dockerfile exists" \
  "test -f ${PROJECT_ROOT}/backend/Dockerfile" true

check "docker" "Frontend Dockerfile exists" \
  "test -f ${PROJECT_ROOT}/frontend/Dockerfile" true

check "docker" "Docker network is configured" \
  "grep -q 'vizualx' ${PROJECT_ROOT}/docker-compose.yml" false

# Service Dockerfiles (templates)
check "docker" "QXB Chat Gateway Dockerfile template exists" \
  "test -f ${PROJECT_ROOT}/services/qxb-chat-gateway/Dockerfile.template" false

# ============================================================================
# 4. SERVICE IMPLEMENTATIONS
# ============================================================================
log_info "=== Service Implementations ==="

check "services" "Backend source exists" \
  "test -d ${PROJECT_ROOT}/backend/src" true

check "services" "Backend index.js exists" \
  "test -f ${PROJECT_ROOT}/backend/src/index.js" true

check "services" "Backend providers exist" \
  "test -d ${PROJECT_ROOT}/backend/src/providers" true

check "services" "Ollama provider exists" \
  "test -f ${PROJECT_ROOT}/backend/src/providers/ollama.js" true

check "services" "Groq provider exists" \
  "test -f ${PROJECT_ROOT}/backend/src/providers/groq.js" true

check "services" "Vertex provider exists" \
  "test -f ${PROJECT_ROOT}/backend/src/providers/vertex.js" true

check "services" "Gemini provider exists" \
  "test -f ${PROJECT_ROOT}/backend/src/providers/gemini.js" true

check "services" "AI integration routes exist" \
  "test -f ${PROJECT_ROOT}/backend/src/routes/ai-integration.js" true

check "services" "Chat gateway implementation exists" \
  "test -f ${PROJECT_ROOT}/services/qxb-chat-gateway/src/index.js" true

# ============================================================================
# 5. CONFIGURATION FILES
# ============================================================================
log_info "=== Configuration Files ==="

check "config" "Backend .env.example exists" \
  "test -f ${PROJECT_ROOT}/backend/.env.example" true

check "config" "Backend package.json exists" \
  "test -f ${PROJECT_ROOT}/backend/package.json" true

check "config" "Frontend package.json exists" \
  "test -f ${PROJECT_ROOT}/frontend/package.json" false

check "config" "Root package.json exists" \
  "test -f ${PROJECT_ROOT}/package.json" false

check "config" "GitHub App OAuth script exists" \
  "test -f ${PROJECT_ROOT}/_OPS/github-app-oauth-setup.sh" false

# ============================================================================
# 6. DIRECTORY STRUCTURE
# ============================================================================
log_info "=== Directory Structure ==="

check "structure" "_OPS directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS" true

check "structure" "_OPS/COMMANDS directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/COMMANDS" true

check "structure" "_OPS/AUDIT directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/AUDIT" true

check "structure" "_OPS/SAFETY directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/SAFETY" false

check "structure" "_OPS/ROLLBACK directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/ROLLBACK" false

check "structure" "_OPS/_STATE directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/_STATE" true

check "structure" "_OPS/PHASE6_DESIGN directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/PHASE6_DESIGN" true

check "structure" "_OPS/PHASE6_CEREMONY directory exists" \
  "test -d ${PROJECT_ROOT}/_OPS/PHASE6_CEREMONY" true

# ============================================================================
# 7. PHASE 6 DESIGN ARTIFACTS
# ============================================================================
log_info "=== Phase 6 Design Artifacts ==="

check "phase6" "Phase 6 autonomy spec exists" \
  "test -f ${PROJECT_ROOT}/_OPS/PHASE6_DESIGN/PHASE6_AUTONOMY_SPEC.json" true

check "phase6" "Phase 6 unlock ceremony spec exists" \
  "test -f ${PROJECT_ROOT}/_OPS/PHASE6_CEREMONY/PHASE6_UNLOCK_CEREMONY.json" true

check "phase6" "Phase 6 is design-only" \
  "grep -q '\"status\": \"design-only\"' ${PROJECT_ROOT}/_OPS/PHASE6_DESIGN/PHASE6_AUTONOMY_SPEC.json" true

check "phase6" "Phase 6 requires ceremony" \
  "grep -q 'required_signers' ${PROJECT_ROOT}/_OPS/PHASE6_CEREMONY/PHASE6_UNLOCK_CEREMONY.json" true

# ============================================================================
# 8. GITHUB WORKFLOWS
# ============================================================================
log_info "=== GitHub Workflows ==="

check "workflows" ".github/workflows directory exists" \
  "test -d ${PROJECT_ROOT}/.github/workflows" true

check "workflows" "CI workflow exists" \
  "test -f ${PROJECT_ROOT}/.github/workflows/ci.yml" false

check "workflows" "Control plane workflow exists" \
  "test -f ${PROJECT_ROOT}/.github/workflows/qxb-control-plane.yml" false

check "workflows" "Rehydrate workflow exists" \
  "test -f ${PROJECT_ROOT}/.github/workflows/require-rehydrate.yml" false

# ============================================================================
# 9. SECURITY ARTIFACTS
# ============================================================================
log_info "=== Security Artifacts ==="

check "security" "Rate limit middleware exists" \
  "test -f ${PROJECT_ROOT}/backend/src/middleware/rate-limit.js" false

check "security" "Path sanitizer exists" \
  "test -f ${PROJECT_ROOT}/backend/src/utils/path-sanitizer.js" false

check "security" "PAT middleware exists" \
  "test -f ${PROJECT_ROOT}/backend/src/middleware/pat.js" false

check "security" ".gitignore exists" \
  "test -f ${PROJECT_ROOT}/.gitignore" true

check "security" ".env files are gitignored" \
  "grep -q '\\.env' ${PROJECT_ROOT}/.gitignore" true

# ============================================================================
# 10. DEPENDENCIES
# ============================================================================
log_info "=== Dependencies ==="

check "deps" "Node.js is installed" \
  "command -v node" true

check "deps" "npm is installed" \
  "command -v npm" true

check "deps" "Git is installed" \
  "command -v git" true

# Optional but recommended
check "deps" "jq is installed" \
  "command -v jq" false

check "deps" "curl is installed" \
  "command -v curl" false

# ============================================================================
# GENERATE REPORT
# ============================================================================

# Create output directory
mkdir -p "${PROJECT_ROOT}/_OPS/OUTPUT"

# Calculate score
SCORE=0
if [[ $TOTAL_CHECKS -gt 0 ]]; then
  SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
fi

# Determine status
STATUS="FAIL"
if [[ $FAILED_CHECKS -eq 0 ]]; then
  if [[ $WARNING_CHECKS -eq 0 ]]; then
    STATUS="PASS"
  else
    STATUS="PASS_WITH_WARNINGS"
  fi
fi

# Generate JSON report
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0",
  "status": "$STATUS",
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "failed": $FAILED_CHECKS,
    "warnings": $WARNING_CHECKS,
    "score": $SCORE
  },
  "checks": [
$(IFS=,; echo "${RESULTS[*]}")
  ],
  "recommendations": [
EOF

# Add recommendations based on failures
if [[ $FAILED_CHECKS -gt 0 ]]; then
  cat >> "$REPORT_FILE" << EOF
    "Critical checks failed - review failures before proceeding",
    "Address all FAIL items in pre-flight checklist",
EOF
fi

if [[ $WARNING_CHECKS -gt 0 ]]; then
  cat >> "$REPORT_FILE" << EOF
    "Warning checks require attention for production deployment",
EOF
fi

cat >> "$REPORT_FILE" << EOF
    "Review PHASE6_PREFLIGHT_CHECKLIST.md for complete checklist",
    "Implement missing Phase 6 features before ceremony"
  ],
  "next_steps": [
    "Complete all mandatory pre-flight checklist items",
    "Implement GitHub MCP server",
    "Create production Docker configurations",
    "Implement Phase 6 autonomy features",
    "Conduct security review",
    "Perform load testing"
  ]
}
EOF

# Display summary
if [[ "$JSON_OUTPUT" == "false" ]]; then
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║                   RESULTS SUMMARY                         ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Total Checks:    $TOTAL_CHECKS"
  echo -e "${GREEN}Passed:          $PASSED_CHECKS${NC}"
  echo -e "${RED}Failed:          $FAILED_CHECKS${NC}"
  echo -e "${YELLOW}Warnings:        $WARNING_CHECKS${NC}"
  echo ""
  echo "Score:           $SCORE%"
  echo "Status:          $STATUS"
  echo ""
  echo "Report saved to: $REPORT_FILE"
  echo ""
  
  if [[ "$STATUS" == "PASS" ]]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
  elif [[ "$STATUS" == "PASS_WITH_WARNINGS" ]]; then
    echo -e "${YELLOW}⚠ Checks passed with warnings - review before production${NC}"
  else
    echo -e "${RED}✗ Critical checks failed - address failures before proceeding${NC}"
  fi
  echo ""
else
  # JSON output
  cat "$REPORT_FILE"
fi

# Exit code
if [[ $FAILED_CHECKS -gt 0 ]]; then
  exit 1
else
  exit 0
fi
