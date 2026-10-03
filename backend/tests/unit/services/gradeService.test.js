/**
 * 阅卷服务单元测试
 * 关联需求：FR-06-01(自动阅卷) / FR-06-02(手动阅卷) / FR-06-03(阅卷任务) / FR-06-05(进度)
 * 关联用例：UC_AutoGrade / UC_ManualGrade / UC_GradeTask / UC_GradeReview
 * 测试用例：TC-SVC-GRADE-001 ~ TC-SVC-GRADE-010
 */
jest.mock('../../../src/models', () => {
  const GradeTask = { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() };
  const ExamRecord = { findByPk: jest.fn(), findAll: jest.fn(), count: jest.fn() };
  const Answer = { findAll: jest.fn(), findByPk: jest.fn() };
  const Question = {};
  const Exam = { findByPk: jest.fn() };
  const User = {};
  const PaperQuestion = { findAll: jest.fn() };
  return { GradeTask, ExamRecord, Answer, Question, Exam, User, PaperQuestion };
});

jest.mock('../../../src/config/database', () => ({
  sequelize: { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) },
  testConnection: jest.fn(),
}));

jest.mock('../../../src/config/config', () => ({
  codes: { NOT_FOUND: 404, GRADE_TASK_NOT_FOUND: 6001, BAD_REQUEST: 400 },
}));

const gradeService = require('../../../src/services/gradeService');
const { GradeTask, ExamRecord, Answer, Exam, PaperQuestion } = require('../../../src/models');

