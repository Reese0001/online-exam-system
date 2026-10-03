/**
 * 阅卷路由 /api/grade-tasks
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireTeacher } = require('../middlewares/rbac');
const ctrl = require('../controllers/gradeController');
const v = require('../utils/validator');

// 所有阅卷接口仅教师可访问
router.use(auth(), requireTeacher());

// GET /api/grade-tasks - 阅卷任务列表
router.get('/', ctrl.list);

// GET /api/grade-tasks/:id - 阅卷任务详情
router.get('/:id', v.idParamRule, v.handleValidationErrors, ctrl.detail);

// POST /api/grade-tasks/:id/grade - 手动评分
router.post('/:id/grade', v.idParamRule, v.gradeAnswerRules, v.handleValidationErrors, ctrl.grade);

module.exports = router;