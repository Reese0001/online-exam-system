/**
 * 题目模型单元测试
 * 关联需求：FR-02-01(题目新增) / FR-02-04(题目查询) / FR-02-08(知识点难度分类)
 * 测试用例：TC-MODEL-Q-001 ~ TC-MODEL-Q-007
 */
const { DataTypes } = require('sequelize');

jest.mock('../../../src/config/database', () => {
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

const Question = require('../../../src/models/Question');

describe('Question 模型 - TC-MODEL-Q', () => {
  describe('TC-MODEL-Q-001 字段定义（关联 FR-02-01）', () => {
    it('应包含必要字段：id/type/content/answer/difficulty/creator_id', () => {
      const attrs = Question.rawAttributes;
      ['id', 'type', 'content', 'answer', 'difficulty', 'creator_id'].forEach(k => {
        expect(attrs).toHaveProperty(k);
      });
    });

    it('content 应为 TEXT 且非空', () => {
      const c = Question.rawAttributes.content;
      expect(c.type.key).toBe('TEXT');
      expect(c.allowNull).toBe(false);
    });

    it('answer 应为 TEXT 且非空（标准答案必填）', () => {
      const a = Question.rawAttributes.answer;
      expect(a.type.key).toBe('TEXT');
      expect(a.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-Q-002 题型枚举（5种题型）', () => {
    it('type 应为 ENUM 且包含 single/multiple/judge/fill/short', () => {
      const t = Question.rawAttributes.type;
      expect(t.type).toBeInstanceOf(DataTypes.ENUM);
      expect(t.type.values).toEqual(['single', 'multiple', 'judge', 'fill', 'short']);
    });

    it('type 应非空', () => {
      expect(Question.rawAttributes.type.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-Q-003 选项 JSON 字段（关联 FR-02-01 选项列表）', () => {
    it('options 应为 JSON 类型且允许为空（填空/简答无选项）', () => {
      const o = Question.rawAttributes.options;
      expect(o.type.key).toBe('JSON');
      expect(o.allowNull).toBe(true);
    });
  });

  describe('TC-MODEL-Q-004 难度范围验证（关联 FR-02-08）', () => {
    it('difficulty 应为 TINYINT 且默认值 3', () => {
      const d = Question.rawAttributes.difficulty;
      expect(d.type.key).toBe('TINYINT');
      expect(d.defaultValue).toBe(3);
    });

    it('difficulty 应有 min:1 max:5 校验', () => {
      const d = Question.rawAttributes.difficulty;
      expect(d.validate).toBeDefined();
      expect(d.validate.min).toBe(1);
      expect(d.validate.max).toBe(5);
    });
  });

  describe('TC-MODEL-Q-005 默认分值', () => {
    it('score 应为 DECIMAL(5,1) 且默认 2.0', () => {
      const s = Question.rawAttributes.score;
      expect(s.type.key).toBe('DECIMAL');
      expect(parseFloat(s.defaultValue)).toBe(2.0);
    });
  });

  describe('TC-MODEL-Q-006 软删除字段（关联 FR-02-03 删除）', () => {
    it('应包含 deleted_at 字段且允许为空', () => {
      const da = Question.rawAttributes.deleted_at;
      expect(da).toBeDefined();
      expect(da.allowNull).toBe(true);
    });

    it('defaultScope 应过滤 deleted_at = null', () => {
      const scope = Question.options.defaultScope;
      expect(scope.where).toEqual({ deleted_at: null });
    });
  });

  describe('TC-MODEL-Q-007 表名与创建人', () => {
    it('表名应为 questions', () => {
      expect(Question.getTableName()).toBe('questions');
    });
    it('creator_id 应非空（题目必须由教师创建）', () => {
      expect(Question.rawAttributes.creator_id.allowNull).toBe(false);
    });
  });
});