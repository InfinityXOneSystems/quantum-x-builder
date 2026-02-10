# PREFLIGHT CHECK PLAN: QUANTUM-X-BUILDER DEPLOYMENT & RUNTIME READINESS
**Date:** 2026-02-08  
**Authority:** Neo / Copilot Autonomous Agent  
**Phase:** 5 → 6 Transition  
**Scope:** Pre-deployment validation, runtime readiness, governance enforcement

---

## EXECUTIVE SUMMARY

This plan provides a **staged, exhaustive preflight validation** ensuring the system can be deployed with **zero human intervention**, **guaranteed governance enforcement**, and **safe-fail rollback** at every stage.

**Key Principles:**
- ✅ Fail fast, fail loudly (stop at first blocker)
- ✅ Immutable checks (no side effects during validation)
- ✅ Comprehensive (cover all critical paths)
- ✅ Auditable (log all checks with results)
- ✅ Governance-first (kill switch, policy, rehydrate tag verified before ANY execution)

---

## PHASE 1: PRE-DEPLOYMENT ENVIRONMENT CHECKS

### 1.1 System Readiness Verification

**Objective:** Ensure system meets minimum operational requirements

**Checks:**

```bash
# 1.1.1: Node.js Runtime
✓ Check: node --version
  Expected: >= 18.0.0
  Fail Action: Block deployment (no Node.js)
  
✓ Check: npm --version
  Expected: >= 9.0.0
  Fail Action: Block deployment (incompatible npm)

# 1.1.2: Git Repository State
✓ Check: git status --short
  Expected: Clean (no staged/unstaged changes)
  Fail Action: Block deployment (uncommitted work)
  
✓ Check: git rev-parse --abbrev-ref HEAD
  Expected: main (must be on main branch)
  Fail Action: Block deployment (not on main)
  
✓ Check: git log -1 --format=%H
  Expected: Match origin/main HEAD
  Fail Action: Block deployment (local ≠ remote)

# 1.1.3: Docker & Containerization
✓ Check: docker --version
  Expected: >= 20.0.0
  Fail Action: Warning (deployment may require containers)
  
✓ Check: docker-compose --version
  Expected: >= 1.29.0
  Fail Action: Warning (optional for multi-container setup)

# 1.1.4: Workspace Integrity
✓ Check: ls -la _OPS/
  Expected: All required directories present
  Fail Action: Block deployment (critical directories missing)
  
✓ Check: test -f .git/config
  Expected: Git config file exists
  Fail Action: Block deployment (not a git repository)
```

**Early Exit Criteria:**
- ❌ Node.js < 18
- ❌ npm < 9
- ❌ Git status unclean
- ❌ Not on main branch
- ❌ Local ≠ remote HEAD
- ❌ Workspace corrupted

---

### 1.2 Governance Guardrails Check

**Objective:** Verify kill switch, policies, and rehydrate tag are in place and valid

**Checks:**

```bash
# 1.2.1: Kill Switch Verification
✓ Check: test -f _OPS/SAFETY/KILL_SWITCH.json
  Expected: File exists
  Fail Action: Block deployment (kill switch missing)
  
✓ Check: jq '.kill_switch' _OPS/SAFETY/KILL_SWITCH.json
  Expected: "ARMED"
  Fail Action: Block deployment (kill switch not armed)
  
✓ Check: jq '.removal' _OPS/SAFETY/KILL_SWITCH.json
  Expected: "HUMAN_ONLY"
  Fail Action: Block deployment (kill switch can be programmatically removed — CRITICAL)
  
✓ Check: jq '.behavior' _OPS/SAFETY/KILL_SWITCH.json
  Expected: "IMMEDIATE_HALT"
  Fail Action: Block deployment (kill switch behavior undefined)

# 1.2.2: Rehydrate Tag Verification
✓ Check: git tag | grep -c qxb-phase5-lock-2026-02-06
  Expected: 1 (tag exists)
  Fail Action: Block deployment (rehydrate tag missing)
  
✓ Check: git describe --tags --exact-match HEAD
  Expected: Must be at or reference the rehydrate tag
  Action: Warning if HEAD is ahead (indicates post-lock work)
  
✓ Check: git show qxb-phase5-lock-2026-02-06:_OPS/POLICY/
  Expected: Policy definitions present in tag
  Fail Action: Block deployment (tag doesn't contain policies)

# 1.2.3: Policy Directory Protection
✓ Check: ls -la _OPS/POLICY/
  Expected: Policy files exist
  Fail Action: Block deployment (no policies found)
  
✓ Check: find _OPS/POLICY/ -type f -name "*.json" | wc -l
  Expected: >= 1 (at least one policy)
  Fail Action: Block deployment (no policy definitions)
  
✓ Check: jq '.name' _OPS/POLICY/*.json
  Expected: commit-policy, command-policy, rollback-policy (or equivalent)
  Fail Action: Warning (unexpected policy names)

# 1.2.4: Routing Policy Enforcement
✓ Check: test -f _OPS/ROUTING_POLICY.yaml
  Expected: File exists
  Fail Action: Block deployment (routing policy missing)
  
✓ Check: test -f .git/hooks/pre-commit
  Expected: Hook exists
  Fail Action: Block deployment (pre-commit hook missing)
  
✓ Check: grep -c "Quantum-X-Builder routing guard" .git/hooks/pre-commit
  Expected: >= 1 (hook is installed)
  Fail Action: Block deployment (hook not properly installed)
```

