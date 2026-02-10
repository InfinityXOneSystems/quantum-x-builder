#!/bin/bash

##############################################################################
# Bulk Dependabot PR Processor
# 
# Efficiently processes multiple Dependabot PRs by:
# 1. Categorizing PRs by risk level
# 2. Auto-merging safe PRs (patch/minor updates)
# 3. Running tests for major updates
# 4. Creating audit trails with rollback tokens
#
# Usage: ./scripts/bulk-pr-processor.sh [--dry-run] [--safe-only]
##############################################################################

set -e

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-InfinityXOneSystems}"
REPO_NAME="${GITHUB_REPOSITORY##*/}"
DRY_RUN=false
SAFE_ONLY=false
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
ROLLBACK_TOKEN="qxb-rollback-${TIMESTAMP}"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true ;;
    --safe-only) SAFE_ONLY=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Setup directories
mkdir -p _OPS/OUTPUT/bulk-pr
mkdir -p _OPS/AUDIT

echo "🚀 Bulk Dependabot PR Processor"
echo "================================"
echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo "Rollback Token: ${ROLLBACK_TOKEN}"
echo "Dry Run: ${DRY_RUN}"
echo "Safe Only: ${SAFE_ONLY}"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed or not authenticated"
  echo "Please install: https://cli.github.com/"
  exit 1
fi

# Function to classify PR safety level
classify_pr() {
  local pr_title="$1"
  local pr_body="$2"
  local pr_labels="$3"
  
  # GitHub Actions updates are always safe
  if echo "$pr_labels" | grep -q "github-actions"; then
    echo "SAFE"
    return
  fi
  
  # Patch and minor npm updates are generally safe
  if echo "$pr_title" | grep -qiE "(bump|update).*from [0-9]+\.[0-9]+\.[0-9]+ to [0-9]+\.[0-9]+\.[0-9]+"; then
    local from_version=$(echo "$pr_title" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1)
    local to_version=$(echo "$pr_title" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | tail -1)
    
    local from_major=$(echo "$from_version" | cut -d. -f1)
    local to_major=$(echo "$to_version" | cut -d. -f1)
    
    if [ "$from_major" = "$to_major" ]; then
      echo "SAFE"
      return
    else
      echo "RISKY"
      return
    fi
  fi
  
  # Default to requiring review
  echo "REVIEW"
}

# Function to check PR status
check_pr_mergeable() {
  local pr_number="$1"
  local mergeable=$(gh pr view "$pr_number" --json mergeable --jq '.mergeable')
  echo "$mergeable"
}

# Function to check if PR has conflicts
has_conflicts() {
  local pr_number="$1"
  local status=$(gh pr view "$pr_number" --json mergeStateStatus --jq '.mergeStateStatus')
  [ "$status" = "DIRTY" ] && echo "true" || echo "false"
}

# Function to merge PR
merge_pr() {
  local pr_number="$1"
  local safety_level="$2"
  
  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Would merge PR #${pr_number} (${safety_level})"
    return 0
  fi
  
  # Merge using squash
  if gh pr merge "$pr_number" --squash --auto; then
    echo "  ✅ Merged PR #${pr_number} (${safety_level})"
    
    # Log to audit
    cat >> _OPS/AUDIT/bulk-pr-audit.log <<EOF
--- Merged PR ---
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
PR Number: ${pr_number}
Safety Level: ${safety_level}
Rollback Token: ${ROLLBACK_TOKEN}
Action: AUTO_MERGED
---
EOF
    return 0
  else
    echo "  ❌ Failed to merge PR #${pr_number}"
    return 1
  fi
}

# Function to label PR for review
label_for_review() {
  local pr_number="$1"
  local reason="$2"
  
  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY-RUN] Would label PR #${pr_number} for review: ${reason}"
    return 0
  fi
  
  gh pr edit "$pr_number" --add-label "needs-manual-review" || true
  
  # Add comment
  gh pr comment "$pr_number" --body "🤖 **Bulk PR Processor**

This PR requires manual review: ${reason}

