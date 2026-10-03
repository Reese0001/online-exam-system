import request from './request';

/**
 * 用户管理 API（管理员）
 * 对应 api-contract.yaml: /api/users/*
 */

// 用户列表查询
export const getUserList = (params) => request.get('/users', { params });

// 创建用户
export const createUser = (data) => request.post('/users', data);

// 用户详情
export const getUserDetail = (id) => request.get(`/users/${id}`);

// 修改用户
export const updateUser = (id, data) => request.put(`/users/${id}`, data);

// 删除用户
export const deleteUser = (id) => request.delete(`/users/${id}`);

// 重置用户密码
export const resetPassword = (id, data) =>
  request.post(`/users/${id}/reset-password`, data);

/**
 * 班级管理 API（管理员）
 * 对应 api-contract.yaml: /api/classes/*
 */

// 班级列表查询
export const getClassList = (params) => request.get('/classes', { params });

// 创建班级
export const createClass = (data) => request.post('/classes', data);

// 修改班级
export const updateClass = (id, data) => request.put(`/classes/${id}`, data);

// 删除班级
export const deleteClass = (id) => request.delete(`/classes/${id}`);

// 查询班级下学生列表
export const getClassStudents = (id) =>
  request.get(`/classes/${id}/students`);