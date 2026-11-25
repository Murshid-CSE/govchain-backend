const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('node:fs');

let s3Client = null;

function getS3Client() {
  if (!process.env.AWS_ENDPOINT_URL_S3) {
    if (process.env.REQUIRE_OBJECT_STORAGE === 'true') throw new Error('Object storage endpoint is required');
    return null;
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Object storage credentials are incomplete');
  }
  if (!s3Client) {
    s3Client = new S3Client({
      forcePathStyle: true,
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }
  return s3Client;
}

async function uploadToStorage(filename, filePath, mimeType) {
  const client = getS3Client();
  if (!client) {
    return { isS3: false, url: `/api/v1/uploads/${filename}` };
  }

  const fileContent = await fs.promises.readFile(filePath);
  const bucket = process.env.NEON_STORAGE_BUCKET || 'uploads';

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: fileContent,
      ContentType: mimeType,
      ContentDisposition: 'attachment',
    })
  );

  const publicUrl = `${process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/, '')}/${bucket}/${encodeURIComponent(filename)}`;
  return { isS3: true, url: publicUrl };
}

module.exports = { getS3Client, uploadToStorage };
