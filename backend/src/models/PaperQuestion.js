/**
 * 试卷题目关联模型 paper_questions
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaperQuestion = sequelize.define(
  'PaperQuestion',
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
    question_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '题目ID',
    },
    score: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
      comment: '本题分值',
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '题目排序序号',
    },
  },
  {
    tableName: 'paper_questions',
    timestamps: false,
  }
);

module.exports = PaperQuestion;