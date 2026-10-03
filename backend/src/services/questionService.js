/**
 * 题库管理服务层
 * 题目 CRUD、分页查询、按类型/难度/知识点筛选、批量导入导出
 */
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const { Question, User, PaperQuestion } = require('../models');
const {
  parseQuestionExcel,
  validateQuestionRow,
  buildQuestionExcel,
} = require('../utils/excelHelper');

/**
 * 分页查询题目
 */
async function listQuestions({ page, pageSize, offset, limit, type, difficulty, knowledge_point, keyword }) {
  const where = { deleted_at: null };
  if (type) where.type = type;
  if (difficulty) where.difficulty = parseInt(difficulty, 10);
  if (knowledge_point) where.knowledge_point = { [Op.like]: `%${knowledge_point}%` };
  if (keyword) {
    where[Op.or] = [
      { content: { [Op.like]: `%${keyword}%` } },
      { knowledge_point: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { rows, count } = await Question.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
    include: [{ model: User, as: 'creator', attributes: ['id', 'real_name'] }],
  });
  return {
    list: rows.map(toQuestionInfo),
    total: count,
    page,
    pageSize,
  };
}

/**
 * 获取题目详情
 */
async function getQuestion(id) {
  const q = await Question.findByPk(id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'real_name'] }],
  });
  if (!q || q.deleted_at) throw new BizError(config.codes.NOT_FOUND, '题目不存在');
  return toQuestionInfo(q);
}

/**
 * 新增题目
 */
async function createQuestion(creatorId, data) {
  const q = await Question.create({
    type: data.type,
    content: data.content,
    options: data.options || null,
    answer: data.answer,
    analysis: data.analysis || null,
    difficulty: data.difficulty,
    knowledge_point: data.knowledge_point || null,
    score: data.score,
    creator_id: creatorId,
  });
  return toQuestionInfo(q);
}

/**
 * 修改题目
 */
async function updateQuestion(id, data) {
  const q = await Question.findByPk(id);
  if (!q || q.deleted_at) throw new BizError(config.codes.NOT_FOUND, '题目不存在');
  const updates = {};
  ['type', 'content', 'options', 'answer', 'analysis', 'difficulty', 'knowledge_point', 'score'].forEach(k => {
    if (data[k] !== undefined) updates[k] = data[k];
  });
  await q.update(updates);
  return toQuestionInfo(q);
}

/**
 * 删除题目（软删除）
 * 已被试卷引用时禁止删除
 */
async function deleteQuestion(id) {
  const q = await Question.findByPk(id);
  if (!q || q.deleted_at) throw new BizError(config.codes.NOT_FOUND, '题目不存在');
  // 校验是否被试卷引用
  const refCount = await PaperQuestion.count({ where: { question_id: id } });
  if (refCount > 0) {
    throw new BizError(config.codes.QUESTION_REFERENCED, '题目已被试卷引用，禁止删除');
  }
  await q.update({ deleted_at: new Date() });
  return true;
}

/**
 * 批量导入题目（Excel）
 * @returns {{success_count, fail_count, errors}}
 */
async function importQuestions(creatorId, buffer) {
  const rows = parseQuestionExcel(buffer);
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  for (const item of rows) {
    const errMsg = validateQuestionRow(item.data);
    if (errMsg) {
      failCount++;
      errors.push({ row: item.row, message: errMsg });
      continue;
    }
    try {
      await Question.create({
        type: item.data.type,
        content: item.data.content,
        options: item.data.options,
        answer: item.data.answer,
        analysis: item.data.analysis,
        difficulty: item.data.difficulty,
        knowledge_point: item.data.knowledge_point,
        score: item.data.score,
        creator_id: creatorId,
      });
      successCount++;
    } catch (e) {
      failCount++;
      errors.push({ row: item.row, message: e.message });
    }
  }
  return { success_count: successCount, fail_count: failCount, errors };
}

/**
 * 批量导出题目（Excel Buffer）
 */
async function exportQuestions({ type, difficulty }) {
  const where = { deleted_at: null };
  if (type) where.type = type;
  if (difficulty) where.difficulty = parseInt(difficulty, 10);
  const questions = await Question.findAll({ where, order: [['id', 'ASC']] });
  return buildQuestionExcel(questions.map(q => q.toJSON()));
}

function toQuestionInfo(q) {
  if (!q) return null;
  const obj = q.toJSON();
  return {
    id: obj.id,
    type: obj.type,
    content: obj.content,
    options: obj.options,
    answer: obj.answer,
    analysis: obj.analysis,
    difficulty: obj.difficulty,
    knowledge_point: obj.knowledge_point,
    score: parseFloat(obj.score),
    creator_id: obj.creator_id,
    creator_name: obj.creator?.real_name || null,
    created_at: obj.created_at,
  };
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  exportQuestions,
  toQuestionInfo,
};