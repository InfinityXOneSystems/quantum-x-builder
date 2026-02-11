# Natural Language Control System - Example Usage

This document demonstrates practical usage of the NLC system with real examples.

## Prerequisites

```bash
# Start the backend server
cd backend
npm install
npm start
```

Backend should be running at `http://localhost:8787`.

## Example 1: Getting Help

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "help"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "I can help you with the following commands:\n\n**START_AGENT**: Start an agent or workflow\nExamples: start the evolution agent, run fix-all workflow\n\n**STOP_AGENT**: Stop an agent or workflow\nExamples: stop the autonomous agent, halt workflow\n\n**STATUS_QUERY**: Check system or component status\nExamples: what is the system status, show agent health\n\n**LIST_QUERY**: List available components\nExamples: list all agents, show workflows\n\n**VIEW_LOGS**: View logs for components\nExamples: view agent logs, show audit history\n\nAvailable agents: autonomous-agent, validation-agent, healing-agent, fix-all-agent, evolution-agent\nAvailable workflows: fix-all-persistent, ultimate-fix-all, auto-maintain",
  "action": "system.help",
  "details": {
    "success": true,
    "action": "system.help",
    "help": {
      "available_commands": [...],
      "available_entities": {...}
    }
  },
  "command": {
    "intent": "HELP",
    "confidence": 0.6,
    "entities": {...}
  }
}
```

## Example 2: List All Agents

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "list all agents"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "Available agents: autonomous-agent, validation-agent, healing-agent, fix-all-agent, evolution-agent",
  "action": "system.list",
  "details": {
    "success": true,
    "action": "system.list",
    "type": "agents",
    "items": [
      "autonomous-agent",
      "validation-agent",
      "healing-agent",
      "fix-all-agent",
      "evolution-agent"
    ],
    "note": "This is mock data - integration with system registry required"
  },
  "command": {
    "intent": "LIST_QUERY",
    "confidence": 0.8,
    "entities": {
      "agents": [],
      "workflows": [],
      "services": [],
      "parameters": { "scope": "all" }
    }
  }
}
```

## Example 3: Check System Status

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "what is the system status"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "System status: operational. Components: system: running (healthy).",
  "action": "system.status",
  "details": {
    "success": true,
    "action": "system.status",
    "status": {
      "overall": "operational",
      "components": [
        {
          "name": "system",
          "status": "running",
          "health": "healthy"
        }
      ]
    },
    "note": "This is mock data - integration with system monitoring required"
  },
  "command": {
    "intent": "STATUS_QUERY",
    "confidence": 0.85,
    "entities": {...}
  }
}
```

## Example 4: Start an Agent (Mock)

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "start the evolution agent"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "Starting evolution-agent. This is a placeholder - integration with agent system required",
  "action": "agent.start",
  "details": {
    "success": true,
    "action": "agent.start",
    "message": "Command to start agents would be executed here",
    "targets": ["evolution-agent"],
    "note": "This is a placeholder - integration with agent system required"
  },
  "command": {
    "intent": "START_AGENT",
    "confidence": 0.9,
    "entities": {
      "agents": ["evolution-agent"],
      "workflows": [],
      "services": [],
      "parameters": {}
    }
  }
}
```

## Example 5: Check Conversation History

**Request:**
```bash
curl -X GET "http://localhost:8787/api/nl/history?limit=5" \
  -H "Authorization: Bearer test-token"
```

**Response:**
```json
{
  "success": true,
  "sessionId": "default",
  "history": [
    {
      "timestamp": "2026-02-11T21:30:00.000Z",
      "input": "help",
      "intent": "HELP",
      "success": true
    },
    {
      "timestamp": "2026-02-11T21:30:15.000Z",
      "input": "list all agents",
      "intent": "LIST_QUERY",
      "success": true
    },
    {
      "timestamp": "2026-02-11T21:30:30.000Z",
      "input": "what is the system status",
      "intent": "STATUS_QUERY",
      "success": true
    },
    {
      "timestamp": "2026-02-11T21:30:45.000Z",
      "input": "start the evolution agent",
      "intent": "START_AGENT",
      "success": true
    }
  ]
}
```

## Example 6: Get Session Status

