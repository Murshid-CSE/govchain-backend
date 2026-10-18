const { prisma } = require('../../config/database');
const { recordAuditEvent } = require('../../middleware/auditLogger');
const { buildPaginationMeta } = require('../../utils/pagination');

async function getModerationQueue(filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    status: { in: ['submitted', 'under_moderation'] },
  };

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        attachments: true,
      },
    }),
  ]);

  return {
    issues,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function moderateIssue(issueId, moderatorId, data, ipAddress = null) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });

  if (!issue) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  let nextStatus = issue.status;
  if (data.action === 'approve') nextStatus = 'verified';
  if (data.action === 'reject') nextStatus = 'rejected';
  if (data.action === 'escalate') nextStatus = 'under_moderation';

  const updatedIssue = await prisma.$transaction(async (tx) => {
    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        status: nextStatus,
        departmentId: data.assignedDepartmentId || issue.departmentId,
        priority: data.priority || issue.priority,
        isPublic: data.action !== 'hide',
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    await tx.moderationDecision.create({
      data: {
        entityType: 'issue',
        entityId: issueId,
        issueId,
        moderatorId,
        action: data.action,
        reason: data.reason,
      },
    });

    return updated;
  });

  await recordAuditEvent({
    userId: moderatorId,
    action: `ISSUE_MODERATED_${data.action.toUpperCase()}`,
    entityType: 'issue',
    entityId: issueId,
    details: {
      action: data.action,
      reason: data.reason,
      previousStatus: issue.status,
      newStatus: nextStatus,
    },
    ipAddress,
  });

  return updatedIssue;
}

async function mergeDuplicateIssues(childIssueId, parentIssueId, reason, moderatorId, ipAddress = null) {
  if (childIssueId === parentIssueId) {
    const error = new Error('Cannot merge an issue into itself');
    error.statusCode = 400;
    throw error;
  }

  const [child, parent] = await Promise.all([
    prisma.issue.findUnique({ where: { id: childIssueId } }),
    prisma.issue.findUnique({ where: { id: parentIssueId } }),
  ]);

  if (!child || !parent) {
    const error = new Error('One or both issues not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueDuplicate.create({
      data: {
        parentId: parentIssueId,
        childId: childIssueId,
        reason,
        linkedBy: moderatorId,
      },
    });

    await tx.issue.update({
      where: { id: childIssueId },
      data: { status: 'closed' },
    });

    // Transfer support count to parent
    await tx.issue.update({
      where: { id: parentIssueId },
      data: { supportCount: { increment: child.supportCount } },
    });
  });

  await recordAuditEvent({
    userId: moderatorId,
    action: 'ISSUES_MERGED',
    entityType: 'issue',
    entityId: childIssueId,
    details: { parentIssueId, reason },
    ipAddress,
  });

  return {
    success: true,
    message: `Issue ${child.trackingId} linked as duplicate of ${parent.trackingId}`,
  };
}

module.exports = {
  getModerationQueue,
  moderateIssue,
  mergeDuplicateIssues,
};
