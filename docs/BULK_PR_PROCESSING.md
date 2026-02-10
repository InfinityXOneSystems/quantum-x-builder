# Bulk Dependabot PR Processing Guide

## Overview

This guide explains how to efficiently process multiple Dependabot pull requests using the automated bulk processor.

## Problem Statement

Dependabot creates many PRs for dependency updates, which can pile up quickly. Manually reviewing and merging 18+ PRs is time-consuming and error-prone.

## Solution

We've implemented an automated bulk PR processor that:
- **Categorizes PRs by risk level** (safe, risky, needs review)
- **Auto-merges safe PRs** (GitHub Actions updates, patch/minor npm updates)
- **Labels risky PRs** for manual review
- **Creates audit trails** with rollback tokens
- **Respects safety guardrails** (kill-switch, forbidden paths)

## Quick Start

### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** → **Bulk Dependabot PR Processor**
2. Click **Run workflow**
3. Configure options:
   - **Dry run**: `true` to preview, `false` to execute
   - **Safe only**: `true` to only process safe PRs

### Option 2: Manual Script Execution

```bash
# Dry run - preview what would happen
./scripts/bulk-pr-processor.sh --dry-run

# Safe only - only merge safe PRs
./scripts/bulk-pr-processor.sh --safe-only

# Full run - process all PRs (use with caution)
./scripts/bulk-pr-processor.sh
```

## PR Classification

### SAFE (Auto-merge)
- ✅ GitHub Actions updates
- ✅ Patch updates (1.2.3 → 1.2.4)
- ✅ Minor updates (1.2.3 → 1.3.0)

### RISKY (Labeled for review)
- ⚠️ Major updates (1.2.3 → 2.0.0)
- ⚠️ PRs with merge conflicts
- ⚠️ Non-mergeable PRs

### REVIEW (Labeled for review)
- 🔍 Unclear or complex updates
- 🔍 Multiple dependency changes

## Workflow Details

### Automated Workflow Triggers

1. **Manual**: Dispatch from GitHub Actions UI
2. **Scheduled**: Every Monday at 9 AM UTC (safe-only mode)

### Safety Features

#### Kill-Switch
The processor respects the kill-switch at `_OPS/SAFETY/KILL_SWITCH`:
```json
{
  "status": "DISABLE_AUTONOMY"
}
```

If present, the workflow will abort.

#### Rollback Tokens
Every merge includes a rollback token: `qxb-rollback-YYYYMMDDTHHMMSSZ`

To rollback:
```bash
# Find commits with specific rollback token
git log --all --grep="qxb-rollback-20260209T123456Z"

# Revert if needed
git revert <commit-hash>
```

#### Audit Trail
All actions are logged to:
- `_OPS/AUDIT/bulk-pr-audit.log` - Detailed audit log
- `_OPS/OUTPUT/bulk-pr/summary-*.json` - Processing summaries

## Example Output

```
🚀 Bulk Dependabot PR Processor
================================
Found 18 open Dependabot PRs

📦 Processing PR #123
   Title: Bump actions/checkout from 3.5.0 to 3.6.0
   Safety Level: SAFE
   ✅ Merged PR #123 (SAFE)

📦 Processing PR #124
   Title: Bump express from 4.18.0 to 5.0.0
   Safety Level: RISKY
   🏷️  Labeled PR #124 for manual review

================================
📊 Processing Complete
================================
Total PRs Processed: 18
✅ Merged: 12
🏷️  Labeled for Review: 4
⏭️  Skipped: 2
❌ Failed: 0
```

## Handling Different Scenarios

### Scenario 1: All Safe Updates
```bash
# Merge all safe updates automatically
./scripts/bulk-pr-processor.sh --safe-only
```

### Scenario 2: Test Major Updates First
```bash
# Label major updates for review
./scripts/bulk-pr-processor.sh --safe-only

# Manually review labeled PRs
gh pr list --label "needs-manual-review"

# Approve and merge individually
gh pr merge <number> --squash
```

### Scenario 3: Merge Conflicts
PRs with merge conflicts are automatically labeled. To resolve:

```bash
# Checkout the PR branch
gh pr checkout <number>

# Resolve conflicts
git merge main
# ... fix conflicts ...
git commit

# Push resolution
git push
```

The next processor run will pick up the resolved PR.

## Configuration

### Dependabot Settings
Current configuration in `.github/dependabot.yml`:
- GitHub Actions: 5 PRs max
- NPM (root, frontend, backend, website): 10 PRs max each
- Major versions: Ignored by default for stability

### Adjusting Limits
To change PR limits, edit `.github/dependabot.yml`:

```yaml
- package-ecosystem: "npm"
  open-pull-requests-limit: 10  # Adjust this
```

## Monitoring

