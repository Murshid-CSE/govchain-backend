const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().optional(),
  issueId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  note: z.string().max(1000).optional(),
});

const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'overdue']).optional(),
  departmentId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
};
