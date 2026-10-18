// ============================================
// Standardized API Response Helpers
// ============================================

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message]
 * @param {any} [options.data]
 * @param {Object} [options.meta] - Pagination meta
 */
function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message]
 * @param {Array} [options.errors] - Field-level validation errors
 */
function sendError(res, { statusCode = 500, message = 'Internal server error', errors = null } = {}) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

module.exports = { sendSuccess, sendError };
