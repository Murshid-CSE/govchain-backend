const grievanceService = require('./grievance.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createGrievance(req, res, next) {
  try {
    const grievance = await grievanceService.createGrievance(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Grievance submitted successfully with SLA deadline tracking',
      data: { grievance },
    });
  } catch (error) {
    next(error);
  }
}

async function listGrievances(req, res, next) {
  try {
    const { grievances, meta } = await grievanceService.listGrievances(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Grievances retrieved successfully',
      data: { grievances },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getGrievanceById(req, res, next) {
  try {
    const grievance = await grievanceService.getGrievanceById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Grievance retrieved successfully',
      data: { grievance },
    });
  } catch (error) {
    next(error);
  }
}

async function trackGrievance(req, res, next) {
  try {
    const grievance = await grievanceService.trackGrievance(req.params.trackingId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Grievance status retrieved via tracking token',
      data: { grievance },
    });
  } catch (error) {
    next(error);
  }
}

async function respondToGrievance(req, res, next) {
  try {
    const result = await grievanceService.respondToGrievance(
      req.params.id,
      req.user.id,
      req.body,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Response recorded and grievance updated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyGrievances(req, res, next) {
  try {
    const { grievances, meta } = await grievanceService.getMyGrievances(req.user.id, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'My grievances retrieved successfully',
      data: { grievances },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getGrievanceStats(req, res, next) {
  try {
    const stats = await grievanceService.getGrievanceStats();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Public grievance resolution metrics',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGrievance,
  listGrievances,
  getGrievanceById,
  trackGrievance,
  respondToGrievance,
  getMyGrievances,
  getGrievanceStats,
};
