/**
 * Authentication - Verify user identity for NL commands
 */

/**
 * Authenticate a user request
 * @param {object} req - Express request object
 * @returns {{authenticated: boolean, user: object|null}}
 */
export function authenticateUser(req) {
  // Extract auth token from headers
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return { authenticated: false, user: null };
  }

  // Parse Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { authenticated: false, user: null };
  }

  const token = match[1];

  // In a real implementation, validate the token against auth system
  // For now, use a simple mock validation
  if (token === 'test-token' || token.length > 10) {
    return {
      authenticated: true,
      user: {
        id: 'user-123',
        username: 'system-user',
        permissions: ['agent:read', 'agent:execute', 'system:read', 'logs:read'],
      },
    };
  }

  return { authenticated: false, user: null };
}

/**
 * Create middleware for authentication
 * @returns {Function} Express middleware
 */
export function requireAuth() {
  return (req, res, next) => {
    const { authenticated, user } = authenticateUser(req);

    if (!authenticated) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token',
      });
    }

    req.user = user;
    next();
  };
}
