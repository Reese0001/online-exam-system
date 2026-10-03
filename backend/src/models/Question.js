/**
 * 题目模型 questions
 * 题型：single-单选 multiple-多选 judge-判断 fill-填空 short-简答
 * 软删除：deleted_at
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define(
  'Question',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    type: {
      type: DataTypes.ENUM('single', 'multiple', 'judge', 'fill', 'short'),
      allowNull: false,
      comment: '题型',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '题干内容',
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '选项列表（JSON，选择题用）',
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '标准答案',
    },
    analysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '答案解析',
    },
    difficulty: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
      comment: '难度等级1-5',
    },
    knowledge_point: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '知识点',
    },
    score: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 2.0,
      comment: '默认分值',
    },
    creator_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '创建人ID（教师）',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '软删除时间',
    },
  },
  {
    tableName: 'questions',
    timestamps: false,
    // 软删除通过 paranoid 不开启（DDL 用 deleted_at 手动管理），这里仅提供默认 scope
    defaultScope: {
      where: { deleted_at: null },
    },
    scopes: {
      withDeleted: {},
      onlyDeleted: { where: { deleted_at: { [require('sequelize').Op.ne]: null } } },
    },
  }
);

module.exports = Question;