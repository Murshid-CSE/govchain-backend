const departmentService = require('./department.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function createDepartment(req, res, next) {
  try {
    const department = await departmentService.createDepartment(req.body, req.user.id, req.ip);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Department created successfully',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
}

async function listDepartments(req, res, next) {
  try {
    const departments = await departmentService.listDepartments();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Departments retrieved successfully',
      data: { departments },
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Department retrieved successfully',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDepartment,
  listDepartments,
  getDepartmentById,
};
