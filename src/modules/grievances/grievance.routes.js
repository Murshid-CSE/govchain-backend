const express = require('express');
const router = express.Router();
const grievanceController = require('./grievance.controller');
const {
  createGrievanceSchema,
  respondGrievanceSchema,
  listGrievancesQuerySchema,
} = require('./grievance.validation');
const { validate } = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public tracking by token (anonymous, zero personal PII leaked)
router.get('/track/:trackingId', grievanceController.trackGrievance);
router.get('/stats', grievanceController.getGrievanceStats);

// Citizen authenticated routes
router.post('/', authenticate, validate(createGrievanceSchema), grievanceController.createGrievance);
router.get('/my', authenticate, grievanceController.getMyGrievances);
router.get('/:id', authenticate, grievanceController.getGrievanceById);

// Staff management & responses
router.get(
  '/',
  authenticate,
  authorize('admin', 'official', 'moderator'),
  validate(listGrievancesQuerySchema, 'query'),
  grievanceController.listGrievances
);

router.post(
  '/:id/respond',
  authenticate,
  authorize('admin', 'official', 'moderator'),
  validate(respondGrievanceSchema),
  grievanceController.respondToGrievance
);

module.exports = router;