**Early Exit Criteria:**
- ❌ Kill switch missing or not ARMED
- ❌ Kill switch can be programmatically removed
- ❌ Rehydrate tag missing
- ❌ Policies missing
- ❌ Pre-commit hook missing

---

### 1.3 Dependency Verification

**Objective:** Ensure all required npm packages are available

**Checks:**

```bash
# 1.3.1: Backend Dependencies
✓ Check: cd backend && npm ci --dry-run
  Expected: All dependencies available (no network errors)
  Fail Action: Block deployment (missing dependencies)
  
✓ Check: npm ls express uuid pg nats
  Expected: All core packages present
  Fail Action: Block deployment (critical packages missing)

# 1.3.2: Frontend Dependencies
✓ Check: cd frontend && npm ci --dry-run
  Expected: All dependencies available
  Fail Action: Block deployment (missing dependencies)

# 1.3.3: Documentation Site Dependencies
✓ Check: cd website && npm ci --dry-run
  Expected: All dependencies available
  Fail Action: Warning (docs site can be deployed later)

# 1.3.4: Package Lock Integrity
✓ Check: cd backend && npm ci
  Expected: Clean install completes
  Fail Action: Block deployment (install fails)
  
✓ Check: npm audit
  Expected: No critical vulnerabilities
  Fail Action: Warning (vulnerabilities present, but may be acceptable)
```

**Early Exit Criteria:**
- ❌ Express not available
- ❌ UUID not available
- ❌ Any core backend dependency missing
- ❌ npm ci fails

---

## PHASE 2: CODE VALIDATION & VERIFICATION

### 2.1 Static Code Checks

**Objective:** Verify code quality and absence of obvious errors

**Checks:**

```bash
# 2.1.1: JavaScript Syntax Validation
✓ Check: node --check backend/src/index.js
  Expected: No syntax errors
  Fail Action: Block deployment (syntax errors detected)
  
✓ Check: node --check backend/src/routes/*.js
  Expected: All route files parse
  Fail Action: Block deployment (route syntax errors)
  
✓ Check: node --check backend/src/services/*.js
  Expected: All service files parse
  Fail Action: Block deployment (service syntax errors)

# 2.1.2: Import/Export Validation
✓ Check: grep -r "export function register" backend/src/routes/
  Expected: 16 route modules (control-plane, admin, ops, etc.)
  Fail Action: Block deployment (route registration missing)
  
✓ Check: grep -r "import.*registerControlPlaneRoutes" backend/src/index.js
  Expected: All 16 routes imported
  Fail Action: Block deployment (route imports incomplete)

# 2.1.3: Service Availability Checks
✓ Check: test -f backend/src/services/policy-engine.js && node --check backend/src/services/policy-engine.js
  Expected: File exists and parses
  Fail Action: Block deployment (policy engine missing/broken)
  
✓ Check: test -f backend/src/services/audit-service.js && node --check backend/src/services/audit-service.js
  Expected: File exists and parses
  Fail Action: Block deployment (audit service missing/broken)
  
✓ Check: test -f backend/src/services/command-queue.js && node --check backend/src/services/command-queue.js
  Expected: File exists and parses
  Fail Action: Block deployment (command queue missing/broken)

# 2.1.4: Middleware Validation
✓ Check: test -f backend/src/middleware/auth.js
  Expected: Auth middleware present
  Fail Action: Block deployment (auth middleware missing)
  
✓ Check: test -f backend/src/middleware/trace.js
  Expected: Trace middleware present
  Fail Action: Warning (observability may be limited)
```

