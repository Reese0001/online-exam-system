/**
 * 考试管理 + 在线答题服务层
 * 考试 CRUD、发布、状态管理、指定班级
 * 学生：考试列表、进入考试、暂存答案、交卷、查看记录
 */
const { Op, literal } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const {
  Exam,
  ExamClass,
  ExamRecord,
  Answer,
  Paper,
  PaperQuestion,
  Question,
  Class,
  User,
} = require('../models');
const { sequelize } = require('../config/database');
const { toPaperInfo } = require('./paperService');
const gradeService = require('./gradeService');

// ============================================================
// 教师端：考试管理
// ============================================================

/**
 * 分页查询考试（教师）
 */
async function listExams({ page, pageSize, offset, limit, status, keyword }) {
  const where = { deleted_at: null };
  if (status) where.status = status;
  if (keyword) where.name = { [Op.like]: `%${keyword}%` };
  const { rows, count } = await Exam.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
    include: [
      { model: Paper, as: 'paper', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'real_name'] },
    ],
  });
  const list = await Promise.all(rows.map(async e => {
    const examClasses = await ExamClass.findAll({
      where: { exam_id: e.id },
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
    });
    let studentCount = 0;
    for (const ec of examClasses) {
      studentCount += await User.count({ where: { class_id: ec.class_id, role: 'student' } });
    }
    return toExamInfo(e, examClasses.length, studentCount);
  }));
  return { list, total: count, page, pageSize };
}

/**
 * 获取考试详情
 */
async function getExam(id) {
  const exam = await Exam.findByPk(id, {
    include: [
      { model: Paper, as: 'paper', include: [{ model: User, as: 'creator', attributes: ['id', 'real_name'] }] },
      { model: User, as: 'creator', attributes: ['id', 'real_name'] },
    ],
  });
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  const examClasses = await ExamClass.findAll({
    where: { exam_id: id },
    include: [{ model: Class, as: 'class' }],
  });
  // 获取试卷题目
  const paperQuestions = await PaperQuestion.findAll({
    where: { paper_id: exam.paper_id },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    include: [{ model: Question, as: 'question' }],
  });
  const paperDetail = {
    ...toPaperInfo(exam.paper, paperQuestions.length),
    questions: paperQuestions.map(pq => ({
      id: pq.id,
      question_id: pq.question_id,
      type: pq.question?.type,
      content: pq.question?.content,
      options: pq.question?.options,
      score: parseFloat(pq.score),
      sort_order: pq.sort_order,
    })),
  };
  return {
    ...toExamInfo(exam, examClasses.length, 0),
    classes: examClasses.map(ec => ({
      id: ec.class?.id,
      name: ec.class?.name,
      grade: ec.class?.grade,
      department: ec.class?.department,
    })),
    paper: paperDetail,
  };
}

/**
 * 创建考试
 */
async function createExam(creatorId, data) {
  const paper = await Paper.findByPk(data.paper_id);
  if (!paper || paper.deleted_at) throw new BizError(config.codes.NOT_FOUND, '试卷不存在');
  if (new Date(data.start_time) >= new Date(data.end_time)) {
    throw new BizError(config.codes.BAD_REQUEST, '开始时间必须早于结束时间');
  }
  const t = await sequelize.transaction();
  try {
    const exam = await Exam.create(
      {
        paper_id: data.paper_id,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status || 'draft',
        creator_id: creatorId,
      },
      { transaction: t }
    );
    // 若指定班级，写入 exam_classes
    if (Array.isArray(data.class_ids) && data.class_ids.length) {
      const rows = data.class_ids.map(cid => ({ exam_id: exam.id, class_id: cid }));
      await ExamClass.bulkCreate(rows, { transaction: t });
    }
    await t.commit();
    return toExamInfo(exam, data.class_ids?.length || 0, 0);
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

/**
 * 修改考试（开始前可改）
 */
async function updateExam(id, data) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  if (exam.status === 'ongoing') {
    throw new BizError(config.codes.EXAM_ONGOING, '考试进行中，不允许修改');
  }
  const updates = {};
  if (data.paper_id !== undefined) updates.paper_id = data.paper_id;
  if (data.name !== undefined) updates.name = data.name;
  if (data.start_time !== undefined) updates.start_time = data.start_time;
  if (data.end_time !== undefined) updates.end_time = data.end_time;
  if (data.status !== undefined) updates.status = data.status;
  if (updates.start_time && updates.end_time && new Date(updates.start_time) >= new Date(updates.end_time)) {
    throw new BizError(config.codes.BAD_REQUEST, '开始时间必须早于结束时间');
  }
  await exam.update(updates);
  return toExamInfo(exam);
}

/**
 * 删除考试（进行中不允许）
 */
async function deleteExam(id) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  if (exam.status === 'ongoing') {
    throw new BizError(config.codes.EXAM_ONGOING, '考试进行中，不允许删除');
  }
  const t = await sequelize.transaction();
  try {
    await ExamClass.destroy({ where: { exam_id: id }, transaction: t });
    await exam.update({ deleted_at: new Date() }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return true;
}

/**
 * 发布考试
 */
async function publishExam(id) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  if (exam.status !== 'draft') {
    throw new BizError(config.codes.BAD_REQUEST, '仅草稿状态可发布');
  }
  await exam.update({ status: 'published' });
  return true;
}

/**
 * 考试状态管理
 */
async function updateExamStatus(id, status) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  await exam.update({ status });
  return true;
}

