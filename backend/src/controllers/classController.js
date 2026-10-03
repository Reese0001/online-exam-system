/**
 * 班级管理控制器
 */
const classService = require('../services/classService');
const { success, parsePage } = require('../utils/response');

/**
 * GET /api/classes - 班级列表查询
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await classService.listClasses({ ...pagination, keyword: req.query.keyword });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/classes - 创建班级
 */
async function create(req, res, next) {
  try {
    const cls = await classService.createClass(req.body);
    success(res, cls, '创建成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/classes/:id - 修改班级
 */
async function update(req, res, next) {
  try {
    const cls = await classService.updateClass(req.params.id, req.body);
    success(res, cls, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/classes/:id - 删除班级
 */
async function remove(req, res, next) {
  try {
    await classService.deleteClass(req.params.id);
    success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/classes/:id/students - 查询班级下学生列表
 */
async function students(req, res, next) {
  try {
    const list = await classService.listClassStudents(req.params.id);
    success(res, list);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, remove, students };