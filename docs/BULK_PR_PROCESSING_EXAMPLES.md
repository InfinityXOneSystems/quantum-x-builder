# Bulk PR Processor - Usage Examples

## Real-World Scenarios

### Scenario 1: You Have 18 Pending Dependabot PRs

**Problem**: 18 Dependabot PRs are waiting, manual review takes 2-3 hours.

**Solution**: Use bulk processor with safe-only mode

```bash
# Step 1: Preview what will happen
./scripts/bulk-pr-processor.sh --dry-run --safe-only

# Output:
# Found 18 open Dependabot PRs
# 📦 Processing PR #245 - Bump actions/checkout from 3.5.0 to 3.6.0 -> SAFE ✅
# 📦 Processing PR #246 - Bump express from 4.18.0 to 4.18.1 -> SAFE ✅
# 📦 Processing PR #247 - Bump react from 18.0.0 to 18.2.0 -> SAFE ✅
# 📦 Processing PR #248 - Bump vite from 4.5.0 to 5.0.0 -> RISKY 🏷️
# ...
# Total: 18 | Merged: 12 | Review: 4 | Skipped: 2

# Step 2: Execute (merge safe PRs)
./scripts/bulk-pr-processor.sh --safe-only

# Step 3: Review remaining PRs
gh pr list --label "needs-manual-review"
```

**Result**: 
- ✅ 12 safe PRs merged automatically in ~5 minutes
- 🏷️ 4 major updates labeled for manual review
- ⏭️ 2 with conflicts skipped
- ⏱️ Time saved: 2.5 hours

---

### Scenario 2: Weekly Maintenance (Automated)

**Problem**: Weekly dependency updates pile up every Monday.

**Solution**: GitHub Actions scheduled workflow (already configured)

```yaml
# .github/workflows/bulk-pr-processor.yml
# Runs automatically every Monday at 9 AM UTC
schedule:
  - cron: '0 9 * * 1'
```

**What happens automatically**:
1. Workflow triggers Monday morning
2. Processes all pending Dependabot PRs in safe-only mode
3. Merges safe updates (GitHub Actions, patch/minor)
4. Labels risky updates for review
5. Creates audit trail in `_OPS/AUDIT/`
6. Sends summary in GitHub Actions

**Manual follow-up** (if needed):
```bash
# Check what was labeled for review
gh pr list --label "needs-manual-review"

# Review and merge individually
gh pr view <number>
gh pr merge <number> --squash
```

---

### Scenario 3: Emergency - Too Many PRs Before Release

**Problem**: Need to clean up PRs quickly before a release.

**Solution**: Aggressive processing with validation

```bash
# Step 1: Process safe ones immediately
./scripts/bulk-pr-processor.sh --safe-only

# Step 2: Check CI status of remaining PRs
for pr in $(gh pr list --author "dependabot[bot]" --json number -q '.[].number'); do
  echo "PR #$pr:"
  gh pr checks $pr
  echo ""
done

# Step 3: If CI passes, merge major updates carefully
# Review each major update
gh pr view <number>
gh pr diff <number>

# If looks good, merge
gh pr merge <number> --squash
```

---

### Scenario 4: Only GitHub Actions Updates

**Problem**: Only want to merge GitHub Actions updates, skip npm.

**Solution**: Filter by labels

```bash
# Get GitHub Actions PRs only
gh pr list --author "dependabot[bot]" --label "github-actions" --json number,title

# Process them (they're always safe)
for pr in $(gh pr list --author "dependabot[bot]" --label "github-actions" --json number -q '.[].number'); do
  echo "Merging PR #$pr"
  gh pr merge $pr --squash --auto
done
```

---

### Scenario 5: Testing Before Merging

**Problem**: Want to test PRs before bulk merging.

**Solution**: Use CI checks + dry-run

```bash
# Step 1: Dry run to see what would be merged
./scripts/bulk-pr-processor.sh --dry-run --safe-only

# Step 2: Check if all PRs have passing CI
gh pr list --author "dependabot[bot]" --json number,statusCheckRollup | \
  jq -r '.[] | "\(.number): \(.statusCheckRollup[0].conclusion)"'

# Step 3: If all pass, merge
./scripts/bulk-pr-processor.sh --safe-only

# Step 4: Monitor for issues
git log --oneline -10
```

---

### Scenario 6: Rollback After Issues

**Problem**: Merged PRs caused issues, need to rollback.

**Solution**: Use rollback tokens

