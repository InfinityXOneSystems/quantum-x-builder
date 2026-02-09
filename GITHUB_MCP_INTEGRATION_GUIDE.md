# GitHub MCP Integration Guide
**Model Context Protocol Integration for Quantum-X-Builder**  
**Version**: 1.0  
**Date**: 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [What is MCP?](#what-is-mcp)
3. [Architecture](#architecture)
4. [Current Status](#current-status)
5. [Implementation Plan](#implementation-plan)
6. [GitHub MCP Server](#github-mcp-server)
7. [MCP Protocol](#mcp-protocol)
8. [Authentication](#authentication)
9. [API Reference](#api-reference)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Model Context Protocol (MCP) is an open protocol that enables secure, controlled communication between AI models and external systems. For Quantum-X-Builder, GitHub MCP integration provides:

- **Secure GitHub API access** for AI agents
- **Controlled repository operations** with audit trails
- **Multi-model coordination** across different AI providers
- **Standardized context sharing** between AI systems

---

## What is MCP?

### MCP Fundamentals

**Model Context Protocol** is:
- A standardized protocol for AI model integration
- Transport-agnostic (HTTP, WebSocket, etc.)
- Secure and auditable
- Supports multiple AI providers (OpenAI, Anthropic, Google, etc.)

### Key Concepts

```
┌─────────────────────────────────────────────────────────┐
│                      AI Models                           │
│  (ChatGPT, Copilot, Gemini, Claude, etc.)              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ MCP Protocol
                  │
┌─────────────────┴───────────────────────────────────────┐
│               MCP Server (Quantum-X-Builder)            │
│  - Authentication                                        │
│  - Authorization                                         │
│  - Request routing                                       │
│  - Audit logging                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ GitHub API
                  │
┌─────────────────┴───────────────────────────────────────┐
│                     GitHub                               │
│  - Repository: quantum-x-builder                        │
│  - Organization: InfinityXOneSystems                    │
└──────────────────────────────────────────────────────────┘
```

---

## Architecture

### High-Level Architecture

```
┌──────────────┐
│ AI Provider  │
│  (External)  │
└──────┬───────┘
       │
       │ HTTPS/MCP
       │
┌──────▼────────────────────────────────────────────────┐
│  MCP Gateway (Port 8787 or dedicated)                │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Authentication & Authorization Layer            │ │
│  │  - API Key validation                           │ │
│  │  - GitHub App token verification                │ │
│  │  - Rate limiting                                 │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ MCP Protocol Handler                            │ │
│  │  - Request parsing                              │ │
│  │  - Context management                           │ │
│  │  - Response formatting                          │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ GitHub API Proxy                                │ │
│  │  - Repository operations                        │ │
│  │  - PR management                                │ │
│  │  - Issue tracking                               │ │
│  │  - Workflow execution                           │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Audit & Logging                                 │ │
│  │  - Request logs                                 │ │
│  │  - Access logs                                  │ │
│  │  - Compliance tracking                          │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────┘
                        │
                        │ GitHub API (REST/GraphQL)
                        │
                  ┌─────▼──────┐
                  │   GitHub   │
                  └────────────┘
```

### Component Details

**MCP Gateway**:
- Endpoint: `https://api.quantum-x-builder.com/mcp` (or `http://localhost:8787/mcp`)
- Protocol: MCP over HTTPS
- Authentication: GitHub App token, API keys
- Rate limiting: Per-user, per-model limits

**GitHub Integration**:
- GitHub App: infinity-xos-orchestrator (ID: 2494652)
- Organization: InfinityXOneSystems
- Repository: quantum-x-builder
- Permissions: Read/write repository, workflows, PRs, issues

---

## Current Status

### Implemented ✅
- [x] GitHub App configured (ID: 2494652)
- [x] OAuth setup script (`_OPS/github-app-oauth-setup.sh`)
- [x] AI service integration routes (`backend/src/routes/ai-integration.js`)
- [x] Provider implementations (Ollama, Groq, Gemini, Vertex)
- [x] Basic authentication middleware

### Not Implemented ❌
- [ ] MCP server implementation
- [ ] MCP protocol handlers
- [ ] MCP authentication layer
- [ ] MCP request/response middleware
- [ ] MCP GitHub API proxy
- [ ] MCP audit logging
- [ ] MCP testing framework
- [ ] MCP documentation

### References Found
```bash
# Files mentioning MCP
_OPS/OUTPUT/docker-forensic-20260208T110310Z.json
```

---

## Implementation Plan

### Phase 1: Core MCP Server (Week 1)

1. **Create MCP Server Module**
   ```
   backend/src/mcp/
   ├── server.js           # Main MCP server
   ├── protocol.js         # MCP protocol implementation
   ├── handlers/           # Request handlers
   │   ├── context.js      # Context management
   │   ├── tools.js        # Tool execution
   │   └── resources.js    # Resource access
   ├── auth/               # Authentication
   │   ├── github-app.js   # GitHub App auth
   │   └── api-key.js      # API key auth
   └── middleware/         # Middleware
       ├── rate-limit.js   # Rate limiting
       ├── audit.js        # Audit logging
       └── validator.js    # Request validation
   ```

2. **Define MCP Protocol Spec**
   - Message format
   - Request/response structure
   - Error handling
   - Context passing

3. **Implement Authentication**
   - GitHub App token validation
   - API key management
   - Permission checking

### Phase 2: GitHub Integration (Week 2)

1. **GitHub API Proxy**
   ```
   backend/src/mcp/github/
   ├── client.js           # GitHub API client
   ├── repositories.js     # Repository operations
   ├── pull-requests.js    # PR management
   ├── issues.js           # Issue tracking
   ├── workflows.js        # Workflow execution
   └── webhooks.js         # Webhook handling
   ```

2. **Implement Operations**
   - Read repository contents
   - Create/update files
   - Create/manage PRs
   - Create/manage issues
   - Trigger workflows
   - Search code

3. **Add Audit Trail**
   - Log all GitHub API calls
   - Track who did what, when
   - Immutable audit stream

### Phase 3: Multi-Model Support (Week 3)

1. **Model Registration**
   - OpenAI (ChatGPT)
   - Anthropic (Claude)
   - Google (Gemini)
   - GitHub Copilot
   - Custom models

2. **Context Sharing**
   - Shared context pool
   - Context synchronization
   - Context versioning

3. **Coordination Protocol**
   - Multi-model communication
   - Task delegation
   - Result aggregation

### Phase 4: Testing & Deployment (Week 4)

1. **Testing**
   - Unit tests
   - Integration tests
   - Load tests
   - Security tests

2. **Documentation**
   - API reference
   - Integration guide
   - Security guide
   - Troubleshooting guide

3. **Deployment**
   - Production configuration
   - Monitoring setup
   - Alerting configuration
   - Rollback procedures

---

## GitHub MCP Server

### Server Implementation

**File**: `backend/src/mcp/server.js` (TO BE CREATED)

```javascript
import express from 'express';
import { verifyGitHubAppToken } from './auth/github-app.js';
import { handleMCPRequest } from './handlers/request.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { auditMiddleware } from './middleware/audit.js';

export function createMCPServer() {
  const app = express();
  
  app.use(express.json({ limit: '10mb' }));
  
  // MCP endpoint
  app.post('/mcp', 
    rateLimitMiddleware,
    verifyGitHubAppToken,
    auditMiddleware,
    async (req, res) => {
      try {
        const response = await handleMCPRequest(req.body, req.user);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'MCP_ERROR',
            message: error.message
          }
        });
      }
    }
  );
  
  // Health check
  app.get('/mcp/health', (req, res) => {
    res.json({ status: 'ok', service: 'mcp-server' });
  });
  
  return app;
}
```

### Protocol Handler

**File**: `backend/src/mcp/protocol.js` (TO BE CREATED)

```javascript
/**
 * MCP Protocol Implementation
 * Based on Model Context Protocol specification
 */

export class MCPProtocol {
  static VERSION = '1.0';
  
  static createRequest(method, params, context = {}) {
    return {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params,
      context: {
        protocol: 'mcp',
        version: this.VERSION,
        timestamp: new Date().toISOString(),
        ...context
      }
    };
  }
  
  static createResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
  
  static createError(id, code, message, data = {}) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }
  
  static validateRequest(request) {
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      throw new Error('Invalid JSON-RPC version');
    }
    if (!request.method) {
      throw new Error('Missing method');
    }
    if (!request.id) {
      throw new Error('Missing request ID');
    }
    return true;
  }
}

// MCP Methods
export const MCPMethods = {
  // Context management
  CONTEXT_GET: 'context/get',
  CONTEXT_UPDATE: 'context/update',
  CONTEXT_SYNC: 'context/sync',
  
  // Tool execution
  TOOL_EXECUTE: 'tool/execute',
  TOOL_LIST: 'tool/list',
  
  // Resource access
  RESOURCE_READ: 'resource/read',
  RESOURCE_WRITE: 'resource/write',
  RESOURCE_LIST: 'resource/list',
  
  // GitHub operations
  GITHUB_REPO_READ: 'github/repo/read',
  GITHUB_PR_CREATE: 'github/pr/create',
  GITHUB_ISSUE_CREATE: 'github/issue/create',
  GITHUB_WORKFLOW_RUN: 'github/workflow/run'
};
```

---

## MCP Protocol

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "github/repo/read",
  "params": {
    "owner": "InfinityXOneSystems",
    "repo": "quantum-x-builder",
    "path": "README.md"
  },
  "context": {
    "protocol": "mcp",
    "version": "1.0",
    "timestamp": "2026-02-09T12:00:00Z",
    "model": "gpt-4",
    "user": "neo@example.com"
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "content": "# Quantum-X-Builder\n\n...",
    "encoding": "utf-8",
    "sha": "abc123...",
    "size": 1234
  },
  "meta": {
    "timestamp": "2026-02-09T12:00:01Z",
    "duration_ms": 123
  }
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "code": "NOT_FOUND",
    "message": "File not found: README.md",
    "data": {
      "path": "README.md",
      "repo": "quantum-x-builder"
    }
  }
}
```

---

## Authentication

### GitHub App Authentication

```javascript
// File: backend/src/mcp/auth/github-app.js (TO BE CREATED)

import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { Octokit } from '@octokit/rest';

export async function verifyGitHubAppToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Missing authorization token' 
      });
    }
    
    // Verify token with GitHub
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();
    
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid authorization token' 
    });
  }
}

