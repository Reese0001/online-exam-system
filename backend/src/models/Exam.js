/**
 * 考试模型 exams
 * 状态机：draft→published→ongoing→finished
 * 软删除：deleted_at
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Exam = sequelize.define(
  'Exam',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    paper_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '试卷ID',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '考试名称',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '考试开始时间',
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '考试结束时间',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'ongoing', 'finished'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态',
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
    tableName: 'exams',
    timestamps: false,
    defaultScope: {
      where: { deleted_at: null },
    },
    scopes: {
      withDeleted: {},
    },
  }
);

module.exports = Exam;