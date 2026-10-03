/**
 * 成绩统计集成测试
 * 关联需求：FR-07-01(个人成绩) / FR-07-02(班级成绩) / FR-07-03(分布) / FR-07-05(导出) / FR-07-06(错题)
 * 关联用例：UC_PersonalScore → UC_ClassScore → UC_ScoreDist → UC_ScoreExport → UC_WrongQ
 * 测试用例：TC-INT-SCORE-001 ~ TC-INT-SCORE-007
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/config', () => ({
  app: { env: 'test' }, jwt: { secret: 'test-secret', expiresIn: '2h' },
  cors: { origins: ['*'] },
  codes: { SUCCESS: 200, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404 },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

jest.mock('../../src/services/scoreService', () => ({
  getPersonalScores: jest.fn(),
  getClassScores: jest.fn(),
  getStatistics: jest.fn(),
  exportScores: jest.fn(),
  getWrongQuestions: jest.fn(),
}));

const config = require('../../src/config/config');
const scoreService = require('../../src/services/scoreService');
const { BizError } = require('../../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  const { auth } = require('../../src/middlewares/auth');
  const { requireTeacher, requireStudent } = require('../../src/middlewares/rbac');
  const { errorHandler } = require('../../src/middlewares/errorHandler');
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // 学生：个人成绩
  app.get('/api/student/scores', auth(), requireStudent(), wrap(async (req, res) => {
    const result = await scoreService.getPersonalScores(req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  // 学生：错题统计
  app.get('/api/student/wrong-questions', auth(), requireStudent(), wrap(async (req, res) => {
    const examId = req.query.exam_id ? parseInt(req.query.exam_id) : null;
    const result = await scoreService.getWrongQuestions(req.user.userId, examId);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 教师：班级成绩
  app.get('/api/scores/class/:classId/exam/:examId', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await scoreService.getClassScores(parseInt(req.params.classId), parseInt(req.params.examId));
    res.json({ code: 200, message: 'ok', data: result });
  }));
  // 教师：成绩统计
  app.get('/api/scores/statistics/:examId', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await scoreService.getStatistics(parseInt(req.params.examId));
    res.json({ code: 200, message: 'ok', data: result });
  }));
  // 教师：成绩单导出
  app.get('/api/scores/export', auth(), requireTeacher(), wrap(async (req, res) => {
    const buf = await scoreService.exportScores(parseInt(req.query.exam_id), parseInt(req.query.class_id));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  }));

  app.use(errorHandler);
  return app;
}

const app = buildApp();
const teacherToken = jwt.sign({ userId: 2, role: 'teacher' }, config.jwt.secret);
const studentToken = jwt.sign({ userId: 10, role: 'student' }, config.jwt.secret);

describe('成绩统计集成测试 - TC-INT-SCORE', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('TC-INT-SCORE-001 个人成绩查询（关联 FR-07-01）', () => {
    it('学生获取本人成绩', async () => {
      scoreService.getPersonalScores.mockResolvedValue([
        { exam_id: 1, exam_name: '考', total_score: 80, is_pass: true },
      ]);
      const res = await request(app).get('/api/student/scores').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data[0].total_score).toBe(80);
    });

    it('教师访问学生成绩应 403', async () => {
      const res = await request(app).get('/api/student/scores').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('TC-INT-SCORE-002 班级成绩查看（关联 FR-07-02）', () => {
    it('教师查看班级成绩', async () => {
      scoreService.getClassScores.mockResolvedValue([
        { student_id: 10, student_name: '学生A', total_score: 85 },
      ]);
      const res = await request(app).get('/api/scores/class/1/exam/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('班级不存在返回 404', async () => {
      scoreService.getClassScores.mockRejectedValue(new BizError(404, '班级不存在'));
      const res = await request(app).get('/api/scores/class/999/exam/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('TC-INT-SCORE-003 成绩分布统计（关联 FR-07-03/FR-07-04）', () => {
    it('返回分布与指标', async () => {
      scoreService.getStatistics.mockResolvedValue({
        max_score: 95, min_score: 55, avg_score: 75, pass_rate: 80,
        std_deviation: 15, distribution: [{ range: '0-59', count: 1 }],
      });
      const res = await request(app).get('/api/scores/statistics/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.pass_rate).toBe(80);
    });
  });

  describe('TC-INT-SCORE-004 成绩单导出（关联 FR-07-05）', () => {
    it('返回 Excel 文件', async () => {
      scoreService.exportScores.mockResolvedValue(Buffer.from('excel'));
      const res = await request(app).get('/api/scores/export?exam_id=1&class_id=1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('TC-INT-SCORE-005 错题统计（关联 FR-07-06）', () => {
    it('学生查看错题', async () => {
      scoreService.getWrongQuestions.mockResolvedValue([
        { exam_id: 1, question_id: 1, content: '题', correct_answer: 'A' },
      ]);
      const res = await request(app).get('/api/student/wrong-questions').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('按考试筛选错题', async () => {
      scoreService.getWrongQuestions.mockResolvedValue([]);
      const res = await request(app).get('/api/student/wrong-questions?exam_id=1').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(scoreService.getWrongQuestions).toHaveBeenCalledWith(10, 1);
    });
  });

  describe('TC-INT-SCORE-006 未认证应 401', () => {
    it('无 token 访问成绩', async () => {
      const res = await request(app).get('/api/student/scores');
      expect(res.status).toBe(401);
    });
  });

  describe('TC-INT-SCORE-007 完整成绩查询流程', () => {
    it('学生查看成绩→查看错题', async () => {
      scoreService.getPersonalScores.mockResolvedValue([{ exam_id: 1, total_score: 80 }]);
      scoreService.getWrongQuestions.mockResolvedValue([{ question_id: 2 }]);

      const scores = await request(app).get('/api/student/scores').set('Authorization', `Bearer ${studentToken}`);
      expect(scores.body.data[0].total_score).toBe(80);

      const wrong = await request(app).get('/api/student/wrong-questions').set('Authorization', `Bearer ${studentToken}`);
      expect(wrong.body.data).toHaveLength(1);
    });
  });
});