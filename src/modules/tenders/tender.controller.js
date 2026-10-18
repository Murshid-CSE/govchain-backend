const tenderService = require('./tender.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createTender(req, res, next) {
  try {
    const tender = await tenderService.createTender(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tender created as draft',
      data: { tender },
    });
  } catch (error) {
    next(error);
  }
}

async function publishTender(req, res, next) {
  try {
    const tender = await tenderService.publishTender(req.params.id, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tender published for bidding',
      data: { tender },
    });
  } catch (error) {
    next(error);
  }
}

async function listTenders(req, res, next) {
  try {
    const { tenders, meta } = await tenderService.listTenders(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tenders retrieved successfully',
      data: { tenders },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getTenderById(req, res, next) {
  try {
    const tender = await tenderService.getTenderById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tender details retrieved',
      data: { tender },
    });
  } catch (error) {
    next(error);
  }
}

async function submitBid(req, res, next) {
  try {
    const bid = await tenderService.submitBid(req.params.id, req.user.id, req.body, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Bid submitted successfully',
      data: { bid },
    });
  } catch (error) {
    next(error);
  }
}

async function awardTender(req, res, next) {
  try {
    const tender = await tenderService.awardTender(req.params.id, req.user.id, req.body, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tender awarded with documented justification',
      data: { tender },
    });
  } catch (error) {
    next(error);
  }
}

async function getTenderStats(req, res, next) {
  try {
    const stats = await tenderService.getTenderStats();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tender procurement statistics retrieved',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTender,
  publishTender,
  listTenders,
  getTenderById,
  submitBid,
  awardTender,
  getTenderStats,
};
