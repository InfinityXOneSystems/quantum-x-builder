/**
 * Intent Recognizer - Parse user commands and identify intended actions
 * Supports basic command patterns for system control
 */

// Define supported intents and their patterns
const INTENT_PATTERNS = {
  START_AGENT: {
    keywords: ['start', 'run', 'launch', 'execute', 'activate'],
    entities: ['agent', 'workflow', 'service'],
    examples: ['start the evolution agent', 'run fix-all workflow'],
  },
  STOP_AGENT: {
    keywords: ['stop', 'halt', 'terminate', 'kill', 'pause'],
    entities: ['agent', 'workflow', 'service'],
    examples: ['stop the autonomous agent', 'halt workflow'],
  },
  STATUS_QUERY: {
    keywords: ['status', 'state', 'health', 'check', 'show', 'what'],
    entities: ['system', 'agent', 'workflow', 'service'],
    examples: ['what is the system status', 'show agent health'],
  },
  LIST_QUERY: {
    keywords: ['list', 'show all', 'display', 'get'],
    entities: ['agents', 'workflows', 'services', 'logs'],
    examples: ['list all agents', 'show workflows'],
  },
  UPDATE_CONFIG: {
    keywords: ['update', 'change', 'modify', 'set', 'configure'],
    entities: ['config', 'settings', 'deployment', 'parameter'],
    examples: ['update deployment settings', 'change config'],
  },
  VIEW_LOGS: {
    keywords: ['view', 'show', 'display', 'read'],
    entities: ['logs', 'audit', 'history', 'output'],
    examples: ['view agent logs', 'show audit history'],
  },
  HELP: {
    keywords: ['help', 'assist', 'guide', 'how', 'what can'],
    entities: [],
    examples: ['help', 'what can you do'],
  },
};

/**
 * Recognize intent from user input
 * @param {string} input - User's natural language input
 * @returns {{intent: string, confidence: number, matched_keywords: string[]}}
 */
export function recognizeIntent(input) {
  if (!input || typeof input !== 'string') {
    return { intent: 'UNKNOWN', confidence: 0, matched_keywords: [] };
  }

  const normalizedInput = input.toLowerCase().trim();
  const words = normalizedInput.split(/\s+/);

  let bestIntent = 'UNKNOWN';
  let bestScore = 0;
  let bestMatches = [];

  for (const [intentName, pattern] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    const matches = [];

    // Check for keyword matches
    for (const keyword of pattern.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += 2;
        matches.push(keyword);
      }
    }

    // Check for entity mentions
    for (const entity of pattern.entities) {
      if (normalizedInput.includes(entity)) {
        score += 1;
      }
    }

    // Boost score for exact phrase matches
    for (const example of pattern.examples) {
      if (normalizedInput.includes(example)) {
        score += 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intentName;
      bestMatches = matches;
    }
  }

  // Calculate confidence (0-1 scale)
  const confidence = Math.min(bestScore / 5, 1.0);

  return {
    intent: bestIntent,
    confidence,
    matched_keywords: bestMatches,
  };
}

/**
 * Get available intents and their descriptions
 * @returns {Array<{intent: string, description: string, examples: string[]}>}
 */
export function getAvailableIntents() {
  return Object.entries(INTENT_PATTERNS).map(([intent, pattern]) => ({
    intent,
    description: `${pattern.keywords.join(', ')} + ${pattern.entities.join(', ')}`,
    examples: pattern.examples,
  }));
}
