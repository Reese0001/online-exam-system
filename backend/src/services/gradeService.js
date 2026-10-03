/**
 * 阅卷服务层
 * 客观题自动阅卷、主观题手动阅卷、阅卷任务、阅卷进度、复核改分
 */
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const {
  GradeTask,
  ExamRecord,
  Answer,
  Question,
  Exam,
  User,
  PaperQuestion,
} = require('../models');
const { sequelize } = require('../config/database');

// 客观题类型（自动阅卷）
const OBJECTIVE_TYPES = ['single', 'multiple', 'judge', 'fill'];
// 主观题类型（手动阅卷）
const SUBJECTIVE_TYPES = ['short'];

/**
 * 自动阅卷单条考试记录
 * 比对学生答案与标准答案，计算客观题得分
 * @returns {{objective_score, has_subjective}}
 */
async function autoGradeRecord(recordId) {
  const record = await ExamRecord.findByPk(recordId);
  if (!record) throw new BizError(config.codes.NOT_FOUND, '考试记录不存在');

  // 获取该考试试卷的所有题目分值
  const exam = await Exam.findByPk(record.exam_id);
  const pqs = await PaperQuestion.findAll({
    where: { paper_id: exam.paper_id },
    include: [{ model: Question, as: 'question' }],
  });
  const pqMap = new Map(pqs.map(pq => [pq.question_id, pq]));

  // 获取所有答案
  const answers = await Answer.findAll({ where: { exam_record_id: recordId } });
  let objectiveScore = 0;
  let hasSubjective = false;

  const t = await sequelize.transaction();
  try {
    for (const ans of answers) {
      const pq = pqMap.get(ans.question_id);
      if (!pq || !pq.question) continue;
      const question = pq.question;
      const fullScore = parseFloat(pq.score);

      if (OBJECTIVE_TYPES.includes(question.type)) {
        // 客观题自动评分
        const isCorrect = compareAnswer(question.type, ans.student_answer, question.answer);
        const score = isCorrect ? fullScore : 0;
        await ans.update(
          {
            score,
            is_correct: isCorrect ? 1 : 0,
            graded_by: null, // null 表示系统自动阅卷
            graded_at: new Date(),
          },
          { transaction: t }
        );
        objectiveScore += score;
      } else if (SUBJECTIVE_TYPES.includes(question.type)) {
        hasSubjective = true;
      }
    }

    // 若无主观题，直接汇总成绩并标记 graded
    if (!hasSubjective) {
      await record.update({ total_score: objectiveScore, status: 'graded' }, { transaction: t });
    } else {
      // 生成阅卷任务（若不存在）
      const existingTask = await GradeTask.findOne({
        where: { exam_id: record.exam_id },
        transaction: t,
      });
      if (!existingTask) {
        // 统计该考试的总答卷数（已交卷）
        const totalCount = await ExamRecord.count({
          where: { exam_id: record.exam_id, status: { [Op.in]: ['submitted', 'graded'] } },
          transaction: t,
        });
        await GradeTask.create(
          {
            exam_id: record.exam_id,
            teacher_id: exam.creator_id,
            status: 'pending',
            total_count: totalCount,
            graded_count: 0,
          },
          { transaction: t }
        );
      }
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  return { objective_score: objectiveScore, has_subjective: hasSubjective };
}

/**
 * 比对学生答案与标准答案
 * @param {string} type - 题型
 * @param {string} studentAnswer - 学生答案
 * @param {string} standardAnswer - 标准答案
 * @returns {boolean}
 */
function compareAnswer(type, studentAnswer, standardAnswer) {
  if (studentAnswer === null || studentAnswer === undefined) return false;
  const sa = String(studentAnswer).trim();
  const sb = String(standardAnswer).trim();
  switch (type) {
    case 'single':
    case 'judge':
      // 完全匹配
      return sa === sb;
    case 'multiple':
      // 集合相等（逗号分隔，忽略顺序）
      return setsEqual(sa, sb);
    case 'fill':
      // 多空匹配（||分隔），去空格
      return fillEqual(sa, sb);
    default:
      return false;
  }
}

function setsEqual(a, b) {
  const setA = new Set(a.split(',').map(s => s.trim()).filter(Boolean));
  const setB = new Set(b.split(',').map(s => s.trim()).filter(Boolean));
  if (setA.size !== setB.size) return false;
  for (const v of setA) if (!setB.has(v)) return false;
  return true;
}

function fillEqual(a, b) {
  // 多空以 || 分隔
  const arrA = a.split('||').map(s => s.trim());
  const arrB = b.split('||').map(s => s.trim());
  if (arrA.length !== arrB.length) return false;
  return arrA.every((v, i) => v === arrB[i]);
}

/**
 * 触发整场考试自动阅卷（教师/系统）
 */
async function autoGradeExam(examId) {
  const exam = await Exam.findByPk(examId);
  if (!exam || exam.deleted_at) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  // 查询所有已交卷但未阅卷的记录
  const records = await ExamRecord.findAll({
    where: { exam_id: examId, status: 'submitted' },
  });
  let gradedCount = 0;
  for (const r of records) {
    await autoGradeRecord(r.id);
    gradedCount++;
  }
  return { graded_count: gradedCount };
}

/**
 * 阅卷任务列表（教师）
 */
async function listGradeTasks({ page, pageSize, offset, limit, status, teacherId }) {
  const where = {};
  if (status) where.status = status;
  if (teacherId) where.teacher_id = teacherId;
  const { rows, count } = await GradeTask.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
    include: [
      { model: Exam, as: 'exam', attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'real_name'] },
    ],
  });
  const list = rows.map(t => toGradeTaskInfo(t));
  return { list, total: count, page, pageSize };
}

