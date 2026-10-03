/**
 * 考试管理 + 在线答题服务单元测试
 * 关联需求：FR-04-01~FR-04-08(考试管理) / FR-05-01~FR-05-09(在线答题)
 * 关联用例：UC_PublishExam / UC_ExamTime / UC_ExamStatus / UC_EnterExam / UC_SaveAnswer / UC_Submit
 * 测试用例：TC-SVC-EXAM-001 ~ TC-SVC-EXAM-014
 */
jest.mock('../../../src/models', () => {
  const Exam = { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn() };
  const ExamClass = { findAll: jest.fn(), findOne: jest.fn(), bulkCreate: jest.fn(), destroy: jest.fn() };
  const ExamRecord = { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn(), count: jest.fn() };
  const Answer = { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() };
  const Paper = { findByPk: jest.fn() };
  const PaperQuestion = { findAll: jest.fn(), count: jest.fn() };
  const Question = {};
  const Class = {};
  const User = { findByPk: jest.fn(), findAll: jest.fn(), count: jest.fn() };
  return { Exam, ExamClass, ExamRecord, Answer, Paper, PaperQuestion, Question, Class, User };
});

jest.mock('../../../src/config/database', () => ({
  sequelize: { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) },
  testConnection: jest.fn(),
}));

jest.mock('../../../src/config/config', () => ({
  codes: {
    NOT_FOUND: 404, BAD_REQUEST: 400, FORBIDDEN: 403,
    EXAM_NOT_IN_WINDOW: 4001, EXAM_ALREADY_SUBMITTED: 4002, EXAM_ONGOING: 4003,
  },
}));

jest.mock('../../../src/services/paperService', () => ({
  toPaperInfo: jest.fn((p, count) => ({ id: p?.id, name: p?.name, question_count: count || 0 })),
}));

jest.mock('../../../src/services/gradeService', () => ({
  autoGradeRecord: jest.fn().mockResolvedValue({ objective_score: 80, has_subjective: false }),
}));

const examService = require('../../../src/services/examService');
const { Exam, ExamClass, ExamRecord, Answer, Paper, PaperQuestion, User } = require('../../../src/models');
const gradeService = require('../../../src/services/gradeService');

