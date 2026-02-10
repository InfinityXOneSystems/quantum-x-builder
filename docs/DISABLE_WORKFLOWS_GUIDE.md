# Disable GitHub Actions Workflows - Except quantum-x-builder

## Overview

This guide explains how to use the `disable-workflows-except-qxb.js` script to disable GitHub Actions workflows across all your repositories **except** for `quantum-x-builder`.

## Why Use This Script?

- **Batch Operations**: Disable Actions for multiple repositories at once
- **Safety**: Automatically protects `quantum-x-builder` from being disabled
- **Flexibility**: Supports dry-run, interactive, and automatic modes
- **Audit Trail**: Clear reporting of what was changed

## Prerequisites

### 1. Node.js
Ensure you have Node.js 16+ installed:
```bash
node --version
```

### 2. GitHub Personal Access Token

Create a GitHub Personal Access Token with the following permissions:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows

**How to create a token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `Disable Workflows Script`
4. Select scopes: `repo`, `workflow`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### 3. Set Environment Variable

```bash
# Linux/Mac
export GITHUB_TOKEN=ghp_your_token_here

# Windows (PowerShell)
$env:GITHUB_TOKEN="ghp_your_token_here"

# Windows (CMD)
set GITHUB_TOKEN=ghp_your_token_here
```

## Usage

### Quick Start

```bash
# Navigate to repository
cd /path/to/quantum-x-builder

# Run in dry-run mode (safe preview)
node scripts/disable-workflows-except-qxb.js --dry-run
```

### Modes of Operation

#### 1. Dry Run Mode (Recommended First)
Preview what will be changed without making any modifications:

```bash
node scripts/disable-workflows-except-qxb.js --dry-run
```

**Output Example:**
```
✅ Found 25 repositories
📊 Repository Summary:
   Total repositories: 25
   Protected (excluded): 1
   Will be processed: 24

🛡️  Protected repositories (Actions will remain enabled):
   ✓ InfinityXOneSystems/quantum-x-builder

🔍 Checking which repositories have Actions enabled...
   • InfinityXOneSystems/repo1 - Actions ENABLED
   • InfinityXOneSystems/repo2 - Actions ENABLED
   • InfinityXOneSystems/repo3 - Actions already disabled
...
```

#### 2. Interactive Mode
Confirm each repository individually:

```bash
node scripts/disable-workflows-except-qxb.js --interactive
```

You'll be prompted for each repository:
```
Disable Actions for InfinityXOneSystems/repo1? (y/N): y
✅ Disabled Actions for: InfinityXOneSystems/repo1

Disable Actions for InfinityXOneSystems/repo2? (y/N): n
⏭️  Skipped: InfinityXOneSystems/repo2
```

#### 3. Automatic Mode
Disable Actions for all repositories (except quantum-x-builder) without prompts:

```bash
node scripts/disable-workflows-except-qxb.js --auto
```

**⚠️ Warning:** This will disable Actions on ALL repositories except quantum-x-builder!

### Command-Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview changes without applying them (default) |
| `--interactive` | `-i` | Confirm each repository before disabling |
| `--auto` | `-a` | Automatically disable all (except quantum-x-builder) |
| `--owner <name>` | `-o` | Specify GitHub owner/organization |
| `--token <token>` | `-t` | Provide token directly (alternative to env var) |
| `--help` | `-h` | Show help message |

### Advanced Examples

#### Specify Organization
```bash
node scripts/disable-workflows-except-qxb.js --owner InfinityXOneSystems --auto
```

#### Provide Token via Argument
```bash
node scripts/disable-workflows-except-qxb.js --token ghp_xxxxx --dry-run
```

#### Full Command (All Options)
```bash
GITHUB_TOKEN=ghp_xxxxx node scripts/disable-workflows-except-qxb.js \
  --owner InfinityXOneSystems \
  --auto
```

## What Gets Disabled?

The script calls the GitHub API to:
1. Set `enabled: false` for GitHub Actions on each repository
2. This prevents:
   - Workflow runs from being triggered
   - Scheduled workflows from executing
   - Manual workflow dispatches

**Note:** This does NOT delete workflows, it just disables them.

## Protected Repositories

The following repositories are **automatically protected** and will NEVER have Actions disabled:

