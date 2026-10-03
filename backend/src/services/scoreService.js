/**
 * 成绩统计服务层
 * 个人成绩、班级成绩、分布统计、导出、错题统计
 */
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const {
  ExamRecord,
  Answer,
  Question,
  Exam,
  Class,
  User,
  Paper,
  PaperQuestion,
} = require('../models');
const { buildScoreExcel } = require('../utils/excelHelper');

/**
 * 个人成绩查询（学生）
 */
async function getPersonalScores(studentId) {
  const records = await ExamRecord.findAll({
    where: { student_id: studentId, status: 'graded' },
    include: [
      {
        model: Exam,
        as: 'exam',
        attributes: ['id', 'name', 'paper_id'],
        include: [{ model: Paper, as: 'paper', attributes: ['pass_score'] }],
      },
    ],
    order: [['submit_time', 'DESC']],
  });
  return records.map(r => ({
    exam_id: r.exam_id,
    exam_name: r.exam?.name,
    total_score: r.total_score !== null ? parseFloat(r.total_score) : null,
    pass_score: parseFloat(r.exam?.paper?.pass_score || 0),
    is_pass: r.total_score !== null && parseFloat(r.total_score) >= parseFloat(r.exam?.paper?.pass_score || 0),
    submit_time: r.submit_time,
  }));
}

/**
 * 班级成绩查看（教师）
 */
async function getClassScores(classId, examId) {
  const cls = await Class.findByPk(classId);
  if (!cls) throw new BizError(config.codes.NOT_FOUND, '班级不存在');
  const exam = await Exam.findByPk(examId);
  if (!exam) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  // 查询班级学生
  const students = await User.findAll({
    where: { class_id: classId, role: 'student' },
    order: [['id', 'ASC']],
  });
  const result = [];
  for (const s of students) {
    const record = await ExamRecord.findOne({
      where: { exam_id: examId, student_id: s.id },
    });
    result.push({
      student_id: s.id,
      student_name: s.real_name,
      username: s.username,
      total_score: record?.total_score !== null && record?.total_score !== undefined ? parseFloat(record.total_score) : null,
      is_pass: record?.total_score !== null && record?.total_score !== undefined
        ? parseFloat(record.total_score) >= parseFloat(exam.paper?.pass_score || 0)
        : false,
      submit_time: record?.submit_time || null,
    });
  }
  return result;
}

/**
 * 成绩分布统计与分析指标
 */
async function getStatistics(examId) {
  const exam = await Exam.findByPk(examId, {
    include: [{ model: Paper, as: 'paper', attributes: ['pass_score'] }],
  });
  if (!exam) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  const records = await ExamRecord.findAll({
    where: { exam_id: examId, status: 'graded' },
    attributes: ['total_score'],
  });
  const scores = records.map(r => parseFloat(r.total_score || 0));
  if (scores.length === 0) {
    return {
      max_score: 0,
      min_score: 0,
      avg_score: 0,
      pass_rate: 0,
      std_deviation: 0,
      distribution: [
        { range: '0-59', count: 0 },
        { range: '60-69', count: 0 },
        { range: '70-79', count: 0 },
        { range: '80-89', count: 0 },
        { range: '90-100', count: 0 },
      ],
    };
  }
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avgScore = sum / scores.length;
  const passScore = parseFloat(exam.paper?.pass_score || 60);
  const passCount = scores.filter(s => s >= passScore).length;
  const passRate = Math.round((passCount / scores.length) * 10000) / 100;
  // 标准差
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / scores.length;
  const stdDeviation = Math.sqrt(variance);

  // 分数段分布
  const distribution = [
    { range: '0-59', count: 0 },
    { range: '60-69', count: 0 },
    { range: '70-79', count: 0 },
    { range: '80-89', count: 0 },
    { range: '90-100', count: 0 },
  ];
  for (const s of scores) {
    if (s < 60) distribution[0].count++;
    else if (s < 70) distribution[1].count++;
    else if (s < 80) distribution[2].count++;
    else if (s < 90) distribution[3].count++;
    else distribution[4].count++;
  }

  return {
    max_score: Math.round(maxScore * 10) / 10,
    min_score: Math.round(minScore * 10) / 10,
    avg_score: Math.round(avgScore * 100) / 100,
    pass_rate: passRate,
    std_deviation: Math.round(stdDeviation * 100) / 100,
    distribution,
  };
}

/**
 * 成绩单导出（Excel Buffer）
 */
async function exportScores(examId, classId) {
  const exam = await Exam.findByPk(examId);
  if (!exam) throw new BizError(config.codes.NOT_FOUND, '考试不存在');
  // 查询参考学生
  let students;
  if (classId) {
    students = await User.findAll({
      where: { class_id: classId, role: 'student' },
      include: [{ model: Class, as: 'class', attributes: ['name'] }],
      order: [['id', 'ASC']],
    });
  } else {
    // 查询该考试所有参考班级的学生
    const { ExamClass } = require('../models');
    const ecs = await ExamClass.findAll({ where: { exam_id: examId }, attributes: ['class_id'] });
    const classIds = ecs.map(ec => ec.class_id);
    students = classIds.length
      ? await User.findAll({
          where: { class_id: { [Op.in]: classIds }, role: 'student' },
          include: [{ model: Class, as: 'class', attributes: ['name'] }],
          order: [['id', 'ASC']],
        })
      : [];
  }
  const records = [];
  for (const s of students) {
    const record = await ExamRecord.findOne({ where: { exam_id: examId, student_id: s.id } });
    records.push({
      username: s.username,
      student_name: s.real_name,
      class_name: s.class?.name || '',
      total_score: record?.total_score !== null && record?.total_score !== undefined ? parseFloat(record.total_score) : null,
      is_pass: record?.total_score !== null && record?.total_score !== undefined
        ? parseFloat(record.total_score) >= parseFloat(exam.paper?.pass_score || 60)
        : false,
      submit_time: record?.submit_time ? new Date(record.submit_time).toLocaleString('zh-CN') : '',
    });
  }
  return buildScoreExcel(records, exam.name);
}

/**
 * 错题统计（学生）
 */
async function getWrongQuestions(studentId, examId) {
  const where = { student_id: studentId, status: 'graded' };
  if (examId) where.exam_id = examId;
  const records = await ExamRecord.findAll({
    where,
    include: [{ model: Exam, as: 'exam', attributes: ['id', 'name'] }],
  });
  const result = [];
  for (const r of records) {
    const answers = await Answer.findAll({
      where: { exam_record_id: r.id, is_correct: 0 },
      include: [{ model: Question, as: 'question', attributes: ['id', 'content', 'answer', 'analysis'] }],
    });
    for (const a of answers) {
      result.push({
        exam_id: r.exam_id,
        exam_name: r.exam?.name,
        question_id: a.question_id,
        content: a.question?.content,
        student_answer: a.student_answer,
        correct_answer: a.question?.answer,
        analysis: a.question?.analysis,
      });
    }
  }
  return result;
}

module.exports = {
  getPersonalScores,
  getClassScores,
  getStatistics,
  exportScores,
  getWrongQuestions,
};