# Natural Language Control System

**Complete Guide to Natural Language Repository Control via ChatGPT, Google Gemini, and GitHub Mobile**

Version: 1.0.0  
Last Updated: 2026-02-11

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)
5. [ChatGPT Integration](#chatgpt-integration)
6. [Google Gemini Integration](#google-gemini-integration)
7. [GitHub Mobile Integration](#github-mobile-integration)
8. [Supported Commands](#supported-commands)
9. [Security & Authentication](#security--authentication)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)
13. [FAQ](#faq)

---

## Overview

The Natural Language Control System enables complete repository control through conversational commands. Control the Quantum-X-Builder repository using natural language via:

- **ChatGPT**: OpenAI Custom Actions
- **Google Gemini**: Function calling
- **GitHub Mobile**: Workflow shortcuts
- **Manual**: Direct workflow dispatch

### What You Can Do

Execute any repository operation using natural language:

```
"create a branch called feature/new-dashboard"
"open a PR from develop to main with title 'Release v2.0'"
"create an issue for bug tracking"
"update README.md with new installation instructions"
"trigger the deployment workflow"
"add collaborator alice with write access"
"enable GitHub Pages"
```

---

## Features

### ✅ Comprehensive Operations

- **Branch Management**: Create, delete, switch branches
- **Pull Requests**: Create, merge, close PRs
- **Issues**: Create, close, reopen, label issues
- **File Operations**: Create, update, delete files
- **Workflow Control**: Trigger, enable, disable workflows
- **Repository Settings**: Update description, topics, enable features
- **Collaborator Management**: Add, remove collaborators
- **Deployment**: Trigger deployments to environments
- **Security**: List secrets (read-only)

### 🔐 Security Features

- **Authentication**: API key, bearer token, webhook signature validation
- **Rate Limiting**: Per-source and global rate limits
- **Audit Logging**: Complete audit trail for all operations
- **Kill Switch**: Emergency stop mechanism
- **Permission Boundaries**: Auto-approved vs. requires-approval operations
- **Input Validation**: Prevent injection attacks

### 🚀 Multi-Platform Support

- **ChatGPT**: Custom Actions integration
- **Google Gemini**: Function calling API
- **GitHub Mobile**: Quick action shortcuts
- **Manual**: Direct workflow dispatch from GitHub UI

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Sources                          │
│  ChatGPT │ Google Gemini │ GitHub Mobile │ Manual           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Natural Language Command
                     │
┌────────────────────▼────────────────────────────────────────┐
│          External API Gateway Workflow                       │
│  - Validate Request                                          │
│  - Check Authentication                                      │
│  - Rate Limiting                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Dispatch Event
                     │
┌────────────────────▼────────────────────────────────────────┐
│       Natural Language Command Dispatcher Workflow           │
│  - Check Kill Switch                                         │
│  - Load Configuration                                        │
│  - Parse Command                                             │
│  - Execute Operation                                         │
│  - Log Audit Trail                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ GitHub API
                     │
┌────────────────────▼────────────────────────────────────────┐
│               Repository Operations                          │
│  Branches │ PRs │ Issues │ Files │ Workflows │ Settings     │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

1. Repository access to `InfinityXOneSystems/quantum-x-builder`
2. GitHub Personal Access Token with appropriate permissions
3. (Optional) API keys for ChatGPT or Gemini integration

### Manual Execution (GitHub UI)

1. Go to: https://github.com/InfinityXOneSystems/quantum-x-builder/actions
2. Select **"Natural Language Command Dispatcher"** workflow
3. Click **"Run workflow"**
4. Enter your command in natural language
5. Select source (manual, chatgpt, gemini, github-mobile)
6. Click **"Run workflow"**

**Example:**
```
Command: create a branch called feature/user-authentication
Source: manual
User ID: your-github-username
```

---

## ChatGPT Integration

### Setup Instructions

#### Step 1: Get Your API Endpoint

Your repository dispatch endpoint:
```
https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches
```

#### Step 2: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update workflows)
4. Copy the token (save securely - you won't see it again)

#### Step 3: Configure ChatGPT Custom Action

1. Open ChatGPT
2. Go to Settings → Integrations → Actions
3. Click **"Create a GPT"** or edit existing GPT
4. In **Actions** section, click **"Create new action"**
5. Import the schema from: `connectors/chatgpt-integration.json`

Or manually configure:

**Authentication:**
- Type: Bearer Token
- Token: Your GitHub Personal Access Token

**Schema:**
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Quantum-X-Builder Control",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches"
    }
  ]
}
```

See full schema in `connectors/chatgpt-integration.json`

#### Step 4: Test the Integration

In ChatGPT, try:
```
"Create a branch called test/chatgpt-integration in the Quantum-X-Builder repo"
```

ChatGPT will execute the command via the Custom Action.

### Example Commands for ChatGPT

```
"In quantum-x-builder, create a branch called feature/new-ui"

"Open a pull request from develop to main with title 'Release v2.0' in quantum-x-builder"

"Create an issue in quantum-x-builder for tracking authentication bugs"

"Update the README file in quantum-x-builder with new setup instructions"

"Trigger the deployment workflow in quantum-x-builder"

"Add user john-doe as a collaborator with write access to quantum-x-builder"
```

---

## Google Gemini Integration

### Setup Instructions

#### Step 1: Create API Key

1. Generate GitHub PAT (same as ChatGPT section)
2. Store securely as `GEMINI_API_KEY` environment variable

#### Step 2: Configure Gemini Function Calling

Use the configuration from `connectors/gemini-integration.json`:

```json
{
  "name": "execute_repository_command",
  "description": "Execute natural language commands on Quantum-X-Builder",
  "parameters": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "Natural language command"
      }
    }
  }
}
```

#### Step 3: Make API Calls

**Python Example:**

```python
import google.generativeai as genai

genai.configure(api_key='YOUR_GEMINI_API_KEY')

model = genai.GenerativeModel('gemini-pro')

# Define the function
function_declaration = {
    'name': 'execute_repository_command',
    'description': 'Execute commands on Quantum-X-Builder repository',
    'parameters': {
        'type': 'object',
        'properties': {
            'command': {'type': 'string'}
        }
    }
}

# Execute command
response = model.generate_content(
    "Create a branch called feature/gemini-test",
    tools=[function_declaration]
)

# Process function call
if response.candidates[0].content.parts[0].function_call:
    # Execute the function call via GitHub API
    # See full implementation in connectors/gemini-integration.json
    pass
```

**curl Example:**

```bash
curl -X POST https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
    "event_type": "gemini-command",
    "client_payload": {
      "command": "create a branch called feature/test",
      "source": "gemini",
      "user_id": "gemini-user",
      "auth_token": "YOUR_GEMINI_API_KEY"
    }
  }'
