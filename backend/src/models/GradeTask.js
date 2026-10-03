/**
 * 阅卷任务模型 grade_tasks
 * 状态：pending-待阅卷 ongoing-阅卷中 finished-已完成
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GradeTask = sequelize.define(
  'GradeTask',
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
    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '阅卷教师ID',
    },
    status: {
      type: DataTypes.ENUM('pending', 'ongoing', 'finished'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态',
    },
    total_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '待阅卷答卷总数',
    },
    graded_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已阅卷答卷数',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'grade_tasks',
    timestamps: false,
  }
);

module.exports = GradeTask;