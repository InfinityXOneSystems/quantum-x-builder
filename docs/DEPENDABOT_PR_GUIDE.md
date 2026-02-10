# Dependabot PR Management Guide

## Problem: Open Dependabot PRs Not Being Processed

If you have multiple open Dependabot PRs that aren't going away, this guide will help you understand why and how to fix it.

## Why PRs Aren't Being Processed Automatically

The repository has a **Bulk PR Processor** workflow (`.github/workflows/bulk-pr-processor.yml`) that should automatically handle Dependabot PRs, but it needs to be triggered. The workflow:

- **Scheduled Run**: Every Monday at 9 AM UTC (in safe-only mode)
- **Manual Trigger**: Can be run anytime via GitHub Actions UI
- **Safety Features**: Has a kill-switch check and dry-run mode

### Common Issues

1. **Workflow Never Ran**: Check if the workflow has any runs in GitHub Actions
2. **Kill-Switch Active**: Check `_OPS/SAFETY/KILL_SWITCH.json` for `DISABLE_AUTONOMY`
3. **Permissions**: Workflow needs `contents: write` and `pull-requests: write`
4. **GitHub Token**: Requires `GIT_PAT` secret or default `github.token`

## Quick Solutions

### Solution 1: Manual Cleanup Script (Recommended)

We've created a dedicated script for manual PR cleanup:

```bash
# Interactive mode - shows options
./scripts/manual-dependabot-cleanup.sh

# Auto-merge safe PRs (GitHub Actions + patch/minor updates)
./scripts/manual-dependabot-cleanup.sh --auto-safe

# Close risky PRs (major version updates)
./scripts/manual-dependabot-cleanup.sh --close-all-unsafe

# Show help
./scripts/manual-dependabot-cleanup.sh --help
```

**Prerequisites:**
- GitHub CLI (`gh`) installed: https://cli.github.com/
- Authenticated: `gh auth login`
- Repository access with PR merge permissions

### Solution 2: Trigger the Bulk PR Processor Workflow

1. Go to **GitHub Actions** tab in your repository
2. Select **"Bulk Dependabot PR Processor"** workflow
3. Click **"Run workflow"** button
4. Choose options:
   - **Dry run**: `true` (to preview) or `false` (to apply)
   - **Safe only**: `true` (recommended) or `false`
5. Click **"Run workflow"**

### Solution 3: Use the Existing Bulk PR Processor

If you have the environment set up:

```bash
# Dry run first (see what would happen)
bash scripts/bulk-pr-processor.sh --dry-run --safe-only

# Actually process (merge safe PRs)
bash scripts/bulk-pr-processor.sh --safe-only

# Process all PRs (including risky ones)
bash scripts/bulk-pr-processor.sh
```

## PR Classification

The scripts automatically classify PRs into three categories:

### ✅ SAFE (Auto-Merge Candidates)
- **GitHub Actions updates**: Any Actions version bump (e.g., v4 → v6)
- **Patch updates**: Same major version (e.g., 1.2.3 → 1.2.5)
- **Minor updates**: Same major version (e.g., 1.2.0 → 1.5.0)

**Examples:**
- `actions/checkout from 4 to 6` ✅
- `actions/upload-artifact from 4 to 6` ✅
- `dotenv from 16.6.1 to 16.8.0` ✅

### ⚠️ RISKY (Require Testing)
- **Major version updates**: Different major version (e.g., 4.x → 5.x)
- May include breaking changes
- Should be tested before merging

**Examples:**
- `express from 4.22.1 to 5.2.1` ⚠️
- `vite from 6.4.1 to 7.3.1` ⚠️
- `uuid from 9.0.1 to 13.0.0` ⚠️
- `googleapis from 128.0.0 to 171.4.0` ⚠️

### 🔍 REVIEW (Manual Review Required)
- PRs that don't fit clear patterns
- Complex or unclear updates
- Should be reviewed individually

## Current Open PRs (as of investigation)

### Safe to Auto-Merge (6 PRs)
1. **#9** - `actions/checkout from 4 to 6`
2. **#8** - `google-github-actions/setup-gcloud from 2 to 3`
3. **#7** - `actions/upload-artifact from 4 to 6`
4. **#6** - `actions/upload-pages-artifact from 3 to 4`
5. **#5** - `actions/configure-pages from 4 to 5`
6. **#4** - `google-github-actions/auth from 2 to 3`

