#!/usr/bin/env node
/**
 * Authentication Validator
 * Validates tokens and permissions for Natural Language Command Interface
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Validate webhook signature
 */
function validateWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Validate JWT token
 */
function validateJWT(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Validate API key
 */
function validateAPIKey(apiKey, expectedKey) {
  if (!apiKey || !expectedKey) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  );
}

/**
 * Check user permissions
 */
function checkPermissions(user, requiredPermissions) {
  if (!user || !user.permissions) {
    return false;
  }
  
  return requiredPermissions.every(perm => 
    user.permissions.includes(perm)
  );
}

/**
 * Generate audit log entry
 */
function generateAuditLog(request, result) {
  const timestamp = new Date().toISOString();
  
  return {
    timestamp,
    event_type: 'authentication',
    source: request.source || 'unknown',
    user_id: request.user_id || 'unknown',
    command: request.command || 'none',
    result: result.valid ? 'success' : 'failure',
    reason: result.reason || 'none',
    ip_address: request.ip_address || 'unknown'
  };
}

/**
 * Main validation function
 */
async function validateRequest() {
  try {
    const eventName = process.env.EVENT_NAME;
    const clientPayload = JSON.parse(process.env.CLIENT_PAYLOAD || '{}');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔐 Authentication Validator`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Event: ${eventName}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Validate based on event type
    let result = { valid: false, reason: 'unknown_event' };
    
    switch (eventName) {
      case 'nl-command':
      case 'chatgpt-command':
      case 'gemini-command':
      case 'mobile-command':
        result = validateExternalCommand(clientPayload, webhookSecret);
        break;
      
      default:
        result = { valid: false, reason: `Unknown event type: ${eventName}` };
    }
    
    // Generate audit log
    const auditLog = generateAuditLog({
      source: eventName,
      user_id: clientPayload.user_id,
      command: clientPayload.command,
      ip_address: clientPayload.ip_address
    }, result);
    
    console.log(`\n📋 Audit Log:`);
    console.log(JSON.stringify(auditLog, null, 2));
    
    // Save audit log
    const fs = require('fs');
    const path = require('path');
    
    const auditDir = path.join(process.cwd(), '_OPS', 'AUDIT');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    
    const auditFile = path.join(auditDir, 'auth-audit.log');
    fs.appendFileSync(auditFile, JSON.stringify(auditLog) + '\n');
    
    // Output result
    console.log(`\n${'='.repeat(60)}`);
    if (result.valid) {
      console.log(`✅ Authentication successful`);
    } else {
      console.log(`❌ Authentication failed: ${result.reason}`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
    // Set outputs if running in GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `valid=${result.valid}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `reason=${result.reason || 'none'}\n`);
    }
    
    if (!result.valid) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Validation error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Validate external command
 */
function validateExternalCommand(payload, secret) {
  // Check for required fields
  if (!payload.command) {
    return { valid: false, reason: 'missing_command' };
  }
  
  // Validate authentication token if present
  if (payload.auth_token) {
    const chatgptKey = process.env.CHATGPT_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    // Check against known API keys
    if (chatgptKey && payload.auth_token === chatgptKey) {
      return { valid: true, reason: 'chatgpt_authenticated' };
    }
    
    if (geminiKey && payload.auth_token === geminiKey) {
      return { valid: true, reason: 'gemini_authenticated' };
    }
    
    // Try JWT validation
    if (secret) {
      const jwtResult = validateJWT(payload.auth_token, secret);
      if (jwtResult.valid) {
        return { valid: true, reason: 'jwt_authenticated' };
      }
    }
    
    return { valid: false, reason: 'invalid_auth_token' };
  }
  
  // Validate webhook signature if present
  if (payload.signature && secret) {
    const signatureValid = validateWebhookSignature(
      payload,
      payload.signature,
      secret
    );
    
    if (signatureValid) {
      return { valid: true, reason: 'webhook_signature_valid' };
    }
    
    return { valid: false, reason: 'invalid_webhook_signature' };
  }
  
  // If no authentication provided, check if auth is required
  const requireAuth = process.env.REQUIRE_AUTH !== 'false';
  
  if (!requireAuth) {
    console.log(`⚠️ Warning: Authentication not required (REQUIRE_AUTH=false)`);
    return { valid: true, reason: 'auth_not_required' };
  }
  
  return { valid: false, reason: 'no_authentication_provided' };
}

// Run if executed directly
if (require.main === module) {
  validateRequest();
}

module.exports = {
  validateWebhookSignature,
  validateJWT,
  validateAPIKey,
  checkPermissions,
  generateAuditLog,
  validateExternalCommand
};
