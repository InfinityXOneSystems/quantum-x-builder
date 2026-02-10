# Quick Reference: Disable GitHub Actions Workflows

## TL;DR

Disable GitHub Actions on all your repos except quantum-x-builder:

```bash
# 1. Set your GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# 2. Dry run (preview only)
node scripts/disable-workflows-except-qxb.js --dry-run

# 3. Actually disable (after reviewing dry-run output)
node scripts/disable-workflows-except-qxb.js --auto
```

## Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check: `repo` and `workflow`
4. Generate and copy token

## Common Commands

```bash
# Preview what will change (SAFE)
node scripts/disable-workflows-except-qxb.js --dry-run

# Confirm each repository individually
node scripts/disable-workflows-except-qxb.js --interactive

# Disable all automatically (except quantum-x-builder)
node scripts/disable-workflows-except-qxb.js --auto

# For an organization
node scripts/disable-workflows-except-qxb.js --owner InfinityXOneSystems --auto

# Show help
node scripts/disable-workflows-except-qxb.js --help
```

## What Gets Protected?

✅ **quantum-x-builder** - Actions will ALWAYS remain enabled

❌ All other repos - Actions will be disabled

## Re-enable Actions

Via GitHub UI:
1. Go to repo → Settings → Actions → General
2. Select "Allow all actions and reusable workflows"
3. Save

Via CLI:
```bash
gh api -X PUT /repos/OWNER/REPO/actions/permissions -f enabled=true
```

## Safety

- Default mode is `--dry-run` (preview only)
- quantum-x-builder is hardcoded as protected
- Clear output shows what's protected vs. processed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token error | Set `export GITHUB_TOKEN=ghp_xxx` |
| 401 Unauthorized | Token expired or invalid |
| 403 Forbidden | Token missing `repo`/`workflow` scopes |
| 0 repos found | Check `--owner` or verify access |

## Full Documentation

See [docs/DISABLE_WORKFLOWS_GUIDE.md](docs/DISABLE_WORKFLOWS_GUIDE.md) for complete documentation.
