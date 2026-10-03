/**
 * 题库管理控制器
 */
const questionService = require('../services/questionService');
const { success, parsePage } = require('../utils/response');

/**
 * GET /api/questions - 题目列表查询
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await questionService.listQuestions({
      ...pagination,
      type: req.query.type,
      difficulty: req.query.difficulty,
      knowledge_point: req.query.knowledge_point,
      keyword: req.query.keyword,
    });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/questions/:id - 题目详情
 */
async function detail(req, res, next) {
  try {
    const q = await questionService.getQuestion(req.params.id);
    success(res, q);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/questions - 新增题目
 */
async function create(req, res, next) {
  try {
    const q = await questionService.createQuestion(req.user.userId, req.body);
    success(res, q, '创建成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/questions/:id - 修改题目
 */
async function update(req, res, next) {
  try {
    const q = await questionService.updateQuestion(req.params.id, req.body);
    success(res, q, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/questions/:id - 删除题目
 */
async function remove(req, res, next) {
  try {
    await questionService.deleteQuestion(req.params.id);
    success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/questions/import - 批量导入题目（Excel）
 */
async function importQuestions(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请上传 Excel 文件', data: null });
    }
    const result = await questionService.importQuestions(req.user.userId, req.file.buffer);
    success(res, result, `导入完成：成功${result.success_count}条，失败${result.fail_count}条`);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/questions/export - 批量导出题目（Excel）
 */
async function exportQuestions(req, res, next) {
  try {
    const buffer = await questionService.exportQuestions({
      type: req.query.type,
      difficulty: req.query.difficulty,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.xlsx');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, detail, create, update, remove, importQuestions, exportQuestions };