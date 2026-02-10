#!/bin/bash

##############################################################################
# Manual Dependabot PR Cleanup Script
# 
# This script helps you manually process Dependabot PRs when the automated
# bulk-pr-processor workflow hasn't run yet.
#
# Usage: 
#   ./scripts/manual-dependabot-cleanup.sh                    # Interactive mode
#   ./scripts/manual-dependabot-cleanup.sh --auto-safe        # Auto-merge safe PRs
#   ./scripts/manual-dependabot-cleanup.sh --close-all-unsafe # Close risky PRs
#   
# Requirements:
#   - GitHub CLI (gh) installed and authenticated
#   - Repository access with PR merge permissions
##############################################################################

set -e

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-InfinityXOneSystems}"
REPO_NAME="${GITHUB_REPOSITORY##*/}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
ROLLBACK_TOKEN="qxb-rollback-${TIMESTAMP}"
AUTO_SAFE=false
CLOSE_UNSAFE=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --auto-safe) AUTO_SAFE=true ;;
    --close-all-unsafe) CLOSE_UNSAFE=true ;;
    --help)
      echo "Usage: $0 [--auto-safe] [--close-all-unsafe] [--help]"
      echo ""
      echo "Options:"
      echo "  --auto-safe           Automatically merge all safe PRs (GitHub Actions + patch/minor)"
      echo "  --close-all-unsafe    Automatically close all risky PRs (major version updates)"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *) echo "Unknown parameter: $1. Use --help for usage."; exit 1 ;;
  esac
  shift
done

echo -e "${BLUE}🧹 Manual Dependabot PR Cleanup${NC}"
echo "================================"
echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI (gh) is not installed or not authenticated${NC}"
  echo "Please install: https://cli.github.com/"
  echo "Then authenticate: gh auth login"
  exit 1
fi

# Check gh authentication
if ! gh auth status &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI is not authenticated${NC}"
  echo "Please run: gh auth login"
  exit 1
fi

# Setup directories
mkdir -p _OPS/OUTPUT/manual-pr-cleanup
mkdir -p _OPS/AUDIT

# Function to classify PR safety level
classify_pr() {
  local pr_title="$1"
  local pr_labels="$2"
  
  # GitHub Actions updates are always safe
  if echo "$pr_labels" | grep -q "github-actions"; then
    echo "SAFE"
    return
  fi
  
  # Extract version information
  if echo "$pr_title" | grep -qiE "from [0-9]+\.[0-9]+\.[0-9]+ to [0-9]+\.[0-9]+\.[0-9]+"; then
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

# Get all open Dependabot PRs
echo -e "${BLUE}📋 Fetching open Dependabot PRs...${NC}"
PR_LIST=$(gh pr list --author "dependabot[bot]" --state open --json number,title,labels,url,headRefName --limit 50)
PR_COUNT=$(echo "$PR_LIST" | jq 'length')

if [ "$PR_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✨ No open Dependabot PRs found!${NC}"
  exit 0
fi

echo -e "${YELLOW}Found ${PR_COUNT} open Dependabot PRs${NC}"
echo ""

# Arrays to hold categorized PRs
declare -a SAFE_PRS=()
declare -a RISKY_PRS=()
declare -a REVIEW_PRS=()

# Categorize PRs
echo -e "${BLUE}📊 Categorizing PRs by risk level...${NC}"
echo ""

while read -r pr_json; do
  pr_number=$(echo "$pr_json" | jq -r '.number')
  pr_title=$(echo "$pr_json" | jq -r '.title')
  pr_labels=$(echo "$pr_json" | jq -r '.labels[].name' | tr '\n' ',' || echo "")
  pr_url=$(echo "$pr_json" | jq -r '.url')
  
  safety_level=$(classify_pr "$pr_title" "$pr_labels")
  
  case "$safety_level" in
    SAFE)
      SAFE_PRS+=("$pr_number|$pr_title|$pr_url")
      echo -e "${GREEN}✓ SAFE #${pr_number}${NC}: ${pr_title}"
      ;;
    RISKY)
      RISKY_PRS+=("$pr_number|$pr_title|$pr_url")
      echo -e "${RED}⚠ RISKY #${pr_number}${NC}: ${pr_title}"
      ;;
    *)
      REVIEW_PRS+=("$pr_number|$pr_title|$pr_url")
      echo -e "${YELLOW}? REVIEW #${pr_number}${NC}: ${pr_title}"
      ;;
  esac
