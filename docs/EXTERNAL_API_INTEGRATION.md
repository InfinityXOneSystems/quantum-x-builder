# External API Integration Guide

**Complete API Reference for Natural Language Control System**

Version: 1.0.0  
Last Updated: 2026-02-11

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [Request Format](#request-format)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)
8. [Webhook Configuration](#webhook-configuration)
9. [Code Examples](#code-examples)
10. [API Reference](#api-reference)

---

## Overview

The External API Integration enables programmatic access to the Natural Language Control System through GitHub's repository_dispatch API.

### Base URL

```
https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches
```

### Supported Methods

- `POST` - Send natural language commands

### Content Type

```
application/json
```

---

## API Endpoints

### Send Natural Language Command

**Endpoint:**
```
POST https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches
```

**Description:** Execute a natural language command on the repository.

**Headers:**
```http
Authorization: Bearer YOUR_GITHUB_TOKEN
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_type": "nl-command",
  "client_payload": {
    "command": "create a branch called feature/new-feature",
    "source": "external",
    "user_id": "api-user-123",
    "auth_token": "YOUR_API_KEY"
  }
}
```

**Response:**
```http
HTTP/1.1 204 No Content
```

---

## Authentication

### Method 1: Bearer Token (GitHub PAT)

**Required Scopes:**
- `repo` - Full control of private repositories
- `workflow` - Update workflows

**Example:**
```http
Authorization: Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to Create:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy token securely

### Method 2: API Key

**Used for:** ChatGPT, Gemini integrations

**Configure as Repository Secret:**
```bash
# In Repository Settings → Secrets and variables → Actions
CHATGPT_API_KEY=your-chatgpt-key
GEMINI_API_KEY=your-gemini-key
```

**Include in Request:**
```json
{
  "client_payload": {
    "auth_token": "YOUR_API_KEY"
  }
}
```

### Method 3: Webhook Signature

**Used for:** Webhook integrations

**Calculate Signature:**
```bash
signature = "sha256=" + HMAC-SHA256(webhook_secret, request_body)
```

**Include in Request:**
```json
{
  "client_payload": {
    "signature": "sha256=abc123..."
  }
}
```

### Method 4: JWT Token

**Used for:** Advanced integrations

**Generate JWT:**
```python
import jwt
import time

payload = {
    'iat': int(time.time()),
    'exp': int(time.time()) + 600,  # 10 minutes
    'iss': 'your-app-id'
}

token = jwt.encode(payload, 'your-secret', algorithm='HS256')
```

**Include in Request:**
```json
{
  "client_payload": {
    "auth_token": "eyJhbGci..."
  }
}
```

---

## Request Format

### Event Types

| Event Type | Description | Source |
|------------|-------------|--------|
| `nl-command` | Generic natural language command | External API |
| `chatgpt-command` | Command from ChatGPT | ChatGPT Custom Action |
| `gemini-command` | Command from Google Gemini | Gemini Function Calling |
| `mobile-command` | Command from GitHub Mobile | GitHub Mobile App |

### Client Payload Schema

```json
{
  "command": "string (required, 3-500 chars)",
  "source": "string (optional, enum: manual|chatgpt|gemini|github-mobile|external)",
  "user_id": "string (optional, 1-100 chars)",
  "auth_token": "string (required for external, 10-500 chars)",
  "metadata": {
    "timestamp": "ISO 8601 datetime",
    "ip_address": "IPv4 address",
    "user_agent": "string",
    "session_id": "string"
  }
}
```

### Request Examples

**Create Branch:**
```json
{
  "event_type": "nl-command",
  "client_payload": {
    "command": "create a branch called feature/authentication",
    "source": "external",
    "user_id": "api-user-123",
    "auth_token": "YOUR_API_KEY"
  }
}
```

**Create Pull Request:**
```json
{
  "event_type": "nl-command",
  "client_payload": {
    "command": "open a PR from develop to main with title 'Release v2.0'",
    "source": "external",
    "user_id": "api-user-123",
    "auth_token": "YOUR_API_KEY"
  }
}
```

**Create Issue:**
```json
{
  "event_type": "nl-command",
  "client_payload": {
    "command": "create an issue titled 'Fix authentication bug'",
    "source": "external",
    "user_id": "api-user-123",
    "auth_token": "YOUR_API_KEY"
  }
}
```

---

## Response Format

### Success Response

**Status Code:** `204 No Content`

**Description:** Command accepted and dispatched to workflow.

**Note:** The actual execution happens asynchronously. Check workflow runs for results.

### Error Responses

#### 401 Unauthorized

```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/rest"
}
```

**Cause:** Invalid or expired GitHub token

**Solution:** Generate new token with correct scopes

#### 403 Forbidden

```json
{
  "message": "Resource not accessible by integration",
  "documentation_url": "https://docs.github.com/rest"
}
```

**Cause:** Insufficient permissions

**Solution:** Ensure token has `repo` and `workflow` scopes

#### 404 Not Found

```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest"
}
```

**Cause:** Repository doesn't exist or no access

**Solution:** Verify repository name and access permissions

#### 422 Unprocessable Entity

```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "client_payload.command",
      "code": "missing_field"
    }
  ]
}
```

**Cause:** Invalid request format

**Solution:** Check request matches schema

---

## Error Handling

### Error Types

| Error Code | Description | Retry? |
|------------|-------------|--------|
| 401 | Invalid credentials | No - Fix auth |
| 403 | Insufficient permissions | No - Update scopes |
| 404 | Resource not found | No - Check path |
| 422 | Validation error | No - Fix request |
| 429 | Rate limit exceeded | Yes - After delay |
| 500 | Server error | Yes - With backoff |
| 502 | Bad gateway | Yes - With backoff |
| 503 | Service unavailable | Yes - With backoff |

### Retry Logic

**Exponential Backoff:**

```python
import time
import requests

