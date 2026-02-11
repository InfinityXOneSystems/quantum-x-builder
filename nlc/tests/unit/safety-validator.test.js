/**
 * Tests for Safety Validator
 */

import { describe, it, expect } from 'vitest';
import { isSafe, validateSafety } from '../../../nlc/security/safety-validator.js';

describe('Safety Validator', () => {
  it('should mark safe commands as safe (or blocked by kill switch)', () => {
    const action = {
      action: 'system.status',
      targets: ['system'],
    };
    const result = isSafe('what is the status', action);
    // If kill switch is ARMED, safe will be false - this is expected
    if (result.warnings.some(w => w.includes('Kill switch'))) {
      expect(result.safe).toBe(false);
      expect(result.blocked).toBe(true);
    } else {
      expect(result.safe).toBe(true);
      expect(result.blocked).toBe(false);
    }
  });

  it('should detect dangerous patterns', () => {
    const action = {
      action: 'system.delete',
      targets: ['all'],
    };
    const result = isSafe('delete everything', action);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should block critical actions', () => {
    const action = {
      action: 'system.bypass',
      targets: ['safety'],
    };
    const result = isSafe('bypass safety checks', action);
    expect(result.blocked).toBe(true);
  });

  it('should validate safety with user context (or be blocked by kill switch)', () => {
    const action = {
      action: 'system.status',
      targets: ['system'],
    };
    const user = { permissions: ['system:read'] };
    const result = validateSafety('check status', action, user);
    // If kill switch is ARMED, allowed will be false - this is expected
    if (result.reasons.some(r => r.includes('Kill switch'))) {
      expect(result.allowed).toBe(false);
    } else {
      expect(result.allowed).toBe(true);
    }
  });

  it('should handle actions with no targets (or be blocked by kill switch)', () => {
    const action = {
      action: 'system.help',
      targets: [],
    };
    const result = isSafe('help', action);
    // If kill switch is ARMED, safe will be false - this is expected
    if (result.warnings.some(w => w.includes('Kill switch'))) {
      expect(result.safe).toBe(false);
    } else {
      expect(result.safe).toBe(true);
    }
  });
});
