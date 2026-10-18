// ============================================
// Rate Limiter Configuration
// ============================================

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, { statusCode: 429, message: 'Too many requests, please try again later' });
  },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, { statusCode: 429, message: 'Too many authentication attempts, please try again later' });
  },
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, { statusCode: 429, message: 'Upload limit exceeded, please try again later' });
  },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter };
