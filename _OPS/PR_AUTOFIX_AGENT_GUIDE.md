# PR Auto-Fix Agent - Usage Guide

## Overview

The PR Auto-Fix Agent is an autonomous system that automatically fixes and heals all open Pull Requests with no assignee in the repository.

## Features

### Automatic PR Discovery
- Finds all open PRs with no assignee (`is:pr is:open no:assignee`)
- Uses GitHub CLI for efficient querying
- Processes up to 10 PRs per run (configurable)

### Auto-Fix Capabilities
- **Code Formatting**: Runs Prettier on all supported file types
- **Linting**: Runs ESLint with auto-fix enabled
- **Security Patches**: Runs `npm audit fix` to patch vulnerabilities
- **Dependency Management**: Installs and updates dependencies as needed

### Safety Features
- **Emergency Kill-Switch**: Respects `_OPS/SAFETY/KILL_SWITCH.json`
- **Rollback Tokens**: Every change includes a unique rollback token
- **Audit Trail**: Detailed logs in `_OPS/AUDIT/pr-autofix-agent.log`
- **Rate Limiting**: Maximum 10 PRs per run to avoid API limits
- **Git Safety**: Always returns to original branch after processing

## Usage

### Automatic Execution
The agent runs automatically every 4 hours via GitHub Actions:
- Schedule: `0 */4 * * *` (6 times per day)
- Total API calls: ~60-90 per day (within free tier limits)

### Manual Execution
Trigger manually through GitHub Actions:

1. Go to **Actions** → **PR Auto-Fix Agent**
2. Click **Run workflow**
3. Configure options:
   - **Max PRs**: Number of PRs to process (default: 10)
   - **Dry Run**: Test mode without commits (default: false)

### Command Line Usage
```bash
# Make sure you're authenticated with GitHub CLI
gh auth login

# Run the agent
cd /path/to/quantum-x-builder
node .github/agents/pr-autofix-agent.js
```

## Configuration

Edit `.github/agents/config.json` to customize behavior:

```json
{
  "pr_autofix": {
    "enabled": true,
    "target_unassigned_only": true,
    "auto_label": true,
    "auto_comment": true,
    "safe_fixes_only": true,
    "max_prs_per_run": 10
  },
  "rate_limits": {
    "max_prs_per_run": 10,
    "backoff_on_rate_limit": true
  }
}
```

## How It Works

### Processing Flow

1. **Emergency Check**: Verify kill-switch is not active
2. **PR Discovery**: Query GitHub for unassigned open PRs
3. **For Each PR**:
   - Fetch and checkout the PR branch
   - Install dependencies if needed
   - Apply auto-fixes (Prettier, ESLint, npm audit)
   - Commit changes with rollback token
   - Push to PR branch
   - Add comment and label to PR
   - Log to audit trail
4. **Summary**: Generate report and upload artifacts

### What Gets Fixed

#### Prettier Formatting
- JavaScript/TypeScript files (.js, .ts, .jsx, .tsx)
- JSON files (.json)
- Markdown files (.md)
- YAML files (.yml, .yaml)

#### ESLint Rules
- All auto-fixable ESLint rules
- Unused imports
- Formatting issues
- Code style violations

#### Security Issues
- Dependency vulnerabilities (patch level)
- Automated security patches via `npm audit fix`

### What Does NOT Get Fixed
- Merge conflicts (requires manual intervention)
- Major version updates (too risky)
- Test failures (needs human review)
- Logic errors or bugs
- Breaking changes

## Audit Trail

Every run creates detailed logs:

### Audit Log Location
```
_OPS/AUDIT/pr-autofix-agent.log
```

### Audit Entry Format
```json
{
  "timestamp": "2026-02-11T05:00:00.000Z",
  "pr_number": 123,
  "pr_title": "Fix: Update dependencies",
  "pr_author": "dependabot[bot]",
  "pr_branch": "dependabot/npm_and_yarn/example-1.2.3",
  "rollback_token": "qxb-autofix-2026-02-11T05-00-00",
  "actions_taken": [
    "checked_out_branch",
    "installed_dependencies",
    "applied_auto_fixes",
    "committed_and_pushed_fixes",
    "added_pr_comment"
  ],
  "status": "completed"
}
```

### Summary Report Location
```
_OPS/OUTPUT/pr-autofix-summary-{timestamp}.json
```

## Rollback Procedures

If the agent makes unwanted changes, follow these steps:

