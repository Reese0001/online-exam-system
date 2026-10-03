/**
 * 试卷管理控制器
 */
const paperService = require('../services/paperService');
const { success, parsePage } = require('../utils/response');

/**
 * GET /api/papers - 试卷列表查询
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await paperService.listPapers({
      ...pagination,
      keyword: req.query.keyword,
      status: req.query.status,
    });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/papers/:id - 试卷详情
 */
async function detail(req, res, next) {
  try {
    const paper = await paperService.getPaper(req.params.id);
    success(res, paper);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/papers - 创建试卷
 */
async function create(req, res, next) {
  try {
    const paper = await paperService.createPaper(req.user.userId, req.body);
    success(res, paper, '创建成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/papers/:id - 修改试卷
 */
async function update(req, res, next) {
  try {
    const paper = await paperService.updatePaper(req.params.id, req.body);
    success(res, paper, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/papers/:id - 删除试卷
 */
async function remove(req, res, next) {
  try {
    await paperService.deletePaper(req.params.id);
    success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/papers/:id/questions - 添加题目到试卷
 */
async function addQuestions(req, res, next) {
  try {
    await paperService.addQuestions(req.params.id, req.body.questions);
    success(res, null, '添加题目成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/papers/:id/questions - 移除试卷题目
 */
async function removeQuestion(req, res, next) {
  try {
    await paperService.removeQuestion(req.params.id, req.query.question_id);
    success(res, null, '移除题目成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/papers/auto-generate - 随机组卷
 */
async function autoGenerate(req, res, next) {
  try {
    const paper = await paperService.autoGenerate(req.user.userId, req.body);
    success(res, paper, '随机组卷成功');
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
  addQuestions,
  removeQuestion,
  autoGenerate,
};