const issueService = require('./issue.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createIssue(req, res, next) {
  try {
    const issue = await issueService.createIssue(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Issue reported successfully',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

async function listIssues(req, res, next) {
  try {
    const { issues, meta } = await issueService.listPublicIssues(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Issues retrieved successfully',
      data: { issues },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getIssueById(req, res, next) {
  try {
    const issue = await issueService.getIssueById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Issue retrieved successfully',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

async function updateIssue(req, res, next) {
  try {
    const issue = await issueService.updateIssue(req.params.id, req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Issue updated successfully',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const isOfficial = ['official', 'moderator', 'admin'].includes(req.user.role);
    const comment = await issueService.addComment(
      req.params.id,
      req.user.id,
      req.body.content,
      isOfficial,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Comment added successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
}

async function supportIssue(req, res, next) {
  try {
    const result = await issueService.supportIssue(req.params.id, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Support recorded',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function unsupportIssue(req, res, next) {
  try {
    const result = await issueService.unsupportIssue(req.params.id, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Support removed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function followIssue(req, res, next) {
  try {
    const result = await issueService.followIssue(req.params.id, req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Following issue',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function unfollowIssue(req, res, next) {
  try {
    const result = await issueService.unfollowIssue(req.params.id, req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Unfollowed issue',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyIssues(req, res, next) {
  try {
    const { issues, meta } = await issueService.getMyIssues(req.user.id, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'My issues retrieved',
      data: { issues },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function trackIssue(req, res, next) {
  try {
    const issue = await issueService.trackIssue(req.params.trackingId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Issue tracking details retrieved',
      data: { issue },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createIssue,
  listIssues,
  getIssueById,
  updateIssue,
  addComment,
  supportIssue,
  unsupportIssue,
  followIssue,
  unfollowIssue,
  getMyIssues,
  trackIssue,
};