describe('examService - TC-SVC-EXAM', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockExam = {
    id: 1, paper_id: 1, name: '期末考试', start_time: new Date('2026-01-01'),
    end_time: new Date('2026-12-31'), status: 'published', creator_id: 1,
    deleted_at: null, paper: { id: 1, name: '卷', pass_score: 60, is_random_order: 0 },
    creator: { real_name: '张老师' },
    toJSON() { return { ...this }; },
    update: jest.fn(),
  };

  // ---------- createExam ----------
  describe('TC-SVC-EXAM-001 createExam 创建考试（关联 FR-04-01）', () => {
    it('应校验试卷存在并创建考试', async () => {
      Paper.findByPk.mockResolvedValue({ id: 1, deleted_at: null });
      Exam.create.mockResolvedValue(mockExam);
      const result = await examService.createExam(1, {
        paper_id: 1, name: '考', start_time: '2026-01-01', end_time: '2026-12-31',
        class_ids: [1, 2],
      });
      expect(Exam.create).toHaveBeenCalled();
      expect(ExamClass.bulkCreate).toHaveBeenCalled();
    });

    it('试卷不存在应抛出 NOT_FOUND', async () => {
      Paper.findByPk.mockResolvedValue(null);
      await expect(examService.createExam(1, { paper_id: 999, name: 'x', start_time: '2026-01-01', end_time: '2026-12-31' }))
        .rejects.toThrow('试卷不存在');
    });

    it('开始时间晚于结束时间应抛出错误（关联 FR-04-02）', async () => {
      Paper.findByPk.mockResolvedValue({ id: 1, deleted_at: null });
      await expect(examService.createExam(1, {
        paper_id: 1, name: 'x', start_time: '2026-12-31', end_time: '2026-01-01',
      })).rejects.toThrow('开始时间必须早于结束时间');
    });
  });

  // ---------- updateExam ----------
  describe('TC-SVC-EXAM-002 updateExam 修改考试（关联 FR-04-06）', () => {
    it('非进行中应允许修改', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'draft', update: jest.fn() });
      await examService.updateExam(1, { name: '新名' });
      expect(Exam.findByPk).toHaveBeenCalled();
    });

    it('进行中不允许修改（关联 FR-04-04 状态约束）', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'ongoing' });
      await expect(examService.updateExam(1, { name: 'x' })).rejects.toThrow('考试进行中，不允许修改');
    });
  });

  // ---------- deleteExam ----------
  describe('TC-SVC-EXAM-003 deleteExam 删除考试（关联 FR-04-07）', () => {
    it('非进行中应允许删除', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'draft', update: jest.fn() });
      ExamClass.destroy.mockResolvedValue(1);
      const result = await examService.deleteExam(1);
      expect(result).toBe(true);
    });

    it('进行中不允许删除', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'ongoing' });
      await expect(examService.deleteExam(1)).rejects.toThrow('考试进行中，不允许删除');
    });
  });

  // ---------- publishExam ----------
  describe('TC-SVC-EXAM-004 publishExam 发布考试（关联 FR-04-01）', () => {
    it('草稿状态应可发布', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'draft', update: jest.fn() });
      const result = await examService.publishExam(1);
      expect(result).toBe(true);
    });

    it('非草稿状态不可发布', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'published' });
      await expect(examService.publishExam(1)).rejects.toThrow('仅草稿状态可发布');
    });
  });

  // ---------- startExam ----------
  describe('TC-SVC-EXAM-005 startExam 进入考试（关联 FR-05-02）', () => {
    it('应返回试卷题目与剩余时间', async () => {
      Exam.findByPk.mockResolvedValue({
        ...mockExam, status: 'ongoing',
        start_time: new Date(Date.now() - 60000),
        end_time: new Date(Date.now() + 3600000),
      });
      User.findByPk.mockResolvedValue({ id: 10, role: 'student', class_id: 1 });
      ExamClass.findOne.mockResolvedValue({ exam_id: 1, class_id: 1 });
      ExamRecord.findOne.mockResolvedValue(null);
      ExamRecord.create.mockResolvedValue({ id: 100, exam_id: 1, student_id: 10, status: 'ongoing' });
      PaperQuestion.findAll.mockResolvedValue([
        { id: 1, question_id: 1, score: '2', sort_order: 0, question: { type: 'single', content: 'q', options: [] } },
      ]);

      const result = await examService.startExam(1, 10);
      expect(result.exam_record_id).toBe(100);
      expect(result.paper).toBeDefined();
      expect(result.remain_seconds).toBeGreaterThan(0);
    });

    it('未在参考班级应拒绝（关联 FR-04-03）', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'ongoing' });
      User.findByPk.mockResolvedValue({ id: 10, role: 'student', class_id: 99 });
      ExamClass.findOne.mockResolvedValue(null);
      await expect(examService.startExam(1, 10)).rejects.toThrow('您不在此考试的参考范围内');
    });

    it('考试未发布应拒绝', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'draft' });
      User.findByPk.mockResolvedValue({ id: 10, role: 'student', class_id: 1 });
      ExamClass.findOne.mockResolvedValue({});
      await expect(examService.startExam(1, 10)).rejects.toThrow('考试尚未发布');
    });

    it('已交卷不可重复进入（关联 FR-05-08）', async () => {
      Exam.findByPk.mockResolvedValue({ ...mockExam, status: 'ongoing' });
      User.findByPk.mockResolvedValue({ id: 10, role: 'student', class_id: 1 });
      ExamClass.findOne.mockResolvedValue({});
      ExamRecord.findOne.mockResolvedValue({ status: 'submitted' });
      await expect(examService.startExam(1, 10)).rejects.toThrow('已交卷，不可重复进入');
    });
  });

  // ---------- saveAnswer ----------
  describe('TC-SVC-EXAM-006 saveAnswer 答案暂存（关联 FR-05-04）', () => {
    it('应 upsert 答案', async () => {
      ExamRecord.findOne.mockResolvedValue({ id: 100, status: 'ongoing' });
      Answer.findOne.mockResolvedValue(null);
      Answer.create.mockResolvedValue({});
      const result = await examService.saveAnswer(1, 10, { question_id: 1, student_answer: 'A' });
      expect(result).toBe(true);
    });

    it('已交卷不可暂存', async () => {
      ExamRecord.findOne.mockResolvedValue({ id: 100, status: 'submitted' });
      await expect(examService.saveAnswer(1, 10, { question_id: 1, student_answer: 'A' }))
        .rejects.toThrow('已交卷，不可再保存答案');
    });

    it('考试记录不存在应抛出错误', async () => {
      ExamRecord.findOne.mockResolvedValue(null);
      await expect(examService.saveAnswer(1, 10, { question_id: 1, student_answer: 'A' }))
        .rejects.toThrow('考试记录不存在');
    });
  });

  // ---------- submitExam ----------
  describe('TC-SVC-EXAM-007 submitExam 交卷（关联 FR-05-08）', () => {
    it('应触发客观题自动阅卷', async () => {
      ExamRecord.findOne.mockResolvedValue({
        id: 100, exam_id: 1, student_id: 10, status: 'ongoing',
        update: jest.fn(),
      });
      gradeService.autoGradeRecord.mockResolvedValue({ objective_score: 80, has_subjective: false });
      const result = await examService.submitExam(1, 10);
      expect(result.objective_score).toBe(80);
      expect(gradeService.autoGradeRecord).toHaveBeenCalledWith(100);
    });

    it('已交卷不可重复提交', async () => {
      ExamRecord.findOne.mockResolvedValue({ id: 100, status: 'submitted' });
      await expect(examService.submitExam(1, 10)).rejects.toThrow('已交卷，不可重复提交');
    });
  });

  // ---------- listStudentExams ----------
  describe('TC-SVC-EXAM-008 listStudentExams 学生考试列表（关联 FR-05-01）', () => {
    it('应返回学生可参加的考试', async () => {
      User.findByPk.mockResolvedValue({ id: 10, role: 'student', class_id: 1 });
      ExamClass.findAll.mockResolvedValue([{ exam_id: 1 }, { exam_id: 2 }]);
      Exam.findAll.mockResolvedValue([
        { id: 1, name: '考1', status: 'published', start_time: new Date(), end_time: new Date(),
          paper: { pass_score: 60 } },
      ]);
      ExamRecord.findOne.mockResolvedValue(null);
      const result = await examService.listStudentExams(10);
      expect(result).toHaveLength(1);
    });

    it('非学生角色应拒绝', async () => {
      User.findByPk.mockResolvedValue({ id: 1, role: 'teacher' });
      await expect(examService.listStudentExams(1)).rejects.toThrow('仅学生可查看考试列表');
    });
  });

  // ---------- getExamRecord ----------
  describe('TC-SVC-EXAM-009 getExamRecord 查看答题记录（关联 FR-05-09）', () => {
    it('阅卷完成后应返回标准答案', async () => {
      ExamRecord.findOne.mockResolvedValue({
        id: 100, exam_id: 1, student_id: 10, status: 'graded', total_score: 80,
        start_time: new Date(), submit_time: new Date(),
        exam: { name: '考' },
      });
      Answer.findAll.mockResolvedValue([
        { id: 1, question_id: 1, student_answer: 'A', score: '2', is_correct: 1, comment: null,
          question: { type: 'single', content: 'q', answer: 'A', analysis: 'x' } },
      ]);
      Exam.findByPk.mockResolvedValue({ paper_id: 1 });
      PaperQuestion.findAll.mockResolvedValue([{ question_id: 1, score: '2' }]);

      const result = await examService.getExamRecord(1, 10);
      expect(result.answers[0].correct_answer).toBe('A');
    });

    it('未阅卷时不应返回标准答案', async () => {
      ExamRecord.findOne.mockResolvedValue({
        id: 100, exam_id: 1, status: 'submitted', total_score: null,
        exam: { name: '考' },
      });
      Answer.findAll.mockResolvedValue([
        { id: 1, question_id: 1, student_answer: 'A', score: null, is_correct: null, comment: null,
          question: { type: 'single', content: 'q', answer: 'A', analysis: 'x' } },
      ]);
      Exam.findByPk.mockResolvedValue({ paper_id: 1 });
      PaperQuestion.findAll.mockResolvedValue([]);

      const result = await examService.getExamRecord(1, 10);
      expect(result.answers[0].correct_answer).toBeNull();
    });
  });
});