/**
 * 指定参考班级（覆盖式）
 */
async function setExamClasses(id, classIds) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  const t = await sequelize.transaction();
  try {
    await ExamClass.destroy({ where: { exam_id: id }, transaction: t });
    if (classIds.length) {
      const rows = classIds.map(cid => ({ exam_id: id, class_id: cid }));
      await ExamClass.bulkCreate(rows, { transaction: t });
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return true;
}

/**
 * 查询考试参考学生列表
 */
async function listExamStudents(id) {
  const exam = await Exam.findByPk(id);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  const examClasses = await ExamClass.findAll({ where: { exam_id: id }, attributes: ['class_id'] });
  const classIds = examClasses.map(ec => ec.class_id);
  if (!classIds.length) return [];
  const students = await User.findAll({
    where: { class_id: { [Op.in]: classIds }, role: 'student' },
    order: [['id', 'ASC']],
  });
  return students.map(u => ({
    id: u.id,
    username: u.username,
    real_name: u.real_name,
    role: u.role,
    email: u.email,
    phone: u.phone,
    class_id: u.class_id,
    status: u.status,
  }));
}

// ============================================================
// 学生端：在线答题
// ============================================================

/**
 * 学生考试列表
 */
async function listStudentExams(studentId) {
  // 查询学生所属班级
  const student = await User.findByPk(studentId);
  if (!student) throw new BizError(config.codes.NOT_FOUND, '学生不存在');
  if (student.role !== 'student') throw new BizError(config.codes.FORBIDDEN, '仅学生可查看考试列表');
  // 查询学生所在班级的考试
  let examIds = [];
  if (student.class_id) {
    const ecs = await ExamClass.findAll({ where: { class_id: student.class_id }, attributes: ['exam_id'] });
    examIds = ecs.map(ec => ec.exam_id);
  }
  if (!examIds.length) return [];
  const exams = await Exam.findAll({
    where: { id: { [Op.in]: examIds }, deleted_at: null, status: { [Op.in]: ['published', 'ongoing', 'finished'] } },
    include: [{ model: Paper, as: 'paper', attributes: ['id', 'name', 'pass_score'] }],
    order: [['start_time', 'ASC']],
  });
  // 查询每场考试的考试记录
  const result = [];
  for (const e of exams) {
    const record = await ExamRecord.findOne({ where: { exam_id: e.id, student_id: studentId } });
    result.push({
      exam_id: e.id,
      name: e.name,
      status: e.status,
      start_time: e.start_time,
      end_time: e.end_time,
      pass_score: parseFloat(e.paper?.pass_score || 0),
      record_status: record?.status || 'not_started',
      total_score: record?.total_score !== null && record?.total_score !== undefined ? parseFloat(record.total_score) : null,
    });
  }
  return result;
}

/**
 * 进入考试（学生）
 * 校验身份与时间窗口，创建/复用考试记录，返回试卷题目
 */
async function startExam(examId, studentId) {
  const exam = await Exam.findByPk(examId, {
    include: [{ model: Paper, as: 'paper' }],
  });
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');

  // 校验学生是否在参考班级
  const student = await User.findByPk(studentId);
  if (!student || student.role !== 'student') throw new BizError(config.codes.FORBIDDEN, '仅学生可参加考试');
  if (student.class_id) {
    const inClass = await ExamClass.findOne({ where: { exam_id: examId, class_id: student.class_id } });
    if (!inClass) throw new BizError(config.codes.FORBIDDEN, '您不在此考试的参考范围内');
  }

  // 校验考试状态与时间窗口
  const now = new Date();
  if (exam.status === 'draft') throw new BizError(config.codes.EXAM_NOT_IN_WINDOW, '考试尚未发布');
  if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
    throw new BizError(config.codes.EXAM_NOT_IN_WINDOW, '考试未在时间窗口内');
  }

  // 创建/复用考试记录
  let record = await ExamRecord.findOne({ where: { exam_id: examId, student_id: studentId } });
  if (record && record.status === 'submitted') {
    throw new BizError(config.codes.EXAM_ALREADY_SUBMITTED, '已交卷，不可重复进入');
  }
  if (!record) {
    record = await ExamRecord.create({
      exam_id: examId,
      student_id: studentId,
      start_time: now,
      status: 'ongoing',
    });
  } else if (record.status === 'not_started') {
    await record.update({ start_time: now, status: 'ongoing' });
  }

  // 获取试卷题目
  const paperQuestions = await PaperQuestion.findAll({
    where: { paper_id: exam.paper_id },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    include: [{ model: Question, as: 'question' }],
  });
  // 乱序处理
  let orderedPQ = paperQuestions;
  if (exam.paper?.is_random_order === 1 || exam.paper?.is_random_order === true) {
    orderedPQ = [...paperQuestions].sort(() => Math.random() - 0.5);
  }
  const paperDetail = {
    ...toPaperInfo(exam.paper, paperQuestions.length),
    questions: orderedPQ.map(pq => ({
      id: pq.id,
      question_id: pq.question_id,
      type: pq.question?.type,
      content: pq.question?.content,
      options: pq.question?.options,
      score: parseFloat(pq.score),
      sort_order: pq.sort_order,
    })),
  };

  // 计算剩余秒数
  const remainSeconds = Math.max(0, Math.floor((new Date(exam.end_time).getTime() - now.getTime()) / 1000));

  return {
    exam_record_id: record.id,
    paper: paperDetail,
    remain_seconds: remainSeconds,
  };
}

