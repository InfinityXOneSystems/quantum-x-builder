/**
 * Natural Language Control Routes - Backend Integration
 * Wraps the NLC API routes for the backend
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import from nlc directory (parent directory structure)
const nlcPath = join(__dirname, '..', '..', 'nlc', 'api', 'routes.js');

/**
 * Register NLC routes with the Express app
 * @param {object} app - Express app instance
 */
export async function registerNlcRoutes(app) {
  try {
    // Dynamically import the NLC routes
    const { registerNlcRoutes: nlcRegister } = await import(nlcPath);
    nlcRegister(app);
    console.log('Natural Language Control routes registered');
  } catch (error) {
    console.error('Failed to register NLC routes:', error.message);
    console.error('NLC system will not be available');
  }
}
