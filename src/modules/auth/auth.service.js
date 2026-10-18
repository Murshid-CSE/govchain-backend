const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const { recordAuditEvent } = require('../../middleware/auditLogger');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
    process.env.JWT_SECRET || 'default_secret_please_set_in_production_32chars',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register(data, ipAddress = null) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      role: 'citizen',
    },
  });

  await recordAuditEvent({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress,
  });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function login(email, password, ipAddress = null) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { department: { select: { id: true, name: true, slug: true } } },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  await recordAuditEvent({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'user',
    entityId: user.id,
    details: { email: user.email },
    ipAddress,
  });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: { select: { id: true, name: true, slug: true } } },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, data, ipAddress = null) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    include: { department: { select: { id: true, name: true, slug: true } } },
  });

  await recordAuditEvent({
    userId,
    action: 'USER_PROFILE_UPDATED',
    entityType: 'user',
    entityId: userId,
    details: data,
    ipAddress,
  });

  return sanitizeUser(updatedUser);
}

async function createOfficialAccount(data, adminId, ipAddress = null) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      role: data.role,
      departmentId: data.departmentId,
      isVerified: true,
    },
    include: { department: { select: { id: true, name: true, slug: true } } },
  });

  await recordAuditEvent({
    userId: adminId,
    action: 'OFFICIAL_ACCOUNT_CREATED',
    entityType: 'user',
    entityId: user.id,
    details: { email: user.email, role: user.role, departmentId: user.departmentId },
    ipAddress,
  });

  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  createOfficialAccount,
};
