# Natural Language Control System - User Guide

## Overview

The Natural Language Control (NLC) System enables you to interact with the quantum-x-builder using natural language commands via text. You can control agents, query system status, view logs, and manage workflows using conversational commands.

## Getting Started

### Authentication

All NLC API endpoints require authentication. Include your authorization token in the request header:

```bash
Authorization: Bearer YOUR_TOKEN
```

### Basic Usage

Send a natural language command to the `/api/nl/command` endpoint:

```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "start the evolution agent"}'
```

## Available Commands

### 1. Start Agent/Workflow

Start an autonomous agent or workflow:

- "start the evolution agent"
- "run fix-all workflow"
- "launch the autonomous agent"
- "execute healing agent"

**Examples:**
```json
{"input": "start the evolution agent"}
{"input": "run fix-all workflow"}
```

### 2. Stop Agent/Workflow

Stop a running agent or workflow (requires confirmation):

- "stop the autonomous agent"
- "halt the evolution agent"
- "terminate fix-all workflow"

**Examples:**
```json
{"input": "stop the autonomous agent"}
```

⚠️ **Warning**: These are dangerous actions and will prompt for confirmation.

### 3. System Status

Query the status of system components:

- "what is the system status"
- "show agent health"
- "check backend status"
- "status of evolution agent"

**Examples:**
```json
{"input": "what is the system status"}
{"input": "show agent health"}
```

### 4. List Components

List available agents, workflows, or services:

- "list all agents"
- "show workflows"
- "display services"

**Examples:**
```json
{"input": "list all agents"}
{"input": "show workflows"}
```

### 5. View Logs

View logs for specific components:

- "view agent logs"
- "show audit history"
- "display evolution agent logs"

**Examples:**
```json
{"input": "view evolution agent logs"}
```

### 6. Help

Get help and see available commands:

- "help"
- "what can you do"
- "show commands"

**Examples:**
```json
{"input": "help"}
```

## API Endpoints

### POST /api/nl/command

Execute a natural language command.

**Request:**
```json
{
  "input": "start the evolution agent",
  "sessionId": "optional-session-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "response": "Starting evolution-agent...",
  "action": "agent.start",
  "details": {
    "success": true,
    "action": "agent.start",
    "targets": ["evolution-agent"]
  },
  "command": {
    "intent": "START_AGENT",
    "confidence": 0.85,
    "entities": {
      "agents": ["evolution-agent"],
      "workflows": [],
      "services": []
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Command blocked by safety validator",
  "reasons": ["Kill switch is ARMED - all actions are restricted"]
}
```

### GET /api/nl/status

Get conversation session status.

**Query Parameters:**
- `sessionId` (optional): Session identifier

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "default",
    "historyCount": 5,
    "lastIntent": "START_AGENT",
    "createdAt": "2026-02-11T20:00:00.000Z",
    "updatedAt": "2026-02-11T21:00:00.000Z"
  }
}
```

### GET /api/nl/history

Retrieve command history for a session.

**Query Parameters:**
- `sessionId` (optional): Session identifier (default: "default")
- `limit` (optional): Number of history entries to return (default: 10)

**Response:**
```json
{
  "success": true,
  "sessionId": "default",
  "history": [
    {
      "timestamp": "2026-02-11T21:00:00.000Z",
      "input": "start the evolution agent",
      "intent": "START_AGENT",
      "success": true
    }
  ]
}
```

### POST /api/nl/feedback

Submit feedback on command execution.

**Request:**
```json
{
  "sessionId": "default",
  "commandIndex": 0,
  "rating": 5,
  "comment": "Command worked perfectly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback received",
  "feedback": {
    "sessionId": "default",
    "commandIndex": 0,
    "rating": 5,
    "comment": "Command worked perfectly",
    "timestamp": "2026-02-11T21:00:00.000Z"
  }
}
```

### GET /api/nl/capabilities

Get system capabilities and available commands.

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "intents": [
      {
        "name": "START_AGENT",
        "description": "Start an agent or workflow",
        "examples": ["start the evolution agent", "run fix-all workflow"]
      }
    ],
    "entities": {
      "agents": ["autonomous-agent", "evolution-agent", "..."],
      "workflows": ["fix-all-persistent", "ultimate-fix-all", "..."],
      "services": ["backend", "frontend", "website"]
    },
    "features": {
      "textCommands": true,
      "voiceCommands": false,
      "multiLanguage": false,
      "contextAware": true,
      "auditLogging": true
    }
  }
}
```

### GET /api/nl/health

Health check endpoint for the NLC system.

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "timestamp": "2026-02-11T21:00:00.000Z"
}
```

## Known Entities

### Agents
- autonomous-agent
- validation-agent (validator-agent)
- healing-agent
- fix-all-agent
- evolution-agent

### Workflows
- fix-all-persistent
- ultimate-fix-all
- auto-maintain
- validation-agent

### Services
- backend
- frontend
- website
- database
- api

## Context & Sessions

The NLC system maintains conversation context using session IDs. Commands within the same session can reference previous context. Sessions automatically expire after 24 hours of inactivity.

**Session Management:**
```json
// Use the same sessionId across multiple commands
{"input": "start the evolution agent", "sessionId": "my-session"}
{"input": "check its status", "sessionId": "my-session"}
```

## Security & Safety

### Authentication
All endpoints require Bearer token authentication.

### Permissions
Different commands require different permission levels:
- **agent:read, agent:execute**: Start agents
- **agent:write, agent:control**: Stop agents
- **system:read**: Query status
- **config:write, system:admin**: Update configuration
- **logs:read**: View logs

### Safety Checks
The NLC system includes multiple safety layers:
1. **Kill Switch**: All actions blocked when kill switch is ARMED
2. **Dangerous Action Detection**: Destructive commands require confirmation
3. **Permission Validation**: Users must have required permissions
4. **Audit Logging**: All commands are logged to `_OPS/AUDIT/nl-commands.log`

### Dangerous Commands
The following actions are considered dangerous and require extra confirmation:
- agent.stop
- config.update
- system.reset

## Troubleshooting

### Low Confidence Parsing
If your command isn't understood (confidence < 30%), try:
- Using more specific language
- Mentioning explicit entity names (agent names, workflow names)
- Using one of the example commands
- Typing "help" to see available commands

### Permission Denied
Ensure your user token has the required permissions for the action.

### Kill Switch Active
If commands are blocked, check the kill switch status at `_OPS/SAFETY/KILL_SWITCH.json`. If `kill_switch: "ARMED"`, all automated actions are disabled.

### Command Not Found
Verify the entity (agent/workflow/service) name is correct. Use `GET /api/nl/capabilities` to see all available entities.

## Future Enhancements

The following features are planned for future releases:
- Voice interface (speech-to-text and text-to-speech)
- Multi-language support
- Machine learning for improved pattern recognition
- Custom command creation
- Advanced context understanding
- Multi-turn conversation flows

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the audit logs at `_OPS/AUDIT/nl-commands.log`
3. Verify system status with "what is the system status"
4. Contact system administrators
