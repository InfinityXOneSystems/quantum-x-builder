# Bulk PR Processing - Quick Reference

## TL;DR - Process 18 Dependabot PRs Fast

### Fastest Way (3 minutes)

```bash
# 1. Preview what will happen (dry-run)
./scripts/bulk-pr-processor.sh --dry-run --safe-only

# 2. Merge safe PRs automatically
./scripts/bulk-pr-processor.sh --safe-only

# 3. Check results
cat $(ls -t _OPS/OUTPUT/bulk-pr/summary-*.json | head -1) | jq .
```

### Via GitHub Actions (2 clicks)

1. **Actions** → **Bulk Dependabot PR Processor** → **Run workflow**
2. Set `dry_run: false` and `safe_only: true`

## Commands Cheat Sheet

```bash
# Dry run (preview only)
./scripts/bulk-pr-processor.sh --dry-run

# Safe only (patch/minor updates)
./scripts/bulk-pr-processor.sh --safe-only

# Full run (careful!)
./scripts/bulk-pr-processor.sh

# Check status
gh pr list --author "dependabot[bot]"

# View audit log
tail -30 _OPS/AUDIT/bulk-pr-audit.log

# Latest summary
cat $(ls -t _OPS/OUTPUT/bulk-pr/summary-*.json | head -1) | jq .
```

## What Gets Merged Automatically

✅ **SAFE** (Auto-merged):
- GitHub Actions updates (any version)
- Patch updates: 1.2.3 → 1.2.4
- Minor updates: 1.2.3 → 1.3.0

⚠️ **RISKY** (Labeled for review):
- Major updates: 1.2.3 → 2.0.0
- Has merge conflicts
- Breaking changes possible

## Typical Results

```
Total PRs: 18
✅ Merged: 12 (GitHub Actions + minor npm)
🏷️  Review: 4 (major updates)
⏭️  Skipped: 2 (conflicts)
```

## If Something Goes Wrong

### Rollback
```bash
# Find rollback token in summary
cat _OPS/OUTPUT/bulk-pr/summary-*.json | jq -r .rollback_token

# Revert changes
git log --grep="qxb-rollback-YYYYMMDDTHHMMSSZ"
git revert <commit-hash>
```

### Emergency Stop
```bash
# Activate kill-switch
echo '{"status": "DISABLE_AUTONOMY"}' > _OPS/SAFETY/KILL_SWITCH.json
git add _OPS/SAFETY/KILL_SWITCH.json
git commit -m "Emergency: disable autonomy"
git push
```

## Review Labeled PRs

```bash
# List PRs needing review
gh pr list --label "needs-manual-review"

# View specific PR
gh pr view <number>

# Merge after testing
gh pr merge <number> --squash
```

## Common Scenarios

### "I have 18 PRs to process"
```bash
./scripts/bulk-pr-processor.sh --safe-only
# Result: ~12 merged, 4-6 labeled for review
```

### "I want to test first"
```bash
./scripts/bulk-pr-processor.sh --dry-run
# Shows what would happen, makes no changes
```

### "I need to review major updates"
```bash
# Process safe ones first
./scripts/bulk-pr-processor.sh --safe-only

# Review remaining manually
gh pr list --label "needs-manual-review"
```

## Configuration Files

- **Script**: `scripts/bulk-pr-processor.sh`
- **Workflow**: `.github/workflows/bulk-pr-processor.yml`
- **Dependabot**: `.github/dependabot.yml`
- **Audit**: `_OPS/AUDIT/bulk-pr-audit.log`
- **Output**: `_OPS/OUTPUT/bulk-pr/`

## Safety Features

- ✅ Kill-switch support
- ✅ Rollback tokens on all merges
- ✅ Audit trail
- ✅ Dry-run mode
- ✅ Safe-only mode
- ✅ Rate limiting
- ✅ Conflict detection

## Full Documentation

See [docs/BULK_PR_PROCESSING.md](./BULK_PR_PROCESSING.md) for complete guide.

---

**Time Saved**: Manual processing ~2-3 hours → Automated ~5 minutes
