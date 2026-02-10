# Disable Workflows Script - Implementation Summary

## Overview

Created a comprehensive Node.js script to disable GitHub Actions workflows across all repositories in a GitHub account **EXCEPT** for `quantum-x-builder`.

## Files Created

### 1. Main Script
**Location:** `scripts/disable-workflows-except-qxb.js`
- Pure Node.js implementation (no external dependencies required)
- Uses GitHub REST API v3
- ~450 lines with comprehensive error handling

### 2. Full Documentation
**Location:** `docs/DISABLE_WORKFLOWS_GUIDE.md`
- Complete usage guide
- Prerequisites and setup instructions
- Troubleshooting section
- Security best practices
- Examples and workflows

### 3. Quick Reference
**Location:** `DISABLE_WORKFLOWS_QUICK.md`
- TL;DR commands
- Common usage patterns
- Quick troubleshooting

## Features

### Safety Features
✅ **Automatic Protection**: `quantum-x-builder` is hardcoded and will never be disabled
✅ **Dry-Run Default**: Defaults to preview mode if no mode specified
✅ **Clear Reporting**: Shows protected vs. processed repositories
✅ **Error Handling**: Graceful handling of API failures
✅ **Rate Limiting**: Built-in delays to avoid API throttling

### Operation Modes
- **Dry-Run Mode** (`--dry-run`): Preview changes without applying
- **Interactive Mode** (`--interactive`): Confirm each repository individually
- **Automatic Mode** (`--auto`): Disable all at once (except quantum-x-builder)

### Flexibility
- Works with personal accounts and organizations
- No external npm dependencies (pure Node.js)
- Supports environment variables and command-line arguments
- Cross-platform compatible (Linux, Mac, Windows)

## Usage Examples

### 1. Safe Preview (Recommended First)
```bash
export GITHUB_TOKEN=ghp_your_token_here
node scripts/disable-workflows-except-qxb.js --dry-run
```

### 2. Interactive Mode
```bash
node scripts/disable-workflows-except-qxb.js --interactive
```

### 3. Automatic Disable
```bash
node scripts/disable-workflows-except-qxb.js --auto
```

### 4. For Organization
```bash
node scripts/disable-workflows-except-qxb.js --owner InfinityXOneSystems --auto
```

## Requirements

- Node.js 16+ (uses built-in `https` and `readline` modules)
- GitHub Personal Access Token with scopes:
  - `repo` - Full control of private repositories
  - `workflow` - Update GitHub Action workflows

## How to Get a Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Disable Workflows Script"
4. Select scopes: `repo`, `workflow`
5. Generate and copy the token

## What It Does

The script:
1. Authenticates with GitHub API
2. Lists all repositories for the specified owner
3. Filters out `quantum-x-builder` (hardcoded protection)
4. Checks which repositories have Actions enabled
5. Disables Actions for each repository (except quantum-x-builder)
6. Provides detailed reporting of results

## API Calls Made

- `GET /user` - Get authenticated user info
- `GET /users/{username}/repos` - List user repositories
- `GET /orgs/{org}/repos` - List organization repositories
- `GET /repos/{owner}/{repo}/actions/permissions` - Check Actions status
- `PUT /repos/{owner}/{repo}/actions/permissions` - Disable Actions

## Output Example

```
╔════════════════════════════════════════════════════════════════╗
║   Disable GitHub Actions - Except quantum-x-builder          ║
╚════════════════════════════════════════════════════════════════╝

🔐 Authenticated as: Neo
📁 Target owner: InfinityXOneSystems
🛡️  Protected repository: quantum-x-builder
⚙️  Mode: DRY RUN

📋 Fetching repositories for: InfinityXOneSystems...
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

📋 Found 15 repositories with Actions enabled

🔧 Processing repositories...
  [DRY RUN] Would disable Actions for: InfinityXOneSystems/repo1
  [DRY RUN] Would disable Actions for: InfinityXOneSystems/repo2
  ...

╔════════════════════════════════════════════════════════════════╗
║                    Operation Summary                          ║
╚════════════════════════════════════════════════════════════════╝

📊 Results:
   Would disable: 15
   Protected: 1 (quantum-x-builder)

💡 This was a dry run. Use --auto or --interactive to apply changes.
```

## Security Considerations

- Token should be kept secure and never committed
- Use environment variables for token storage
- Script includes rate limiting to be nice to GitHub API
- All API calls are logged for audit purposes
- Protected repositories are hardcoded (can't be accidentally disabled)

## Testing Performed

✅ Help command displays correctly
✅ Error handling works (missing token)
✅ Script is executable
✅ No external dependencies required
✅ Clear and informative output

## Next Steps for Users

1. Read the full guide: `docs/DISABLE_WORKFLOWS_GUIDE.md`
2. Get a GitHub token with required scopes
3. Run dry-run mode first to preview changes
4. Choose appropriate mode based on needs
5. Verify quantum-x-builder remains protected

## Notes

- The script does NOT delete workflows, it just disables them
- Workflows can be re-enabled via GitHub UI or API
- quantum-x-builder is permanently protected in the script
- No npm packages needed - uses only Node.js built-ins
- Compatible with GitHub Free, Pro, Team, and Enterprise
