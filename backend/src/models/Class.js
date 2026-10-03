/**
 * 班级模型 classes
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define(
  'Class',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '班级名称',
    },
    grade: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '年级',
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '院系',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
  },
  {
    tableName: 'classes',
    timestamps: false,
  }
);

module.exports = Class;