```

---

## GitHub Mobile Integration

### Setup Instructions

#### Step 1: Open GitHub Mobile App

Download GitHub Mobile:
- iOS: https://apps.apple.com/app/github/id1477376905
- Android: https://play.google.com/store/apps/details?id=com.github.android

#### Step 2: Navigate to Repository

1. Open GitHub Mobile
2. Go to **InfinityXOneSystems/quantum-x-builder**
3. Tap **Actions** tab

#### Step 3: Use Quick Shortcuts

Pre-configured shortcuts available:

1. **Create Branch**: Quick branch creation
2. **Create PR**: Open pull requests
3. **Create Issue**: Issue tracking
4. **Merge PR**: Merge pull requests
5. **Trigger Deployment**: Deploy to environments
6. **Run CI**: Trigger CI workflows

#### Step 4: Execute Command

1. Select **"Natural Language Command Dispatcher"**
2. Tap **"Run workflow"**
3. Enter your command
4. Tap **"Run workflow"** to execute

### Mobile Command Examples

```
create a branch called hotfix/critical-bug
open a PR from hotfix to main
create an issue for security vulnerability
merge PR #42
trigger the deployment workflow
```

---

## Supported Commands

### Branch Management

| Command | Example |
|---------|---------|
| Create branch | `create a branch called feature/new-feature` |
| Delete branch | `delete branch old-feature` |
| Switch branch | `switch to branch develop` |

### Pull Requests

| Command | Example |
|---------|---------|
| Create PR | `open a PR from develop to main with title 'Release v2.0'` |
| Merge PR | `merge PR #42` |
| Close PR | `close PR #15` |

### Issues

| Command | Example |
|---------|---------|
| Create issue | `create an issue titled 'Fix login bug'` |
| Close issue | `close issue #23` |
| Reopen issue | `reopen issue #18` |
| Add label | `add label 'bug' to issue #10` |

### File Operations

| Command | Example |
|---------|---------|
| Create file | `create file docs/GUIDE.md with content 'Installation guide'` |
| Update file | `update README.md with new features` |
| Delete file | `delete file old-config.json` |

### Workflows

| Command | Example |
|---------|---------|
| Trigger workflow | `trigger the deployment workflow` |
| Enable workflow | `enable workflow ci.yml` |
| Disable workflow | `disable workflow old-tests.yml` |

### Repository Settings

| Command | Example |
|---------|---------|
| Update description | `update repository description to 'AI platform'` |
| Enable Pages | `enable GitHub Pages` |
| Update topics | `update topics to 'ai, automation, ci-cd'` |