def execute_command_with_retry(command, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(
                'https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches',
                headers={
                    'Authorization': f'Bearer {GITHUB_TOKEN}',
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                json={
                    'event_type': 'nl-command',
                    'client_payload': {
                        'command': command,
                        'source': 'external',
                        'auth_token': API_KEY
                    }
                }
            )
            
            if response.status_code == 204:
                return {'success': True}
            
            if response.status_code in [429, 500, 502, 503]:
                # Retry with exponential backoff
                delay = 2 ** attempt
                time.sleep(delay)
                continue
            
            # Don't retry for other errors
            return {
                'success': False,
                'error': response.json()
            }
        
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    
    return {'success': False, 'error': 'Max retries exceeded'}
```

---

## Rate Limits

### Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Per Hour | 100 requests | 60 minutes |
| Per Day | 1,000 requests | 24 hours |
| Burst | 10 requests | 1 minute |

### Per-Source Limits

| Source | Requests/Hour |
|--------|---------------|
| ChatGPT | 50 |
| Gemini | 50 |
| GitHub Mobile | 100 |
| Manual | 200 |

### Rate Limit Headers

GitHub API includes rate limit information:

```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1676067600
X-RateLimit-Used: 1
```

### Check Rate Limit

**Request:**
```bash
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/rate_limit
```

**Response:**
```json
{
  "rate": {
    "limit": 5000,
    "remaining": 4999,
    "reset": 1676067600,
    "used": 1
  }
}
```

### Handle Rate Limiting

```python
import time

def wait_for_rate_limit_reset(response):
    if response.status_code == 429:
        reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
        current_time = int(time.time())
        wait_seconds = max(reset_time - current_time, 0) + 1
        print(f"Rate limited. Waiting {wait_seconds} seconds...")
        time.sleep(wait_seconds)
        return True
    return False
```

---

## Webhook Configuration

### Setup Webhook

1. Go to Repository Settings → Webhooks
2. Click "Add webhook"
3. Configure:

**Payload URL:**
```
https://your-server.com/webhook/quantum-x-builder
```

**Content type:**
```
application/json
```

**Secret:**
```
YOUR_WEBHOOK_SECRET
```

**Events:**
- [x] Repository dispatch

### Verify Webhook Signature

**Python Example:**

```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)

# In your webhook handler
signature = request.headers.get('X-Hub-Signature-256')
if not verify_signature(request.body, signature, WEBHOOK_SECRET):
    return 'Unauthorized', 401
```

**Node.js Example:**

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expected = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler
const signature = req.headers['x-hub-signature-256'];
if (!verifySignature(req.body, signature, WEBHOOK_SECRET)) {
  res.status(401).send('Unauthorized');
  return;
}
```

---

## Code Examples

### Python (requests)

```python
import requests

GITHUB_TOKEN = 'ghp_your_token'
API_KEY = 'your_api_key'

def execute_command(command):
    url = 'https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches'
    
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    }
    
    data = {
        'event_type': 'nl-command',
        'client_payload': {
            'command': command,
            'source': 'external',
            'user_id': 'python-script',
            'auth_token': API_KEY
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 204:
        print(f'✅ Command executed: {command}')
        return True
    else:
        print(f'❌ Error: {response.status_code}')
        print(response.text)
        return False

# Examples
execute_command('create a branch called feature/test')
execute_command('create an issue for testing')
execute_command('trigger the ci workflow')
```

### JavaScript (Node.js)

```javascript
const fetch = require('node-fetch');

const GITHUB_TOKEN = 'ghp_your_token';
const API_KEY = 'your_api_key';

async function executeCommand(command) {
  const url = 'https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_type: 'nl-command',
      client_payload: {
        command: command,
        source: 'external',
        user_id: 'node-script',
        auth_token: API_KEY
      }
    })
  });
  
  if (response.status === 204) {
    console.log(`✅ Command executed: ${command}`);
    return true;
  } else {
    console.log(`❌ Error: ${response.status}`);
    const text = await response.text();
    console.log(text);
    return false;
  }
}

// Examples
executeCommand('create a branch called feature/test');
executeCommand('create an issue for testing');
executeCommand('trigger the ci workflow');
```

### cURL (Bash)

```bash
#!/bin/bash

GITHUB_TOKEN="ghp_your_token"
API_KEY="your_api_key"

execute_command() {
  local command="$1"
  
  curl -X POST \
    https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"nl-command\",
      \"client_payload\": {
        \"command\": \"$command\",
        \"source\": \"external\",
        \"user_id\": \"bash-script\",
        \"auth_token\": \"$API_KEY\"
      }
    }"
  
  if [ $? -eq 0 ]; then
    echo "✅ Command executed: $command"
  else
    echo "❌ Command failed"
  fi
}

# Examples
execute_command "create a branch called feature/test"
execute_command "create an issue for testing"
execute_command "trigger the ci workflow"
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    GitHubToken = "ghp_your_token"
    APIKey      = "your_api_key"
    URL         = "https://api.github.com/repos/InfinityXOneSystems/quantum-x-builder/dispatches"
)

type ClientPayload struct {
    Command   string `json:"command"`
    Source    string `json:"source"`
    UserID    string `json:"user_id"`
    AuthToken string `json:"auth_token"`
}

type RequestBody struct {
    EventType     string        `json:"event_type"`
    ClientPayload ClientPayload `json:"client_payload"`
}

func executeCommand(command string) error {
    body := RequestBody{
        EventType: "nl-command",
        ClientPayload: ClientPayload{
            Command:   command,
            Source:    "external",
            UserID:    "go-script",
            AuthToken: APIKey,
        },
    }
    
    jsonData, err := json.Marshal(body)
    if err != nil {
        return err
    }
    
    req, err := http.NewRequest("POST", URL, bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }
    
    req.Header.Set("Authorization", "Bearer "+GitHubToken)
    req.Header.Set("Accept", "application/vnd.github+json")
    req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 204 {
        fmt.Printf("✅ Command executed: %s\n", command)
        return nil
    }
    
    return fmt.Errorf("❌ Error: %d", resp.StatusCode)
}

func main() {
    executeCommand("create a branch called feature/test")
    executeCommand("create an issue for testing")
    executeCommand("trigger the ci workflow")
}
```

---

## API Reference

### Command Patterns

Full list of supported patterns in `scripts/command-router.js`:

**Branch Operations:**
- `create (?:a )?(?:new )?branch (?:called |named )?['"']?([^'"]+)['"']?`
- `delete (?:the )?branch ['"']?([^'"]+)['"']?`
- `(?:switch to|checkout) (?:the )?branch ['"']?([^'"]+)['"']?`

**Pull Request Operations:**
- `(?:create|open) (?:a )?(?:new )?(?:pull request|pr) from ['"']?([^'"]+)['"']? to ['"']?([^'"]+)['"']?`
- `merge (?:pull request|pr) #?(\d+)`
- `close (?:pull request|pr) #?(\d+)`

**Issue Operations:**
- `create (?:a )?(?:new )?issue(?: titled| with title| for)? ['"']?([^'"]+)['"']?`
- `close issue #?(\d+)`
- `reopen issue #?(\d+)`
- `add label ['"']?([^'"]+)['"']? to issue #?(\d+)`

**File Operations:**
- `update (?:the )?file ['"']?([^'"]+)['"']?`
- `create (?:a )?(?:new )?file ['"']?([^'"]+)['"']?`
- `delete (?:the )?file ['"']?([^'"]+)['"']?`

**Workflow Operations:**
- `(?:trigger|run) (?:the )?workflow ['"']?([^'"]+)['"']?`
- `enable (?:the )?workflow ['"']?([^'"]+)['"']?`
- `disable (?:the )?workflow ['"']?([^'"]+)['"']?`

**Repository Settings:**
- `update (?:repository|repo) description (?:to )?['"']?([^'"]+)['"']?`
- `enable (?:github )?pages`
- `(?:update|set) (?:repository|repo) topics (?:to )?['"']?([^'"]+)['"']?`

**Collaborator Management:**
- `add (?:collaborator|user) ['"']?([^'"]+)['"']?(?: with ([a-z]+) access)?`
- `remove (?:collaborator|user) ['"']?([^'"]+)['"']?`

**Security:**
- `list (?:repository |repo )?secrets`

**Deployment:**
- `deploy (?:to )?([a-z]+)`

---

## Additional Resources

- **User Guide**: `docs/NATURAL_LANGUAGE_CONTROL.md`
- **Configuration**: `.github/nl-config.yml`
- **Schema**: `schemas/nl-command-schema.json`
- **Command Router**: `scripts/command-router.js`
- **Auth Validator**: `scripts/auth-validator.js`

---

**Last Updated:** 2026-02-11  
**Version:** 1.0.0  
**Maintained by:** InfinityXOneSystems
