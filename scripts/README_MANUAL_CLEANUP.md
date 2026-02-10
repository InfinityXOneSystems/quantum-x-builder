# Manual Dependabot Cleanup Script

Quick script to manually process Dependabot PRs when automation hasn't run.

## Usage

```bash
# Interactive mode
./scripts/manual-dependabot-cleanup.sh

# Auto-merge safe PRs
./scripts/manual-dependabot-cleanup.sh --auto-safe

# Close risky PRs
./scripts/manual-dependabot-cleanup.sh --close-all-unsafe

# Help
./scripts/manual-dependabot-cleanup.sh --help
```

## Requirements

- GitHub CLI: https://cli.github.com/
- Authentication: `gh auth login`
- Permissions: Repository write access

## What It Does

1. **Fetches** all open Dependabot PRs
2. **Classifies** them as SAFE, RISKY, or REVIEW
3. **Processes** based on your choice:
   - SAFE: GitHub Actions + patch/minor updates
   - RISKY: Major version updates
   - REVIEW: Unclear updates

## Output

- Audit log: `_OPS/AUDIT/manual-pr-cleanup.log`
- Summary: `_OPS/OUTPUT/manual-pr-cleanup/summary-<timestamp>.json`

## See Also

- Full guide: `/docs/DEPENDABOT_PR_GUIDE.md`
- Quick fix: `/docs/DEPENDABOT_QUICK_FIX.md`
- Bulk processor: `/scripts/bulk-pr-processor.sh`
