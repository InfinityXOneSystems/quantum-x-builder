/**
 * Command Parser - Translate natural language to system commands
 */

import { recognizeIntent } from '../nlp-engine/intent-recognizer.js';
import { extractEntities } from '../nlp-engine/entity-extractor.js';

/**
 * Parse natural language input into a structured command
 * @param {string} input - User's natural language input
 * @param {string} sessionId - Session identifier for context
 * @returns {{intent: string, entities: object, confidence: number, input: string, parsed: boolean}}
 */
export function parseCommand(input, sessionId = 'default') {
  if (!input || typeof input !== 'string') {
    return {
      intent: 'UNKNOWN',
      entities: { agents: [], workflows: [], services: [], parameters: {} },
      confidence: 0,
      input: '',
      parsed: false,
      error: 'Invalid input',
    };
  }

  try {
    // Step 1: Recognize intent
    const intentResult = recognizeIntent(input);

    // Step 2: Extract entities
    const entities = extractEntities(input, intentResult.intent);

    // Step 3: Build structured command
    const command = {
      intent: intentResult.intent,
      entities,
      confidence: intentResult.confidence,
      matched_keywords: intentResult.matched_keywords,
      input,
      sessionId,
      parsed: intentResult.confidence > 0.3, // Minimum confidence threshold
      timestamp: Date.now(),
    };

    // If confidence is too low, mark as unparsed
    if (command.confidence < 0.3) {
      command.error = 'Low confidence in understanding the command';
      command.suggestion = 'Please try rephrasing or use "help" to see available commands';
    }

    return command;
  } catch (error) {
    return {
      intent: 'UNKNOWN',
      entities: { agents: [], workflows: [], services: [], parameters: {} },
      confidence: 0,
      input,
      sessionId,
      parsed: false,
      error: error.message,
    };
  }
}

/**
 * Convert parsed command to executable action
 * @param {object} command - Parsed command object
 * @returns {{action: string, target: string, parameters: object}}
 */
export function commandToAction(command) {
  const { intent, entities } = command;

  // Default action structure
  const action = {
    type: intent,
    targets: [],
    parameters: entities.parameters || {},
    requiresConfirmation: false,
  };

  // Map intent to specific actions
  switch (intent) {
    case 'START_AGENT':
      action.action = 'agent.start';
      action.targets = entities.agents || [];
      action.requiresConfirmation = false;
      break;

    case 'STOP_AGENT':
      action.action = 'agent.stop';
      action.targets = entities.agents || [];
      action.requiresConfirmation = true; // Safety check
      break;

    case 'STATUS_QUERY':
      action.action = 'system.status';
      action.targets = [...entities.agents, ...entities.workflows, ...entities.services];
      if (action.targets.length === 0) {
        action.targets = ['system'];
      }
      break;

    case 'LIST_QUERY':
      action.action = 'system.list';
      action.parameters.type = entities.agents.length
        ? 'agents'
        : entities.workflows.length
          ? 'workflows'
          : 'all';
      break;

    case 'UPDATE_CONFIG':
      action.action = 'config.update';
      action.requiresConfirmation = true;
      break;

    case 'VIEW_LOGS':
      action.action = 'logs.view';
      action.targets = entities.agents || [];
      break;

    case 'HELP':
      action.action = 'system.help';
      break;

    default:
      action.action = 'unknown';
      action.error = 'Unable to determine action';
  }

  return action;
}
