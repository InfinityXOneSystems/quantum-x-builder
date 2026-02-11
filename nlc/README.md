# Natural Language Control (NLC) System

The Natural Language Control System enables users to interact with the quantum-x-builder using conversational text commands. This system provides an intuitive interface for controlling agents, querying system status, and managing workflows.

## Features

- **Natural Language Understanding**: Parse and understand user commands in plain English
- **Intent Recognition**: Automatically identify what users want to do
- **Entity Extraction**: Extract agents, workflows, services, and parameters from commands
- **Context Awareness**: Maintain conversation history and context
- **Security**: Full authentication, authorization, and audit logging
- **Safety Controls**: Kill switch integration and dangerous action prevention
- **REST API**: Easy-to-use HTTP endpoints

## Quick Start

### 1. Start the Backend

The NLC system is integrated into the backend server:

```bash
cd backend
npm install
npm start
```

The backend will be available at `http://localhost:8787`.

### 2. Send Your First Command

```bash
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'
```

### 3. Try More Commands

```bash
# List all agents
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "list all agents"}'

# Check system status
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "what is the system status"}'

# Start an agent (mock - not yet connected to real agents)
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "start the evolution agent"}'
```

## Directory Structure

```
nlc/
├── nlp-engine/           # Natural Language Processing
│   ├── intent-recognizer.js    # Recognize user intents
│   ├── entity-extractor.js     # Extract entities from input
│   └── context-manager.js      # Manage conversation context
├── command-interpreter/  # Command Processing
│   ├── parser.js              # Parse NL to structured commands
│   ├── validator.js           # Validate commands
│   ├── executor.js            # Execute commands
│   └── responder.js           # Generate NL responses
├── security/             # Security & Safety
│   ├── auth.js               # Authentication
│   ├── permissions.js        # Permission checking
│   ├── audit-logger.js       # Audit logging
│   └── safety-validator.js   # Safety checks
├── api/                  # API Layer
│   └── routes.js            # Express routes
├── tests/                # Tests
│   └── unit/                # Unit tests
└── config.yaml           # Configuration
```

## Available Commands

### System Status
- "what is the system status"
- "show agent health"
- "check backend status"

### List Components
- "list all agents"
- "show workflows"
- "display services"

### Start/Stop (Mock - Integration Required)
- "start the evolution agent"
- "run fix-all workflow"
- "stop the autonomous agent"

### View Logs (Placeholder)
- "view agent logs"
- "show audit history"

### Help
- "help"
- "what can you do"

## API Endpoints

- `POST /api/nl/command` - Execute a natural language command
- `GET /api/nl/status` - Get conversation session status
- `GET /api/nl/history` - Retrieve command history
- `POST /api/nl/feedback` - Submit user feedback
- `GET /api/nl/capabilities` - Get system capabilities
- `GET /api/nl/health` - Health check

## Testing

Run the full test suite:

```bash
npm test
```

Run only NLC tests:

```bash
npx vitest run nlc/tests/
```

All 47 tests pass:
- 9 tests for Intent Recognizer
- 7 tests for Entity Extractor  
- 10 tests for Parser
- 7 tests for Validator
- 5 tests for Safety Validator
- 9 tests for existing maintenance tools

## Security

### Authentication
All endpoints require Bearer token authentication. Include your token in the `Authorization` header:

```
Authorization: Bearer YOUR_TOKEN
```

### Permissions
Different commands require different permissions:
- `agent:read, agent:execute` - Start agents
- `agent:write, agent:control` - Stop agents
- `system:read` - Query status
- `config:write, system:admin` - Update configuration
- `logs:read` - View logs

### Kill Switch
The system respects the kill switch at `_OPS/SAFETY/KILL_SWITCH.json`. When the kill switch is ARMED, all automated actions are blocked.

### Audit Logging
All commands are logged to `_OPS/AUDIT/nl-commands.log` with:
- Timestamp
- User ID
- Command input
- Intent recognized
- Execution result
- Success/failure status

## Configuration

Edit `nlc/config.yaml` to customize:

```yaml
nlp:
  confidence_threshold: 0.3  # Minimum confidence for parsing
  max_history: 50           # Commands to keep in history

security:
  require_auth: true
  audit_logging: true
  safety_checks: true

execution:
  timeout: 30000           # 30 seconds
```

## Known Entities

### Agents
- autonomous-agent
- validation-agent
- healing-agent
- fix-all-agent
- evolution-agent

### Workflows
- fix-all-persistent
- ultimate-fix-all
- auto-maintain

### Services
- backend
- frontend
- website
- database
- api

## Current Status

### ✅ Implemented
- Core NLP engine (intent recognition, entity extraction)
- Command interpreter (parsing, validation, execution)
- Security layer (auth, permissions, audit, safety)
- REST API endpoints
- Unit tests (47 tests)
- Documentation

### 🚧 In Progress
- Integration with actual system components (agents, workflows)
- Real command execution (currently using mock handlers)

### 📋 Planned
- Voice interface (speech-to-text, text-to-speech)
- Multi-language support
- Machine learning for improved accuracy
- Custom command creation

## Documentation

- **User Guide**: `docs/NLC_USER_GUIDE.md` - Complete API documentation and usage examples
- **Architecture**: `docs/NLC_ARCHITECTURE.md` - System architecture and design decisions

## Integration

The NLC system is integrated into the backend via `backend/src/routes/nlc.js`. To use it in other applications:

```javascript
import { registerNlcRoutes } from './backend/src/routes/nlc.js';

const app = express();
// ... configure express ...
registerNlcRoutes(app);
```

## Troubleshooting

### Commands Not Understood
- Try using more specific language
- Mention explicit entity names
- Use example commands from documentation
- Type "help" to see available commands

### Authentication Failed
- Ensure Bearer token is included in Authorization header
- Token must be valid (currently: length > 10 characters for mock)

### Commands Blocked
- Check kill switch status at `_OPS/SAFETY/KILL_SWITCH.json`
- Verify user has required permissions
- Review audit logs at `_OPS/AUDIT/nl-commands.log`

## Contributing

When adding new features:

1. **Add Intent**: Update `nlp-engine/intent-recognizer.js`
2. **Add Handler**: Create handler in `command-interpreter/executor.js`
3. **Add Tests**: Create tests in `tests/unit/`
4. **Update Docs**: Update user guide and architecture docs

## Support

For issues or questions:
- Check documentation in `docs/NLC_USER_GUIDE.md`
- Review audit logs for error details
- Check system status with "what is the system status"
