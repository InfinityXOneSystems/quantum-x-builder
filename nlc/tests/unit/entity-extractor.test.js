/**
 * Tests for Entity Extractor
 */

import { describe, it, expect } from 'vitest';
import { extractEntities, getKnownEntities } from '../../../nlc/nlp-engine/entity-extractor.js';

describe('Entity Extractor', () => {
  it('should extract agent entities', () => {
    const result = extractEntities('start the evolution agent', 'START_AGENT');
    expect(result.agents).toContain('evolution-agent');
  });

  it('should extract workflow entities', () => {
    const result = extractEntities('run fix-all workflow', 'START_AGENT');
    expect(result.workflows.length).toBeGreaterThan(0);
  });

  it('should extract service entities', () => {
    const result = extractEntities('check backend status', 'STATUS_QUERY');
    expect(result.services).toContain('backend');
  });

  it('should handle multiple agents', () => {
    const result = extractEntities('start autonomous agent and evolution agent', 'START_AGENT');
    expect(result.agents.length).toBeGreaterThan(1);
  });

  it('should extract time parameters', () => {
    const result = extractEntities('run for 5 hours', 'START_AGENT');
    expect(result.parameters).toHaveProperty('duration');
    expect(result.parameters.duration.value).toBe(5);
    expect(result.parameters.duration.unit).toBe('hour');
  });

  it('should handle empty input', () => {
    const result = extractEntities('', 'UNKNOWN');
    expect(result.agents).toEqual([]);
    expect(result.workflows).toEqual([]);
    expect(result.services).toEqual([]);
  });

  it('should return known entities', () => {
    const entities = getKnownEntities();
    expect(entities).toHaveProperty('agents');
    expect(entities).toHaveProperty('workflows');
    expect(entities).toHaveProperty('services');
    expect(Array.isArray(entities.agents)).toBe(true);
    expect(entities.agents.length).toBeGreaterThan(0);
  });
});
