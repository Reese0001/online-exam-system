/**
 * 认证服务层
 * 登录、注册、获取/修改个人信息、修改密码
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const { User, Class } = require('../models');

/**
 * 用户登录
 */
async function login({ username, password }) {
  // 查询用户（含密码哈希）
  const user = await User.scope('withPassword').findOne({ where: { username } });
  if (!user) {
    throw new BizError(config.codes.USERNAME_OR_PASSWORD_ERROR, '用户名或密码错误');
  }
  // 校验密码
  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    throw new BizError(config.codes.USERNAME_OR_PASSWORD_ERROR, '用户名或密码错误');
  }
  // 校验账号状态
  if (user.status !== 'active') {
    throw new BizError(config.codes.ACCOUNT_DISABLED, '账号已禁用，请联系管理员');
  }
  // 签发 JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return { token, userInfo: toUserInfo(user) };
}

/**
 * 用户注册（管理员创建或学生自助）
 */
async function register({ username, password, real_name, role, email, phone, class_id }) {
  // 校验用户名唯一
  const exists = await User.findOne({ where: { username } });
  if (exists) {
    throw new BizError(config.codes.USERNAME_EXISTS, '用户名已存在');
  }
  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    password_hash: passwordHash,
    real_name,
    role,
    email: email || null,
    phone: phone || null,
    class_id: class_id || null,
    status: 'active',
  });
  return toUserInfo(user);
}

/**
 * 获取当前用户信息
 */
async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
  });
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  return toUserInfo(user);
}

/**
 * 修改个人信息
 */
async function updateProfile(userId, { real_name, email, phone }) {
  const user = await User.findByPk(userId);
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  const updates = {};
  if (real_name !== undefined) updates.real_name = real_name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  await user.update(updates);
  return toUserInfo(user);
}

/**
 * 修改密码
 */
async function changePassword(userId, { old_password, new_password }) {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  const matched = await bcrypt.compare(old_password, user.password_hash);
  if (!matched) {
    throw new BizError(config.codes.BAD_REQUEST, '旧密码错误');
  }
  const newHash = await bcrypt.hash(new_password, 10);
  await user.update({ password_hash: newHash });
  return true;
}

/**
 * 转换为用户信息 DTO（不含密码哈希）
 */
function toUserInfo(user) {
  if (!user) return null;
  const obj = user.toJSON();
  const info = {
    id: obj.id,
    username: obj.username,
    real_name: obj.real_name,
    role: obj.role,
    email: obj.email,
    phone: obj.phone,
    class_id: obj.class_id,
    class_name: obj.class?.name || null,
    status: obj.status,
    created_at: obj.created_at,
  };
  return info;
}

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  toUserInfo,
};