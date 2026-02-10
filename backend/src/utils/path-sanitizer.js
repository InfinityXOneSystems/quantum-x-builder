/**
 * Path Sanitization Utilities
 * 
 * Prevents path traversal attacks by validating and normalizing file paths.
 */

import path from 'path';

/**
 * Sanitize a filename by removing dangerous characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  // Remove path separators and parent directory references
  let safe = filename.replace(/[\/\\]/g, '');
  safe = safe.replace(/\.\./g, '');
  
  // Remove any control characters and special chars that could be dangerous
  safe = safe.replace(/[<>:"|?*\x00-\x1f]/g, '');
  
  // Ensure the filename isn't empty after sanitization
  if (!safe || safe.trim() === '') {
    throw new Error('Invalid filename after sanitization');
  }
  
  return safe;
}

/**
 * Validate that a path is within an allowed base directory
 * @param {string} requestedPath - The path to validate
 * @param {string} baseDir - The base directory that the path must be within
 * @returns {string} The resolved absolute path
 * @throws {Error} If the path tries to escape the base directory
 */
export function validatePath(requestedPath, baseDir) {
  if (!requestedPath || typeof requestedPath !== 'string') {
    throw new Error('Invalid path');
  }
  
  if (!baseDir || typeof baseDir !== 'string') {
    throw new Error('Invalid base directory');
  }
  
  // Resolve to absolute paths
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, requestedPath);
  
  // Check if the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    throw new Error('Path traversal detected: path must be within base directory');
  }
  
  return resolvedPath;
}

/**
 * Safe join that prevents path traversal
 * @param {string} baseDir - Base directory
 * @param {...string} segments - Path segments to join
 * @returns {string} Safe joined path
 */
export function safeJoin(baseDir, ...segments) {
  const joined = path.join(...segments);
  return validatePath(joined, baseDir);
}
