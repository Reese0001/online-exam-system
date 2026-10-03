/**
 * 考试班级关联模型 exam_classes
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamClass = sequelize.define(
  'ExamClass',
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
    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: 'exam_classes',
    timestamps: false,
  }
);

module.exports = ExamClass;