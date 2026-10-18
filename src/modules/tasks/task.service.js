const { prisma } = require('../../config/database');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');

async function createTask(data, userId, ipAddress = null) {
  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        issueId: data.issueId || null,
        departmentId: data.departmentId || null,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.assigneeId ? 'assigned' : 'pending',
        createdById: userId,
      },
      include: {
        department: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        issue: { select: { id: true, trackingId: true, title: true } },
      },
    });

    await tx.taskEvent.create({
      data: {
        taskId: newTask.id,
        userId,
        action: 'TASK_CREATED',
        toStatus: newTask.status,
        note: 'Task initialized',
        isPublic: true,
      },
    });

    if (data.issueId) {
      await tx.issue.update({
        where: { id: data.issueId },
        data: { status: 'assigned' },
      });
    }

    return newTask;
  });

  await recordAuditEvent({
    userId,
    action: 'TASK_CREATED',
    entityType: 'task',
    entityId: task.id,
    details: { title: task.title, status: task.status, issueId: task.issueId },
    ipAddress,
  });

  return task;
}

async function listTasks(filters = {}) {
  const { page = 1, limit = 20, status, departmentId, assigneeId } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (assigneeId) where.assigneeId = assigneeId;

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        issue: { select: { id: true, trackingId: true, title: true } },
      },
    }),
  ]);

  return {
    tasks,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getTaskById(id) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      issue: { select: { id: true, trackingId: true, title: true, status: true } },
      events: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
}

async function updateTaskStatus(id, userId, { status, note }, ipAddress = null) {
  const currentTask = await prisma.task.findUnique({ where: { id } });

  if (!currentTask) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const fromStatus = currentTask.status;
  const isCompleted = status === 'completed';

  const updatedTask = await prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id },
      data: {
        status,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        department: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    await tx.taskEvent.create({
      data: {
        taskId: id,
        userId,
        action: 'STATUS_CHANGED',
        fromStatus,
        toStatus: status,
        note: note || `Status updated from ${fromStatus} to ${status}`,
        isPublic: true,
      },
    });

    if (currentTask.issueId && isCompleted) {
      await tx.issue.update({
        where: { id: currentTask.issueId },
        data: { status: 'resolved', resolvedAt: new Date() },
      });
    }

    return task;
  });

  await recordAuditEvent({
    userId,
    action: 'TASK_STATUS_CHANGED',
    entityType: 'task',
    entityId: id,
    details: { fromStatus, toStatus: status, note },
    ipAddress,
  });

  return updatedTask;
}

async function getMyTasks(userId) {
  return prisma.task.findMany({
    where: { assigneeId: userId },
    orderBy: { dueDate: 'asc' },
    include: {
      department: { select: { id: true, name: true } },
      issue: { select: { id: true, trackingId: true, title: true } },
    },
  });
}

async function getOverdueTasks() {
  const now = new Date();
  return prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { notIn: ['completed', 'cancelled'] },
    },
    orderBy: { dueDate: 'asc' },
    include: {
      department: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  getMyTasks,
  getOverdueTasks,
};
