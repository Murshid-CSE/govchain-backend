const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { createDepartmentSchema } = require('./department.validation');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// Public endpoints
router.get('/', departmentController.listDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Admin-only management
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

module.exports = router;
