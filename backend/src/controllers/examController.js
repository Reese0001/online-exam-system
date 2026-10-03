/**
 * 考试管理 + 在线答题控制器
 */
const examService = require('../services/examService');
const { success, parsePage } = require('../utils/response');

// ============================================================
// 教师端：考试管理
// ============================================================

/**
 * GET /api/exams - 考试列表查询（教师）
 */
async function list(req, res, next) {
  try {
    const pagination = parsePage(req.query);
    const data = await examService.listExams({
      ...pagination,
      status: req.query.status,
      keyword: req.query.keyword,
    });
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/exams/:id - 考试详情
 */
async function detail(req, res, next) {
  try {
    const exam = await examService.getExam(req.params.id);
    success(res, exam);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams - 创建考试
 */
async function create(req, res, next) {
  try {
    const exam = await examService.createExam(req.user.userId, req.body);
    success(res, exam, '创建成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/exams/:id - 修改考试
 */
async function update(req, res, next) {
  try {
    const exam = await examService.updateExam(req.params.id, req.body);
    success(res, exam, '修改成功');
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/exams/:id - 删除考试
 */
async function remove(req, res, next) {
  try {
    await examService.deleteExam(req.params.id);
    success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams/:id/publish - 发布考试
 */
async function publish(req, res, next) {
  try {
    await examService.publishExam(req.params.id);
    success(res, null, '发布成功');
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/exams/:id/status - 考试状态管理
 */
async function updateStatus(req, res, next) {
  try {
    await examService.updateExamStatus(req.params.id, req.body.status);
    success(res, null, '状态更新成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams/:id/classes - 指定参考班级
 */
async function setClasses(req, res, next) {
  try {
    await examService.setExamClasses(req.params.id, req.body.class_ids);
    success(res, null, '设置参考班级成功');
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/exams/:id/students - 查询考试参考学生列表
 */
async function students(req, res, next) {
  try {
    const list = await examService.listExamStudents(req.params.id);
    success(res, list);
  } catch (e) {
    next(e);
  }
}

// ============================================================
// 学生端：在线答题
// ============================================================

/**
 * GET /api/exams/student/list - 学生考试列表
 */
async function studentList(req, res, next) {
  try {
    const list = await examService.listStudentExams(req.user.userId);
    success(res, list);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/exams/:id/start - 进入考试
 */
async function start(req, res, next) {
  try {
    const data = await examService.startExam(req.params.id, req.user.userId);
    success(res, data);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams/:id/answers - 答案暂存
 */
async function saveAnswer(req, res, next) {
  try {
    await examService.saveAnswer(req.params.id, req.user.userId, req.body);
    success(res, null, '保存成功');
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/exams/:id/submit - 交卷
 */
async function submit(req, res, next) {
  try {
    const data = await examService.submitExam(req.params.id, req.user.userId);
    success(res, data, '交卷成功');
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/exams/:id/record - 查看答题记录
 */
async function record(req, res, next) {
  try {
    const data = await examService.getExamRecord(req.params.id, req.user.userId);
    success(res, data);
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
  publish,
  updateStatus,
  setClasses,
  students,
  studentList,
  start,
  saveAnswer,
  submit,
  record,
};