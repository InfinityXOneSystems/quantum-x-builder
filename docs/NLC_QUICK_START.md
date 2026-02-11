# Natural Language Control System - Quick Start

Get started with the NLC system in 5 minutes.

## Prerequisites

- Node.js installed
- Backend server running

## Step 1: Start the Backend

```bash
cd backend
npm install
npm start
```

Backend will be available at `http://localhost:8787`.

## Step 2: Test the API

### Health Check
```bash
curl http://localhost:8787/api/nl/health
```

Expected response:
```json
{
  "success": true,
  "status": "operational",
  "timestamp": "2026-02-11T21:00:00.000Z"
}
```

### Get System Capabilities
```bash
curl -X GET http://localhost:8787/api/nl/capabilities \
  -H "Authorization: Bearer test-token"
```

### Send a Command
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'
```

Expected response:
```json
{
  "success": true,
  "response": "I can help you with the following commands:\n\n**START_AGENT**: Start an agent or workflow\nExamples: start the evolution agent, run fix-all workflow\n\n...",
  "action": "system.help",
  "details": {...},
  "command": {...}
}
```

## Step 3: Try Common Commands

### List Agents
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "list all agents"}'
```

### Check Status
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "what is the system status"}'
```

### Start an Agent (Mock)
```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "start the evolution agent"}'
```

## Step 4: View Command History

```bash
curl -X GET "http://localhost:8787/api/nl/history?limit=5" \
  -H "Authorization: Bearer test-token"
```

## Step 5: Check Session Status

```bash
curl -X GET http://localhost:8787/api/nl/status \
  -H "Authorization: Bearer test-token"
```

## Common Issues

### 401 Unauthorized
Add `Authorization: Bearer test-token` header to your requests.

### 403 Forbidden
Command blocked by safety validator or kill switch. Check:
```bash
cat _OPS/SAFETY/KILL_SWITCH.json
```

If kill switch is ARMED, commands will be blocked until it's disarmed.

### 400 Bad Request
Command not understood. Try:
- Using more specific language
- Mentioning explicit entity names
- Typing "help" to see examples

## Next Steps

1. **Read Full Documentation**: See `docs/NLC_USER_GUIDE.md`
2. **Review Architecture**: See `docs/NLC_ARCHITECTURE.md`
3. **Run Tests**: `npm test` to verify everything works
4. **Explore Code**: Check `nlc/` directory for implementation

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nl/health` | GET | Health check |
| `/api/nl/capabilities` | GET | Get system capabilities |
| `/api/nl/command` | POST | Execute NL command |
| `/api/nl/status` | GET | Get session status |
| `/api/nl/history` | GET | Get command history |
| `/api/nl/feedback` | POST | Submit feedback |

## Example Session

```bash
# 1. Start conversation
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'

# 2. List available agents
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "list all agents"}'

# 3. Check status
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "what is the system status"}'

# 4. View history
curl -X GET http://localhost:8787/api/nl/history \
  -H "Authorization: Bearer test-token"
```

## Need Help?

- Documentation: `docs/NLC_USER_GUIDE.md`
- Architecture: `docs/NLC_ARCHITECTURE.md`
- Tests: `nlc/tests/unit/`
- Audit Logs: `_OPS/AUDIT/nl-commands.log`