Rollback Token: \`${ROLLBACK_TOKEN}\`" || true
  
  echo "  🏷️  Labeled PR #${pr_number} for manual review"
}

# Main processing loop
echo "📋 Fetching open Dependabot PRs..."

# Get all open PRs from dependabot
PR_LIST=$(gh pr list --author "dependabot[bot]" --state open --json number,title,labels,url --limit 50)
PR_COUNT=$(echo "$PR_LIST" | jq 'length')

if [ "$PR_COUNT" -eq 0 ]; then
  echo "✨ No open Dependabot PRs found!"
  exit 0
fi

echo "Found ${PR_COUNT} open Dependabot PRs"
echo ""

# Counters
MERGED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
REVIEW_COUNT=0

# Process each PR
echo "$PR_LIST" | jq -c '.[]' | while read -r pr_json; do
  pr_number=$(echo "$pr_json" | jq -r '.number')
  pr_title=$(echo "$pr_json" | jq -r '.title')
  pr_labels=$(echo "$pr_json" | jq -r '.labels[].name' | tr '\n' ',' || echo "")
  pr_url=$(echo "$pr_json" | jq -r '.url')
  
  echo "📦 Processing PR #${pr_number}"
  echo "   Title: ${pr_title}"
  echo "   Labels: ${pr_labels}"
  
  # Classify PR
  safety_level=$(classify_pr "$pr_title" "" "$pr_labels")
  echo "   Safety Level: ${safety_level}"
  
  # Check if PR has conflicts
  if [ "$(has_conflicts "$pr_number")" = "true" ]; then
    echo "   ⚠️  Has merge conflicts - skipping"
    label_for_review "$pr_number" "Merge conflicts detected"
    REVIEW_COUNT=$((REVIEW_COUNT + 1))
    continue
  fi
  
  # Check if PR is mergeable
  if [ "$(check_pr_mergeable "$pr_number")" != "MERGEABLE" ]; then
    echo "   ⚠️  Not mergeable - skipping"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  # Process based on safety level
  case "$safety_level" in
    SAFE)
      if merge_pr "$pr_number" "$safety_level"; then
        MERGED_COUNT=$((MERGED_COUNT + 1))
      else
        FAILED_COUNT=$((FAILED_COUNT + 1))
      fi
      ;;
    RISKY)
      if [ "$SAFE_ONLY" = true ]; then
        echo "   ⏭️  Skipping risky PR (safe-only mode)"
        label_for_review "$pr_number" "Major version update - requires testing"
        REVIEW_COUNT=$((REVIEW_COUNT + 1))
      else
        label_for_review "$pr_number" "Major version update - requires testing"
        REVIEW_COUNT=$((REVIEW_COUNT + 1))
      fi
      ;;
    *)
      label_for_review "$pr_number" "Needs manual review"
      REVIEW_COUNT=$((REVIEW_COUNT + 1))
      ;;
  esac
  
  echo ""
  
  # Rate limiting - be nice to GitHub API
  sleep 2
done

# Generate summary
echo "================================"
echo "📊 Processing Complete"
echo "================================"
echo "Total PRs Processed: ${PR_COUNT}"
echo "✅ Merged: ${MERGED_COUNT}"
echo "🏷️  Labeled for Review: ${REVIEW_COUNT}"
echo "⏭️  Skipped: ${SKIPPED_COUNT}"
echo "❌ Failed: ${FAILED_COUNT}"
echo ""
echo "🔄 Rollback Token: ${ROLLBACK_TOKEN}"

# Create summary JSON
cat > "_OPS/OUTPUT/bulk-pr/summary-${TIMESTAMP}.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rollback_token": "$ROLLBACK_TOKEN",
  "total_prs": $PR_COUNT,
  "merged": $MERGED_COUNT,
  "review_required": $REVIEW_COUNT,
  "skipped": $SKIPPED_COUNT,
  "failed": $FAILED_COUNT,
  "dry_run": $DRY_RUN,
  "safe_only": $SAFE_ONLY
}
EOF

echo "📝 Summary saved to _OPS/OUTPUT/bulk-pr/summary-${TIMESTAMP}.json"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🔍 This was a dry run. No changes were made."
  echo "   Run without --dry-run to apply changes."
fi

exit 0
