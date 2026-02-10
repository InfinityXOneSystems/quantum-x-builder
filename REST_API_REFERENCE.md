# REST API Reference
**Quantum-X-Builder REST API Documentation**  
**Version**: 1.0  
**Date**: 2026-02-09  
**Base URL**: `http://localhost:8787` (development) | `https://api.quantum-x-builder.com` (production)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [AI Services API](#ai-services-api)
4. [Provider APIs](#provider-apis)
5. [Health & Status](#health--status)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Overview

The Quantum-X-Builder REST API provides access to:
- AI service management and configuration
- Multi-provider AI integrations (Ollama, Groq, Gemini, Vertex AI)
- System health and status monitoring
- Control plane operations

### API Conventions

- **Content-Type**: `application/json`
- **Authentication**: PAT (Personal Access Token) or API Key
- **Rate Limiting**: 100 requests/minute per user
- **Versioning**: Currently v1 (implicit)

---

## Authentication

### Using PAT (Personal Access Token)

```bash
curl -X GET http://localhost:8787/api/ai/services/status \
  -H "Authorization: Bearer YOUR_PAT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using API Key

```bash
curl -X GET http://localhost:8787/api/ai/services/status \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### Authentication Scopes

| Scope | Description |
|-------|-------------|
| `ai:services:read` | Read AI service configuration |
| `ai:services:write` | Update AI service configuration |
| `ai:services:test` | Test AI service connections |
| `admin` | Full administrative access |

---

## AI Services API

### Get AI Services Status

**Endpoint**: `GET /api/ai/services/status`  
**Authentication**: Not required (public endpoint)  
**Description**: Get availability and status of all AI services

**Response**:
```json
{
  "status": "ok",
  "services": {
    "chatgpt": {
      "name": "ChatGPT",
      "enabled": false,
      "auth_method": "github_oauth",
      "permissions": ["read", "write", "execute"]
    },
    "github_copilot": {
      "name": "GitHub Copilot",
      "enabled": false,
      "auth_method": "github_app_token",
      "permissions": ["read", "write", "execute"]
    },
    "vscode_copilot": {
      "name": "VS Code Copilot",
      "enabled": false,
      "auth_method": "github_app_token",
      "permissions": ["read", "write", "execute"]
    },
    "google_gemini": {
      "name": "Google Gemini",
      "enabled": false,
      "auth_method": "github_oauth",
      "permissions": ["read", "write", "execute"]
    }
  }
}
```

### Get Service Configuration

**Endpoint**: `GET /api/ai/services/:service/config`  
**Authentication**: Required (Scope: `ai:services:read`, `admin`)  
**Parameters**:
- `service` (path): Service name (`chatgpt`, `github_copilot`, `vscode_copilot`, `google_gemini`)

**Response**:
```json
{
  "service": "chatgpt",
  "config": {
    "enabled": true,
    "model": "gpt-4",
    "api_endpoint": "https://api.openai.com/v1",
    "max_tokens": 4096,
    "temperature": 0.7
  },
  "status": "enabled"
}
```

**Error Response** (401):
```json
{
  "error": "Unauthorized"
}
```

### Test Service Connection

**Endpoint**: `POST /api/ai/services/:service/test`  
**Authentication**: Required (Scope: `ai:services:test`, `admin`)  
**Parameters**:
- `service` (path): Service name

**Request Body**:
```json
{
  "message": "Hello, test message"
}
```

**Response** (Success):
```json
{
  "status": "success",
  "service": "chatgpt",
  "response": "Hello! I'm working correctly.",
  "latency_ms": 234,
  "model": "gpt-4"
}
```

**Response** (Failure):
```json
{
  "status": "error",
  "service": "chatgpt",
  "error": "Connection timeout",
  "details": "Unable to reach API endpoint"
}
```

---

## Provider APIs

### Ollama Provider

**Configuration**:
```bash
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

**Health Check**:
```bash
curl http://localhost:11434/api/tags
```

**Provider Interface**:
```javascript
// backend/src/providers/ollama.js
export async function callOllama(messages, requestConfig, systemInstruction)
```

### Groq Provider

**Configuration**:
```bash
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Provider Interface**:
```javascript
// backend/src/providers/groq.js
export async function callGroq(messages, requestConfig, systemInstruction)
```

### Vertex AI Provider

**Configuration**:
```bash
VERTEX_ACCESS_TOKEN=your_vertex_token
VERTEX_PROJECT_ID=your_gcp_project
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro-002
```

**Endpoint**: `https://{location}-aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/{model}:generateContent`

**Provider Interface**:
```javascript
// backend/src/providers/vertex.js
export async function callVertex(messages, requestConfig, systemInstruction)
```

### Gemini Provider

**Configuration**:
```bash
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

**Provider Interface**:
```javascript
// backend/src/providers/gemini.js
export async function callGemini(messages, requestConfig, systemInstruction)
```

---

## Health & Status

### Health Check

**Endpoint**: `GET /health`  
**Authentication**: Not required  
**Description**: Check if the backend service is running

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T12:00:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### System Status

**Endpoint**: `GET /api/status`  
**Authentication**: Not required  
**Description**: Get comprehensive system status

**Response**:
```json
{
  "status": "operational",
  "timestamp": "2026-02-09T12:00:00Z",
  "services": {
    "backend": "up",
    "nats": "up",
    "gateway": "up"
  },
  "providers": {
    "ollama": "unavailable",
    "groq": "available",
    "gemini": "available",
    "vertex": "available"
  },
  "metrics": {
    "requests_per_minute": 42,
    "avg_response_time_ms": 234,
    "error_rate": 0.01
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2026-02-09T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `MISSING_AUTH` | Authentication token missing |
| `INVALID_TOKEN` | Authentication token invalid |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PROVIDER_UNAVAILABLE` | AI provider is unavailable |
| `INVALID_REQUEST` | Request validation failed |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

### Default Limits

- **Per User**: 100 requests/minute
- **Per IP**: 200 requests/minute
- **Burst**: 20 requests

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707485760
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60,
  "limit": 100,
  "window": "1 minute"
}
```

---

## Examples

### Example 1: Get AI Services Status

```bash
curl -X GET http://localhost:8787/api/ai/services/status \
  -H "Content-Type: application/json"
```

### Example 2: Test ChatGPT Connection

```bash
curl -X POST http://localhost:8787/api/ai/services/chatgpt/test \
  -H "Authorization: Bearer YOUR_PAT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, are you working?"
  }'
```

### Example 3: Get Service Configuration

```bash
curl -X GET http://localhost:8787/api/ai/services/chatgpt/config \
  -H "Authorization: Bearer YOUR_PAT_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 4: Health Check

```bash
curl -X GET http://localhost:8787/health
```

### Example 5: System Status with Metrics

```bash
curl -X GET http://localhost:8787/api/status \
  -H "Content-Type: application/json"
```

### Example 6: Using with JavaScript

```javascript
const API_BASE = 'http://localhost:8787';
const API_TOKEN = 'YOUR_PAT_TOKEN';

async function getAIServicesStatus() {
  const response = await fetch(`${API_BASE}/api/ai/services/status`);
  const data = await response.json();
  return data;
}

async function testService(serviceName, message) {
  const response = await fetch(`${API_BASE}/api/ai/services/${serviceName}/test`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  return await response.json();
}

// Usage
const status = await getAIServicesStatus();
console.log('Services:', status.services);

const testResult = await testService('chatgpt', 'Hello!');
console.log('Test result:', testResult);
```

### Example 7: Using with Python

```python
import requests

API_BASE = 'http://localhost:8787'
API_TOKEN = 'YOUR_PAT_TOKEN'

def get_ai_services_status():
    response = requests.get(f'{API_BASE}/api/ai/services/status')
    return response.json()

def test_service(service_name, message):
    response = requests.post(
        f'{API_BASE}/api/ai/services/{service_name}/test',
        headers={
            'Authorization': f'Bearer {API_TOKEN}',
            'Content-Type': 'application/json'
        },
        json={'message': message}
    )
    return response.json()

# Usage
status = get_ai_services_status()
print('Services:', status['services'])

test_result = test_service('chatgpt', 'Hello!')
print('Test result:', test_result)
```

---

## Provider-Specific Details

### Ollama

**Local Deployment Required**: Yes  
**Network**: Internal  
**Cost**: Free  
**Latency**: Low (local)  
**Recommended Models**: llama3.1, mistral, codellama

**Setup**:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.1

# Verify
curl http://localhost:11434/api/tags
```

### Groq

**Cloud Service**: Yes  
**Network**: External (API)  
**Cost**: Pay-per-use  
**Latency**: Low (optimized inference)  
**Recommended Models**: llama-3.3-70b-versatile, mixtral-8x7b

**API Key**: Required (get from https://console.groq.com)

### Vertex AI (Google Cloud)

**Cloud Service**: Yes  
**Network**: External (Google Cloud)  
**Cost**: Pay-per-use  
**Latency**: Medium  
**Recommended Models**: gemini-1.5-pro-002

**Setup**: Requires Google Cloud project and service account

### Gemini (Google AI)

**Cloud Service**: Yes  
**Network**: External (Google AI)  
**Cost**: Free tier available  
**Latency**: Low  
**Recommended Models**: gemini-2.0-flash-exp, gemini-pro

**API Key**: Required (get from https://aistudio.google.com)

---

## Future APIs (Phase 6)

### MCP API (Planned)

**Endpoint**: `POST /mcp`  
**Description**: Model Context Protocol integration for multi-AI coordination

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": "123",
  "method": "github/repo/read",
  "params": {
    "owner": "InfinityXOneSystems",
    "repo": "quantum-x-builder",
    "path": "README.md"
  }
}
```

### Multi-Runner Coordination API (Planned)

**Endpoint**: `POST /api/runners/coordinate`  
**Description**: Coordinate tasks across multiple AI runners

### Bounded Self-Dispatch API (Planned)

**Endpoint**: `POST /api/autonomy/dispatch`  
**Description**: Self-dispatch tasks within bounded autonomy rules

---

## WebSocket API

### Chat Gateway WebSocket

**Endpoint**: `ws://localhost:8090/ws`  
**Protocol**: WebSocket  
**Authentication**: Optional (connection message)

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:8090/ws');

ws.onopen = () => {
  console.log('Connected to chat gateway');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message:', data);
};

// Send message
ws.send(JSON.stringify({
  type: 'chat',
  target: 'system',
  message: 'Hello'
}));
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store API tokens securely** (never in code)
3. **Implement retry logic** for transient failures
4. **Handle rate limits gracefully**
5. **Use health checks** before making requests
6. **Log API errors** for debugging
7. **Cache responses** when appropriate
8. **Use connection pooling** for multiple requests

---

## Support & Resources

- **Documentation**: `/docs`
- **GitHub**: https://github.com/InfinityXOneSystems/quantum-x-builder
- **Issues**: https://github.com/InfinityXOneSystems/quantum-x-builder/issues
- **Security**: Report to security@example.com

---

## Changelog

### Version 1.0 (2026-02-09)
- Initial API documentation
- AI Services API documented
- Health & Status endpoints documented
- Provider APIs documented
- Rate limiting documented

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Status**: CURRENT  
**API Version**: v1
