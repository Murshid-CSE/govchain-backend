// ============================================
// Audit Logger Middleware
// ============================================

const { prisma } = require('../config/database');
const { computeAuditHash, GENESIS_HASH } = require('../utils/hashChain');

/**
 * Record an audit event with hash chain integrity.
 * Called from services after successful state changes.
 * @param {Object} params
 * @param {string} [params.userId] - Actor user ID
 * @param {string} params.action - e.g., 'ISSUE_CREATED', 'TENDER_AWARDED'
 * @param {string} params.entityType - e.g., 'issue', 'tender'
 * @param {string} params.entityId - Entity UUID
 * @param {Object} [params.details] - Before/after data
 * @param {string} [params.ipAddress] - Client IP
 */
async function recordAuditEvent({ userId = null, action, entityType, entityId, details = null, ipAddress = null }) {
  await prisma.$transaction(async (tx) => {
    // Serialize chain appends across API replicas until the transaction commits.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(71426091)`;
    // Get the last event's hash for chaining
    const lastEvent = await tx.auditEvent.findFirst({
      orderBy: { id: 'desc' },
      select: { hash: true },
    });

    const prevHash = lastEvent ? lastEvent.hash : GENESIS_HASH;
    const timestamp = new Date();

    const hash = computeAuditHash({
      timestamp: timestamp.toISOString(),
      action,
      entityType,
      entityId: String(entityId),
      details,
      prevHash,
    });

    await tx.auditEvent.create({
      data: {
        timestamp,
        userId,
        action,
        entityType,
        entityId: String(entityId),
        details: details || undefined,
        ipAddress,
        prevHash,
        hash,
      },
    });
  });
}

module.exports = { recordAuditEvent };
