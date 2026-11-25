// Run against a configured staging environment. This probe only reads metadata.
require('dotenv').config({ quiet: true });
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const { prisma } = require('../src/config/database');
const { getS3Client } = require('../src/utils/neonStorage');

async function main() {
  await prisma.auditEvent.count();
  const storage = getS3Client();
  if (!storage) throw new Error('Object storage configuration required');
  await storage.send(new HeadBucketCommand({ Bucket: process.env.NEON_STORAGE_BUCKET || 'uploads' }));
  console.log('Database schema and uploads bucket are reachable');
}

main().catch(error => {
  console.error('Staging dependency check failed', error.name);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
