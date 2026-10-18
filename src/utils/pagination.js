// ============================================
// Pagination Helper
// ============================================

const { PAGINATION } = require('../config/constants');

/**
 * Parse and validate pagination params from query string
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = PAGINATION.DEFAULT_PAGE;
  if (isNaN(limit) || limit < 1) limit = PAGINATION.DEFAULT_LIMIT;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build pagination meta object for response
 * @param {number} total - Total record count
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = { parsePagination, buildPaginationMeta };
