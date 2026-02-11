/**
 * Entity Extractor - Extract parameters, targets, and context from user input
 */

// Known entities in the system
const KNOWN_AGENTS = [
  'autonomous-agent',
  'autonomous agent',
  'validation-agent',
  'validation agent',
  'validator-agent',
  'validator agent',
  'healing-agent',
  'healing agent',
  'fix-all-agent',
  'fix-all agent',
  'fix all agent',
  'evolution-agent',
  'evolution agent',
];

const KNOWN_WORKFLOWS = [
  'fix-all-persistent',
  'fix all persistent',
  'fix-all',
  'fix all',
  'ultimate-fix-all',
  'ultimate fix all',
  'auto-maintain',
  'auto maintain',
  'validation-agent',
  'validation workflow',
  'evolution-agent',
  'evolution workflow',
];

const KNOWN_SERVICES = ['backend', 'frontend', 'website', 'database', 'api'];

/**
 * Extract entities from user input
 * @param {string} input - User's natural language input
 * @param {string} intent - Recognized intent
 * @returns {{agents: string[], workflows: string[], services: string[], parameters: object}}
 */
export function extractEntities(input, intent) {
  if (!input || typeof input !== 'string') {
    return { agents: [], workflows: [], services: [], parameters: {} };
  }

  const normalizedInput = input.toLowerCase().trim();
  const agents = [];
  const workflows = [];
  const services = [];
  const parameters = {};

  // Extract agents
  for (const agent of KNOWN_AGENTS) {
    if (normalizedInput.includes(agent)) {
      const normalized = agent.replace(/\s+/g, '-');
      if (!agents.includes(normalized)) {
        agents.push(normalized);
      }
    }
  }

  // Extract workflows
  for (const workflow of KNOWN_WORKFLOWS) {
    if (normalizedInput.includes(workflow)) {
      const normalized = workflow.replace(/\s+/g, '-');
      if (!workflows.includes(normalized)) {
        workflows.push(normalized);
      }
    }
  }

  // Extract services
  for (const service of KNOWN_SERVICES) {
    if (normalizedInput.includes(service)) {
      if (!services.includes(service)) {
        services.push(service);
      }
    }
  }

  // Extract common parameters
  if (normalizedInput.includes('all')) {
    parameters.scope = 'all';
  }

  // Extract time-related parameters
  const timeMatch = normalizedInput.match(/(\d+)\s*(hour|minute|second|day)s?/);
  if (timeMatch) {
    parameters.duration = {
      value: parseInt(timeMatch[1], 10),
      unit: timeMatch[2],
    };
  }

  return {
    agents,
    workflows,
    services,
    parameters,
  };
}

/**
 * Get all known entities in the system
 * @returns {{agents: string[], workflows: string[], services: string[]}}
 */
export function getKnownEntities() {
  return {
    agents: [...new Set(KNOWN_AGENTS.map(a => a.replace(/\s+/g, '-')))],
    workflows: [...new Set(KNOWN_WORKFLOWS.map(w => w.replace(/\s+/g, '-')))],
    services: KNOWN_SERVICES,
  };
}
