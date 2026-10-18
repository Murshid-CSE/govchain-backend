const { z } = require('zod');
const { ISSUE_CATEGORIES, ISSUE_STATUSES } = require('../../config/constants');

const createIssueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(ISSUE_CATEGORIES),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  locationText: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ward: z.string().max(100).optional(),
  isPublic: z.boolean().default(true),
  departmentId: z.string().uuid().optional(),
});

const updateIssueSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(10).optional(),
  category: z.enum(ISSUE_CATEGORIES).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  locationText: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ward: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

const listIssuesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(ISSUE_STATUSES).optional(),
  category: z.enum(ISSUE_CATEGORIES).optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
  ward: z.string().optional(),
});

module.exports = {
  createIssueSchema,
  updateIssueSchema,
  createCommentSchema,
  listIssuesQuerySchema,
};