**Early Exit Criteria:**
- ❌ Syntax errors in any JavaScript file
- ❌ Route modules not registered
- ❌ Critical service file missing
- ❌ Auth middleware missing

---

### 2.2 Governance Code Paths Validation

**Objective:** Verify all governance-critical code paths exist and are wired correctly

**Checks:**

```bash
# 2.2.1: Policy Engine Initialization
✓ Check: grep -A 10 "class PolicyEngine" backend/src/services/policy-engine.js
  Expected: Constructor, loadPolicies, evaluate, listPolicies methods
  Fail Action: Block deployment (policy engine incomplete)

# 2.2.2: Audit Service Initialization
✓ Check: grep -A 10 "class AuditService" backend/src/services/audit-service.js
  Expected: Constructor, init, log, getEntries, getEntriesForAction methods
  Fail Action: Block deployment (audit service incomplete)

# 2.2.3: Command Queue Initialization
✓ Check: grep -A 10 "class CommandQueue" backend/src/services/command-queue.js
  Expected: Constructor, init, enqueue, getStatus, loadJobs methods
  Fail Action: Block deployment (command queue incomplete)

# 2.2.4: Control Plane Route Wiring
✓ Check: grep -c "router.get('/control-plane/" backend/src/routes/control-plane.js
  Expected: >= 4 (healthz, state, audit, policy/list)
  Fail Action: Block deployment (missing GET endpoints)
  
✓ Check: grep -c "router.post('/control-plane/" backend/src/routes/control-plane.js
  Expected: >= 6 (policy/evaluate, simulate, write, command, rollback)
  Fail Action: Block deployment (missing POST endpoints)

# 2.2.5: Policy Evaluation in Routes
✓ Check: grep -c "policyEngine.evaluate" backend/src/routes/control-plane.js
  Expected: >= 3 (at least in write, command, rollback)
  Fail Action: Block deployment (policy gating missing)

# 2.2.6: Audit Logging in Routes
✓ Check: grep -c "auditService.log" backend/src/routes/control-plane.js
  Expected: >= 5 (policy/evaluate, simulate, write, command, rollback)
  Fail Action: Block deployment (audit logging incomplete)
```

**Early Exit Criteria:**
- ❌ Policy engine incomplete
- ❌ Audit service incomplete
- ❌ Command queue incomplete
- ❌ Policy evaluation not wired in mutation endpoints
- ❌ Audit logging not wired in critical operations

---

### 2.3 OpenAPI Endpoint Completeness

**Objective:** Verify all 10 OpenAPI endpoints are implemented

**Checks:**

```bash
# 2.3.1: Required Endpoints Present
✓ Check: grep "router.get('/control-plane/healthz'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.get('/control-plane/state'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.get('/control-plane/audit'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.get('/control-plane/policy/list'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.post('/control-plane/policy/evaluate'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.post('/control-plane/simulate/action'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.post('/control-plane/write/github/commit'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.post('/control-plane/command/dispatch'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.get('/control-plane/job/status'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

✓ Check: grep "router.post('/control-plane/rollback/action'" backend/src/routes/control-plane.js
  Expected: Endpoint defined
  Fail Action: Block deployment

# 2.3.2: Export Function Present
✓ Check: grep "export function registerControlPlaneRoutes" backend/src/routes/control-plane.js
  Expected: Export function defined
  Fail Action: Block deployment
```

**Early Exit Criteria:**
- ❌ Any of the 10 endpoints missing
- ❌ registerControlPlaneRoutes not exported

---

## PHASE 3: RUNTIME READINESS

### 3.1 System State & Configuration

**Objective:** Verify system can start and reach operational state

**Checks:**

