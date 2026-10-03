/**
 * 认证流程集成测试
 * 关联需求：FR-01-01(登录) / FR-01-02(注册) / FR-01-03(权限) / FR-01-05(改密)
 * 关联用例：UC_Login → UC_RBAC → UC_Profile → UC_Pwd
 * 测试用例：TC-INT-AUTH-001 ~ TC-INT-AUTH-008
 *
 * 使用 Supertest 测试 Express app，mock service 层避免依赖真实数据库
 */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// mock config
jest.mock('../../src/config/config', () => ({
  app: { env: 'test', name: 'test', port: 3001 },
  jwt: { secret: 'test-secret', expiresIn: '2h' },
  cors: { origins: ['*'] },
  codes: {
    SUCCESS: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
    NOT_FOUND: 404, CONFLICT: 409, USERNAME_OR_PASSWORD_ERROR: 1001,
    USERNAME_EXISTS: 1002, ACCOUNT_DISABLED: 1003,
  },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

// mock authService
jest.mock('../../src/services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
}));

// mock userService（管理员用户管理）
jest.mock('../../src/services/userService', () => ({
  listUsers: jest.fn(),
  createUser: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  resetPassword: jest.fn(),
}));

const config = require('../../src/config/config');
const authService = require('../../src/services/authService');
const { BizError } = require('../../src/middlewares/errorHandler');

// 构建测试用 Express app（仅加载认证路由）
function buildApp() {
  const app = express();
  app.use(express.json());
  const { auth } = require('../../src/middlewares/auth');
  const { requireAdmin } = require('../../src/middlewares/rbac');
  const { errorHandler } = require('../../src/middlewares/errorHandler');

  // async 路由包装器：自动将异常传递给 errorHandler
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // 登录
  app.post('/api/auth/login', wrap(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 注册
  app.post('/api/auth/register', wrap(async (req, res) => {
    const result = await authService.register(req.body);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 获取个人信息（需认证）
  app.get('/api/auth/profile', auth(), wrap(async (req, res) => {
    const result = await authService.getProfile(req.user.userId);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  // 修改密码（需认证）
  app.put('/api/auth/password', auth(), wrap(async (req, res) => {
    await authService.changePassword(req.user.userId, req.body);
    res.json({ code: 200, message: 'ok', data: null });
  }));

  // 用户列表（需 admin）
  app.get('/api/users', auth(), requireAdmin(), wrap(async (req, res) => {
    const result = await require('../../src/services/userService').listUsers(req.query);
    res.json({ code: 200, message: 'ok', data: result });
  }));

  app.use(errorHandler);
  return app;
}

const app = buildApp();

function genToken(role) {
  return jwt.sign({ userId: 1, role }, config.jwt.secret);
}

describe('认证流程集成测试 - TC-INT-AUTH', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('TC-INT-AUTH-001 登录成功（关联 FR-01-01）', () => {
    it('POST /api/auth/login 正确凭证返回 token', async () => {
      authService.login.mockResolvedValue({
        token: 'mock-token',
        userInfo: { id: 1, username: 'admin', role: 'admin' },
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: '123456' });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.token).toBe('mock-token');
    });
  });

  describe('TC-INT-AUTH-002 登录失败（关联 FR-01-01 异常）', () => {
    it('错误密码返回 401', async () => {
      authService.login.mockRejectedValue(new BizError(1001, '用户名或密码错误'));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(1001);
    });
  });

  describe('TC-INT-AUTH-003 注册成功（关联 FR-01-02）', () => {
    it('POST /api/auth/register 创建用户', async () => {
      authService.register.mockResolvedValue({ id: 10, username: 'new' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'new', password: '123', real_name: '新', role: 'student' });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(10);
    });
  });

  describe('TC-INT-AUTH-004 注册用户名冲突（关联 FR-01-02 异常）', () => {
    it('返回 409', async () => {
      authService.register.mockRejectedValue(new BizError(1002, '用户名已存在'));
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'exist', password: '123', real_name: 'x', role: 'student' });
      expect(res.status).toBe(409);
    });
  });

  describe('TC-INT-AUTH-005 获取个人信息需认证（关联 FR-01-03/NFR-05）', () => {
    it('无 token 返回 401', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('有效 token 返回用户信息', async () => {
      authService.getProfile.mockResolvedValue({ id: 1, username: 'admin' });
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${genToken('admin')}`);
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('admin');
    });
  });

  describe('TC-INT-AUTH-006 修改密码（关联 FR-01-05）', () => {
    it('有效 token + 正确旧密码应成功', async () => {
      authService.changePassword.mockResolvedValue(true);
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${genToken('student')}`)
        .send({ old_password: 'old', new_password: 'new' });
      expect(res.status).toBe(200);
    });

    it('无 token 应 401', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .send({ old_password: 'old', new_password: 'new' });
      expect(res.status).toBe(401);
    });
  });

  describe('TC-INT-AUTH-007 RBAC 权限控制（关联 FR-01-03）', () => {
    it('admin 访问 /api/users 应通过', async () => {
      const userService = require('../../src/services/userService');
      userService.listUsers.mockResolvedValue({ list: [], total: 0 });
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${genToken('admin')}`);
      expect(res.status).toBe(200);
    });

    it('student 访问 /api/users 应 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${genToken('student')}`);
      expect(res.status).toBe(403);
    });

    it('teacher 访问 /api/users 应 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${genToken('teacher')}`);
      expect(res.status).toBe(403);
    });
  });

  describe('TC-INT-AUTH-008 完整登录→访问→鉴权流程', () => {
    it('登录获取 token 后访问受保护接口', async () => {
      authService.login.mockResolvedValue({
        token: genToken('teacher'),
        userInfo: { id: 2, role: 'teacher' },
      });
      authService.getProfile.mockResolvedValue({ id: 2, role: 'teacher' });

      // 1. 登录
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'teacher', password: '123' });
      expect(loginRes.body.data.token).toBeDefined();

      // 2. 用 token 访问个人信息
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.role).toBe('teacher');
    });
  });
});