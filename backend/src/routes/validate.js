import { validateSpec } from '../utils/validator.js';
import { runSystemChecks } from '../utils/systemChecks.js';
import { validatePatRecord } from '../utils/pat.js';
import { rateLimiters } from '../middleware/rate-limit.js';
import fs from 'fs/promises';
import path from 'path';

export function registerValidationRoutes(app) {
  app.post('/api/validate/spec', rateLimiters.validation, async (_req, res) => {
    try {
      const specDir = path.resolve(process.cwd(), 'backend', 'spec');
      const entries = await fs.readdir(specDir);
      const result = validateSpec({ availableDocs: entries });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/validate/system', rateLimiters.validation, async (_req, res) => {
    try {
      const result = await runSystemChecks();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/validate/pat', rateLimiters.validation, async (req, res) => {
    try {
      const result = validatePatRecord(req.body?.pat || req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
