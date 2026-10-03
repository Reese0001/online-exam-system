/**
 * RBAC 权限中间件单元测试
 * 关联需求：FR-01-03(角色权限控制) / NFR-06(RBAC鉴权)
 * 关联用例：UC_RBAC
 * 测试用例：TC-MW-RBAC-001 ~ TC-MW-RBAC-008
 */
jest.mock('../../../src/config/config', () => ({
  codes: { UNAUTHORIZED: 401, FORBIDDEN: 403 },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
}));

jest.mock('../../../src/utils/response', () => ({
  fail: jest.fn((res, code, message, data, status) => {
    res.statusCode = status || 400;
    res.body = { code, message, data };
    return res;
  }),
}));

const rbac = require('../../../src/middlewares/rbac');
const { fail } = require('../../../src/utils/response');
const config = require('../../../src/config/config');

describe('rbac 中间件 - TC-MW-RBAC', () => {
  beforeEach(() => jest.clearAllMocks());

  const createCtx = (role) => ({
    req: { user: role ? { userId: 1, role } : null },
    res: {},
    next: jest.fn(),
  });

  describe('TC-MW-RBAC-001 requireRole 角色匹配应放行', () => {
    it('admin 访问 admin 接口应通过', () => {
      const { req, res, next } = createCtx('admin');
      rbac.requireRole('admin')(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-RBAC-002 requireRole 角色不匹配应 403', () => {
    it('student 访问 admin 接口应拒绝', () => {
      const { req, res, next } = createCtx('student');
      rbac.requireRole('admin')(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(fail).toHaveBeenCalledWith(res, 403, '无权限访问该资源', null, 403);
    });
  });

  describe('TC-MW-RBAC-003 未认证应 401', () => {
    it('req.user 为 null 应拒绝', () => {
      const { req, res, next } = createCtx(null);
      rbac.requireRole('admin')(req, res, next);
      expect(fail).toHaveBeenCalledWith(res, 401, '未认证', null, 401);
    });
  });

  describe('TC-MW-RBAC-004 requireAdmin 快捷方法', () => {
    it('仅 admin 通过', () => {
      const { req, res, next } = createCtx('admin');
      rbac.requireAdmin()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('teacher 拒绝', () => {
      const { req, res, next } = createCtx('teacher');
      rbac.requireAdmin()(req, res, next);
      expect(fail).toHaveBeenCalled();
    });
  });

  describe('TC-MW-RBAC-005 requireTeacher 快捷方法', () => {
    it('teacher 通过', () => {
      const { req, res, next } = createCtx('teacher');
      rbac.requireTeacher()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-RBAC-006 requireStudent 快捷方法', () => {
    it('student 通过', () => {
      const { req, res, next } = createCtx('student');
      rbac.requireStudent()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('TC-MW-RBAC-007 requireAdminOrTeacher 多角色', () => {
    it('admin 通过', () => {
      const { req, res, next } = createCtx('admin');
      rbac.requireAdminOrTeacher()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('teacher 通过', () => {
      const { req, res, next } = createCtx('teacher');
      rbac.requireAdminOrTeacher()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('student 拒绝', () => {
      const { req, res, next } = createCtx('student');
      rbac.requireAdminOrTeacher()(req, res, next);
      expect(fail).toHaveBeenCalled();
    });
  });

  describe('TC-MW-RBAC-008 requireTeacherOrStudent 多角色', () => {
    it('teacher 通过', () => {
      const { req, res, next } = createCtx('teacher');
      rbac.requireTeacherOrStudent()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('student 通过', () => {
      const { req, res, next } = createCtx('student');
      rbac.requireTeacherOrStudent()(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('admin 拒绝', () => {
      const { req, res, next } = createCtx('admin');
      rbac.requireTeacherOrStudent()(req, res, next);
      expect(fail).toHaveBeenCalled();
    });
  });
});