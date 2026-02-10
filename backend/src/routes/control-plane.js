/**
 * Phase 6 Autonomous Control Plane
 * Implements max-autonomy OpenAPI schema:
 * - System state introspection
 * - Governance policy evaluation
 * - Command dispatch & async execution
 * - Simulation / preflight checks
 * - Audit trails & rollback
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execAsync } from '../utils/exec.js';
import { policyEngine } from '../services/policy-engine.js';
import { auditService } from '../services/audit-service.js';
import { commandQueue } from '../services/command-queue.js';
import { rateLimiters } from '../middleware/rate-limit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// ============================================================================
// READ ENDPOINTS (Introspection)
// ============================================================================

/**
 * GET /control-plane/healthz
 * Basic health check
 */
router.get('/control-plane/healthz', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * GET /control-plane/state
 * Read full system state
 */
router.get('/control-plane/state', rateLimiters.standard, async (req, res) => {
  try {
    const stateFile = path.join(
      process.env.WORKSPACE_ROOT || '/workspace',
      '_OPS/_STATE/system.state.json'
    );
    let state = {};
    try {
      const data = await fs.readFile(stateFile, 'utf-8');
      state = JSON.parse(data);
    } catch {
      // File doesn't exist, return empty state
      state = {
        phase: '6',
        autonomy: 'enabled',
        locks: [],
        policyLevels: ['governance', 'validation', 'escalation'],
      };
    }
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /control-plane/audit
 * Get audit log entries
 */
router.get('/control-plane/audit', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const entries = await auditService.getEntries(parseInt(limit));
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POLICY ENDPOINTS (Governance)
// ============================================================================

/**
 * GET /control-plane/policy/list
 * Retrieve active policy definitions
 */
router.get('/control-plane/policy/list', async (req, res) => {
  try {
    const policies = await policyEngine.listPolicies();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /control-plane/policy/evaluate
 * Evaluate a policy against a proposed action
 */
router.post('/control-plane/policy/evaluate', async (req, res) => {
  try {
    const { policyName, action, context = {} } = req.body;
    if (!policyName || !action) {
      return res.status(400).json({ error: 'Missing policyName or action' });
    }

    const result = await policyEngine.evaluate(policyName, action, context);
    
    // Log policy evaluation
    await auditService.log({
      timestamp: new Date().toISOString(),
      actor: req.user?.id || 'system',
      action: `policy.evaluate`,
      resource: policyName,
      result: result.allowed ? 'ALLOWED' : 'DENIED',
      details: result,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SIMULATION ENDPOINTS (Preflight / Dry-Run)
// ============================================================================

/**
 * POST /control-plane/simulate/action
 * Run a dry-run simulation of an action
 */
router.post('/control-plane/simulate/action', async (req, res) => {
  try {
    const { type, target, parameters = {} } = req.body;
    if (!type || !target) {
      return res.status(400).json({ error: 'Missing type or target' });
    }

    // Simulate based on action type
    const simulationResult = await simulateAction(type, target, parameters);

    // Log simulation
    await auditService.log({
      timestamp: new Date().toISOString(),
      actor: req.user?.id || 'system',
      action: 'simulate.action',
      resource: `${type}:${target}`,
      result: simulationResult.success ? 'SUCCESS' : 'FAILURE',
      details: simulationResult,
    });

    res.json(simulationResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WRITE ENDPOINTS (Mutations)
// ============================================================================

/**
 * POST /control-plane/write/github/commit
 * Create a GitHub commit (governed)
 */
router.post('/control-plane/write/github/commit', async (req, res) => {
  try {
    const { owner, repo, branch, message, changes } = req.body;
    if (!owner || !repo || !message || !changes) {
      return res
        .status(400)
        .json({
          error: 'Missing owner, repo, message, or changes',
        });
    }

    // Evaluate policy: can we create a commit?
    const policyCheck = await policyEngine.evaluate('commit-policy', 'github.commit', {
      owner,
      repo,
      message,
      changeCount: changes.length,
    });

    if (!policyCheck.allowed) {
      return res.status(403).json({
        error: 'Policy violation',
        reason: policyCheck.reason,
      });
    }

    // Execute commit (real implementation would use GitHub API)
    const commitId = `commit-${uuidv4()}`;
    
    // Log the mutation
    await auditService.log({
      timestamp: new Date().toISOString(),
      actor: req.user?.id || 'system',
      action: 'github.commit',
      resource: `${owner}/${repo}`,
      result: 'EXECUTED',
      details: { commitId, message, changeCount: changes.length },
    });

    res.json({
      commitSha: commitId,
      status: 'created',
      owner,
      repo,
      branch,
      message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMAND ENDPOINTS (Async Dispatch)
// ============================================================================

/**
 * POST /control-plane/command/dispatch
 * Dispatch a command for execution
 */
router.post('/control-plane/command/dispatch', async (req, res) => {
  try {
    const { command, target, parameters = {} } = req.body;
    if (!command || !target) {
      return res.status(400).json({ error: 'Missing command or target' });
    }

    // Evaluate governance policy
    const policyCheck = await policyEngine.evaluate('command-policy', command, {
      target,
      paramCount: Object.keys(parameters).length,
    });

    if (!policyCheck.allowed) {
      return res.status(403).json({
        error: 'Policy violation',
        reason: policyCheck.reason,
      });
    }

    // Queue the command for async execution
    const commandId = await commandQueue.enqueue({
      command,
      target,
      parameters,
      requestedBy: req.user?.id || 'system',
      timestamp: new Date().toISOString(),
    });

    // Log dispatch
    await auditService.log({
      timestamp: new Date().toISOString(),
      actor: req.user?.id || 'system',
      action: 'command.dispatch',
      resource: target,
      result: 'QUEUED',
      details: { commandId, command },
    });

    res.json({
      commandId,
      status: 'queued',
      command,
      target,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// JOB TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /control-plane/job/status
 * Get async job status
 */
router.get('/control-plane/job/status', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing job id' });
    }

    const jobStatus = await commandQueue.getStatus(id);
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ROLLBACK ENDPOINTS
// ============================================================================

/**
 * POST /control-plane/rollback/action
 * Rollback a previously executed autonomous action
 */
router.post('/control-plane/rollback/action', async (req, res) => {
  try {
    const { actionId, reason } = req.body;
    if (!actionId) {
      return res.status(400).json({ error: 'Missing actionId' });
    }

    // Check if user has rollback permission
    const policyCheck = await policyEngine.evaluate('rollback-policy', 'action.rollback', {
      actionId,
    });

    if (!policyCheck.allowed) {
      return res.status(403).json({
        error: 'Not authorized to rollback',
        reason: policyCheck.reason,
      });
    }

    // Execute rollback (real implementation would revert the action)
    const rollbackId = `rollback-${uuidv4()}`;

    // Log rollback
    await auditService.log({
      timestamp: new Date().toISOString(),
      actor: req.user?.id || 'system',
      action: 'action.rollback',
      resource: actionId,
      result: 'EXECUTED',
      details: { rollbackId, reason },
    });

    res.json({
      status: 'rolled_back',
      rollbackId,
      actionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simulate an action without executing it
 */
async function simulateAction(type, target, parameters) {
  try {
    switch (type) {
      case 'github.commit':
        return {
          success: true,
          warnings: [],
          simulation: `Would commit to ${target}`,
        };
      case 'docker.deploy':
        return {
          success: true,
          warnings: ['Ensure registry credentials are valid'],
          simulation: `Would deploy container to ${target}`,
        };
      case 'script.execute':
        return {
          success: true,
          warnings: [],
          simulation: `Would execute script ${target}`,
        };
      default:
        return {
          success: false,
          warnings: [],
          error: `Unknown simulation type: ${type}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      warnings: [],
      error: error.message,
    };
  }
}

export function registerControlPlaneRoutes(app) {
  app.use(router);
}
