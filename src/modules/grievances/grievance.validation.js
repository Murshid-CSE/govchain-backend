const { z } = require('zod');

const createGrievanceSchema = z.object({
  departmentId: z.string().uuid().optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').max(50),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().max(255).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

const respondGrievanceSchema = z.object({
  message: z.string().min(5, 'Response message must be at least 5 characters'),
  statusChange: z
    .enum(['under_review', 'in_progress', 'resolved', 'rejected', 'escalated'])
    .optional(),
});

const listGrievancesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['submitted', 'under_review', 'in_progress', 'resolved', 'rejected', 'escalated', 'reopened'])
    .optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

module.exports = {
  createGrievanceSchema,
  respondGrievanceSchema,
  listGrievancesQuerySchema,
};
