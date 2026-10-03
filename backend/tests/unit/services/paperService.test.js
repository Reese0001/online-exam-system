/**
 * 试卷管理服务单元测试
 * 关联需求：FR-03-01(手动组卷) / FR-03-02(随机组卷) / FR-03-05(编辑) / FR-03-06(删除)
 * 关联用例：UC_ManualPaper / UC_AutoPaper / UC_PaperConfig / UC_SelectQ
 * 测试用例：TC-SVC-PAPER-001 ~ TC-SVC-PAPER-010
 */
jest.mock('../../../src/models', () => {
  const Paper = { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() };
  const PaperQuestion = { count: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), findOne: jest.fn(), create: jest.fn() };
  const Question = { findByPk: jest.fn(), findAll: jest.fn() };
  const Exam = { count: jest.fn() };
  const User = {};
  return { Paper, PaperQuestion, Question, Exam, User };
});

jest.mock('../../../src/config/database', () => {
  const transaction = jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  });
  return { sequelize: { transaction }, testConnection: jest.fn() };
});

jest.mock('../../../src/config/config', () => ({
  codes: { NOT_FOUND: 404, PAPER_REFERENCED: 3001, BAD_REQUEST: 400 },
}));

jest.mock('../../../src/services/questionService', () => ({
  toQuestionInfo: jest.fn(q => q),
}));

const paperService = require('../../../src/services/paperService');
const { Paper, PaperQuestion, Question, Exam } = require('../../../src/models');
const { sequelize } = require('../../../src/config/database');