### Check Processor Status
```bash
# View recent processing runs
ls -lh _OPS/OUTPUT/bulk-pr/

# View audit log
tail -n 50 _OPS/AUDIT/bulk-pr-audit.log

# Check latest summary
cat $(ls -t _OPS/OUTPUT/bulk-pr/summary-*.json | head -1) | jq .
```

### GitHub Actions Dashboard
Go to **Actions** → **Bulk Dependabot PR Processor** to see:
- Run history
- Processing summaries
- Artifacts with detailed logs

## Best Practices

1. **Always dry-run first**: Preview changes before executing
2. **Start with safe-only**: Merge safe updates first, review risky ones
3. **Monitor audit logs**: Check `_OPS/AUDIT/bulk-pr-audit.log` after each run
4. **Review major updates**: Major version updates require testing
5. **Use scheduled runs**: Let the weekly schedule handle routine updates
6. **Keep kill-switch ready**: Use `_OPS/SAFETY/KILL_SWITCH` in emergencies

## Troubleshooting

### Issue: "gh: not authenticated"
**Solution**: Ensure `GH_TOKEN` is set:
```bash
export GH_TOKEN="your_github_token"
gh auth status
```

### Issue: "Permission denied"
**Solution**: Make script executable:
```bash
chmod +x scripts/bulk-pr-processor.sh
```

### Issue: PRs not merging
**Solution**: Check PR status:
```bash
gh pr view <number> --json mergeable,mergeStateStatus
```

Common causes:
- Merge conflicts
- CI checks failing
- Required reviews not met

### Issue: Kill-switch activated
**Solution**: Check kill-switch status:
```bash
cat _OPS/SAFETY/KILL_SWITCH.json
```

If autonomy needs to be enabled:
```json
{
  "status": "ACTIVE",
  "last_check": "2026-02-09T12:00:00Z"
}
```

## Advanced Usage

### Process Specific Labels
```bash
# Get PRs with specific labels
gh pr list --label "dependencies,npm" --author "dependabot[bot]"

# Process them individually
for pr in $(gh pr list --label "frontend" --json number -q '.[].number'); do
  gh pr merge $pr --squash
done
```

### Custom Risk Assessment
Edit `scripts/bulk-pr-processor.sh` to customize the `classify_pr()` function:

```bash
classify_pr() {
  local pr_title="$1"
  
  # Add custom rules
  if echo "$pr_title" | grep -q "my-critical-package"; then
    echo "REVIEW"
    return
  fi
  
  # ... existing logic ...
}
```

## Rollback Procedures

### Rollback Single Merge
```bash
# Find the merge commit
git log --grep="qxb-rollback-20260209T123456Z"

# Revert it
git revert <commit-hash>
git push
```

### Rollback All Merges from a Run
```bash
# Find rollback token from summary
ROLLBACK_TOKEN="qxb-rollback-20260209T123456Z"

# Get all commits
git log --grep="$ROLLBACK_TOKEN" --oneline

# Revert each one
git log --grep="$ROLLBACK_TOKEN" --format="%H" | while read hash; do
  git revert --no-edit $hash
done

git push
```

## Integration with Existing Automation

This processor works alongside:
- **autopr-validator.yml**: Validates individual PRs
- **ci.yml**: Runs tests on all changes
- **require-rehydrate.yml**: Ensures baseline tag exists

All workflows respect:
- Kill-switch at `_OPS/SAFETY/KILL_SWITCH`
- Rollback tokens
- Audit requirements

## Metrics & Reporting

The processor generates metrics in JSON format:

```json
{
  "timestamp": "2026-02-09T12:00:00Z",
  "rollback_token": "qxb-rollback-20260209T120000Z",
  "total_prs": 18,
  "merged": 12,
  "review_required": 4,
  "skipped": 2,
  "failed": 0,
  "dry_run": false,
  "safe_only": true
}
```

Use these metrics to:
- Track dependency update velocity
- Identify problematic dependencies
- Optimize Dependabot configuration

## Future Enhancements

Planned improvements:
- [ ] Intelligent conflict resolution
- [ ] Automated testing for major updates
- [ ] Dependency vulnerability scanning integration
- [ ] Slack/email notifications
- [ ] Dashboard UI for monitoring
- [ ] Machine learning-based risk assessment

## Support

For issues or questions:
1. Check this guide first
2. Review audit logs in `_OPS/AUDIT/`
3. Check GitHub Actions run logs
4. Open an issue with:
   - Processing summary JSON
   - Relevant audit log entries
   - Error messages

## Related Documentation

- [Auto PR Validator](.github/workflows/autopr-validator.yml)
- [Dependabot Configuration](.github/dependabot.yml)
- [Rollback Procedures](docs/auto-ops/rollback.sh)
- [Admin Control Plane](docs/admin-control-plane.md)

---

**Last Updated**: 2026-02-09  
**Version**: 1.0.0  
**Maintainer**: Quantum-X-Builder Team
