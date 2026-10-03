import request from './request';

/**
 * 认证模块 API
 * 对应 api-contract.yaml: /api/auth/*
 */

// 用户登录
export const login = (data) => request.post('/auth/login', data);

// 用户注册
export const register = (data) => request.post('/auth/register', data);

// 获取当前用户信息
export const getProfile = () => request.get('/auth/profile');

// 修改个人信息
export const updateProfile = (data) => request.put('/auth/profile', data);

// 修改密码
export const updatePassword = (data) =>
  request.put('/auth/password', data);