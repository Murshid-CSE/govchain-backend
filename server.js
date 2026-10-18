// ============================================
// GOVCHAIN BACKEND SERVER ENTRY POINT
// ============================================

require('dotenv').config();
const { env } = require('./src/config/env');
const app = require('./src/app');
const { prisma } = require('./src/config/database');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`  ${env.APP_NAME} Civic Transparency API`);
  console.log('========================================');
  console.log(`  Status    : Running`);
  console.log(`  Port      : ${PORT}`);
  console.log(`  Mode      : ${env.NODE_ENV}`);
  console.log(`  Base URL  : http://localhost:${PORT}/api/v1`);
  console.log(`  Health    : http://localhost:${PORT}/api/v1/health`);
  console.log('========================================');
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));