/**
 * 考试管理 + 在线答题路由 /api/exams
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireTeacher, requireStudent } = require('../middlewares/rbac');
const ctrl = require('../controllers/examController');
const gradeCtrl = require('../controllers/gradeController');
const v = require('../utils/validator');

// ============================================================
// 学生端路由（放在 :id 之前避免冲突）
// ============================================================

// GET /api/exams/student/list - 学生考试列表
router.get('/student/list', auth(), requireStudent(), ctrl.studentList);

// ============================================================
// 教师端：考试管理
// ============================================================

// GET /api/exams - 考试列表（教师）
router.get('/', auth(), requireTeacher(), ctrl.list);

// POST /api/exams - 创建考试
router.post('/', auth(), requireTeacher(), v.examCreateRules, v.handleValidationErrors, ctrl.create);

// GET /api/exams/:id - 考试详情
router.get('/:id', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.detail);

// PUT /api/exams/:id - 修改考试
router.put('/:id', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.update);

// DELETE /api/exams/:id - 删除考试
router.delete('/:id', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.remove);

// POST /api/exams/:id/publish - 发布考试
router.post('/:id/publish', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.publish);

// PUT /api/exams/:id/status - 考试状态管理
router.put('/:id/status', auth(), requireTeacher(), v.idParamRule, v.examStatusRules, v.handleValidationErrors, ctrl.updateStatus);

// POST /api/exams/:id/classes - 指定参考班级
router.post('/:id/classes', auth(), requireTeacher(), v.idParamRule, v.examClassesRules, v.handleValidationErrors, ctrl.setClasses);

// GET /api/exams/:id/students - 查询考试参考学生列表
router.get('/:id/students', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, ctrl.students);

// POST /api/exams/:id/auto-grade - 触发客观题自动阅卷（教师）
router.post('/:id/auto-grade', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, gradeCtrl.autoGrade);

// GET /api/exams/:id/grade-progress - 阅卷进度查看
router.get('/:id/grade-progress', auth(), requireTeacher(), v.idParamRule, v.handleValidationErrors, gradeCtrl.gradeProgress);

// ============================================================
// 学生端：在线答题
// ============================================================

// GET /api/exams/:id/start - 进入考试
router.get('/:id/start', auth(), requireStudent(), v.idParamRule, v.handleValidationErrors, ctrl.start);

// POST /api/exams/:id/answers - 答案暂存
router.post('/:id/answers', auth(), requireStudent(), v.idParamRule, v.answerSaveRules, v.handleValidationErrors, ctrl.saveAnswer);

// POST /api/exams/:id/submit - 交卷
router.post('/:id/submit', auth(), requireStudent(), v.idParamRule, v.handleValidationErrors, ctrl.submit);

// GET /api/exams/:id/record - 查看答题记录
router.get('/:id/record', auth(), requireStudent(), v.idParamRule, v.handleValidationErrors, ctrl.record);

module.exports = router;