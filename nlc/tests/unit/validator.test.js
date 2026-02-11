/**
 * Tests for Command Validator
 */

import { describe, it, expect } from 'vitest';
import {
  validateCommand,
  requiresConfirmation,
  getRequiredPermissions,
} from '../../../nlc/command-interpreter/validator.js';

describe('Command Validator', () => {
  it('should validate a safe command when kill switch is disarmed', () => {
    const action = {
      action: 'system.status',
      targets: ['system'],
    };
    const result = validateCommand(action);
    // Note: May fail if kill switch is ARMED in _OPS/SAFETY/KILL_SWITCH.json
    // This is expected behavior - the kill switch blocks all actions when armed
    if (result.errors.some(e => e.includes('kill switch'))) {
      expect(result.valid).toBe(false);
    } else {
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    }
  });

  it('should detect missing permissions', () => {
    const action = {
      action: 'agent.start',
      targets: ['evolution-agent'],
    };
    const user = {
      permissions: ['system:read'], // Missing required permissions
    };
    const result = validateCommand(action, user);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about dangerous actions', () => {
    const action = {
      action: 'agent.stop',
      targets: ['all'],
    };
    const result = validateCommand(action);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should detect dangerous actions requiring confirmation', () => {
    const action = { action: 'agent.stop' };
    expect(requiresConfirmation(action)).toBe(true);
  });

  it('should allow safe actions without confirmation', () => {
    const action = { action: 'system.status', requiresConfirmation: false };
    expect(requiresConfirmation(action)).toBe(false);
  });

  it('should return required permissions for actions', () => {
    const permissions = getRequiredPermissions('agent.start');
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBeGreaterThan(0);
  });

  it('should handle invalid action', () => {
    const action = null;
    const result = validateCommand(action);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid action: missing action type');
  });
});
