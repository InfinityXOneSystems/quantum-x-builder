/**
 * Command Executor - Route commands to appropriate system components
 */

import { validateCommand } from './validator.js';

// Import agent integration (will be injected by backend)
let agentIntegration = null;

/**
 * Set agent integration service
 * @param {object} integration - Agent integration service
 */
export function setAgentIntegration(integration) {
  agentIntegration = integration;
}

/**
 * Execute a validated command
 * @param {object} action - Action to execute
 * @param {object} user - User context
 * @returns {Promise<object>} Execution result
 */
export async function executeCommand(action, user = null) {
  // Validate before execution
  const validation = validateCommand(action, user);

  if (!validation.valid) {
    return {
      success: false,
      action: action.action,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  try {
    // Route to appropriate handler based on action type
    let result;

    switch (action.action) {
      case 'agent.start':
        result = await handleAgentStart(action);
        break;

      case 'agent.stop':
        result = await handleAgentStop(action);
        break;

      case 'system.status':
        result = await handleSystemStatus(action);
        break;

      case 'system.list':
        result = await handleSystemList(action);
        break;

      case 'config.update':
        result = await handleConfigUpdate(action);
        break;

      case 'logs.view':
        result = await handleLogsView(action);
        break;

      case 'system.help':
        result = handleHelp();
        break;

      default:
        result = {
          success: false,
          error: `Unknown action: ${action.action}`,
        };
    }

    return {
      ...result,
      warnings: validation.warnings,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      action: action.action,
      error: error.message,
      warnings: validation.warnings,
      timestamp: Date.now(),
    };
  }
}

// Handler functions

async function handleAgentStart(action) {
  const targets = action.targets || [];

  // Use real agent integration if available
  if (agentIntegration && agentIntegration.startAgent) {
    try {
      const results = [];
      for (const target of targets) {
        const result = await agentIntegration.startAgent(target);
        results.push({ target, ...result });
      }
      return {
        success: true,
        action: 'agent.start',
        message: `Started ${targets.length} agent(s)`,
        results,
      };
    } catch (error) {
      return {
        success: false,
        action: 'agent.start',
        error: error.message,
      };
    }
  }

  // Fallback to mock implementation
  return {
    success: true,
    action: 'agent.start',
    message: `Command to start agents would be executed here`,
    targets,
    note: 'Using mock implementation - real integration not connected',
  };
}

async function handleAgentStop(action) {
  const targets = action.targets || [];

  // Use real agent integration if available
  if (agentIntegration && agentIntegration.stopAgent) {
    try {
      const results = [];
      for (const target of targets) {
        const result = await agentIntegration.stopAgent(target);
        results.push({ target, ...result });
      }
      return {
        success: true,
        action: 'agent.stop',
        message: `Stopped ${targets.length} agent(s)`,
        results,
        requiresConfirmation: true,
      };
    } catch (error) {
      return {
        success: false,
        action: 'agent.stop',
        error: error.message,
      };
    }
  }

  // Fallback to mock implementation
  return {
    success: true,
    action: 'agent.stop',
    message: `Command to stop agents would be executed here`,
    targets,
    note: 'Using mock implementation - real integration not connected',
    requiresConfirmation: true,
  };
}

async function handleSystemStatus(action) {
  const targets = action.targets || ['system'];

  // Use real agent integration if available
  if (agentIntegration && agentIntegration.getSystemStatus) {
    try {
      const status = await agentIntegration.getSystemStatus();
      return {
        success: true,
        action: 'system.status',
        status,
      };
    } catch (error) {
      return {
        success: false,
        action: 'system.status',
        error: error.message,
      };
    }
  }

  // Fallback to mock data
  return {
    success: true,
    action: 'system.status',
    status: {
      overall: 'operational',
      components: targets.map((target) => ({
        name: target,
        status: 'running',
        health: 'healthy',
      })),
    },
    note: 'Using mock data - real integration not connected',
  };
}

async function handleSystemList(action) {
  const type = action.parameters?.type || 'all';

  // Use real agent integration if available
  if (agentIntegration && agentIntegration.listAgents) {
    try {
      if (type === 'agents' || type === 'all') {
        const agents = await agentIntegration.listAgents();
        return {
          success: true,
          action: 'system.list',
          type,
          items: agents,
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'system.list',
        error: error.message,
      };
    }
  }

  // Fallback to mock list data
  const lists = {
    agents: [
      'autonomous-agent',
      'validation-agent',
      'healing-agent',
      'fix-all-agent',
      'evolution-agent',
    ],
    workflows: ['fix-all-persistent', 'ultimate-fix-all', 'auto-maintain', 'validation-agent'],
    all: 'agents and workflows',
  };

  return {
    success: true,
    action: 'system.list',
    type,
    items: type === 'all' ? lists : lists[type] || [],
    note: 'Using mock data - real integration not connected',
  };
}

async function handleConfigUpdate(action) {
  return {
    success: false,
    action: 'config.update',
    message: 'Configuration updates via NL interface not yet implemented',
    note: 'Requires integration with configuration management system',
  };
}

async function handleLogsView(action) {
  const targets = action.targets || [];

  // Use real agent integration if available
  if (agentIntegration && agentIntegration.viewAgentLogs) {
    try {
      const results = [];
      for (const target of targets) {
        const result = await agentIntegration.viewAgentLogs(target);
        results.push({ target, ...result });
      }
      return {
        success: true,
        action: 'logs.view',
        results,
      };
    } catch (error) {
      return {
        success: false,
        action: 'logs.view',
        error: error.message,
      };
    }
  }

  // Fallback to mock implementation
  return {
    success: true,
    action: 'logs.view',
    message: 'Log viewing functionality to be implemented',
    targets,
    note: 'Using mock implementation - real integration not connected',
  };
}

function handleHelp() {
  return {
    success: true,
    action: 'system.help',
    help: {
      available_commands: [
        {
          intent: 'START_AGENT',
          description: 'Start an agent or workflow',
          examples: ['start the evolution agent', 'run fix-all workflow'],
        },
        {
          intent: 'STOP_AGENT',
          description: 'Stop an agent or workflow',
          examples: ['stop the autonomous agent', 'halt workflow'],
        },
        {
          intent: 'STATUS_QUERY',
          description: 'Check system or component status',
          examples: ['what is the system status', 'show agent health'],
        },
        {
          intent: 'LIST_QUERY',
          description: 'List available components',
          examples: ['list all agents', 'show workflows'],
        },
        {
          intent: 'VIEW_LOGS',
          description: 'View logs for components',
          examples: ['view agent logs', 'show audit history'],
        },
      ],
      available_entities: {
        agents: [
          'autonomous-agent',
          'validation-agent',
          'healing-agent',
          'fix-all-agent',
          'evolution-agent',
        ],
        workflows: ['fix-all-persistent', 'ultimate-fix-all', 'auto-maintain'],
      },
    },
  };
}
