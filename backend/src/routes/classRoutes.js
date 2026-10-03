/**
 * 班级管理路由 /api/classes
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireAdmin, requireAdminOrTeacher } = require('../middlewares/rbac');
const ctrl = require('../controllers/classController');
const v = require('../utils/validator');

// 班级列表：管理员和教师都可查看
router.get('/', auth(), requireAdminOrTeacher(), ctrl.list);

// 创建班级：仅管理员
router.post('/', auth(), requireAdmin(), v.classCreateRules, v.handleValidationErrors, ctrl.create);

// 班级下学生列表：管理员和教师
router.get('/:id/students', auth(), requireAdminOrTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.students);

// 修改/删除班级：仅管理员
router.put('/:id', auth(), requireAdmin(), v.idParamRule, v.handleValidationErrors, ctrl.update);
router.delete('/:id', auth(), requireAdmin(), v.idParamRule, v.handleValidationErrors, ctrl.remove);

module.exports = router;