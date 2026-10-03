/**
 * 试卷管理服务层
 * 试卷 CRUD、添加/移除题目、随机组卷、试卷预览
 */
const { Op } = require('sequelize');
const config = require('../config/config');
const { BizError } = require('../middlewares/errorHandler');
const { Paper, PaperQuestion, Question, Exam, User } = require('../models');
const { sequelize } = require('../config/database');
const { toQuestionInfo } = require('./questionService');

/**
 * 分页查询试卷
 */
async function listPapers({ page, pageSize, offset, limit, keyword, status }) {
  const where = { deleted_at: null };
  if (status) where.status = status;
  if (keyword) where.name = { [Op.like]: `%${keyword}%` };
  const { rows, count } = await Paper.findAndCountAll({
    where,
    offset,
    limit,
    order: [['id', 'DESC']],
    include: [{ model: User, as: 'creator', attributes: ['id', 'real_name'] }],
  });
  const list = await Promise.all(
    rows.map(async p => {
      const question_count = await PaperQuestion.count({ where: { paper_id: p.id } });
      return toPaperInfo(p, question_count);
    })
  );
  return { list, total: count, page, pageSize };
}

/**
 * 获取试卷详情（含题目列表）
 */
async function getPaper(id) {
  const paper = await Paper.findByPk(id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'real_name'] }],
  });
  if (!paper || paper.deleted_at) throw new BizError(config.codes.NOT_FOUND, '试卷不存在');
  const paperQuestions = await PaperQuestion.findAll({
    where: { paper_id: id },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    include: [{ model: Question, as: 'question' }],
  });
  const question_count = paperQuestions.length;
  const questions = paperQuestions.map(pq => ({
    id: pq.id,
    question_id: pq.question_id,
    type: pq.question?.type,
    content: pq.question?.content,
    options: pq.question?.options,
    score: parseFloat(pq.score),
    sort_order: pq.sort_order,
  }));
  return { ...toPaperInfo(paper, question_count), questions };
}

/**
 * 创建试卷
 */
async function createPaper(creatorId, data) {
  const paper = await Paper.create({
    name: data.name,
    description: data.description || null,
    total_score: data.total_score,
    duration: data.duration,
    pass_score: data.pass_score,
    is_random_order: data.is_random_order ? 1 : 0,
    creator_id: creatorId,
    status: data.status || 'draft',
  });
  return toPaperInfo(paper, 0);
}

/**
 * 修改试卷
 */
async function updatePaper(id, data) {
  const paper = await Paper.findByPk(id);
  if (!paper || paper.deleted_at) throw new BizError(config.codes.NOT_FOUND, '试卷不存在');
  const updates = {};
  ['name', 'description', 'total_score', 'duration', 'pass_score', 'status'].forEach(k => {
    if (data[k] !== undefined) updates[k] = data[k];
  });
  if (data.is_random_order !== undefined) updates.is_random_order = data.is_random_order ? 1 : 0;
  await paper.update(updates);
  return toPaperInfo(paper);
}

/**
 * 删除试卷（软删除）
 * 已被考试引用时禁止删除
 */
async function deletePaper(id) {
  const paper = await Paper.findByPk(id);
  if (!paper || paper.deleted_at) throw new BizError(config.codes.NOT_FOUND, '试卷不存在');
  const refCount = await Exam.count({ where: { paper_id: id, deleted_at: null } });
  if (refCount > 0) {
    throw new BizError(config.codes.PAPER_REFERENCED, '试卷已被考试引用，禁止删除');
  }
  const t = await sequelize.transaction();
  try {
    // 删除关联的 paper_questions
    await PaperQuestion.destroy({ where: { paper_id: id }, transaction: t });
    await paper.update({ deleted_at: new Date() }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return true;
}

/**
 * 添加题目到试卷
 */
async function addQuestions(paperId, questions) {
  const paper = await Paper.findByPk(paperId);
  if (!paper || paper.deleted_at) throw new BizError(config.codes.NOT_FOUND, '试卷不存在');
  const t = await sequelize.transaction();
  try {
    for (const q of questions) {
      // 校验题目存在
      const question = await Question.findByPk(q.question_id);
      if (!question || question.deleted_at) {
        throw new BizError(config.codes.NOT_FOUND, `题目ID=${q.question_id}不存在`);
      }
      // upsert：已存在则更新分值与排序
      const existing = await PaperQuestion.findOne({
        where: { paper_id: paperId, question_id: q.question_id },
        transaction: t,
      });
      if (existing) {
        await existing.update({ score: q.score, sort_order: q.sort_order }, { transaction: t });
      } else {
        await PaperQuestion.create(
          { paper_id: paperId, question_id: q.question_id, score: q.score, sort_order: q.sort_order },
          { transaction: t }
        );
      }
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return true;
}

/**
 * 移除试卷题目
 */
async function removeQuestion(paperId, questionId) {
  const result = await PaperQuestion.destroy({
    where: { paper_id: paperId, question_id: questionId },
  });
  if (result === 0) throw new BizError(config.codes.NOT_FOUND, '试卷中未找到该题目');
  return true;
}

/**
 * 随机组卷
 * 按题型/难度/知识点/数量从题库随机抽取
 */
async function autoGenerate(creatorId, { name, duration, pass_score, is_random_order, rules, description }) {
  const t = await sequelize.transaction();
  try {
    // 计算总分
    let totalScore = 0;
    const allPQ = [];
    let sortOrder = 0;
    for (const rule of rules) {
      const where = { deleted_at: null, type: rule.type };
      if (rule.difficulty) where.difficulty = rule.difficulty;
      if (rule.knowledge_point) where.knowledge_point = { [Op.like]: `%${rule.knowledge_point}%` };
      // 查询满足条件的题目
      const candidates = await Question.findAll({ where, attributes: ['id'], transaction: t });
      if (candidates.length < rule.count) {
        throw new BizError(
          config.codes.BAD_REQUEST,
          `题型${rule.type}满足条件的题目不足，需要${rule.count}题，实际仅${candidates.length}题`
        );
      }
      // 随机抽取
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, rule.count);
      for (const q of picked) {
        allPQ.push({ question_id: q.id, score: rule.score, sort_order: sortOrder++ });
        totalScore += parseFloat(rule.score);
      }
    }
    // 创建试卷
    const paper = await Paper.create(
      {
        name,
        description: description || null,
        total_score: totalScore,
        duration,
        pass_score,
        is_random_order: is_random_order ? 1 : 0,
        creator_id: creatorId,
        status: 'draft',
      },
      { transaction: t }
    );
    // 批量写入 paper_questions
    for (const pq of allPQ) {
      await PaperQuestion.create(
        { paper_id: paper.id, question_id: pq.question_id, score: pq.score, sort_order: pq.sort_order },
        { transaction: t }
      );
    }
    await t.commit();
    return toPaperInfo(paper, allPQ.length);
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

function toPaperInfo(paper, question_count) {
  if (!paper) return null;
  const obj = paper.toJSON();
  return {
    id: obj.id,
    name: obj.name,
    description: obj.description,
    total_score: parseFloat(obj.total_score),
    duration: obj.duration,
    pass_score: parseFloat(obj.pass_score),
    is_random_order: obj.is_random_order === 1 || obj.is_random_order === true,
    creator_id: obj.creator_id,
    creator_name: obj.creator?.real_name || null,
    status: obj.status,
    question_count: question_count ?? 0,
    created_at: obj.created_at,
  };
}

module.exports = {
  listPapers,
  getPaper,
  createPaper,
  updatePaper,
  deletePaper,
  addQuestions,
  removeQuestion,
  autoGenerate,
  toPaperInfo,
};