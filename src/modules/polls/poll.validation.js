const { z } = require('zod');

const createPollSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(255),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    options: z
      .array(z.string().min(1, 'Option cannot be empty').max(255))
      .min(2, 'At least 2 options are required')
      .max(10, 'Maximum 10 options allowed'),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'Poll end date must be after start date',
    path: ['endsAt'],
  });

const votePollSchema = z.object({
  optionId: z.string().uuid('Invalid option ID'),
});

const listPollsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['draft', 'active', 'closed', 'cancelled']).optional(),
});

module.exports = {
  createPollSchema,
  votePollSchema,
  listPollsQuerySchema,
};
