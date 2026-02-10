# Rollback Instructions

## Emergency Rollback to Baseline

To rollback immediately to the Phase 5 baseline:

```bash
git checkout qxb-phase5-lock-2026-02-06
git checkout -B phase5-postlock-work qxb-phase5-lock-2026-02-06
```

## Finding and Reverting Specific Changes
o rollback immediately:
Use the rollback helper scripts to find commits with rollback tokens and get revert instructions:

### Linux/macOS (Bash)

```bash
cd docs/auto-ops
./rollback.sh -t <token>    # Find specific rollback token
./rollback.sh -d <date>     # Find by date (YYYYMMDD)
./rollback.sh -l <limit>    # List recent tokens
./rollback.sh -h            # Show help
```

### Windows (PowerShell)

```powershell
cd docs/auto-ops
.\rollback.ps1 -Token <token>   # Find specific rollback token
.\rollback.ps1 -Date <date>     # Find by date (YYYYMMDD)
.\rollback.ps1 -Limit <limit>   # List recent tokens
.\rollback.ps1 -Help            # Show help
```

## Rollback Token Format

All automated commits include rollback tokens in the format:
```
qxb-rollback-YYYYMMDDTHHMMSSZ
```

Example: `qxb-rollback-20260208T143022Z`

## Important

⚠️ All rollbacks require human review before merging. Never merge revert PRs without review.
