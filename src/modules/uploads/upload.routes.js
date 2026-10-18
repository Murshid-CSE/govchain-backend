const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload } = require('../../middleware/upload');
const { authenticate } = require('../../middleware/auth');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

// Upload single or multiple files (authenticated)
router.post(
  '/',
  authenticate,
  uploadLimiter,
  upload.array('files', 5),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendError(res, { statusCode: 400, message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url: `/api/v1/uploads/${file.filename}`,
    }));

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Files uploaded successfully',
      data: { files: uploadedFiles },
    });
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

  res.sendFile(filePath);
});

module.exports = router;
