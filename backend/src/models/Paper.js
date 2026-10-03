/**
 * 试卷模型 papers
 * 软删除：deleted_at
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Paper = sequelize.define(
  'Paper',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '试卷名称',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '试卷描述',
    },
    total_score: {
      type: DataTypes.DECIMAL(6, 1),
      allowNull: false,
      defaultValue: 100.0,
      comment: '总分',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: '考试时长（分钟）',
    },
    pass_score: {
      type: DataTypes.DECIMAL(6, 1),
      allowNull: false,
      defaultValue: 60.0,
      comment: '及格分数',
    },
    is_random_order: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
      comment: '是否乱序出题',
      get() {
        const val = this.getDataValue('is_random_order');
        return val === 1 || val === true;
      },
      set(val) {
        this.setDataValue('is_random_order', val ? 1 : 0);
      },
    },
    creator_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '创建人ID（教师）',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态',
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
    tableName: 'papers',
    timestamps: false,
    defaultScope: {
      where: { deleted_at: null },
    },
    scopes: {
      withDeleted: {},
    },
  }
);

module.exports = Paper;