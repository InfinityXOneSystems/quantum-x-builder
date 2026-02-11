/**
 * Command Validator - Verify command safety and permission requirements
 */

import fs from 'fs';
import path from 'path';

// Define dangerous command patterns
const DANGEROUS_ACTIONS = ['agent.stop', 'config.update', 'system.reset', 'workflow.abort'];

// Define permission requirements for actions
const PERMISSION_MAP = {
  'agent.start': ['agent:read', 'agent:execute'],
  'agent.stop': ['agent:write', 'agent:control'],
  'system.status': ['system:read'],
  'system.list': ['system:read'],
  'config.update': ['config:write', 'system:admin'],
  'logs.view': ['logs:read'],
  'system.help': [], // No permissions required
};

/**
 * Validate command for safety and permissions
 * @param {object} action - Action to validate
 * @param {object} user - User context (optional)
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateCommand(action, user = null) {
  const errors = [];
  const warnings = [];

  // Check if action exists
  if (!action || !action.action) {
    errors.push('Invalid action: missing action type');
    return { valid: false, errors, warnings };
  }

  // Check if it's a dangerous action
  if (DANGEROUS_ACTIONS.includes(action.action)) {
    warnings.push(`This is a potentially dangerous action: ${action.action}`);
  }

  // Check required permissions
  const requiredPermissions = PERMISSION_MAP[action.action] || [];
  if (user && requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const missingPermissions = requiredPermissions.filter(perm => !userPermissions.includes(perm));

    if (missingPermissions.length > 0) {
      errors.push(`Missing required permissions: ${missingPermissions.join(', ')}`);
    }
  }

  // Validate targets
  if (action.targets && action.targets.length === 0 && action.action !== 'system.help') {
    warnings.push('No specific targets specified, using default scope');
  }

  // Check kill switch status
  try {
    const killSwitchPath = path.join(process.cwd(), '_OPS', 'SAFETY', 'KILL_SWITCH.json');
    if (fs.existsSync(killSwitchPath)) {
      const killSwitch = JSON.parse(fs.readFileSync(killSwitchPath, 'utf-8'));
      if (killSwitch.kill_switch === 'ARMED' || killSwitch.active === true) {
        errors.push('System kill switch is ARMED - all automated actions are blocked');
      }
    }
  } catch (error) {
    warnings.push('Unable to verify kill switch status');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if action requires user confirmation
 * @param {object} action - Action to check
 * @returns {boolean}
 */
export function requiresConfirmation(action) {
  return action.requiresConfirmation === true || DANGEROUS_ACTIONS.includes(action.action);
}

/**
 * Get required permissions for an action
 * @param {string} actionType - Action type
 * @returns {string[]} Required permissions
 */
export function getRequiredPermissions(actionType) {
  return PERMISSION_MAP[actionType] || [];
}
