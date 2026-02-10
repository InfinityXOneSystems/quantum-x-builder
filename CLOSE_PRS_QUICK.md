# Quick PR Closure Reference

## 🎯 Goal: Close 14 Open Pull Requests

---

## ⚡ FASTEST METHOD: GitHub Web Interface

**URL**: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls

1. Click each PR → Scroll down → Click "Close pull request"
2. Repeat 14 times
3. Done! (~2 minutes)

---

## 🤖 AUTOMATED: One Command

```bash
# Run the provided script
./scripts/close-all-prs.sh
```

This will:
- ✅ List all open PRs
- ✅ Ask for confirmation
- ✅ Close all PRs with comments
- ✅ Show summary
- ✅ Optionally delete branches

---

## 🔧 MANUAL: GitHub CLI

```bash
# See what's open
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open

# Close all at once
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open --json number --jq '.[].number' | \
while read pr; do
    gh pr close "$pr" --repo InfinityXOneSystems/quantum-x-builder --comment "Closing unused PR"
    echo "Closed PR #$pr"
    sleep 1
done
```

---

## 📋 What You Need

**For Web Interface**: Just your GitHub login

**For Automated Script**: 
- GitHub CLI installed: `gh auth login`
- Write access to repository

**For API Method**: Personal Access Token with `repo` scope

---

## ✅ Verify Completion

```bash
# Should show 0
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open | wc -l
```

Or check: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls

---

## 🆘 Problems?

**"Permission denied"**: You need write access to the repository

**"gh not found"**: Install GitHub CLI from https://cli.github.com/

**Rate limiting**: Add `sleep 1` between closures

**Simplest solution**: Use the web interface! 

---

## 📄 Full Documentation

See `docs/PR_CLOSURE_GUIDE.md` for complete details.

---

**Quick Decision Tree**:

```
Do you have 2 minutes?
├─ YES → Use GitHub web interface (easiest!)
└─ NO  → Run ./scripts/close-all-prs.sh (automated)
```