### 1. Emergency Stop
Activate the kill-switch immediately:
```bash
echo '{"kill_switch": "ARMED"}' > _OPS/SAFETY/KILL_SWITCH.json
git add _OPS/SAFETY/KILL_SWITCH.json
git commit -m "emergency: activate kill-switch"
git push
```

### 2. Identify Affected PRs
Check the audit log:
```bash
grep "rollback_token" _OPS/AUDIT/pr-autofix-agent.log
```

### 3. Revert Changes
For each affected PR:
```bash
# Find the rollback token from audit log
ROLLBACK_TOKEN="qxb-autofix-2026-02-11T05-00-00"

# Checkout the PR branch
gh pr checkout <PR_NUMBER>

# Find the commit with the rollback token
git log --grep="$ROLLBACK_TOKEN" --oneline

# Revert the commit
git revert <commit_hash>
git push
```

### 4. Alternative: Force Reset
If reverting doesn't work:
```bash
gh pr checkout <PR_NUMBER>

# Reset to the commit before auto-fix
git reset --hard HEAD~1
git push --force
```

## Emergency Stop

### Activate Kill-Switch
```bash
# Method 1: JSON file
echo '{"kill_switch": "ARMED"}' > _OPS/SAFETY/KILL_SWITCH.json

# Method 2: Update existing file
jq '.kill_switch = "ARMED"' _OPS/SAFETY/KILL_SWITCH.json > temp.json
mv temp.json _OPS/SAFETY/KILL_SWITCH.json
```

### Deactivate Kill-Switch
```bash
echo '{"kill_switch": "SAFE"}' > _OPS/SAFETY/KILL_SWITCH.json
```

The agent checks the kill-switch before every run and exits immediately if active.

## Monitoring

### GitHub Actions
- View run history: Actions → PR Auto-Fix Agent
- Check summaries for each run
- Download artifacts for detailed logs

### Artifacts
Each run uploads artifacts retained for 90 days:
- `pr-autofix-summary-*.json` - Summary report
- `pr-autofix-agent.log` - Full audit log

### Notifications
The agent adds comments to PRs when fixes are applied:
```
🤖 Auto-Fix Bot

Automatically applied code fixes (lint, format, security).

Rollback Token: `qxb-autofix-2026-02-11T05-00-00`
```

## Troubleshooting

### Agent Not Running
1. Check workflow is enabled: `.github/workflows/pr-autofix-agent.yml`
2. Verify kill-switch is not active
3. Check GitHub Actions permissions
4. Review workflow logs for errors

### PRs Not Being Fixed
1. Verify PRs have no assignee
2. Check if PR branch is protected
3. Verify bot has write permissions
4. Review audit log for errors

### Failed to Push Changes
1. Verify `GIT_PAT` secret is set
2. Check branch protection rules
3. Verify bot account permissions
4. Check for merge conflicts

### Rate Limiting
If you hit rate limits:
1. Reduce `max_prs_per_run` in config.json
2. Increase schedule interval (e.g., every 6 hours)
3. Use GitHub PAT with higher rate limits

## Best Practices

1. **Start Small**: Begin with `max_prs_per_run: 5` and increase gradually
2. **Monitor First Week**: Watch audit logs and PR comments closely
3. **Use Dry Run**: Test with `dry_run: true` before full automation
4. **Keep Kill-Switch Ready**: Know how to activate it quickly
5. **Review Rollback Tokens**: Keep audit logs for at least 30 days
6. **Rate Limit Awareness**: Don't exceed GitHub API limits
7. **Manual Review**: Still review auto-fixed PRs before merging

## Integration with Other Agents

The PR Auto-Fix Agent works alongside:
- **Validation Agent**: Validates code quality after fixes
- **Healing Agent**: Attempts additional healing if validation fails
- **Autonomous Agent**: Maintains overall code quality
- **Bulk PR Processor**: Handles Dependabot PRs separately

## Security Considerations

- Agent only applies safe, non-breaking fixes
- All changes are committed with clear rollback tokens
- Emergency kill-switch for immediate stop
- Detailed audit trail for accountability
- Limited to 10 PRs per run to prevent abuse
- Respects branch protection rules

## Support

For issues or questions:
1. Check audit logs: `_OPS/AUDIT/pr-autofix-agent.log`
2. Review workflow runs in GitHub Actions
3. Check kill-switch status
4. Consult `.github/agents/README.md`
5. Contact repository maintainers

## Version History

- **v1.0.0** (2026-02-11): Initial implementation
  - PR discovery for unassigned PRs
  - Auto-fix with Prettier, ESLint, npm audit
  - Audit logging and rollback tokens
  - GitHub Actions workflow integration
  - Emergency kill-switch support
