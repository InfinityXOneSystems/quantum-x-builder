# Pull Request Closure Guide

## 🎯 Objective
Close 14 open pull requests in the InfinityXOneSystems/quantum-x-builder repository.

---

## ⚡ Quick Start (Easiest Method)

### Via GitHub Web Interface

**URL**: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls

**Steps**:
1. Click on each open PR
2. Scroll to the bottom of the PR page
3. Click the "Close pull request" button
4. (Optional) Add comment: "Closing unused PR"
5. Repeat for all 14 PRs

**Time**: ~2-3 minutes for all 14 PRs

---

## 🚀 Automated Closure Options

### Option A: GitHub CLI (Recommended for Bulk)

**Prerequisites**: GitHub CLI installed and authenticated

```bash
# Authenticate if needed
gh auth login

# List all open PRs to see what we're closing
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open

# Close all open PRs with one command
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open --json number --jq '.[].number' | \
while read pr; do
    gh pr close "$pr" --repo InfinityXOneSystems/quantum-x-builder --comment "Bulk cleanup: closing unused PR"
    echo "✓ Closed PR #$pr"
    sleep 1
done
```

### Option B: GitHub API with cURL

**Prerequisites**: GitHub Personal Access Token with `repo` scope

```bash
# Set your token
export GITHUB_TOKEN="your_personal_access_token_here"

# Get list of open PRs
curl -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/pulls?state=open \
     | jq '.[] | {number: .number, title: .title}'

# Close a specific PR (replace 123 with PR number)
curl -X PATCH \
     -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/pulls/123 \
     -d '{"state":"closed"}'
```

### Option C: Bulk Closure Script

Save this script as `close-all-prs.sh`:

```bash
#!/bin/bash
set -e

REPO="InfinityXOneSystems/quantum-x-builder"
COMMENT="Bulk PR cleanup - closing unused pull requests"

echo "🔍 Fetching open PRs from $REPO..."

# Get all open PR numbers
PR_NUMBERS=$(gh pr list --repo "$REPO" --state open --json number --jq '.[].number')

if [ -z "$PR_NUMBERS" ]; then
    echo "✅ No open PRs found!"
    exit 0
fi

# Count PRs
PR_COUNT=$(echo "$PR_NUMBERS" | wc -l)
echo "📋 Found $PR_COUNT open PR(s)"
echo ""

# Close each PR
COUNTER=0
while read -r PR_NUM; do
    COUNTER=$((COUNTER + 1))
    echo "[$COUNTER/$PR_COUNT] Closing PR #$PR_NUM..."
    
    gh pr close "$PR_NUM" \
        --repo "$REPO" \
        --comment "$COMMENT" \
        2>&1 || echo "  ⚠️  Failed to close PR #$PR_NUM"
    
    echo "  ✓ PR #$PR_NUM closed"
    sleep 1  # Rate limiting
done <<< "$PR_NUMBERS"

echo ""
echo "✅ Bulk closure complete!"
echo ""
echo "📊 Summary: Closed $COUNTER PR(s)"
```

Usage:
```bash
chmod +x close-all-prs.sh
./close-all-prs.sh
```

---

## 🧹 Post-Closure Cleanup (Optional)

After closing PRs, you may want to delete the associated branches:

```bash
# List closed PR branches
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state closed --json number,headRefName

# Delete branches from closed PRs
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state closed --json number,headRefName --jq '.[] | "\(.number) \(.headRefName)"' | \
while read pr branch; do
    echo "Deleting branch: $branch (from PR #$pr)"
    git push origin --delete "$branch" 2>/dev/null || echo "  Branch already deleted or protected"
done
```

---

## ⚠️ Important Notes

### What Happens When You Close a PR?

✅ **Preserved**:
- PR history and comments
- PR metadata and labels
- All discussion threads
- Commits remain in branch

❌ **Changed**:
- PR state: Open → Closed
- PR no longer appears in open PR count
- PR notifications stop

### Can You Reopen?
✓ Yes! Closed PRs can be reopened at any time from the GitHub web interface.

### Branches
- Closing a PR does **NOT** delete the branch
- You must manually delete branches if desired
- Protected branches cannot be deleted

---

## 📋 PR Cleanup Checklist

Before closing PRs, consider:

- [ ] Are there any PRs with important code changes to preserve?
- [ ] Are there any PRs from external contributors to acknowledge?
- [ ] Do any PRs need to be merged instead of closed?
- [ ] Should you add a comment explaining why they're being closed?
- [ ] Do you want to delete the branches after closing?

---

## 🔍 Verify Closure

Check that all PRs are closed:

```bash
# Count open PRs
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open | wc -l

# Should show 0 if all are closed
```

Or visit: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls

---

## 📚 Related Documentation

- **Bulk PR Processing**: `docs/BULK_PR_PROCESSING.md`
- **PR Cleanup Guide**: `docs/DEPENDABOT_PR_GUIDE.md`
- **Manual Cleanup Script**: `scripts/manual-dependabot-cleanup.sh`

---

## 🆘 Troubleshooting

### "Permission denied" errors
- Ensure you have write access to the repository
- Check that your authentication is valid: `gh auth status`

### "Rate limit exceeded"
- Add sleep delays between API calls
- Use `sleep 2` between PR closures

### Can't find gh command
- Install GitHub CLI: https://cli.github.com/
- Or use the web interface instead

---

**Last Updated**: 2026-02-09  
**Repository**: InfinityXOneSystems/quantum-x-builder
