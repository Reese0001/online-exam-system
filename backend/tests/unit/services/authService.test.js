/**
 * 认证服务单元测试
 * 关联需求：FR-01-01(登录) / FR-01-02(注册) / FR-01-04(个人信息) / FR-01-05(修改密码)
 * 关联用例：UC_Login / UC_Profile / UC_Pwd / UC_RBAC
 * 测试用例：TC-SVC-AUTH-001 ~ TC-SVC-AUTH-012
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// mock models
jest.mock('../../../src/models', () => {
  const User = {
    scope: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  const Class = { findByPk: jest.fn() };
  return { User, Class };
});

// mock config
jest.mock('../../../src/config/config', () => ({
  jwt: { secret: 'test-secret', expiresIn: '2h' },
  codes: {
    USERNAME_OR_PASSWORD_ERROR: 1001,
    USERNAME_EXISTS: 1002,
    ACCOUNT_DISABLED: 1003,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
  },
  roles: { ADMIN: 'admin', TEACHER: 'teacher', STUDENT: 'student' },
  app: { env: 'test' },
}));

const authService = require('../../../src/services/authService');
const { User } = require('../../../src/models');

describe('authService - TC-SVC-AUTH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- login ----------
  describe('TC-SVC-AUTH-001 login 登录成功（关联 FR-01-01）', () => {
    it('正确账号密码应返回 token 和 userInfo', async () => {
      const hash = await bcrypt.hash('123456', 10);
      const mockUser = {
        id: 1,
        username: 'admin',
        password_hash: hash,
        real_name: '管理员',
        role: 'admin',
        email: null,
        phone: null,
        class_id: null,
        status: 'active',
        created_at: new Date(),
        toJSON() {
          return {
            id: 1, username: 'admin', password_hash: hash, real_name: '管理员',
            role: 'admin', email: null, phone: null, class_id: null, status: 'active',
            created_at: this.created_at,
          };
        },
      };
      User.scope.mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await authService.login({ username: 'admin', password: '123456' });

      expect(result.token).toBeDefined();
      expect(result.userInfo.username).toBe('admin');
      expect(result.userInfo.role).toBe('admin');
      // token 不应包含密码哈希
      expect(result.userInfo.password_hash).toBeUndefined();
    });
  });

  describe('TC-SVC-AUTH-002 login 用户不存在（关联 FR-01-01 异常）', () => {
    it('应抛出 USERNAME_OR_PASSWORD_ERROR', async () => {
      User.scope.mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      });
      await expect(authService.login({ username: 'nouser', password: '123' }))
        .rejects.toThrow('用户名或密码错误');
    });
  });

  describe('TC-SVC-AUTH-003 login 密码错误（关联 FR-01-01 异常）', () => {
    it('应抛出 USERNAME_OR_PASSWORD_ERROR', async () => {
      const hash = await bcrypt.hash('correct', 10);
      User.scope.mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue({
          id: 1, username: 'u', password_hash: hash, status: 'active',
          toJSON: () => ({ id: 1, username: 'u', password_hash: hash, status: 'active' }),
        }),
      });
      await expect(authService.login({ username: 'u', password: 'wrong' }))
        .rejects.toThrow('用户名或密码错误');
    });
  });

  describe('TC-SVC-AUTH-004 login 账号已禁用（关联 FR-01-06）', () => {
    it('应抛出 ACCOUNT_DISABLED', async () => {
      const hash = await bcrypt.hash('123', 10);
      User.scope.mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue({
          id: 1, username: 'u', password_hash: hash, status: 'disabled',
          toJSON: () => ({ id: 1, username: 'u', password_hash: hash, status: 'disabled' }),
        }),
      });
      await expect(authService.login({ username: 'u', password: '123' }))
        .rejects.toThrow('账号已禁用');
    });
  });

  // ---------- register ----------
  describe('TC-SVC-AUTH-005 register 注册成功（关联 FR-01-02）', () => {
    it('应创建用户并返回 userInfo（不含密码）', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 10, username: 'newuser', real_name: '新用户', role: 'student',
        email: null, phone: null, class_id: null, status: 'active',
        toJSON: () => ({
          id: 10, username: 'newuser', real_name: '新用户', role: 'student',
          email: null, phone: null, class_id: null, status: 'active',
        }),
      });

      const result = await authService.register({
        username: 'newuser', password: '123456', real_name: '新用户', role: 'student',
      });

      expect(result.username).toBe('newuser');
      expect(result.password_hash).toBeUndefined();
      expect(User.create).toHaveBeenCalled();
      // 密码应被加密
      const createArg = User.create.mock.calls[0][0];
      expect(createArg.password_hash).not.toBe('123456');
    });
  });

  describe('TC-SVC-AUTH-006 register 用户名已存在（关联 FR-01-02 异常）', () => {
    it('应抛出 USERNAME_EXISTS', async () => {
      User.findOne.mockResolvedValue({ id: 1, username: 'exist' });
      await expect(authService.register({
        username: 'exist', password: '123', real_name: 'x', role: 'student',
      })).rejects.toThrow('用户名已存在');
    });
  });

  // ---------- getProfile ----------
  describe('TC-SVC-AUTH-007 getProfile 获取用户信息（关联 FR-01-04）', () => {
    it('应返回用户信息（含班级名）', async () => {
      User.findByPk.mockResolvedValue({
        id: 1, username: 'stu', real_name: '学生', role: 'student',
        email: null, phone: null, class_id: 1, status: 'active',
        class: { id: 1, name: '一班' },
        toJSON: () => ({
          id: 1, username: 'stu', real_name: '学生', role: 'student',
          email: null, phone: null, class_id: 1, status: 'active',
          class: { id: 1, name: '一班' },
        }),
      });
      const result = await authService.getProfile(1);
      expect(result.username).toBe('stu');
      expect(result.class_name).toBe('一班');
    });

    it('用户不存在应抛出 NOT_FOUND', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(authService.getProfile(999)).rejects.toThrow('用户不存在');
    });
  });

  // ---------- updateProfile ----------
  describe('TC-SVC-AUTH-008 updateProfile 修改个人信息（关联 FR-01-04）', () => {
    it('应调用 update 更新字段', async () => {
      const update = jest.fn();
      User.findByPk.mockResolvedValue({
        id: 1, real_name: '旧', email: null, phone: null,
        update,
        toJSON: () => ({ id: 1, real_name: '新', email: 'e@e.com', phone: '123' }),
      });
      await authService.updateProfile(1, { real_name: '新', email: 'e@e.com' });
      expect(update).toHaveBeenCalledWith({ real_name: '新', email: 'e@e.com' });
    });

    it('用户不存在应抛出 NOT_FOUND', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(authService.updateProfile(999, {})).rejects.toThrow('用户不存在');
    });
  });

  // ---------- changePassword ----------
  describe('TC-SVC-AUTH-009 changePassword 修改密码成功（关联 FR-01-05）', () => {
    it('旧密码正确应更新为新哈希', async () => {
      const oldHash = await bcrypt.hash('old123', 10);
      const update = jest.fn();
      User.scope.mockReturnValueOnce({
        findByPk: jest.fn().mockResolvedValue({
          id: 1, password_hash: oldHash, update,
        }),
      });
      const result = await authService.changePassword(1, {
        old_password: 'old123', new_password: 'new456',
      });
      expect(result).toBe(true);
      expect(update).toHaveBeenCalled();
      const newHash = update.mock.calls[0][0].password_hash;
      expect(newHash).not.toBe(oldHash);
      expect(await bcrypt.compare('new456', newHash)).toBe(true);
    });
  });

  describe('TC-SVC-AUTH-010 changePassword 旧密码错误（关联 FR-01-05 异常）', () => {
    it('应抛出旧密码错误', async () => {
      const hash = await bcrypt.hash('correct', 10);
      User.scope.mockReturnValueOnce({
        findByPk: jest.fn().mockResolvedValue({
          id: 1, password_hash: hash, update: jest.fn(),
        }),
      });
      await expect(authService.changePassword(1, {
        old_password: 'wrong', new_password: 'new',
      })).rejects.toThrow('旧密码错误');
    });
  });

  describe('TC-SVC-AUTH-011 changePassword 用户不存在', () => {
    it('应抛出 NOT_FOUND', async () => {
      User.scope.mockReturnValueOnce({
        findByPk: jest.fn().mockResolvedValue(null),
      });
      await expect(authService.changePassword(999, {
        old_password: 'a', new_password: 'b',
      })).rejects.toThrow('用户不存在');
    });
  });

  // ---------- toUserInfo ----------
  describe('TC-SVC-AUTH-012 toUserInfo DTO 转换', () => {
    it('应剔除 password_hash 并保留必要字段', () => {
      const info = authService.toUserInfo({
        toJSON: () => ({
          id: 1, username: 'u', real_name: '名', role: 'student',
          email: 'e', phone: 'p', class_id: 1, status: 'active',
          password_hash: 'secret', created_at: '2026-01-01',
          class: { name: '一班' },
        }),
      });
      expect(info.id).toBe(1);
      expect(info.username).toBe('u');
      expect(info.class_name).toBe('一班');
      expect(info.password_hash).toBeUndefined();
    });

    it('传入 null 应返回 null', () => {
      expect(authService.toUserInfo(null)).toBeNull();
    });
  });
});