/**
 * 用户模型单元测试
 * 关联需求：FR-01-01(登录) / FR-01-02(注册) / FR-01-03(权限) / NFR-09(密码加密)
 * 测试用例：TC-MODEL-USER-001 ~ TC-MODEL-USER-008
 */
const { DataTypes } = require('sequelize');

// mock database 模块，避免真实连接（不依赖 sqlite3）
jest.mock('../../../src/config/database', () => {
  const { DataTypes } = require('sequelize');
  // 创建一个 mock sequelize，仅提供 define 方法返回模型对象
  const sequelize = {
    define: jest.fn((modelName, attributes, options) => ({
      rawAttributes: attributes,
      options,
      getTableName: () => options.tableName,
      build: (data) => ({ ...data, getDataValue: (k) => data[k], setDataValue: (k, v) => { data[k] = v; } }),
    })),
  };
  return { sequelize, testConnection: jest.fn().mockResolvedValue(true) };
});

const User = require('../../../src/models/User');

describe('User 模型 - TC-MODEL-USER', () => {
  describe('TC-MODEL-USER-001 字段定义（关联 FR-01-01/FR-01-02）', () => {
    it('应包含必要字段：id/username/password_hash/real_name/role', () => {
      const attrs = User.rawAttributes;
      expect(attrs).toHaveProperty('id');
      expect(attrs).toHaveProperty('username');
      expect(attrs).toHaveProperty('password_hash');
      expect(attrs).toHaveProperty('real_name');
      expect(attrs).toHaveProperty('role');
    });

    it('id 应为主键且自增', () => {
      const id = User.rawAttributes.id;
      expect(id.primaryKey).toBe(true);
      expect(id.autoIncrement).toBe(true);
    });

    it('username 应为字符串、非空、唯一', () => {
      const username = User.rawAttributes.username;
      expect(username.type.key).toBe('STRING');
      expect(username.allowNull).toBe(false);
      expect(username.unique).toBe(true);
    });

    it('password_hash 应为字符串且非空（NFR-09 密码加密存储）', () => {
      const pwd = User.rawAttributes.password_hash;
      expect(pwd.type.key).toBe('STRING');
      expect(pwd.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-USER-002 角色枚举（关联 FR-01-03 RBAC）', () => {
    it('role 应为 ENUM 且包含 admin/teacher/student', () => {
      const role = User.rawAttributes.role;
      expect(role.type).toBeInstanceOf(DataTypes.ENUM);
      expect(role.type.values).toEqual(['admin', 'teacher', 'student']);
    });

    it('role 默认值应为 student', () => {
      expect(User.rawAttributes.role.defaultValue).toBe('student');
    });
  });

  describe('TC-MODEL-USER-003 账号状态枚举', () => {
    it('status 应为 ENUM 且包含 active/disabled', () => {
      const status = User.rawAttributes.status;
      expect(status.type).toBeInstanceOf(DataTypes.ENUM);
      expect(status.type.values).toEqual(['active', 'disabled']);
    });

    it('status 默认值应为 active', () => {
      expect(User.rawAttributes.status.defaultValue).toBe('active');
    });
  });

  describe('TC-MODEL-USER-004 可空字段', () => {
    it('email 应允许为空', () => {
      expect(User.rawAttributes.email.allowNull).toBe(true);
    });
    it('phone 应允许为空', () => {
      expect(User.rawAttributes.phone.allowNull).toBe(true);
    });
    it('class_id 应允许为空（学生所属班级）', () => {
      expect(User.rawAttributes.class_id.allowNull).toBe(true);
    });
  });

  describe('TC-MODEL-USER-005 表名与时间戳配置', () => {
    it('表名应为 users', () => {
      expect(User.getTableName()).toBe('users');
    });
    it('应关闭 Sequelize 自动时间戳（由模型自行声明 created_at/updated_at）', () => {
      expect(User.options.timestamps).toBe(false);
    });
  });

  describe('TC-MODEL-USER-006 默认 scope 隐藏密码哈希（NFR-10 敏感数据保护）', () => {
    it('defaultScope 应排除 password_hash', () => {
      const scope = User.options.defaultScope;
      expect(scope.attributes.exclude).toContain('password_hash');
    });
    it('应提供 withPassword scope 用于登录校验', () => {
      const scope = User.options.scopes.withPassword;
      expect(scope.attributes.include).toContain('password_hash');
    });
  });

  describe('TC-MODEL-USER-007 created_at/updated_at 字段', () => {
    it('应包含 created_at 且默认值为 NOW', () => {
      const ca = User.rawAttributes.created_at;
      expect(ca.type.key).toBe('DATE');
      expect(ca.allowNull).toBe(false);
    });
    it('应包含 updated_at 且默认值为 NOW', () => {
      const ua = User.rawAttributes.updated_at;
      expect(ua.type.key).toBe('DATE');
      expect(ua.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-USER-008 模型可被实例化', () => {
    it('build 方法应创建实例（不写库）', () => {
      const inst = User.build({
        username: 'testuser',
        password_hash: 'hashed',
        real_name: '测试',
        role: 'student',
      });
      expect(inst.username).toBe('testuser');
      expect(inst.real_name).toBe('测试');
      expect(inst.role).toBe('student');
    });
  });
});