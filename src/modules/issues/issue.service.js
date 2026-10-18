const { prisma } = require('../../config/database');
const { generateTrackingId } = require('../../utils/trackingId');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');

async function createIssue(data, userId, ipAddress = null) {
  const count = await prisma.issue.count();
  const trackingId = generateTrackingId('ISS', count + 1);

  const issue = await prisma.issue.create({
    data: {
      trackingId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || 'medium',
      locationText: data.locationText || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      ward: data.ward || null,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      citizenId: userId,
      departmentId: data.departmentId || null,
      status: 'submitted',
    },
    include: {
      citizen: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, slug: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'ISSUE_CREATED',
    entityType: 'issue',
    entityId: issue.id,
    details: { trackingId: issue.trackingId, title: issue.title, category: issue.category },
    ipAddress,
  });

  return issue;
}

async function listPublicIssues(filters = {}) {
  const { page = 1, limit = 20, status, category, departmentId, search, ward } = filters;
  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
  };

  if (status) {
    where.status = status;
  } else {
    // Only show published/verified/active/resolved public issues by default
    where.status = {
      in: ['submitted', 'published', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'],
    };
  }

  if (category) where.category = category;
  if (departmentId) where.departmentId = departmentId;
  if (ward) where.ward = { contains: ward, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { trackingId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, slug: true } },
        attachments: { select: { id: true, filename: true, mimeType: true, sizeBytes: true } },
        _count: { select: { supports: true, comments: true } },
      },
    }),
  ]);

  return {
    issues,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getIssueById(id) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      citizen: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, slug: true } },
      attachments: true,
      comments: {
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          completedAt: true,
          events: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            select: { id: true, action: true, fromStatus: true, toStatus: true, note: true, createdAt: true },
          },
        },
      },
      _count: { select: { supports: true, comments: true } },
    },
  });

  if (!issue) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  return issue;
}

async function updateIssue(id, data, userId, ipAddress = null) {
  const existing = await prisma.issue.findUnique({ where: { id } });

  if (!existing) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.citizenId !== userId) {
    const error = new Error('Not authorized to update this issue');
    error.statusCode = 403;
    throw error;
  }

  // Citizens can only edit if status is still draft or submitted
  if (!['draft', 'submitted'].includes(existing.status)) {
    const error = new Error('Cannot edit an issue once under review or processed');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.issue.update({
    where: { id },
    data,
    include: {
      citizen: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'ISSUE_UPDATED',
    entityType: 'issue',
    entityId: id,
    details: data,
    ipAddress,
  });

  return updated;
}

async function addComment(issueId, userId, content, isOfficial = false, ipAddress = null) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  const [comment] = await prisma.$transaction([
    prisma.issueComment.create({
      data: {
        issueId,
        userId,
        content,
        isOfficial,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.issue.update({
      where: { id: issueId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  await recordAuditEvent({
    userId,
    action: 'COMMENT_ADDED',
    entityType: 'issue',
    entityId: issueId,
    details: { commentId: comment.id, isOfficial },
    ipAddress,
  });

  return comment;
}

async function supportIssue(issueId, userId, ipAddress = null) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  const existingSupport = await prisma.issueSupport.findUnique({
    where: {
      issueId_userId: { issueId, userId },
    },
  });

  if (existingSupport) {
    const error = new Error('You have already supported this issue');
    error.statusCode = 409;
    throw error;
  }

  await prisma.$transaction([
    prisma.issueSupport.create({
      data: { issueId, userId },
    }),
    prisma.issue.update({
      where: { id: issueId },
      data: { supportCount: { increment: 1 } },
    }),
  ]);

  await recordAuditEvent({
    userId,
    action: 'ISSUE_SUPPORTED',
    entityType: 'issue',
    entityId: issueId,
    ipAddress,
  });

  return { supported: true };
}

async function unsupportIssue(issueId, userId, ipAddress = null) {
  const existingSupport = await prisma.issueSupport.findUnique({
    where: {
      issueId_userId: { issueId, userId },
    },
  });

  if (!existingSupport) {
    const error = new Error('You have not supported this issue');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.issueSupport.delete({
      where: { issueId_userId: { issueId, userId } },
    }),
    prisma.issue.update({
      where: { id: issueId },
      data: { supportCount: { decrement: 1 } },
    }),
  ]);

  return { supported: false };
}

async function followIssue(issueId, userId) {
  await prisma.issueFollow.upsert({
    where: { issueId_userId: { issueId, userId } },
    create: { issueId, userId },
    update: {},
  });
  return { following: true };
}

async function unfollowIssue(issueId, userId) {
  await prisma.issueFollow.deleteMany({
    where: { issueId, userId },
  });
  return { following: false };
}

async function getMyIssues(userId, filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where: { citizenId: userId } }),
    prisma.issue.findMany({
      where: { citizenId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, slug: true } },
        _count: { select: { supports: true, comments: true } },
      },
    }),
  ]);

  return {
    issues,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function trackIssue(trackingId) {
  const issue = await prisma.issue.findUnique({
    where: { trackingId },
    include: {
      department: { select: { id: true, name: true, slug: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          events: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!issue) {
    const error = new Error(`No issue found with tracking ID: ${trackingId}`);
    error.statusCode = 404;
    throw error;
  }

  return issue;
}

module.exports = {
  createIssue,
  listPublicIssues,
  getIssueById,
  updateIssue,
  addComment,
  supportIssue,
  unsupportIssue,
  followIssue,
  unfollowIssue,
  getMyIssues,
  trackIssue,
};