done < <(echo "$PR_LIST" | jq -c '.[]')

echo ""
echo "================================"
echo -e "${GREEN}SAFE PRs: ${#SAFE_PRS[@]}${NC} (can auto-merge)"
echo -e "${RED}RISKY PRs: ${#RISKY_PRS[@]}${NC} (major version updates)"
echo -e "${YELLOW}REVIEW PRs: ${#REVIEW_PRS[@]}${NC} (need manual review)"
echo "================================"
echo ""

# Function to merge PR
merge_pr() {
  local pr_number="$1"
  
  echo -e "${BLUE}Enabling auto-merge for PR #${pr_number}...${NC}"
  
  if gh pr merge "$pr_number" --squash --auto; then
    echo -e "${GREEN}✅ Auto-merge enabled for PR #${pr_number} (will merge when checks pass)${NC}"
    
    # Log to audit
    cat >> _OPS/AUDIT/manual-pr-cleanup.log <<EOF
--- Auto-Merge Enabled ---
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
PR Number: ${pr_number}
Rollback Token: ${ROLLBACK_TOKEN}
Action: AUTO_MERGE_ENABLED
Note: PR will merge automatically when CI checks pass
---
EOF
    return 0
  else
    echo -e "${RED}❌ Failed to enable auto-merge for PR #${pr_number}${NC}"
    return 1
  fi
}

