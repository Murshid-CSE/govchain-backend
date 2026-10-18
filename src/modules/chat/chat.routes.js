const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { chatIntakeSchema } = require('./chat.validation');
const { validate } = require('../../middleware/validate');
const { optionalAuth } = require('../../middleware/auth');

router.post('/intake', optionalAuth, validate(chatIntakeSchema), chatController.handleChatIntake);

module.exports = router;