### Collaborators

| Command | Example |
|---------|---------|
| Add collaborator | `add collaborator alice with write access` |
| Remove collaborator | `remove collaborator bob` |

### Security

| Command | Example |
|---------|---------|
| List secrets | `list repository secrets` |

### Deployment

| Command | Example |
|---------|---------|
| Deploy | `deploy to production` |
| Deploy staging | `deploy to staging` |

---

## Security & Authentication

### Authentication Methods

1. **Bearer Token** (GitHub PAT)
   - Used for: ChatGPT, Gemini, GitHub Mobile
   - Scope: `repo`, `workflow`
   - Configure: GitHub Settings → Developer settings → Personal access tokens

2. **API Key**
   - Used for: External integrations
   - Stored as: Repository secrets (`CHATGPT_API_KEY`, `GEMINI_API_KEY`)
   - Validated by: `scripts/auth-validator.js`

3. **Webhook Signature**
   - Used for: Webhook integrations
   - Secret: `WEBHOOK_SECRET`
   - Validation: HMAC-SHA256 signature verification

### Permission Boundaries

**Auto-Approved Operations** (no human review needed):
- Create branch
- Create issue
- Add label
- Trigger workflow
- List secrets

**Requires Approval**:
- Delete branch
- Merge PR
- Delete file
- Add/remove collaborator
- Update repository settings
- Deploy to production

**Forbidden** (hard stop):
- Delete repository
- Transfer ownership
- Modify kill switch
- Modify governance policies

### Audit Logging

All operations are logged to:
- File: `_OPS/AUDIT/nl-command-audit.log`
- Format: JSON
- Retention: 90 days
- Includes: timestamp, command, user, source, result

**Example Audit Log:**
```json
{
  "timestamp": "2026-02-11T21:00:00Z",
  "event_type": "nl_command",
  "source": "chatgpt",
  "user_id": "chatgpt-user-123",
  "command": "create a branch called feature/test",
  "result": "success",
  "execution_time_ms": 1234
}
```

### Kill Switch

Emergency stop mechanism:
- Location: `_OPS/SAFETY/KILL_SWITCH.json`
- Status: `ARMED` or `DISARMED`
- Behavior: When `ARMED`, all NL commands are blocked
- Authority: Human-only (Neo)

**Check Status:**
```bash
cat _OPS/SAFETY/KILL_SWITCH.json
```

**Activate Kill Switch:**
```json
{
  "kill_switch": "ARMED",
  "authority": "Neo",
  "behavior": "IMMEDIATE_HALT"
}
```

---

## Configuration

### NL Configuration File

Location: `.github/nl-config.yml`

**Key Settings:**

```yaml
# Enable/disable the system
enabled: true

# Feature toggles
features:
  branch_management: true
  pull_requests: true
  issues: true
  file_operations: true

# Rate limits
rate_limiting:
  max_requests_per_hour: 100
  max_requests_per_day: 1000

# Authentication
authentication:
  required: true
  methods:
    - bearer_token
    - api_key

# Audit settings
audit:
  enabled: true
  log_file: _OPS/AUDIT/nl-command-audit.log
  retention_days: 90
```

### Environment Variables

Required secrets (configure in Repository Settings → Secrets):

- `GH_APP_ID`: GitHub App ID (for Infinity Orchestrator)
- `GH_APP_PRIVATE_KEY`: GitHub App private key
- `CHATGPT_API_KEY`: ChatGPT integration key
- `GEMINI_API_KEY`: Gemini integration key
- `WEBHOOK_SECRET`: Webhook signature secret

---

## Troubleshooting

### Command Not Recognized

**Problem:** "Command not recognized" error

**Solutions:**
1. Use more specific command format
2. Check supported commands list above
3. Try variations:
   - "create a branch" vs "create branch"
   - "open a PR" vs "create a pull request"

**Example Fix:**
```
❌ "make a branch for new feature"
✅ "create a branch called feature/new-feature"
```

### Authentication Failed

**Problem:** 401 Unauthorized or 403 Forbidden

**Solutions:**
1. Verify GitHub PAT is valid and not expired
2. Check PAT has required scopes (`repo`, `workflow`)
3. Ensure API key matches configured secret
4. Check rate limits haven't been exceeded

