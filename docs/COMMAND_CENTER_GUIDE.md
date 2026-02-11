# GitHub Pages Command Center - Complete Guide

## Overview

The Quantum X Builder Command Center is a universal natural language interface for controlling and monitoring the entire system through GitHub Pages. It provides:

- **Natural Language Commands** via text interface
- **AI Integration** with ChatGPT, Gemini, and GitHub Copilot
- **Real-Time Monitoring** with WebSocket updates
- **Monaco Editor** for code editing and scripting
- **Mobile Support** via GitHub mobile app and PWA
- **Cloudflare Tunnel** for secure local resource access
- **Full Automation APIs** for repository, workflow, and organization management

## Quick Start

### 1. Access the Command Center

Visit: **https://infinityxonesystems.github.io/quantum-x-builder/**

Or run locally:
```bash
cd command-center
python3 -m http.server 8000
# Visit http://localhost:8000
```

### 2. Configure API Keys (Optional)

Click the ⚙️ Settings button and enter your API keys:

- **ChatGPT API Key**: For OpenAI GPT-4 integration
- **Gemini API Key**: For Google Gemini integration
- **GitHub Token**: For enhanced GitHub API access

Keys are stored locally in your browser.

### 3. Send Your First Command

Type in the command input:
```
help
```

Then try:
```
list all agents
show system status
start the evolution agent
```

## Natural Language Commands

### Agent Control

```
start the autonomous agent
stop the healing agent
show status of evolution agent
list all agents
```

### Workflow Management

```
run fix-all workflow
trigger ultimate-fix-all
show status of auto-maintain workflow
list all workflows
```

### System Queries

```
what is the system status
show active agents
list running workflows
show recent activity
```

### Configuration

```
update config for autonomous agent
view logs for fix-all agent
show audit trail
```

## Features

### 1. Natural Language Interface

The command center accepts plain English commands and translates them to system actions using:

- **NLC Backend**: Pattern-based intent recognition
- **ChatGPT**: Advanced natural language understanding
- **Gemini**: Alternative AI provider with multimodal support

### 2. Monaco Editor

Switch to the "Code Editor" tab to:

- Write and execute scripts
- Edit configuration files
- Create workflow definitions
- Test API calls

### 3. Real-Time Dashboard

The right panel shows:

- **Active Agents**: Number of currently running agents
- **Running Workflows**: Active GitHub Actions workflows
- **Commands Today**: Number of commands executed
- **Recent Activity**: Live activity log

### 4. Mobile App Support

The command center is a Progressive Web App (PWA):

- Install to home screen
- Works offline
- Receives push notifications
- GitHub mobile app integration

## API Reference

### REST API Endpoints

#### Natural Language Commands

```bash
POST /api/nl/command
{
  "input": "start the evolution agent",
  "sessionId": "optional-session-id"
}
```

#### Automation APIs

**Create Branch:**
```bash
POST /api/automation/branch/create
{
  "owner": "InfinityXOneSystems",
  "repo": "quantum-x-builder",
  "branch": "feature/new-feature",
  "from": "main"
}
```

**Create Pull Request:**
```bash
POST /api/automation/pr/create
{
  "owner": "InfinityXOneSystems",
  "repo": "quantum-x-builder",
  "title": "Add new feature",
  "head": "feature/new-feature",
  "base": "main",
  "body": "Description of changes"
}
```

**Trigger Workflow:**
```bash
POST /api/automation/workflow/dispatch
{
  "owner": "InfinityXOneSystems",
  "repo": "quantum-x-builder",
  "workflow_id": "fix-all-persistent.yml",
  "ref": "main",
  "inputs": {}
}
```

**Create Issue:**
```bash
POST /api/automation/issue/create
{
  "owner": "InfinityXOneSystems",
  "repo": "quantum-x-builder",
  "title": "Bug report",
  "body": "Description",
  "labels": ["bug"],
  "assignees": []
}
```

### WebSocket API

Connect to `wss://api.quantum-x-builder.dev/ws`

**Messages Received:**
```json
{
  "type": "agent_status",
  "agent": "evolution",
  "status": "running",
  "timestamp": "2026-02-11T22:00:00Z"
}
```

```json
{
  "type": "workflow_status",
  "workflow": "fix-all-persistent",
  "status": "completed",
  "timestamp": "2026-02-11T22:00:00Z"
}
```

