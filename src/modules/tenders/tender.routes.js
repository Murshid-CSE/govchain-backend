const express = require('express');
const router = express.Router();
const tenderController = require('./tender.controller');
const {
  createTenderSchema,
  submitBidSchema,
  awardTenderSchema,
  listTendersQuerySchema,
} = require('./tender.validation');
const { validate } = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public overview & stats
router.get('/', optionalAuth, validate(listTendersQuerySchema, 'query'), tenderController.listTenders);
router.get('/stats', optionalAuth, tenderController.getTenderStats);
router.get('/:id', optionalAuth, tenderController.getTenderById);

// Staff tender management
router.post(
  '/',
  authenticate,
  authorize('admin', 'official'),
  validate(createTenderSchema),
  tenderController.createTender
);

router.post(
  '/:id/publish',
  authenticate,
  authorize('admin', 'official'),
  tenderController.publishTender
);

// Contractor/citizen bid submission
router.post(
  '/:id/bids',
  authenticate,
  validate(submitBidSchema),
  tenderController.submitBid
);

// Mandatory award justification
router.post(
  '/:id/award',
  authenticate,
  authorize('admin', 'official'),
  validate(awardTenderSchema),
  tenderController.awardTender
);

module.exports = router;
