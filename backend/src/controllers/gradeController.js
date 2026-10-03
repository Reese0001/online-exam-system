/**
 * 阅卷控制器
 */
const gradeService = require('../services/gradeService');
const { success, parsePage } = require('../utils/response');

/**
 * GET /api/grade-tasks - 阅卷任务列表
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await gradeService.listGradeTasks({
      ...pagination,
      status: req.query.status,
      teacherId: req.user.role === 'teacher' ? req.user.userId : null,
    });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/grade-tasks/:id - 阅卷任务详情
 */
async function detail(req, res, next) {
  try {
    const data = await gradeService.getGradeTask(req.params.id);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/grade-tasks/:id/grade - 手动评分
 */
async function grade(req, res, next) {
  try {
    await gradeService.gradeAnswers(req.user.userId, req.body);
    success(res, null, '评分成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams/:id/auto-grade - 触发客观题自动阅卷
 */
async function autoGrade(req, res, next) {
  try {
    const data = await gradeService.autoGradeExam(req.params.id);
    success(res, data, '自动阅卷完成');
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/exams/:id/grade-progress - 阅卷进度查看
 */
async function gradeProgress(req, res, next) {
  try {
    const data = await gradeService.getGradeProgress(req.params.id);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, detail, grade, autoGrade, gradeProgress };