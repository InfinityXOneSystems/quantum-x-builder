# Autonomous Multi-Agent System

This directory contains a comprehensive, intelligent, autonomous multi-agent system that operates 24/7 to maintain 100% system health and operational status.

## Overview

The system consists of three main agents that work together to automatically maintain code quality, fix issues, and ensure the system stays operational:

1. **Autonomous Code Agent** - Scans and fixes code issues automatically
2. **Validation Agent** - Reviews changes and runs comprehensive validation
3. **Healing Agent** - Implements validator feedback and self-heals the system

## Agent Architecture

### 1. Autonomous Code Agent (`autonomous-agent.js`)

**Schedule**: Every hour + on push + on PR + workflow_dispatch

**Responsibilities**:
- Scan entire codebase for issues (syntax, lint, types, security, formatting)
- Fix all code issues automatically using ESLint, Prettier
- Run security audits and apply fixes
- Update dependencies (security patches)
- Check workflow files for syntax errors
- Generate comprehensive reports

**Capabilities**:
- ESLint auto-fix
- Prettier formatting
- TypeScript type checking
- Security vulnerability detection and patching
- Dependency update detection
- Workflow syntax validation

**Usage**:
```bash
node .github/agents/autonomous-agent.js
```

**Output**: Creates `autonomous-report.json` with summary of actions taken

---

### 2. Validation Agent (`validator-agent.js`)

**Schedule**: Runs after primary agent completes + on all PRs

**Responsibilities**:
- Review all changes made by primary agent
- Run comprehensive validation suite
- Check PR quality and completeness
- Validate workflow syntax and logic
- Verify dependencies are compatible
- Approve or reject changes with detailed feedback

**Validation Checks**:
- ✅ Unit tests
- ✅ Lint verification
- ✅ TypeScript type checking
- ✅ Build verification
- ✅ Security scanning

**Usage**:
```bash
node .github/agents/validator-agent.js
```

**Output**: Creates `validation-report.json` with approval status and recommendations

---

### 3. Healing Agent (`healing-agent.js`)

**Schedule**: Runs after validator feedback + on validation failure events + every 2 hours

**Responsibilities**:
- Parse validator feedback and suggestions
- Implement all validator recommendations automatically
- Fix any issues flagged by validator
- Re-run fixes until validation passes
- Auto-heal system failures
- Ensure PRs are properly closed/merged
- Clean up failed automation attempts

**Self-Healing Capabilities**:
- Automatic lint fixes
- Automatic formatting fixes
- Security vulnerability patching
- Dependency reinstallation
- Retry logic with exponential backoff
- Circuit breaker for repeated failures

**Usage**:
```bash
node .github/agents/healing-agent.js
```

**Output**: Creates `healing-report.json` with actions taken and success status

---

## Support Agents

### System Health Check (`system-health-check.js`)

Monitors overall system health:
- Git repository health (uncommitted changes, branch count)
- Workflow file health (syntax validation)
- Dependency health (outdated packages)
- Security health (vulnerabilities)

**Usage**:
```bash
node .github/agents/system-health-check.js
```

**Output**: Creates `health-report.json` with health score (0-100) and status

---

### Auto-Merge Agent (`auto-merge.js`)

Intelligent auto-merge logic:
- Checks validation status
- Verifies approvals
- Ensures no conflicts
- Merges safe changes automatically

**Usage**:
```bash
node .github/agents/auto-merge.js
```

---

### Branch Cleanup Agent (`branch-cleanup.js`)

Cleans up repository:
- Identifies stale branches
- Lists branches for cleanup

**Usage**:
```bash
node .github/agents/branch-cleanup.js
```

---

### Issue Cleanup Agent (`issue-cleanup.js`)

Manages issues and PRs:
- Identifies stale issues
- Identifies stale PRs

**Usage**:
```bash
node .github/agents/issue-cleanup.js
```

---

## Configuration

All agents are configured via `config.json`:

```json
{
  "autonomous": {
    "enabled": true,
    "schedule": "0 * * * *",
    "autoMerge": {
      "enabled": true,
      "safeChanges": ["lint", "format", "docs", "deps-patch"],
      "requiresApproval": ["deps-minor", "deps-major", "refactor", "feature"]
    },
    "healing": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "circuitBreakerThreshold": 5
    }
  },
  "validator": {
    "enabled": true,
    "strictMode": true,
    "requiredChecks": ["test", "lint", "typecheck", "build", "security"],
    "coverageThreshold": 80
  },
  "cleanup": {
    "staleBranchDays": 30,
    "staleIssueDays": 60,
    "stalePRDays": 14
  }
}
```

### Configuration Options

#### Autonomous Settings
- `enabled`: Enable/disable autonomous agent
- `schedule`: Cron schedule for automated runs
- `autoMerge.enabled`: Enable/disable automatic PR merging
- `autoMerge.safeChanges`: Types of changes that can be auto-merged
- `autoMerge.requiresApproval`: Types of changes requiring human approval

#### Healing Settings
- `maxRetries`: Maximum number of healing attempts
- `backoffMultiplier`: Exponential backoff multiplier
- `circuitBreakerThreshold`: Number of failures before circuit breaker trips

#### Validator Settings
- `enabled`: Enable/disable validation agent
- `strictMode`: Exit with error if validation fails
- `requiredChecks`: List of checks that must pass
- `coverageThreshold`: Minimum test coverage percentage

#### Cleanup Settings
- `staleBranchDays`: Days before branch is considered stale
- `staleIssueDays`: Days before issue is considered stale
- `stalePRDays`: Days before PR is considered stale

---

## Workflows

### Autonomous Code Agent Workflow

**File**: `.github/workflows/autonomous-code-agent.yml`

