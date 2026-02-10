# Automated PR Closure Workflow

## 🎯 Overview

The `auto-close-prs.yml` workflow provides a **fully automated solution** for closing pull requests directly from GitHub's web interface. No command-line tools or scripts required!

---

## ⚡ Quick Start (30 seconds)

### Step 1: Navigate to Actions
Go to: https://github.com/InfinityXOneSystems/quantum-x-builder/actions/workflows/auto-close-prs.yml

### Step 2: Run Workflow
1. Click **"Run workflow"** button (top right)
2. Leave all fields default to close ALL open PRs
3. Click **"Run workflow"** (green button)

### Step 3: Watch it Work
The workflow will:
- ✅ Find all open PRs
- ✅ Show what will be closed
- ✅ Close each PR with a comment
- ✅ Provide a summary

**Done!** All 14 PRs will be closed automatically.

---

## 🎛️ Workflow Options

When you click "Run workflow", you'll see these options:

### 1. PR Numbers (Optional)
- **Leave empty**: Close ALL open PRs (recommended)
- **Specify PRs**: Enter comma-separated numbers like `1,5,8,12`

**Example**: `1,2,3,4,5,6,7,8,9,10,11,12,13,14`

### 2. Close Reason (Optional)
- Default: "Bulk PR cleanup - closing unused pull requests"
- Custom: Enter your own reason

**Example**: "Closing Dependabot PRs for major version updates"

### 3. Delete Branches (Optional)
- `false` (default): Keep branches after closing PRs
- `true`: Delete branches after closing PRs

**Recommendation**: Use `false` first time, delete branches later if needed

### 4. Dry Run (Optional)
- `false` (default): Actually close PRs
- `true`: Show what would be closed without closing

**Recommendation**: Use `true` first to preview, then `false` to execute

---

## 📋 Usage Examples

### Example 1: Close All Open PRs (Most Common)
```yaml
PR numbers: (leave empty)
Close reason: Bulk PR cleanup - closing unused pull requests
Delete branches: false
Dry run: false
```
**Result**: Closes all 14 open PRs

### Example 2: Test First (Dry Run)
```yaml
PR numbers: (leave empty)
Close reason: Testing automated closure
Delete branches: false
Dry run: true
```
**Result**: Shows what would be closed, doesn't actually close anything

### Example 3: Close Specific PRs
```yaml
PR numbers: 5,7,9,11
Close reason: Closing outdated feature PRs
Delete branches: false
Dry run: false
```
**Result**: Closes only PRs #5, #7, #9, and #11

### Example 4: Close All and Delete Branches
```yaml
PR numbers: (leave empty)
Close reason: Complete cleanup with branch deletion
Delete branches: true
Dry run: false
```
**Result**: Closes all PRs AND deletes their branches

---

## 🔍 Step-by-Step with Screenshots

### Visual Guide

#### Step 1: Go to Actions Tab
```
https://github.com/InfinityXOneSystems/quantum-x-builder/actions
```
1. Click "Actions" tab at top of repository
2. Find "Auto-Close PRs" in the left sidebar
3. Click on it

#### Step 2: Click "Run workflow"
- Look for the "Run workflow" button on the right side
- It's a blue/green button that says "Run workflow"

#### Step 3: Configure Options
A dropdown will appear with 4 input fields:
- **PR numbers**: Leave empty for all PRs
- **Close reason**: Use default or customize
- **Delete branches**: Keep as `false` for safety
- **Dry run**: Use `true` to test first

#### Step 4: Execute
- Click the green "Run workflow" button at bottom of dropdown
- Page will refresh and show the workflow running

#### Step 5: Monitor Progress
- Click on the running workflow (yellow dot)
- Watch the "Close Pull Requests" step
- See each PR being closed in real-time

#### Step 6: View Results
- Green checkmark = Success
- Summary shows how many PRs were closed
- Each closed PR has a comment with the closure reason

---

## 🛡️ Safety Features

### Built-in Protections
1. **Manual Trigger Only**: Workflow only runs when YOU click "Run workflow"
2. **Dry Run Mode**: Test without actually closing anything
3. **Confirmation**: See what will be closed before execution
4. **Rate Limiting**: 1-second delay between closures to avoid API limits
5. **Error Handling**: Failed closures are reported but don't stop the workflow
6. **Branch Protection**: `main` and `master` branches are never deleted
7. **Detailed Logging**: Every action is logged for audit trail

