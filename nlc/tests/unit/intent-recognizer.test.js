/**
 * Tests for Intent Recognizer
 */

import { describe, it, expect } from 'vitest';
import { recognizeIntent, getAvailableIntents } from '../../../nlc/nlp-engine/intent-recognizer.js';

describe('Intent Recognizer', () => {
  it('should recognize START_AGENT intent', () => {
    const result = recognizeIntent('start the evolution agent');
    expect(result.intent).toBe('START_AGENT');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should recognize STOP_AGENT intent', () => {
    const result = recognizeIntent('stop the autonomous agent');
    expect(result.intent).toBe('STOP_AGENT');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should recognize STATUS_QUERY intent', () => {
    const result = recognizeIntent('what is the system status');
    expect(result.intent).toBe('STATUS_QUERY');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should recognize LIST_QUERY intent', () => {
    const result = recognizeIntent('list all agents');
    expect(result.intent).toBe('LIST_QUERY');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should recognize HELP intent', () => {
    const result = recognizeIntent('help');
    expect(result.intent).toBe('HELP');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return UNKNOWN for unrecognized input', () => {
    const result = recognizeIntent('xyzabc nonsense command');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('should handle empty input', () => {
    const result = recognizeIntent('');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('should handle null input', () => {
    const result = recognizeIntent(null);
    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('should return available intents', () => {
    const intents = getAvailableIntents();
    expect(Array.isArray(intents)).toBe(true);
    expect(intents.length).toBeGreaterThan(0);
    expect(intents[0]).toHaveProperty('intent');
    expect(intents[0]).toHaveProperty('examples');
  });
});
