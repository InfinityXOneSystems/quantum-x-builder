#!/bin/bash
##############################################################################
# Bulk PR Closure Script
# Closes all open pull requests in the repository
# Repository: InfinityXOneSystems/quantum-x-builder
##############################################################################

set -e

REPO="InfinityXOneSystems/quantum-x-builder"
COMMENT="Bulk PR cleanup - closing unused pull requests"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║            🧹 Bulk PR Closure Script                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Repository: $REPO"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "Alternative: Use the GitHub web interface"
    echo "URL: https://github.com/$REPO/pulls"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "🔍 Fetching open PRs from $REPO..."
echo ""

# Get all open PR numbers (disable set -e temporarily for error handling)
set +e
PR_NUMBERS=$(gh pr list --repo "$REPO" --state open --json number --jq '.[].number' 2>&1)
PR_EXIT_CODE=$?
set -e

if [ $PR_EXIT_CODE -ne 0 ]; then
    echo "❌ Error fetching PRs:"
    echo ""
    echo "$PR_NUMBERS"
    echo ""
    echo "You may not have access to this repository."
    echo "Try closing PRs via: https://github.com/$REPO/pulls"
    exit 1
fi

if [ -z "$PR_NUMBERS" ]; then
    echo "✅ No open PRs found!"
    echo ""
    echo "All PRs are already closed."
    exit 0
fi

# Show PRs to be closed
echo "📋 Open Pull Requests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gh pr list --repo "$REPO" --state open --json number,title,author --jq '.[] | "PR #\(.number): \(.title) (@\(.author.login))"'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count PRs
PR_COUNT=$(echo "$PR_NUMBERS" | wc -l)
echo "Found: $PR_COUNT open PR(s)"
echo ""

# Confirm action
read -p "⚠️  Close all $PR_COUNT PRs? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled. No PRs were closed."
    exit 0
fi

echo ""
echo "🚀 Starting bulk closure..."
echo ""

# Close each PR
COUNTER=0
SUCCESS=0
FAILED=0

while read -r PR_NUM; do
    COUNTER=$((COUNTER + 1))
    echo "[$COUNTER/$PR_COUNT] Closing PR #$PR_NUM..."
    
    if gh pr close "$PR_NUM" --repo "$REPO" --comment "$COMMENT" 2>&1; then
        echo "  ✅ PR #$PR_NUM closed successfully"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ❌ Failed to close PR #$PR_NUM"
        FAILED=$((FAILED + 1))
    fi
    
    # Rate limiting - be nice to GitHub API
    if [ $COUNTER -lt $PR_COUNT ]; then
        sleep 1
    fi
done <<< "$PR_NUMBERS"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ Closure Complete                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "  Total PRs processed: $COUNTER"
echo "  Successfully closed: $SUCCESS"
echo "  Failed to close:     $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All PRs closed successfully!"
else
    echo "⚠️  Some PRs failed to close. Check errors above."
fi

echo ""
echo "🔗 View closed PRs: https://github.com/$REPO/pulls?q=is%3Apr+is%3Aclosed"
echo ""

# Ask about branch cleanup
read -p "🧹 Delete branches from closed PRs? (yes/no): " CLEANUP

if [ "$CLEANUP" = "yes" ]; then
    echo ""
    echo "🗑️  Deleting branches from selected closed PRs..."
    echo ""

    # Derive repository owner from REPO ("owner/name")
    REPO_OWNER="${REPO%%/*}"

    # Ask user which PRs (typically those just closed in this run) to clean up
    echo "Enter space-separated PR numbers to delete branches for (e.g. 12 34 56):"
    read -p "PR numbers (or press Enter to skip): " PR_LIST

    if [ -n "$PR_LIST" ]; then
        for pr in $PR_LIST; do
            if [ -z "$pr" ]; then
                continue
            fi

            # Fetch PR metadata needed to safely delete the branch
            set +e
            BRANCH_NAME=$(gh pr view "$pr" --repo "$REPO" --json headRefName --jq '.headRefName' 2>/dev/null || echo "")
            IS_CROSS_REPO=$(gh pr view "$pr" --repo "$REPO" --json isCrossRepository --jq '.isCrossRepository' 2>/dev/null || echo "true")
            HEAD_OWNER=$(gh pr view "$pr" --repo "$REPO" --json headRepositoryOwner --jq '.headRepositoryOwner.login' 2>/dev/null || echo "")
            set -e

            if [ -z "$BRANCH_NAME" ]; then
                echo "  ⚠️  Could not determine branch for PR #$pr; skipping."
                continue
            fi

            # Skip branches from forked or cross-repository PRs
            if [ "$IS_CROSS_REPO" = "true" ] || [ "$HEAD_OWNER" != "$REPO_OWNER" ]; then
                echo "  Skipping branch '$BRANCH_NAME' from PR #$pr (cross-repository or different owner: $HEAD_OWNER)."
                continue
            fi

            # Extra safety: never delete main/master
            if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
                echo "  Skipping protected branch '$BRANCH_NAME' from PR #$pr."
                continue
            fi

            echo "  Deleting branch: $BRANCH_NAME (from PR #$pr)"
            set +e
            gh api "repos/${REPO}/git/refs/heads/${BRANCH_NAME}" -X DELETE 2>/dev/null || echo "    ⚠️  Could not delete branch (may be already deleted or protected)"
            set -e
        done
    else
        echo "  Skipped branch deletion."
    fi
    
    echo ""
    echo "✅ Branch cleanup complete"
fi

echo ""
echo "✨ Done!"
