/**
 * 考试记录模型 exam_records（学生答卷主表）
 * 状态：not_started-未开始 ongoing-答题中 submitted-已交卷 graded-已阅卷
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamRecord = sequelize.define(
  'ExamRecord',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    exam_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始答题时间',
    },
    submit_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '交卷时间',
    },
    status: {
      type: DataTypes.ENUM('not_started', 'ongoing', 'submitted', 'graded'),
      allowNull: false,
      defaultValue: 'not_started',
      comment: '状态',
    },
    total_score: {
      type: DataTypes.DECIMAL(6, 1),
      allowNull: true,
      comment: '总得分',
    },
    // 防作弊：切屏次数（前端上报，后端记录）
    switch_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '切屏次数（防作弊）',
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
  },
  {
    tableName: 'exam_records',
    timestamps: false,
  }
);

module.exports = ExamRecord;