import { requirePatFor } from '../middleware/pat.js';
import { rateLimiters } from '../middleware/rate-limit.js';
import { callGemini } from '../providers/gemini.js';
import { callGroq } from '../providers/groq.js';
import { callOllama } from '../providers/ollama.js';
import { callVertex } from '../providers/vertex.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

// Phase 3b: AI Service Integration Routes
export function registerAiIntegrationRoutes(app) {
  // Get AI service configuration and availability
  app.get('/api/ai/services/status', rateLimiters.ai, async (_req, res) => {
    try {
      const configPath = path.join(WORKSPACE_ROOT, '.github', 'app-config.json');
      let aiConfig = {};
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        aiConfig = JSON.parse(content).ai_integrations || {};
      } catch (e) {
        // Config file doesn't exist yet, return defaults
      }

      res.json({
        status: 'ok',
        services: {
          chatgpt: {
            name: 'ChatGPT',
            enabled: aiConfig.chatgpt?.enabled || false,
            auth_method: 'github_oauth',
            permissions: ['read', 'write', 'execute']
          },
          github_copilot: {
            name: 'GitHub Copilot',
            enabled: aiConfig.github_copilot?.enabled || false,
            auth_method: 'github_app_token',
            permissions: ['read', 'write', 'execute']
          },
          vscode_copilot: {
            name: 'VS Code Copilot',
            enabled: aiConfig.vscode_copilot?.enabled || false,
            auth_method: 'github_app_token',
            permissions: ['read', 'write', 'execute']
          },
          google_gemini: {
            name: 'Google Gemini',
            enabled: aiConfig.google_gemini?.enabled || false,
            auth_method: 'github_oauth',
            permissions: ['read', 'write', 'execute']
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Get AI service configuration for a specific service
  app.get(
    '/api/ai/services/:service/config',
    rateLimiters.ai,
    requirePatFor({ action: 'ai:services:read', scope: 'admin' }),
    async (req, res) => {
      try {
        const { service } = req.params;
        const configPath = path.join(WORKSPACE_ROOT, '.github', 'app-config.json');
        
        let config = {};
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          const fullConfig = JSON.parse(content);
          config = fullConfig.ai_integrations?.[service] || {};
        } catch (e) {
          // Config not found
        }

        res.json({
          service,
          config,
          status: config.enabled ? 'enabled' : 'disabled'
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    }
  );

  // Test AI service connection with a simple message
  app.post(
    '/api/ai/services/:service/test',
    requirePatFor({ action: 'ai:services:test', scope: 'admin' }),
    async (req, res) => {
      try {
        const { service } = req.params;
        const { message } = req.body || {};

        if (!message) {
          return res.status(400).json({ error: 'message required in request body' });
        }

        let response;
        const testMessages = [{ role: 'user', content: message }];
        const testConfig = {};
        const systemInstruction =
          'You are a helpful AI assistant. Respond concisely. You are testing a GitHub integration.';

        switch (service) {
          case 'gemini':
            response = await callGemini(testMessages, testConfig, systemInstruction);
            break;
          case 'groq':
            response = await callGroq(testMessages, testConfig, systemInstruction);
            break;
          case 'ollama':
            response = await callOllama(testMessages, testConfig, systemInstruction);
            break;
          case 'vertex':
            response = await callVertex(testMessages, testConfig, systemInstruction);
            break;
          default:
            return res.status(400).json({ error: `Unknown service: ${service}` });
        }

        if (!response) {
          return res
            .status(503)
            .json({ error: `Service ${service} not available or not configured` });
        }

        res.json({
          service,
          status: 'ok',
          test_message: message,
          response: response.text,
          provider: response.provider
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    }
  );

  // Update AI service configuration
  app.post(
    '/api/ai/services/:service/configure',
    rateLimiters.ai,
    requirePatFor({ action: 'ai:services:write', scope: 'admin' }),
    async (req, res) => {
      try {
        const { service } = req.params;
        const { enabled, auth_method, scopes } = req.body || {};

        const configPath = path.join(WORKSPACE_ROOT, '.github', 'app-config.json');
        let fullConfig = {};

        try {
          const content = await fs.readFile(configPath, 'utf-8');
          fullConfig = JSON.parse(content);
        } catch (e) {
          // Initialize new config
          fullConfig = {
            github_app: {},
            ai_integrations: {},
            permissions: {}
          };
        }

        if (!fullConfig.ai_integrations) {
          fullConfig.ai_integrations = {};
        }

        fullConfig.ai_integrations[service] = {
          enabled: enabled !== undefined ? enabled : true,
          auth_method: auth_method || 'github_oauth',
          scopes: scopes || ['repo', 'user:email']
        };

        await fs.writeFile(configPath, JSON.stringify(fullConfig, null, 2));

        res.json({
          status: 'configured',
          service,
          config: fullConfig.ai_integrations[service]
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    }
  );

  // Get all AI integrations status and readiness
  app.get(
    '/api/ai/integrations/status',
    rateLimiters.ai,
    requirePatFor({ action: 'ai:integrations:read', scope: 'admin' }),
    async (_req, res) => {
      try {
        const configPath = path.join(WORKSPACE_ROOT, '.github', 'app-config.json');
        const envPath = path.join(WORKSPACE_ROOT, '.github.env');

        let aiConfig = {};
        let envConfigured = false;

        try {
          const content = await fs.readFile(configPath, 'utf-8');
          aiConfig = JSON.parse(content);
        } catch (e) {
          // Config not found
        }

        try {
          await fs.access(envPath);
          envConfigured = true;
        } catch (e) {
          // Env file not found
        }

        const integrations = aiConfig.ai_integrations || {};
        const services = Object.keys(integrations).map((service) => ({
          name: service,
          enabled: integrations[service].enabled,
          auth_method: integrations[service].auth_method,
          scopes: integrations[service].scopes
        }));

        res.json({
          status: 'ok',
          phase3b_enabled: true,
          env_configured: envConfigured,
          services,
          configuration_path: configPath,
          environment_path: envPath
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    }
  );
}