export function generateGitHubAppToken() {
  const privateKey = readFileSync('_state/github-app/private-key.pem');
  const appId = process.env.GITHUB_APP_ID || '2494652';
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iat: now,
    exp: now + 600, // 10 minutes
    iss: appId
  };
  
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}
```

### API Key Authentication

```javascript
// File: backend/src/mcp/auth/api-key.js (TO BE CREATED)

import crypto from 'crypto';

export async function verifyAPIKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Missing API key' 
      });
    }
    
    // Verify API key (from database or config)
    const isValid = await validateAPIKey(apiKey);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid API key' 
      });
    }
    
    req.apiKey = apiKey;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'API key verification failed' 
    });
  }
}

async function validateAPIKey(apiKey) {
  // TODO: Implement API key validation
  // - Check against database
  // - Check expiration
  // - Check permissions
  return true;
}
```

---

## API Reference

### Context Operations

#### Get Context
```
Method: context/get
Description: Retrieve shared context for multi-model coordination
Params:
  - context_id: string (optional)
  - scope: string (optional: "global", "session", "task")
Response:
  - context: object
  - version: string
  - updated_at: timestamp
```

#### Update Context
```
Method: context/update
Description: Update shared context
Params:
  - context_id: string
  - updates: object
  - merge_strategy: string ("merge", "replace")