describe('gradeService - TC-SVC-GRADE', () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- compareAnswer（通过常量与逻辑间接验证）----------
  describe('TC-SVC-GRADE-001 常量定义', () => {
    it('OBJECTIVE_TYPES 应包含 single/multiple/judge/fill', () => {
      expect(gradeService.OBJECTIVE_TYPES).toEqual(['single', 'multiple', 'judge', 'fill']);
    });
    it('SUBJECTIVE_TYPES 应包含 short', () => {
      expect(gradeService.SUBJECTIVE_TYPES).toEqual(['short']);
    });
  });

  // ---------- autoGradeRecord ----------
  describe('TC-SVC-GRADE-002 autoGradeRecord 自动阅卷（关联 FR-06-01）', () => {
    it('纯客观题应自动评分并标记 graded', async () => {
      ExamRecord.findByPk.mockResolvedValue({
        id: 100, exam_id: 1, status: 'submitted',
        update: jest.fn(),
      });
      Exam.findByPk.mockResolvedValue({ paper_id: 1 });
      PaperQuestion.findAll.mockResolvedValue([
        { question_id: 1, score: '2', question: { type: 'single', answer: 'A' } },
        { question_id: 2, score: '3', question: { type: 'judge', answer: 'T' } },
      ]);
      Answer.findAll.mockResolvedValue([
        { question_id: 1, student_answer: 'A', update: jest.fn() },
        { question_id: 2, student_answer: 'F', update: jest.fn() },
      ]);

      const result = await gradeService.autoGradeRecord(100);
      expect(result.objective_score).toBe(2); // 仅第1题正确
      expect(result.has_subjective).toBe(false);
    });

    it('含主观题应生成阅卷任务', async () => {
      ExamRecord.findByPk.mockResolvedValue({
        id: 100, exam_id: 1, status: 'submitted', update: jest.fn(),
      });
      Exam.findByPk.mockResolvedValue({ paper_id: 1, creator_id: 1 });
      PaperQuestion.findAll.mockResolvedValue([
        { question_id: 1, score: '5', question: { type: 'short', answer: '参考答案' } },
      ]);
      Answer.findAll.mockResolvedValue([
        { question_id: 1, student_answer: '学生回答', update: jest.fn() },
      ]);
      GradeTask.findOne.mockResolvedValue(null);
      ExamRecord.count.mockResolvedValue(1);
      GradeTask.create.mockResolvedValue({});

      const result = await gradeService.autoGradeRecord(100);
      expect(result.has_subjective).toBe(true);
      expect(GradeTask.create).toHaveBeenCalled();
    });

    it('考试记录不存在应抛出 NOT_FOUND', async () => {
      ExamRecord.findByPk.mockResolvedValue(null);
      await expect(gradeService.autoGradeRecord(999)).rejects.toThrow('考试记录不存在');
    });
  });

  // ---------- autoGradeExam ----------
  describe('TC-SVC-GRADE-003 autoGradeExam 整场考试自动阅卷', () => {
    it('应遍历所有已交卷记录', async () => {
      Exam.findByPk.mockResolvedValue({ id: 1, deleted_at: null });
      ExamRecord.findAll.mockResolvedValue([
        { id: 100, exam_id: 1, status: 'submitted' },
        { id: 101, exam_id: 1, status: 'submitted' },
      ]);
      // mock autoGradeRecord 内部调用
      ExamRecord.findByPk.mockResolvedValue({ id: 100, exam_id: 1, update: jest.fn() });
      PaperQuestion.findAll.mockResolvedValue([]);
      Answer.findAll.mockResolvedValue([]);

      const result = await gradeService.autoGradeExam(1);
      expect(result.graded_count).toBe(2);
    });

    it('考试不存在应抛出 NOT_FOUND', async () => {
      Exam.findByPk.mockResolvedValue(null);
      await expect(gradeService.autoGradeExam(999)).rejects.toThrow('考试不存在');
    });
  });

  // ---------- listGradeTasks ----------
  describe('TC-SVC-GRADE-004 listGradeTasks 阅卷任务列表（关联 FR-06-03）', () => {
    it('应返回分页任务列表', async () => {
      GradeTask.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, exam_id: 1, teacher_id: 1, status: 'pending', total_count: 10, graded_count: 0,
          toJSON: () => ({ id: 1, exam_id: 1, teacher_id: 1, status: 'pending', total_count: 10, graded_count: 0,
            exam: { name: '考' }, teacher: { real_name: 'T' } }) }],
        count: 1,
      });
      const result = await gradeService.listGradeTasks({ page: 1, pageSize: 10, offset: 0, limit: 10 });
      expect(result.list).toHaveLength(1);
      expect(result.list[0].exam_name).toBe('考');
    });
  });

  // ---------- getGradeTask ----------
  describe('TC-SVC-GRADE-005 getGradeTask 阅卷任务详情', () => {
    it('应返回任务含主观题答卷列表', async () => {
      GradeTask.findByPk.mockResolvedValue({
        id: 1, exam_id: 1, teacher_id: 1, status: 'pending', total_count: 1, graded_count: 0,
        toJSON: () => ({ id: 1, exam_id: 1, status: 'pending', total_count: 1, graded_count: 0,
          exam: { name: '考' }, teacher: { real_name: 'T' } }),
      });
      ExamRecord.findAll.mockResolvedValue([
        { id: 100, student: { real_name: '学生A' } },
      ]);
      Answer.findAll.mockResolvedValue([
        { id: 1, question_id: 1, student_answer: '答', score: null, is_correct: null, comment: null,
          question: { type: 'short', content: '简答题', answer: '参考', analysis: '解析' } },
      ]);

      const result = await gradeService.getGradeTask(1);
      expect(result.records[0].answers).toHaveLength(1);
    });

    it('任务不存在应抛出错误', async () => {
      GradeTask.findByPk.mockResolvedValue(null);
      await expect(gradeService.getGradeTask(999)).rejects.toThrow('阅卷任务不存在');
    });
  });

  // ---------- gradeAnswers ----------
  describe('TC-SVC-GRADE-006 gradeAnswers 手动评分（关联 FR-06-02）', () => {
    it('应更新答案评分并汇总成绩', async () => {
      ExamRecord.findByPk.mockResolvedValue({ id: 100, exam_id: 1, status: 'submitted', update: jest.fn() });
      Answer.findByPk.mockResolvedValue({
        id: 1, exam_record_id: 100, score: null, update: jest.fn(),
      });
      Answer.findAll.mockResolvedValue([
        { score: '4' }, { score: '3' },
      ]);
      GradeTask.findOne.mockResolvedValue({ update: jest.fn() });
      ExamRecord.count.mockResolvedValue(1);

      const result = await gradeService.gradeAnswers(1, {
        exam_record_id: 100,
        answers: [{ answer_id: 1, score: 4, comment: '不错' }],
      });
      expect(result).toBe(true);
    });

    it('考试记录不存在应抛出 NOT_FOUND', async () => {
      ExamRecord.findByPk.mockResolvedValue(null);
      await expect(gradeService.gradeAnswers(1, { exam_record_id: 999, answers: [] }))
        .rejects.toThrow('考试记录不存在');
    });
  });

  // ---------- getGradeProgress ----------
  describe('TC-SVC-GRADE-007 getGradeProgress 阅卷进度（关联 FR-06-05）', () => {
    it('应返回进度百分比', async () => {
      ExamRecord.count.mockResolvedValueOnce(10); // total
      ExamRecord.count.mockResolvedValueOnce(7);  // graded
      const result = await gradeService.getGradeProgress(1);
      expect(result.total_count).toBe(10);
      expect(result.graded_count).toBe(7);
      expect(result.progress).toBe(70);
    });

    it('无答卷时进度为 0', async () => {
      ExamRecord.count.mockResolvedValue(0);
      const result = await gradeService.getGradeProgress(1);
      expect(result.progress).toBe(0);
    });
  });

  // ---------- toGradeTaskInfo ----------
  describe('TC-SVC-GRADE-008 toGradeTaskInfo DTO 转换', () => {
    it('应正确计算进度', () => {
      const info = gradeService.toGradeTaskInfo({
        toJSON: () => ({
          id: 1, exam_id: 1, teacher_id: 1, status: 'ongoing',
          total_count: 4, graded_count: 3,
          exam: { name: '考' }, teacher: { real_name: 'T' },
        }),
      });
      expect(info.progress).toBe(75);
      expect(info.exam_name).toBe('考');
    });

    it('传入 null 返回 null', () => {
      expect(gradeService.toGradeTaskInfo(null)).toBeNull();
    });
  });
});