// ============================================
// Role-Based Authorization Middleware
// ============================================

const { sendError } = require('../utils/apiResponse');

/**
 * Restrict access to specific roles.
 * Must be used after authenticate middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'official')
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = { authorize };