```bash
# 3.1.1: Environment Variables
✓ Check: echo $WORKSPACE_ROOT
  Expected: Set to /workspace (or deployment path)
  Action: If unset, use process.cwd() default
  
✓ Check: echo $NODE_ENV
  Expected: development | production
  Action: Default to development if unset

# 3.1.2: File System Paths
✓ Check: mkdir -p _OPS/_STATE _OPS/AUDIT_IMMUTABLE _OPS/COMMANDS
  Expected: Directories created
  Fail Action: Block deployment (cannot create required directories)

# 3.1.3: System State File
✓ Check: test -f _OPS/_STATE/system.state.json
  Action: If missing, create default:
    {
      "phase": "6",
      "autonomy": "enabled",
      "locks": [],
      "policyLevels": ["governance", "validation", "escalation"]
    }

# 3.1.4: Policy Initialization
✓ Check: ls _OPS/POLICY/*.json 2>/dev/null | wc -l
  Expected: >= 1
  Action: If missing, use hardcoded defaults in policy-engine.js
```

**Early Exit Criteria:**
- ❌ Cannot create required directories
- ❌ Filesystem readonly or corrupt

---

### 3.2 Service Start Simulation

**Objective:** Test that services can start without errors (no actual listening)

**Checks:**

```bash
# 3.2.1: Backend Service Dry-Run
✓ Check: timeout 5 node backend/src/index.js &
  Expected: Service starts, listens on port, no early exit
  Fail Action: Block deployment (service fails to start)
  
✓ Check: curl -s http://localhost:8787/control-plane/healthz | jq '.status'
  Expected: "OK"
  Fail Action: Block deployment (health endpoint fails)

# 3.2.2: Service Port Availability
✓ Check: lsof -i :8787 (or netstat on Windows)
  Expected: Port available (not in use)
  Fail Action: Warning (port conflict, may need alternate port)

# 3.2.3: Service Memory Check
✓ Check: ps aux | grep "node backend/src/index.js" | grep -v grep | awk '{print $6}'
  Expected: Memory usage < 500MB
  Fail Action: Warning (high memory footprint)
```

**Early Exit Criteria:**
- ❌ Service fails to start
- ❌ Health endpoint returns non-200
- ❌ Service crashes immediately

---

### 3.3 Governance Runtime Checks

**Objective:** Verify governance systems can execute without errors

**Checks:**

```bash
# 3.3.1: Policy Engine Runtime Test
✓ Check: curl -X POST http://localhost:8787/control-plane/policy/evaluate \
  -H "Content-Type: application/json" \
  -d '{"policyName":"commit-policy","action":"test","context":{"changeCount":50}}'
  Expected: Returns { "allowed": true, "reason": "..." }
  Fail Action: Block deployment (policy evaluation fails)

# 3.3.2: Audit Service Runtime Test
✓ Check: curl -s http://localhost:8787/control-plane/audit?limit=10 | jq '.length'
  Expected: Returns array (may be empty)
  Fail Action: Block deployment (audit read fails)

# 3.3.3: Command Queue Runtime Test
✓ Check: curl -X POST http://localhost:8787/control-plane/command/dispatch \
  -H "Content-Type: application/json" \
  -d '{"command":"test","target":"localhost","parameters":{}}'
  Expected: Returns { "commandId": "cmd-...", "status": "queued" }
  Fail Action: Block deployment (command queue fails)

# 3.3.4: Kill Switch Recognition
✓ Check: cat _OPS/SAFETY/KILL_SWITCH.json | jq '.kill_switch'
  Expected: "ARMED"
  Fail Action: Warning (kill switch status changed)
  
✓ Check: Implement kill-switch middleware check in request path
  Expected: If KILL_SWITCH.behavior == IMMEDIATE_HALT, reject all requests with 503
  Fail Action: Add TODO for next iteration
```

**Early Exit Criteria:**
- ❌ Policy evaluation fails
- ❌ Audit service returns error
- ❌ Command queue returns error
- ❌ Kill switch behavior unexpected

---

## PHASE 4: DEPLOYMENT SAFETY GATES

### 4.1 Safe-Fail Dockerfile Checks

**Objective:** Verify Docker deployment will not cause data loss or corruption

**Checks:**

