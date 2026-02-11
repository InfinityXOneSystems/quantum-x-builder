/**
 * Audit Logger - Track all natural language interactions
 */

import fs from 'fs';
import path from 'path';

const AUDIT_DIR = path.join(process.cwd(), '_OPS', 'AUDIT');
const AUDIT_FILE = path.join(AUDIT_DIR, 'nl-commands.log');

/**
 * Ensure audit directory exists
 */
function ensureAuditDir() {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

/**
 * Log a natural language command
 * @param {object} entry - Audit log entry
 */
export function logCommand(entry) {
  ensureAuditDir();

  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(AUDIT_FILE, logLine, 'utf-8');
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

/**
 * Log a successful command execution
 * @param {string} userId - User ID
 * @param {string} input - Natural language input
 * @param {object} command - Parsed command
 * @param {object} result - Execution result
 */
export function logSuccess(userId, input, command, result) {
  logCommand({
    level: 'INFO',
    type: 'command.success',
    userId,
    sessionId: command.sessionId,
    input,
    intent: command.intent,
    action: result.action,
    success: true,
  });
}

/**
 * Log a failed command execution
 * @param {string} userId - User ID
 * @param {string} input - Natural language input
 * @param {object} command - Parsed command (may be null)
 * @param {object} result - Execution result with errors
 */
export function logFailure(userId, input, command, result) {
  logCommand({
    level: 'ERROR',
    type: 'command.failure',
    userId,
    sessionId: command?.sessionId,
    input,
    intent: command?.intent,
    action: result?.action,
    error: result?.error || result?.errors?.join('; '),
    success: false,
  });
}

/**
 * Log a security event
 * @param {string} userId - User ID
 * @param {string} event - Security event type
 * @param {object} details - Event details
 */
export function logSecurityEvent(userId, event, details) {
  logCommand({
    level: 'SECURITY',
    type: `security.${event}`,
    userId,
    ...details,
  });
}

/**
 * Get recent audit logs
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} Audit log entries
 */
export function getRecentLogs(limit = 100) {
  if (!fs.existsSync(AUDIT_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(AUDIT_FILE, 'utf-8');
    const lines = content
      .split('\n')
      .filter(line => line.trim())
      .slice(-limit);

    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to read audit logs:', error.message);
    return [];
  }
}

/**
 * Create middleware for audit logging
 * @returns {Function} Express middleware
 */
export function auditMiddleware() {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function (body) {
      // Log the command execution
      if (req.nlCommand && req.user) {
        if (body.success) {
          logSuccess(req.user.id, req.body.input, req.nlCommand, body);
        } else {
          logFailure(req.user.id, req.body.input, req.nlCommand, body);
        }
      }

      return originalJson(body);
    };

    next();
  };
}
