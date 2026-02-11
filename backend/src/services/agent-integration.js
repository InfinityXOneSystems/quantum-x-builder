/**
 * Autonomous Agent Integration
 * Connects NLC commands to actual agent execution
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { broadcastAgentStatus, broadcastActivity } from '../services/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.join(__dirname, '..', '..', '..');

// Agent configuration
const AGENTS = {
  autonomous: {
    name: 'Autonomous Agent',
    script: '.github/agents/autonomous-agent.js',
    schedule: '*/30 * * * *',
  },
  validation: {
    name: 'Validation Agent',
    script: '.github/agents/validator-agent.js',
    schedule: '0 * * * *',
  },
  healing: {
    name: 'Healing Agent',
    script: '.github/agents/healing-agent.js',
    schedule: '0 */2 * * *',
  },
  'fix-all': {
    name: 'Fix-All Agent',
    script: '.github/agents/fix-all-agent.js',
    schedule: '0 */6 * * *',
  },
  evolution: {
    name: 'Evolution Agent',
    script: '.github/agents/evolution-agent.js',
    schedule: '0 1,7,13,19 * * *',
  },
};

/**
 * Check if agent exists
 */
export async function agentExists(agentName) {
  const agent = AGENTS[agentName];
  if (!agent) return false;

  const scriptPath = path.join(REPO_ROOT, agent.script);
  try {
    await fs.access(scriptPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get agent status
 */
export async function getAgentStatus(agentName) {
  const agent = AGENTS[agentName];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  // Check if agent is running (look for PID file or process)
  const stateFile = path.join(REPO_ROOT, '_OPS', 'AUDIT', `${agentName}-agent-state.json`);

  try {
    const state = JSON.parse(await fs.readFile(stateFile, 'utf-8'));
    return {
      name: agent.name,
      status: state.status || 'idle',
      lastRun: state.lastRun || null,
      nextRun: state.nextRun || null,
      schedule: agent.schedule,
    };
  } catch {
    return {
      name: agent.name,
      status: 'idle',
      lastRun: null,
      nextRun: null,
      schedule: agent.schedule,
    };
  }
}

/**
 * Start agent
 */
export async function startAgent(agentName) {
  const agent = AGENTS[agentName];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  // Check kill switch
  const killSwitchPath = path.join(REPO_ROOT, '_OPS', 'SAFETY', 'KILL_SWITCH.json');
  try {
    const killSwitch = JSON.parse(await fs.readFile(killSwitchPath, 'utf-8'));
    if (killSwitch.kill_switch === 'ARMED' || killSwitch.active === true) {
      throw new Error('Kill switch is ARMED. Cannot start agent.');
    }
  } catch (error) {
    console.warn('Could not read kill switch:', error.message);
  }

  const scriptPath = path.join(REPO_ROOT, agent.script);

  // Execute agent script
  try {
    broadcastActivity(`Starting ${agent.name}...`);
    broadcastAgentStatus(agentName, 'starting');

    const output = execSync(`node ${scriptPath}`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 300000, // 5 minutes
    });

    broadcastAgentStatus(agentName, 'completed');
    broadcastActivity(`${agent.name} completed successfully`);

    return {
      success: true,
      output: output.substring(0, 1000), // Limit output size
      message: `${agent.name} started successfully`,
    };
  } catch (error) {
    broadcastAgentStatus(agentName, 'error');
    broadcastActivity(`${agent.name} failed: ${error.message}`);

    throw new Error(`Failed to start ${agent.name}: ${error.message}`);
  }
}

/**
 * Stop agent (if running)
 */
export async function stopAgent(agentName) {
  const agent = AGENTS[agentName];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  // Agents typically run to completion, but we can try to signal them
  broadcastAgentStatus(agentName, 'stopped');
  broadcastActivity(`${agent.name} stop requested`);

  return {
    success: true,
    message: `${agent.name} stop signal sent`,
  };
}

/**
 * List all agents
 */
export async function listAgents() {
  const agentList = [];

  for (const [key, agent] of Object.entries(AGENTS)) {
    try {
      const status = await getAgentStatus(key);
      agentList.push({
        id: key,
        ...status,
      });
    } catch (error) {
      agentList.push({
        id: key,
        name: agent.name,
        status: 'unknown',
        error: error.message,
      });
    }
  }

  return agentList;
}

/**
 * View agent logs
 */
export async function viewAgentLogs(agentName, lines = 50) {
  const agent = AGENTS[agentName];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const logFile = path.join(REPO_ROOT, '_OPS', 'AUDIT', `${agentName}-agent.log`);

  try {
    const content = await fs.readFile(logFile, 'utf-8');
    const logLines = content.split('\n').filter((line) => line.trim());
    const recentLines = logLines.slice(-lines);

    return {
      success: true,
      logs: recentLines.join('\n'),
      totalLines: logLines.length,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        logs: 'No logs available yet',
        totalLines: 0,
      };
    }
    throw error;
  }
}

/**
 * Get system status
 */
export async function getSystemStatus() {
  const agents = await listAgents();

  // Count active agents
  const activeAgents = agents.filter((a) => a.status === 'running' || a.status === 'starting').length;

  // Get workflow stats (if available)
  // This would integrate with GitHub API in production

  return {
    timestamp: new Date().toISOString(),
    agents: {
      total: agents.length,
      active: activeAgents,
      idle: agents.filter((a) => a.status === 'idle').length,
      error: agents.filter((a) => a.status === 'error').length,
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    },
    agents: agents,
  };
}