```bash
# 4.1.1: Dockerfile Template Presence
✓ Check: find services/ -name "Dockerfile.template" | wc -l
  Expected: >= 5 (proposal-engine, qxb-chat-gateway, qxb-narrator, qxb-presence, qxb-pubsub)
  Fail Action: Warning (some services may lack Docker templates)

# 4.1.2: Dockerfile Content Validation
for file in services/*/Dockerfile.template; do
  ✓ Check: grep -q "FROM node:18" "$file"
    Expected: Uses appropriate base image
    Fail Action: Warning (unexpected base image)
  
  ✓ Check: grep -q "COPY package*.json" "$file"
    Expected: Copies dependencies
    Fail Action: Warning (dependencies not copied)
  
  ✓ Check: grep -q "RUN npm" "$file"
    Expected: Installs dependencies
    Fail Action: Warning (npm install missing)
done

# 4.1.3: Safe-Fail Deployment Strategy
✓ Check: Dockerfile includes health check: HEALTHCHECK CMD ...
  Expected: Each Dockerfile has health check
  Fail Action: Warning (no health check defined)
  
✓ Check: No RUN commands that modify _OPS/ directories
  Expected: Dockerfiles don't overwrite governance data
  Fail Action: Block deployment (Dockerfile unsafe)

# 4.1.4: Persistent Volume Mounts
✓ Check: docker-compose.yml includes volume for _OPS/
  Expected: _OPS/ mounted as persistent volume
  Fail Action: Warning (governance data may be lost on container restart)
```

**Early Exit Criteria:**
- ❌ Dockerfile modifies _OPS/ directory
- ❌ Critical Dockerfile missing or unreadable

---

### 4.2 Rollback Readiness

**Objective:** Ensure safe rollback from any deployment state

**Checks:**

```bash
# 4.2.1: Backup Creation
✓ Check: tar czf _OPS/ROLLBACK/pre-deployment-$(date +%s).tar.gz \
  _OPS/_STATE/ _OPS/AUDIT_IMMUTABLE/ _OPS/COMMANDS/ _OPS/POLICY/
  Expected: Backup created without errors
  Fail Action: Block deployment (cannot create backup)

# 4.2.2: Rollback Script Presence
✓ Check: test -f _OPS/ROLLBACK/rollback.sh
  Expected: Script exists and is executable
  Fail Action: Warning (manual rollback may be required)

# 4.2.3: Git Reset Capability
✓ Check: git log --oneline | head -1
  Expected: Current commit hash available
  Action: If deployment fails, user can `git reset --hard <commit>`

# 4.2.4: Audit Trail Immutability
✓ Check: find _OPS/AUDIT_IMMUTABLE/ -name "*.ndjson" -exec stat {} \;
  Expected: Files have correct permissions (read-only for audit user)
  Fail Action: Warning (audit trail may be modifiable)
```

**Early Exit Criteria:**
- ❌ Cannot create backup
- ❌ Cannot read current git commit

---

## PHASE 5: FINAL SIGN-OFF

### 5.1 Comprehensive Validation Summary

**Objective:** Generate final readiness report

**Report Contents:**
```
PREFLIGHT VALIDATION REPORT
===========================

Date: [timestamp]
Environment: [development|production]
Phase: 5 → 6 Transition
Authority: [deployer name]

✓ Phase 1: Environment Checks — PASSED (X/X)
  - Node.js runtime: OK
  - Git repository state: OK
  - Docker availability: OK
  - Workspace integrity: OK

✓ Phase 2: Governance Checks — PASSED (X/X)
  - Kill switch verification: OK (ARMED, HUMAN_ONLY, IMMEDIATE_HALT)
  - Rehydrate tag: OK (qxb-phase5-lock-2026-02-06 present)
  - Policy definitions: OK (commit-policy, command-policy, rollback-policy)
  - Routing policy enforcement: OK (pre-commit hook active)

✓ Phase 3: Dependencies — PASSED (X/X)
  - Backend dependencies: OK
  - Frontend dependencies: OK
  - Critical packages: OK (express, uuid, pg, nats)

✓ Phase 4: Code Validation — PASSED (X/X)
  - Syntax validation: OK (no errors)
  - Route registration: OK (16/16 modules)
  - Service availability: OK (policy-engine, audit-service, command-queue)
  - OpenAPI endpoints: OK (10/10 implemented)

✓ Phase 5: Governance Code Paths — PASSED (X/X)
  - Policy engine: OK (all methods present)
  - Audit service: OK (all methods present)
  - Command queue: OK (all methods present)
  - Route wiring: OK (policy evaluation, audit logging)

✓ Phase 6: Runtime Readiness — PASSED (X/X)
  - File system paths: OK
  - Service startup: OK (health check responds)
  - Policy evaluation: OK (test request succeeded)
  - Kill switch recognition: OK

✓ Phase 7: Deployment Safety — PASSED (X/X)
  - Dockerfiles: OK (templates present, no unsafe operations)
  - Rollback readiness: OK (backup created, script available)
  - Audit trail immutability: OK

OVERALL RESULT: ✅ READY FOR DEPLOYMENT

Next Steps:
1. Deploy backend: npm start (or docker run)
2. Deploy frontend: npm run build && deploy
3. Monitor health: curl /control-plane/healthz every 30s
4. Verify autonomy: POST /control-plane/command/dispatch (test request)
5. Confirm audit trail: GET /control-plane/audit

Rollback Plan:
1. If service fails: git reset --hard [pre-deployment commit]
2. If data corruption: Restore from _OPS/ROLLBACK/pre-deployment-*.tar.gz
3. If governance breach: Activate kill switch (manual: Edit _OPS/SAFETY/KILL_SWITCH.json)

Approver: [signature]
Timestamp: [ISO-8601]
```

