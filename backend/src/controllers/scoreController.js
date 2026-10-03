/**
 * 成绩统计控制器
 */
const scoreService = require('../services/scoreService');
const { success } = require('../utils/response');

/**
 * GET /api/scores/personal - 个人成绩查询（学生）
 */
async function personal(req, res, next) {
  try {
    const data = await scoreService.getPersonalScores(req.user.userId);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/scores/class/:classId - 班级成绩查看（教师）
 */
async function classScores(req, res, next) {
  try {
    const data = await scoreService.getClassScores(req.params.classId, req.query.exam_id);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/scores/statistics - 成绩分布统计
 */
async function statistics(req, res, next) {
  try {
    const data = await scoreService.getStatistics(req.query.exam_id);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/scores/export - 成绩单导出（Excel）
 */
async function exportScores(req, res, next) {
  try {
    const buffer = await scoreService.exportScores(req.query.exam_id, req.query.class_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=scores.xlsx');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/scores/wrong-questions - 错题统计（学生）
 */
async function wrongQuestions(req, res, next) {
  try {
    const data = await scoreService.getWrongQuestions(req.user.userId, req.query.exam_id);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

module.exports = { personal, classScores, statistics, exportScores, wrongQuestions };