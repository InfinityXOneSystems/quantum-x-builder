# Auto-Ops: Autonomous Operations Documentation

## Overview

Operational documentation for the Quantum X Builder autonomous CI/CD and governance system with modular, minimal-bloat automation, strong guardrails, and audit trails.

## Core Components

1. **Auto PR Validator** - Validates PRs, applies auto-fixes, runs tests, appends audit evidence, auto-approves and auto-merges
2. **GCP Deploy Pipeline** - Builds and deploys to Cloud Run with audit trails  
3. **Dependabot** - Automated dependency updates

## Required Secrets

### Essential
- **GIT_PAT** - Personal Access Token for bot operations (repo, workflow, write:packages)
- **GCP_SA_KEY** - Google Cloud Service Account key (JSON)

### Optional
- **GEMINI_API_KEY** - AI API key
- **GCP_PROJECT_ID**, **GCP_REGION**, **ARTIFACT_REGISTRY**, **ARTIFACT_REPO**
- **MIRROR_REGISTRY_URL**, **MIRROR_REGISTRY_USERNAME**, **MIRROR_REGISTRY_PASSWORD**

## Guardrails & Safety

### KillSwitch
Location: `_OPS/SAFETY/KILL_SWITCH` or `_OPS/SAFETY/KILL_SWITCH.json`

Disable autonomy: Add `DISABLE_AUTONOMY` to the file
Re-enable: Remove `DISABLE_AUTONOMY` directive

### Forbidden Paths
Never modified by automation:
- `_OPS/POLICY/*`
- `_OPS/SAFETY/KILL_SWITCH*`  
- Git tags

## Rollback System

### Rollback Tokens
Format: `qxb-rollback-YYYYMMDDTHHMMSSZ`

Find commits: `git log --grep="qxb-rollback-"`
Revert: `git revert <commit-sha>` then create PR for review

All rollbacks require human review before merging.

### Rollback Helper Scripts

**Linux/macOS (Bash):**
```bash
cd docs/auto-ops
./rollback.sh -t <token>    # Find specific token
./rollback.sh -d <date>     # Find by date (YYYYMMDD)
./rollback.sh -l <limit>    # List recent tokens
./rollback.sh -h            # Show help
```

**Windows (PowerShell):**
```powershell
cd docs/auto-ops
.\rollback.ps1 -Token <token>   # Find specific token
.\rollback.ps1 -Date <date>     # Find by date (YYYYMMDD)
.\rollback.ps1 -Limit <limit>   # List recent tokens
.\rollback.ps1 -Help            # Show help
```

Both scripts provide detailed rollback instructions including commit details and commands to create revert branches and PRs.

## Audit System

### Audit Logs
- `_OPS/AUDIT/audit.log` - Append-only text audit trail
- `_OPS/OUTPUT/*.json` - Structured JSON evidence

View: `tail -n 50 _OPS/AUDIT/audit.log`

## Auto-Fix Behavior

Applies ESLint and Prettier fixes to root, frontend, backend, website.
Commits changes with rollback token if modifications detected.

## Auto-Approve & Auto-Merge

Auto-approve: PRs by github-actions[bot], copilot, or labeled `auto-approve-safe`
Auto-merge: PRs labeled `automerge-approved`

## Deployment

Services: frontend (5173), backend (3000)

Modes:
1. Image-based (if Dockerfile exists)
2. Source-based (fallback)

Manual: `gh workflow run deploy-gcp.yml -f service=frontend`

## Troubleshooting

1. Check killswitch: `cat _OPS/SAFETY/KILL_SWITCH.json`
2. Verify secrets: `gh secret list`
3. Check audit logs: `tail -50 _OPS/AUDIT/audit.log`
4. Review workflows: `gh run list --workflow=autopr-validator.yml`

## Next Steps

1. Configure GitHub secrets
2. Enable auto-merge in repo settings
3. Review audit logs regularly
4. Implement admin UI stubs in frontend/src/admin/

See docs/admin-control-plane.md for API reference.

---
Last Updated: 2026-02-08
System Version: Phase 6 - Modular Autonomy
