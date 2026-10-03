/**
 * 用户管理控制器
 */
const userService = require('../services/userService');
const { success, parsePage } = require('../utils/response');

/**
 * GET /api/users - 用户列表查询
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await userService.listUsers({
      ...pagination,
      role: req.query.role,
      keyword: req.query.keyword,
      class_id: req.query.class_id,
    });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/users/:id - 用户详情
 */
async function detail(req, res, next) {
  try {
    const userInfo = await userService.getUser(req.params.id);
    success(res, userInfo);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/users - 创建用户
 */
async function create(req, res, next) {
  try {
    const userInfo = await userService.createUser(req.body);
    success(res, userInfo, '创建成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/users/:id - 修改用户
 */
async function update(req, res, next) {
  try {
    const userInfo = await userService.updateUser(req.params.id, req.body);
    success(res, userInfo, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/users/:id - 删除用户
 */
async function remove(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/users/:id/reset-password - 重置用户密码
 */
async function resetPassword(req, res, next) {
  try {
    await userService.resetPassword(req.params.id, req.body.new_password);
    success(res, null, '密码重置成功');
  } catch (e) {
    next(e);
  }
}

module.exports = { list, detail, create, update, remove, resetPassword };