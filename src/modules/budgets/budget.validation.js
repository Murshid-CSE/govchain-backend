const { z } = require('zod');

const createAllocationSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  fiscalYear: z.string().regex(/^\d{4}-\d{4}$/, 'Fiscal year must match YYYY-YYYY format (e.g. 2026-2027)'),
  category: z.string().min(2).max(100),
  allocatedPaise: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  source: z.string().max(255).optional(),
});

const createExpenditureSchema = z.object({
  amountPaise: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  vendor: z.string().max(255).optional(),
  receiptUrl: z.string().url().max(500).optional(),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD date format'),
});

const listBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  departmentId: z.string().uuid().optional(),
  fiscalYear: z.string().optional(),
});

module.exports = {
  createAllocationSchema,
  createExpenditureSchema,
  listBudgetsQuerySchema,
};
