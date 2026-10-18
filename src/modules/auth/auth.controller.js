const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body, req.ip);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

async function createOfficial(req, res, next) {
  try {
    const official = await authService.createOfficialAccount(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Official account created successfully',
      data: { user: official },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  createOfficial,
};
