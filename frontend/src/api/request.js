import axios from 'axios';
import { message } from 'antd';
import { STORAGE_KEYS, API_CODE } from '@/utils/constants';

/**
 * Axios 实例封装
 * - 请求拦截器：自动注入 JWT Token
 * - 响应拦截器：统一处理业务错误码、401 跳登录
 * - 统一响应格式：{ code, message, data }
 */

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：注入 JWT Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 二进制响应（文件下载）直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }
    // 统一响应格式 { code, message, data }
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === API_CODE.SUCCESS) {
        return res;
      }
      // 业务错误
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    // 非标准响应直接返回
    return res;
  },
  (error) => {
    const { response } = error;
    if (!response) {
      message.error('网络异常，请检查网络连接');
      return Promise.reject(error);
    }
    const { status, data } = response;
    const msg = data?.message || '请求失败';
    switch (status) {
      case 401:
        message.error('登录已过期，请重新登录');
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        // 避免在登录页循环跳转
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;
      case 403:
        message.error(msg || '无权限访问');
        break;
      case 404:
        message.error(msg || '资源不存在');
        break;
      case 409:
        message.error(msg || '资源冲突');
        break;
      default:
        message.error(msg || `请求错误(${status})`);
    }
    return Promise.reject(error);
  }
);

export default request;