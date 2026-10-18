const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createOfficialSchema,
} = require('./auth.validation');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post(
  '/officials',
  authenticate,
  authorize('admin'),
  validate(createOfficialSchema),
  authController.createOfficial
);

module.exports = router;
