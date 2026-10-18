const pollService = require('./poll.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createPoll(req, res, next) {
  try {
    const poll = await pollService.createPoll(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Poll created as draft',
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
}

async function listPolls(req, res, next) {
  try {
    const { polls, meta } = await pollService.listPolls(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Polls retrieved successfully',
      data: { polls },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getPollById(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const poll = await pollService.getPollById(req.params.id, userId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Poll retrieved successfully',
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
}

async function activatePoll(req, res, next) {
  try {
    const poll = await pollService.activatePoll(req.params.id, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Poll activated for community voting',
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
}

async function votePoll(req, res, next) {
  try {
    const result = await pollService.votePoll(
      req.params.id,
      req.user.id,
      req.body.optionId,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Vote cast successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function closePoll(req, res, next) {
  try {
    const poll = await pollService.closePoll(req.params.id, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Poll closed',
      data: { poll },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPoll,
  listPolls,
  getPollById,
  activatePoll,
  votePoll,
  closePoll,
};