# Function to close PR
close_pr() {
  local pr_number="$1"
  local reason="$2"
  
  echo -e "${YELLOW}Closing PR #${pr_number}...${NC}"
  
  # Add comment first
  gh pr comment "$pr_number" --body "🤖 **Dependabot Cleanup**

This PR is being closed: ${reason}

If you need this update, please recreate it with appropriate testing.

Rollback Token: \`${ROLLBACK_TOKEN}\`" || true
  
  if gh pr close "$pr_number"; then
    echo -e "${GREEN}✅ Closed PR #${pr_number}${NC}"
    
    # Log to audit
    cat >> _OPS/AUDIT/manual-pr-cleanup.log <<EOF
--- Closed PR ---
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
PR Number: ${pr_number}
Reason: ${reason}
Rollback Token: ${ROLLBACK_TOKEN}
Action: MANUAL_CLOSED
---
EOF
    return 0
  else
    echo -e "${RED}❌ Failed to close PR #${pr_number}${NC}"
    return 1
  fi
}

# Handle auto-safe mode
if [ "$AUTO_SAFE" = true ]; then
  echo -e "${BLUE}🚀 Enabling auto-merge for safe PRs...${NC}"
  echo -e "${YELLOW}Note: PRs will merge automatically when CI checks pass${NC}"
  echo ""
  
  merged_count=0
  failed_count=0
  
  for pr_data in "${SAFE_PRS[@]}"; do
    pr_number=$(echo "$pr_data" | cut -d'|' -f1)
    pr_title=$(echo "$pr_data" | cut -d'|' -f2)
    
    echo -e "${BLUE}Processing: ${pr_title}${NC}"
    
    if merge_pr "$pr_number"; then
      merged_count=$((merged_count + 1))
    else
      failed_count=$((failed_count + 1))
    fi
    
    echo ""
    sleep 2  # Rate limiting
  done
  
  echo "================================"
  echo -e "${GREEN}✅ Auto-merge enabled: ${merged_count}${NC}"
  echo -e "${RED}❌ Failed: ${failed_count}${NC}"
  echo ""
  echo -e "${YELLOW}💡 PRs will merge automatically when CI checks pass${NC}"
  echo -e "${YELLOW}   Check GitHub Actions to monitor progress${NC}"
  echo "================================"
fi

# Handle close-unsafe mode
if [ "$CLOSE_UNSAFE" = true ]; then
  echo -e "${BLUE}🗑️  Closing risky PRs...${NC}"
  echo ""
  
  closed_count=0
  failed_count=0
  
  for pr_data in "${RISKY_PRS[@]}"; do
    pr_number=$(echo "$pr_data" | cut -d'|' -f1)
    pr_title=$(echo "$pr_data" | cut -d'|' -f2)
    
    echo -e "${YELLOW}Processing: ${pr_title}${NC}"
    
    if close_pr "$pr_number" "Major version update requires manual testing and approval"; then
      closed_count=$((closed_count + 1))
    else
      failed_count=$((failed_count + 1))
    fi
    
    echo ""
    sleep 2  # Rate limiting
  done
  
  echo "================================"
  echo -e "${GREEN}✅ Closed: ${closed_count}${NC}"
  echo -e "${RED}❌ Failed: ${failed_count}${NC}"
  echo "================================"
fi

# Interactive mode (if no auto flags)
if [ "$AUTO_SAFE" = false ] && [ "$CLOSE_UNSAFE" = false ]; then
  echo ""
  echo -e "${BLUE}💡 What would you like to do?${NC}"
  echo ""
  echo "1. Auto-merge all SAFE PRs (${#SAFE_PRS[@]} PRs)"
  echo "2. Close all RISKY PRs (${#RISKY_PRS[@]} PRs)"
  echo "3. Show detailed PR list"
  echo "4. Exit (do nothing)"
  echo ""
  read -p "Enter your choice (1-4): " choice
  
  case $choice in
    1)
      echo ""
      echo -e "${YELLOW}This will merge ${#SAFE_PRS[@]} PRs. Continue? (y/N)${NC}"
      read -p "> " confirm
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        exec "$0" --auto-safe
      else
        echo "Cancelled."
      fi
      ;;
    2)
      echo ""
      echo -e "${YELLOW}This will close ${#RISKY_PRS[@]} PRs. Continue? (y/N)${NC}"
      read -p "> " confirm
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        exec "$0" --close-all-unsafe
      else
        echo "Cancelled."
      fi
      ;;
    3)
      echo ""
      echo "=== SAFE PRs (Can Auto-Merge) ==="
      for pr_data in "${SAFE_PRS[@]}"; do
        pr_number=$(echo "$pr_data" | cut -d'|' -f1)
        pr_title=$(echo "$pr_data" | cut -d'|' -f2)
        pr_url=$(echo "$pr_data" | cut -d'|' -f3)
        echo -e "${GREEN}#${pr_number}${NC}: ${pr_title}"
        echo "  ${pr_url}"
      done
      
      echo ""
      echo "=== RISKY PRs (Major Updates) ==="
      for pr_data in "${RISKY_PRS[@]}"; do
        pr_number=$(echo "$pr_data" | cut -d'|' -f1)
        pr_title=$(echo "$pr_data" | cut -d'|' -f2)
        pr_url=$(echo "$pr_data" | cut -d'|' -f3)
        echo -e "${RED}#${pr_number}${NC}: ${pr_title}"
        echo "  ${pr_url}"
      done
      
      echo ""
      echo "=== REVIEW PRs (Need Manual Review) ==="
      for pr_data in "${REVIEW_PRS[@]}"; do
        pr_number=$(echo "$pr_data" | cut -d'|' -f1)
        pr_title=$(echo "$pr_data" | cut -d'|' -f2)
        pr_url=$(echo "$pr_data" | cut -d'|' -f3)
        echo -e "${YELLOW}#${pr_number}${NC}: ${pr_title}"
        echo "  ${pr_url}"
      done
      ;;
    4)
      echo "Exiting."
      exit 0
      ;;
    *)
      echo "Invalid choice."
      exit 1
      ;;
  esac
fi

# Generate summary
cat > "_OPS/OUTPUT/manual-pr-cleanup/summary-${TIMESTAMP}.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rollback_token": "$ROLLBACK_TOKEN",
  "total_prs": $PR_COUNT,
  "safe_prs": ${#SAFE_PRS[@]},
  "risky_prs": ${#RISKY_PRS[@]},
  "review_prs": ${#REVIEW_PRS[@]},
  "auto_safe_mode": $AUTO_SAFE,
  "close_unsafe_mode": $CLOSE_UNSAFE
}
EOF

echo ""
echo -e "${BLUE}📝 Summary saved to _OPS/OUTPUT/manual-pr-cleanup/summary-${TIMESTAMP}.json${NC}"
echo -e "${BLUE}📋 Audit log: _OPS/AUDIT/manual-pr-cleanup.log${NC}"
echo ""

exit 0
