const express = require('express');
const router = express.Router();
const moderationController = require('./moderation.controller');
const { moderateIssueSchema, mergeIssueSchema } = require('./moderation.validation');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Only moderators and admins can access moderation routes
router.use(authenticate, authorize('moderator', 'admin'));

router.get('/queue', moderationController.getModerationQueue);
router.post('/issues/:id', validate(moderateIssueSchema), moderationController.moderateIssue);
router.post('/issues/:id/merge', validate(mergeIssueSchema), moderationController.mergeDuplicateIssues);

module.exports = router;
