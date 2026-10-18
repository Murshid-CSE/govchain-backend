const moderationService = require('./moderation.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function getModerationQueue(req, res, next) {
  try {
    const { issues, meta } = await moderationService.getModerationQueue(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Moderation queue retrieved',
      data: { issues },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function moderateIssue(req, res, next) {
  try {
    const issue = await moderationService.moderateIssue(
      req.params.id,
      req.user.id,
      req.body,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Moderation action applied with audit trail',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

async function mergeDuplicateIssues(req, res, next) {
  try {
    const result = await moderationService.mergeDuplicateIssues(
      req.params.id,
      req.body.parentIssueId,
      req.body.reason,
      req.user.id,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getModerationQueue,
  moderateIssue,
  mergeDuplicateIssues,
};
