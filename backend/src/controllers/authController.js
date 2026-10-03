/**
 * 认证控制器
 */
const authService = require('../services/authService');
const { success } = require('../utils/response');

/**
 * POST /api/auth/login - 用户登录
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    success(res, result, '登录成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/auth/register - 用户注册
 */
async function register(req, res, next) {
  try {
    const userInfo = await authService.register(req.body);
    success(res, userInfo, '注册成功');
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/auth/profile - 获取当前用户信息
 */
async function getProfile(req, res, next) {
  try {
    const userInfo = await authService.getProfile(req.user.userId);
    success(res, userInfo);
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/auth/profile - 修改个人信息
 */
async function updateProfile(req, res, next) {
  try {
    const userInfo = await authService.updateProfile(req.user.userId, req.body);
    success(res, userInfo, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/auth/password - 修改密码
 */
async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.userId, req.body);
    success(res, null, '密码修改成功');
  } catch (e) {
    next(e);
  }
}

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
};