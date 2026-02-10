import fs from 'fs/promises';
import path from 'path';
import { sanitizeFilename, validatePath } from './path-sanitizer.js';

const templateDir = path.resolve(process.cwd(), 'backend', 'templates');

export async function listTemplates() {
  const entries = await fs.readdir(templateDir);
  return entries.filter((name) => name.endsWith('.json'));
}

export async function loadTemplate(name) {
  // Sanitize the filename to prevent path traversal
  const safeName = sanitizeFilename(name);
  
  // Validate the path is within the template directory
  const filePath = validatePath(safeName, templateDir);
  
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}
