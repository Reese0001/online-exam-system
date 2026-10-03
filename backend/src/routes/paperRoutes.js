/**
 * 试卷管理路由 /api/papers
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireTeacher } = require('../middlewares/rbac');
const ctrl = require('../controllers/paperController');
const v = require('../utils/validator');

// 所有试卷接口仅教师可访问
router.use(auth(), requireTeacher());

// GET /api/papers - 试卷列表
router.get('/', ctrl.list);

// POST /api/papers - 创建试卷
router.post('/', v.paperCreateRules, v.handleValidationErrors, ctrl.create);

// POST /api/papers/auto-generate - 随机组卷（放在 :id 之前）
router.post('/auto-generate', v.autoGenerateRules, v.handleValidationErrors, ctrl.autoGenerate);

// GET /api/papers/:id - 试卷详情
router.get('/:id', v.idParamRule, v.handleValidationErrors, ctrl.detail);

// PUT /api/papers/:id - 修改试卷
router.put('/:id', v.idParamRule, v.handleValidationErrors, ctrl.update);

// DELETE /api/papers/:id - 删除试卷
router.delete('/:id', v.idParamRule, v.handleValidationErrors, ctrl.remove);

// POST /api/papers/:id/questions - 添加题目到试卷
router.post('/:id/questions', v.idParamRule, v.addPaperQuestionsRules, v.handleValidationErrors, ctrl.addQuestions);

// DELETE /api/papers/:id/questions - 移除试卷题目
router.delete('/:id/questions', v.idParamRule, v.handleValidationErrors, ctrl.removeQuestion);

module.exports = router;