**Verify Token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/user
```

### Rate Limit Exceeded

**Problem:** "Rate limit exceeded" error

**Solutions:**
1. Wait for rate limit to reset (1 hour for hourly limit)
2. Reduce command frequency
3. Check current rate limit status in audit logs
4. Contact admin to increase limits in config

**Check Rate Limit:**
```bash
grep "rate_limit" _OPS/AUDIT/nl-command-audit.log | tail -20
```

### Kill Switch Activated

**Problem:** "Kill switch is ARMED" error

**Solutions:**
1. Check kill switch status: `cat _OPS/SAFETY/KILL_SWITCH.json`
2. Contact repository administrator (Neo)
3. Wait for human intervention to disarm

**Note:** Only humans can modify the kill switch.

### Workflow Not Triggering

**Problem:** Command accepted but workflow doesn't run

**Solutions:**
1. Check GitHub Actions are enabled for the repo
2. Verify workflow file exists and is valid
3. Check workflow permissions in `.github/workflows/nl-command-dispatcher.yml`
4. Review workflow run history for errors

**Debug:**
```bash
# Check if workflow exists
ls -la .github/workflows/nl-command-dispatcher.yml

# View recent workflow runs
gh run list --workflow=nl-command-dispatcher.yml --limit 5
```

### File Operation Failed

**Problem:** File create/update/delete failed

**Solutions:**
1. Verify file path is correct
2. Check file exists (for update/delete)
3. Ensure file doesn't exist (for create)
4. Verify branch has no conflicts
5. Check file permissions

---

## Best Practices

### 1. Use Specific Commands

✅ **Good:**
```
"create a branch called feature/user-authentication"
"open a PR from develop to main with title 'Add authentication'"
```

❌ **Bad:**
```
"make a branch for authentication"
"create PR"
```

### 2. Include Context

For file operations, be specific:
```
"update the README.md file in the root with new installation instructions"
```

### 3. Test in Non-Production First

- Create test branches before production changes
- Test PRs against develop branch first
- Verify workflows with dry-run mode

### 4. Monitor Audit Logs

Regularly review:
```bash
tail -f _OPS/AUDIT/nl-command-audit.log
```

### 5. Use Appropriate Source

- **ChatGPT**: Complex, conversational commands
- **Gemini**: Programmatic, structured commands
- **GitHub Mobile**: Quick, on-the-go operations
- **Manual**: Testing and validation

### 6. Respect Rate Limits

- Batch operations when possible
- Space out commands
- Monitor rate limit status

### 7. Keep API Keys Secure

- Never commit API keys to code
- Use repository secrets
- Rotate keys regularly
- Use least-privilege access

---

## FAQ

### Q: Can I undo a command?

**A:** Commands execute immediately. Use Git operations to revert:
- Branches: Delete the branch
- PRs: Close the PR
- Files: Revert the commit
- Issues: Close the issue

### Q: What happens if I make a mistake?

**A:** All operations are logged. Check audit logs and use Git to revert changes. For critical issues, activate the kill switch.

### Q: How do I know if a command succeeded?

**A:** Check:
1. Workflow run status in GitHub Actions
2. Audit logs in `_OPS/AUDIT/nl-command-audit.log`
3. Repository changes (branches, PRs, issues, etc.)
4. Notifications in GitHub UI

### Q: Can I use this from CI/CD?

**A:** Yes! Use repository_dispatch events:

```bash
curl -X POST \
  https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d '{"event_type":"nl-command","client_payload":{"command":"your command"}}'
```

### Q: Is this secure?

**A:** Yes, with proper configuration:
- Authentication required for all commands
- Rate limiting prevents abuse
- Audit logging tracks all operations
- Kill switch provides emergency stop
- Permission boundaries restrict dangerous operations

### Q: Can I add custom commands?

**A:** Yes! Edit `scripts/command-router.js` and add new patterns to `COMMAND_PATTERNS`.

### Q: Does this work with private repositories?

**A:** Yes! Requires appropriate GitHub PAT with `repo` scope.

### Q: What are the costs?

**A:** GitHub Actions usage (free tier: 2000 minutes/month). External API calls (ChatGPT, Gemini) may have costs from those providers.

---

## Support & Contributing

### Get Help

- **Issues**: https://github.com/InfinityXOneSystems/quantum-x-builder/issues
- **Discussions**: https://github.com/InfinityXOneSystems/quantum-x-builder/discussions
- **Documentation**: This file and `docs/EXTERNAL_API_INTEGRATION.md`

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Report Security Issues

Email: security@infinityxonesystems.com

---

## Additional Resources

- **API Documentation**: `docs/EXTERNAL_API_INTEGRATION.md`
- **MCP Integration**: `GITHUB_MCP_INTEGRATION_GUIDE.md`
- **GitHub App Setup**: `GITHUB_APP_QUICK_SETUP.md`
- **Autonomous Agents**: `AUTONOMOUS_AGENTS.md`

---

**Last Updated:** 2026-02-11  
**Version:** 1.0.0  
**Maintained by:** InfinityXOneSystems
