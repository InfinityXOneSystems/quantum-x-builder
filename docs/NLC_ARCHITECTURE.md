# Natural Language Control System - Architecture

## Overview

The Natural Language Control (NLC) System is a comprehensive natural language interface that enables users to control and interact with the quantum-x-builder system using text commands. This document describes the architecture, components, and design decisions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Input (Text)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Layer (Express)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /api/nl/command    GET /api/nl/status             │  │
│  │  GET  /api/nl/history    POST /api/nl/feedback          │  │
│  │  GET  /api/nl/capabilities                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Security Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐ │
│  │    Auth     │  │ Permissions │  │   Safety Validator     │ │
│  │             │  │   Checker   │  │   (Kill Switch)        │ │
│  └─────────────┘  └─────────────┘  └────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NLP Engine                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │     Intent      │  │   Entity     │  │     Context      │  │
│  │   Recognizer    │  │  Extractor   │  │    Manager       │  │
│  └─────────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Command Interpreter                                │
│  ┌────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Parser │  │ Validator │  │ Executor │  │  Responder   │   │
│  └────────┘  └───────────┘  └──────────┘  └──────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Integration Layer (Future)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │    Agent     │  │   Workflow   │  │    System API      │   │
│  │  Connector   │  │ Orchestrator │  │      Bridge        │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   Target Systems     │
           │  • Agents            │
           │  • Workflows         │
           │  • Services          │
           └──────────────────────┘
```

## Core Components

### 1. NLP Engine (`nlc/nlp-engine/`)

The Natural Language Processing engine is responsible for understanding user intent.

#### Intent Recognizer (`intent-recognizer.js`)
- **Purpose**: Parse user commands and identify intended actions
- **Method**: Pattern matching using keywords and examples
- **Supported Intents**:
  - START_AGENT: Start agents or workflows
  - STOP_AGENT: Stop agents or workflows
  - STATUS_QUERY: Query system status
  - LIST_QUERY: List available components
  - UPDATE_CONFIG: Update configuration
  - VIEW_LOGS: View logs
  - HELP: Get help

**Algorithm**:
1. Normalize input to lowercase
2. Match keywords against intent patterns
3. Check for entity mentions
4. Score matches (keywords=2pts, entities=1pt, exact phrase=3pts)
5. Calculate confidence score (0-1 scale)

#### Entity Extractor (`entity-extractor.js`)
- **Purpose**: Extract parameters, targets, and context from input
- **Known Entities**:
  - Agents: autonomous-agent, validation-agent, healing-agent, fix-all-agent, evolution-agent
  - Workflows: fix-all-persistent, ultimate-fix-all, auto-maintain
  - Services: backend, frontend, website, database, api
  - Parameters: time duration, scope

**Extraction Strategy**:
- Pattern matching for known entities
- Regular expressions for time parameters
- Context-aware disambiguation

#### Context Manager (`context-manager.js`)
- **Purpose**: Maintain conversation state and command history
- **Features**:
  - In-memory session storage
  - 50-command history per session
  - 24-hour session timeout
  - Automatic cleanup of old sessions

### 2. Command Interpreter (`nlc/command-interpreter/`)

Translates natural language to executable system commands.

#### Parser (`parser.js`)
- **Purpose**: Translate natural language to structured commands
- **Process**:
  1. Recognize intent
  2. Extract entities
  3. Build structured command object
  4. Apply confidence threshold (0.3 minimum)

#### Validator (`validator.js`)
- **Purpose**: Verify command safety and permissions
- **Checks**:
  - Action validity
  - Permission requirements
  - Dangerous action detection
  - Kill switch status
  - Target validation

#### Executor (`executor.js`)
- **Purpose**: Route commands to system components
- **Handlers**:
  - handleAgentStart: Start agents (placeholder)
  - handleAgentStop: Stop agents (placeholder)
  - handleSystemStatus: Query status (mock data)
  - handleSystemList: List components (mock data)
  - handleLogsView: View logs (placeholder)
  - handleHelp: Provide help

**Note**: Current implementation uses mock/placeholder handlers. Integration with actual system components is planned for Phase 3.

#### Responder (`responder.js`)
- **Purpose**: Generate natural language responses
- **Response Types**:
  - Success responses
  - Error responses with suggestions
  - Warning messages
  - Help information

### 3. Security Layer (`nlc/security/`)

Ensures safe and authorized command execution.

#### Authentication (`auth.js`)
- **Purpose**: Verify user identity
- **Method**: Bearer token authentication
- **Mock Implementation**: Accepts tokens longer than 10 characters (for development)

#### Permissions (`permissions.js`)
- **Purpose**: Check command permissions
- **Permission Model**:
  - agent:read, agent:execute - Start agents
  - agent:write, agent:control - Stop agents
  - system:read - Query status
  - config:write, system:admin - Update config
  - logs:read - View logs

#### Audit Logger (`audit-logger.js`)
- **Purpose**: Track all natural language interactions
- **Log Location**: `_OPS/AUDIT/nl-commands.log`
- **Log Format**: JSON lines
- **Events Logged**:
  - Command success/failure
  - Security events
  - Permission violations

#### Safety Validator (`safety-validator.js`)
- **Purpose**: Prevent dangerous commands
- **Safety Checks**:
  - Dangerous pattern detection (delete, destroy, bypass)
  - Kill switch verification
  - Critical target protection
  - Severity levels (high, critical)

### 4. API Layer (`nlc/api/`)

RESTful API endpoints for the NLC system.

#### Routes (`routes.js`)
- **POST /api/nl/command**: Execute NL command
- **GET /api/nl/status**: Get session status
- **GET /api/nl/history**: Retrieve command history
- **POST /api/nl/feedback**: Submit feedback
- **GET /api/nl/capabilities**: Get system capabilities
- **GET /api/nl/health**: Health check

## Security Architecture

### Multi-Layer Security

1. **API Layer**: Bearer token authentication
2. **Permission Layer**: Role-based access control
3. **Safety Layer**: Kill switch and dangerous action detection
4. **Audit Layer**: Complete logging of all actions

### Kill Switch Integration

The NLC system respects the kill switch at `_OPS/SAFETY/KILL_SWITCH.json`:
- When `kill_switch: "ARMED"`, all actions are blocked
- Kill switch status checked before command execution
- Provides clear error messages when armed

## Data Flow

1. **User sends command** → API endpoint
2. **Authentication** → Verify bearer token
3. **Parse command** → NLP engine extracts intent and entities
4. **Validate safety** → Check kill switch and dangerous patterns
5. **Validate permissions** → Check user has required permissions
6. **Execute command** → Route to appropriate handler
7. **Generate response** → Create natural language response
8. **Audit log** → Record command execution
9. **Return response** → Send to user

## Configuration

Configuration file: `nlc/config.yaml`

```yaml
nlp:
  confidence_threshold: 0.3
  context_timeout: 86400000  # 24 hours
  max_history: 50