/**
 * 答案暂存（学生）
 * upsert 到 answers 表
 */
async function saveAnswer(examId, studentId, { question_id, student_answer }) {
  // 查找考试记录
  const record = await ExamRecord.findOne({ where: { exam_id: examId, student_id: studentId } });
  if (!record) throw new BizError(config.codes.NOT_FOUND, '考试记录不存在，请先进入考试');
  if (record.status !== 'ongoing') {
    throw new BizError(config.codes.EXAM_ALREADY_SUBMITTED, '已交卷，不可再保存答案');
  }
  // upsert 答案
  const existing = await Answer.findOne({
    where: { exam_record_id: record.id, question_id },
  });
  if (existing) {
    await existing.update({ student_answer });
  } else {
    await Answer.create({
      exam_record_id: record.id,
      question_id,
      student_answer,
    });
  }
  return true;
}

/**
 * 交卷（学生）
 * 触发客观题自动阅卷
 */
async function submitExam(examId, studentId) {
  const record = await ExamRecord.findOne({ where: { exam_id: examId, student_id: studentId } });
  if (!record) throw new BizError(config.codes.NOT_FOUND, '考试记录不存在');
  if (record.status === 'submitted' || record.status === 'graded') {
    throw new BizError(config.codes.EXAM_ALREADY_SUBMITTED, '已交卷，不可重复提交');
  }
  // 更新交卷状态
  await record.update({ submit_time: new Date(), status: 'submitted' });
  // 触发客观题自动阅卷
  const gradeResult = await gradeService.autoGradeRecord(record.id);
  return {
    exam_record_id: record.id,
    objective_score: gradeResult.objective_score,
    has_subjective: gradeResult.has_subjective,
  };
}

/**
 * 查看答题记录（学生）
 */
async function getExamRecord(examId, studentId) {
  const record = await ExamRecord.findOne({
    where: { exam_id: examId, student_id: studentId },
    include: [{ model: Exam, as: 'exam', attributes: ['id', 'name'] }],
  });
  if (!record) throw new BizError(config.codes.NOT_FOUND, '考试记录不存在');
  // 查询答案
  const answers = await Answer.findAll({
    where: { exam_record_id: record.id },
    include: [{ model: Question, as: 'question', attributes: ['id', 'type', 'content', 'answer', 'analysis'] }],
  });
  // 阅卷完成后才返回标准答案
  const isGraded = record.status === 'graded';
  const answerList = answers.map(a => ({
    id: a.id,
    question_id: a.question_id,
    question_content: a.question?.content,
    question_type: a.question?.type,
    student_answer: a.student_answer,
    correct_answer: isGraded ? a.question?.answer : null,
    score: a.score !== null ? parseFloat(a.score) : null,
    full_score: null, // 由调用方补充
    is_correct: a.is_correct === null ? null : a.is_correct === 1,
    analysis: isGraded ? a.question?.analysis : null,
    comment: a.comment,
  }));
  // 补充 full_score（从 paper_questions 获取）
  const exam = await Exam.findByPk(examId);
  const pqs = await PaperQuestion.findAll({
    where: { paper_id: exam.paper_id },
    attributes: ['question_id', 'score'],
  });
  const scoreMap = new Map(pqs.map(pq => [pq.question_id, parseFloat(pq.score)]));
  answerList.forEach(a => { a.full_score = scoreMap.get(a.question_id) || 0; });

  return {
    exam_record_id: record.id,
    exam_name: record.exam?.name,
    status: record.status,
    total_score: record.total_score !== null ? parseFloat(record.total_score) : null,
    start_time: record.start_time,
    submit_time: record.submit_time,
    answers: answerList,
  };
}

function toExamInfo(exam, classCount, studentCount) {
  if (!exam) return null;
  const obj = exam.toJSON();
  return {
    id: obj.id,
    paper_id: obj.paper_id,
    paper_name: obj.paper?.name || null,
    name: obj.name,
    start_time: obj.start_time,
    end_time: obj.end_time,
    status: obj.status,
    creator_id: obj.creator_id,
    creator_name: obj.creator?.real_name || null,
    class_count: classCount || 0,
    student_count: studentCount || 0,
    created_at: obj.created_at,
  };
}

module.exports = {
  // 教师端
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  updateExamStatus,
  setExamClasses,
  listExamStudents,
  // 学生端
  listStudentExams,
  startExam,
  saveAnswer,
  submitExam,
  getExamRecord,
  toExamInfo,
};