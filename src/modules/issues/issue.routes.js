const express = require('express');
const router = express.Router();
const issueController = require('./issue.controller');
const {
  createIssueSchema,
  updateIssueSchema,
  createCommentSchema,
  listIssuesQuerySchema,
} = require('./issue.validation');
const { validate } = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/auth');

// Public listing & search
router.get('/', optionalAuth, validate(listIssuesQuerySchema, 'query'), issueController.listIssues);

// Public tracking by tracking ID (e.g., ISS-2026-00001)
router.get('/track/:trackingId', issueController.trackIssue);

// Citizen's own issues
router.get('/my', authenticate, issueController.getMyIssues);

// Public issue detail
router.get('/:id', optionalAuth, issueController.getIssueById);

// Create issue (authenticated citizen)
router.post('/', authenticate, validate(createIssueSchema), issueController.createIssue);

// Update own issue (only if status is draft/submitted)
router.put('/:id', authenticate, validate(updateIssueSchema), issueController.updateIssue);

// Add comment
router.post('/:id/comments', authenticate, validate(createCommentSchema), issueController.addComment);

// Community support (toggle)
router.post('/:id/support', authenticate, issueController.supportIssue);
router.delete('/:id/support', authenticate, issueController.unsupportIssue);

// Follow issue for updates
router.post('/:id/follow', authenticate, issueController.followIssue);
router.delete('/:id/follow', authenticate, issueController.unfollowIssue);

module.exports = router;
