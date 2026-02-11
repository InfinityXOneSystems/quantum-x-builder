/**
 * Natural Language Control API Routes
 */

import { parseCommand, commandToAction } from '../command-interpreter/parser.js';
import { executeCommand } from '../command-interpreter/executor.js';
import { generateResponse, formatWarnings } from '../command-interpreter/responder.js';
import { getContext, updateContext, getHistory } from '../nlp-engine/context-manager.js';
import { requireAuth } from '../security/auth.js';
import { auditMiddleware } from '../security/audit-logger.js';
import { validateSafety } from '../security/safety-validator.js';
import { getAvailableIntents } from '../nlp-engine/intent-recognizer.js';
import { getKnownEntities } from '../nlp-engine/entity-extractor.js';

/**
 * Register Natural Language Control routes
 * @param {object} app - Express app instance
 */
export function registerNlcRoutes(app) {
  // Apply authentication and audit middleware to all NLC routes
  const nlcAuth = requireAuth();
  const nlcAudit = auditMiddleware();

  /**
   * POST /api/nl/command - Execute natural language command
   */
  app.post('/api/nl/command', nlcAuth, nlcAudit, async (req, res) => {
    try {
      const { input, sessionId = 'default' } = req.body || {};

      if (!input || typeof input !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid input: must provide a string command',
        });
      }

      // Parse the natural language input
      const command = parseCommand(input, sessionId);
      req.nlCommand = command; // Store for audit logging

      if (!command.parsed) {
        return res.status(400).json({
          success: false,
          error: command.error || 'Unable to parse command',
          suggestion: command.suggestion,
          confidence: command.confidence,
        });
      }

      // Convert to action
      const action = commandToAction(command);

      // Validate safety
      const safety = validateSafety(input, action, req.user);
      if (!safety.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Command blocked by safety validator',
          reasons: safety.reasons,
        });
      }

      // Execute the command
      const result = await executeCommand(action, req.user);

      // Generate natural language response
      const response = generateResponse(result, command);
      const warnings = formatWarnings(result.warnings);

      // Update context
      updateContext(sessionId, {
        input,
        intent: command.intent,
        entities: command.entities,
        result,
      });

      return res.json({
        success: result.success,
        response: response + warnings,
        action: result.action,
        details: result,
        command: {
          intent: command.intent,
          confidence: command.confidence,
          entities: command.entities,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/nl/status - Get conversation status
   */
  app.get('/api/nl/status', nlcAuth, (req, res) => {
    try {
      const { sessionId = 'default' } = req.query;
      const context = getContext(sessionId);

      return res.json({
        success: true,
        session: {
          id: context.sessionId,
          historyCount: context.history.length,
          lastIntent: context.lastIntent,
          createdAt: new Date(context.createdAt).toISOString(),
          updatedAt: new Date(context.updatedAt).toISOString(),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/nl/history - Retrieve command history
   */
  app.get('/api/nl/history', nlcAuth, (req, res) => {
    try {
      const { sessionId = 'default', limit = 10 } = req.query;
      const history = getHistory(sessionId, parseInt(limit, 10));

      return res.json({
        success: true,
        sessionId,
        history: history.map(entry => ({
          timestamp: new Date(entry.timestamp).toISOString(),
          input: entry.input,
          intent: entry.intent,
          success: entry.result?.success,
        })),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/nl/feedback - Submit user feedback
   */
  app.post('/api/nl/feedback', nlcAuth, (req, res) => {
    try {
      const { sessionId, commandIndex, rating, comment } = req.body || {};

      // In real implementation, store feedback in database
      // For now, just acknowledge receipt

      return res.json({
        success: true,
        message: 'Feedback received',
        feedback: {
          sessionId,
          commandIndex,
          rating,
          comment,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/nl/capabilities - Get system capabilities
   */
  app.get('/api/nl/capabilities', nlcAuth, (req, res) => {
    try {
      const intents = getAvailableIntents();
      const entities = getKnownEntities();

      return res.json({
        success: true,
        capabilities: {
          intents: intents.map(i => ({
            name: i.intent,
            description: i.description,
            examples: i.examples,
          })),
          entities: {
            agents: entities.agents,
            workflows: entities.workflows,
            services: entities.services,
          },
          features: {
            textCommands: true,
            voiceCommands: false, // Future enhancement
            multiLanguage: false, // Future enhancement
            contextAware: true,
            auditLogging: true,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/nl/health - Health check endpoint
   */
  app.get('/api/nl/health', (req, res) => {
    return res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
  });
}
