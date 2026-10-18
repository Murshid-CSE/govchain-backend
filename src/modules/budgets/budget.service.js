const { prisma } = require('../../config/database');
const { buildPaginationMeta } = require('../../utils/pagination');
const { recordAuditEvent } = require('../../middleware/auditLogger');
const { serializeBigInt } = require('../../utils/serializer');

async function createAllocation(data, userId, ipAddress = null) {
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const allocation = await prisma.budgetAllocation.create({
    data: {
      departmentId: data.departmentId,
      fiscalYear: data.fiscalYear,
      category: data.category,
      allocatedPaise: data.allocatedPaise,
      source: data.source || null,
      createdById: userId,
    },
    include: {
      department: { select: { id: true, name: true, slug: true } },
    },
  });

  await recordAuditEvent({
    userId,
    action: 'BUDGET_ALLOCATED',
    entityType: 'budget_allocation',
    entityId: allocation.id,
    details: {
      departmentId: allocation.departmentId,
      fiscalYear: allocation.fiscalYear,
      allocatedPaise: allocation.allocatedPaise.toString(),
    },
    ipAddress,
  });

  return serializeBigInt(allocation);
}

async function listAllocations(filters = {}) {
  const { page = 1, limit = 20, departmentId, fiscalYear } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (departmentId) where.departmentId = departmentId;
  if (fiscalYear) where.fiscalYear = fiscalYear;

  const [total, allocations] = await Promise.all([
    prisma.budgetAllocation.count({ where }),
    prisma.budgetAllocation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, slug: true } },
        _count: { select: { expenditures: true } },
      },
    }),
  ]);

  return {
    allocations: serializeBigInt(allocations),
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getAllocationById(id) {
  const allocation = await prisma.budgetAllocation.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
      expenditures: {
        orderBy: { spentOn: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!allocation) {
    const error = new Error('Budget allocation not found');
    error.statusCode = 404;
    throw error;
  }

  return serializeBigInt(allocation);
}

async function addExpenditure(allocationId, userId, data, ipAddress = null) {
  const allocation = await prisma.budgetAllocation.findUnique({
    where: { id: allocationId },
  });

  if (!allocation) {
    const error = new Error('Budget allocation not found');
    error.statusCode = 404;
    throw error;
  }

  const [expenditure] = await prisma.$transaction([
    prisma.budgetExpenditure.create({
      data: {
        allocationId,
        amountPaise: data.amountPaise,
        description: data.description,
        vendor: data.vendor || null,
        receiptUrl: data.receiptUrl || null,
        spentOn: new Date(data.spentOn),
        createdById: userId,
      },
    }),
    prisma.budgetAllocation.update({
      where: { id: allocationId },
      data: {
        spentPaise: { increment: data.amountPaise },
        lastUpdated: new Date(),
      },
    }),
  ]);

  await recordAuditEvent({
    userId,
    action: 'BUDGET_EXPENDITURE_LOGGED',
    entityType: 'budget_expenditure',
    entityId: expenditure.id,
    details: {
      allocationId,
      amountPaise: data.amountPaise.toString(),
      vendor: data.vendor,
    },
    ipAddress,
  });

  return serializeBigInt(expenditure);
}

async function getBudgetStats() {
  const allocations = await prisma.budgetAllocation.findMany({
    include: {
      department: { select: { id: true, name: true, slug: true } },
    },
  });

  let totalAllocatedPaise = BigInt(0);
  let totalSpentPaise = BigInt(0);
  const byDepartment = {};

  allocations.forEach((alloc) => {
    totalAllocatedPaise += alloc.allocatedPaise;
    totalSpentPaise += alloc.spentPaise;

    const deptName = alloc.department.name;
    if (!byDepartment[deptName]) {
      byDepartment[deptName] = {
        allocatedPaise: BigInt(0),
        spentPaise: BigInt(0),
      };
    }
    byDepartment[deptName].allocatedPaise += alloc.allocatedPaise;
    byDepartment[deptName].spentPaise += alloc.spentPaise;
  });

  const departmentStats = Object.entries(byDepartment).map(([name, data]) => {
    const allocated = Number(data.allocatedPaise);
    const spent = Number(data.spentPaise);
    const utilizationRate = allocated > 0 ? ((spent / allocated) * 100).toFixed(2) : 0;
    return {
      department: name,
      allocatedPaise: data.allocatedPaise.toString(),
      spentPaise: data.spentPaise.toString(),
      utilizationRate: Number(utilizationRate),
    };
  });

  const overallUtilization =
    Number(totalAllocatedPaise) > 0
      ? ((Number(totalSpentPaise) / Number(totalAllocatedPaise)) * 100).toFixed(2)
      : 0;

  return {
    totalAllocatedPaise: totalAllocatedPaise.toString(),
    totalSpentPaise: totalSpentPaise.toString(),
    overallUtilization: Number(overallUtilization),
    departments: departmentStats,
  };
}

async function getDepartmentBudget(departmentId) {
  const allocations = await prisma.budgetAllocation.findMany({
    where: { departmentId },
    include: {
      expenditures: {
        select: { id: true, amountPaise: true, description: true, spentOn: true, vendor: true },
      },
    },
  });

  return serializeBigInt(allocations);
}

module.exports = {
  createAllocation,
  listAllocations,
  getAllocationById,
  addExpenditure,
  getBudgetStats,
  getDepartmentBudget,
};
