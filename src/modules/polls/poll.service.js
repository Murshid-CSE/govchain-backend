const { prisma } = require('../../config/database');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');

async function createPoll(data, userId, ipAddress = null) {
  const poll = await prisma.poll.create({
    data: {
      title: data.title,
      description: data.description,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      createdById: userId,
      status: 'draft',
      options: {
        create: data.options.map((label) => ({ label })),
      },
    },
    include: {
      options: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'POLL_CREATED',
    entityType: 'poll',
    entityId: poll.id,
    details: { title: poll.title, optionCount: data.options.length },
    ipAddress,
  });

  return poll;
}

async function listPolls(filters = {}) {
  const { page = 1, limit = 20, status } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  } else {
    where.status = { not: 'draft' };
  }

  const [total, polls] = await Promise.all([
    prisma.poll.count({ where }),
    prisma.poll.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        options: true,
        _count: { select: { votes: true } },
      },
    }),
  ]);

  return {
    polls,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getPollById(id, userId = null) {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
  });

  if (!poll) {
    const error = new Error('Poll not found');
    error.statusCode = 404;
    throw error;
  }

  let userVotedOptionId = null;
  if (userId) {
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId: id, userId },
      },
    });
    if (existingVote) {
      userVotedOptionId = existingVote.optionId;
    }
  }

  return {
    ...poll,
    hasVoted: Boolean(userVotedOptionId),
    userVotedOptionId,
    disclaimer: 'Community sentiment poll only. Results are not a legally binding government election.',
  };
}

async function activatePoll(id, userId, ipAddress = null) {
  const poll = await prisma.poll.findUnique({ where: { id } });

  if (!poll) {
    const error = new Error('Poll not found');
    error.statusCode = 404;
    throw error;
  }

  if (poll.status !== 'draft') {
    const error = new Error('Only draft polls can be activated');
    error.statusCode = 400;
    throw error;
  }

  const activated = await prisma.poll.update({
    where: { id },
    data: { status: 'active' },
    include: { options: true },
  });

  await recordAuditEvent({
    userId,
    action: 'POLL_ACTIVATED',
    entityType: 'poll',
    entityId: id,
    details: { title: activated.title },
    ipAddress,
  });

  return activated;
}

async function votePoll(pollId, userId, optionId, ipAddress = null) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });

  if (!poll) {
    const error = new Error('Poll not found');
    error.statusCode = 404;
    throw error;
  }

  if (poll.status !== 'active') {
    const error = new Error('Voting is only allowed on active polls');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (now < poll.startsAt || now > poll.endsAt) {
    const error = new Error('Poll is currently not accepting votes (outside voting window)');
    error.statusCode = 400;
    throw error;
  }

  const validOption = poll.options.find((opt) => opt.id === optionId);
  if (!validOption) {
    const error = new Error('Invalid option selected for this poll');
    error.statusCode = 400;
    throw error;
  }

  const existingVote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: { pollId, userId },
    },
  });

  if (existingVote) {
    const error = new Error('You have already voted in this poll');
    error.statusCode = 409;
    throw error;
  }

  await prisma.$transaction([
    prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    }),
    prisma.pollOption.update({
      where: { id: optionId },
      data: { votes: { increment: 1 } },
    }),
  ]);

  await recordAuditEvent({
    userId,
    action: 'POLL_VOTE_CAST',
    entityType: 'poll',
    entityId: pollId,
    details: { optionId },
    ipAddress,
  });

  return { voted: true, optionId };
}

async function closePoll(id, userId, ipAddress = null) {
  const poll = await prisma.poll.findUnique({ where: { id } });

  if (!poll) {
    const error = new Error('Poll not found');
    error.statusCode = 404;
    throw error;
  }

  const closed = await prisma.poll.update({
    where: { id },
    data: { status: 'closed' },
  });

  await recordAuditEvent({
    userId,
    action: 'POLL_CLOSED',
    entityType: 'poll',
    entityId: id,
    ipAddress,
  });

  return closed;
}

module.exports = {
  createPoll,
  listPolls,
  getPollById,
  activatePoll,
  votePoll,
  closePoll,
};
