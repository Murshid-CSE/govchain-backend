// ============================================
// Prisma Client Singleton
// ============================================

let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  } else {
    // Reuse client in development to avoid too many connections
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
    }
    prisma = global.__prisma;
  }
} catch (err) {
  // Fallback proxy during client generation or offline unit tests
  prisma = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '$disconnect') return async () => {};
        if (prop === '$queryRaw') return async () => [];
        return new Proxy(
          {},
          {
            get: () => async () => {
              throw new Error(
                'Prisma client not initialized. Please ensure database is running and client is generated.'
              );
            },
          }
        );
      },
    }
  );
}

module.exports = { prisma };
