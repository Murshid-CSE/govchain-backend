const { z } = require('zod');

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  description: z.string().optional(),
  headName: z.string().max(100).optional(),
  contactEmail: z.string().email('Invalid email').optional(),
  contactPhone: z.string().max(20).optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};