### What Gets Preserved
When PRs are closed:
- ✅ PR history and metadata
- ✅ All comments and discussions
- ✅ Commit history
- ✅ Labels and milestones
- ✅ PR can be reopened later

### What Changes
- ❌ PR state: Open → Closed
- ❌ No longer in "Open PRs" count
- ❌ No new notifications (unless reopened)

---

## 📊 Workflow Output

### Console Output Example
```
╔════════════════════════════════════════════════════════════════╗
║            🤖 Automated PR Closure Workflow                    ║
╚════════════════════════════════════════════════════════════════╝

📋 Fetching all open PRs...
Found 14 PR(s) to process

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRs to be closed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PR #1: Update dependency X to v2
PR #2: Update dependency Y to v3
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/14] Processing PR #1...
  ✅ Closed PR #1
[2/14] Processing PR #2...
  ✅ Closed PR #2
...

╔════════════════════════════════════════════════════════════════╗
║                    ✅ Closure Complete                          ║
╚════════════════════════════════════════════════════════════════╝

📊 Summary:
  Total PRs processed: 14
  Successfully closed: 14
  Failed to close:     0

✅ All PRs closed successfully!
```

### GitHub Summary
After completion, GitHub shows:
- Total PRs closed
- Who triggered the workflow
- Timestamp
- Link to detailed logs

---

## 🔧 Troubleshooting

### "Workflow not found"
**Solution**: Make sure you've merged this PR to main branch first, or run from the feature branch

### "Permission denied"
**Solution**: Workflow has `pull-requests: write` permission. Should work automatically.

### "No PRs found"
**Solution**: All PRs are already closed! Check: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls?q=is%3Apr+is%3Aclosed

### Some PRs failed to close
**Solution**: Check the logs for specific error messages. Some PRs might be locked or have other restrictions.

### Want to reopen a closed PR?
1. Go to the closed PR
2. Click "Reopen pull request" button
3. Done!

---

## 🔄 After Closing PRs

### Verify All Closed
```bash
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open
```
Should show: `no pull requests match your search`

### View Closed PRs
https://github.com/InfinityXOneSystems/quantum-x-builder/pulls?q=is%3Apr+is%3Aclosed

### Clean Up Branches (Optional)
If you didn't delete branches during closure, you can do it later:

1. Go to: https://github.com/InfinityXOneSystems/quantum-x-builder/branches
2. Click "Stale" to see branches from closed PRs
3. Delete them individually or run the workflow again with `delete_branches: true`

---

## 📚 Related Documentation

- **Manual Methods**: `docs/PR_CLOSURE_GUIDE.md`
- **Quick Reference**: `CLOSE_PRS_QUICK.md`
- **Shell Script**: `scripts/close-all-prs.sh`

---

## 🎯 Recommended Workflow

### First Time (Testing)
1. ✅ Run with `dry_run: true` to preview
2. ✅ Review the output
3. ✅ Run with `dry_run: false` to execute
4. ✅ Keep branches (don't delete yet)

### Verification
1. ✅ Check that all PRs are closed
2. ✅ Review closed PRs to ensure correct ones were closed
3. ✅ If anything was closed by mistake, reopen it

### Cleanup (Optional)
1. ✅ Run again with `delete_branches: true` to clean up branches
2. ✅ Or delete branches manually from GitHub UI

---

## ⚡ Super Quick Method (For Experienced Users)

1. Go to: https://github.com/InfinityXOneSystems/quantum-x-builder/actions/workflows/auto-close-prs.yml
2. Click "Run workflow"
3. Leave everything default
4. Click "Run workflow" (green button)
5. Wait 30 seconds
6. ✅ Done! All 14 PRs closed.

**That's it!** The workflow handles everything automatically.

---

## 🆘 Need Help?

### Quick Support
1. Check workflow logs for detailed error messages
2. Review this guide's troubleshooting section
3. Use dry run mode to test without closing

### Alternative Methods
If the workflow doesn't work for any reason:
- **Web Interface**: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls
- **Shell Script**: `./scripts/close-all-prs.sh`
- **Manual**: Close each PR individually

---

**Last Updated**: 2026-02-09  
**Workflow File**: `.github/workflows/auto-close-prs.yml`  
**Documentation**: `docs/AUTO_PR_CLOSURE_GUIDE.md`
