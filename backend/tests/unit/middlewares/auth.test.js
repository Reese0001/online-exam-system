/**
 * 认证中间件单元测试
 * 关联需求：FR-01-01(登录) / FR-01-03(权限) / NFR-05(JWT认证)
 * 关联用例：UC_Login / UC_RBAC
 * 测试用例：TC-MW-AUTH-001 ~ TC-MW-AUTH-007
 */
const jwt = require('jsonwebtoken');

jest.mock('../../../src/config/config', () => ({
  jwt: { secret: 'test-secret', expiresIn: '2h' },
  codes: { UNAUTHORIZED: 401 },
}));

jest.mock('../../../src/utils/response', () => ({
  fail: jest.fn((res, code, message, data, status) => {
    res.statusCode = status || 400;
    res.body = { code, message, data };
    return res;
  }),
}));

const { auth, optionalAuth } = require('../../../src/middlewares/auth');
const { fail } = require('../../../src/utils/response');
const config = require('../../../src/config/config');

describe('auth 中间件 - TC-MW-AUTH', () => {
  beforeEach(() => jest.clearAllMocks());

  const createReqRes = (token) => ({
    req: { headers: token ? { authorization: `Bearer ${token}` } : {} },
    res: { statusCode: 200, body: null },
    next: jest.fn(),
  });

  describe('TC-MW-AUTH-001 有效 token（关联 NFR-05）', () => {
    it('应解析并挂载 req.user', () => {
      const token = jwt.sign({ userId: 1, role: 'admin' }, config.jwt.secret);
      const { req, res, next } = createReqRes(token);
      auth()(req, res, next);
      expect(req.user).toEqual({ userId: 1, role: 'admin' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-AUTH-002 缺少 token', () => {
    it('必认证模式应返回 401', () => {
      const { req, res, next } = createReqRes(null);
      auth()(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(fail).toHaveBeenCalledWith(res, expect.any(Number), '未认证或令牌缺失', null, 401);
    });
  });

  describe('TC-MW-AUTH-003 无效 token', () => {
    it('应返回 401 令牌无效', () => {
      const { req, res, next } = createReqRes('invalid.token.here');
      auth()(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(fail).toHaveBeenCalledWith(res, expect.any(Number), '令牌无效', null, 401);
    });
  });

  describe('TC-MW-AUTH-004 过期 token', () => {
    it('应返回 401 令牌已过期', () => {
      const token = jwt.sign({ userId: 1, role: 'admin' }, config.jwt.secret, { expiresIn: '-1s' });
      const { req, res, next } = createReqRes(token);
      auth()(req, res, next);
      expect(fail).toHaveBeenCalledWith(res, expect.any(Number), '令牌已过期，请重新登录', null, 401);
    });
  });

  describe('TC-MW-AUTH-005 可选认证 - 无 token 不报错', () => {
    it('optionalAuth 未携带 token 应放行', () => {
      const { req, res, next } = createReqRes(null);
      optionalAuth()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-AUTH-006 可选认证 - 有效 token 仍解析', () => {
    it('optionalAuth 携带有效 token 应挂载 req.user', () => {
      const token = jwt.sign({ userId: 2, role: 'student' }, config.jwt.secret);
      const { req, res, next } = createReqRes(token);
      optionalAuth()(req, res, next);
      expect(req.user.userId).toBe(2);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-AUTH-007 Authorization 格式非 Bearer', () => {
    it('应视为无 token', () => {
      const { req, res, next } = { req: { headers: { authorization: 'Basic abc' } }, res: {}, next: jest.fn() };
      auth()(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(fail).toHaveBeenCalled();
    });
  });
});