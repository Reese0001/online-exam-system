/**
 * 题库管理集成测试
 * 关联需求：FR-02-01~FR-02-07（题目CRUD/批量导入导出/查询）
 * 关联用例：UC_QAdd → UC_QEdit → UC_QQuery → UC_QDel → UC_QImport
 * 测试用例：TC-INT-Q-001 ~ TC-INT-Q-009
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/config', () => ({
  app: { env: 'test' }, jwt: { secret: 'test-secret', expiresIn: '2h' },
  cors: { origins: ['*'] },
  codes: {
    SUCCESS: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
    NOT_FOUND: 404, CONFLICT: 409, QUESTION_REFERENCED: 2001,
  },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

jest.mock('../../src/services/questionService', () => ({
  listQuestions: jest.fn(),
  getQuestion: jest.fn(),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  importQuestions: jest.fn(),
  exportQuestions: jest.fn(),
}));

const config = require('../../src/config/config');
const questionService = require('../../src/services/questionService');
const { BizError } = require('../../src/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  const { auth } = require('../../src/middlewares/auth');
  const { requireTeacher } = require('../../src/middlewares/rbac');
  const { errorHandler } = require('../../src/middlewares/errorHandler');
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  app.get('/api/questions', auth(), requireTeacher(), wrap(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const result = await questionService.listQuestions({
      page, pageSize, offset: (page - 1) * pageSize, limit: pageSize,
      ...req.query,
    });
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 注意：export/import 路由必须放在 :id 路由之前，避免被 :id 匹配
  app.get('/api/questions/export', auth(), requireTeacher(), wrap(async (req, res) => {
    const buf = await questionService.exportQuestions(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  }));

  app.post('/api/questions/import', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await questionService.importQuestions(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.get('/api/questions/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await questionService.getQuestion(parseInt(req.params.id));
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.post('/api/questions', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await questionService.createQuestion(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.put('/api/questions/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    const result = await questionService.updateQuestion(parseInt(req.params.id), req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.delete('/api/questions/:id', auth(), requireTeacher(), wrap(async (req, res) => {
    await questionService.deleteQuestion(parseInt(req.params.id));
    res.json({ code: 200, message: 'ok', data: null });
  }));

  app.use(errorHandler);
  return app;
}

const app = buildApp();
const teacherToken = jwt.sign({ userId: 2, role: 'teacher' }, config.jwt.secret);
const studentToken = jwt.sign({ userId: 10, role: 'student' }, config.jwt.secret);

describe('题库管理集成测试 - TC-INT-Q', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('TC-INT-Q-001 题目列表查询（关联 FR-02-04）', () => {
    it('教师应获取分页列表', async () => {
      questionService.listQuestions.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 });
      const res = await request(app)
        .get('/api/questions?page=1&pageSize=10&type=single')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    it('学生应 403', async () => {
      const res = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('TC-INT-Q-002 新增题目（关联 FR-02-01）', () => {
    it('教师创建单选题', async () => {
      questionService.createQuestion.mockResolvedValue({ id: 1, type: 'single' });
      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ type: 'single', content: '1+1=?', answer: 'B', difficulty: 1, score: 2 });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });
  });

  describe('TC-INT-Q-003 题目详情（关联 FR-02-05）', () => {
    it('应返回题目详情', async () => {
      questionService.getQuestion.mockResolvedValue({ id: 1, content: '题' });
      const res = await request(app)
        .get('/api/questions/1')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('题');
    });

    it('题目不存在返回 404', async () => {
      questionService.getQuestion.mockRejectedValue(new BizError(404, '题目不存在'));
      const res = await request(app)
        .get('/api/questions/999')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('TC-INT-Q-004 修改题目（关联 FR-02-02）', () => {
    it('应更新成功', async () => {
      questionService.updateQuestion.mockResolvedValue({ id: 1 });
      const res = await request(app)
        .put('/api/questions/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ content: '新题干' });
      expect(res.status).toBe(200);
    });
  });

  describe('TC-INT-Q-005 删除题目（关联 FR-02-03）', () => {
    it('未被引用时删除成功', async () => {
      questionService.deleteQuestion.mockResolvedValue(true);
      const res = await request(app)
        .delete('/api/questions/1')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
    });

    it('被试卷引用时返回 409', async () => {
      questionService.deleteQuestion.mockRejectedValue(new BizError(2001, '题目已被试卷引用，禁止删除'));
      const res = await request(app)
        .delete('/api/questions/1')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(409);
    });
  });

  describe('TC-INT-Q-006 批量导入（关联 FR-02-06）', () => {
    it('应返回导入结果', async () => {
      questionService.importQuestions.mockResolvedValue({ success_count: 5, fail_count: 1, errors: [] });
      const res = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ file: 'base64data' });
      expect(res.status).toBe(200);
      expect(res.body.data.success_count).toBe(5);
    });
  });

  describe('TC-INT-Q-007 批量导出（关联 FR-02-07）', () => {
    it('应返回 Excel 文件', async () => {
      questionService.exportQuestions.mockResolvedValue(Buffer.from('excel-data'));
      const res = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('TC-INT-Q-008 未认证访问应 401', () => {
    it('无 token 访问题目列表', async () => {
      const res = await request(app).get('/api/questions');
      expect(res.status).toBe(401);
    });
  });

  describe('TC-INT-Q-009 完整 CRUD 流程', () => {
    it('创建→查询→修改→删除', async () => {
      questionService.createQuestion.mockResolvedValue({ id: 100, content: '新题' });
      questionService.getQuestion.mockResolvedValue({ id: 100, content: '新题' });
      questionService.updateQuestion.mockResolvedValue({ id: 100, content: '改后' });
      questionService.deleteQuestion.mockResolvedValue(true);

      // 创建
      const c = await request(app).post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ type: 'single', content: '新题', answer: 'A', difficulty: 1, score: 2 });
      expect(c.body.data.id).toBe(100);

      // 查询
      const g = await request(app).get('/api/questions/100')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(g.body.data.content).toBe('新题');

      // 修改
      const u = await request(app).put('/api/questions/100')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ content: '改后' });
      expect(u.status).toBe(200);

      // 删除
      const d = await request(app).delete('/api/questions/100')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(d.status).toBe(200);
    });
  });
});