**Request:**
```bash
curl -X GET http://localhost:8787/api/nl/status \
  -H "Authorization: Bearer test-token"
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "default",
    "historyCount": 4,
    "lastIntent": "START_AGENT",
    "createdAt": "2026-02-11T21:30:00.000Z",
    "updatedAt": "2026-02-11T21:30:45.000Z"
  }
}
```

## Example 7: Get System Capabilities

**Request:**
```bash
curl -X GET http://localhost:8787/api/nl/capabilities \
  -H "Authorization: Bearer test-token"
```

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "intents": [
      {
        "name": "START_AGENT",
        "description": "start, run, launch, execute, activate + agent, workflow, service",
        "examples": ["start the evolution agent", "run fix-all workflow"]
      },
      {
        "name": "STOP_AGENT",
        "description": "stop, halt, terminate, kill, pause + agent, workflow, service",
        "examples": ["stop the autonomous agent", "halt workflow"]
      },
      {
        "name": "STATUS_QUERY",
        "description": "status, state, health, check, show, what + system, agent, workflow, service",
        "examples": ["what is the system status", "show agent health"]
      },
      {
        "name": "LIST_QUERY",
        "description": "list, show all, display, get + agents, workflows, services, logs",
        "examples": ["list all agents", "show workflows"]
      },
      {
        "name": "UPDATE_CONFIG",
        "description": "update, change, modify, set, configure + config, settings, deployment, parameter",
        "examples": ["update deployment settings", "change config"]
      },
      {
        "name": "VIEW_LOGS",
        "description": "view, show, display, read + logs, audit, history, output",
        "examples": ["view agent logs", "show audit history"]
      },
      {
        "name": "HELP",
        "description": "help, assist, guide, how, what can + ",
        "examples": ["help", "what can you do"]
      }
    ],
    "entities": {
      "agents": [
        "autonomous-agent",
        "validation-agent",
        "healing-agent",
        "fix-all-agent",
        "evolution-agent"
      ],
      "workflows": [
        "fix-all-persistent",
        "ultimate-fix-all",
        "auto-maintain",
        "validation-agent"
      ],
      "services": [
        "backend",
        "frontend",
        "website",
        "database",
        "api"
      ]
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

## Example 8: Health Check

**Request:**
```bash
curl http://localhost:8787/api/nl/health
```

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "timestamp": "2026-02-11T21:30:00.000Z"
}
```

## Example 9: Command with Kill Switch ARMED

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "start the evolution agent"
  }'
```

**Response (when kill switch is ARMED):**
```json
{
  "success": false,
  "error": "Command blocked by safety validator",
  "reasons": [
    "Kill switch is ARMED - all actions are restricted"
  ]
}
```

## Example 10: Low Confidence Command

**Request:**
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "xyzabc random text"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Unable to parse command",
  "suggestion": "Please try rephrasing or use \"help\" to see available commands",
  "confidence": 0.0
}
```

## Example Session Script

Save this as `test-nlc.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8787"
TOKEN="test-token"

echo "=== NLC System Test ==="
echo

echo "1. Health Check"
curl -s "$BASE_URL/api/nl/health" | jq .
echo

echo "2. Get Help"
curl -s -X POST "$BASE_URL/api/nl/command" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}' | jq '.response'
echo

echo "3. List Agents"
curl -s -X POST "$BASE_URL/api/nl/command" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "list all agents"}' | jq '.response'
echo

echo "4. Check Status"
curl -s -X POST "$BASE_URL/api/nl/command" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "what is the system status"}' | jq '.response'
echo

echo "5. View History"
curl -s "$BASE_URL/api/nl/history?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "=== Test Complete ==="
```

Make it executable and run:
```bash
chmod +x test-nlc.sh
./test-nlc.sh
```

## Notes

- All commands require `Authorization: Bearer test-token` header
- Mock implementation returns placeholder responses
- Real integration with agents/workflows needed for Phase 2
- Kill switch integration prevents commands when ARMED
- All commands are logged to `_OPS/AUDIT/nl-commands.log`
- Session management maintains conversation context

## Next Steps

1. Replace mock handlers with real implementations
2. Connect to autonomous agents system
3. Integrate with workflow orchestration
4. Add voice interface (future)
5. Implement ML models for improved accuracy (future)
