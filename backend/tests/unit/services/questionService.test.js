/**
 * 题库管理服务单元测试
 * 关联需求：FR-02-01~FR-02-07（题目CRUD/批量导入导出/查询筛选）
 * 关联用例：UC_QAdd / UC_QEdit / UC_QDel / UC_QQuery / UC_QImport / UC_QExport
 * 测试用例：TC-SVC-Q-001 ~ TC-SVC-Q-011
 */
jest.mock('../../../src/models', () => {
  const Question = {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  };
  const User = {};
  const PaperQuestion = { count: jest.fn() };
  return { Question, User, PaperQuestion };
});

jest.mock('../../../src/utils/excelHelper', () => ({
  parseQuestionExcel: jest.fn(),
  validateQuestionRow: jest.fn(),
  buildQuestionExcel: jest.fn(),
}));

jest.mock('../../../src/config/config', () => ({
  codes: { NOT_FOUND: 404, QUESTION_REFERENCED: 2001, BAD_REQUEST: 400 },
}));

const { Op } = require('sequelize');
const questionService = require('../../../src/services/questionService');
const { Question, PaperQuestion } = require('../../../src/models');
const excelHelper = require('../../../src/utils/excelHelper');

describe('questionService - TC-SVC-Q', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockQuestion = {
    id: 1, type: 'single', content: '1+1=?', options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
    answer: 'B', analysis: '1+1=2', difficulty: 1, knowledge_point: '数学', score: 2.0,
    creator_id: 1, created_at: new Date(), deleted_at: null,
    creator: { real_name: '张老师' },
    toJSON() { return { ...this, creator: { real_name: '张老师' } }; },
  };

  // ---------- listQuestions ----------
  describe('TC-SVC-Q-001 listQuestions 分页查询（关联 FR-02-04）', () => {
    it('应返回分页列表', async () => {
      Question.findAndCountAll.mockResolvedValue({ rows: [mockQuestion], count: 1 });
      const result = await questionService.listQuestions({
        page: 1, pageSize: 10, offset: 0, limit: 10,
      });
      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('应支持按 type/difficulty/keyword 筛选', async () => {
      Question.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
      await questionService.listQuestions({
        page: 1, pageSize: 10, offset: 0, limit: 10,
        type: 'single', difficulty: 2, keyword: '数学',
      });
      const callArg = Question.findAndCountAll.mock.calls[0][0];
      expect(callArg.where.type).toBe('single');
      expect(callArg.where.difficulty).toBe(2);
      expect(callArg.where[Op.or]).toBeDefined();
    });
  });

  // ---------- getQuestion ----------
  describe('TC-SVC-Q-002 getQuestion 获取详情（关联 FR-02-05）', () => {
    it('应返回题目详情', async () => {
      Question.findByPk.mockResolvedValue(mockQuestion);
      const result = await questionService.getQuestion(1);
      expect(result.id).toBe(1);
      expect(result.content).toBe('1+1=?');
    });

    it('题目不存在应抛出 NOT_FOUND', async () => {
      Question.findByPk.mockResolvedValue(null);
      await expect(questionService.getQuestion(999)).rejects.toThrow('题目不存在');
    });

    it('已软删除应抛出 NOT_FOUND', async () => {
      Question.findByPk.mockResolvedValue({ ...mockQuestion, deleted_at: new Date() });
      await expect(questionService.getQuestion(1)).rejects.toThrow('题目不存在');
    });
  });

  // ---------- createQuestion ----------
  describe('TC-SVC-Q-003 createQuestion 新增题目（关联 FR-02-01）', () => {
    it('应调用 Question.create 并返回题目信息', async () => {
      Question.create.mockResolvedValue(mockQuestion);
      const result = await questionService.createQuestion(1, {
        type: 'single', content: '1+1=?', answer: 'B', difficulty: 1, score: 2,
      });
      expect(Question.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('options 未提供时应存为 null', async () => {
      Question.create.mockResolvedValue(mockQuestion);
      await questionService.createQuestion(1, {
        type: 'fill', content: '1+1=?', answer: '2', difficulty: 1, score: 2,
      });
      const arg = Question.create.mock.calls[0][0];
      expect(arg.options).toBeNull();
    });
  });

  // ---------- updateQuestion ----------
  describe('TC-SVC-Q-004 updateQuestion 修改题目（关联 FR-02-02）', () => {
    it('应调用 update 更新字段', async () => {
      const update = jest.fn();
      Question.findByPk.mockResolvedValue({ ...mockQuestion, update });
      await questionService.updateQuestion(1, { content: '新题干' });
      expect(update).toHaveBeenCalledWith({ content: '新题干' });
    });

    it('题目不存在应抛出 NOT_FOUND', async () => {
      Question.findByPk.mockResolvedValue(null);
      await expect(questionService.updateQuestion(999, {})).rejects.toThrow('题目不存在');
    });
  });

  // ---------- deleteQuestion ----------
  describe('TC-SVC-Q-005 deleteQuestion 删除题目（关联 FR-02-03）', () => {
    it('未被引用时应软删除', async () => {
      const update = jest.fn();
      Question.findByPk.mockResolvedValue({ ...mockQuestion, update });
      PaperQuestion.count.mockResolvedValue(0);
      const result = await questionService.deleteQuestion(1);
      expect(result).toBe(true);
      expect(update).toHaveBeenCalled();
      expect(update.mock.calls[0][0].deleted_at).toBeInstanceOf(Date);
    });

    it('被试卷引用时禁止删除（关联 FR-02-03 冲突）', async () => {
      Question.findByPk.mockResolvedValue({ ...mockQuestion, update: jest.fn() });
      PaperQuestion.count.mockResolvedValue(2);
      await expect(questionService.deleteQuestion(1)).rejects.toThrow('题目已被试卷引用，禁止删除');
    });

    it('题目不存在应抛出 NOT_FOUND', async () => {
      Question.findByPk.mockResolvedValue(null);
      await expect(questionService.deleteQuestion(999)).rejects.toThrow('题目不存在');
    });
  });

  // ---------- importQuestions ----------
  describe('TC-SVC-Q-006 importQuestions 批量导入（关联 FR-02-06）', () => {
    it('应返回成功/失败计数', async () => {
      excelHelper.parseQuestionExcel.mockReturnValue([
        { row: 1, data: { type: 'single', content: 'q1', answer: 'A', difficulty: 1, score: 2 } },
        { row: 2, data: { type: 'single', content: 'q2', answer: 'B', difficulty: 1, score: 2 } },
      ]);
      excelHelper.validateQuestionRow.mockReturnValue(null);
      Question.create.mockResolvedValue(mockQuestion);

      const result = await questionService.importQuestions(1, Buffer.from(''));
      expect(result.success_count).toBe(2);
      expect(result.fail_count).toBe(0);
    });

    it('校验失败的行应计入 fail_count', async () => {
      excelHelper.parseQuestionExcel.mockReturnValue([
        { row: 1, data: { type: 'invalid' } },
      ]);
      excelHelper.validateQuestionRow.mockReturnValue('题型非法');
      const result = await questionService.importQuestions(1, Buffer.from(''));
      expect(result.success_count).toBe(0);
      expect(result.fail_count).toBe(1);
      expect(result.errors[0].message).toBe('题型非法');
    });
  });

  // ---------- exportQuestions ----------
  describe('TC-SVC-Q-007 exportQuestions 批量导出（关联 FR-02-07）', () => {
    it('应返回 Excel Buffer', async () => {
      Question.findAll.mockResolvedValue([mockQuestion]);
      excelHelper.buildQuestionExcel.mockReturnValue(Buffer.from('excel'));
      const result = await questionService.exportQuestions({ type: 'single' });
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('应按 type/difficulty 筛选导出', async () => {
      Question.findAll.mockResolvedValue([]);
      excelHelper.buildQuestionExcel.mockReturnValue(Buffer.from(''));
      await questionService.exportQuestions({ type: 'judge', difficulty: 3 });
      const arg = Question.findAll.mock.calls[0][0];
      expect(arg.where.type).toBe('judge');
      expect(arg.where.difficulty).toBe(3);
    });
  });

  // ---------- toQuestionInfo ----------
  describe('TC-SVC-Q-008 toQuestionInfo DTO 转换', () => {
    it('应正确转换并包含 creator_name', () => {
      const info = questionService.toQuestionInfo({
        toJSON: () => ({
          id: 1, type: 'single', content: 'q', options: [], answer: 'A',
          analysis: 'x', difficulty: 1, knowledge_point: 'kp', score: '2.0',
          creator_id: 1, creator: { real_name: '张老师' }, created_at: '2026',
        }),
      });
      expect(info.score).toBe(2.0);
      expect(info.creator_name).toBe('张老师');
    });

    it('传入 null 返回 null', () => {
      expect(questionService.toQuestionInfo(null)).toBeNull();
    });
  });
});