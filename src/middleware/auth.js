// ============================================
// JWT Authentication Middleware
// ============================================

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * Verify JWT token from Authorization header or cookie.
 * Attaches decoded user to req.user.
 */
function authenticate(req, res, next) {
  let token = null;

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Fall back to cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, { statusCode: 401, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Token expired, please login again' });
    }
    return sendError(res, { statusCode: 401, message: 'Invalid token' });
  }
}

/**
 * Optional authentication — attaches user if token present, continues regardless.
 */
function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Invalid token — proceed as unauthenticated
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

module.exports = { authenticate, optionalAuth };
