const auditService = require('./audit.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function verifyChain(req, res, next) {
  try {
    const result = await auditService.runChainVerification();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cryptographic hash-chain integrity verification result',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getEntityAuditTrail(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const trail = await auditService.getEntityAuditTrail(entityType, entityId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Entity audit trail retrieved',
      data: { trail },
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const activity = await auditService.getRecentActivity(limit);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Recent audit activity retrieved',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyChain,
  getEntityAuditTrail,
  getRecentActivity,
};
