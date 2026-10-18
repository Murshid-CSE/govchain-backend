const { z } = require('zod');

const moderateIssueSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag', 'hide', 'escalate']),
  reason: z.string().min(5, 'Mandatory reason must be at least 5 characters'),
  assignedDepartmentId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const mergeIssueSchema = z.object({
  parentIssueId: z.string().uuid('Invalid parent issue ID'),
  reason: z.string().min(10, 'Reason for merging must be documented'),
});

module.exports = {
  moderateIssueSchema,
  mergeIssueSchema,
};
