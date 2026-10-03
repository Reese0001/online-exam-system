/**
 * 成绩统计服务单元测试
 * 关联需求：FR-07-01(个人成绩) / FR-07-02(班级成绩) / FR-07-03(分布) / FR-07-04(指标) / FR-07-06(错题)
 * 关联用例：UC_PersonalScore / UC_ClassScore / UC_ScoreDist / UC_WrongQ
 * 测试用例：TC-SVC-SCORE-001 ~ TC-SVC-SCORE-007
 */
jest.mock('../../../src/models', () => {
  const ExamRecord = { findAll: jest.fn(), findOne: jest.fn() };
  const Answer = { findAll: jest.fn() };
  const Question = {};
  const Exam = { findByPk: jest.fn() };
  const Class = { findByPk: jest.fn() };
  const User = { findAll: jest.fn() };
  const Paper = {};
  const PaperQuestion = {};
  return { ExamRecord, Answer, Question, Exam, Class, User, Paper, PaperQuestion };
});

jest.mock('../../../src/utils/excelHelper', () => ({
  buildScoreExcel: jest.fn().mockReturnValue(Buffer.from('excel')),
}));

jest.mock('../../../src/config/config', () => ({
  codes: { NOT_FOUND: 404 },
}));

const scoreService = require('../../../src/services/scoreService');
const { ExamRecord, Answer, Exam, Class, User } = require('../../../src/models');
const excelHelper = require('../../../src/utils/excelHelper');

describe('scoreService - TC-SVC-SCORE', () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- getPersonalScores ----------
  describe('TC-SVC-SCORE-001 getPersonalScores 个人成绩（关联 FR-07-01）', () => {
    it('应返回已阅卷成绩列表（含是否及格）', async () => {
      ExamRecord.findAll.mockResolvedValue([
        { exam_id: 1, total_score: 80, submit_time: new Date(),
          exam: { name: '考1', paper: { pass_score: 60 } } },
        { exam_id: 2, total_score: 50, submit_time: new Date(),
          exam: { name: '考2', paper: { pass_score: 60 } } },
      ]);
      const result = await scoreService.getPersonalScores(10);
      expect(result).toHaveLength(2);
      expect(result[0].is_pass).toBe(true);
      expect(result[1].is_pass).toBe(false);
    });
  });

  // ---------- getClassScores ----------
  describe('TC-SVC-SCORE-002 getClassScores 班级成绩（关联 FR-07-02）', () => {
    it('应返回班级学生成绩表', async () => {
      Class.findByPk.mockResolvedValue({ id: 1, name: '一班' });
      Exam.findByPk.mockResolvedValue({ id: 1, paper: { pass_score: 60 } });
      User.findAll.mockResolvedValue([
        { id: 10, username: 's1', real_name: '学生1' },
        { id: 11, username: 's2', real_name: '学生2' },
      ]);
      ExamRecord.findOne.mockResolvedValueOnce({ total_score: 80, submit_time: new Date() });
      ExamRecord.findOne.mockResolvedValueOnce(null);

      const result = await scoreService.getClassScores(1, 1);
      expect(result).toHaveLength(2);
      expect(result[0].total_score).toBe(80);
      expect(result[1].total_score).toBeNull();
    });

    it('班级不存在应抛出 NOT_FOUND', async () => {
      Class.findByPk.mockResolvedValue(null);
      await expect(scoreService.getClassScores(999, 1)).rejects.toThrow('班级不存在');
    });

    it('考试不存在应抛出 NOT_FOUND', async () => {
      Class.findByPk.mockResolvedValue({ id: 1 });
      Exam.findByPk.mockResolvedValue(null);
      await expect(scoreService.getClassScores(1, 999)).rejects.toThrow('考试不存在');
    });
  });

  // ---------- getStatistics ----------
  describe('TC-SVC-SCORE-003 getStatistics 成绩分布与指标（关联 FR-07-03/FR-07-04）', () => {
    it('应计算最高/最低/平均/及格率/标准差/分布', async () => {
      Exam.findByPk.mockResolvedValue({ paper: { pass_score: 60 } });
      ExamRecord.findAll.mockResolvedValue([
        { total_score: 95 }, { total_score: 85 }, { total_score: 75 },
        { total_score: 65 }, { total_score: 55 },
      ]);
      const result = await scoreService.getStatistics(1);
      expect(result.max_score).toBe(95);
      expect(result.min_score).toBe(55);
      expect(result.avg_score).toBe(75);
      expect(result.pass_rate).toBe(80); // 4/5 及格
      expect(result.distribution).toHaveLength(5);
      expect(result.distribution[0].count).toBe(1); // 0-59: 1人
      expect(result.distribution[4].count).toBe(1); // 90-100: 1人
    });

    it('无成绩时应返回零值', async () => {
      Exam.findByPk.mockResolvedValue({ paper: { pass_score: 60 } });
      ExamRecord.findAll.mockResolvedValue([]);
      const result = await scoreService.getStatistics(1);
      expect(result.max_score).toBe(0);
      expect(result.distribution[0].count).toBe(0);
    });

    it('考试不存在应抛出 NOT_FOUND', async () => {
      Exam.findByPk.mockResolvedValue(null);
      await expect(scoreService.getStatistics(999)).rejects.toThrow('考试不存在');
    });
  });

  // ---------- exportScores ----------
  describe('TC-SVC-SCORE-004 exportScores 成绩单导出（关联 FR-07-05）', () => {
    it('应返回 Excel Buffer', async () => {
      Exam.findByPk.mockResolvedValue({ id: 1, name: '考', paper: { pass_score: 60 } });
      User.findAll.mockResolvedValue([
        { id: 10, username: 's1', real_name: '学生1', class: { name: '一班' } },
      ]);
      ExamRecord.findOne.mockResolvedValue({ total_score: 80, submit_time: new Date() });
      excelHelper.buildScoreExcel.mockReturnValue(Buffer.from('excel'));

      const result = await scoreService.exportScores(1, 1);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('考试不存在应抛出 NOT_FOUND', async () => {
      Exam.findByPk.mockResolvedValue(null);
      await expect(scoreService.exportScores(999, 1)).rejects.toThrow('考试不存在');
    });
  });

  // ---------- getWrongQuestions ----------
  describe('TC-SVC-SCORE-005 getWrongQuestions 错题统计（关联 FR-07-06）', () => {
    it('应返回答错的题目列表', async () => {
      ExamRecord.findAll.mockResolvedValue([
        { id: 100, exam_id: 1, exam: { name: '考' } },
      ]);
      Answer.findAll.mockResolvedValue([
        { exam_record_id: 100, question_id: 1, student_answer: 'B',
          question: { content: '题', answer: 'A', analysis: '解析' } },
      ]);
      const result = await scoreService.getWrongQuestions(10);
      expect(result).toHaveLength(1);
      expect(result[0].correct_answer).toBe('A');
    });

    it('指定 examId 应只查该考试错题', async () => {
      ExamRecord.findAll.mockResolvedValue([]);
      await scoreService.getWrongQuestions(10, 1);
      const arg = ExamRecord.findAll.mock.calls[0][0];
      expect(arg.where.exam_id).toBe(1);
    });
  });
});