const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public hash chain verification (anyone can verify mathematically)
router.get('/verify', auditController.verifyChain);

// Entity-level audit trail
router.get('/entity/:entityType/:entityId', auditController.getEntityAuditTrail);

// Recent activity feed (admin/moderator/official)
router.get(
  '/recent',
  authenticate,
  authorize('admin', 'moderator', 'official'),
  auditController.getRecentActivity
);

module.exports = router;
