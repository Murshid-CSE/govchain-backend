// ============================================
// Zod Validation Middleware
// ============================================

const { sendError } = require('../utils/apiResponse');

/**
 * Validate request body/query/params against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source - Which part of the request to validate
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issueList = result.error.issues || result.error.errors || [];
      const errors = issueList.map((err) => ({
        field: err.path ? err.path.join('.') : '',
        message: err.message,
      }));

      return sendError(res, {
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace with parsed (coerced/defaulted) data
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
