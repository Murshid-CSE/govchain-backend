// ============================================
// Environment Configuration
// Validates required env vars at startup
// ============================================

const { z } = require('zod');

const envSchema = z.object({
  // Server
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('GovChain'),
  APP_VERSION: z.string().default('1.0.0'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // File uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('5'),

  // AI (optional)
  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error.errors) {
    error.errors.forEach((err) => {
      console.error(`   ${err.path.join('.')}: ${err.message}`);
    });
  }
  console.error('\n   Copy .env.example to .env and fill in required values.\n');
  process.exit(1);
}

module.exports = { env };