- `quantum-x-builder` (case-insensitive, matches repository name only regardless of owner)

**Note**: Protection is based on the repository name (`quantum-x-builder`), not the full path (e.g., `owner/quantum-x-builder`). This means `quantum-x-builder` will be protected regardless of which account or organization owns it.

You can verify protection by checking the script output:
```
🛡️  Protected repositories (Actions will remain enabled):
   ✓ InfinityXOneSystems/quantum-x-builder
```

## Safety Features

1. **Dry Run Default**: If no mode is specified, defaults to `--dry-run`
2. **Explicit Protection**: quantum-x-builder is hardcoded as excluded
3. **Clear Reporting**: Shows which repos are protected vs. processed
4. **API Error Handling**: Gracefully handles API failures
5. **Rate Limiting**: Includes delays to avoid hitting GitHub API limits

## Troubleshooting

### Error: GITHUB_TOKEN required
**Solution:** Set the `GITHUB_TOKEN` environment variable or use `--token`
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### Error: 401 Unauthorized
**Problem:** Token is invalid or expired
**Solution:** 
1. Check token is correct
2. Verify token hasn't expired
3. Ensure token has `repo` and `workflow` scopes

### Error: 403 Forbidden
**Problem:** Token doesn't have required permissions
**Solution:** Recreate token with `repo` and `workflow` scopes

### Error: 404 Not Found
**Problem:** Repository doesn't exist or you don't have access
**Solution:** Verify:
1. Repository name is correct
2. You have access to the repository
3. Organization name is correct (if applicable)

### Script finds 0 repositories
**Problem:** Owner/organization not found or no access
**Solution:**
1. Check `--owner` parameter is correct
2. Verify you have access to the organization
3. Try without `--owner` to use your personal account

## Re-enabling GitHub Actions

If you need to re-enable Actions on a repository:

### Via GitHub UI
1. Go to repository → Settings → Actions → General
2. Under "Actions permissions", select "Allow all actions and reusable workflows"
3. Click "Save"

### Via GitHub CLI
```bash
gh api -X PUT /repos/OWNER/REPO/actions/permissions \
  -f enabled=true
```

### Via Script
Create a simple script or modify this one to set `enabled: true` instead of `false`.

## Verification

After running the script, verify Actions were disabled:

### Check Individual Repository
```bash
gh api /repos/OWNER/REPO/actions/permissions
```

### Check via UI
1. Go to repository
2. Click "Actions" tab
3. Should see: "Workflows are disabled"

## Best Practices

1. **Always run dry-run first**: See what will change before applying
2. **Use interactive mode for sensitive repos**: Review each one individually
3. **Verify quantum-x-builder protection**: Check it's listed in protected repos
4. **Keep token secure**: Never commit tokens to version control
5. **Use short-lived tokens**: Set expiration when creating tokens
6. **Document your changes**: Keep notes on why Actions were disabled

## Example Workflows

### Safe Exploration
```bash
# Step 1: Dry run to see what would happen
GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --dry-run

# Step 2: Review output carefully

# Step 3: Interactive mode to selectively disable
GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --interactive
```

### Bulk Disable (Use with Caution)
```bash
# Step 1: Dry run
GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --dry-run

# Step 2: Confirm output looks correct

# Step 3: Execute
GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --auto

# Step 4: Verify quantum-x-builder is still active
gh api /repos/InfinityXOneSystems/quantum-x-builder/actions/permissions
```

## Support

For issues or questions:
1. Check this documentation
2. Review script help: `node scripts/disable-workflows-except-qxb.js --help`
3. Examine script source code for detailed comments
4. Check GitHub API documentation: https://docs.github.com/en/rest/actions

## Security Notes

- **Never commit `GITHUB_TOKEN` to version control**
- Store tokens securely (use environment variables or secret managers)
- Rotate tokens regularly
- Use minimum required permissions
- Consider using GitHub Apps for production scenarios
- Audit which repositories were modified

## Rollback Plan

If you need to undo changes:

1. **Manual Rollback**: Re-enable Actions via GitHub UI for each repo
2. **Script Rollback**: Modify script to set `enabled: true` and run again
3. **Selective Rollback**: Use interactive mode with an "enable" variant

## License

This script is part of the quantum-x-builder project and follows the same license.
