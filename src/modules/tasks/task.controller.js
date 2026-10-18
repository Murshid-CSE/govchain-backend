const taskService = require('./task.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

async function listTasks(req, res, next) {
  try {
    const { tasks, meta } = await taskService.listTasks(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tasks retrieved successfully',
      data: { tasks },
      meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Task details retrieved',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const task = await taskService.updateTaskStatus(req.params.id, req.user.id, req.body, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Task status updated',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

async function getMyTasks(req, res, next) {
  try {
    const tasks = await taskService.getMyTasks(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Assigned tasks retrieved',
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
}

async function getOverdueTasks(req, res, next) {
  try {
    const tasks = await taskService.getOverdueTasks();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Overdue tasks retrieved',
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  getMyTasks,
  getOverdueTasks,
};
