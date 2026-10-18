// ============================================
// SHA-256 Hash Chain for Audit Logs
// ============================================

const crypto = require('crypto');

const GENESIS_HASH = '0'.repeat(64);

/**
 * Compute SHA-256 hash for an audit event
 * @param {Object} params
 * @param {string} params.timestamp - ISO timestamp
 * @param {string} params.action - Action name
 * @param {string} params.entityType
 * @param {string} params.entityId
 * @param {Object} params.details - Change details
 * @param {string} params.prevHash - Hash of the previous event
 * @returns {string} SHA-256 hex digest
 */
function computeAuditHash({ timestamp, action, entityType, entityId, details, prevHash }) {
  const canonical = JSON.stringify({
    timestamp,
    action,
    entityType,
    entityId,
    details: details ? JSON.stringify(details, Object.keys(details).sort()) : null,
    prevHash,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verify a chain of audit events
 * @param {Array} events - Ordered audit events from DB
 * @returns {{ valid: boolean, brokenAt: number|null, message: string }}
 */
function verifyChain(events) {
  if (!events || events.length === 0) {
    return { valid: true, brokenAt: null, message: 'Empty chain is valid' };
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check prev_hash linkage
    if (i === 0) {
      if (event.prevHash !== GENESIS_HASH) {
        return {
          valid: false,
          brokenAt: Number(event.id),
          message: `First event (id=${event.id}) does not reference genesis hash`,
        };
      }
    } else {
      if (event.prevHash !== events[i - 1].hash) {
        return {
          valid: false,
          brokenAt: Number(event.id),
          message: `Event id=${event.id} prev_hash does not match previous event hash`,
        };
      }
    }

    // Recompute and verify hash
    const recomputed = computeAuditHash({
      timestamp: event.timestamp.toISOString(),
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      details: event.details,
      prevHash: event.prevHash,
    });

    if (recomputed !== event.hash) {
      return {
        valid: false,
        brokenAt: Number(event.id),
        message: `Event id=${event.id} hash mismatch — record may have been tampered with`,
      };
    }
  }

  return { valid: true, brokenAt: null, message: `Chain of ${events.length} events is intact` };
}

module.exports = { computeAuditHash, verifyChain, GENESIS_HASH };
