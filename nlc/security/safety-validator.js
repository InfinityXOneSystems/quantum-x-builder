/**
 * Safety Validator - Prevent dangerous or destructive commands
 */

import fs from 'fs';
import path from 'path';

// Define dangerous patterns
const DANGEROUS_PATTERNS = [
  {
    pattern: /delete|remove|destroy/i,
    severity: 'high',
    message: 'Destructive action detected',
  },
  {
    pattern: /reset|wipe|clear all/i,
    severity: 'high',
    message: 'System reset action detected',
  },
  {
    pattern: /disable.*safety|bypass.*check/i,
    severity: 'critical',
    message: 'Attempt to bypass safety controls',
  },
];

/**
 * Check if command is safe to execute
 * @param {string} input - User input
 * @param {object} action - Parsed action
 * @returns {{safe: boolean, warnings: string[], blocked: boolean}}
 */
export function isSafe(input, action) {
  const warnings = [];
  let blocked = false;

  // Check for dangerous patterns in input
  for (const { pattern, severity, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push(`${severity.toUpperCase()}: ${message}`);

      if (severity === 'critical') {
        blocked = true;
      }
    }
  }

  // Check kill switch status
  const killSwitchStatus = checkKillSwitch();
  if (killSwitchStatus.armed) {
    warnings.push('Kill switch is ARMED - all actions are restricted');
    blocked = true;
  }

  // Check if action targets critical system components
  if (action.targets) {
    const criticalTargets = ['system', 'all', 'production'];
    const hasCriticalTarget = action.targets.some(t => criticalTargets.includes(t.toLowerCase()));

    if (hasCriticalTarget && action.action.includes('stop')) {
      warnings.push('Critical system components targeted');
    }
  }

  return {
    safe: !blocked,
    warnings,
    blocked,
  };
}

/**
 * Check kill switch status
 * @returns {{armed: boolean, reason: string}}
 */
export function checkKillSwitch() {
  try {
    const killSwitchPath = path.join(process.cwd(), '_OPS', 'SAFETY', 'KILL_SWITCH.json');

    if (!fs.existsSync(killSwitchPath)) {
      return { armed: false, reason: 'Kill switch file not found' };
    }

    const killSwitch = JSON.parse(fs.readFileSync(killSwitchPath, 'utf-8'));

    const isArmed = killSwitch.kill_switch === 'ARMED' || killSwitch.active === true;

    return {
      armed: isArmed,
      reason: isArmed ? killSwitch.behavior || 'System safety engaged' : 'Disarmed',
    };
  } catch (error) {
    console.error('Error checking kill switch:', error.message);
    return { armed: false, reason: 'Unable to check kill switch' };
  }
}

/**
 * Validate command against safety rules
 * @param {string} input - User input
 * @param {object} action - Parsed action
 * @param {object} user - User context
 * @returns {{allowed: boolean, reasons: string[]}}
 */
export function validateSafety(input, action, user) {
  const safety = isSafe(input, action);
  const reasons = [...safety.warnings];

  if (safety.blocked) {
    reasons.push('Command blocked by safety validator');
  }

  return {
    allowed: safety.safe,
    reasons,
  };
}
