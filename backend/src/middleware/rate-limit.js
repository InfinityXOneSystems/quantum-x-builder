/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiter for API endpoints.
 * Limits requests per IP address within a time window.
 */

const requestCounts = new Map();

/**
 * Create a rate limiting middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @returns {Function} Express middleware
 */
export function rateLimit({ windowMs = 60000, max = 100, message = 'Too many requests' } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or create request log for this IP
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const requests = requestCounts.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    requestCounts.set(key, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      cleanupOldEntries(windowMs);
    }
    
    next();
  };
}

/**
 * Cleanup old entries from the rate limit store
 */
function cleanupOldEntries(windowMs) {
  const now = Date.now();
  for (const [key, requests] of requestCounts.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, validRequests);
    }
  }
}

/**
 * Predefined rate limiters for common scenarios
 */
export const rateLimiters = {
  // Standard API rate limit: 100 requests per minute
  standard: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests, please try again later'
  }),
  
  // Strict rate limit for sensitive operations: 10 requests per minute
  strict: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Rate limit exceeded for sensitive operation'
  }),
  
  // Filesystem operations: 30 requests per minute
  filesystem: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many filesystem operations'
  }),
  
  // AI integration: 20 requests per minute
  ai: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many AI service requests'
  }),
  
  // Validation: 50 requests per minute
  validation: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    message: 'Too many validation requests'
  })
};