### Risky - Require Testing (10 PRs)
1. **#19** - `@types/node from 22.19.8 to 25.2.2` (frontend)
2. **#18** - `dotenv from 16.6.1 to 17.2.4` (backend) - **MAJOR**
3. **#17** - `typescript from 5.8.3 to 5.9.3` (frontend)
4. **#16** - `googleapis from 128.0.0 to 171.4.0` (backend) - **HUGE JUMP**
5. **#15** - `vite from 6.4.1 to 7.3.1` (frontend) - **MAJOR**
6. **#14** - `node-cron from 3.0.3 to 4.2.1` (backend) - **MAJOR**
7. **#13** - `uuid from 9.0.1 to 13.0.0` (backend) - **HUGE JUMP**
8. **#12** - `express from 4.22.1 to 5.2.1` (backend) - **MAJOR**
9. **#11** - `typescript from 5.6.3 to 5.9.3` (website)
10. **#10** - `chokidar from 3.6.0 to 5.0.0` (backend) - **MAJOR**

## Recommended Action Plan

### Step 1: Merge Safe PRs Immediately
```bash
./scripts/manual-dependabot-cleanup.sh --auto-safe
```

This will merge all 6 GitHub Actions updates, which are safe and don't require testing.

### Step 2: Handle Risky PRs Individually

For major version updates, you have two options:

**Option A: Test and Merge** (Recommended for important updates)
1. Check out the PR branch
2. Run tests: `npm test` (in backend/frontend/website)
3. Check for breaking changes in the package changelog
4. Merge if tests pass

**Option B: Close and Recreate Later** (For non-critical updates)
```bash
# Close all risky PRs
./scripts/manual-dependabot-cleanup.sh --close-all-unsafe
```

Then configure Dependabot to ignore major updates:

```yaml
# .github/dependabot.yml
ignore:
  - dependency-name: "*"
    update-types: ["version-update:semver-major"]
```

### Step 3: Enable Automated Processing

To prevent this from happening again:

1. **Verify the scheduled workflow**: Check that the workflow ran on Monday
2. **Set up notifications**: Get alerts when PRs accumulate
3. **Review the kill-switch**: Ensure `_OPS/SAFETY/KILL_SWITCH.json` doesn't have `DISABLE_AUTONOMY`

## Testing Major Updates

For risky PRs, use this testing checklist:

```bash
# Example: Testing Express 5 update (PR #12)
cd backend
git fetch origin pull/12/head:pr-12
git checkout pr-12

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Start server and test manually
npm start

# If everything works, merge the PR
gh pr merge 12 --squash
```

## Preventing Future Accumulation

### Configure Dependabot Properly

Edit `.github/dependabot.yml`:

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5  # Limit concurrent PRs
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]  # Skip major updates
```

### Enable Auto-Merge for Safe PRs

Configure GitHub to auto-merge Dependabot PRs when CI passes:

```bash
gh pr merge --auto --squash <PR_NUMBER>
```

### Set Up the Scheduled Workflow

The bulk processor runs every Monday at 9 AM UTC. Verify it's enabled:

1. Go to **Actions** → **Bulk Dependabot PR Processor**
2. Check workflow runs history
3. Ensure no failures or disabled state

## Troubleshooting

### Error: "gh: command not found"

Install GitHub CLI:
- **Mac**: `brew install gh`
- **Linux**: https://cli.github.com/manual/installation
- **Windows**: https://cli.github.com/

Then authenticate: `gh auth login`

### Error: "Not mergeable"

The PR has conflicts or failing checks:
1. Check PR status: `gh pr view <NUMBER>`
2. Rebase if needed: `gh pr ready <NUMBER> --auto-merge`
3. Wait for CI to pass

### Error: "Permission denied"

You need write access to the repository:
1. Check your permissions in repository settings
2. Verify `GIT_PAT` secret has correct scopes
3. Use a token with `repo` and `workflow` scopes

### Kill-Switch is Blocking

If the kill-switch is active:

1. Check the status:
```bash
cat _OPS/SAFETY/KILL_SWITCH.json
```

2. If it shows `"kill_switch": "ARMED"` but NOT `"DISABLE_AUTONOMY"`, it's okay
3. If it shows `"DISABLE_AUTONOMY"`, you need to manually process PRs

## Audit Trail

All PR operations are logged to:
- **Audit Log**: `_OPS/AUDIT/manual-pr-cleanup.log`
- **Summary**: `_OPS/OUTPUT/manual-pr-cleanup/summary-<timestamp>.json`

Each operation includes a rollback token for tracking.

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Review audit logs in `_OPS/AUDIT/`
3. Run the manual script with `--help` for options
4. Verify GitHub CLI authentication: `gh auth status`

## References

- **Bulk PR Processor Script**: `scripts/bulk-pr-processor.sh`
- **Manual Cleanup Script**: `scripts/manual-dependabot-cleanup.sh`
- **Workflow**: `.github/workflows/bulk-pr-processor.yml`
- **Dependabot Config**: `.github/dependabot.yml`
