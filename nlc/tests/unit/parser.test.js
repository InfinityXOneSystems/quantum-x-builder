/**
 * Tests for Command Parser
 */

import { describe, it, expect } from 'vitest';
import { parseCommand, commandToAction } from '../../../nlc/command-interpreter/parser.js';

describe('Command Parser', () => {
  it('should parse a valid command', () => {
    const result = parseCommand('start the evolution agent');
    expect(result.parsed).toBe(true);
    expect(result.intent).toBe('START_AGENT');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should extract entities from command', () => {
    const result = parseCommand('start the evolution agent');
    expect(result.entities.agents).toContain('evolution-agent');
  });

  it('should handle low confidence commands', () => {
    const result = parseCommand('xyzabc random text');
    expect(result.parsed).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty input', () => {
    const result = parseCommand('');
    expect(result.parsed).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should include session ID', () => {
    const result = parseCommand('help', 'test-session');
    expect(result.sessionId).toBe('test-session');
  });

  it('should convert command to action', () => {
    const command = parseCommand('start the evolution agent');
    const action = commandToAction(command);
    expect(action.action).toBe('agent.start');
    expect(action.targets).toContain('evolution-agent');
  });

  it('should mark dangerous actions for confirmation', () => {
    const command = parseCommand('stop all agents');
    const action = commandToAction(command);
    expect(action.requiresConfirmation).toBe(true);
  });

  it('should handle status queries', () => {
    const command = parseCommand('what is the system status');
    const action = commandToAction(command);
    expect(action.action).toBe('system.status');
  });

  it('should handle list queries', () => {
    const command = parseCommand('list all agents');
    const action = commandToAction(command);
    expect(action.action).toBe('system.list');
  });

  it('should handle help command', () => {
    const command = parseCommand('help');
    const action = commandToAction(command);
    expect(action.action).toBe('system.help');
  });
});
