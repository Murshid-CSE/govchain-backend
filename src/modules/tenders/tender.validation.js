const { z } = require('zod');
const { TENDER_STATUSES } = require('../../config/constants');

const createTenderSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  departmentId: z.string().uuid('Invalid department ID'),
  category: z.string().min(2).max(100),
  budgetAmountPaise: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  deadline: z.string().datetime('Must be valid ISO datetime string'),
});

const submitBidSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255),
  amountPaise: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  proposal: z.string().min(20, 'Proposal must be at least 20 characters'),
});

const awardTenderSchema = z.object({
  bidId: z.string().uuid('Invalid bid ID'),
  awardReason: z
    .string()
    .min(20, 'Mandatory award justification must be at least 20 characters')
    .max(2000),
});

const listTendersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(TENDER_STATUSES).optional(),
  departmentId: z.string().uuid().optional(),
  category: z.string().optional(),
});

module.exports = {
  createTenderSchema,
  submitBidSchema,
  awardTenderSchema,
  listTendersQuerySchema,
};
