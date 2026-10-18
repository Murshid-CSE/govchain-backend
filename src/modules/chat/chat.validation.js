const { z } = require('zod');

const chatIntakeSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000),
    })
  ).min(1, 'At least one message is required'),
});

module.exports = { chatIntakeSchema };
