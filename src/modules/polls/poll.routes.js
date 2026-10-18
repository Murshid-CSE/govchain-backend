const express = require('express');
const router = express.Router();
const pollController = require('./poll.controller');
const {
  createPollSchema,
  votePollSchema,
  listPollsQuerySchema,
} = require('./poll.validation');
const { validate } = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public endpoints
router.get('/', optionalAuth, validate(listPollsQuerySchema, 'query'), pollController.listPolls);
router.get('/:id', optionalAuth, pollController.getPollById);

// Staff management
router.post(
  '/',
  authenticate,
  authorize('admin', 'official'),
  validate(createPollSchema),
  pollController.createPoll
);

router.post(
  '/:id/activate',
  authenticate,
  authorize('admin', 'official'),
  pollController.activatePoll
);

router.post(
  '/:id/close',
  authenticate,
  authorize('admin', 'official'),
  pollController.closePoll
);

// Citizen vote (one vote per user)
router.post(
  '/:id/vote',
  authenticate,
  validate(votePollSchema),
  pollController.votePoll
);

module.exports = router;
