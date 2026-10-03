/**
 * 成绩统计路由 /api/scores
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireTeacher, requireStudent } = require('../middlewares/rbac');
const ctrl = require('../controllers/scoreController');

// GET /api/scores/personal - 个人成绩（学生）
router.get('/personal', auth(), requireStudent(), ctrl.personal);

// GET /api/scores/wrong-questions - 错题统计（学生）
router.get('/wrong-questions', auth(), requireStudent(), ctrl.wrongQuestions);

// GET /api/scores/class/:classId - 班级成绩（教师）
router.get('/class/:classId', auth(), requireTeacher(), ctrl.classScores);

// GET /api/scores/statistics - 成绩分布统计（教师）
router.get('/statistics', auth(), requireTeacher(), ctrl.statistics);

// GET /api/scores/export - 成绩单导出（教师）
router.get('/export', auth(), requireTeacher(), ctrl.exportScores);

module.exports = router;