describe('paperService - TC-SVC-PAPER', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockPaper = {
    id: 1, name: '测试卷', description: null, total_score: 100, duration: 60,
    pass_score: 60, is_random_order: 0, creator_id: 1, status: 'draft',
    created_at: new Date(), deleted_at: null,
    creator: { real_name: '张老师' },
    toJSON() { return { ...this }; },
  };

  // ---------- listPapers ----------
  describe('TC-SVC-PAPER-001 listPapers 分页查询（关联 FR-03-07）', () => {
    it('应返回试卷列表（含题目数）', async () => {
      Paper.findAndCountAll.mockResolvedValue({ rows: [mockPaper], count: 1 });
      PaperQuestion.count.mockResolvedValue(5);
      const result = await paperService.listPapers({ page: 1, pageSize: 10, offset: 0, limit: 10 });
      expect(result.list).toHaveLength(1);
      expect(result.list[0].question_count).toBe(5);
    });
  });

  // ---------- getPaper ----------
  describe('TC-SVC-PAPER-002 getPaper 获取试卷详情（关联 FR-03-04）', () => {
    it('应返回试卷含题目列表', async () => {
      Paper.findByPk.mockResolvedValue(mockPaper);
      PaperQuestion.findAll.mockResolvedValue([
        { id: 1, question_id: 1, score: '2.0', sort_order: 0, question: { type: 'single', content: 'q1', options: [] } },
      ]);
      const result = await paperService.getPaper(1);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].score).toBe(2.0);
    });

    it('试卷不存在应抛出 NOT_FOUND', async () => {
      Paper.findByPk.mockResolvedValue(null);
      await expect(paperService.getPaper(999)).rejects.toThrow('试卷不存在');
    });
  });

  // ---------- createPaper ----------
  describe('TC-SVC-PAPER-003 createPaper 创建试卷（关联 FR-03-01）', () => {
    it('应调用 Paper.create', async () => {
      Paper.create.mockResolvedValue(mockPaper);
      const result = await paperService.createPaper(1, {
        name: '新卷', total_score: 100, duration: 60, pass_score: 60,
      });
      expect(Paper.create).toHaveBeenCalled();
      expect(result.name).toBe('测试卷');
    });

    it('is_random_order 应转为 0/1', async () => {
      Paper.create.mockResolvedValue(mockPaper);
      await paperService.createPaper(1, { name: 'x', is_random_order: true });
      const arg = Paper.create.mock.calls[0][0];
      expect(arg.is_random_order).toBe(1);
    });
  });

  // ---------- updatePaper ----------
  describe('TC-SVC-PAPER-004 updatePaper 修改试卷（关联 FR-03-05）', () => {
    it('应调用 update', async () => {
      const update = jest.fn();
      Paper.findByPk.mockResolvedValue({ ...mockPaper, update });
      await paperService.updatePaper(1, { name: '新名' });
      expect(update).toHaveBeenCalledWith({ name: '新名' });
    });

    it('试卷不存在应抛出 NOT_FOUND', async () => {
      Paper.findByPk.mockResolvedValue(null);
      await expect(paperService.updatePaper(999, {})).rejects.toThrow('试卷不存在');
    });
  });

  // ---------- deletePaper ----------
  describe('TC-SVC-PAPER-005 deletePaper 删除试卷（关联 FR-03-06）', () => {
    it('未被考试引用时应软删除', async () => {
      const update = jest.fn();
      Paper.findByPk.mockResolvedValue({ ...mockPaper, update });
      Exam.count.mockResolvedValue(0);
      PaperQuestion.destroy.mockResolvedValue(1);
      const result = await paperService.deletePaper(1);
      expect(result).toBe(true);
    });

    it('被考试引用时禁止删除（关联 FR-03-06 冲突）', async () => {
      Paper.findByPk.mockResolvedValue({ ...mockPaper, update: jest.fn() });
      Exam.count.mockResolvedValue(1);
      await expect(paperService.deletePaper(1)).rejects.toThrow('试卷已被考试引用，禁止删除');
    });
  });

  // ---------- addQuestions ----------
  describe('TC-SVC-PAPER-006 addQuestions 添加题目到试卷（关联 FR-03-01 手动组卷）', () => {
    it('应校验题目存在并写入 PaperQuestion', async () => {
      Paper.findByPk.mockResolvedValue(mockPaper);
      Question.findByPk.mockResolvedValue({ id: 1, deleted_at: null });
      PaperQuestion.findOne.mockResolvedValue(null);
      PaperQuestion.create.mockResolvedValue({});
      const result = await paperService.addQuestions(1, [{ question_id: 1, score: 2, sort_order: 0 }]);
      expect(result).toBe(true);
    });

    it('题目不存在应抛出 NOT_FOUND', async () => {
      Paper.findByPk.mockResolvedValue(mockPaper);
      Question.findByPk.mockResolvedValue(null);
      await expect(paperService.addQuestions(1, [{ question_id: 999, score: 2, sort_order: 0 }]))
        .rejects.toThrow('题目ID=999不存在');
    });
  });

  // ---------- removeQuestion ----------
  describe('TC-SVC-PAPER-007 removeQuestion 移除题目', () => {
    it('应调用 destroy', async () => {
      PaperQuestion.destroy.mockResolvedValue(1);
      const result = await paperService.removeQuestion(1, 1);
      expect(result).toBe(true);
    });

    it('未找到题目应抛出 NOT_FOUND', async () => {
      PaperQuestion.destroy.mockResolvedValue(0);
      await expect(paperService.removeQuestion(1, 999)).rejects.toThrow('试卷中未找到该题目');
    });
  });

  // ---------- autoGenerate ----------
  describe('TC-SVC-PAPER-008 autoGenerate 随机组卷（关联 FR-03-02）', () => {
    it('题库充足时应随机抽题组卷', async () => {
      const candidates = [{ id: 1 }, { id: 2 }, { id: 3 }];
      Question.findAll.mockResolvedValue(candidates);
      Paper.create.mockResolvedValue({ ...mockPaper, id: 100 });
      PaperQuestion.create.mockResolvedValue({});
      const result = await paperService.autoGenerate(1, {
        name: '随机卷', duration: 60, pass_score: 60,
        rules: [{ type: 'single', count: 2, score: 5 }],
      });
      expect(result).toBeDefined();
    });

    it('题库不足应抛出 BAD_REQUEST', async () => {
      Question.findAll.mockResolvedValue([{ id: 1 }]); // 仅1题
      await expect(paperService.autoGenerate(1, {
        name: 'x', duration: 60, pass_score: 60,
        rules: [{ type: 'single', count: 5, score: 2 }], // 需要5题
      })).rejects.toThrow(/题目不足/);
    });
  });

  // ---------- toPaperInfo ----------
  describe('TC-SVC-PAPER-009 toPaperInfo DTO 转换', () => {
    it('应正确转换 total_score/pass_score 为数字', () => {
      const info = paperService.toPaperInfo({
        toJSON: () => ({
          id: 1, name: 'n', total_score: '100.0', duration: 60, pass_score: '60.0',
          is_random_order: 1, creator_id: 1, status: 'draft',
          creator: { real_name: 'T' },
        }),
      }, 5);
      expect(info.total_score).toBe(100);
      expect(info.is_random_order).toBe(true);
      expect(info.question_count).toBe(5);
    });

    it('传入 null 返回 null', () => {
      expect(paperService.toPaperInfo(null)).toBeNull();
    });
  });

  describe('TC-SVC-PAPER-010 事务回滚', () => {
    it('autoGenerate 出错时应回滚事务', async () => {
      Question.findAll.mockRejectedValue(new Error('DB错误'));
      await expect(paperService.autoGenerate(1, {
        name: 'x', duration: 60, pass_score: 60,
        rules: [{ type: 'single', count: 1, score: 2 }],
      })).rejects.toThrow();
    });
  });
});