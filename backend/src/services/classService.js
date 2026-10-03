/**
 * 班级管理服务层
 * 班级 CRUD、查询班级学生
 */
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const { Class, User } = require('../models');
const { toUserInfo } = require('./authService');

/**
 * 分页查询班级
 */
async function listClasses({ page, pageSize, offset, limit, keyword }) {
  const where = {};
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { grade: { [Op.like]: `%${keyword}%` } },
      { department: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { rows, count } = await Class.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
  });
  // 查询每个班级的学生数
  const list = await Promise.all(
    rows.map(async c => {
      const student_count = await User.count({ where: { class_id: c.id, role: 'student' } });
      return toClassInfo(c, student_count);
    })
  );
  return { list, total: count, page, pageSize };
}

/**
 * 获取班级详情
 */
async function getClass(id) {
  const cls = await Class.findByPk(id);
  if (!cls) throw new BizError(config.codes.NOT_FOUND, '班级不存在');
  const student_count = await User.count({ where: { class_id: id, role: 'student' } });
  return toClassInfo(cls, student_count);
}

/**
 * 创建班级
 */
async function createClass({ name, grade, department }) {
  const exists = await Class.findOne({ where: { name } });
  if (exists) throw new BizError(config.codes.CONFLICT, '班级名称已存在');
  const cls = await Class.create({ name, grade: grade || null, department: department || null });
  return toClassInfo(cls, 0);
}

/**
 * 修改班级
 */
async function updateClass(id, { name, grade, department }) {
  const cls = await Class.findByPk(id);
  if (!cls) throw new BizError(config.codes.NOT_FOUND, '班级不存在');
  if (name && name !== cls.name) {
    const dup = await Class.findOne({ where: { name, id: { [Op.ne]: id } } });
    if (dup) throw new BizError(config.codes.CONFLICT, '班级名称已存在');
  }
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (grade !== undefined) updates.grade = grade;
  if (department !== undefined) updates.department = department;
  await cls.update(updates);
  return toClassInfo(cls);
}

/**
 * 删除班级
 */
async function deleteClass(id) {
  const cls = await Class.findByPk(id);
  if (!cls) throw new BizError(config.codes.NOT_FOUND, '班级不存在');
  // 解除学生关联（class_id 置空，由外键 ON DELETE SET NULL 处理）
  await cls.destroy();
  return true;
}

/**
 * 查询班级下学生列表
 */
async function listClassStudents(id) {
  const cls = await Class.findByPk(id);
  if (!cls) throw new BizError(config.codes.NOT_FOUND, '班级不存在');
  const students = await User.findAll({
    where: { class_id: id, role: 'student' },
    order: [['id', 'ASC']],
  });
  return students.map(toUserInfo);
}

function toClassInfo(cls, student_count) {
  if (!cls) return null;
  const obj = cls.toJSON();
  return {
    id: obj.id,
    name: obj.name,
    grade: obj.grade,
    department: obj.department,
    student_count: student_count ?? 0,
    created_at: obj.created_at,
  };
}

module.exports = {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  listClassStudents,
};