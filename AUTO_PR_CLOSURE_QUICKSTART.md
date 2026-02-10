# 🤖 Automated PR Closure - Quick Start

## ⚡ Close All 14 PRs in 3 Clicks (30 seconds)

### Step 1: Go to Workflow
**URL**: https://github.com/InfinityXOneSystems/quantum-x-builder/actions/workflows/auto-close-prs.yml

### Step 2: Click "Run workflow" (blue button, top right)

### Step 3: Click "Run workflow" again (green button in dropdown)

**That's it!** The workflow automatically:
- Finds all 14 open PRs
- Closes them with a comment
- Shows you a summary

---

## 🎛️ Options (All Optional - Defaults Work Fine)

When you click "Run workflow", you can customize:

| Option | Default | Description |
|--------|---------|-------------|
| **PR numbers** | (empty) | Leave empty to close ALL PRs |
| **Close reason** | "Bulk PR cleanup..." | Reason shown in PR comment |
| **Delete branches** | `false` | Set to `true` to also delete branches |
| **Dry run** | `false` | Set to `true` to test without closing |

**Recommendation**: Just use the defaults for your first run!

---

## 🔍 Want to Test First?

Set **Dry run** to `true` - this shows what would be closed without actually closing anything.

---

## ✅ Verify It Worked

After the workflow completes:
```bash
gh pr list --repo InfinityXOneSystems/quantum-x-builder --state open
```

Or check: https://github.com/InfinityXOneSystems/quantum-x-builder/pulls

Should show 0 open PRs!

---

## 📖 Full Documentation

See `docs/AUTO_PR_CLOSURE_GUIDE.md` for complete details, troubleshooting, and advanced options.

---

## 🎯 Visual Summary

```
You → Click "Run workflow" → GitHub Actions closes all PRs → Done! ✅
```

**Time**: 30 seconds  
**Effort**: 3 clicks  
**Result**: 14 PRs closed automatically

---

**Need help?** Check the full guide: `docs/AUTO_PR_CLOSURE_GUIDE.md`
