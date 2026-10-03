/**
 * 试卷模型单元测试
 * 关联需求：FR-03-01(手动组卷) / FR-03-03(试卷设置) / FR-03-06(试卷删除)
 * 测试用例：TC-MODEL-PAPER-001 ~ TC-MODEL-PAPER-006
 */
const { DataTypes } = require('sequelize');

jest.mock('../../../src/config/database', () => {
  const sequelize = {
    define: jest.fn((modelName, attributes, options) => ({
      rawAttributes: attributes,
      options,
      getTableName: () => options.tableName,
      build: (data) => ({
        ...data,
        getDataValue: (k) => data[k],
        setDataValue: (k, v) => { data[k] = v; },
        // 支持 is_random_order 的 getter/setter
        get is_random_order() {
          const val = data.is_random_order;
          return val === 1 || val === true;
        },
        set is_random_order(v) {
          data.is_random_order = v ? 1 : 0;
        },
      }),
    })),
  };
  return { sequelize, testConnection: jest.fn().mockResolvedValue(true) };
});

const Paper = require('../../../src/models/Paper');

describe('Paper 模型 - TC-MODEL-PAPER', () => {
  describe('TC-MODEL-PAPER-001 字段定义（关联 FR-03-03 试卷设置）', () => {
    it('应包含 name/total_score/duration/pass_score 字段', () => {
      const attrs = Paper.rawAttributes;
      ['name', 'total_score', 'duration', 'pass_score'].forEach(k => {
        expect(attrs).toHaveProperty(k);
      });
    });

    it('name 应为字符串且非空', () => {
      const n = Paper.rawAttributes.name;
      expect(n.type.key).toBe('STRING');
      expect(n.allowNull).toBe(false);
    });

    it('total_score 默认值应为 100.0', () => {
      expect(parseFloat(Paper.rawAttributes.total_score.defaultValue)).toBe(100.0);
    });

    it('duration 默认值应为 60 分钟', () => {
      expect(Paper.rawAttributes.duration.defaultValue).toBe(60);
    });

    it('pass_score 默认值应为 60.0', () => {
      expect(parseFloat(Paper.rawAttributes.pass_score.defaultValue)).toBe(60.0);
    });
  });

  describe('TC-MODEL-PAPER-002 乱序出题 getter/setter（关联 FR-03-03）', () => {
    it('is_random_order 应有自定义 getter 返回布尔值', () => {
      const attr = Paper.rawAttributes.is_random_order;
      expect(typeof attr.get).toBe('function');
    });

    it('getter 应将 1 转为 true', () => {
      const inst = Paper.build({ name: 't', creator_id: 1, is_random_order: 1 });
      expect(inst.is_random_order).toBe(true);
    });

    it('getter 应将 0 转为 false', () => {
      const inst = Paper.build({ name: 't', creator_id: 1, is_random_order: 0 });
      expect(inst.is_random_order).toBe(false);
    });

    it('setter 应将 true 转为 1', () => {
      const inst = Paper.build({ name: 't', creator_id: 1 });
      inst.is_random_order = true;
      expect(inst.getDataValue('is_random_order')).toBe(1);
    });
  });

  describe('TC-MODEL-PAPER-003 试卷状态枚举', () => {
    it('status 应为 ENUM 且包含 draft/published', () => {
      const s = Paper.rawAttributes.status;
      expect(s.type).toBeInstanceOf(DataTypes.ENUM);
      expect(s.type.values).toEqual(['draft', 'published']);
    });

    it('status 默认值应为 draft', () => {
      expect(Paper.rawAttributes.status.defaultValue).toBe('draft');
    });
  });

  describe('TC-MODEL-PAPER-004 软删除（关联 FR-03-06）', () => {
    it('应包含 deleted_at 字段', () => {
      expect(Paper.rawAttributes.deleted_at).toBeDefined();
    });
    it('defaultScope 应过滤已删除', () => {
      expect(Paper.options.defaultScope.where).toEqual({ deleted_at: null });
    });
  });

  describe('TC-MODEL-PAPER-005 表名与创建人', () => {
    it('表名应为 papers', () => {
      expect(Paper.getTableName()).toBe('papers');
    });
    it('creator_id 应非空', () => {
      expect(Paper.rawAttributes.creator_id.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-PAPER-006 description 可空', () => {
    it('description 应为 TEXT 且允许为空', () => {
      const d = Paper.rawAttributes.description;
      expect(d.type.key).toBe('TEXT');
      expect(d.allowNull).toBe(true);
    });
  });
});