```bash
# Step 1: Find the rollback token from recent run
cat $(ls -t _OPS/OUTPUT/bulk-pr/summary-*.json | head -1) | jq -r .rollback_token
# Output: qxb-rollback-20260209T120000Z

# Step 2: Find all commits with that token
git log --all --grep="qxb-rollback-20260209T120000Z" --oneline

# Step 3: Revert the problematic commit
git revert <commit-hash>
git push

# Step 4: Verify
git log --oneline -5
```

---

### Scenario 7: Specific Dependency Update

**Problem**: Need to merge only React-related updates.

**Solution**: Manual filtering

```bash
# Find React PRs
gh pr list --author "dependabot[bot]" --search "react" --json number,title

# Review each
for pr in $(gh pr list --author "dependabot[bot]" --search "react" --json number -q '.[].number'); do
  echo "=== PR #$pr ==="
  gh pr view $pr
  read -p "Merge? (y/n) " answer
  if [ "$answer" = "y" ]; then
    gh pr merge $pr --squash
  fi
done
```

---

### Scenario 8: Merge Conflicts Resolution

**Problem**: Some PRs have merge conflicts.

**Solution**: Resolve then rerun processor

```bash
# Step 1: Find PRs with conflicts
gh pr list --author "dependabot[bot]" --json number,title | \
  jq -r '.[] | select(.mergeStateStatus == "DIRTY")'

# Step 2: Resolve conflicts for each
gh pr checkout <number>
git merge main
# ... resolve conflicts ...
git commit
git push

# Step 3: Rerun processor
./scripts/bulk-pr-processor.sh --safe-only
```

---

### Scenario 9: High-Risk Updates Require Testing

**Problem**: Major version updates need testing before merge.

**Solution**: Label + manual testing

```bash
# Step 1: Bulk process, labeling risky ones
./scripts/bulk-pr-processor.sh --safe-only

# Step 2: Get list of risky PRs
gh pr list --label "needs-manual-review" --json number,title

# Step 3: Test each major update
for pr in $(gh pr list --label "needs-manual-review" --json number -q '.[].number'); do
  echo "Testing PR #$pr"
  gh pr checkout $pr
  
  # Run tests
  npm test
  npm run build
  
  # If passes, merge
  if [ $? -eq 0 ]; then
    gh pr merge $pr --squash
  fi
  
  # Go back to main
  git checkout main
done
```

---

### Scenario 10: Kill-Switch Emergency

**Problem**: Automated merging is causing issues, need to stop immediately.

**Solution**: Activate kill-switch

```bash
# Step 1: Activate kill-switch
echo '{"status": "DISABLE_AUTONOMY", "reason": "Emergency stop", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > _OPS/SAFETY/KILL_SWITCH.json

# Step 2: Commit and push
git add _OPS/SAFETY/KILL_SWITCH.json
git commit -m "emergency: activate kill-switch"
git push

# Step 3: Verify workflows are stopped
# All automation will now abort at kill-switch check

# Step 4: When safe to resume
echo '{"status": "ACTIVE", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > _OPS/SAFETY/KILL_SWITCH.json
git add _OPS/SAFETY/KILL_SWITCH.json
git commit -m "ops: deactivate kill-switch"
git push
```

---

## Summary Comparison

| Scenario | Time Saved | Risk Level | Automation Level |
|----------|-----------|------------|------------------|
| 18 PRs bulk processing | 2.5 hours | Low | High |
| Weekly scheduled | 1 hour/week | Low | Full |
| Emergency cleanup | 1 hour | Medium | Medium |
| GitHub Actions only | 30 mins | Very Low | High |
| With testing | 1 hour | Low | Medium |
| Rollback | N/A | N/A | Manual |
| Specific dependencies | 45 mins | Low | Manual |
| Conflict resolution | Variable | Medium | Manual |
| Major updates testing | 1.5 hours | Medium | Semi-auto |
| Kill-switch | N/A | N/A | Manual |

---

## Best Practices from These Scenarios

1. **Always start with dry-run**: See what would happen before executing
2. **Use safe-only mode**: Let risky updates be manually reviewed
3. **Check CI status**: Ensure PRs are passing tests
4. **Keep rollback tokens**: Essential for emergency recovery
5. **Monitor audit logs**: Track what was merged and when
6. **Test major updates**: Don't auto-merge breaking changes
7. **Use kill-switch when needed**: Better safe than sorry
8. **Review weekly**: Keep dependency debt low
9. **Filter by labels**: Target specific types of updates
10. **Document changes**: Add notes to audit log

---

For more details, see:
- [Complete Guide](./BULK_PR_PROCESSING.md)
- [Quick Reference](./BULK_PR_PROCESSING_QUICK_REF.md)
- [Scripts README](../scripts/README.md)
