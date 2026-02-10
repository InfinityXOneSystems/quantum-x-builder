import fs from 'fs/promises';
import path from 'path';
import { resolvePath } from '../utils/paths.js';
import { requirePatFor } from '../middleware/pat.js';
import { rateLimiters } from '../middleware/rate-limit.js';

export function registerFsRoutes(app) {
  app.post('/api/fs/list', rateLimiters.filesystem, async (req, res) => {
    try {
      const target = resolvePath(req.body?.path || '.');
      const entries = await fs.readdir(target, { withFileTypes: true });
      res.json({
        path: target,
        entries: entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? 'dir' : 'file'
        }))
      });
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.post('/api/fs/read', rateLimiters.filesystem, async (req, res) => {
    try {
      const target = resolvePath(req.body?.path);
      const content = await fs.readFile(target, 'utf8');
      res.json({ path: target, content });
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.post(
    '/api/fs/write',
    rateLimiters.filesystem,
    requirePatFor({ action: 'fs:write', scope: 'workspace' }),
    async (req, res) => {
      try {
        const target = resolvePath(req.body?.path);
        const content = req.body?.content ?? '';
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content, 'utf8');
        res.json({ path: target, status: 'written' });
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );
}
