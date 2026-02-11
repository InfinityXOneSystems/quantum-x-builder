/**
 * WebSocket Server for Real-Time Updates
 * Provides live updates for command center UI
 */

import { WebSocketServer } from 'ws';

let wss = null;
const connections = new Set();

/**
 * Initialize WebSocket server
 * @param {object} server - HTTP server instance
 */
export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    connections.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Quantum X Builder Command Center',
      timestamp: new Date().toISOString(),
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleClientMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      connections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(ws);
    });
  });

  console.log('✓ WebSocket server initialized');
  return wss;
}

/**
 * Handle client messages
 */
function handleClientMessage(ws, message) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'subscribe':
      ws.subscriptions = message.topics || [];
      ws.send(JSON.stringify({
        type: 'subscribed',
        topics: ws.subscriptions,
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'unknown',
        message: 'Unknown message type',
      }));
  }
}

/**
 * Broadcast message to all connected clients
 */
export function broadcast(data) {
  const message = JSON.stringify(data);
  connections.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  });
}

/**
 * Send message to specific client
 */
export function sendToClient(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Broadcast agent status update
 */
export function broadcastAgentStatus(agent, status) {
  broadcast({
    type: 'agent_status',
    agent,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast workflow status update
 */
export function broadcastWorkflowStatus(workflow, status) {
  broadcast({
    type: 'workflow_status',
    workflow,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast activity log
 */
export function broadcastActivity(message, details = {}) {
  broadcast({
    type: 'activity',
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast command execution result
 */
export function broadcastCommandResult(command, result, success = true) {
  broadcast({
    type: 'command_result',
    command,
    result,
    success,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get connection count
 */
export function getConnectionCount() {
  return connections.size;
}
