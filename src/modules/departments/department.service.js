const { prisma } = require('../../config/database');
const { recordAuditEvent } = require('../../middleware/auditLogger');

function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
}

async function createDepartment(data, adminId, ipAddress = null) {
  const slug = generateSlug(data.name);

  const existing = await prisma.department.findUnique({
    where: { slug },
  });

  if (existing) {
    const error = new Error('Department with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      headName: data.headName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
    },
  });

  await recordAuditEvent({
    userId: adminId,
    action: 'DEPARTMENT_CREATED',
    entityType: 'department',
    entityId: department.id,
    details: { name: department.name, slug: department.slug },
    ipAddress,
  });

  return department;
}

async function listDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          issues: true,
          tasks: true,
          tenders: true,
        },
      },
    },
  });
}

async function getDepartmentById(id) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        where: { role: { in: ['official', 'moderator'] } },
        select: { id: true, name: true, role: true, email: true },
      },
      _count: {
        select: {
          issues: true,
          tasks: true,
          tenders: true,
          grievances: true,
        },
      },
    },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  return department;
}

module.exports = {
  createDepartment,
  listDepartments,
  getDepartmentById,
};
