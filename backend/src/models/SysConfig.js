/**
 * 系统配置模型 sys_config
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SysConfig = sequelize.define(
  'SysConfig',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '配置键',
    },
    config_value: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '配置值',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '配置说明',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'sys_config',
    timestamps: false,
  }
);

module.exports = SysConfig;