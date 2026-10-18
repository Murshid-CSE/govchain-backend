const { prisma } = require('../../config/database');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');
const { serializeBigInt } = require('../../utils/serializer');

async function createTender(data, userId, ipAddress = null) {
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const tender = await prisma.tender.create({
    data: {
      title: data.title,
      description: data.description,
      departmentId: data.departmentId,
      category: data.category,
      budgetAmountPaise: data.budgetAmountPaise,
      deadline: new Date(data.deadline),
      createdById: userId,
      status: 'draft',
    },
    include: {
      department: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'TENDER_CREATED',
    entityType: 'tender',
    entityId: tender.id,
    details: {
      title: tender.title,
      budgetAmountPaise: tender.budgetAmountPaise.toString(),
      departmentId: tender.departmentId,
    },
    ipAddress,
  });

  return serializeBigInt(tender);
}

async function publishTender(id, userId, ipAddress = null) {
  const tender = await prisma.tender.findUnique({ where: { id } });

  if (!tender) {
    const error = new Error('Tender not found');
    error.statusCode = 404;
    throw error;
  }

  if (tender.status !== 'draft') {
    const error = new Error(`Only draft tenders can be published. Current status: ${tender.status}`);
    error.statusCode = 400;
    throw error;
  }

  const published = await prisma.tender.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'TENDER_PUBLISHED',
    entityType: 'tender',
    entityId: id,
    details: { title: published.title, publishedAt: published.publishedAt },
    ipAddress,
  });

  return serializeBigInt(published);
}

async function listTenders(filters = {}) {
  const { page = 1, limit = 20, status, departmentId, category } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  } else {
    // By default, hide internal drafts from public listing
    where.status = { not: 'draft' };
  }
  if (departmentId) where.departmentId = departmentId;
  if (category) where.category = category;

  const [total, tenders] = await Promise.all([
    prisma.tender.count({ where }),
    prisma.tender.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, slug: true } },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  return {
    tenders: serializeBigInt(tenders),
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getTenderById(id) {
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
      awardedBid: {
        select: {
          id: true,
          companyName: true,
          amountPaise: true,
          submittedAt: true,
        },
      },
      bids: {
        orderBy: { amountPaise: 'asc' },
        select: {
          id: true,
          companyName: true,
          amountPaise: true,
          proposal: true,
          submittedAt: true,
        },
      },
      documents: true,
    },
  });

  if (!tender) {
    const error = new Error('Tender not found');
    error.statusCode = 404;
    throw error;
  }

  return serializeBigInt(tender);
}

async function submitBid(tenderId, userId, data, ipAddress = null) {
  const tender = await prisma.tender.findUnique({ where: { id: tenderId } });

  if (!tender) {
    const error = new Error('Tender not found');
    error.statusCode = 404;
    throw error;
  }

  if (tender.status !== 'published') {
    const error = new Error('Bidding is only allowed on published tenders');
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > tender.deadline) {
    const error = new Error('Bidding deadline has passed');
    error.statusCode = 400;
    throw error;
  }

  const existingBid = await prisma.tenderBid.findUnique({
    where: {
      tenderId_bidderId: { tenderId, bidderId: userId },
    },
  });

  if (existingBid) {
    const error = new Error('You have already submitted a bid for this tender');
    error.statusCode = 409;
    throw error;
  }

  const bid = await prisma.tenderBid.create({
    data: {
      tenderId,
      bidderId: userId,
      companyName: data.companyName,
      amountPaise: data.amountPaise,
      proposal: data.proposal,
    },
  });

  await recordAuditEvent({
    userId,
    action: 'BID_SUBMITTED',
    entityType: 'tender',
    entityId: tenderId,
    details: { bidId: bid.id, companyName: bid.companyName, amountPaise: bid.amountPaise.toString() },
    ipAddress,
  });

  return serializeBigInt(bid);
}

async function awardTender(tenderId, userId, { bidId, awardReason }, ipAddress = null) {
  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { bids: true },
  });

  if (!tender) {
    const error = new Error('Tender not found');
    error.statusCode = 404;
    throw error;
  }

  if (tender.status === 'awarded') {
    const error = new Error('Tender is already awarded');
    error.statusCode = 400;
    throw error;
  }

  const targetBid = tender.bids.find((b) => b.id === bidId);
  if (!targetBid) {
    const error = new Error('Selected bid does not belong to this tender');
    error.statusCode = 400;
    throw error;
  }

  const updatedTender = await prisma.tender.update({
    where: { id: tenderId },
    data: {
      status: 'awarded',
      awardedBidId: bidId,
      awardReason,
    },
    include: {
      awardedBid: true,
      department: { select: { id: true, name: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'TENDER_AWARDED',
    entityType: 'tender',
    entityId: tenderId,
    details: {
      awardedBidId: bidId,
      companyName: targetBid.companyName,
      contractAmountPaise: targetBid.amountPaise.toString(),
      awardReason,
    },
    ipAddress,
  });

  return serializeBigInt(updatedTender);
}

async function getTenderStats() {
  const tenders = await prisma.tender.findMany({
    select: {
      status: true,
      budgetAmountPaise: true,
    },
  });

  const totalTenders = tenders.length;
  let totalValuePaise = BigInt(0);
  const byStatus = {};

  tenders.forEach((t) => {
    totalValuePaise += t.budgetAmountPaise;
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });

  return {
    totalTenders,
    totalValuePaise: totalValuePaise.toString(),
    byStatus,
  };
}

module.exports = {
  createTender,
  publishTender,
  listTenders,
  getTenderById,
  submitBid,
  awardTender,
  getTenderStats,
};
