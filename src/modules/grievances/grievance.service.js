const { prisma } = require('../../config/database');
const { generateTrackingId } = require('../../utils/trackingId');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');
const { SLA_HOURS } = require('../../config/constants');

function calculateSlaDeadline(priority) {
  const hours = SLA_HOURS[priority] || SLA_HOURS.medium;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

async function createGrievance(data, userId, ipAddress = null) {
  const count = await prisma.grievance.count();
  const trackingId = generateTrackingId('GRV', count + 1);
  const priority = data.priority || 'medium';
  const slaDeadline = calculateSlaDeadline(priority);

  const grievance = await prisma.grievance.create({
    data: {
      trackingId,
      citizenId: userId,
      departmentId: data.departmentId || null,
      category: data.category,
      subject: data.subject,
      description: data.description,
      location: data.location || null,
      priority,
      slaDeadline,
      status: 'submitted',
    },
    include: {
      department: { select: { id: true, name: true, slug: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'GRIEVANCE_FILED',
    entityType: 'grievance',
    entityId: grievance.id,
    details: {
      trackingId: grievance.trackingId,
      subject: grievance.subject,
      priority: grievance.priority,
      slaDeadline: grievance.slaDeadline,
    },
    ipAddress,
  });

  return grievance;
}

async function listGrievances(filters = {}) {
  const { page = 1, limit = 20, status, departmentId, priority } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (priority) where.priority = priority;

  const [total, grievances] = await Promise.all([
    prisma.grievance.count({ where }),
    prisma.grievance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, slug: true } },
        _count: { select: { responses: true } },
      },
    }),
  ]);

  return {
    grievances,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getGrievanceById(id) {
  const grievance = await prisma.grievance.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, slug: true } },
      responses: {
        orderBy: { createdAt: 'asc' },
        include: {
          responder: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!grievance) {
    const error = new Error('Grievance not found');
    error.statusCode = 404;
    throw error;
  }

  return grievance;
}

async function trackGrievance(trackingId) {
  const grievance = await prisma.grievance.findUnique({
    where: { trackingId },
    select: {
      id: true,
      trackingId: true,
      subject: true,
      description: true,
      category: true,
      status: true,
      priority: true,
      slaDeadline: true,
      resolvedAt: true,
      createdAt: true,
      department: { select: { id: true, name: true, slug: true } },
      responses: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          message: true,
          statusChange: true,
          createdAt: true,
          responder: { select: { name: true, role: true } },
        },
      },
    },
  });

  if (!grievance) {
    const error = new Error(`No grievance found for tracking ID: ${trackingId}`);
    error.statusCode = 404;
    throw error;
  }

  return grievance;
}

async function respondToGrievance(id, userId, data, ipAddress = null) {
  const grievance = await prisma.grievance.findUnique({ where: { id } });

  if (!grievance) {
    const error = new Error('Grievance not found');
    error.statusCode = 404;
    throw error;
  }

  const isResolved = data.statusChange === 'resolved';

  const [response, updatedGrievance] = await prisma.$transaction([
    prisma.grievanceResponse.create({
      data: {
        grievanceId: id,
        responderId: userId,
        message: data.message,
        statusChange: data.statusChange || null,
      },
      include: {
        responder: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.grievance.update({
      where: { id },
      data: {
        status: data.statusChange || grievance.status,
        resolvedAt: isResolved ? new Date() : grievance.resolvedAt,
      },
    }),
  ]);

  await recordAuditEvent({
    userId,
    action: 'GRIEVANCE_RESPONDED',
    entityType: 'grievance',
    entityId: id,
    details: {
      statusChange: data.statusChange,
      messageLength: data.message.length,
    },
    ipAddress,
  });

  return { response, grievance: updatedGrievance };
}

async function getMyGrievances(userId, filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const [total, grievances] = await Promise.all([
    prisma.grievance.count({ where: { citizenId: userId } }),
    prisma.grievance.findMany({
      where: { citizenId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    }),
  ]);

  return {
    grievances,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getGrievanceStats() {
  const now = new Date();
  const [total, resolved, overdue] = await Promise.all([
    prisma.grievance.count(),
    prisma.grievance.count({ where: { status: 'resolved' } }),
    prisma.grievance.count({
      where: {
        slaDeadline: { lt: now },
        status: { notIn: ['resolved', 'rejected'] },
      },
    }),
  ]);

  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(2) : 0;

  return {
    totalGrievances: total,
    resolvedGrievances: resolved,
    overdueGrievances: overdue,
    resolutionRate: Number(resolutionRate),
  };
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