security:
  require_auth: true
  audit_logging: true
  safety_checks: true

execution:
  timeout: 30000  # 30 seconds
  retry_attempts: 3
```

## Testing Strategy

### Unit Tests
- Intent recognition accuracy
- Entity extraction correctness
- Command parsing logic
- Validation rules
- Safety checks

### Integration Tests (Future)
- End-to-end command execution
- System integration
- API endpoint testing

### Test Coverage
- All core components have unit tests
- Tests use Vitest framework
- Located in `nlc/tests/unit/`

## Performance Considerations

### Current Implementation
- In-memory context storage (fast, but not persistent)
- Synchronous intent matching (< 10ms for typical commands)
- Mock command execution (instant response)

### Future Optimizations
- Redis for distributed context storage
- Caching for entity lookups
- Async command execution with status polling
- Machine learning models for improved accuracy

## Integration Points

### Current Integrations
- Backend Express API (via `backend/src/routes/nlc.js`)
- Audit logging to `_OPS/AUDIT/`
- Kill switch monitoring

### Planned Integrations (Phase 3)
- Autonomous agents system
- Workflow orchestration
- System monitoring APIs
- Event stream handlers

## Design Decisions

### Why Pattern Matching Instead of ML?
- **Simplicity**: Easier to understand and maintain
- **Deterministic**: Predictable behavior
- **No Training Data Required**: Works immediately
- **Good Enough**: High accuracy for limited command set
- **Extensible**: Easy to add new patterns

**Future**: ML models can be added for improved accuracy.

### Why In-Memory Context?
- **Performance**: Fastest possible access
- **Simplicity**: No external dependencies
- **Sufficient**: Works well for moderate usage
- **Development**: Easy to test and debug

**Future**: Redis/database for production scalability.

### Why Mock Handlers?
- **Incremental Development**: Core NLP works first
- **Safe Testing**: No risk of affecting real systems
- **Clear Integration Points**: Easy to replace with real handlers
- **Documentation**: Shows intended behavior

## Extensibility

The system is designed for easy extension:

### Adding New Intents
1. Add pattern to `INTENT_PATTERNS` in `intent-recognizer.js`
2. Add handler in `executor.js`
3. Add response generator in `responder.js`
4. Update tests

### Adding New Entities
1. Add to known entities in `entity-extractor.js`
2. Update extraction logic if needed
3. Update documentation

### Adding New Integrations
1. Create connector in `integration/` (future)
2. Add handler in `executor.js`
3. Update permission requirements
4. Add tests

## Deployment Considerations

### Environment Variables
- Auth tokens/secrets should be in environment variables
- Configuration can override `config.yaml` via env vars

### Monitoring
- Monitor audit logs for security events
- Track command success/failure rates
- Monitor response times
- Alert on kill switch activation

### Scaling
- Current: Single instance with in-memory storage
- Future: Multiple instances with Redis session storage

## Future Enhancements

### Phase 2: Voice Interface
- Speech-to-text integration
- Text-to-speech responses
- Wake word detection

### Phase 3: Real System Integration
- Connect to autonomous agents
- Workflow orchestration
- Real-time system monitoring
- Event stream processing

### Phase 4: Advanced NLP
- Machine learning models
- Multi-language support
- Contextual understanding
- Custom command learning

## References

- User Guide: `docs/NLC_USER_GUIDE.md`
- API Documentation: In User Guide
- Configuration: `nlc/config.yaml`
- Tests: `nlc/tests/unit/`
