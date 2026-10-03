/**
 * 试卷管理集成测试
 * 关联需求：FR-03-01(手动组卷) / FR-03-02(随机组卷) / FR-03-03(设置) / FR-03-06(删除)
 * 关联用例：UC_ManualPaper → UC_PaperConfig → UC_SelectQ → UC_AutoPaper
 * 测试用例：TC-INT-PAPER-001 ~ TC-INT-PAPER-007
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/config', () => ({
  app: { env: 'test' }, jwt: { secret: 'test-secret', expiresIn: '2h' },
  cors: { origins: ['*'] },
  codes: { SUCCESS: 200, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, PAPER_REFERENCED: 3001, BAD_REQUEST: 400 },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

jest.mock('../../src/services/paperService', () => ({
  listPapers: jest.fn(),
  getPaper: jest.fn(),
  createPaper: jest.fn(),
  updatePaper: jest.fn(),
  deletePaper: jest.fn(),
  addQuestions: jest.fn(),
  removeQuestion: jest.fn(),
  autoGenerate: jest.fn(),
}));

const config = require('../../src/config/config');
const paperService = require('../../src/services/paperService');
const { BizError } = require('../../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  const { auth } = require('../../src/middlewares/auth');
  const { requireTeacher } = require('../../src/middlewares/rbac');
  const { errorHandler } = require('../../src/middlewares/errorHandler');
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  app.get('/api/papers', auth(), requireTeacher(), wrap(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await paperService.listPapers({ page, pageSize, offset: (page - 1) * pageSize, limit: pageSize, ...req.query });
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.get('/api/papers/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await paperService.getPaper(parseInt(req.params.id));
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.post('/api/papers', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await paperService.createPaper(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.put('/api/papers/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await paperService.updatePaper(parseInt(req.params.id), req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));
  app.delete('/api/papers/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    await paperService.deletePaper(parseInt(req.params.id));
    res.json({ code: 200, message: 'ok', data: null });
  }));
  app.post('/api/papers/:id/questions', auth(), requireTeacher(), wrap(async (req, res) => {
    await paperService.addQuestions(parseInt(req.params.id), req.body.questions);
    res.json({ code: 200, message: 'ok', data: null });
  }));
  app.post('/api/papers/auto-generate', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await paperService.autoGenerate(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.use(errorHandler);
  return app;
}

const app = buildApp();
const teacherToken = jwt.sign({ userId: 2, role: 'teacher' }, config.jwt.secret);

describe('试卷管理集成测试 - TC-INT-PAPER', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('TC-INT-PAPER-001 试卷列表（关联 FR-03-07）', () => {
    it('教师获取试卷列表', async () => {
      paperService.listPapers.mockResolvedValue({ list: [{ id: 1, name: '卷' }], total: 1, page: 1, pageSize: 10 });
      const res = await request(app).get('/api/papers').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(1);
    });
  });

  describe('TC-INT-PAPER-002 创建试卷（关联 FR-03-01）', () => {
    it('手动创建试卷', async () => {
      paperService.createPaper.mockResolvedValue({ id: 1, name: '新卷' });
      const res = await request(app).post('/api/papers')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: '新卷', total_score: 100, duration: 60, pass_score: 60 });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-PAPER-003 试卷详情（关联 FR-03-04）', () => {
    it('获取试卷含题目', async () => {
      paperService.getPaper.mockResolvedValue({ id: 1, name: '卷', questions: [] });
      const res = await request(app).get('/api/papers/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.questions).toBeDefined();
    });
  });

  describe('TC-INT-PAPER-004 添加题目到试卷（关联 FR-03-01 手动组卷）', () => {
    it('添加题目成功', async () => {
      paperService.addQuestions.mockResolvedValue(true);
      const res = await request(app).post('/api/papers/1/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ questions: [{ question_id: 1, score: 2, sort_order: 0 }] });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-PAPER-005 随机组卷（关联 FR-03-02）', () => {
    it('按规则自动组卷', async () => {
      paperService.autoGenerate.mockResolvedValue({ id: 10, name: '随机卷' });
      const res = await request(app).post('/api/papers/auto-generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: '随机卷', duration: 60, pass_score: 60, rules: [{ type: 'single', count: 5, score: 2 }] });
      expect(res.status).toBe(200);
    });

    it('题库不足应返回错误', async () => {
      paperService.autoGenerate.mockRejectedValue(new BizError(400, '题目不足'));
      const res = await request(app).post('/api/papers/auto-generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'x', duration: 60, pass_score: 60, rules: [{ type: 'single', count: 100, score: 2 }] });
      expect(res.status).toBe(400);
    });
  });

  describe('TC-INT-PAPER-006 删除试卷（关联 FR-03-06）', () => {
    it('未被引用时删除成功', async () => {
      paperService.deletePaper.mockResolvedValue(true);
      const res = await request(app).delete('/api/papers/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
    });

    it('被考试引用时返回 409', async () => {
      paperService.deletePaper.mockRejectedValue(new BizError(3001, '试卷已被考试引用，禁止删除'));
      const res = await request(app).delete('/api/papers/1').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(409);
    });
  });

  describe('TC-INT-PAPER-007 未认证访问应 401', () => {
    it('无 token', async () => {
      const res = await request(app).get('/api/papers');
      expect(res.status).toBe(401);
    });
  });
});