### 5.2 Deployment Approval Gate

**Required Sign-Off:**
- ✅ All 35+ checks PASSED
- ✅ No "Block deployment" failures
- ✅ No unresolved "Action required" items
- ✅ Governance guardrails verified and armed
- ✅ Rollback plan confirmed

**Approval Authority:** Neo (or delegated operations team lead)

**Signature Block:**
```json
{
  "approved_by": "Neo",
  "timestamp": "2026-02-08T...",
  "deployment_id": "qxb-deploy-20260208-...",
  "git_commit": "[commit hash]",
  "rehydrate_tag": "qxb-phase5-lock-2026-02-06",
  "kill_switch_status": "ARMED",
  "notes": "All checks passed. Ready for production deployment."
}
```

---

## APPENDICES

### A. Preflight Checklist (One-Pager)

```
PREFLIGHT CHECKLIST — QUANTUM-X-BUILDER DEPLOYMENT
====================================================

PRE-DEPLOYMENT (Run Once)
  ☐ git status (must be clean)
  ☐ git branch (must be main)
  ☐ git pull origin main (must sync)
  ☐ npm ci (must succeed)
  ☐ npm audit (review vulnerabilities)

GOVERNANCE CHECKS (Run Once, Block on Failure)
  ☐ Kill switch: ARMED, HUMAN_ONLY, IMMEDIATE_HALT
  ☐ Rehydrate tag: qxb-phase5-lock-2026-02-06 present
  ☐ Policies: commit-policy, command-policy, rollback-policy
  ☐ Pre-commit hook: Installed and active

CODE VALIDATION (Run Once, Block on Failure)
  ☐ node --check backend/src/index.js (no syntax errors)
  ☐ grep 10 endpoints in control-plane.js (all present)
  ☐ Audit logging wired (grep 5+ auditService.log calls)
  ☐ Policy evaluation wired (grep 3+ policyEngine.evaluate calls)

RUNTIME TEST (Run Once, Block on Failure)
  ☐ npm start (service starts)
  ☐ curl /control-plane/healthz → { "status": "OK" }
  ☐ curl POST /policy/evaluate → { "allowed": ... }
  ☐ curl GET /audit → [ ... ]

DEPLOYMENT SIGN-OFF
  ☐ All checks passed
  ☐ Backup created: _OPS/ROLLBACK/pre-deployment-*.tar.gz
  ☐ Rollback script: _OPS/ROLLBACK/rollback.sh
  ☐ Approval signature: deployment_id + commit hash
  ☐ Ready to deploy!
```

### B. Troubleshooting Guide

**Issue: Syntax Error in route file**
```
Error: SyntaxError: Unexpected token ...
Solution: Check the route file, fix syntax, run: node --check [file]
```

**Issue: Kill Switch not ARMED**
```
Error: Kill switch status: DISARMED
Solution: CRITICAL — Do not deploy. Contact Neo. Edit _OPS/SAFETY/KILL_SWITCH.json manually if emergency.
```

**Issue: Policy evaluation timeout**
```
Error: Policy engine returned error after 5000ms
Solution: Check _OPS/POLICY/ files are valid JSON. Restart service.
```

**Issue: Audit service append fails**
```
Error: EACCES: permission denied, open '_OPS/AUDIT_IMMUTABLE/2026-02-08.ndjson'
Solution: Fix directory permissions: chmod 755 _OPS/AUDIT_IMMUTABLE/
```

---

**SIGNED:** Neo / Copilot Autonomous Agent  
**DATE:** 2026-02-08  
**NEXT:** Terraform/Docker mirror plan (in progress)
