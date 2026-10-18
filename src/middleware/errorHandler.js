// ============================================
// Global Error Handler
// ============================================

const { sendError } = require('../utils/apiResponse');

/**
 * Centralized error-handling middleware.
 * Must be registered last with 4 parameters.
 */
function errorHandler(err, req, res, _next) {
  // Log error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  } else {
    console.error('Error:', err.message);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return sendError(res, {
      statusCode: 409,
      message: 'A record with this value already exists',
    });
  }

  if (err.code === 'P2025') {
    return sendError(res, {
      statusCode: 404,
      message: 'Record not found',
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, {
      statusCode: 413,
      message: 'File too large',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, {
      statusCode: 400,
      message: 'Unexpected file field',
    });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return sendError(res, {
      statusCode: 400,
      message: 'Invalid JSON in request body',
    });
  }

  // Default — never expose stack traces in production
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong'
      : err.message || 'Internal server error';

  return sendError(res, { statusCode, message });
}

module.exports = { errorHandler };
