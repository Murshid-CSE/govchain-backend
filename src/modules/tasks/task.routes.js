const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const {
  createTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
} = require('./task.validation');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');

// List tasks (officials, moderators, admins)
router.get(
  '/',
  authenticate,
  authorize('admin', 'official', 'moderator'),
  validate(listTasksQuerySchema, 'query'),
  taskController.listTasks
);

// My assigned tasks
router.get(
  '/my',
  authenticate,
  authorize('official', 'admin'),
  taskController.getMyTasks
);

// Overdue tasks
router.get(
  '/overdue',
  authenticate,
  authorize('admin', 'official', 'moderator'),
  taskController.getOverdueTasks
);

// Task detail
router.get('/:id', authenticate, taskController.getTaskById);

// Create task
router.post(
  '/',
  authenticate,
  authorize('admin', 'official', 'moderator'),
  validate(createTaskSchema),
  taskController.createTask
);

// Update status with mandatory audit trail
router.put(
  '/:id/status',
  authenticate,
  authorize('admin', 'official'),
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

module.exports = router;
