const chatService = require('./chat.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function handleChatIntake(req, res, next) {
  try {
    const result = await chatService.processIntakeConversation(req.body.messages);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Draft report structure synthesized',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { handleChatIntake };
