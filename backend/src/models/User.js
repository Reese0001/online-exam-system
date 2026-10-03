/**
 * 用户模型 users
 * 角色：admin-管理员 teacher-教师 student-学生
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '主键ID',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名（登录账号）',
    },
    password_hash: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '密码哈希（bcrypt加密）',
    },
    real_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '真实姓名',
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher', 'student'),
      allowNull: false,
      defaultValue: 'student',
      comment: '角色',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号',
    },
    class_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '所属班级ID（学生）',
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
      comment: '账号状态',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    // 默认查询不返回密码哈希
    defaultScope: {
      attributes: { exclude: ['password_hash'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] },
      },
    },
  }
);

module.exports = User;