/**
 * 题库管理路由 /api/questions
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middlewares/auth');
const { requireTeacher } = require('../middlewares/rbac');
const ctrl = require('../controllers/questionController');
const v = require('../utils/validator');

// Excel 上传配置（内存存储，不落盘）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const exts = ['.xlsx', '.xls'];
    const ok = exts.some(ext => file.originalname.toLowerCase().endsWith(ext));
    if (!ok) return cb(new Error('仅支持 .xlsx/.xls 文件'));
    cb(null, true);
  },
});

// 所有题库接口仅教师可访问
router.use(auth(), requireTeacher());

// GET /api/questions - 题目列表
router.get('/', ctrl.list);

// POST /api/questions - 新增题目
router.post('/', v.questionCreateRules, v.handleValidationErrors, ctrl.create);

// GET /api/questions/export - 批量导出（放在 :id 之前避免路由冲突）
router.get('/export', ctrl.exportQuestions);

// POST /api/questions/import - 批量导入
router.post('/import', upload.single('file'), ctrl.importQuestions);

// GET /api/questions/:id - 题目详情
router.get('/:id', v.idParamRule, v.handleValidationErrors, ctrl.detail);

// PUT /api/questions/:id - 修改题目
router.put('/:id', v.idParamRule, v.handleValidationErrors, ctrl.update);

// DELETE /api/questions/:id - 删除题目
router.delete('/:id', v.idParamRule, v.handleValidationErrors, ctrl.remove);

module.exports = router;