```json
{
  "type": "activity",
  "message": "Command executed successfully",
  "details": {},
  "timestamp": "2026-02-11T22:00:00Z"
}
```

## Cloudflare Tunnel Integration

### Setup

1. Install cloudflared:
```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# macOS
brew install cloudflared
```

2. Run setup script:
```bash
./infrastructure/setup-cloudflare-tunnel.sh
```

3. Start tunnel:
```bash
cloudflared tunnel run quantum-x-builder-tunnel
```

### Endpoints

After setup, these services are accessible:

- **Command Center**: https://command.quantum-x-builder.dev
- **API Backend**: https://api.quantum-x-builder.dev
- **VS Code**: https://vscode.quantum-x-builder.dev
- **Docker Registry**: https://docker.quantum-x-builder.dev
- **Ollama API**: https://ollama.quantum-x-builder.dev
- **WebSocket**: wss://ws.quantum-x-builder.dev

## GitHub Mobile Integration

### Webhooks

Configure GitHub webhooks to send events to the command center:

1. Go to repository Settings → Webhooks
2. Add webhook URL: `https://api.quantum-x-builder.dev/api/webhooks/github`
3. Select events: Pull requests, Issues, Workflow runs
4. Save

### Push Notifications

The command center sends push notifications for:

- Workflow completions
- PR reviews requested
- Issue assignments
- Agent status changes

## Security

### Authentication

All API requests require authentication:

```bash
curl -X POST https://api.quantum-x-builder.dev/api/nl/command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'
```

### Permissions

The system uses role-based access control (RBAC):

- **agent:read**: View agent status
- **agent:execute**: Start/stop agents
- **agent:write**: Modify agent configuration
- **system:read**: View system information
- **config:write**: Update system configuration
- **admin**: Full system access

### Safety Controls

- **Kill Switch**: Emergency shutdown mechanism
- **Dangerous Action Detection**: Blocks destructive commands
- **Audit Logging**: All commands logged to `_OPS/AUDIT/nl-commands.log`
- **Rate Limiting**: Prevents abuse

## Troubleshooting

### Command Center Not Loading

1. Check GitHub Pages is enabled in repository settings
2. Verify deployment workflow completed successfully
3. Clear browser cache and reload

### API Requests Failing

1. Check backend is running: `curl http://localhost:8787/health`
2. Verify authentication token is valid
3. Check CORS settings if running locally

### WebSocket Not Connecting

1. Verify backend WebSocket server is running
2. Check firewall allows WebSocket connections
3. Try WSS (secure WebSocket) if using HTTPS

### Cloudflare Tunnel Issues

1. Check tunnel is running: `cloudflared tunnel info`
2. Verify DNS records are configured
3. Check ingress rules in config.yml

## Advanced Usage

### Custom Commands

Create custom command handlers by extending the NLC system:

1. Add intent to `nlc/nlp-engine/intent-recognizer.js`
2. Add handler to `nlc/command-interpreter/executor.js`
3. Update documentation

### Scripting

Use the Monaco Editor to write automation scripts:

```javascript
// Example: Automated PR workflow
async function createFeaturePR(feature) {
  // Create branch
  await fetch('/api/automation/branch/create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      owner: 'InfinityXOneSystems',
      repo: 'quantum-x-builder',
      branch: `feature/${feature}`,
      from: 'main'
    })
  });

  // Create PR
  await fetch('/api/automation/pr/create', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      owner: 'InfinityXOneSystems',
      repo: 'quantum-x-builder',
      title: `Feature: ${feature}`,
      head: `feature/${feature}`,
      base: 'main'
    })
  });
}
```

### Integrations

Integrate with external services:

```javascript
// Send Slack notification on workflow completion
ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'workflow_status' && data.status === 'completed') {
    fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
      method: 'POST',
      body: JSON.stringify({
        text: `Workflow ${data.workflow} completed!`
      })
    });
  }
});
```

## Support

For issues, questions, or feature requests:

1. Check documentation at https://github.com/InfinityXOneSystems/quantum-x-builder/tree/main/docs
2. Search existing issues
3. Create new issue with detailed description
4. Join discussions in GitHub Discussions

## License

Copyright © 2026 Infinity XOS Systems. All rights reserved.
