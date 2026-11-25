const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload } = require('../../middleware/upload');
const { authenticate } = require('../../middleware/auth');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const { uploadToStorage } = require('../../utils/neonStorage');

// Upload single or multiple files (authenticated)
router.post(
  '/',
  authenticate,
  uploadLimiter,
  upload.array('files', 5),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendError(res, { statusCode: 400, message: 'No files uploaded' });
    }

    try {
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          let url;
          try {
            ({ url } = await uploadToStorage(file.filename, file.path, file.mimetype));
          } finally {
            if (process.env.AWS_ENDPOINT_URL_S3 || process.env.REQUIRE_OBJECT_STORAGE === 'true') {
              await fs.promises.unlink(file.path);
            }
          }
          return {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            url,
          };
        })
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Files uploaded successfully',
        data: { files: uploadedFiles },
      });
    } catch (err) {
      console.error('File upload storage error:', err.name);
      return sendError(res, { statusCode: 500, message: 'Failed to process file upload' });
    }
  }
);

// Serve file safely
router.get('/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');
  const filePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return sendError(res, { statusCode: 404, message: 'File not found' });
  }

  res.download(path.resolve(filePath));
});

module.exports = router;
