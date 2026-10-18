const express = require('express');
const router = express.Router();
const budgetController = require('./budget.controller');
const {
  createAllocationSchema,
  createExpenditureSchema,
  listBudgetsQuerySchema,
} = require('./budget.validation');
const { validate } = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public overview & utilization statistics
router.get('/', optionalAuth, validate(listBudgetsQuerySchema, 'query'), budgetController.listAllocations);
router.get('/stats', optionalAuth, budgetController.getBudgetStats);
router.get('/:id', optionalAuth, budgetController.getAllocationById);
router.get('/department/:departmentId', optionalAuth, budgetController.getDepartmentBudget);

// Official/Admin budget allocation and spending logging
router.post(
  '/',
  authenticate,
  authorize('admin', 'official'),
  validate(createAllocationSchema),
  budgetController.createAllocation
);

router.post(
  '/:id/expenditures',
  authenticate,
  authorize('admin', 'official'),
  validate(createExpenditureSchema),
  budgetController.addExpenditure
);

module.exports = router;