Response:
  - success: boolean
  - version: string
  - updated_at: timestamp
```

### Tool Operations

#### Execute Tool
```
Method: tool/execute
Description: Execute a tool (GitHub operation, API call, etc.)
Params:
  - tool: string (tool name)
  - arguments: object
  - timeout: number (optional, seconds)
Response:
  - result: any
  - duration_ms: number
  - success: boolean
```

### GitHub Operations

#### Read Repository
```
Method: github/repo/read
Description: Read file from repository
Params:
  - owner: string
  - repo: string
  - path: string
  - ref: string (optional: branch/tag/commit)
Response:
  - content: string
  - encoding: string
  - sha: string
  - size: number
```

#### Create Pull Request
```
Method: github/pr/create
Description: Create a pull request
Params:
  - owner: string
  - repo: string
  - title: string
  - body: string
  - head: string (branch)
  - base: string (target branch)
Response:
  - number: number
  - url: string
  - state: string
```

---

## Testing

### Unit Tests

**File**: `backend/src/mcp/__tests__/protocol.test.js` (TO BE CREATED)

```javascript
import { MCPProtocol, MCPMethods } from '../protocol.js';

describe('MCP Protocol', () => {
  test('creates valid request', () => {
    const request = MCPProtocol.createRequest(
      MCPMethods.GITHUB_REPO_READ,
      { owner: 'test', repo: 'test', path: 'README.md' }
    );
    
    expect(request.jsonrpc).toBe('2.0');
    expect(request.method).toBe(MCPMethods.GITHUB_REPO_READ);
    expect(request.id).toBeDefined();
  });
  
  test('validates request', () => {
    const request = {
      jsonrpc: '2.0',
      id: '123',
      method: 'test/method'
    };
    
    expect(() => MCPProtocol.validateRequest(request)).not.toThrow();
  });
});
```

### Integration Tests

**File**: `backend/src/mcp/__tests__/integration.test.js` (TO BE CREATED)

```javascript
import request from 'supertest';
import { createMCPServer } from '../server.js';