**Triggers**:
- Every hour (cron)
- Push to main/develop branches
- Pull requests
- Manual dispatch

**Actions**:
1. Checkout repository
2. Setup Node.js
3. Install dependencies
4. Run autonomous agent
5. Create PR if changes detected
6. Trigger validation agent

---

### Validation Agent Workflow

**File**: `.github/workflows/validation-agent.yml`

**Triggers**:
- Called by autonomous agent workflow
- Pull request events
- Manual dispatch

**Actions**:
1. Checkout repository
2. Setup Node.js
3. Install dependencies
4. Run validation suite
5. Post validation report to PR
6. Approve or request changes
7. Trigger healing agent if needed

---

### Healing Agent Workflow

**File**: `.github/workflows/healing-agent.yml`

**Triggers**:
- Called by validation agent
- Every 2 hours (cron)
- Manual dispatch

**Actions**:
1. Checkout repository
2. Setup Node.js
3. Install dependencies
4. Run healing agent
5. Commit and push changes
6. Re-trigger validation
7. Run system health check
8. Execute cleanup tasks

---

## How It Works

### Typical Workflow

1. **Autonomous Agent runs hourly**:
   - Scans codebase for issues
   - Fixes lint, formatting, security issues
   - Creates PR with changes

2. **Validation Agent reviews PR**:
   - Runs tests, lint, typecheck, build
   - Generates validation report
   - Approves or requests changes

3. **Healing Agent responds**:
   - Reads validation feedback
   - Implements recommended fixes
   - Commits changes
   - Re-triggers validation

4. **Cycle repeats** until validation passes

5. **Auto-merge** (if enabled):
   - Merges approved PRs automatically
   - Uses squash merge for clean history

---

## Debugging

### View Agent Reports

All agents generate JSON reports in this directory:

- `autonomous-report.json` - Autonomous agent actions
- `validation-report.json` - Validation results
- `healing-report.json` - Healing actions
- `health-report.json` - System health status

### Common Issues

**Agent not running**:
- Check `config.json` - agent may be disabled
- Check workflow file syntax
- Check GitHub Actions logs

**Validation failing**:
- Check `validation-report.json` for specific failures
- Review test output, lint errors, TypeScript errors
- Ensure all dependencies are installed

**Healing not working**:
- Check `healing-report.json` for attempted actions
- Verify healing agent has write permissions
- Check for conflicting changes

**Infinite loop**:
- Circuit breaker will trip after threshold failures
- Check `maxRetries` and `circuitBreakerThreshold` in config
- Review logs to identify root cause

---

## Disabling/Enabling Features

### Disable Autonomous Agent
```json
{
  "autonomous": {
    "enabled": false
  }
}
```

### Disable Auto-Merge
```json
{
  "autonomous": {
    "autoMerge": {
      "enabled": false
    }
  }
}
```

### Disable Validation Strict Mode
```json
{
  "validator": {
    "strictMode": false
  }
}
```

### Disable Specific Checks
```json
{
  "validator": {
    "requiredChecks": ["lint", "typecheck", "build"]
  }
}
```

---

## Manual Operations

### Run Autonomous Agent Manually
```bash
node .github/agents/autonomous-agent.js
```

### Run Validation Manually
```bash
node .github/agents/validator-agent.js
```

### Run Healing Manually
```bash
node .github/agents/healing-agent.js
```

### Check System Health
```bash
node .github/agents/system-health-check.js
```

---

## Emergency Stop

To stop all autonomous operations:

1. **Disable in config**:
   ```json
   {
     "autonomous": { "enabled": false },
     "validator": { "enabled": false }
   }
   ```

2. **Disable workflows**:
   - Go to Actions tab in GitHub
   - Disable workflows manually

3. **Cancel running workflows**:
   - Go to Actions tab
   - Cancel any running workflows

---

## Custom Agent Behaviors

### Adding Custom Checks

To add custom validation checks, edit `validator-agent.js`:

```javascript
async function runCustomCheck() {
  console.log('Running custom check...');
  // Your custom logic here
  return { passed: true };
}

// Add to main validation
results.custom = await runCustomCheck();
```

### Adding Custom Healing Actions

To add custom healing actions, edit `healing-agent.js`:

```javascript
async function customHealingAction() {
  console.log('Running custom healing...');
  // Your custom logic here
  return { fixed: true };
}

// Add to healing logic
results.custom = await customHealingAction();
```

---

## Performance Considerations

- **Hourly runs** can be adjusted via cron schedule
- **Timeout limits** are set in workflow files (60 min for autonomous, 30 min for validation, 45 min for healing)
- **Circuit breaker** prevents infinite loops
- **Exponential backoff** reduces load during repeated failures
- **Continue-on-error** prevents single failures from blocking entire workflow

---

## Security Considerations

- All agents run with least-privilege permissions
- GitHub token is passed via environment variable
- Sensitive data is never logged
- Security vulnerabilities are patched automatically
- Auto-merge only works for safe changes (configurable)

---

## Maintenance

### Weekly Review
- Check agent reports for patterns
- Review auto-merged PRs
- Verify system health scores

### Monthly Review
- Update agent logic as needed
- Adjust configuration thresholds
- Review cleanup policies

---

## Support

For issues or questions:
1. Check agent report files for detailed information
2. Review GitHub Actions logs
3. Check configuration in `config.json`
4. Verify workflow files are valid YAML

---

## Version History

- **v1.0** - Initial implementation with 3-agent system
  - Autonomous code agent
  - Validation agent
  - Healing agent
  - Support agents (health, auto-merge, cleanup)
  - Comprehensive configuration
  - Full workflow integration

---

## License

Same license as the main repository.
