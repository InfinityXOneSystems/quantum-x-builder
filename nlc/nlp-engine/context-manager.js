/**
 * Context Manager - Maintain conversation state and command history
 */

// In-memory context storage (in production, use Redis or similar)
const contexts = new Map();

/**
 * Create or get a conversation context
 * @param {string} sessionId - Unique session identifier
 * @returns {object} Context object
 */
export function getContext(sessionId) {
  if (!contexts.has(sessionId)) {
    contexts.set(sessionId, {
      sessionId,
      history: [],
      lastIntent: null,
      lastEntities: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return contexts.get(sessionId);
}

/**
 * Update conversation context with new command
 * @param {string} sessionId - Session identifier
 * @param {object} command - Processed command object
 */
export function updateContext(sessionId, command) {
  const context = getContext(sessionId);

  context.history.push({
    timestamp: Date.now(),
    input: command.input,
    intent: command.intent,
    entities: command.entities,
    result: command.result,
  });

  // Keep only last 50 commands in history
  if (context.history.length > 50) {
    context.history = context.history.slice(-50);
  }

  context.lastIntent = command.intent;
  context.lastEntities = command.entities;
  context.updatedAt = Date.now();

  contexts.set(sessionId, context);
}

/**
 * Clear a conversation context
 * @param {string} sessionId - Session identifier
 */
export function clearContext(sessionId) {
  contexts.delete(sessionId);
}

/**
 * Get conversation history
 * @param {string} sessionId - Session identifier
 * @param {number} limit - Maximum number of history items to return
 * @returns {Array} Command history
 */
export function getHistory(sessionId, limit = 10) {
  const context = getContext(sessionId);
  return context.history.slice(-limit);
}

/**
 * Clean up old contexts (sessions older than 24 hours)
 */
export function cleanupOldContexts() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

  for (const [sessionId, context] of contexts.entries()) {
    if (context.updatedAt < cutoff) {
      contexts.delete(sessionId);
    }
  }
}

// Cleanup old contexts every hour
setInterval(cleanupOldContexts, 60 * 60 * 1000);