describe('MCP Server Integration', () => {
  let app;
  
  beforeAll(() => {
    app = createMCPServer();
  });
  
  test('health check', async () => {
    const response = await request(app)
      .get('/mcp/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  
  test('GitHub repo read', async () => {
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${process.env.GITHUB_TOKEN}`)
      .send({
        jsonrpc: '2.0',
        id: '123',
        method: 'github/repo/read',
        params: {
          owner: 'InfinityXOneSystems',
          repo: 'quantum-x-builder',
          path: 'README.md'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.result.content).toBeDefined();
  });
});
```

---

## Deployment

### Development

```bash
# Start MCP server in development mode
npm run dev:mcp

# Or with Docker
docker-compose up mcp-server
```

### Production

```bash
# Build MCP server
npm run build:mcp

# Start MCP server
npm run start:mcp

# Or with Docker
docker-compose -f docker-compose.prod.yml up -d mcp-server
```

### Environment Variables

```bash
# MCP Server
MCP_PORT=8787
MCP_HOST=0.0.0.0
MCP_RATE_LIMIT=100  # requests per minute

# GitHub App
GITHUB_APP_ID=2494652
GITHUB_APP_PRIVATE_KEY_PATH=_state/github-app/private-key.pem

# Audit
MCP_AUDIT_LOG_PATH=_OPS/AUDIT/mcp-audit.log
MCP_AUDIT_IMMUTABLE=true
```

---

## Troubleshooting

### Authentication Issues

```bash
# Test GitHub token
curl -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  https://api.github.com/user

# Generate new GitHub App token
node scripts/generate-github-token.js

# Verify API key
curl -H "X-API-Key: ${API_KEY}" \
  http://localhost:8787/mcp/health
```

### Connection Issues

```bash
# Test MCP endpoint
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "jsonrpc": "2.0",
    "id": "123",
    "method": "context/get"
  }'

# Check MCP server logs
docker logs mcp-server

# Check network connectivity
docker exec mcp-server ping github.com
```

### Performance Issues

```bash
# Monitor MCP server
docker stats mcp-server

# Check rate limits
curl http://localhost:8787/mcp/metrics

# Analyze slow requests
cat _OPS/AUDIT/mcp-audit.log | jq '.duration_ms > 1000'
```

---

## Next Steps

1. **Implement Core MCP Server** (Priority 1)
   - Create `backend/src/mcp/` directory structure
   - Implement protocol handlers
   - Add authentication layer

2. **GitHub Integration** (Priority 2)
   - Implement GitHub API proxy
   - Add all GitHub operations
   - Add audit logging

3. **Multi-Model Support** (Priority 3)
   - Implement context sharing
   - Add model registration
   - Implement coordination protocol

4. **Testing & Documentation** (Priority 4)
   - Write comprehensive tests
   - Create API documentation
   - Add examples and tutorials

---

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Status**: DESIGN & PLANNING (Not Implemented)  
**Implementation Target**: Phase 6
