const { prisma } = require('../../config/database');
const { verifyChain } = require('../../utils/hashChain');
const { serializeBigInt } = require('../../utils/serializer');

async function runChainVerification() {
  let events;
  try {
    events = await prisma.auditEvent.findMany({ orderBy: { id: 'asc' } });
  } catch (cause) {
    const error = new Error('Audit verification is unavailable', { cause });
    error.statusCode = 503;
    throw error;
  }

  return {
    ...verifyChain(events),
    totalEvents: events.length,
    verifiedAt: new Date().toISOString(),
  };
}

async function getEntityAuditTrail(entityType, entityId) {
  try {
    const events = await prisma.auditEvent.findMany({
      where: {
        entityType,
        entityId: String(entityId),
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true, timestamp: true, action: true, entityType: true, entityId: true,
        prevHash: true, hash: true,
      },
    });

    return serializeBigInt(events);
  } catch (err) {
    return [];
  }
}

async function getRecentActivity(limit = 50) {
  try {
    const events = await prisma.auditEvent.findMany({
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return serializeBigInt(events);
  } catch (err) {
    return [];
  }
}

module.exports = {
  runChainVerification,
  getEntityAuditTrail,
  getRecentActivity,
};
