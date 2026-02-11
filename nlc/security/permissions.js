/**
 * Permissions - Check command permissions for users
 */

/**
 * Check if user has required permissions
 * @param {object} user - User object with permissions
 * @param {string[]} requiredPermissions - Required permission strings
 * @returns {boolean} True if user has all required permissions
 */
export function hasPermissions(user, requiredPermissions) {
  if (!user || !user.permissions) {
    return false;
  }

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required
  }

  return requiredPermissions.every(perm => user.permissions.includes(perm));
}

/**
 * Check if user has any of the specified permissions
 * @param {object} user - User object
 * @param {string[]} permissions - Permission strings
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !user.permissions) {
    return false;
  }

  if (!permissions || permissions.length === 0) {
    return false;
  }

  return permissions.some(perm => user.permissions.includes(perm));
}

/**
 * Get user's permissions
 * @param {object} user - User object
 * @returns {string[]} List of permissions
 */
export function getUserPermissions(user) {
  if (!user || !user.permissions) {
    return [];
  }

  return user.permissions;
}

/**
 * Create middleware to check permissions
 * @param {string[]} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
export function requirePermissions(requiredPermissions) {
  return (req, res, next) => {
    if (!hasPermissions(req.user, requiredPermissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermissions,
        current: getUserPermissions(req.user),
      });
    }

    next();
  };
}
