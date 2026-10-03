/**
 * 答题记录模型 answers（每题作答）
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Answer = sequelize.define(
  'Answer',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    exam_record_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    student_answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '学生答案',
    },
    score: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: true,
      comment: '本题得分',
    },
    is_correct: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      comment: '是否正确：0-错 1-对 NULL-未评',
      get() {
        const val = this.getDataValue('is_correct');
        if (val === null || val === undefined) return null;
        return val === 1 || val === true;
      },
      set(val) {
        if (val === null || val === undefined) {
          this.setDataValue('is_correct', null);
        } else {
          this.setDataValue('is_correct', val ? 1 : 0);
        }
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '教师评语（主观题）',
    },
    graded_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '阅卷人ID',
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅卷时间',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'answers',
    timestamps: false,
  }
);

module.exports = Answer;