/**
 * 阅卷任务详情（含待阅卷学生答卷列表，主观题）
 */
async function getGradeTask(id) {
  const task = await GradeTask.findByPk(id, {
    include: [
      { model: Exam, as: 'exam', attributes: ['id', 'name'] },
      { model: User, as: 'teacher', attributes: ['id', 'real_name'] },
    ],
  });
  if (!task) throw new BizError(config.codes.GRADE_TASK_NOT_FOUND, '阅卷任务不存在');

  // 查询该考试所有已交卷的考试记录
  const records = await ExamRecord.findAll({
    where: { exam_id: task.exam_id, status: { [Op.in]: ['submitted', 'graded'] } },
    include: [{ model: User, as: 'student', attributes: ['id', 'real_name'] }],
  });
  // 查询每条记录的主观题答案
  const resultList = [];
  for (const r of records) {
    const answers = await Answer.findAll({
      where: { exam_record_id: r.id },
      include: [{ model: Question, as: 'question', attributes: ['id', 'type', 'content', 'answer', 'analysis'] }],
    });
    // 仅返回主观题
    const subjectiveAnswers = answers
      .filter(a => SUBJECTIVE_TYPES.includes(a.question?.type))
      .map(a => ({
        id: a.id,
        question_id: a.question_id,
        question_content: a.question?.content,
        question_type: a.question?.type,
        student_answer: a.student_answer,
        correct_answer: a.question?.answer,
        score: a.score !== null ? parseFloat(a.score) : null,
        is_correct: a.is_correct === null ? null : a.is_correct === 1,
        analysis: a.question?.analysis,
        comment: a.comment,
      }));
    resultList.push({
      exam_record_id: r.id,
      student_name: r.student?.real_name,
      answers: subjectiveAnswers,
    });
  }
  return { task: toGradeTaskInfo(task), records: resultList };
}

/**
 * 手动评分（教师）
 * 对主观题逐题评分并可填写评语
 */
async function gradeAnswers(teacherId, { exam_record_id, answers }) {
  const record = await ExamRecord.findByPk(exam_record_id);
  if (!record) throw new BizError(config.codes.NOT_FOUND, '考试记录不存在');
  const t = await sequelize.transaction();
  try {
    for (const item of answers) {
      const ans = await Answer.findByPk(item.answer_id, { transaction: t });
      if (!ans || ans.exam_record_id !== exam_record_id) {
        throw new BizError(config.codes.NOT_FOUND, `答题记录ID=${item.answer_id}不存在`);
      }
      await ans.update(
        {
          score: item.score,
          is_correct: item.score > 0 ? 1 : 0,
          comment: item.comment || null,
          graded_by: teacherId,
          graded_at: new Date(),
        },
        { transaction: t }
      );
    }
    // 汇总该记录总成绩
    const allAnswers = await Answer.findAll({ where: { exam_record_id }, transaction: t });
    const totalScore = allAnswers.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0);
    const allGraded = allAnswers.every(a => a.score !== null && a.score !== undefined);
    if (allGraded) {
      await record.update({ total_score: totalScore, status: 'graded' }, { transaction: t });
    }
    // 更新阅卷任务进度
    const task = await GradeTask.findOne({ where: { exam_id: record.exam_id }, transaction: t });
    if (task) {
      const gradedCount = await ExamRecord.count({
        where: { exam_id: record.exam_id, status: 'graded' },
        transaction: t,
      });
      const totalCount = await ExamRecord.count({
        where: { exam_id: record.exam_id, status: { [Op.in]: ['submitted', 'graded'] } },
        transaction: t,
      });
      const newStatus = gradedCount >= totalCount ? 'finished' : 'ongoing';
      await task.update({ graded_count: gradedCount, total_count: totalCount, status: newStatus }, { transaction: t });
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return true;
}

/**
 * 阅卷进度查看
 */
async function getGradeProgress(examId) {
  const totalCount = await ExamRecord.count({
    where: { exam_id: examId, status: { [Op.in]: ['submitted', 'graded'] } },
  });
  const gradedCount = await ExamRecord.count({
    where: { exam_id: examId, status: 'graded' },
  });
  const progress = totalCount > 0 ? Math.round((gradedCount / totalCount) * 10000) / 100 : 0;
  return { total_count: totalCount, graded_count: gradedCount, progress };
}

function toGradeTaskInfo(task) {
  if (!task) return null;
  const obj = task.toJSON();
  const progress = obj.total_count > 0 ? Math.round((obj.graded_count / obj.total_count) * 10000) / 100 : 0;
  return {
    id: obj.id,
    exam_id: obj.exam_id,
    exam_name: obj.exam?.name || null,
    teacher_id: obj.teacher_id,
    teacher_name: obj.teacher?.real_name || null,
    status: obj.status,
    total_count: obj.total_count,
    graded_count: obj.graded_count,
    progress,
    created_at: obj.created_at,
  };
}

module.exports = {
  autoGradeRecord,
  autoGradeExam,
  listGradeTasks,
  getGradeTask,
  gradeAnswers,
  getGradeProgress,
  toGradeTaskInfo,
  OBJECTIVE_TYPES,
  SUBJECTIVE_TYPES,
};