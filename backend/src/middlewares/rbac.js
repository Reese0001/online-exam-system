/**
 * RBAC 角色权限控制中间件
 * 从 req.user.role 校验是否拥有所需角色
 */
const config = require('../config/config');
const { fail } = require('../utils/response');

/**
 * 要求用户具有指定角色之一
 * @param  {...string} roles - 允许的角色列表
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return fail(res, config.codes.UNAUTHORIZED, '未认证', null, 401);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, config.codes.FORBIDDEN, '无权限访问该资源', null, 403);
    }
    next();
  };
}

// 常用角色组合快捷方法
const requireAdmin = () => requireRole(config.roles.ADMIN);
const requireTeacher = () => requireRole(config.roles.TEACHER);
const requireStudent = () => requireRole(config.roles.STUDENT);
const requireAdminOrTeacher = () => requireRole(config.roles.ADMIN, config.roles.TEACHER);
const requireTeacherOrStudent = () => requireRole(config.roles.TEACHER, config.roles.STUDENT);

module.exports = {
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireAdminOrTeacher,
  requireTeacherOrStudent,
};