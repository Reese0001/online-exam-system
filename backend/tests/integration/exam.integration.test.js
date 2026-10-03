/**
 * 考试流程集成测试
 * 关联需求：FR-04-01(发布) / FR-05-02(进入考试) / FR-05-04(暂存) / FR-05-08(交卷) / FR-06-01(自动阅卷)
 * 关联用例：UC_PublishExam → UC_EnterExam → UC_Answer → UC_SaveAnswer → UC_Submit → UC_AutoGrade
 * 测试用例：TC-INT-EXAM-001 ~ TC-INT-EXAM-009
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/config', () => ({
  app: { env: 'test' }, jwt: { secret: 'test-secret', expiresIn: '2h' },
  cors: { origins: ['*'] },
  codes: {
    SUCCESS: 200, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, BAD_REQUEST: 400,
    EXAM_NOT_IN_WINDOW: 4001, EXAM_ALREADY_SUBMITTED: 4002, EXAM_ONGOING: 4003,
  },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

jest.mock('../../src/services/examService', () => ({
  listExams: jest.fn(), getExam: jest.fn(), createExam: jest.fn(),
  updateExam: jest.fn(), deleteExam: jest.fn(), publishExam: jest.fn(),
  setExamClasses: jest.fn(), listExamStudents: jest.fn(),
  listStudentExams: jest.fn(), startExam: jest.fn(),
  saveAnswer: jest.fn(), submitExam: jest.fn(), getExamRecord: jest.fn(),
}));

jest.mock('../../src/services/gradeService', () => ({
  listGradeTasks: jest.fn(), getGradeTask: jest.fn(),
  gradeAnswers: jest.fn(), getGradeProgress: jest.fn(),
}));

const config = require('../../src/config/config');
const examService = require('../../src/services/examService');
const gradeService = require('../../src/services/gradeService');
const { BizError } = require('../../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  const { auth } = require('../../src/middlewares/auth');
  const { requireTeacher, requireStudent } = require('../../src/middlewares/rbac');
  const { errorHandler } = require('../../src/middlewares/errorHandler');
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // 教师端
  app.get('/api/exams', auth(), requireTeacher(), wrap(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await examService.listExams({ page, pageSize, offset: (page - 1) * pageSize, limit: pageSize, ...req.query });
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.post('/api/exams', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await examService.createExam(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.post('/api/exams/:id/publish', auth(), requireTeacher(), wrap(async (req, res) => {
    await examService.publishExam(parseInt(req.params.id));
    res.json({ code: 200, message: 'ok', data: null });
  }));

  // 学生端
  app.get('/api/student/exams', auth(), requireStudent(), wrap(async (req, res) => {
    const result = await examService.listStudentExams(req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.post('/api/student/exams/:id/start', auth(), requireStudent(), wrap(async (req, res) => {
    const result = await examService.startExam(parseInt(req.params.id), req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.post('/api/student/exams/:id/answer', auth(), requireStudent(), wrap(async (req, res) => {
    await examService.saveAnswer(parseInt(req.params.id), req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: null });
  }));
  app.post('/api/student/exams/:id/submit', auth(), requireStudent(), wrap(async (req, res) => {
    const result = await examService.submitExam(parseInt(req.params.id), req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.get('/api/student/exams/:id/record', auth(), requireStudent(), wrap(async (req, res) => {
    const result = await examService.getExamRecord(parseInt(req.params.id), req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 阅卷
  app.post('/api/grade/answers', auth(), requireTeacher(), wrap(async (req, res) => {
    await gradeService.gradeAnswers(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: null });
  }));

  app.use(errorHandler);
  return app;
}

const app = buildApp();
const teacherToken = jwt.sign({ userId: 2, role: 'teacher' }, config.jwt.secret);
const studentToken = jwt.sign({ userId: 10, role: 'student' }, config.jwt.secret);

describe('考试流程集成测试 - TC-INT-EXAM', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('TC-INT-EXAM-001 教师创建考试（关联 FR-04-01）', () => {
    it('创建考试成功', async () => {
      examService.createExam.mockResolvedValue({ id: 1, name: '期末' });
      const res = await request(app).post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ paper_id: 1, name: '期末', start_time: '2026-01-01', end_time: '2026-12-31', class_ids: [1] });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-EXAM-002 发布考试（关联 FR-04-01）', () => {
    it('发布成功', async () => {
      examService.publishExam.mockResolvedValue(true);
      const res = await request(app).post('/api/exams/1/publish').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-EXAM-003 学生查看考试列表（关联 FR-05-01）', () => {
    it('学生获取可参加考试', async () => {
      examService.listStudentExams.mockResolvedValue([{ exam_id: 1, name: '考' }]);
      const res = await request(app).get('/api/student/exams').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('教师访问学生端应 403', async () => {
      const res = await request(app).get('/api/student/exams').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('TC-INT-EXAM-004 进入考试（关联 FR-05-02）', () => {
    it('返回试卷与剩余时间', async () => {
      examService.startExam.mockResolvedValue({
        exam_record_id: 100, paper: { id: 1, questions: [] }, remain_seconds: 3600,
      });
      const res = await request(app).post('/api/student/exams/1/start').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.remain_seconds).toBe(3600);
    });

    it('不在参考范围应 403', async () => {
      examService.startExam.mockRejectedValue(new BizError(403, '您不在此考试的参考范围内'));
      const res = await request(app).post('/api/student/exams/1/start').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('TC-INT-EXAM-005 答案暂存（关联 FR-05-04）', () => {
    it('暂存成功', async () => {
      examService.saveAnswer.mockResolvedValue(true);
      const res = await request(app).post('/api/student/exams/1/answer')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ question_id: 1, student_answer: 'A' });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-EXAM-006 交卷（关联 FR-05-08）', () => {
    it('交卷成功并返回客观题得分', async () => {
      examService.submitExam.mockResolvedValue({ exam_record_id: 100, objective_score: 80, has_subjective: false });
      const res = await request(app).post('/api/student/exams/1/submit').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.objective_score).toBe(80);
    });

    it('重复交卷应 409', async () => {
      examService.submitExam.mockRejectedValue(new BizError(4002, '已交卷，不可重复提交'));
      const res = await request(app).post('/api/student/exams/1/submit').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(409);
    });
  });

  describe('TC-INT-EXAM-007 查看答题记录（关联 FR-05-09）', () => {
    it('返回答题详情', async () => {
      examService.getExamRecord.mockResolvedValue({ exam_record_id: 100, answers: [] });
      const res = await request(app).get('/api/student/exams/1/record').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-EXAM-008 手动阅卷（关联 FR-06-02）', () => {
    it('教师评分成功', async () => {
      gradeService.gradeAnswers.mockResolvedValue(true);
      const res = await request(app).post('/api/grade/answers')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ exam_record_id: 100, answers: [{ answer_id: 1, score: 4 }] });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-EXAM-009 完整考试流程', () => {
    it('进入→暂存→交卷', async () => {
      examService.startExam.mockResolvedValue({ exam_record_id: 100, paper: { questions: [] }, remain_seconds: 3600 });
      examService.saveAnswer.mockResolvedValue(true);
      examService.submitExam.mockResolvedValue({ exam_record_id: 100, objective_score: 60, has_subjective: false });

      // 1. 进入考试
      const start = await request(app).post('/api/student/exams/1/start').set('Authorization', `Bearer ${studentToken}`);
      expect(start.body.data.exam_record_id).toBe(100);

      // 2. 暂存答案
      const save = await request(app).post('/api/student/exams/1/answer')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ question_id: 1, student_answer: 'A' });
      expect(save.status).toBe(200);

      // 3. 交卷
      const submit = await request(app).post('/api/student/exams/1/submit').set('Authorization', `Bearer ${studentToken}`);
      expect(submit.body.data.objective_score).toBe(60);
    });
  });
});