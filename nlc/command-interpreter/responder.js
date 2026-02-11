/**
 * Response Generator - Create natural language responses for users
 */

/**
 * Generate a natural language response from execution result
 * @param {object} result - Execution result
 * @param {object} command - Original parsed command
 * @returns {string} Natural language response
 */
export function generateResponse(result, command) {
  if (!result.success) {
    return generateErrorResponse(result, command);
  }

  switch (result.action) {
    case 'agent.start':
      return generateAgentStartResponse(result);

    case 'agent.stop':
      return generateAgentStopResponse(result);

    case 'system.status':
      return generateStatusResponse(result);

    case 'system.list':
      return generateListResponse(result);

    case 'logs.view':
      return generateLogsResponse(result);

    case 'system.help':
      return generateHelpResponse(result);

    default:
      return `Command executed: ${result.action}`;
  }
}

function generateErrorResponse(result, command) {
  const errors = result.errors || [result.error];
  const warnings = result.warnings || [];

  let response = `I couldn't execute that command. `;

  if (errors.length > 0) {
    response += `Errors: ${errors.join('; ')}. `;
  }

  if (warnings.length > 0) {
    response += `Warnings: ${warnings.join('; ')}. `;
  }

  response += `Please try rephrasing or type "help" for available commands.`;

  return response;
}

function generateAgentStartResponse(result) {
  const targets = result.targets || [];

  if (targets.length === 0) {
    return `I understand you want to start an agent, but no specific agent was identified. Available agents: autonomous-agent, validation-agent, healing-agent, fix-all-agent, evolution-agent.`;
  }

  return `Starting ${targets.join(', ')}. ${result.note || ''}`;
}

function generateAgentStopResponse(result) {
  const targets = result.targets || [];

  if (targets.length === 0) {
    return `I understand you want to stop an agent, but no specific agent was identified.`;
  }

  let response = `⚠️ This will stop ${targets.join(', ')}. `;

  if (result.requiresConfirmation) {
    response += `This action requires confirmation. Please confirm you want to proceed.`;
  }

  return response;
}

function generateStatusResponse(result) {
  if (!result.status) {
    return `Unable to retrieve status information.`;
  }

  const { overall, components } = result.status;
  let response = `System status: ${overall}. `;

  if (components && components.length > 0) {
    const componentStatus = components.map(c => `${c.name}: ${c.status} (${c.health})`).join(', ');
    response += `Components: ${componentStatus}.`;
  }

  return response;
}

function generateListResponse(result) {
  const { type, items } = result;

  if (!items || items.length === 0) {
    return `No ${type} found.`;
  }

  if (typeof items === 'string') {
    return `Available ${type}: ${items}`;
  }

  return `Available ${type}: ${items.join(', ')}`;
}

function generateLogsResponse(result) {
  const targets = result.targets || [];

  if (targets.length === 0) {
    return `Log viewing requires specific targets. Please specify which agent or workflow logs you'd like to view.`;
  }

  return `Preparing logs for ${targets.join(', ')}. ${result.note || ''}`;
}

function generateHelpResponse(result) {
  if (!result.help) {
    return `Help information is not available at the moment.`;
  }

  let response = `I can help you with the following commands:\n\n`;

  for (const cmd of result.help.available_commands) {
    response += `**${cmd.intent}**: ${cmd.description}\n`;
    response += `Examples: ${cmd.examples.join(', ')}\n\n`;
  }

  response += `\nAvailable agents: ${result.help.available_entities.agents.join(', ')}\n`;
  response += `Available workflows: ${result.help.available_entities.workflows.join(', ')}`;

  return response;
}

/**
 * Format warnings for display
 * @param {string[]} warnings - Warning messages
 * @returns {string} Formatted warnings
 */
export function formatWarnings(warnings) {
  if (!warnings || warnings.length === 0) {
    return '';
  }

  return `\n\n⚠️ Warnings:\n${warnings.map(w => `- ${w}`).join('\n')}`;
}
