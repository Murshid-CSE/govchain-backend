// ============================================
// Tracking ID Generator
// ============================================

/**
 * Generate a unique tracking ID
 * Format: GRV-2026-00001 or ISS-2026-00001
 * @param {string} prefix - 'ISS' for issues, 'GRV' for grievances, 'TND' for tenders
 * @param {number} sequence - Sequential number from DB
 * @returns {string}
 */
function generateTrackingId(prefix, sequence) {
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
}

module.exports = { generateTrackingId };
