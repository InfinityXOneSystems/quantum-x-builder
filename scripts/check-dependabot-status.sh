#!/bin/bash

##############################################################################
# Check Dependabot PR Status
# 
# Quick script to see the current state of Dependabot PRs
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Checking Dependabot PR Status${NC}"
echo "================================"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
  echo "Install: https://cli.github.com/"
  exit 1
fi

# Get open Dependabot PRs
echo -e "${BLUE}Fetching open Dependabot PRs...${NC}"
PR_LIST=$(gh pr list --author "dependabot[bot]" --state open --json number,title,labels 2>&1)

if echo "$PR_LIST" | grep -q "error"; then
  echo -e "${RED}❌ Failed to fetch PRs${NC}"
  echo "$PR_LIST"
  exit 1
fi

PR_COUNT=$(echo "$PR_LIST" | jq 'length')

if [ "$PR_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✨ No open Dependabot PRs found!${NC}"
  echo -e "${GREEN}✅ All PRs have been processed!${NC}"
  exit 0
fi

echo -e "${YELLOW}Found ${PR_COUNT} open Dependabot PRs${NC}"
echo ""

# Classify PRs
SAFE_COUNT=0
RISKY_COUNT=0
OTHER_COUNT=0

while read -r pr_json; do
  pr_number=$(echo "$pr_json" | jq -r '.number')
  pr_title=$(echo "$pr_json" | jq -r '.title')
  pr_labels=$(echo "$pr_json" | jq -r '.labels[].name' | tr '\n' ',' || echo "")
  
  # Classify
  if echo "$pr_labels" | grep -q "github-actions"; then
    echo -e "${GREEN}✓ SAFE #${pr_number}${NC}: ${pr_title}"
    SAFE_COUNT=$((SAFE_COUNT + 1))
  elif echo "$pr_title" | grep -qiE "from [0-9]+\.[0-9]+\.[0-9]+ to [0-9]+\.[0-9]+\.[0-9]+"; then
    from_version=$(echo "$pr_title" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1)
    to_version=$(echo "$pr_title" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | tail -1)
    from_major=$(echo "$from_version" | cut -d. -f1)
    to_major=$(echo "$to_version" | cut -d. -f1)
    
    if [ "$from_major" = "$to_major" ]; then
      echo -e "${GREEN}✓ SAFE #${pr_number}${NC}: ${pr_title}"
      SAFE_COUNT=$((SAFE_COUNT + 1))
    else
      echo -e "${RED}⚠ RISKY #${pr_number}${NC}: ${pr_title}"
      RISKY_COUNT=$((RISKY_COUNT + 1))
    fi
  else
    echo -e "${YELLOW}? OTHER #${pr_number}${NC}: ${pr_title}"
    OTHER_COUNT=$((OTHER_COUNT + 1))
  fi
done < <(echo "$PR_LIST" | jq -c '.[]')

echo ""
echo "================================"
echo -e "${GREEN}SAFE: ${SAFE_COUNT}${NC} (can auto-merge)"
echo -e "${RED}RISKY: ${RISKY_COUNT}${NC} (major version updates)"
echo -e "${YELLOW}OTHER: ${OTHER_COUNT}${NC} (needs review)"
echo "================================"
echo ""

if [ "$SAFE_COUNT" -gt 0 ]; then
  echo -e "${BLUE}💡 To merge safe PRs:${NC}"
  echo "   ./scripts/manual-dependabot-cleanup.sh --auto-safe"
  echo ""
fi

if [ "$RISKY_COUNT" -gt 0 ]; then
  echo -e "${BLUE}💡 To close risky PRs:${NC}"
  echo "   ./scripts/manual-dependabot-cleanup.sh --close-all-unsafe"
  echo ""
fi

echo -e "${BLUE}📖 For more options:${NC}"
echo "   ./scripts/manual-dependabot-cleanup.sh --help"
echo "   See: DEPENDABOT_FIX_INSTRUCTIONS.md"
echo ""
