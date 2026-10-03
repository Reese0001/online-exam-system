/**
 * 用户管理服务层
 * 用户 CRUD、分页查询、按角色/班级筛选、重置密码
 */
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const { User, Class } = require('../models');
const { toUserInfo } = require('./authService');

/**
 * 分页查询用户
 */
async function listUsers({ page, pageSize, offset, limit, role, keyword, class_id }) {
  const where = {};
  if (role) where.role = role;
  if (class_id) where.class_id = class_id;
  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { real_name: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
    include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
  });
  return {
    list: rows.map(toUserInfo),
    total: count,
    page,
    pageSize,
  };
}

/**
 * 获取用户详情
 */
async function getUser(id) {
  const user = await User.findByPk(id, {
    include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
  });
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  return toUserInfo(user);
}

/**
 * 创建用户（管理员）
 */
async function createUser({ username, password, real_name, role, email, phone, class_id, status }) {
  const exists = await User.findOne({ where: { username } });
  if (exists) throw new BizError(config.codes.USERNAME_EXISTS, '用户名已存在');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    password_hash: passwordHash,
    real_name,
    role,
    email: email || null,
    phone: phone || null,
    class_id: class_id || null,
    status: status || 'active',
  });
  return toUserInfo(user);
}

/**
 * 修改用户
 */
async function updateUser(id, { real_name, role, email, phone, class_id, status }) {
  const user = await User.findByPk(id);
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  const updates = {};
  if (real_name !== undefined) updates.real_name = real_name;
  if (role !== undefined) updates.role = role;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (class_id !== undefined) updates.class_id = class_id;
  if (status !== undefined) updates.status = status;
  await user.update(updates);
  return toUserInfo(user);
}

/**
 * 删除用户
 */
async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  await user.destroy();
  return true;
}

/**
 * 重置用户密码
 */
async function resetPassword(id, new_password) {
  const user = await User.findByPk(id);
  if (!user) throw new BizError(config.codes.NOT_FOUND, '用户不存在');
  const newHash = await bcrypt.hash(new_password, 10);
  await user.update({ password_hash: newHash });
  return true;
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};