const budgetService = require('./budget.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createAllocation(req, res, next) {
  try {
    const allocation = await budgetService.createAllocation(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Budget allocation created successfully',
      data: { allocation },
    });
  } catch (error) {
    next(error);
  }
}

async function listAllocations(req, res, next) {
  try {
    const { allocations, meta } = await budgetService.listAllocations(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Budget allocations retrieved successfully',
      data: { allocations },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllocationById(req, res, next) {
  try {
    const allocation = await budgetService.getAllocationById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Budget allocation details retrieved',
      data: { allocation },
    });
  } catch (error) {
    next(error);
  }
}

async function addExpenditure(req, res, next) {
  try {
    const expenditure = await budgetService.addExpenditure(
      req.params.id,
      req.user.id,
      req.body,
      req.ip
    );
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Expenditure logged successfully',
      data: { expenditure },
    });
  } catch (error) {
    next(error);
  }
}

async function getBudgetStats(req, res, next) {
  try {
    const stats = await budgetService.getBudgetStats();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Budget utilization statistics retrieved',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentBudget(req, res, next) {
  try {
    const allocations = await budgetService.getDepartmentBudget(req.params.departmentId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department budget allocations retrieved',
      data: { allocations },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAllocation,
  listAllocations,
  getAllocationById,
  addExpenditure,
  getBudgetStats,
  getDepartmentBudget,
};
