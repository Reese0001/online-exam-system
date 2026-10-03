/**
 * 考试模型单元测试
 * 关联需求：FR-04-01(发布考试) / FR-04-02(考试时间) / FR-04-04(状态管理) / FR-04-07(删除)
 * 测试用例：TC-MODEL-EXAM-001 ~ TC-MODEL-EXAM-005
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

const Exam = require('../../../src/models/Exam');

describe('Exam 模型 - TC-MODEL-EXAM', () => {
  describe('TC-MODEL-EXAM-001 字段定义（关联 FR-04-01/FR-04-02）', () => {
    it('应包含 paper_id/name/start_time/end_time/status 字段', () => {
      const attrs = Exam.rawAttributes;
      ['paper_id', 'name', 'start_time', 'end_time', 'status'].forEach(k => {
        expect(attrs).toHaveProperty(k);
      });
    });

    it('paper_id 应非空（考试必须关联试卷）', () => {
      expect(Exam.rawAttributes.paper_id.allowNull).toBe(false);
    });

    it('name 应为字符串且非空', () => {
      const n = Exam.rawAttributes.name;
      expect(n.type).toBeInstanceOf(DataTypes.STRING);
      expect(n.allowNull).toBe(false);
    });

    it('start_time/end_time 应为 DATE 且非空', () => {
      expect(Exam.rawAttributes.start_time.type.key).toBe('DATE');
      expect(Exam.rawAttributes.start_time.allowNull).toBe(false);
      expect(Exam.rawAttributes.end_time.type.key).toBe('DATE');
      expect(Exam.rawAttributes.end_time.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-EXAM-002 考试状态机（关联 FR-04-04）', () => {
    it('status 应为 ENUM 且包含 draft/published/ongoing/finished', () => {
      const s = Exam.rawAttributes.status;
      expect(s.type).toBeInstanceOf(DataTypes.ENUM);
      expect(s.type.values).toEqual(['draft', 'published', 'ongoing', 'finished']);
    });

    it('status 默认值应为 draft', () => {
      expect(Exam.rawAttributes.status.defaultValue).toBe('draft');
    });
  });

  describe('TC-MODEL-EXAM-003 软删除（关联 FR-04-07）', () => {
    it('应包含 deleted_at 字段', () => {
      expect(Exam.rawAttributes.deleted_at).toBeDefined();
    });
    it('defaultScope 应过滤已删除', () => {
      expect(Exam.options.defaultScope.where).toEqual({ deleted_at: null });
    });
  });

  describe('TC-MODEL-EXAM-004 表名与创建人', () => {
    it('表名应为 exams', () => {
      expect(Exam.getTableName()).toBe('exams');
    });
    it('creator_id 应非空', () => {
      expect(Exam.rawAttributes.creator_id.allowNull).toBe(false);
    });
  });

  describe('TC-MODEL-EXAM-005 时间戳字段', () => {
    it('应包含 created_at/updated_at', () => {
      expect(Exam.rawAttributes.created_at).toBeDefined();
      expect(Exam.rawAttributes.updated_at).toBeDefined();
    });
    it('应关闭自动时间戳', () => {
      expect(Exam.options.timestamps).toBe(false);
    });
  });
});